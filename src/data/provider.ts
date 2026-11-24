// The only way the application reads market data.
import type { Alert, BacktestResult, Category, CategoryId, Exclusions, Holding, Portfolio, Security, ValuesTag } from '@/types'

/** Production market-data contract implemented by AlpacaProvider. */
export interface DataProvider {
  searchSecurities(query: string): Promise<Security[]>
  /** Active Alpaca US-equity assets, in input order; unknown symbols are omitted. */
  getSecurities(tickers: string[]): Promise<Security[]>
  /** Asset names and classifications without requesting a quote for every ETF constituent. */
  getSecurityMetadata(tickers: string[]): Promise<Security[]>
  /** A fund-origin portfolio with dated TickerInside constituent weights. */
  getFund(ticker: string): Promise<Portfolio | null>
  getSamplePortfolio(id: 'sample' | 'connected'): Promise<Portfolio>
  getTags(tickers: string[]): Promise<ValuesTag[]>
  getAlternatives(ticker: string, excluded: CategoryId[]): Promise<Security[]>
  getBacktest(portfolio: Portfolio, exclusions: Exclusions): Promise<BacktestResult>
  getAlerts(): Promise<Alert[]>
  parseScreenshot(image: Blob): Promise<Holding[]>
  getCategories(): Promise<Category[]>
}
