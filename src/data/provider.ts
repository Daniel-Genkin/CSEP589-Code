// The only way the app reads data. Components, state and domain code import this interface
// (and the `provider` instance from ./index), never the seed files.
import type { Alert, BacktestResult, Category, CategoryId, Exclusions, Holding, Portfolio, Security, ValuesTag } from '@/types'

/**
 * `SeededProvider` implements this for v1; a live provider implements the same interface later.
 * Every method is async, even when seeded.
 *
 * The first eight methods are the PRD's interface, unchanged. `getCategories` and
 * `getSecurities` are additions the screens need: the category list for settings and chips,
 * and names, sectors and prices for the holdings table.
 */
export interface DataProvider {
  /** Securities whose ticker or name matches, best match first. Starts after one character. */
  searchSecurities(query: string): Promise<Security[]>
  /** A fund as a portfolio of the companies it holds (weights sum to 1), or null if unknown. */
  getFund(ticker: string): Promise<Portfolio | null>
  getSamplePortfolio(id: 'sample' | 'connected'): Promise<Portfolio>
  /** Every tag on the given tickers, across all categories. */
  getTags(tickers: string[]): Promise<ValuesTag[]>
  /** Up to three stocks in the same sector with no tag in any of `excluded`. */
  getAlternatives(ticker: string, excluded: CategoryId[]): Promise<Security[]>
  getBacktest(portfolio: Portfolio, exclusions: Exclusions): Promise<BacktestResult>
  getAlerts(): Promise<Alert[]>
  /** Stub in v1: returns the sample portfolio's holdings for any image. */
  parseScreenshot(image: Blob): Promise<Holding[]>

  /** Every category in the data, featured values categories first. */
  getCategories(): Promise<Category[]>
  /** Details for known tickers, in the order asked. Unknown tickers are left out. */
  getSecurities(tickers: string[]): Promise<Security[]>
}
