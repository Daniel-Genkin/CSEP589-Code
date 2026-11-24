const DEFAULT_DATA_URL = 'https://data.alpaca.markets'
const DEFAULT_TRADING_URL = 'https://paper-api.alpaca.markets'
const DEFAULT_HOLDINGS_URL = 'https://tickerinside.com/api/v1'
const ASSET_CACHE_TTL_MS = 15 * 60_000
const HOLDINGS_CACHE_TTL_MS = 6 * 60 * 60_000
const PROFILE_CACHE_TTL_MS = 6 * 60 * 60_000
const MAX_SYMBOLS = 100
const PAGE_LIMIT = 10_000
const REQUEST_TIMEOUT_MS = 20_000
const HISTORY_YEARS = 5
const SYMBOL_PATTERN = /^[A-Z0-9.-]{1,15}$/
const MAX_SEARCH_LENGTH = 80
const assetCatalogCache = new WeakMap()
const holdingsCache = new WeakMap()
const profileCache = new WeakMap()

export class MarketDataError extends Error {
  constructor(status, code, message, options = {}) {
    super(message, options)
    this.name = 'MarketDataError'
    this.status = status
    this.code = code
    this.retryAfter = options.retryAfter
  }
}

export function normalizeSymbols(value) {
  const parts = Array.isArray(value) ? value : String(value ?? '').split(',')
  const symbols = [...new Set(parts.map((part) => String(part).trim().toUpperCase()).filter(Boolean))]
  if (!symbols.length) throw new MarketDataError(400, 'symbols_required', 'Provide at least one stock symbol.')
  if (symbols.length > MAX_SYMBOLS) throw new MarketDataError(400, 'too_many_symbols', `Request at most ${MAX_SYMBOLS} symbols at once.`)
  if (symbols.some((symbol) => !SYMBOL_PATTERN.test(symbol))) {
    throw new MarketDataError(400, 'invalid_symbols', 'Symbols may contain only letters, numbers, periods and hyphens.')
  }
  return symbols
}

function isoDate(value) {
  return value.toISOString().slice(0, 10)
}

function defaultHistoryStart(now) {
  const date = new Date(now)
  date.setUTCFullYear(date.getUTCFullYear() - HISTORY_YEARS)
  return isoDate(date)
}

function defaultHistoryEnd(now) {
  const date = new Date(now)
  date.setUTCDate(date.getUTCDate() - 1)
  return isoDate(date)
}

function credentialsFrom(env) {
  const key = env.ALPACA_API_KEY_ID || env.ALPACA_KEY_ID || env.APCA_API_KEY_ID
  const secret = env.ALPACA_API_SECRET_KEY || env.ALPACA_SECRET_KEY || env.APCA_API_SECRET_KEY
  if (!key || !secret) {
    throw new MarketDataError(
      503,
      'alpaca_not_configured',
      'Alpaca market data is not configured. Add the Alpaca API key and secret to the server environment.',
    )
  }
  return { key, secret }
}

function holdingsConfig(env) {
  return {
    holdingsUrl: String(env.TICKERINSIDE_BASE_URL || DEFAULT_HOLDINGS_URL).replace(/\/+$/, ''),
  }
}

function alpacaConfig(env, now) {
  const feed = String(env.ALPACA_DATA_FEED || 'iex').toLowerCase()
  if (!['iex', 'sip', 'boats', 'otc'].includes(feed)) {
    throw new MarketDataError(503, 'alpaca_invalid_config', 'ALPACA_DATA_FEED must be iex, sip, boats, or otc.')
  }
  const historyStart = env.ALPACA_HISTORY_START || defaultHistoryStart(now)
  const historyEnd = env.ALPACA_HISTORY_END || defaultHistoryEnd(now)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(historyStart) || !/^\d{4}-\d{2}-\d{2}$/.test(historyEnd) || historyStart >= historyEnd) {
    throw new MarketDataError(503, 'alpaca_invalid_config', 'Alpaca history dates must use YYYY-MM-DD with start before end.')
  }
  return {
    ...credentialsFrom(env),
    feed,
    historyStart,
    historyEnd,
    dataUrl: String(env.ALPACA_DATA_URL || DEFAULT_DATA_URL).replace(/\/+$/, ''),
    tradingUrl: String(env.ALPACA_TRADING_API_URL || env.ALPACA_API_URL || DEFAULT_TRADING_URL).replace(/\/+$/, ''),
    ...holdingsConfig(env),
  }
}

async function fetchAlpaca(url, config, fetchImpl) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  let response
  try {
    response = await fetchImpl(url, {
      headers: {
        'APCA-API-KEY-ID': config.key,
        'APCA-API-SECRET-KEY': config.secret,
        Accept: 'application/json',
      },
      signal: controller.signal,
    })
  } catch (cause) {
    throw new MarketDataError(502, 'alpaca_unavailable', 'Alpaca market data did not respond. Try again shortly.', { cause })
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    const retryAfter = response.headers.get('retry-after') || undefined
    if (response.status === 401 || response.status === 403) {
      throw new MarketDataError(502, 'alpaca_auth_failed', 'Alpaca rejected the market data credentials.')
    }
    if (response.status === 429) {
      throw new MarketDataError(503, 'alpaca_rate_limited', 'Alpaca temporarily rate-limited market data. Try again shortly.', { retryAfter })
    }
    if (response.status >= 500) {
      throw new MarketDataError(502, 'alpaca_unavailable', 'Alpaca market data is temporarily unavailable.', { retryAfter })
    }
    throw new MarketDataError(502, 'alpaca_request_failed', 'Alpaca could not fulfill this market data request.')
  }

  try {
    return await response.json()
  } catch (cause) {
    throw new MarketDataError(502, 'alpaca_invalid_response', 'Alpaca returned an unreadable market data response.', { cause })
  }
}

async function fetchTickerInside(url, fetchImpl) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  let response
  try {
    response = await fetchImpl(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Outvest/1.0 (+https://github.com/Daniel-Genkin/CSEP589-Code)',
      },
      signal: controller.signal,
    })
  } catch (cause) {
    throw new MarketDataError(502, 'etf_holdings_unavailable', 'TickerInside did not respond. Alpaca quotes remain available.', { cause })
  } finally {
    clearTimeout(timeout)
  }

  let payload
  try {
    payload = await response.json()
  } catch (cause) {
    throw new MarketDataError(502, 'etf_holdings_invalid_response', 'TickerInside returned an unreadable holdings response.', { cause })
  }
  if (response.status === 404) return null
  if (response.status === 429 || response.status === 503) {
    throw new MarketDataError(
      503,
      'etf_holdings_unavailable',
      'TickerInside temporarily could not serve ETF holdings. Alpaca quotes remain available.',
      { retryAfter: response.headers.get('retry-after') || '60' },
    )
  }
  if (!response.ok) {
    throw new MarketDataError(502, 'etf_holdings_request_failed', 'TickerInside could not fulfill this ETF holdings request.')
  }
  return payload
}

function finiteBarClose(bar) {
  return Boolean(bar && typeof bar.t === 'string' && Number.isFinite(bar.c) && bar.c > 0)
}

const securityKind = (name) =>
  /\b(?:ETF|ETN|exchange[\s-]*traded fund|index fund|index trust|fund)\b/i.test(name) ? 'etf' : 'stock'

function assetFromAlpaca(asset) {
  return {
    ticker: String(asset.symbol).toUpperCase(),
    name: String(asset.name),
    exchange: String(asset.exchange),
    assetClass: String(asset.class),
    kind: securityKind(String(asset.name)),
    tradable: Boolean(asset.tradable),
    fractionable: Boolean(asset.fractionable),
  }
}

async function fetchAssetCatalog(config, fetchImpl) {
  let byUrl = assetCatalogCache.get(fetchImpl)
  if (!byUrl) {
    byUrl = new Map()
    assetCatalogCache.set(fetchImpl, byUrl)
  }
  const cached = byUrl.get(config.tradingUrl)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  const url = new URL(`${config.tradingUrl}/v2/assets`)
  url.search = new URLSearchParams({ status: 'active', asset_class: 'us_equity' }).toString()
  const payload = await fetchAlpaca(url, config, fetchImpl)
  if (!Array.isArray(payload)) throw new MarketDataError(502, 'alpaca_invalid_assets', 'Alpaca returned an unreadable asset catalog.')
  const assets = payload
    .filter(
      (asset) =>
        asset &&
        asset.status === 'active' &&
        asset.class === 'us_equity' &&
        SYMBOL_PATTERN.test(String(asset.symbol).toUpperCase()) &&
        typeof asset.name === 'string' &&
        asset.name.trim(),
    )
    .map(assetFromAlpaca)
    .sort((a, b) => a.ticker.localeCompare(b.ticker))
  if (!assets.length) throw new MarketDataError(502, 'alpaca_empty_assets', 'Alpaca returned no active US equity assets.')
  byUrl.set(config.tradingUrl, { value: assets, expiresAt: Date.now() + ASSET_CACHE_TTL_MS })
  return assets
}

function searchAssets(assets, query, limit) {
  const q = String(query).trim().toLowerCase()
  if (!q) throw new MarketDataError(400, 'query_required', 'Provide a ticker or company name to search.')
  if (q.length > MAX_SEARCH_LENGTH) throw new MarketDataError(400, 'query_too_long', `Search queries are limited to ${MAX_SEARCH_LENGTH} characters.`)
  const rank = (asset) => {
    const ticker = asset.ticker.toLowerCase()
    const name = asset.name.toLowerCase()
    if (ticker === q) return 0
    if (ticker.startsWith(q)) return 1
    if (name.startsWith(q)) return 2
    if (name.split(/[\s.,&-]+/).some((word) => word.startsWith(q))) return 3
    return name.includes(q) ? 4 : -1
  }
  return assets
    .map((asset, order) => ({ asset, order, rank: rank(asset) }))
    .filter((item) => item.rank >= 0)
    .sort((a, b) => a.rank - b.rank || a.order - b.order)
    .slice(0, limit)
    .map((item) => item.asset)
}

export async function fetchAssets(symbols, query, config, fetchImpl = fetch, limit = 8) {
  const assets = await fetchAssetCatalog(config, fetchImpl)
  if (query !== null && query !== undefined) {
    return { source: 'alpaca', assets: searchAssets(assets, query, Math.min(Math.max(Number(limit) || 8, 1), 20)) }
  }
  const wanted = new Set(symbols)
  return { source: 'alpaca', assets: assets.filter((asset) => wanted.has(asset.ticker)) }
}

export async function fetchSecurityProfiles(config, fetchImpl = fetch) {
  let byUrl = profileCache.get(fetchImpl)
  if (!byUrl) {
    byUrl = new Map()
    profileCache.set(fetchImpl, byUrl)
  }
  const cached = byUrl.get(config.holdingsUrl)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  const payload = await fetchTickerInside(new URL(`${config.holdingsUrl}/ownership-index.json`), fetchImpl)
  if (!payload || !Array.isArray(payload.stocks)) {
    throw new MarketDataError(502, 'security_profiles_invalid', 'TickerInside returned an unreadable security profile index.')
  }
  const profiles = payload.stocks
    .map((row) => {
      const ticker = String(row?.[0] || '').toUpperCase()
      const name = String(row?.[1] || ticker)
      const sector = typeof row?.[2] === 'string' ? row[2].trim() : ''
      if (!SYMBOL_PATTERN.test(ticker) || !sector) return null
      return { ticker, name, sector, sourceUrl: `https://tickerinside.com/stock/${ticker.toLowerCase()}/`, asOf: payload.as_of || null }
    })
    .filter(Boolean)
  const result = { source: 'tickerinside', asOf: payload.as_of || null, profiles }
  byUrl.set(config.holdingsUrl, { value: result, expiresAt: Date.now() + PROFILE_CACHE_TTL_MS })
  return result
}

export async function fetchFundHoldings(symbol, config, fetchImpl = fetch) {
  let byAddress = holdingsCache.get(fetchImpl)
  if (!byAddress) {
    byAddress = new Map()
    holdingsCache.set(fetchImpl, byAddress)
  }
  const cacheKey = `${config.holdingsUrl}|${symbol}`
  const cached = byAddress.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  const url = new URL(`${config.holdingsUrl}/fund/${encodeURIComponent(symbol.toLowerCase())}.json`)
  const payload = await fetchTickerInside(url, fetchImpl)
  if (!payload) {
    byAddress.set(cacheKey, { value: null, expiresAt: Date.now() + HOLDINGS_CACHE_TTL_MS })
    return null
  }
  if (!payload.holdings || typeof payload.holdings !== 'object' || Array.isArray(payload.holdings)) {
    throw new MarketDataError(502, 'etf_holdings_invalid_response', `TickerInside returned no holdings map for ${symbol}.`)
  }

  const holdings = Object.entries(payload.holdings)
    .map(([ticker, percent]) => ({ ticker: String(ticker).toUpperCase(), weight: Number(percent) / 100 }))
    .filter((holding) => SYMBOL_PATTERN.test(holding.ticker) && Number.isFinite(holding.weight) && holding.weight >= 0)
    .sort((a, b) => b.weight - a.weight || a.ticker.localeCompare(b.ticker))
  if (!holdings.length) {
    byAddress.set(cacheKey, { value: null, expiresAt: Date.now() + HOLDINGS_CACHE_TTL_MS })
    return null
  }
  const sumWeight = holdings.reduce((sum, holding) => sum + holding.weight, 0)
  const listedWeight = Number.isFinite(payload.stock_pct)
    ? Number(payload.stock_pct) / 100
    : Number.isFinite(payload.listed_pct)
      ? Number(payload.listed_pct) / 100
      : sumWeight
  const value = {
    ticker: String(payload.ticker || symbol).toUpperCase(),
    name: String(payload.name || symbol),
    holdingsAsOf: typeof payload.holdings_as_of === 'string' ? payload.holdings_as_of : null,
    sourceLayer: typeof payload.source_layer === 'string' ? payload.source_layer : null,
    positions: Number.isFinite(payload.positions) ? Number(payload.positions) : holdings.length,
    zeroWeightPositions: holdings.filter((holding) => holding.weight === 0).length,
    listedWeight,
    unrepresentedWeight: Math.max(0, 1 - sumWeight),
    unmappedWeight: Number.isFinite(payload.unmapped_pct) ? Number(payload.unmapped_pct) / 100 : Math.max(0, listedWeight - sumWeight),
    citation: String(payload.cite_as || ''),
    pageUrl: typeof payload.page_url === 'string' ? payload.page_url : null,
    sourceUrl: typeof payload.filing_url === 'string' ? payload.filing_url : null,
    license: String(payload.license || 'CC BY 4.0'),
    holdings,
  }
  byAddress.set(cacheKey, { value, expiresAt: Date.now() + HOLDINGS_CACHE_TTL_MS })
  return value
}

export async function fetchMultipleFundHoldings(symbols, config, fetchImpl = fetch) {
  const pairs = await Promise.all(symbols.map(async (symbol) => [symbol, await fetchFundHoldings(symbol, config, fetchImpl)]))
  return { source: 'tickerinside', funds: Object.fromEntries(pairs) }
}

export async function fetchLatestQuotes(symbols, config, fetchImpl = fetch) {
  const url = new URL(`${config.dataUrl}/v2/stocks/bars/latest`)
  url.search = new URLSearchParams({
    symbols: symbols.join(','),
    feed: config.feed,
    currency: 'USD',
  }).toString()
  const payload = await fetchAlpaca(url, config, fetchImpl)
  const prices = {}
  for (const symbol of symbols) {
    const bar = payload?.bars?.[symbol]
    if (!finiteBarClose(bar)) throw new MarketDataError(502, 'alpaca_missing_quote', `Alpaca returned no current price for ${symbol}.`)
    prices[symbol] = { price: bar.c, asOf: bar.t }
  }
  return { source: 'alpaca', feed: config.feed, currency: 'USD', prices }
}

/**
 * Align paginated Alpaca bars to one calendar. A missing session uses the latest prior close,
 * and the aligned window begins when every requested symbol has started trading.
 */
export function aggregateHistory(symbols, barsBySymbol) {
  const series = new Map()
  for (const symbol of symbols) {
    const rows = barsBySymbol[symbol] ?? []
    const values = new Map()
    for (const bar of rows) {
      if (finiteBarClose(bar)) values.set(bar.t.slice(0, 10), bar.c)
    }
    if (!values.size) throw new MarketDataError(502, 'alpaca_missing_history', `Alpaca returned no price history for ${symbol}.`)
    series.set(symbol, new Map([...values].sort(([a], [b]) => a.localeCompare(b))))
  }

  const start = [...series.values()].map((values) => values.keys().next().value).sort().at(-1)
  const dateSet = new Set()
  for (const values of series.values()) for (const date of values.keys()) if (date >= start) dateSet.add(date)
  const dates = [...dateSet].sort()
  if (dates.length < 2) throw new MarketDataError(502, 'alpaca_short_history', 'Alpaca did not return enough history to run the back-test.')

  const closes = {}
  for (const [symbol, values] of series) {
    let previous
    for (const [date, price] of values) {
      if (date <= start) previous = price
      else break
    }
    const aligned = []
    for (const date of dates) {
      const current = values.get(date)
      if (current !== undefined) previous = current
      if (previous === undefined) throw new MarketDataError(502, 'alpaca_incomplete_history', `Alpaca history for ${symbol} is incomplete.`)
      aligned.push(previous)
    }
    closes[symbol] = aligned
  }
  return { dates, closes, benchmark: 'SPY' }
}

export async function fetchHistory(symbols, config, fetchImpl = fetch) {
  const barsBySymbol = Object.fromEntries(symbols.map((symbol) => [symbol, []]))
  const seenPageTokens = new Set()
  let pageToken = null

  do {
    const url = new URL(`${config.dataUrl}/v2/stocks/bars`)
    const search = new URLSearchParams({
      symbols: symbols.join(','),
      timeframe: '1Day',
      start: config.historyStart,
      end: config.historyEnd,
      adjustment: 'all',
      feed: config.feed,
      currency: 'USD',
      limit: String(PAGE_LIMIT),
      sort: 'asc',
    })
    if (pageToken) search.set('page_token', pageToken)
    url.search = search.toString()

    const payload = await fetchAlpaca(url, config, fetchImpl)
    for (const [symbol, bars] of Object.entries(payload?.bars ?? {})) {
      if (Array.isArray(bars) && barsBySymbol[symbol]) barsBySymbol[symbol].push(...bars)
    }
    pageToken = payload?.next_page_token || null
    if (pageToken && seenPageTokens.has(pageToken)) {
      throw new MarketDataError(502, 'alpaca_pagination_failed', 'Alpaca repeated a history page token.')
    }
    if (pageToken) seenPageTokens.add(pageToken)
  } while (pageToken)

  return {
    source: 'alpaca',
    feed: config.feed,
    timeframe: '1Day',
    adjustment: 'all',
    start: config.historyStart,
    end: config.historyEnd,
    ...aggregateHistory(symbols, barsBySymbol),
  }
}

function responseHeaders(cacheControl) {
  return {
    'Cache-Control': cacheControl,
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
  }
}

export async function handleMarketDataRequest(url, env = process.env, options = {}) {
  const requestUrl = typeof url === 'string' ? new URL(url, 'http://localhost') : url
  const fetchImpl = options.fetchImpl ?? fetch
  const now = options.now ?? new Date()
  try {
    const mode = requestUrl.searchParams.get('mode') || 'latest'
    if (!['assets', 'latest', 'history', 'holdings', 'profiles'].includes(mode)) {
      throw new MarketDataError(400, 'invalid_mode', 'Mode must be assets, latest, history, holdings or profiles.')
    }
    const config = mode === 'profiles' || mode === 'holdings' ? holdingsConfig(env) : alpacaConfig(env, now)
    if (mode === 'profiles') {
      return {
        status: 200,
        headers: responseHeaders('public, max-age=0, s-maxage=21600, stale-while-revalidate=86400'),
        body: await fetchSecurityProfiles(config, fetchImpl),
      }
    }
    if (mode === 'holdings') {
      const symbols = normalizeSymbols(requestUrl.searchParams.get('symbols'))
      if (symbols.length > 10) throw new MarketDataError(400, 'too_many_funds', 'Request at most 10 ETF holdings sets at once.')
      return {
        status: 200,
        headers: responseHeaders('public, max-age=0, s-maxage=21600, stale-while-revalidate=86400'),
        body: await fetchMultipleFundHoldings(symbols, config, fetchImpl),
      }
    }
    if (mode === 'assets') {
      const query = requestUrl.searchParams.get('query')
      const symbols = query !== null ? [] : normalizeSymbols(requestUrl.searchParams.get('symbols'))
      return {
        status: 200,
        headers: responseHeaders('public, max-age=0, s-maxage=900, stale-while-revalidate=86400'),
        body: await fetchAssets(symbols, query, config, fetchImpl, requestUrl.searchParams.get('limit')),
      }
    }
    const symbols = normalizeSymbols(requestUrl.searchParams.get('symbols'))
    if (mode === 'latest') {
      return {
        status: 200,
        headers: responseHeaders('public, max-age=0, s-maxage=15, stale-while-revalidate=60'),
        body: await fetchLatestQuotes(symbols, config, fetchImpl),
      }
    }
    if (mode === 'history') {
      return {
        status: 200,
        headers: responseHeaders('public, max-age=0, s-maxage=900, stale-while-revalidate=86400'),
        body: await fetchHistory(symbols, config, fetchImpl),
      }
    }
    throw new Error('Unhandled market data mode')
  } catch (error) {
    if (error instanceof MarketDataError) {
      const headers = responseHeaders('no-store')
      if (error.retryAfter) headers['Retry-After'] = error.retryAfter
      return { status: error.status, headers, body: { error: { code: error.code, message: error.message } } }
    }
    console.error('Unexpected Alpaca middleware failure:', error instanceof Error ? error.message : error)
    return {
      status: 500,
      headers: responseHeaders('no-store'),
      body: { error: { code: 'market_data_internal_error', message: 'The market data middleware failed unexpectedly.' } },
    }
  }
}
