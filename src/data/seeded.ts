// SeededProvider: the v1 data source. Reads pre-generated files (real prices and profiles pulled
// by scripts/data/pull_prices.py, tags, sample portfolios and alerts) and answers every
// DataProvider call from them. Deterministic: same input, same output. No network.
//
// This is the only module that imports seed files. It may call domain functions (the back-test
// math); the domain never imports from here.
import { backtestPortfolio } from '@/domain/backtest'
import type { FundMap } from '@/domain/portfolio'
import type { Alert, BacktestResult, Category, CategoryId, Exclusions, Holding, Portfolio, Security, ValuesTag } from '@/types'
import type { DataProvider } from './provider'
import { ALERTS } from './seed/alerts'
import { FEATURED_CATEGORIES, SECTOR_BASIS, SECTOR_COLOR, sectorCategoryId } from './seed/categories'
import fundsFile from './seed/generated/funds.json'
import securitiesFile from './seed/generated/securities.json'
import tagsFile from './seed/generated/tags.json'
import { CONNECTED_PORTFOLIO, SAMPLE_PORTFOLIO, type SamplePortfolioSpec } from './seed/portfolios'

/** What a fund or sample portfolio is worth before the user sets an amount. */
export const DEFAULT_PORTFOLIO_USD = 10_000
export const MAX_SEARCH_RESULTS = 8
export const MAX_ALTERNATIVES = 3
/** Seeded calls pause briefly so loading states are real. Well under the 500 ms budget. */
export const SEED_DELAY_MS = 120

interface SeedSecurity extends Security {
  industry: string
  marketCap: number | null
}

export interface PriceHistory {
  /** ISO dates, oldest first */
  dates: string[]
  /** ticker -> adjusted closes, aligned with `dates` */
  closes: Record<string, number[]>
  benchmark: string
}

const yahooUrl = (ticker: string) => `https://finance.yahoo.com/quote/${ticker}/`

export class SeededProvider implements DataProvider {
  private readonly securities: SeedSecurity[]
  private readonly byTicker: Map<string, SeedSecurity>
  private readonly funds: Record<string, { name: string; holdings: { ticker: string; weight: number }[] }>
  private readonly tags: ValuesTag[]
  private readonly categories: Category[]
  private prices: Promise<PriceHistory> | null = null

  constructor(private readonly delayMs = SEED_DELAY_MS) {
    // Largest companies first, funds last: the order search and alternatives rely on.
    this.securities = [...(securitiesFile.securities as SeedSecurity[])].sort(
      (a, b) => Number(a.kind === 'etf') - Number(b.kind === 'etf') || (b.marketCap ?? 0) - (a.marketCap ?? 0) || a.ticker.localeCompare(b.ticker),
    )
    this.byTicker = new Map(this.securities.map((s) => [s.ticker, s]))
    this.funds = fundsFile.funds

    const stocks = this.securities.filter((s) => s.kind === 'stock')
    const sectors = [...new Set(stocks.map((s) => s.sector))].sort()
    this.categories = [
      ...FEATURED_CATEGORIES,
      ...sectors.map((sector) => ({ id: sectorCategoryId(sector), label: sector, featured: false, basis: SECTOR_BASIS, color: SECTOR_COLOR })),
    ]
    // Values tags come from the tags file. Sector membership is a tag too, so a sector works
    // as a category exactly like the featured seven.
    this.tags = [
      ...(tagsFile.tags as ValuesTag[]),
      ...stocks.map(
        (s): ValuesTag => ({
          ticker: s.ticker,
          category: sectorCategoryId(s.sector),
          strength: 3,
          reason: `Yahoo Finance sector: ${s.sector} (${s.industry}).`,
          sourceUrl: yahooUrl(s.ticker),
        }),
      ),
    ]
  }

  private wait<T>(value: T): Promise<T> {
    if (this.delayMs <= 0) return Promise.resolve(value)
    return new Promise((resolve) => setTimeout(() => resolve(value), this.delayMs))
  }

  private toSecurity(s: SeedSecurity): Security {
    return { ticker: s.ticker, name: s.name, sector: s.sector, price: s.price, kind: s.kind, industry: s.industry }
  }

  private holding(ticker: string, weight: number, totalUsd: number): Holding {
    const price = this.byTicker.get(ticker)?.price ?? 0
    const valueUsd = totalUsd * weight
    return { ticker, weight, valueUsd, shares: price > 0 ? valueUsd / price : 0 }
  }

  private fromSpec(spec: SamplePortfolioSpec, origin: Portfolio['origin']): Portfolio {
    return {
      id: spec.id,
      name: spec.name,
      totalUsd: spec.totalUsd,
      origin,
      holdings: Object.entries(spec.weights).map(([ticker, percent]) => this.holding(ticker, percent / 100, spec.totalUsd)),
    }
  }

  searchSecurities(query: string): Promise<Security[]> {
    const q = query.trim().toLowerCase()
    if (!q) return this.wait([])
    // Ticker prefix beats a name that starts with the query, which beats a name that contains it.
    const rank = (s: SeedSecurity) => {
      const ticker = s.ticker.toLowerCase()
      const name = s.name.toLowerCase()
      if (ticker === q) return 0
      if (ticker.startsWith(q)) return 1
      if (name.startsWith(q)) return 2
      if (name.split(/[\s.,&-]+/).some((word) => word.startsWith(q))) return 3
      return name.includes(q) ? 4 : -1
    }
    const matches = this.securities
      .map((s, order) => ({ s, order, rank: rank(s) }))
      .filter((m) => m.rank >= 0)
      .sort((a, b) => a.rank - b.rank || a.order - b.order)
      .slice(0, MAX_SEARCH_RESULTS)
      .map((m) => this.toSecurity(m.s))
    return this.wait(matches)
  }

  getFund(ticker: string): Promise<Portfolio | null> {
    const symbol = ticker.trim().toUpperCase()
    const fund = this.funds[symbol]
    if (!fund) return this.wait(null)
    return this.wait({
      id: symbol,
      name: fund.name,
      totalUsd: DEFAULT_PORTFOLIO_USD,
      origin: 'fund' as const,
      holdings: fund.holdings.map((h) => this.holding(h.ticker, h.weight, DEFAULT_PORTFOLIO_USD)),
    })
  }

  getSamplePortfolio(id: 'sample' | 'connected'): Promise<Portfolio> {
    return this.wait(id === 'connected' ? this.fromSpec(CONNECTED_PORTFOLIO, 'connected') : this.fromSpec(SAMPLE_PORTFOLIO, 'tickers'))
  }

  getTags(tickers: string[]): Promise<ValuesTag[]> {
    const wanted = new Set(tickers.map((t) => t.toUpperCase()))
    return this.wait(this.tags.filter((tag) => wanted.has(tag.ticker)).map((tag) => ({ ...tag })))
  }

  getAlternatives(ticker: string, excluded: CategoryId[]): Promise<Security[]> {
    const target = this.byTicker.get(ticker.toUpperCase())
    if (!target || target.kind !== 'stock') return this.wait([])
    const flagged = new Set(this.tags.filter((tag) => excluded.includes(tag.category)).map((tag) => tag.ticker))
    const options = this.securities
      .filter((s) => s.kind === 'stock' && s.ticker !== target.ticker && s.sector === target.sector && !flagged.has(s.ticker))
      .slice(0, MAX_ALTERNATIVES)
      .map((s) => this.toSecurity(s))
    return this.wait(options)
  }

  /**
   * Back-test the portfolio and its what-if version on the seeded prices. The math is the
   * domain's (src/domain/backtest.ts); this method supplies prices, fund holdings and tags.
   */
  async getBacktest(portfolio: Portfolio, exclusions: Exclusions): Promise<BacktestResult> {
    const prices = await this.loadPrices()
    const funds: FundMap = Object.fromEntries(Object.entries(this.funds).map(([ticker, fund]) => [ticker, fund.holdings]))
    return this.wait(backtestPortfolio(portfolio, funds, this.tags, exclusions, prices, prices.benchmark))
  }

  getAlerts(): Promise<Alert[]> {
    return this.wait(ALERTS.map((alert) => ({ ...alert })))
  }

  /** v1 stub: no image is read. Any image gives the sample portfolio's holdings. */
  async parseScreenshot(_image: Blob): Promise<Holding[]> {
    return (await this.getSamplePortfolio('sample')).holdings
  }

  getCategories(): Promise<Category[]> {
    return this.wait(this.categories.map((category) => ({ ...category })))
  }

  getSecurities(tickers: string[]): Promise<Security[]> {
    const found = tickers.map((t) => this.byTicker.get(t.toUpperCase())).filter((s): s is SeedSecurity => Boolean(s))
    return this.wait(found.map((s) => this.toSecurity(s)))
  }

  /**
   * About five years of daily adjusted closes for every seed ticker and the benchmark.
   * Loaded on first use as its own chunk (it is close to 1 MB), then kept. Internal to the
   * seeded provider: the app reaches prices only through `getBacktest`.
   */
  loadPrices(): Promise<PriceHistory> {
    this.prices ??= import('./seed/generated/prices.json')
      .then((file) => {
        const data = (file.default ?? file) as { meta: { benchmark: string }; dates: string[]; closes: Record<string, number[]> }
        return { dates: data.dates, closes: data.closes, benchmark: data.meta.benchmark }
      })
      .catch((error) => {
        this.prices = null // let the next call try again instead of keeping the failure
        throw error
      })
    return this.prices
  }
}
