// Types shared by the data, domain, state and UI layers (PRD "Types").

/** Any yfinance sector or a values category. Featured seven: defense, fossil_fuels, private_prisons, tobacco, alcohol, gambling, animal_testing. */
export type CategoryId = string
export type BrokerId = 'schwab' | 'webull' | 'alpaca' | 'robinhood' | 'fidelity'
export type Plan = 'free' | 'paid'

export interface Security {
  ticker: string
  name: string
  sector: string
  price: number
  kind: 'stock' | 'etf'
  /** yfinance industry, when the source has one */
  industry?: string
}

export interface ValuesTag {
  ticker: string
  category: CategoryId
  strength: 1 | 2 | 3
  reason: string
  sourceUrl: string
}

export interface Holding {
  ticker: string
  /** share of the portfolio, 0 to 1 */
  weight: number
  valueUsd: number
  shares: number
}

export interface Portfolio {
  id: string
  name: string
  totalUsd: number
  holdings: Holding[]
  origin: 'fund' | 'tickers' | 'connected'
  brokerId?: BrokerId
}

export interface Exclusions {
  categories: CategoryId[]
  tickers: string[]
  /** excluded ticker -> the alternative that takes its weight */
  swaps: Record<string, string>
}

export interface BacktestResult {
  dates: string[]
  original: number[]
  filtered: number[]
  benchmark: number[]
  annualizedPct: { original: number; filtered: number; benchmark: number }
}

export interface ProposedTrade {
  side: 'sell' | 'buy'
  ticker: string
  shares: number
  estUsd: number
  reason: string
}

export interface Alert {
  id: string
  type: 'new_tag' | 'tag_removed' | 'filing' | 'drift'
  ticker: string
  category: CategoryId
  offsetMinutes: number
  summary: string
}

/** A category the user can switch on or off. Categories are data: the seed lists them. */
export interface Category {
  id: CategoryId
  label: string
  /** The seven values categories shown first */
  featured: boolean
  /** Where the tags for this category come from */
  basis: string
  /** CSS colour for the category's dot */
  color: string
}

/** The simulated free account: email only, never a brokerage link. */
export interface Account {
  email: string
}
