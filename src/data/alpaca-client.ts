import type { FundConstituents } from '@/types'

export interface LatestPrice {
  price: number
  asOf: string
}

export interface MarketHistory {
  dates: string[]
  closes: Record<string, number[]>
  benchmark: string
}

interface LatestResponse {
  prices: Record<string, LatestPrice>
}

interface HistoryResponse {
  dates: string[]
  closes: Record<string, number[]>
}

export interface AlpacaAsset {
  ticker: string
  name: string
  exchange: string
  assetClass: string
  kind: 'stock' | 'etf'
  tradable: boolean
  fractionable: boolean
}

export interface SecurityProfile {
  ticker: string
  name: string
  sector: string
  sourceUrl: string
  asOf: string | null
}

interface AssetsResponse {
  assets: AlpacaAsset[]
}

interface HoldingsResponse {
  funds: Record<string, FundConstituents | null>
}

interface ProfilesResponse {
  profiles: SecurityProfile[]
}

interface Pending<T> {
  resolve: (value: T) => void
  reject: (error: Error) => void
}

export interface MarketDataReader {
  searchAssets(query: string, limit?: number): Promise<AlpacaAsset[]>
  getAssets(symbols: string[]): Promise<AlpacaAsset[]>
  getFundHoldings(symbol: string): Promise<FundConstituents | null>
  getSecurityProfiles(): Promise<SecurityProfile[]>
  getLatestPrices(symbols: string[]): Promise<Map<string, LatestPrice>>
  getHistory(symbols: string[]): Promise<MarketHistory>
}

export class MarketDataError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    cause?: unknown,
  ) {
    super(message, { cause })
    this.name = 'MarketDataError'
  }
}
const uniqueSymbols = (symbols: string[]) => [...new Set(symbols.map((symbol) => symbol.trim().toUpperCase()).filter(Boolean))]
const isLatestPrice = (value: LatestPrice | undefined): value is LatestPrice =>
  Boolean(value && Number.isFinite(value.price) && value.price > 0 && typeof value.asOf === 'string')

export interface AlpacaMarketDataClientOptions {
  endpoint?: string
  fetchImpl?: typeof fetch
  latestTtlMs?: number
  historyTtlMs?: number
}

/**
 * Browser client for the same-origin middleware. Calls are batched in the same turn so one
 * portfolio scan and its concurrent back-test variants share the corresponding Alpaca request.
 */
export class AlpacaMarketDataClient implements MarketDataReader {
  private readonly endpoint: string
  private readonly fetchImpl: typeof fetch
  private readonly latestTtlMs: number
  private readonly historyTtlMs: number
  private readonly latestCache = new Map<string, { value: LatestPrice; expiresAt: number }>()
  private readonly historyBatchCache = new Map<string, { value: MarketHistory; expiresAt: number }>()
  private readonly fundHoldingsCache = new Map<string, { value: FundConstituents | null; expiresAt: number }>()
  private securityProfiles: Promise<SecurityProfile[]> | null = null
  private readonly latestWaiting = new Map<string, Pending<LatestPrice>[]>()
  private readonly historyWaiting = new Map<string, Pending<Map<string, number>>[]>()
  private latestFlushQueued = false
  private historyFlushQueued = false

  constructor(options: AlpacaMarketDataClientOptions = {}) {
    this.endpoint = options.endpoint ?? import.meta.env.VITE_MARKET_DATA_ENDPOINT ?? '/api/market-data'
    this.fetchImpl = options.fetchImpl ?? ((input, init) => fetch(input, init))
    this.latestTtlMs = options.latestTtlMs ?? 30_000
    this.historyTtlMs = options.historyTtlMs ?? 15 * 60_000
  }

  async getLatestPrices(symbols: string[]): Promise<Map<string, LatestPrice>> {
    const wanted = uniqueSymbols(symbols)
    const prices = await Promise.all(wanted.map((symbol) => this.loadLatest(symbol)))
    return new Map(wanted.map((symbol, index) => [symbol, prices[index]]))
  }

  async getAssets(symbols: string[]): Promise<AlpacaAsset[]> {
    const wanted = uniqueSymbols(symbols)
    if (!wanted.length) return []
    const chunks: string[][] = []
    for (let index = 0; index < wanted.length; index += 100) chunks.push(wanted.slice(index, index + 100))
    const responses = await Promise.all(chunks.map((chunk) => this.request<AssetsResponse>('assets', chunk)))
    return responses.flatMap((response) => response.assets)
  }

  async searchAssets(query: string, limit = 8): Promise<AlpacaAsset[]> {
    const trimmed = query.trim()
    if (!trimmed) return []
    return (await this.request<AssetsResponse>('assets', [], trimmed, limit)).assets
  }

  async getFundHoldings(symbol: string): Promise<FundConstituents | null> {
    const ticker = symbol.trim().toUpperCase()
    if (!ticker) return null
    const cached = this.fundHoldingsCache.get(ticker)
    if (cached && cached.expiresAt > Date.now()) return cached.value
    const response = await this.request<HoldingsResponse>('holdings', [ticker])
    const value = response.funds[ticker]
    if (value === undefined) throw new Error(`The holdings middleware omitted ${ticker}.`)
    this.fundHoldingsCache.set(ticker, { value, expiresAt: Date.now() + 6 * 60 * 60_000 })
    return value
  }

  getSecurityProfiles(): Promise<SecurityProfile[]> {
    this.securityProfiles ??= this.request<ProfilesResponse>('profiles', []).then((response) => response.profiles)
    return this.securityProfiles
  }

  async getHistory(symbols: string[]): Promise<MarketHistory> {
    const wanted = uniqueSymbols(symbols)
    const cacheKey = wanted.join(',')
    const cached = this.historyBatchCache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) return cached.value
    const values = await Promise.all(wanted.map((symbol) => this.loadHistory(symbol)))
    const history = this.alignHistory(wanted, values)
    this.historyBatchCache.set(cacheKey, { value: history, expiresAt: Date.now() + this.historyTtlMs })
    return history
  }

  private loadLatest(symbol: string): Promise<LatestPrice> {
    const cached = this.latestCache.get(symbol)
    if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.value)
    const waiting = this.latestWaiting.get(symbol)
    if (waiting) return new Promise((resolve, reject) => waiting.push({ resolve, reject }))
    return new Promise((resolve, reject) => {
      this.latestWaiting.set(symbol, [{ resolve, reject }])
      if (!this.latestFlushQueued) {
        this.latestFlushQueued = true
        queueMicrotask(() => void this.flushLatest())
      }
    })
  }

  private loadHistory(symbol: string): Promise<Map<string, number>> {
    const waiting = this.historyWaiting.get(symbol)
    if (waiting) return new Promise((resolve, reject) => waiting.push({ resolve, reject }))
    return new Promise((resolve, reject) => {
      this.historyWaiting.set(symbol, [{ resolve, reject }])
      if (!this.historyFlushQueued) {
        this.historyFlushQueued = true
        queueMicrotask(() => void this.flushHistory())
      }
    })
  }

  private async flushLatest() {
    this.latestFlushQueued = false
    const batch = new Map(this.latestWaiting)
    const symbols = [...batch.keys()]
    if (!symbols.length) return
    try {
      const expiresAt = Date.now() + this.latestTtlMs
      const validated = new Map<string, LatestPrice>()
      const chunks: string[][] = []
      for (let index = 0; index < symbols.length; index += 100) chunks.push(symbols.slice(index, index + 100))
      const responses = await Promise.all(chunks.map((chunk) => this.request<LatestResponse>('latest', chunk)))
      for (const response of responses) {
        for (const [symbol, price] of Object.entries(response.prices)) {
          if (!isLatestPrice(price)) throw new Error(`The market data middleware omitted a current price for ${symbol}.`)
          validated.set(symbol, price)
        }
      }
      for (const symbol of symbols) {
        if (!validated.has(symbol)) throw new Error(`The market data middleware omitted a current price for ${symbol}.`)
      }
      for (const symbol of symbols) {
        const price = validated.get(symbol)!
        this.latestCache.set(symbol, { value: price, expiresAt })
        for (const pending of batch.get(symbol) ?? []) pending.resolve(price)
        if (this.latestWaiting.get(symbol) === batch.get(symbol)) this.latestWaiting.delete(symbol)
      }
    } catch (cause) {
      const error = cause instanceof Error ? cause : new Error('The market data request failed.')
      for (const [symbol, pendingList] of batch) {
        for (const pending of pendingList) pending.reject(error)
        if (this.latestWaiting.get(symbol) === pendingList) this.latestWaiting.delete(symbol)
      }
    }
  }

  private async flushHistory() {
    this.historyFlushQueued = false
    const batch = new Map(this.historyWaiting)
    const symbols = [...batch.keys()]
    if (!symbols.length) return
    try {
      const validated = new Map<string, Map<string, number>>()
      const chunks: string[][] = []
      for (let index = 0; index < symbols.length; index += 100) chunks.push(symbols.slice(index, index + 100))
      const responses = await Promise.all(chunks.map((chunk) => this.request<HistoryResponse>('history', chunk)))
      for (const response of responses) {
        if (response.dates.length < 2) throw new Error('The market data middleware returned too little price history.')
        for (const symbol of symbols) {
          const closes = response.closes[symbol]
          if (!closes) continue
          if (closes.length !== response.dates.length || closes.some((price) => !Number.isFinite(price) || price <= 0)) {
            throw new Error(`The market data middleware omitted complete price history for ${symbol}.`)
          }
          validated.set(symbol, new Map(response.dates.map((date, index) => [date, closes[index]])))
        }
      }
      for (const symbol of symbols) {
        if (!validated.has(symbol)) throw new Error(`The market data middleware omitted price history for ${symbol}.`)
      }
      for (const symbol of symbols) {
        const values = validated.get(symbol)!
        for (const pending of batch.get(symbol) ?? []) pending.resolve(values)
        if (this.historyWaiting.get(symbol) === batch.get(symbol)) this.historyWaiting.delete(symbol)
      }
    } catch (cause) {
      const error = cause instanceof Error ? cause : new Error('The market history request failed.')
      for (const [symbol, pendingList] of batch) {
        for (const pending of pendingList) pending.reject(error)
        if (this.historyWaiting.get(symbol) === pendingList) this.historyWaiting.delete(symbol)
      }
    }
  }

  private alignHistory(symbols: string[], series: Map<string, number>[]): MarketHistory {
    if (!symbols.length) return { dates: [], closes: {}, benchmark: 'SPY' }
    const start = symbols.map((_, index) => series[index].keys().next().value as string).sort().at(-1)!
    const dates = [...new Set(series.flatMap((values) => [...values.keys()]))].filter((date) => date >= start).sort()
    if (dates.length < 2) throw new Error('Not enough shared Alpaca history is available for this back-test.')

    const closes = Object.fromEntries(
      symbols.map((symbol, index) => {
        const values = series[index]
        let previous: number | undefined
        for (const [date, price] of values) {
          if (date <= start) previous = price
          else break
        }
        const aligned = dates.map((date) => {
          const current = values.get(date)
          if (current !== undefined) previous = current
          if (previous === undefined) throw new Error(`The Alpaca history for ${symbol} does not cover ${date}.`)
          return previous
        })
        return [symbol, aligned]
      }),
    )
    return { dates, closes, benchmark: 'SPY' }
  }

  private async request<T>(mode: 'latest' | 'history' | 'assets' | 'holdings' | 'profiles', symbols: string[], query?: string, limit?: number): Promise<T> {
    const separator = this.endpoint.includes('?') ? '&' : '?'
    const search = new URLSearchParams({ mode })
    if (symbols.length) search.set('symbols', symbols.join(','))
    if (query !== undefined) search.set('query', query)
    if (limit !== undefined) search.set('limit', String(limit))
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 35_000)
    let response: Response
    try {
      response = await this.fetchImpl(`${this.endpoint}${separator}${search}`, { signal: controller.signal })
    } catch (cause) {
      throw new MarketDataError('Market data did not respond. Check the server connection and try again.', 502, 'market_data_unavailable', cause)
    } finally {
      clearTimeout(timeout)
    }

    let body: unknown
    try {
      body = await response.json()
    } catch (cause) {
      throw new MarketDataError('The market data middleware returned an unreadable response.', 502, 'market_data_invalid_response', cause)
    }
    if (!response.ok) {
      const detail = body as { error?: { message?: string; code?: string } }
      throw new MarketDataError(
        detail.error?.message || 'The market data middleware could not complete this request.',
        response.status,
        detail.error?.code || 'market_data_request_failed',
      )
    }
    return body as T
  }
}
