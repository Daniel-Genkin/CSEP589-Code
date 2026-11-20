import { SeededProvider } from '@/data/seeded'
import type { Exclusions, Portfolio, ValuesTag } from '@/types'
import { describe, expect, it } from 'vitest'
import { NO_EXCLUSIONS, activeSwaps, applyExclusions, excludedTickers, exclusionReasons, filteredRows, hasExclusions, planRedistribution, weightsOf } from './exclusions'
import { exposureByCategory } from './exposure'
import { lookThrough, type CompanyRow } from './portfolio'

const FEATURED = ['defense', 'fossil_fuels', 'private_prisons', 'tobacco', 'alcohol', 'gambling', 'animal_testing']
const row = (ticker: string, weight: number): CompanyRow => ({ ticker, weight, valueUsd: weight * 10_000, slices: [{ via: null, weight }] })
const tag = (ticker: string, category: string): ValuesTag => ({ ticker, category, strength: 3, reason: 'test', sourceUrl: 'https://example.com' })
const ex = (patch: Partial<Exclusions>): Exclusions => ({ ...NO_EXCLUSIONS, ...patch })
const total = (weights: Record<string, number>) => Object.values(weights).reduce((a, b) => a + b, 0)

// A: 40% (oil), B: 30% (oil, arms), C: 20%, D: 10%
const rows = [row('A', 0.4), row('B', 0.3), row('C', 0.2), row('D', 0.1)]
const tags = [tag('A', 'oil'), tag('B', 'oil'), tag('B', 'arms'), tag('Z', 'oil')]

describe('excludedTickers', () => {
  it('excludes companies tagged in an excluded category and companies excluded by ticker', () => {
    expect([...excludedTickers(rows, tags, ex({ categories: ['oil'] }))]).toEqual(['A', 'B'])
    expect([...excludedTickers(rows, tags, ex({ categories: ['arms'], tickers: ['D'] }))]).toEqual(['B', 'D'])
  })

  it('ignores tickers the portfolio does not hold', () => {
    expect([...excludedTickers(rows, tags, ex({ tickers: ['Z', 'NOPE'] }))]).toEqual([])
  })

  it('knows whether anything is excluded and why', () => {
    expect(hasExclusions(NO_EXCLUSIONS)).toBe(false)
    expect(hasExclusions(ex({ tickers: ['A'] }))).toBe(true)
    expect(exclusionReasons('B', tags, ex({ categories: ['oil', 'arms'] }))).toEqual(['oil', 'arms'])
    expect(exclusionReasons('C', tags, ex({ tickers: ['C'] }))).toEqual(['ticker'])
    expect(exclusionReasons('C', tags, ex({ categories: ['oil'] }))).toEqual([])
  })
})

describe('applyExclusions', () => {
  it('returns the original weights when nothing is excluded', () => {
    expect(applyExclusions(rows, tags, NO_EXCLUSIONS)).toEqual(weightsOf(rows))
  })

  it('redistributes excluded weight pro rata across what remains', () => {
    // Drop D (10%). The other 90% scales by 1/0.9.
    const weights = applyExclusions(rows, tags, ex({ tickers: ['D'] }))
    expect(Object.keys(weights)).toEqual(['A', 'B', 'C'])
    expect(weights.A).toBeCloseTo(0.4 / 0.9, 12)
    expect(weights.B).toBeCloseTo(0.3 / 0.9, 12)
    expect(weights.C).toBeCloseTo(0.2 / 0.9, 12)
    expect(total(weights)).toBeCloseTo(1, 12)
    // Proportions between survivors are unchanged.
    expect(weights.A / weights.B).toBeCloseTo(0.4 / 0.3, 12)
  })

  it('drops a whole category', () => {
    const weights = applyExclusions(rows, tags, ex({ categories: ['oil'] }))
    expect(weights).toEqual({ C: expect.closeTo(2 / 3, 12), D: expect.closeTo(1 / 3, 12) })
  })

  it('gives a swapped holding’s weight to its alternative instead of spreading it', () => {
    // Oil out: A (40%) is swapped for X, B (30%) is spread over C and D.
    const weights = applyExclusions(rows, tags, ex({ categories: ['oil'], swaps: { A: 'X' } }))
    expect(weights.X).toBeCloseTo(0.4, 12)
    expect(weights.C).toBeCloseTo(0.2 * (0.6 / 0.3), 12)
    expect(weights.D).toBeCloseTo(0.1 * (0.6 / 0.3), 12)
    expect(total(weights)).toBeCloseTo(1, 12)
  })

  it('adds a swap to an alternative the portfolio already holds', () => {
    const weights = applyExclusions(rows, tags, ex({ tickers: ['D'], swaps: { D: 'C' } }))
    expect(weights).toEqual({ A: expect.closeTo(0.4, 12), B: expect.closeTo(0.3, 12), C: expect.closeTo(0.3, 12) })
  })

  it('ignores a swap whose holding is not excluded or whose alternative is itself excluded', () => {
    expect(activeSwaps(rows, tags, ex({ swaps: { C: 'X' } }))).toEqual({})
    expect(activeSwaps(rows, tags, ex({ categories: ['oil'], swaps: { A: 'B' } }))).toEqual({})
    expect(activeSwaps(rows, tags, ex({ categories: ['oil'], swaps: { A: 'Z' } }))).toEqual({}) // Z is oil too
    expect(activeSwaps(rows, tags, ex({ categories: ['oil'], tickers: ['X'], swaps: { A: 'X' } }))).toEqual({})
    expect(applyExclusions(rows, tags, ex({ swaps: { C: 'X' } }))).toEqual(weightsOf(rows))
  })

  it('never swaps into a fund the portfolio holds, or into the holding itself', () => {
    expect(activeSwaps(rows, tags, ex({ tickers: ['D'], swaps: { D: 'FUND' } }), ['FUND'])).toEqual({})
    expect(activeSwaps(rows, tags, ex({ tickers: ['D'], swaps: { D: 'D' } }))).toEqual({})
    expect(applyExclusions(rows, tags, ex({ tickers: ['D'], swaps: { D: 'FUND' } }), ['FUND'])).not.toHaveProperty('FUND')
  })

  it('describes the redistribution once, for weights, back-test and trades alike', () => {
    const plan = planRedistribution(rows, tags, ex({ categories: ['oil'], swaps: { A: 'X' } }))
    expect([...plan.excluded]).toEqual(['A', 'B'])
    expect(plan.swaps).toEqual({ A: 'X' })
    expect(plan.remaining).toBeCloseTo(0.3, 12)
    expect(plan.swapped).toBeCloseTo(0.4, 12)
    expect(plan.unswapped).toBeCloseTo(0.3, 12)
    expect(plan.scale).toBeCloseTo(2, 12)
    expect(plan.swapScale).toBe(1)
    expect(planRedistribution(rows, tags, NO_EXCLUSIONS)).toMatchObject({ remaining: expect.closeTo(1, 12), swapped: 0, unswapped: 0, scale: 1, swapScale: 1 })
  })

  it('lists the companies left after the what-if, with dollars, largest first', () => {
    const after = filteredRows(rows, tags, ex({ categories: ['oil'], swaps: { A: 'X' } }), 10_000)
    expect(after.map((r) => r.ticker)).toEqual(['C', 'X', 'D'])
    expect(after.map((r) => r.valueUsd)).toEqual([4_000, 4_000, 2_000].map((v) => expect.closeTo(v, 6)))
    expect(after.reduce((sum, r) => sum + r.valueUsd, 0)).toBeCloseTo(10_000, 6)
    expect(filteredRows(rows, tags, NO_EXCLUSIONS, 10_000).map((r) => r.ticker)).toEqual(['A', 'B', 'C', 'D'])
  })

  it('is empty when everything is excluded and nothing is swapped in', () => {
    expect(applyExclusions(rows, tags, ex({ tickers: ['A', 'B', 'C', 'D'] }))).toEqual({})
  })

  it('lets swapped-in names take everything when nothing else remains', () => {
    const weights = applyExclusions(rows, tags, ex({ tickers: ['A', 'B', 'C', 'D'], swaps: { A: 'X' } }))
    expect(weights).toEqual({ X: expect.closeTo(1, 12) })
  })
})

describe('exclusions on the seed', () => {
  const provider = new SeededProvider(0)

  it('leaves $0 of exposure to every excluded category and keeps weights at 100% (PRD F3)', async () => {
    const spy = (await provider.getFund('SPY')) as Portfolio
    const before = lookThrough(spy, {})
    const tags = await provider.getTags(before.map((r) => r.ticker))
    const weights = applyExclusions(before, tags, ex({ categories: FEATURED }))
    expect(total(weights)).toBeCloseTo(1, 10)

    const after = Object.entries(weights).map(([ticker, weight]) => row(ticker, weight))
    for (const exposure of exposureByCategory(after, tags, FEATURED)) expect(exposure.usd, exposure.category).toBe(0)
    // 21 flagged companies leave the 60.
    expect(after).toHaveLength(39)
  })

  it('carries category exclusions to the connected portfolio and applies ticker exclusions only to holdings it contains (PRD F7)', async () => {
    const connected = await provider.getSamplePortfolio('connected')
    const funds = Object.fromEntries(await Promise.all(['VOO', 'VTI'].map(async (t) => [t, (await provider.getFund(t))!.holdings])))
    const before = lookThrough(connected, funds)
    const tags = await provider.getTags(before.map((r) => r.ticker))
    const excluded = excludedTickers(before, tags, ex({ categories: ['tobacco'], tickers: ['TSLA', 'UEC'] }))
    expect(excluded.has('PM')).toBe(true) // held directly
    expect(excluded.has('MO')).toBe(true) // held only through the funds
    expect(excluded.has('TSLA')).toBe(true)
    expect(excluded.has('UEC')).toBe(false) // not in this portfolio
  })
})
