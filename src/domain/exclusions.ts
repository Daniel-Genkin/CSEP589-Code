// What-if exclusions: drop categories or single companies and redistribute their weight
// pro rata across what remains. This is the only redistribution strategy in v1, and this file
// is the only place it is written down: weights, the back-test and trades all use `planRedistribution`.
import type { CategoryId, Exclusions, ValuesTag } from '@/types'
import { tickersByCategory } from './exposure'
import type { CompanyRow } from './portfolio'

/** ticker -> weight, summing to 1 (or empty when everything was excluded) */
export type Weights = Record<string, number>

export const NO_EXCLUSIONS: Exclusions = { categories: [], tickers: [], swaps: {} }

export const hasExclusions = (e: Exclusions) => e.categories.length > 0 || e.tickers.length > 0

export function weightsOf(rows: CompanyRow[]): Weights {
  const weights: Weights = {}
  for (const row of rows) weights[row.ticker] = (weights[row.ticker] ?? 0) + row.weight
  return weights
}

/**
 * The companies in this portfolio that the exclusions remove: tagged in an excluded category,
 * or excluded by ticker. Exclusions name companies, not fund positions: a fund is affected
 * through the companies inside it.
 */
export function excludedTickers(rows: CompanyRow[], tags: ValuesTag[], exclusions: Exclusions): Set<string> {
  const tagged = tickersByCategory(tags)
  const out = new Set<string>()
  const byTicker = new Set(exclusions.tickers)
  for (const row of rows) {
    if (byTicker.has(row.ticker) || exclusions.categories.some((c) => tagged.get(c)?.has(row.ticker))) out.add(row.ticker)
  }
  return out
}

/** Why a company is excluded: the excluded categories it is tagged in, or 'ticker' when it was switched off by hand. */
export function exclusionReasons(ticker: string, tags: ValuesTag[], exclusions: Exclusions): CategoryId[] {
  const reasons = exclusions.categories.filter((c) => tags.some((t) => t.ticker === ticker && t.category === c))
  return reasons.length || !exclusions.tickers.includes(ticker) ? reasons : ['ticker']
}

/**
 * Swaps that still apply: the excluded company is in the portfolio and is excluded, and the
 * alternative is a company that is not itself excluded. `notCompanies` lists tickers that can
 * never be an alternative (the funds this portfolio holds).
 */
export function activeSwaps(rows: CompanyRow[], tags: ValuesTag[], exclusions: Exclusions, notCompanies: Iterable<string> = []): Record<string, string> {
  const excluded = excludedTickers(rows, tags, exclusions)
  const tagged = tickersByCategory(tags)
  const barred = new Set(notCompanies)
  const blocked = (ticker: string) => barred.has(ticker) || exclusions.tickers.includes(ticker) || exclusions.categories.some((c) => tagged.get(c)?.has(ticker))
  const swaps: Record<string, string> = {}
  for (const [from, to] of Object.entries(exclusions.swaps)) {
    if (excluded.has(from) && from !== to && !blocked(to)) swaps[from] = to
  }
  return swaps
}

/** How excluded weight moves. Every consumer of the what-if reads the same plan. */
export interface Redistribution {
  /** Companies leaving the portfolio */
  excluded: Set<string>
  /** excluded company -> the alternative that takes its whole weight */
  swaps: Record<string, string>
  /** Weight of what stays */
  remaining: number
  /** Excluded weight that goes to alternatives */
  swapped: number
  /** Excluded weight with no alternative, spread pro rata */
  unswapped: number
  /** Multiplier on everything that stays, so it absorbs the unswapped weight (0 when nothing stays) */
  scale: number
  /** Multiplier on swapped-in weight: 1, unless nothing else stays and the alternatives must absorb the rest */
  swapScale: number
}

export function planRedistribution(rows: CompanyRow[], tags: ValuesTag[], exclusions: Exclusions, notCompanies: Iterable<string> = []): Redistribution {
  const excluded = excludedTickers(rows, tags, exclusions)
  const swaps = excluded.size ? activeSwaps(rows, tags, exclusions, notCompanies) : {}
  let remaining = 0
  let swapped = 0
  let unswapped = 0
  for (const row of rows) {
    if (!excluded.has(row.ticker)) remaining += row.weight
    else if (swaps[row.ticker]) swapped += row.weight
    else unswapped += row.weight
  }
  return {
    excluded,
    swaps,
    remaining,
    swapped,
    unswapped,
    scale: remaining > 0 ? (remaining + unswapped) / remaining : 0,
    swapScale: remaining > 0 || swapped === 0 ? 1 : (swapped + unswapped) / swapped,
  }
}

/**
 * The portfolio's companies after the what-if, largest first, for working out what exposure is
 * left. Swapped-in alternatives appear as companies held directly.
 */
export function filteredRows(rows: CompanyRow[], tags: ValuesTag[], exclusions: Exclusions, totalUsd: number, notCompanies: Iterable<string> = []): CompanyRow[] {
  return Object.entries(applyExclusions(rows, tags, exclusions, notCompanies))
    .map(([ticker, weight]) => ({ ticker, weight, valueUsd: weight * totalUsd, slices: [{ via: null, weight }] }))
    .sort((a, b) => b.weight - a.weight || a.ticker.localeCompare(b.ticker))
}

/**
 * Filtered company weights. Each excluded holding's weight either goes to its swapped-in
 * alternative, or is spread across the remaining holdings in proportion to their weights.
 * If nothing remains and nothing was swapped in, the result is empty (all cash).
 */
export function applyExclusions(rows: CompanyRow[], tags: ValuesTag[], exclusions: Exclusions, notCompanies: Iterable<string> = []): Weights {
  const plan = planRedistribution(rows, tags, exclusions, notCompanies)
  if (!plan.excluded.size) return weightsOf(rows)
  const out: Weights = {}
  for (const row of rows) if (!plan.excluded.has(row.ticker)) out[row.ticker] = row.weight * plan.scale
  for (const row of rows) {
    const to = plan.swaps[row.ticker]
    if (to) out[to] = (out[to] ?? 0) + row.weight * plan.swapScale
  }
  return out
}
