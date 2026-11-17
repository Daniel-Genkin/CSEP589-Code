import type { Portfolio, Security } from '@/types'
import { describe, expect, it } from 'vitest'
import { buildTickerPortfolio, closestTicker, editDistance, fundsIn, lookThrough, parseTickerInput, positionsOf, resizePortfolio, setHoldingWeight, type FundMap } from './portfolio'

const stock = (ticker: string, price: number): Security => ({ ticker, name: ticker, sector: 'Test', price, kind: 'stock' })
const etf = (ticker: string, price: number): Security => ({ ticker, name: ticker, sector: 'Fund', price, kind: 'etf' })
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)

// Two small funds that overlap on AAA.
const FUNDS: FundMap = {
  FUNDX: [
    { ticker: 'AAA', weight: 0.5 },
    { ticker: 'BBB', weight: 0.3 },
    { ticker: 'CCC', weight: 0.2 },
  ],
  FUNDY: [
    { ticker: 'AAA', weight: 0.4 },
    { ticker: 'DDD', weight: 0.6 },
  ],
}

describe('parseTickerInput', () => {
  it('splits on commas, spaces, semicolons and new lines, and upper-cases', () => {
    expect(parseTickerInput('VOO, SPY, NVDA')).toEqual(['VOO', 'SPY', 'NVDA'])
    expect(parseTickerInput('voo spy\nnvda;aapl')).toEqual(['VOO', 'SPY', 'NVDA', 'AAPL'])
  })

  it('drops blanks, a leading $ and repeats', () => {
    expect(parseTickerInput('  $spy ,, SPY ,')).toEqual(['SPY'])
    expect(parseTickerInput('   ')).toEqual([])
  })
})

describe('closestTicker', () => {
  it('measures edit distance', () => {
    expect(editDistance('SPY', 'SPY')).toBe(0)
    expect(editDistance('SPX', 'SPY')).toBe(1)
    expect(editDistance('', 'ABC')).toBe(3)
  })

  it('names the nearest known ticker, preferring the same first letter', () => {
    const known = ['SPY', 'VOO', 'VTI', 'NVDA', 'AAPL', 'MSFT']
    expect(closestTicker('SPX', known)).toBe('SPY')
    expect(closestTicker('nvdia', known)).toBe('NVDA')
    expect(closestTicker('APPL', known)).toBe('AAPL')
    expect(closestTicker('ZZZ', [])).toBeNull()
  })

  it('suggests nothing when no ticker is close enough to be what was meant', () => {
    expect(closestTicker('ZZZZZ', ['AAPL', 'MSFT'])).toBeNull()
    expect(closestTicker('GOOGLE', ['GOOGL', 'GEO'])).toBe('GOOGL')
  })
})

describe('buildTickerPortfolio', () => {
  it('equal-weights several tickers and keeps a fund as one holding', () => {
    const portfolio = buildTickerPortfolio([etf('FUNDX', 400), etf('FUNDY', 500), stock('NVDA', 200)], 9_000)
    expect(portfolio.origin).toBe('tickers')
    expect(portfolio.holdings.map((h) => h.ticker)).toEqual(['FUNDX', 'FUNDY', 'NVDA'])
    for (const h of portfolio.holdings) {
      expect(h.weight).toBeCloseTo(1 / 3, 12)
      expect(h.valueUsd).toBeCloseTo(3_000, 9)
    }
    expect(portfolio.holdings[2].shares).toBeCloseTo(15, 9)
  })

  it('makes an empty portfolio from no tickers', () => {
    expect(buildTickerPortfolio([], 10_000).holdings).toEqual([])
  })
})

describe('resizePortfolio', () => {
  it('scales dollars and shares, not weights', () => {
    const resized = resizePortfolio(buildTickerPortfolio([stock('AAA', 100), stock('BBB', 50)], 10_000), 25_000)
    expect(resized.totalUsd).toBe(25_000)
    expect(resized.holdings.map((h) => h.weight)).toEqual([0.5, 0.5])
    expect(resized.holdings.map((h) => h.valueUsd)).toEqual([12_500, 12_500])
    expect(resized.holdings.map((h) => h.shares)).toEqual([125, 250])
  })

  it('recovers from a size of $0, given prices', () => {
    const p = buildTickerPortfolio([stock('AAA', 100), stock('BBB', 50)], 10_000)
    const empty = resizePortfolio(p, 0)
    expect(empty.holdings.map((h) => h.valueUsd)).toEqual([0, 0])
    const back = resizePortfolio(empty, 10_000, { AAA: 100, BBB: 50 })
    expect(back.holdings.map((h) => h.valueUsd)).toEqual([5_000, 5_000])
    expect(back.holdings.map((h) => h.shares)).toEqual([50, 100])
  })
})

describe('setHoldingWeight', () => {
  const base = buildTickerPortfolio([stock('AAA', 100), stock('BBB', 50), stock('CCC', 25), stock('DDD', 10)], 10_000)

  it('re-normalizes to 100% and keeps the others in proportion', () => {
    const next = setHoldingWeight(base, 'AAA', 0.4)
    expect(sum(next.holdings.map((h) => h.weight))).toBeCloseTo(1, 12)
    expect(next.holdings[0].weight).toBeCloseTo(0.4, 12)
    for (const h of next.holdings.slice(1)) expect(h.weight).toBeCloseTo(0.2, 12)
    expect(sum(next.holdings.map((h) => h.valueUsd))).toBeCloseTo(10_000, 9)
    expect(next.holdings[0].shares).toBeCloseTo(40, 9)
  })

  it('clamps to 0 to 100%', () => {
    expect(setHoldingWeight(base, 'AAA', 1.5).holdings.map((h) => h.weight)).toEqual([1, 0, 0, 0])
    const zero = setHoldingWeight(base, 'AAA', -1)
    expect(zero.holdings[0].weight).toBe(0)
    expect(sum(zero.holdings.map((h) => h.weight))).toBeCloseTo(1, 12)
  })

  it('shares the remainder equally when the others were all at zero', () => {
    const allInOne = setHoldingWeight(base, 'AAA', 1)
    const back = setHoldingWeight(allInOne, 'AAA', 0.1)
    for (const h of back.holdings.slice(1)) expect(h.weight).toBeCloseTo(0.3, 12)
  })

  it('leaves the portfolio alone for an unknown ticker, a single holding or a weight that is not a number', () => {
    expect(setHoldingWeight(base, 'NOPE', 0.5)).toBe(base)
    const single = buildTickerPortfolio([stock('AAA', 100)], 10_000)
    expect(setHoldingWeight(single, 'AAA', 0.5)).toBe(single)
    expect(setHoldingWeight(base, 'AAA', Number.NaN)).toBe(base)
  })

  it('only edits ticker-built portfolios', () => {
    expect(setHoldingWeight({ ...base, origin: 'fund' }, 'AAA', 0.5).holdings[0].weight).toBe(0.25)
    expect(setHoldingWeight({ ...base, origin: 'connected' }, 'AAA', 0.5).holdings[0].weight).toBe(0.25)
  })

  it('brings share counts back after a holding has been at 0%, given prices', () => {
    const prices = { AAA: 100, BBB: 50, CCC: 25, DDD: 10 }
    const zeroed = setHoldingWeight(base, 'AAA', 0, prices)
    expect(zeroed.holdings[0]).toMatchObject({ weight: 0, valueUsd: 0, shares: 0 })
    const back = setHoldingWeight(zeroed, 'AAA', 0.2, prices)
    expect(back.holdings[0]).toMatchObject({ weight: 0.2, valueUsd: 2_000, shares: 20 })
    // Without prices the share count cannot be recovered, but dollars still follow the weight.
    expect(setHoldingWeight(setHoldingWeight(base, 'AAA', 0), 'AAA', 0.2).holdings[0]).toMatchObject({ valueUsd: 2_000, shares: 0 })
  })
})

describe('lookThrough', () => {
  it('breaks funds into companies and combines weights across sources', () => {
    // "FUNDX, FUNDY, AAA": a third each. AAA arrives three ways.
    const portfolio = buildTickerPortfolio([etf('FUNDX', 400), etf('FUNDY', 500), stock('AAA', 100)], 9_000)
    const rows = lookThrough(portfolio, FUNDS)
    const byTicker = Object.fromEntries(rows.map((r) => [r.ticker, r]))

    expect(byTicker.AAA.weight).toBeCloseTo(1 / 3 + 0.5 / 3 + 0.4 / 3, 12)
    expect(byTicker.AAA.slices).toEqual([
      { via: 'FUNDX', weight: expect.closeTo(0.5 / 3, 12) },
      { via: 'FUNDY', weight: expect.closeTo(0.4 / 3, 12) },
      { via: null, weight: expect.closeTo(1 / 3, 12) },
    ])
    expect(byTicker.DDD.weight).toBeCloseTo(0.2, 12)
    expect(byTicker.DDD.valueUsd).toBeCloseTo(1_800, 9)
    expect(sum(rows.map((r) => r.weight))).toBeCloseTo(1, 12)
    expect(sum(rows.map((r) => r.valueUsd))).toBeCloseTo(9_000, 9)
    expect(rows.map((r) => r.ticker)).toEqual(['AAA', 'DDD', 'BBB', 'CCC']) // largest first
  })

  it('treats a fund-origin portfolio as that fund', () => {
    const fund: Portfolio = {
      id: 'FUNDX',
      name: 'Fund X',
      totalUsd: 10_000,
      origin: 'fund',
      holdings: FUNDS.FUNDX.map((c) => ({ ...c, valueUsd: 10_000 * c.weight, shares: 1 })),
    }
    const rows = lookThrough(fund, FUNDS)
    expect(rows.map((r) => [r.ticker, r.weight])).toEqual([
      ['AAA', 0.5],
      ['BBB', 0.3],
      ['CCC', 0.2],
    ])
    expect(rows.every((r) => r.slices.length === 1 && r.slices[0].via === 'FUNDX')).toBe(true)
    expect(positionsOf(fund, FUNDS)).toEqual([{ ticker: 'FUNDX', weight: 1, valueUsd: 10_000, isFund: true }])
    expect(fundsIn(fund, FUNDS)).toEqual(['FUNDX'])
  })

  it('lists positions as held, with funds as single units', () => {
    const portfolio = buildTickerPortfolio([etf('FUNDX', 400), stock('AAA', 100)], 10_000)
    expect(positionsOf(portfolio, FUNDS)).toEqual([
      { ticker: 'FUNDX', weight: 0.5, valueUsd: 5_000, isFund: true },
      { ticker: 'AAA', weight: 0.5, valueUsd: 5_000, isFund: false },
    ])
    expect(fundsIn(portfolio, FUNDS)).toEqual(['FUNDX'])
  })

  it('skips holdings with no weight', () => {
    const portfolio = setHoldingWeight(buildTickerPortfolio([stock('AAA', 100), stock('BBB', 50)], 10_000), 'AAA', 1)
    expect(lookThrough(portfolio, {}).map((r) => r.ticker)).toEqual(['AAA'])
  })
})
