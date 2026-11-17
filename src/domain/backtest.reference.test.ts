// PRD F3: "results equal the output of the reference back-test script for the same inputs".
//
// The fixture is written by scripts/data/backtest_reference.py, an independent pandas
// implementation. It is a PLACEHOLDER for the team's verified script, which was not available.
// If this test fails after the reference changes: a bug in the TypeScript gets fixed here; a
// difference that comes from the data or the method gets reported to the team, not forced.
import { SeededProvider } from '@/data/seeded'
import type { Exclusions, Portfolio } from '@/types'
import { describe, expect, it } from 'vitest'
import reference from './__fixtures__/backtest_reference.json'
import { pointsDifference } from './backtest'

const provider = new SeededProvider(0)

async function portfolioFor(name: string): Promise<Portfolio> {
  if (name === 'SPY') return (await provider.getFund('SPY')) as Portfolio
  return provider.getSamplePortfolio(name as 'sample' | 'connected')
}

/** Equal to 9 significant figures: far tighter than anything shown on screen. */
const expectSame = (actual: number, expected: number, what: string) => {
  expect(Math.abs(actual - expected), `${what}: ${actual} vs ${expected}`).toBeLessThanOrEqual(Math.max(Math.abs(expected), 1) * 1e-9)
}

describe('back-test against the reference script', () => {
  it('covers the scenarios in the demo script', () => {
    const labels = reference.scenarios.map((s) => `${s.portfolio}: ${s.label}`)
    expect(labels).toContain('SPY: exclude all seven')
    expect(labels).toContain('SPY: exclude fossil_fuels')
    expect(labels.length).toBeGreaterThanOrEqual(15)
  })

  for (const scenario of reference.scenarios) {
    it(`${scenario.portfolio}: ${scenario.label}`, async () => {
      const result = await provider.getBacktest(await portfolioFor(scenario.portfolio), scenario.exclusions as Exclusions)
      expect(result.dates[0]).toBe(reference.meta.window[0])
      expect(result.dates.at(-1)).toBe(reference.meta.window[1])
      for (const series of ['original', 'filtered', 'benchmark'] as const) {
        expectSame(result.annualizedPct[series], scenario.annualizedPct[series], `annualized ${series}`)
        expectSame(result[series].at(-1)!, scenario.endUsd[series], `end value ${series}`)
      }
      for (const [index, value] of Object.entries(scenario.checkpoints)) expectSame(result.filtered[Number(index)], value, `filtered on day ${index}`)
    })
  }

  it('tracks the S&P 500 exactly for an untouched SPY portfolio', async () => {
    const result = await provider.getBacktest((await provider.getFund('SPY')) as Portfolio, { categories: [], tickers: [], swaps: {} })
    expect(result.original).toEqual(result.benchmark)
    expect(result.filtered).toEqual(result.original)
  })

  // The PRD records what past runs showed. These are expectations to report on, not limits to
  // enforce, so they are logged rather than asserted.
  it('reports the drag against the PRD’s expected ranges', async () => {
    const spy = (await provider.getFund('SPY')) as Portfolio
    const featured = ['defense', 'fossil_fuels', 'private_prisons', 'tobacco', 'alcohol', 'gambling', 'animal_testing']
    const all = pointsDifference(await provider.getBacktest(spy, { categories: featured, tickers: [], swaps: {} }))
    const single = await Promise.all(featured.map(async (c) => [c, pointsDifference(await provider.getBacktest(spy, { categories: [c], tickers: [], swaps: {} }))] as const))
    const outside = single.filter(([, points]) => Math.abs(points) > 0.5).map(([c, points]) => `${c} ${points.toFixed(2)}`)
    console.info(`SPY, all seven excluded: ${all.toFixed(2)} points a year (PRD expects within 1.5).`)
    console.info(`SPY, one category at a time: ${outside.length ? `outside the expected 0.5 points: ${outside.join(', ')}` : 'all within 0.5 points'}.`)
    expect(Number.isFinite(all)).toBe(true)
  })

  it('recalculates in well under 300 ms', async () => {
    const spy = (await provider.getFund('SPY')) as Portfolio
    await provider.getBacktest(spy, { categories: [], tickers: [], swaps: {} }) // prices are loaded once
    const started = performance.now()
    await provider.getBacktest(spy, { categories: ['fossil_fuels', 'tobacco'], tickers: ['AAPL'], swaps: {} })
    expect(performance.now() - started).toBeLessThan(300)
  })
})
