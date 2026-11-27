import { DEFAULT_PORTFOLIO_USD } from '@/config/defaults'
import { filteredMix, originalMix, runBacktest } from '@/domain/backtest'
import {
  portfolioFromPositions,
  type BrokerAccount,
  type BrokerPosition,
  type OrderRequest,
  type OrderResult,
} from '@/domain/broker'
import { buildTickerPortfolio, type FundMap, lookThrough } from '@/domain/portfolio'
import type {
  Alert,
  BacktestResult,
  Category,
  CategoryId,
  Exclusions,
  FundConstituents,
  Holding,
  Portfolio,
  Security,
  ValuesTag,
} from '@/types'
import { AlpacaMarketDataClient, type AlpacaAsset, type MarketDataReader, type SecurityProfile } from './alpaca-client'
import { lineCategories, SAMPLE_ALERTS, sampleLineTags } from './lines'
import type { DataProvider } from './provider'

const SAMPLE_TICKERS = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'XOM', 'TSLA', 'COST', 'LMT', 'DIS', 'JPM', 'MO']
const CONNECTED_SPEC = [
  ['VOO', 30],
  ['VTI', 12],
  ['AAPL', 6],
  ['MSFT', 6],
  ['NVDA', 5],
  ['AMZN', 4],
  ['GOOGL', 4],
  ['META', 3],
  ['TSLA', 3],
  ['JPM', 3],
  ['XOM', 2.5],
  ['NEE', 2.5],
  ['V', 2],
  ['UNH', 2],
  ['LLY', 2],
  ['LMT', 2],
  ['CVX', 1.5],
  ['PM', 1.5],
  ['DIS', 1.5],
  ['HD', 1.5],
  ['COST', 1.5],
  ['RTX', 1],
  ['STZ', 1],
  ['LVS', 1],
  ['GEO', 0.5],
] as const

export interface AlpacaProviderOptions {
  market?: MarketDataReader
}

/** Production provider: Alpaca quotes/history plus TickerInside-dated fund and sector data. */
export class AlpacaProvider implements DataProvider {
  private readonly market: MarketDataReader

  constructor(options: AlpacaProviderOptions = {}) {
    this.market = options.market ?? new AlpacaMarketDataClient()
  }

  async searchSecurities(query: string): Promise<Security[]> {
    const assets = await this.market.searchAssets(query)
    return assets.map((asset) => toSecurity(asset))
  }

  async getSecurities(tickers: string[]): Promise<Security[]> {
    return this.withLatestPrices(await this.getSecurityMetadata(tickers))
  }

  async getSecurityMetadata(tickers: string[]): Promise<Security[]> {
    const wanted = [...new Set(tickers.map((ticker) => ticker.trim().toUpperCase()).filter(Boolean))]
    if (!wanted.length) return []
    const [assets, profiles] = await Promise.all([this.market.getAssets(wanted), this.profileMap()])
    const byTicker = new Map(assets.map((asset) => [asset.ticker, asset]))
    return wanted.flatMap((ticker) => {
      const asset = byTicker.get(ticker)
      return asset ? [toSecurity(asset, profiles.get(ticker))] : []
    })
  }

  async getFund(ticker: string): Promise<Portfolio | null> {
    const symbol = ticker.trim().toUpperCase()
    const [security, data] = await Promise.all([this.getSecurities([symbol]), this.market.getFundHoldings(symbol)])
    const fund = security[0]
    if (!fund || fund.kind !== 'etf' || !data) return null
    return fundPortfolio(fund, data, DEFAULT_PORTFOLIO_USD)
  }

  async getSamplePortfolio(id: 'sample' | 'connected'): Promise<Portfolio> {
    if (id === 'sample') {
      const securities = await this.getSecurities(SAMPLE_TICKERS)
      return { ...buildTickerPortfolio(securities, DEFAULT_PORTFOLIO_USD), id: 'sample', name: 'My sample portfolio' }
    }

    const totalUsd = 48_000
    const tickers = CONNECTED_SPEC.map(([ticker]) => ticker)
    const securities = await this.getSecurities(tickers)
    const byTicker = new Map(securities.map((security) => [security.ticker, security]))
    return {
      id: 'connected',
      name: 'Connected account',
      totalUsd,
      origin: 'connected',
      holdings: CONNECTED_SPEC.flatMap(([ticker, percent]) => {
        const security = byTicker.get(ticker)
        if (!security) return []
        const valueUsd = totalUsd * (percent / 100)
        return [{ ticker, kind: security.kind, weight: percent / 100, valueUsd, shares: valueUsd / security.price }]
      }),
    }
  }

  /** Which lines each company crosses. Sample tags for the V7 demo (src/data/lines.ts), not live data. */
  async getTags(tickers: string[]): Promise<ValuesTag[]> {
    return sampleLineTags(tickers)
  }

  /** Up to three companies in the same TickerInside sector that cross none of the excluded lines. */
  async getAlternatives(ticker: string, excluded: CategoryId[]): Promise<Security[]> {
    const profiles = [...(await this.profileMap()).values()]
    const target = profiles.find((profile) => profile.ticker === ticker.toUpperCase())
    if (!target) return []
    const blocked = new Set(excluded)
    const crossing = new Set(sampleLineTags(profiles.map((p) => p.ticker)).filter((tag) => blocked.has(tag.category)).map((tag) => tag.ticker))
    const alternatives = profiles
      .filter((profile) => profile.ticker !== target.ticker && profile.sector === target.sector && !crossing.has(profile.ticker))
      .slice(0, 3)
    return this.getSecurities(alternatives.map((profile) => profile.ticker))
  }

  async getBacktest(portfolio: Portfolio, exclusions: Exclusions): Promise<BacktestResult> {
    const direct =
      portfolio.origin === 'fund' ? [] : await this.getSecurities([...new Set(portfolio.holdings.map((holding) => holding.ticker))])
    const byTicker = new Map(direct.map((security) => [security.ticker, security]))
    const funds: FundMap = {}
    if (portfolio.origin !== 'fund') {
      for (const holding of portfolio.holdings) {
        const security = byTicker.get(holding.ticker)
        if (security?.kind !== 'etf') continue
        const fund = await this.getFund(holding.ticker)
        if (fund) funds[holding.ticker] = fund.holdings
      }
    }

    const rows = lookThrough(portfolio, funds)
    const tags = await this.getTags(rows.map((row) => row.ticker))
    const original = originalMix(portfolio, funds)
    const filtered = filteredMix(portfolio, funds, tags, exclusions)
    const symbols = [...new Set([...Object.keys(original), ...Object.keys(filtered), 'SPY'])]
    const history = await this.market.getHistory(symbols)
    return runBacktest(original, filtered, history, history.benchmark)
  }

  /** Sample updates on held companies (src/data/lines.ts) until live monitoring exists. */
  async getAlerts(): Promise<Alert[]> {
    return SAMPLE_ALERTS
  }

  async parseScreenshot(_image: Blob): Promise<Holding[]> {
    return (await this.getSamplePortfolio('sample')).holdings
  }

  /** The nine lines from the investor survey. */
  async getCategories(): Promise<Category[]> {
    return lineCategories()
  }

  private async profileMap(): Promise<Map<string, SecurityProfile>> {
    return new Map((await this.market.getSecurityProfiles()).map((profile) => [profile.ticker, profile]))
  }

  private withLatestPrices(securities: Security[]): Promise<Security[]> {
    return appendLatest(securities, this.market)
  }
}

const toSecurity = (asset: AlpacaAsset, profile?: SecurityProfile): Security => ({
  ticker: asset.ticker,
  name: profile?.name || asset.name,
  sector: profile?.sector || (asset.kind === 'etf' ? 'Fund / ETF' : 'Unclassified'),
  industry: asset.exchange,
  price: 0,
  kind: asset.kind,
  exchange: asset.exchange,
  assetClass: asset.assetClass,
  tradable: asset.tradable,
  fractionable: asset.fractionable,
})

function fundPortfolio(security: Security, data: FundConstituents, totalUsd: number): Portfolio {
  return {
    id: security.ticker,
    name: data.name || security.name,
    totalUsd,
    origin: 'fund',
    fundDetails: data,
    holdings: data.holdings.map((holding) => ({
      ticker: holding.ticker,
      kind: 'stock',
      weight: holding.weight,
      valueUsd: totalUsd * holding.weight,
      shares: 0,
    })),
  }
}

async function appendLatest(securities: Security[], market: MarketDataReader): Promise<Security[]> {
  if (!securities.length) return []
  const quotes = await market.getLatestPrices(securities.map((security) => security.ticker))
  return securities.map((security) => {
    const quote = quotes.get(security.ticker)
    if (!quote || !(quote.price > 0)) throw new Error(`Alpaca did not return a current price for ${security.ticker}.`)
    return { ...security, price: quote.price, priceAsOf: quote.asOf }
  })
}

const PAPER_ACCOUNT_ENDPOINT = '/api/alpaca'

export type AlpacaState =
  | { configured: false }
  | { configured: true; account: BrokerAccount; portfolio: Portfolio | null; positions: BrokerPosition[]; openOrders: number }

async function requestPaperAccount(init?: RequestInit): Promise<any> {
  const response = await fetch(PAPER_ACCOUNT_ENDPOINT, {
    ...init,
    headers: { 'content-type': 'application/json', 'x-rally-demo': '1' },
  })
  let json: any = null
  try {
    json = await response.json()
  } catch {
    // Static hosts have no /api route and answer with 404 or the app HTML.
    if (response.ok || response.status === 404) return { configured: false }
  }
  if (!response.ok) throw new Error(json?.error ?? `Alpaca request failed (${response.status})`)
  return json
}

/** Read the configured paper account without exposing its credentials to the browser. */
export async function loadAlpaca(): Promise<AlpacaState> {
  const json = await requestPaperAccount()
  if (!json?.configured) return { configured: false }
  const positions: BrokerPosition[] = json.positions ?? []
  return {
    configured: true,
    account: json.account,
    positions,
    openOrders: Number(json.openOrders ?? 0),
    portfolio: portfolioFromPositions(positions, 'alpaca', 'Alpaca paper account'),
  }
}

/** Cancel every open order on the paper account. Returns how many were cancelled. */
export async function cancelAlpacaOrders(): Promise<number> {
  const json = await requestPaperAccount({ method: 'DELETE' })
  return Number(json?.cancelled ?? 0)
}

export async function placeAlpacaOrders(orders: OrderRequest[]): Promise<OrderResult[]> {
  const json = await requestPaperAccount({ method: 'POST', body: JSON.stringify({ orders }) })
  if (!Array.isArray(json?.results)) throw new Error('Orders can only be sent from the deployed app with Alpaca set up.')
  return json.results as OrderResult[]
}
