import { lookThrough } from '@/domain/portfolio'
import type { Portfolio } from '@/types'
import { describe, expect, it } from 'vitest'
import { countConflicts, inspect, portfolioFromInput, summarize, tickersFromScreenshot } from './useHoldingsCheck'
import { loadPortfolioDetails } from './usePortfolioData'

const FEATURED = ['defense', 'fossil_fuels', 'private_prisons', 'tobacco', 'alcohol', 'gambling', 'animal_testing']
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)
const built = async (text: string, usd = 10_000) => {
  const result = await portfolioFromInput(text, usd)
  if ('problem' in result) throw new Error(`unexpected problem: ${JSON.stringify(result.problem)}`)
  return result.portfolio
}

describe('portfolioFromInput (PRD F1)', () => {
  it('turns a fund ticker into that fund at the amount entered', async () => {
    const spy = await built('spy', 25_000)
    expect(spy).toMatchObject({ id: 'SPY', origin: 'fund', totalUsd: 25_000 })
    expect(spy.holdings.length).toBeGreaterThanOrEqual(30)
    expect(sum(spy.holdings.map((h) => h.valueUsd))).toBeCloseTo(25_000, 6)
    expect(spy.holdings.every((h) => h.shares > 0)).toBe(true)
  })

  it('equal-weights several tickers and keeps a fund among them as one holding', async () => {
    const portfolio = await built('VOO, SPY, NVDA')
    expect(portfolio.origin).toBe('tickers')
    expect(portfolio.holdings.map((h) => h.ticker)).toEqual(['VOO', 'SPY', 'NVDA'])
    for (const h of portfolio.holdings) expect(h.weight).toBeCloseTo(1 / 3, 12)
  })

  it('expands those funds into companies with weights combined across sources', async () => {
    const portfolio = await built('VOO, SPY, NVDA')
    const { funds } = await loadPortfolioDetails(portfolio)
    expect(Object.keys(funds).sort()).toEqual(['SPY', 'VOO'])
    const rows = lookThrough(portfolio, funds)
    expect(rows.length).toBeGreaterThanOrEqual(30)
    expect(sum(rows.map((r) => r.weight))).toBeCloseTo(1, 9)
    const nvda = rows.find((r) => r.ticker === 'NVDA')!
    expect(nvda.slices.map((s) => s.via)).toEqual(['VOO', 'SPY', null])
    expect(nvda.weight).toBeGreaterThan(1 / 3)
  })

  it('accepts spaces as separators and ignores case and repeats', async () => {
    expect((await built('aapl msft  AAPL')).holdings.map((h) => h.ticker)).toEqual(['AAPL', 'MSFT'])
  })

  it('names an unknown ticker and the closest match instead of failing', async () => {
    expect(await portfolioFromInput('SPX', 10_000)).toEqual({ problem: { kind: 'unknown', ticker: 'SPX', suggestion: 'SPY' } })
    expect(await portfolioFromInput('AAPL, NVDIA', 10_000)).toEqual({ problem: { kind: 'unknown', ticker: 'NVDIA', suggestion: 'NVDA' } })
    expect(await portfolioFromInput('QQQQQQ', 10_000)).toEqual({ problem: { kind: 'unknown', ticker: 'QQQQQQ', suggestion: null } })
  })

  it('finds the closest match even when the first letter is the typo', async () => {
    expect(await portfolioFromInput('XAPL', 10_000)).toEqual({ problem: { kind: 'unknown', ticker: 'XAPL', suggestion: 'AAPL' } })
  })

  it('ignores stray punctuation around tickers', async () => {
    expect((await built('(AAPL), "MSFT"')).holdings.map((h) => h.ticker)).toEqual(['AAPL', 'MSFT'])
  })

  it('asks for tickers and for an amount above zero', async () => {
    expect(await portfolioFromInput('  ,, ', 10_000)).toEqual({ problem: { kind: 'empty' } })
    expect(await portfolioFromInput('SPY', 0)).toEqual({ problem: { kind: 'amount' } })
    expect(await portfolioFromInput('SPY', Number.NaN)).toEqual({ problem: { kind: 'amount' } })
  })
})

describe('summarize', () => {
  it('counts conflicts in the selected categories only', async () => {
    const spy = await built('SPY')
    const all = await summarize(spy, FEATURED)
    expect(all).toMatchObject({ count: 21, totalUsd: 10_000, holdings: 60 })
    expect(all.usd).toBeGreaterThan(800)
    expect(all.usd).toBeLessThan(1_000)

    const tobacco = await summarize(spy, ['tobacco'])
    expect(tobacco.count).toBe(2)
    expect(tobacco.usd).toBeLessThan(all.usd)
    expect(await summarize(spy, [])).toMatchObject({ count: 0, usd: 0 })
  })

  it('scales dollars with the amount and looks through funds', async () => {
    const small = await summarize(await built('SPY', 10_000), FEATURED)
    const large = await summarize(await built('SPY', 50_000), FEATURED)
    expect(large.usd).toBeCloseTo(small.usd * 5, 6)
    const mixed = await summarize(await built('VOO, AAPL'), FEATURED)
    expect(mixed.count).toBe(21) // every flagged company comes from inside VOO
    expect(mixed.usd).toBeCloseTo(small.usd / 2, 6)
  })

  it('reports nothing for a portfolio with no flagged holdings', async () => {
    const clean: Portfolio = await built('AAPL, MSFT, NVDA')
    expect(await summarize(clean, FEATURED)).toMatchObject({ count: 0, usd: 0, holdings: 3 })
  })
})

describe('inspect and countConflicts', () => {
  it('looks through once and recounts for any selection without another provider call', async () => {
    const inspection = await inspect(await built('SPY'))
    expect(inspection.rows).toHaveLength(60)
    expect(countConflicts(inspection, FEATURED).count).toBe(21)
    expect(countConflicts(inspection, ['fossil_fuels']).count).toBe(6)
    expect(countConflicts(inspection, FEATURED)).toEqual(await summarize(inspection.portfolio, FEATURED))
  })
})

describe('tickersFromScreenshot (v1 stub)', () => {
  it('returns the sample portfolio as text the user can correct', async () => {
    const text = await tickersFromScreenshot(new Blob(['anything']))
    expect(text.split(', ')).toHaveLength(12)
    expect((await built(text)).holdings).toHaveLength(12)
  })
})
