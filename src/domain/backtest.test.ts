import type { Exclusions, Portfolio, ValuesTag } from '@/types'
import { describe, expect, it } from 'vitest'
import { START_USD, annualizedPct, backtestPortfolio, filteredMix, growthSeries, originalMix, pointsDifference, runBacktest, type PriceSeries } from './backtest'
import type { FundMap } from './portfolio'

// Four days of made-up prices that are easy to check by hand.
//   UP doubles in two steps, FLAT never moves, DOWN halves, FUND = 50% UP + 50% DOWN each day.
const dailyReturns = { UP: [0.5, 1 / 3, 0], FLAT: [0, 0, 0], DOWN: [-0.2, -0.375, 0], BENCH: [0.1, 0.1, 0.1] }
const closes = (returns: number[], start = 100) => returns.reduce((list, r) => [...list, list[list.length - 1] * (1 + r)], [start])
const fundReturns = dailyReturns.UP.map((r, i) => 0.5 * r + 0.5 * dailyReturns.DOWN[i])
const prices: PriceSeries = {
  dates: ['2025-01-01', '2025-07-02', '2026-01-01', '2027-01-01'],
  closes: { UP: closes(dailyReturns.UP), FLAT: closes(dailyReturns.FLAT), DOWN: closes(dailyReturns.DOWN), BENCH: closes(dailyReturns.BENCH), FUND: closes(fundReturns, 50) },
}
const FUNDS: FundMap = {
  FUND: [
    { ticker: 'UP', weight: 0.5 },
    { ticker: 'DOWN', weight: 0.5 },
  ],
}
const tag = (ticker: string, category: string): ValuesTag => ({ ticker, category, strength: 3, reason: 'test', sourceUrl: 'https://example.com' })
const none: Exclusions = { categories: [], tickers: [], swaps: {} }
const portfolio = (weights: Record<string, number>): Portfolio => ({
  id: 'p',
  name: 'p',
  totalUsd: 10_000,
  origin: 'tickers',
  holdings: Object.entries(weights).map(([ticker, weight]) => ({ ticker, weight, valueUsd: weight * 10_000, shares: 1 })),
})
const product = (returns: number[]) => returns.reduce((value, r) => value * (1 + r), START_USD)

describe('growthSeries', () => {
  it('starts at $10,000 and compounds the weighted daily return (daily rebalance)', () => {
    const series = growthSeries({ UP: 0.5, FLAT: 0.5 }, prices)
    expect(series[0]).toBe(10_000)
    expect(series[1]).toBeCloseTo(10_000 * 1.25, 9) // half of +50%
    expect(series[2]).toBeCloseTo(10_000 * 1.25 * (1 + 1 / 6), 9) // half of +33.3%
    expect(series[3]).toBeCloseTo(series[2], 9)
  })

  it('follows a single ticker exactly', () => {
    expect(growthSeries({ UP: 1 }, prices)).toEqual([10_000, 15_000, 20_000, 20_000].map((v) => expect.closeTo(v, 9)))
  })

  it('normalizes weights that do not sum to 1', () => {
    expect(growthSeries({ UP: 2, FLAT: 2 }, prices)).toEqual(growthSeries({ UP: 0.5, FLAT: 0.5 }, prices))
  })

  it('is a flat line for an empty mix (cash)', () => {
    expect(growthSeries({}, prices)).toEqual([10_000, 10_000, 10_000, 10_000])
  })

  it('refuses a ticker with no price history, or a short one, instead of treating it as zero', () => {
    expect(() => growthSeries({ NOPE: 1 }, prices)).toThrow('No price history for NOPE')
    const short = { ...prices, closes: { ...prices.closes, UP: [100, 150] } }
    expect(() => growthSeries({ UP: 1 }, short)).toThrow('Price history for UP has 2 points, expected 4')
  })

  it('counts a gap in the prices as no move that day', () => {
    const gappy = { ...prices, closes: { ...prices.closes, UP: [100, 0, 200, 200] } }
    const series = growthSeries({ UP: 0.5, FLAT: 0.5 }, gappy)
    expect(series.every((value) => Number.isFinite(value))).toBe(true)
    expect(series[2]).toBe(series[1]) // 0 -> 200 is not a real return
  })
})

describe('annualizedPct', () => {
  it('is the compound annual growth rate over the calendar span', () => {
    // $10,000 -> $20,000 over exactly two years (2 x 365.25 days) is sqrt(2) - 1 a year.
    expect(annualizedPct([10_000, 20_000], ['2025-01-01T00:00:00Z', '2027-01-01T12:00:00Z'])).toBeCloseTo((Math.SQRT2 - 1) * 100, 9)
    expect(annualizedPct([10_000, 11_000], ['2025-01-01', '2026-01-01'])).toBeCloseTo(10, 1)
    expect(annualizedPct([10_000, 10_000], ['2025-01-01', '2026-01-01'])).toBe(0)
  })

  it('is 0 for a series too short to measure', () => {
    expect(annualizedPct([10_000], ['2025-01-01'])).toBe(0)
    expect(annualizedPct([], [])).toBe(0)
  })
})

describe('originalMix and filteredMix', () => {
  it('back-tests a fund on its own price series', () => {
    expect(originalMix(portfolio({ FUND: 0.6, FLAT: 0.4 }), FUNDS)).toEqual({ FUND: 0.6, FLAT: 0.4 })
  })

  it('leaves the mix alone when nothing is excluded', () => {
    const p = portfolio({ FUND: 0.6, FLAT: 0.4 })
    expect(filteredMix(p, FUNDS, [], none)).toEqual(originalMix(p, FUNDS))
  })

  it('takes an excluded company’s slice back out of a fund and spreads its weight pro rata', () => {
    // FUND 60% (so DOWN is 30% of the portfolio), FLAT 40%. Exclude DOWN.
    // Remaining: UP-in-FUND 30% + FLAT 40% = 70%; scale = 1 / 0.7.
    const mix = filteredMix(portfolio({ FUND: 0.6, FLAT: 0.4 }), FUNDS, [], { ...none, tickers: ['DOWN'] })
    expect(mix.FUND).toBeCloseTo(0.6 / 0.7, 12)
    expect(mix.DOWN).toBeCloseTo(-0.3 / 0.7, 12)
    expect(mix.FLAT).toBeCloseTo(0.4 / 0.7, 12)
    expect(Object.values(mix).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12)
    // Same thing as holding what is left directly: 3/7 UP and 4/7 FLAT.
    const series = growthSeries(mix, prices)
    const direct = growthSeries({ UP: 3 / 7, FLAT: 4 / 7 }, prices)
    series.forEach((value, i) => expect(value).toBeCloseTo(direct[i], 8))
  })

  it('excludes by category, from funds and from direct holdings alike', () => {
    const mix = filteredMix(portfolio({ FUND: 0.5, DOWN: 0.25, FLAT: 0.25 }), FUNDS, [tag('DOWN', 'bad')], { ...none, categories: ['bad'] })
    // DOWN leaves: 25% direct + 25% inside FUND. Remaining 50% scales by 2.
    expect(mix).toEqual({ FUND: expect.closeTo(1, 12), DOWN: expect.closeTo(-0.5, 12), FLAT: expect.closeTo(0.5, 12) })
  })

  it('gives a swapped holding’s whole weight to its alternative', () => {
    const mix = filteredMix(portfolio({ UP: 0.5, DOWN: 0.3, FLAT: 0.2 }), {}, [], { ...none, tickers: ['DOWN'], swaps: { DOWN: 'BENCH' } })
    expect(mix).toEqual({ UP: 0.5, FLAT: 0.2, BENCH: 0.3 })
  })

  it('ignores a swap into a fund the portfolio holds', () => {
    const p = portfolio({ FUND: 0.6, FLAT: 0.4 })
    const withSwap = filteredMix(p, FUNDS, [], { ...none, tickers: ['DOWN'], swaps: { DOWN: 'FUND' } })
    expect(withSwap).toEqual(filteredMix(p, FUNDS, [], { ...none, tickers: ['DOWN'] }))
  })

  it('is empty (cash) when everything is excluded', () => {
    expect(filteredMix(portfolio({ UP: 0.5, DOWN: 0.5 }), {}, [], { ...none, tickers: ['UP', 'DOWN'] })).toEqual({})
  })

  it('handles a fund-origin portfolio', () => {
    const fund: Portfolio = { id: 'FUND', name: 'Fund', totalUsd: 10_000, origin: 'fund', holdings: FUNDS.FUND.map((c) => ({ ...c, valueUsd: 5_000, shares: 1 })) }
    expect(originalMix(fund, FUNDS)).toEqual({ FUND: 1 })
    const mix = filteredMix(fund, FUNDS, [], { ...none, tickers: ['DOWN'] })
    expect(mix).toEqual({ FUND: expect.closeTo(2, 12), DOWN: expect.closeTo(-1, 12) })
    // The fund without DOWN is just UP.
    growthSeries(mix, prices).forEach((value, i) => expect(value).toBeCloseTo(growthSeries({ UP: 1 }, prices)[i], 8))
  })
})

describe('runBacktest', () => {
  it('returns the three series, their annualized returns and the difference in points', () => {
    const p = portfolio({ UP: 0.5, DOWN: 0.5 })
    const result = backtestPortfolio(p, {}, [], { ...none, tickers: ['DOWN'] }, prices, 'BENCH')
    expect(result.dates).toBe(prices.dates)
    expect(result.original.at(-1)).toBeCloseTo(product(fundReturns), 8)
    expect(result.filtered.at(-1)).toBeCloseTo(20_000, 8)
    expect(result.benchmark.at(-1)).toBeCloseTo(10_000 * 1.1 ** 3, 8)
    expect(result.annualizedPct.filtered).toBeCloseTo((Math.SQRT2 - 1) * 100, 1)
    expect(pointsDifference(result)).toBeCloseTo(result.annualizedPct.filtered - result.annualizedPct.original, 12)
    expect(pointsDifference(result)).toBeGreaterThan(0)
  })

  it('gives identical original and filtered series when nothing is excluded', () => {
    const mix = { UP: 0.5, FLAT: 0.5 }
    const result = runBacktest(mix, mix, prices, 'BENCH')
    expect(result.filtered).toEqual(result.original)
    expect(pointsDifference(result)).toBe(0)
  })

  it('is deterministic', () => {
    const run = () => backtestPortfolio(portfolio({ FUND: 0.6, FLAT: 0.4 }), FUNDS, [], { ...none, tickers: ['DOWN'] }, prices, 'BENCH')
    expect(run()).toEqual(run())
  })
})
