import { SeededProvider } from '@/data/seeded'
import fundsFile from '@/data/seed/generated/funds.json'
import type { Portfolio, ValuesTag } from '@/types'
import { beforeAll, describe, expect, it } from 'vitest'
import { categoriesByTicker, exposureByCategory, largestExposure, totalFlagged } from './exposure'
import { lookThrough, type CompanyRow } from './portfolio'

const FEATURED = ['defense', 'fossil_fuels', 'private_prisons', 'tobacco', 'alcohol', 'gambling', 'animal_testing']
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)

describe('exposure for SPY at $10,000, checked by hand arithmetic from the seed (PRD F2)', () => {
  // The companies in SPY that the seed tags in each category, written out by hand.
  // Expected dollars = $10,000 x the sum of those companies' weights in funds.json.
  const BY_HAND: Record<string, string[]> = {
    defense: ['LMT', 'RTX', 'NOC', 'GD', 'BA'],
    fossil_fuels: ['XOM', 'CVX', 'COP', 'SLB', 'EOG', 'OXY'],
    private_prisons: [], // GEO and CXW are not in the S&P 500 sample
    tobacco: ['PM', 'MO'],
    alcohol: ['STZ', 'TAP'],
    gambling: ['LVS', 'WYNN', 'MGM', 'CZR'],
    animal_testing: ['JNJ', 'PFE'],
  }
  const weightOf = Object.fromEntries(fundsFile.funds.SPY.holdings.map((h) => [h.ticker, h.weight]))

  const provider = new SeededProvider(0)
  let rows: CompanyRow[]
  let tags: ValuesTag[]

  beforeAll(async () => {
    const spy = (await provider.getFund('SPY')) as Portfolio
    expect(spy.totalUsd).toBe(10_000)
    rows = lookThrough(spy, {})
    tags = await provider.getTags(rows.map((r) => r.ticker))
  })

  it('reproduces dollars, share and count for every featured category', () => {
    const exposures = exposureByCategory(rows, tags, FEATURED)
    expect(exposures.map((e) => e.category)).toEqual(FEATURED)
    for (const exposure of exposures) {
      const tickers = BY_HAND[exposure.category]
      for (const ticker of tickers) expect(weightOf[ticker], `${ticker} is in SPY`).toBeGreaterThan(0)
      const expectedUsd = 10_000 * sum(tickers.map((t) => weightOf[t]))
      expect(exposure.usd, exposure.category).toBeCloseTo(expectedUsd, 8)
      expect(exposure.share, exposure.category).toBeCloseTo(expectedUsd / 10_000, 12)
      expect(exposure.count, exposure.category).toBe(tickers.length)
    }
  })

  it('names the three largest contributors in each category, largest first', () => {
    for (const exposure of exposureByCategory(rows, tags, FEATURED)) {
      // Equal weights (WYNN and MGM round to the same six decimals) are listed alphabetically.
      const expected = [...BY_HAND[exposure.category]].sort((a, b) => weightOf[b] - weightOf[a] || a.localeCompare(b)).slice(0, 3)
      expect(exposure.top.map((c) => c.ticker), exposure.category).toEqual(expected)
      for (const contributor of exposure.top) expect(contributor.usd).toBeCloseTo(10_000 * weightOf[contributor.ticker], 8)
    }
  })

  it('counts each flagged holding once in the total', () => {
    const everyone = [...new Set(Object.values(BY_HAND).flat())]
    const total = totalFlagged(rows, tags, FEATURED)
    expect(total.count).toBe(everyone.length)
    expect(total.usd).toBeCloseTo(10_000 * sum(everyone.map((t) => weightOf[t])), 8)
    expect(total.share).toBeCloseTo(total.usd / 10_000, 12)
    expect([...total.tickers].sort()).toEqual([...everyone].sort())
  })

  it('names the largest category for the headline', () => {
    const largest = largestExposure(exposureByCategory(rows, tags, FEATURED))
    expect(largest?.category).toBe('fossil_fuels')
  })

  it('only counts the categories the user selected', () => {
    const two = ['tobacco', 'alcohol']
    expect(exposureByCategory(rows, tags, two).map((e) => e.category)).toEqual(two)
    const total = totalFlagged(rows, tags, two)
    expect(total.count).toBe(4)
    expect(total.usd).toBeCloseTo(10_000 * sum(['PM', 'MO', 'STZ', 'TAP'].map((t) => weightOf[t])), 8)
    expect(totalFlagged(rows, tags, []).count).toBe(0)
  })
})

describe('exposure rules', () => {
  const row = (ticker: string, valueUsd: number): CompanyRow => ({ ticker, weight: valueUsd / 1_000, valueUsd, slices: [{ via: null, weight: valueUsd / 1_000 }] })
  const tag = (ticker: string, category: string, strength: 1 | 2 | 3 = 3): ValuesTag => ({ ticker, category, strength, reason: 'test', sourceUrl: 'https://example.com' })
  const rows = [row('AAA', 500), row('BBB', 300), row('CCC', 200)]
  const tags = [tag('AAA', 'x'), tag('AAA', 'y', 1), tag('BBB', 'y')]

  it('counts a holding tagged in several categories in each of them, at full position value whatever the strength', () => {
    const [x, y] = exposureByCategory(rows, tags, ['x', 'y'])
    expect(x).toMatchObject({ usd: 500, share: 0.5, count: 1 })
    expect(y).toMatchObject({ usd: 800, share: 0.8, count: 2 })
    expect(y.top.map((c) => c.ticker)).toEqual(['AAA', 'BBB'])
  })

  it('counts that holding once in the total', () => {
    expect(totalFlagged(rows, tags, ['x', 'y'])).toMatchObject({ usd: 800, share: 0.8, count: 2 })
  })

  it('lists a ticker’s categories in the order the user selected them', () => {
    expect(categoriesByTicker(tags, ['y', 'x']).get('AAA')).toEqual(['y', 'x'])
    expect(categoriesByTicker(tags, ['x']).has('BBB')).toBe(false)
  })

  it('returns zeros for a category nobody is tagged in, and no largest when nothing is flagged', () => {
    const [none] = exposureByCategory(rows, tags, ['z'])
    expect(none).toEqual({ category: 'z', usd: 0, share: 0, count: 0, top: [] })
    expect(largestExposure([none])).toBeNull()
    expect(exposureByCategory([], tags, ['x'])[0].share).toBe(0)
  })
})
