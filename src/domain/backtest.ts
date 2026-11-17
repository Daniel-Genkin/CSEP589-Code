// Back-test math, a port of the reference script (scripts/data/backtest_reference.py).
//
// Method
//   * A position is a stock or a fund held as one unit. A fund is back-tested on its own price
//     history, so an untouched SPY position tracks the S&P 500 exactly.
//   * Excluding a company held inside a fund takes that company's slice out of the fund's
//     return: fund return minus (weight in fund x company return).
//   * Each excluded holding's weight goes to its swapped-in alternative, or is spread pro rata
//     across everything that remains.
//   * Weights are fixed targets, rebalanced every trading day, so a portfolio's daily return is
//     the weighted sum of daily returns. Growth compounds from $10,000.
//   * Annualized return is the compound annual growth rate over the calendar span of the prices.
// Nothing is randomized or tuned.
import type { BacktestResult, Exclusions, Portfolio, ValuesTag } from '@/types'
import { planRedistribution } from './exclusions'
import { type FundMap, constituentsOf, fundsIn, lookThrough, positionsOf } from './portfolio'

export interface PriceSeries {
  /** ISO dates, oldest first */
  dates: string[]
  /** ticker -> adjusted closes, aligned with `dates` */
  closes: Record<string, number[]>
}

/**
 * A portfolio as a weighted mix of price series. Weights sum to 1. A negative weight takes an
 * excluded company's slice back out of a fund that holds it.
 */
export type Mix = Record<string, number>

export const START_USD = 10_000
const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000

const add = (mix: Mix, ticker: string, weight: number) => {
  if (weight !== 0) mix[ticker] = (mix[ticker] ?? 0) + weight
}

/** The portfolio as held: every position on its own price series. */
export function originalMix(portfolio: Portfolio, funds: FundMap): Mix {
  const mix: Mix = {}
  for (const position of positionsOf(portfolio, funds)) add(mix, position.ticker, position.weight)
  return mix
}

/** The portfolio after the what-if. Empty when everything was excluded and nothing swapped in (all cash). */
export function filteredMix(portfolio: Portfolio, funds: FundMap, tags: ValuesTag[], exclusions: Exclusions): Mix {
  const rows = lookThrough(portfolio, funds)
  const { excluded, swaps, scale, swapScale } = planRedistribution(rows, tags, exclusions, fundsIn(portfolio, funds))
  if (!excluded.size) return originalMix(portfolio, funds)

  const mix: Mix = {}
  for (const position of positionsOf(portfolio, funds)) {
    if (!position.isFund) {
      if (!excluded.has(position.ticker)) add(mix, position.ticker, position.weight * scale)
      continue
    }
    // The fund on its own prices, minus the slice of each excluded company inside it.
    add(mix, position.ticker, position.weight * scale)
    for (const c of constituentsOf(portfolio, funds, position.ticker)) {
      if (excluded.has(c.ticker)) add(mix, c.ticker, -position.weight * c.weight * scale)
    }
  }
  for (const row of rows) {
    const to = swaps[row.ticker]
    if (to) add(mix, to, row.weight * swapScale)
  }
  // Rounding can leave a hair of weight on a ticker that cancels out exactly.
  for (const ticker of Object.keys(mix)) if (Math.abs(mix[ticker]) < 1e-12) delete mix[ticker]
  return mix
}

/**
 * Growth of `startUsd` held in `mix`, one value per date. The mix is normalized to sum to 1.
 * An empty mix is cash: a flat line. A ticker with no price history is an error, not a silent zero.
 */
export function growthSeries(mix: Mix, prices: PriceSeries, startUsd = START_USD): number[] {
  const tickers = Object.keys(mix)
  const total = tickers.reduce((sum, t) => sum + mix[t], 0)
  const n = prices.dates.length
  const out = new Array<number>(n).fill(startUsd)
  if (!tickers.length || !(total > 0)) return out

  const series = tickers.map((t) => {
    const closes = prices.closes[t]
    if (!closes) throw new Error(`No price history for ${t}`)
    if (closes.length !== n) throw new Error(`Price history for ${t} has ${closes.length} points, expected ${n}`)
    return { closes, weight: mix[t] / total }
  })
  for (let i = 1; i < n; i++) {
    let daily = 0
    for (const { closes, weight } of series) {
      // A gap in the prices counts as no move that day, as in the reference script.
      const move = closes[i] / closes[i - 1] - 1
      if (Number.isFinite(move)) daily += weight * move
    }
    out[i] = out[i - 1] * (1 + daily)
  }
  return out
}

/** Compound annual growth rate, in percent, over the calendar span of the series. */
export function annualizedPct(values: number[], dates: string[]): number {
  if (values.length < 2 || !(values[0] > 0)) return 0
  const years = (Date.parse(dates[dates.length - 1]) - Date.parse(dates[0])) / MS_PER_YEAR
  if (!(years > 0)) return 0
  return (Math.pow(values[values.length - 1] / values[0], 1 / years) - 1) * 100
}

/** The three series the What-if screen charts, and their annualized returns. */
export function runBacktest(original: Mix, filtered: Mix, prices: PriceSeries, benchmark: string): BacktestResult {
  const originalSeries = growthSeries(original, prices)
  const filteredSeries = growthSeries(filtered, prices)
  const benchmarkSeries = growthSeries({ [benchmark]: 1 }, prices)
  return {
    dates: prices.dates,
    original: originalSeries,
    filtered: filteredSeries,
    benchmark: benchmarkSeries,
    annualizedPct: {
      original: annualizedPct(originalSeries, prices.dates),
      filtered: annualizedPct(filteredSeries, prices.dates),
      benchmark: annualizedPct(benchmarkSeries, prices.dates),
    },
  }
}

/** Back-test a portfolio and its what-if version against the benchmark. */
export function backtestPortfolio(portfolio: Portfolio, funds: FundMap, tags: ValuesTag[], exclusions: Exclusions, prices: PriceSeries, benchmark: string): BacktestResult {
  return runBacktest(originalMix(portfolio, funds), filteredMix(portfolio, funds, tags, exclusions), prices, benchmark)
}

/** Signed difference in points per year: filtered minus original. */
export const pointsDifference = (result: BacktestResult) => result.annualizedPct.filtered - result.annualizedPct.original
