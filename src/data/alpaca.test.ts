import { aggregateHistory, handleMarketDataRequest, normalizeSymbols } from '../../server/alpaca-market-data.js'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AlpacaProvider } from './alpaca'
import { AlpacaMarketDataClient, type MarketDataReader } from './alpaca-client'

afterEach(() => vi.restoreAllMocks())

describe('Alpaca market data middleware', () => {
  it('normalizes and bounds symbol batches', () => {
    expect(normalizeSymbols(' aapl, msft,AAPL ')).toEqual(['AAPL', 'MSFT'])
    expect(() => normalizeSymbols('AAPL bad')).toThrow('Symbols may contain')
    expect(() => normalizeSymbols('')).toThrow('at least one')
  })

  it('aligns every symbol from the first common date and fills session gaps', () => {
    const result = aggregateHistory(
      ['AAPL', 'MSFT'],
      {
        AAPL: [
          { t: '2024-01-02T09:30:00Z', c: 10 },
          { t: '2024-01-03T09:30:00Z', c: 11 },
        ],
        MSFT: [
          { t: '2024-01-03T09:30:00Z', c: 20 },
          { t: '2024-01-04T09:30:00Z', c: 21 },
        ],
      },
    )
    expect(result).toEqual({
      dates: ['2024-01-03', '2024-01-04'],
      closes: { AAPL: [11, 11], MSFT: [20, 21] },
      benchmark: 'SPY',
    })
  })

  it('paginates history without exposing credentials to the client response', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(input.toString())
      if (!url.searchParams.has('page_token')) {
        return new Response(
          JSON.stringify({
            bars: { AAPL: [{ t: '2024-01-02T09:30:00Z', c: 10 }] },
            next_page_token: 'next',
          }),
        )
      }
      return new Response(
        JSON.stringify({
          bars: {
            AAPL: [{ t: '2024-01-03T09:30:00Z', c: 11 }],
            MSFT: [
              { t: '2024-01-02T09:30:00Z', c: 20 },
              { t: '2024-01-03T09:30:00Z', c: 21 },
            ],
          },
          next_page_token: null,
        }),
      )
    })
    const fetchImpl = fetchMock as typeof fetch
    const result = await handleMarketDataRequest(
      new URL('http://localhost/api/market-data?mode=history&symbols=AAPL,MSFT'),
      { ALPACA_API_KEY_ID: 'key', ALPACA_API_SECRET_KEY: 'secret', ALPACA_HISTORY_START: '2024-01-01' },
      { fetchImpl },
    )

    expect(result.status).toBe(200)
    expect((result.body as { dates: string[] }).dates).toEqual(['2024-01-02', '2024-01-03'])
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(new URL(fetchMock.mock.calls[1][0].toString()).searchParams.get('page_token')).toBe('next')
    expect(JSON.stringify(result)).not.toContain('secret')
  })

  it('returns an actionable no-store error when server credentials are absent', async () => {
    const result = await handleMarketDataRequest(new URL('http://localhost/api/market-data?symbols=AAPL'), {})
    expect(result.status).toBe(503)
    expect(result.headers['Cache-Control']).toBe('no-store')
    expect((result.body as { error: { code: string } }).error.code).toBe('alpaca_not_configured')
  })

  it('serves symbol metadata from the Alpaca asset catalog without bundled securities', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify([
          {
            id: '1',
            class: 'us_equity',
            exchange: 'NASDAQ',
            symbol: 'AAPL',
            name: 'Apple Inc. Common Stock',
            status: 'active',
            tradable: true,
            fractionable: true,
          },
          {
            id: '2',
            class: 'us_equity',
            exchange: 'ARCA',
            symbol: 'SPY',
            name: 'SPDR S&P 500 ETF Trust',
            status: 'active',
            tradable: true,
            fractionable: true,
          },
        ]),
      ),
    ) as typeof fetch
    const result = await handleMarketDataRequest(
      new URL('http://localhost/api/market-data?mode=assets&symbols=AAPL,SPY'),
      { ALPACA_API_KEY_ID: 'key', ALPACA_API_SECRET_KEY: 'secret' },
      { fetchImpl },
    )
    const body = result.body as { assets: Array<{ ticker: string; kind: string; exchange: string }> }
    expect(body.assets.map((asset) => [asset.ticker, asset.kind, asset.exchange])).toEqual([
      ['AAPL', 'stock', 'NASDAQ'],
      ['SPY', 'etf', 'ARCA'],
    ])
  })

  it('normalizes keyless TickerInside holdings and preserves source attribution', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(
        JSON.stringify({
          ticker: 'SPY',
          name: 'SPDR S&P 500 ETF Trust',
          source_layer: 'issuer',
          holdings_as_of: '2026-11-19',
          positions: 2,
          zeroWeightPositions: 0,
          holdings: { AAPL: 8.2249, MSFT: 5.9715 },
          cite_as: 'TickerInside, SPY holdings, CC BY 4.0',
          page_url: 'https://tickerinside.com/etf/spy/',
          license: 'CC BY 4.0',
        }),
      ),
    )
    const fetchImpl = fetchMock as typeof fetch
    const result = await handleMarketDataRequest(
      new URL('http://localhost/api/market-data?mode=holdings&symbols=SPY'),
      { ALPACA_API_KEY_ID: 'key', ALPACA_API_SECRET_KEY: 'secret' },
      { fetchImpl },
    )
    expect(result.status).toBe(200)
    expect(result.body).toMatchObject({
      source: 'tickerinside',
      funds: {
        SPY: {
          ticker: 'SPY',
          holdingsAsOf: '2026-11-19',
          citation: 'TickerInside, SPY holdings, CC BY 4.0',
          holdings: [
            { ticker: 'AAPL', weight: 0.082249 },
            { ticker: 'MSFT', weight: 0.059715 },
          ],
        },
      },
    })
    const request = fetchMock.mock.calls[0]
    expect(request[1]?.headers).not.toHaveProperty('APCA-API-KEY-ID')
    expect(request[1]?.headers).toHaveProperty('User-Agent')
  })
})

describe('AlpacaMarketDataClient', () => {
  it('batches same-turn quote requests into one middleware call', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const symbols = new URL(input.toString()).searchParams.get('symbols')!.split(',')
      return new Response(
        JSON.stringify({
          prices: Object.fromEntries(symbols.map((symbol) => [symbol, { price: symbol === 'AAPL' ? 111 : 222, asOf: '2026-01-01T00:00:00Z' }])),
        }),
      )
    }) as typeof fetch
    const client = new AlpacaMarketDataClient({ endpoint: 'http://localhost/api/market-data', fetchImpl, latestTtlMs: 0 })
    const [aapl, msft] = await Promise.all([client.getLatestPrices(['AAPL']), client.getLatestPrices(['MSFT'])])
    expect(aapl.get('AAPL')?.price).toBe(111)
    expect(msft.get('MSFT')?.price).toBe(222)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })
})

describe('AlpacaProvider', () => {
  it('combines live asset metadata and latest quotes without a seed catalog', async () => {
    const assets = [
      { ticker: 'AAPL', name: 'Apple Inc. Common Stock', exchange: 'NASDAQ', assetClass: 'us_equity', kind: 'stock' as const, tradable: true, fractionable: true },
    ]
    const market: MarketDataReader = {
      searchAssets: async () => assets,
      getAssets: async () => assets,
      getFundHoldings: async () => null,
      getSecurityProfiles: async () => [],
      getLatestPrices: async (symbols) =>
        new Map(symbols.map((symbol) => [symbol, { price: 100 + symbols.indexOf(symbol), asOf: '2026-01-01T00:00:00Z' }])),
      getHistory: async () => ({ dates: [], closes: {}, benchmark: 'SPY' }),
    }
    const provider = new AlpacaProvider({ market })

    const [aapl] = await provider.getSecurities(['AAPL'])
    expect(aapl).toMatchObject({ ticker: 'AAPL', name: 'Apple Inc. Common Stock', exchange: 'NASDAQ', price: 100 })
  })

  it('uses Alpaca history for the requested back-test inputs', async () => {
    const requested: string[][] = []
    const market: MarketDataReader = {
      searchAssets: async () => [],
      getAssets: async () => [],
      getFundHoldings: async () => null,
      getSecurityProfiles: async () => [],
      getLatestPrices: async (symbols) => new Map(symbols.map((symbol) => [symbol, { price: 100, asOf: '2026-01-01T00:00:00Z' }])),
      getHistory: async (symbols) => {
        requested.push(symbols)
        return {
          dates: ['2025-01-02', '2025-01-03'],
          closes: Object.fromEntries(symbols.map((symbol) => [symbol, symbol === 'AAPL' ? [100, 110] : [100, 102]])),
          benchmark: 'SPY',
        }
      },
    }
    const provider = new AlpacaProvider({ market })
    const portfolio = {
      id: 'AAPL',
      name: 'AAPL',
      totalUsd: 10_000,
      origin: 'tickers' as const,
      holdings: [{ ticker: 'AAPL', weight: 1, valueUsd: 10_000, shares: 100 }],
    }

    const result = await provider.getBacktest(portfolio, { categories: [], tickers: [], swaps: {} })
    expect(requested).toEqual([['AAPL', 'SPY']])
    expect(result.original.at(-1)).toBeGreaterThan(result.benchmark.at(-1)!)
  })
})
