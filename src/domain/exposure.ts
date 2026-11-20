// Values exposure: how many dollars of a portfolio sit in holdings tagged in each category.
// Exposure is the FULL position value of every tagged holding (not scaled by tag strength).
import type { CategoryId, ValuesTag } from '@/types'
import type { CompanyRow } from './portfolio'

export interface Contributor {
  ticker: string
  usd: number
  weight: number
}

export interface CategoryExposure {
  category: CategoryId
  usd: number
  /** share of the portfolio, 0 to 1 */
  share: number
  /** number of flagged holdings */
  count: number
  /** the three largest contributors */
  top: Contributor[]
}

export interface FlaggedTotal {
  usd: number
  share: number
  count: number
  tickers: string[]
}

/** category -> tickers tagged in it */
export function tickersByCategory(tags: ValuesTag[]): Map<CategoryId, Set<string>> {
  const map = new Map<CategoryId, Set<string>>()
  for (const tag of tags) {
    if (!map.has(tag.category)) map.set(tag.category, new Set())
    map.get(tag.category)!.add(tag.ticker)
  }
  return map
}

/** The categories (among `selected`) each ticker is tagged in. */
export function categoriesByTicker(tags: ValuesTag[], selected: CategoryId[]): Map<string, CategoryId[]> {
  const order = new Map(selected.map((id, i) => [id, i]))
  const map = new Map<string, CategoryId[]>()
  for (const tag of tags) {
    if (!order.has(tag.category)) continue
    const list = map.get(tag.ticker) ?? []
    if (!list.includes(tag.category)) list.push(tag.category)
    map.set(tag.ticker, list)
  }
  for (const list of map.values()) list.sort((a, b) => order.get(a)! - order.get(b)!)
  return map
}

/**
 * One entry per selected category, in the order given. A holding tagged in several
 * categories counts in each of them.
 */
export function exposureByCategory(rows: CompanyRow[], tags: ValuesTag[], selected: CategoryId[]): CategoryExposure[] {
  const tagged = tickersByCategory(tags)
  const total = rows.reduce((sum, r) => sum + r.valueUsd, 0)
  return selected.map((category) => {
    const members = tagged.get(category) ?? new Set<string>()
    const flagged = rows.filter((r) => members.has(r.ticker))
    const usd = flagged.reduce((sum, r) => sum + r.valueUsd, 0)
    return {
      category,
      usd,
      share: total > 0 ? usd / total : 0,
      count: flagged.length,
      top: [...flagged]
        .sort((a, b) => b.valueUsd - a.valueUsd || a.ticker.localeCompare(b.ticker))
        .slice(0, 3)
        .map((r) => ({ ticker: r.ticker, usd: r.valueUsd, weight: r.weight })),
    }
  })
}

/** Everything flagged in at least one selected category, each holding counted once. */
export function totalFlagged(rows: CompanyRow[], tags: ValuesTag[], selected: CategoryId[]): FlaggedTotal {
  const byTicker = categoriesByTicker(tags, selected)
  const flagged = rows.filter((r) => byTicker.has(r.ticker))
  const total = rows.reduce((sum, r) => sum + r.valueUsd, 0)
  const usd = flagged.reduce((sum, r) => sum + r.valueUsd, 0)
  return { usd, share: total > 0 ? usd / total : 0, count: flagged.length, tickers: flagged.map((r) => r.ticker) }
}

/** The category with the most dollars in it, or null when nothing is flagged. Ties keep the earlier category. */
export function largestExposure(exposures: CategoryExposure[]): CategoryExposure | null {
  let best: CategoryExposure | null = null
  for (const e of exposures) if (e.usd > 0 && (!best || e.usd > best.usd)) best = e
  return best
}
