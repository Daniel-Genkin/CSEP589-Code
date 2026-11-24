// Building portfolios from what the user types, and looking through funds to the companies inside.
// Pure functions: no UI, storage or network.
import type { Holding, Portfolio, Security } from '@/types'

/** Fund ticker -> externally supplied companies, weights summing to 1. Alpaca production data does not provide this. */
export type FundMap = Record<string, Pick<Holding, 'ticker' | 'weight'>[]>

/** One way a company is held: directly (`via: null`) or inside a fund. */
export interface Slice {
  via: string | null
  weight: number
}

/** A company's total share of the portfolio, combined across every source. */
export interface CompanyRow {
  ticker: string
  weight: number
  valueUsd: number
  slices: Slice[]
}

/** A position the user actually holds at their broker: a stock, or a fund as one unit. */
export interface Position {
  ticker: string
  weight: number
  valueUsd: number
  isFund: boolean
}

/**
 * "VOO, SPY nvda" -> ['VOO', 'SPY', 'NVDA']. Commas, spaces, semicolons and new lines all
 * separate. Anything that cannot be part of a ticker ("$", brackets, quotes) is dropped.
 */
export function parseTickerInput(text: string): string[] {
  const seen = new Set<string>()
  for (const raw of text.split(/[\s,;]+/)) {
    const ticker = raw.replace(/[^A-Za-z0-9.-]/g, '').toUpperCase()
    if (ticker) seen.add(ticker)
  }
  return [...seen]
}

/** What to call a portfolio in a label: a fund's ticker, otherwise the portfolio's own name. */
export const shortName = (portfolio: Portfolio) => (portfolio.origin === 'fund' ? portfolio.id : portfolio.name)

/** Whether two portfolios hold the same things at the same size (so one need not replace the other). */
export function samePortfolio(a: Portfolio | null, b: Portfolio | null): boolean {
  if (!a || !b) return a === b
  if (a.id !== b.id || a.origin !== b.origin || a.totalUsd !== b.totalUsd || a.holdings.length !== b.holdings.length) return false
  return a.holdings.every((h, i) => h.ticker === b.holdings[i].ticker && Math.abs(h.weight - b.holdings[i].weight) < 1e-9)
}

/** Levenshtein distance, for "did you mean". */
export function editDistance(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    let diagonal = prev[0]
    prev[0] = i
    for (let j = 1; j <= b.length; j++) {
      const above = prev[j]
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1))
      diagonal = above
    }
  }
  return prev[b.length]
}

/** A suggestion further than this many edits away is a guess, not a correction. */
export const MAX_SUGGESTION_DISTANCE = 2

/**
 * The known ticker closest to an unknown one, or null when nothing is close enough to be what
 * the user meant. Ties go to the first in `known`, so the answer is stable.
 */
export function closestTicker(unknown: string, known: string[]): string | null {
  let best: string | null = null
  let bestScore = Infinity
  const target = unknown.toUpperCase()
  for (const ticker of known) {
    const distance = editDistance(target, ticker)
    if (distance > MAX_SUGGESTION_DISTANCE) continue
    // A shared first letter matters more to a reader than raw edit distance.
    const score = distance + (ticker[0] === target[0] ? 0 : 0.5)
    if (score < bestScore) {
      best = ticker
      bestScore = score
    }
  }
  return best
}

const sharesOf = (valueUsd: number, price: number) => (price > 0 ? valueUsd / price : 0)

/** Several tickers with no amounts: equal weights. Funds stay in the list as one holding each. */
export function buildTickerPortfolio(securities: Security[], totalUsd: number): Portfolio {
  const weight = securities.length ? 1 / securities.length : 0
  return {
    id: securities.map((s) => s.ticker).join('+'),
    name: securities.map((s) => s.ticker).join(', '),
    totalUsd,
    origin: 'tickers',
    holdings: securities.map((s) => ({ ticker: s.ticker, kind: s.kind, weight, valueUsd: totalUsd * weight, shares: sharesOf(totalUsd * weight, s.price) })),
  }
}

/** ticker -> price per share */
export type Prices = Record<string, number>

/** A holding's dollars and shares, worked out from its weight. Weight is the source of truth. */
function sized(holding: Holding, weight: number, totalUsd: number, prices: Prices): Holding {
  // Prefer the given price; fall back to the one implied by the holding itself.
  const price = prices[holding.ticker] ?? (holding.shares > 0 ? holding.valueUsd / holding.shares : 0)
  const valueUsd = totalUsd * weight
  return { ...holding, weight, valueUsd, shares: sharesOf(valueUsd, price) }
}

/** The same portfolio at a different dollar size. Pass prices so share counts survive a holding at $0. */
export function resizePortfolio(portfolio: Portfolio, totalUsd: number, prices: Prices = {}): Portfolio {
  return { ...portfolio, totalUsd, holdings: portfolio.holdings.map((h) => sized(h, h.weight, totalUsd, prices)) }
}

/**
 * Set one holding's weight (0 to 1) and re-normalize so the weights sum to 1.
 * The other holdings keep their proportions to each other.
 *
 * Only ticker-built portfolios can be edited: a fund's holdings are the fund's, and a connected
 * account's are the broker's. Pass prices so share counts survive a holding set to 0%.
 */
export function setHoldingWeight(portfolio: Portfolio, ticker: string, weight: number, prices: Prices = {}): Portfolio {
  if (portfolio.origin !== 'tickers') return portfolio
  const target = portfolio.holdings.find((h) => h.ticker === ticker)
  if (!target || portfolio.holdings.length < 2 || !Number.isFinite(weight)) return portfolio
  const next = Math.min(Math.max(weight, 0), 1)
  const others = portfolio.holdings.filter((h) => h.ticker !== ticker)
  const othersSum = others.reduce((sum, h) => sum + h.weight, 0)
  return {
    ...portfolio,
    holdings: portfolio.holdings.map((h) => {
      if (h.ticker === ticker) return sized(h, next, portfolio.totalUsd, prices)
      // If every other holding was at zero, share the remainder equally.
      const share = othersSum > 0 ? h.weight / othersSum : 1 / others.length
      return sized(h, (1 - next) * share, portfolio.totalUsd, prices)
    }),
  }
}

/**
 * What the user holds at their broker. A fund-origin portfolio ("SPY" typed on Home) is one
 * position in that fund; its `holdings` are the companies inside it.
 */
export function positionsOf(portfolio: Portfolio, funds: FundMap): Position[] {
  if (portfolio.origin === 'fund') return [{ ticker: portfolio.id, weight: 1, valueUsd: portfolio.totalUsd, isFund: true }]
  return portfolio.holdings.map((h) => ({ ticker: h.ticker, weight: h.weight, valueUsd: h.valueUsd, isFund: h.ticker in funds }))
}

/**
 * Break funds into the companies they hold and combine weights across sources,
 * largest first. A company held directly and through two funds is one row with three slices.
 */
export function lookThrough(portfolio: Portfolio, funds: FundMap): CompanyRow[] {
  const rows = new Map<string, CompanyRow>()
  const add = (ticker: string, weight: number, via: string | null) => {
    if (!(weight > 0)) return
    const row = rows.get(ticker) ?? { ticker, weight: 0, valueUsd: 0, slices: [] }
    row.weight += weight
    row.valueUsd = row.weight * portfolio.totalUsd
    row.slices.push({ via, weight })
    rows.set(ticker, row)
  }
  if (portfolio.origin === 'fund') {
    for (const h of portfolio.holdings) add(h.ticker, h.weight, portfolio.id)
  } else {
    for (const h of portfolio.holdings) {
      const inside = funds[h.ticker]
      if (inside) for (const c of inside) add(c.ticker, h.weight * c.weight, h.ticker)
      else add(h.ticker, h.weight, null)
    }
  }
  return [...rows.values()].sort((a, b) => b.weight - a.weight || a.ticker.localeCompare(b.ticker))
}

/** The companies inside a fund position: the portfolio's own holdings for a fund-origin portfolio. */
export function constituentsOf(portfolio: Portfolio, funds: FundMap, fundTicker: string): Pick<Holding, 'ticker' | 'weight'>[] {
  return portfolio.origin === 'fund' && fundTicker === portfolio.id ? portfolio.holdings : (funds[fundTicker] ?? [])
}

/** The funds a portfolio holds as units (so the UI can group companies under them). */
export function fundsIn(portfolio: Portfolio, funds: FundMap): string[] {
  if (portfolio.origin === 'fund') return [portfolio.id]
  return portfolio.holdings.filter((h) => h.ticker in funds).map((h) => h.ticker)
}
