// Home's check: turn what the user typed into a portfolio and count what conflicts with the
// categories they picked. Data comes from the provider; the arithmetic is the domain's.
import { provider } from '@/data'
import { totalFlagged } from '@/domain/exposure'
import { type CompanyRow, buildTickerPortfolio, closestTicker, lookThrough, parseTickerInput, resizePortfolio } from '@/domain/portfolio'
import type { CategoryId, Portfolio, ValuesTag } from '@/types'
import { loadPortfolioDetails } from './usePortfolioData'

export type InputProblem = { kind: 'empty' } | { kind: 'amount' } | { kind: 'unknown'; ticker: string; suggestion: string | null }

/** The one line Home shows before signup. Nothing about which holdings, or why. */
export interface ConflictSummary {
  /** Holdings (funds looked through) tagged in at least one selected category */
  count: number
  usd: number
  totalUsd: number
  /** How many companies the portfolio holds once funds are broken apart */
  holdings: number
}

/**
 * A fund ticker on its own becomes that fund; several tickers are equal-weighted, funds among
 * them kept as single holdings (they are broken apart when the portfolio is looked through).
 */
export async function portfolioFromInput(text: string, totalUsd: number): Promise<{ portfolio: Portfolio } | { problem: InputProblem }> {
  const tickers = parseTickerInput(text)
  if (!tickers.length) return { problem: { kind: 'empty' } }
  if (!(totalUsd > 0)) return { problem: { kind: 'amount' } }

  const securities = await provider.getSecurities(tickers)
  const known = new Set(securities.map((s) => s.ticker))
  const unknown = tickers.find((t) => !known.has(t))
  if (unknown) return { problem: { kind: 'unknown', ticker: unknown, suggestion: await suggestionFor(unknown) } }

  if (securities.length === 1 && securities[0].kind === 'etf') {
    // The fund arrives with shares worked out from seeded prices, so resizing keeps them right.
    const fund = await provider.getFund(securities[0].ticker)
    if (fund) return { portfolio: resizePortfolio(fund, totalUsd) }
  }
  // Keep the order the user typed.
  const ordered = tickers.map((t) => securities.find((s) => s.ticker === t)!)
  return { portfolio: buildTickerPortfolio(ordered, totalUsd) }
}

/**
 * The closest known ticker. The provider has no "list everything", so candidates come from
 * searches: the whole word, its prefixes, and each letter and pair of letters in it (which
 * catches a wrong first letter). Each search returns at most eight results, so a small company
 * can still be missed.
 */
async function suggestionFor(unknown: string): Promise<string | null> {
  const pieces = [unknown, unknown.slice(0, 3), unknown.slice(0, 2)]
  for (let i = 0; i < unknown.length; i++) pieces.push(unknown[i], unknown.slice(i, i + 2))
  const found = (await Promise.all([...new Set(pieces)].map((q) => provider.searchSecurities(q)))).flat()
  return closestTicker(unknown, [...new Set(found.map((s) => s.ticker))])
}

/** A portfolio looked through to its companies, with their tags: everything a count needs. */
export interface Inspection {
  portfolio: Portfolio
  rows: CompanyRow[]
  tags: ValuesTag[]
}

export async function inspect(portfolio: Portfolio): Promise<Inspection> {
  const { funds, tags } = await loadPortfolioDetails(portfolio)
  return { portfolio, rows: lookThrough(portfolio, funds), tags }
}

/** The one-line count for the selected categories. No provider call: toggling a chip is instant. */
export function countConflicts({ portfolio, rows, tags }: Pick<Inspection, 'portfolio' | 'rows' | 'tags'>, selected: CategoryId[]): ConflictSummary {
  const flagged = totalFlagged(rows, tags, selected)
  return { count: flagged.count, usd: flagged.usd, totalUsd: portfolio.totalUsd, holdings: rows.length }
}

export const summarize = async (portfolio: Portfolio, selected: CategoryId[]) => countConflicts(await inspect(portfolio), selected)

/** The sample tickers as text the user can correct, for the screenshot stub. */
export async function tickersFromScreenshot(image: Blob): Promise<string> {
  return (await provider.parseScreenshot(image)).map((h) => h.ticker).join(', ')
}
