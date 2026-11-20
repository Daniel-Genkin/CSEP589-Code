import { SeededProvider } from '@/data/seeded'
import type { Exclusions, Portfolio, ValuesTag } from '@/types'
import { beforeAll, describe, expect, it } from 'vitest'
import { lookThrough, type FundMap } from './portfolio'
import { proposeTrades, tradeTotals, tradesToCsv, tradesToText } from './trades'

const FEATURED = ['defense', 'fossil_fuels', 'private_prisons', 'tobacco', 'alcohol', 'gambling', 'animal_testing']
const none: Exclusions = { categories: [], tickers: [], swaps: {} }
const ex = (patch: Partial<Exclusions>): Exclusions => ({ ...none, ...patch })
const tag = (ticker: string, category: string): ValuesTag => ({ ticker, category, strength: 3, reason: 'test', sourceUrl: 'https://example.com' })
const fourDp = (shares: number) => Math.abs(shares * 10_000 - Math.round(shares * 10_000)) < 1e-6

describe('proposeTrades on a small made-up portfolio', () => {
  const funds: FundMap = {
    FUND: [
      { ticker: 'AAA', weight: 0.5 },
      { ticker: 'BBB', weight: 0.3 },
      { ticker: 'CCC', weight: 0.2 },
    ],
  }
  const prices = { FUND: 100, AAA: 50, BBB: 20, CCC: 10, DDD: 40, XXX: 25 }
  // $10,000: 60% in the fund, 30% DDD, 10% BBB held directly.
  const portfolio: Portfolio = {
    id: 'p',
    name: 'p',
    totalUsd: 10_000,
    origin: 'tickers',
    holdings: [
      { ticker: 'FUND', weight: 0.6, valueUsd: 6_000, shares: 60 },
      { ticker: 'DDD', weight: 0.3, valueUsd: 3_000, shares: 75 },
      { ticker: 'BBB', weight: 0.1, valueUsd: 1_000, shares: 50 },
    ],
  }
  const find = (trades: ReturnType<typeof proposeTrades>, side: string, ticker: string) => trades.find((t) => t.side === side && t.ticker === ticker)

  it('proposes nothing when nothing is excluded', () => {
    expect(proposeTrades(portfolio, funds, [], none, prices)).toEqual([])
    expect(proposeTrades(portfolio, funds, [], ex({ tickers: ['NOPE'] }), prices)).toEqual([])
  })

  it('sells a directly held company and spreads its dollars pro rata', () => {
    // DDD (30%) out. Everything left grows by 1/0.7. The fund is untouched, so it stays a fund.
    const trades = proposeTrades(portfolio, funds, [], ex({ tickers: ['DDD'] }), prices)
    expect(find(trades, 'sell', 'DDD')).toMatchObject({ shares: 75, estUsd: 3_000 })
    expect(find(trades, 'buy', 'FUND')!.estUsd).toBeCloseTo(6_000 / 0.7 - 6_000, 1)
    expect(find(trades, 'buy', 'BBB')!.estUsd).toBeCloseTo(1_000 / 0.7 - 1_000, 1)
    expect(trades).toHaveLength(3)
    expect(trades.map((t) => t.side)).toEqual(['sell', 'buy', 'buy']) // sells first
  })

  it('sells the whole fund when an excluded company is inside it, and buys back the rest company by company', () => {
    // AAA (30% of the portfolio, all inside the fund) out.
    const trades = proposeTrades(portfolio, funds, [tag('AAA', 'bad')], ex({ categories: ['bad'] }), prices)
    expect(find(trades, 'sell', 'FUND')).toMatchObject({ shares: 60, estUsd: 6_000 })
    expect(find(trades, 'sell', 'FUND')!.reason).toContain('AAA')
    expect(find(trades, 'sell', 'AAA')).toBeUndefined() // it was never held directly
    expect(find(trades, 'buy', 'FUND')).toBeUndefined()
    // Targets after the what-if: BBB 28% -> 40%, CCC 12% -> 17.14%, DDD 30% -> 42.86%.
    expect(find(trades, 'buy', 'BBB')!.estUsd).toBeCloseTo(4_000 - 1_000, 1) // already holds $1,000
    expect(find(trades, 'buy', 'CCC')!.estUsd).toBeCloseTo(10_000 * (0.12 / 0.7), 1)
    expect(find(trades, 'buy', 'DDD')!.estUsd).toBeCloseTo(10_000 * (0.3 / 0.7) - 3_000, 1)
    expect(find(trades, 'buy', 'CCC')!.reason).toContain('Rebuilds FUND')
    const { sellUsd, buyUsd } = tradeTotals(trades)
    expect(Math.abs(sellUsd - buyUsd)).toBeLessThan(1)
  })

  it('buys the swapped-in alternative with the excluded holding’s dollars', () => {
    const trades = proposeTrades(portfolio, funds, [], ex({ tickers: ['DDD'], swaps: { DDD: 'XXX' } }), prices)
    expect(trades).toEqual([
      { side: 'sell', ticker: 'DDD', shares: 75, estUsd: 3_000, reason: 'You excluded this holding' },
      { side: 'buy', ticker: 'XXX', shares: 120, estUsd: 3_000, reason: 'Swapped in for DDD' },
    ])
  })

  it('quotes fractional quantities to four decimal places at the given prices', () => {
    const trades = proposeTrades(portfolio, funds, [tag('AAA', 'bad')], ex({ categories: ['bad'] }), { ...prices, CCC: 7.13 })
    for (const t of trades) {
      expect(fourDp(t.shares), `${t.ticker} ${t.shares}`).toBe(true)
      expect(t.estUsd).toBeCloseTo(t.shares * ({ ...prices, CCC: 7.13 } as Record<string, number>)[t.ticker], 2)
    }
    expect(find(trades, 'buy', 'CCC')!.shares).toBe(Math.round((10_000 * (0.12 / 0.7) / 7.13) * 10_000) / 10_000)
  })

  it('refuses to build a list when a ticker it must trade has no price', () => {
    const { FUND: _fund, ...withoutFund } = prices
    expect(() => proposeTrades(portfolio, funds, [tag('AAA', 'bad')], ex({ categories: ['bad'] }), withoutFund)).toThrow('No price for FUND')
    // A missing price for something that is not traded does not matter.
    const { XXX: _alt, ...withoutAlt } = prices
    expect(proposeTrades(portfolio, funds, [], ex({ tickers: ['DDD'] }), withoutAlt)).toHaveLength(3)
  })

  it('ignores a swap into the fund itself', () => {
    const plain = proposeTrades(portfolio, funds, [tag('AAA', 'bad')], ex({ categories: ['bad'] }), prices)
    expect(proposeTrades(portfolio, funds, [tag('AAA', 'bad')], ex({ categories: ['bad'], swaps: { AAA: 'FUND' } }), prices)).toEqual(plain)
  })

  it('only sells when everything is excluded', () => {
    const trades = proposeTrades(portfolio, funds, [], ex({ tickers: ['AAA', 'BBB', 'CCC', 'DDD'] }), prices)
    expect(trades.every((t) => t.side === 'sell')).toBe(true)
    expect(tradeTotals(trades)).toEqual({ sellUsd: 10_000, buyUsd: 0 })
  })

  it('exports the list as CSV and as plain text', () => {
    const trades = proposeTrades(portfolio, funds, [], ex({ tickers: ['DDD'], swaps: { DDD: 'XXX' } }), prices)
    expect(tradesToCsv(trades)).toBe(
      'Side,Ticker,Quantity,Estimated USD,Reason\nSell,DDD,75.0000,3000.00,You excluded this holding\nBuy,XXX,120.0000,3000.00,Swapped in for DDD\n',
    )
    expect(tradesToText(trades)).toBe('SELL 75.0000 DDD (about $3000.00)\nBUY 120.0000 XXX (about $3000.00)')
    expect(tradesToCsv([{ side: 'buy', ticker: 'A', shares: 1, estUsd: 1, reason: 'Holds X, Y' }])).toContain('"Holds X, Y"')
  })
})

describe('proposeTrades on the seed (PRD F7)', () => {
  const provider = new SeededProvider(0)
  let funds: FundMap
  let prices: Record<string, number>
  let tags: ValuesTag[]

  beforeAll(async () => {
    funds = {}
    for (const ticker of ['SPY', 'VOO', 'VTI']) funds[ticker] = (await provider.getFund(ticker))!.holdings
    const tickers = [...new Set([...Object.keys(funds), ...Object.values(funds).flatMap((h) => h.map((c) => c.ticker)), 'CCJ', 'WMT', 'NEE', 'TSLA'])]
    prices = Object.fromEntries((await provider.getSecurities(tickers)).map((s) => [s.ticker, s.price]))
    tags = await provider.getTags(tickers)
  })

  const check = (portfolio: Portfolio, exclusions: Exclusions) => {
    const trades = proposeTrades(portfolio, funds, tags, exclusions, prices)
    const { sellUsd, buyUsd } = tradeTotals(trades)
    expect(Math.abs(sellUsd - buyUsd), `sells ${sellUsd} vs buys ${buyUsd}`).toBeLessThan(1)
    for (const t of trades) {
      expect(fourDp(t.shares), `${t.ticker} ${t.shares}`).toBe(true)
      expect(t.estUsd).toBeGreaterThan(0)
      expect(t.reason.length).toBeGreaterThan(5)
    }
    return trades
  }

  it('SPY with a category excluded: sell the whole fund, buy the 54 companies that remain, sells equal buys within $1', async () => {
    const spy = (await provider.getFund('SPY')) as Portfolio
    const trades = check(spy, ex({ categories: ['fossil_fuels'] }))
    expect(trades.filter((t) => t.side === 'sell')).toEqual([expect.objectContaining({ ticker: 'SPY', estUsd: expect.closeTo(10_000, 1) })])
    const buys = trades.filter((t) => t.side === 'buy')
    expect(buys).toHaveLength(54)
    expect(buys.some((t) => ['XOM', 'CVX', 'COP', 'SLB', 'EOG', 'OXY'].includes(t.ticker))).toBe(false)
    // Each company is bought in its fund weight, scaled up pro rata.
    const rows = lookThrough(spy, funds)
    const remaining = rows.filter((r) => !['XOM', 'CVX', 'COP', 'SLB', 'EOG', 'OXY'].includes(r.ticker)).reduce((sum, r) => sum + r.weight, 0)
    const aapl = buys.find((t) => t.ticker === 'AAPL')!
    expect(aapl.estUsd).toBeCloseTo((10_000 * rows.find((r) => r.ticker === 'AAPL')!.weight) / remaining, 0)
  })

  it('SPY with all seven excluded, and with a swap', async () => {
    const spy = (await provider.getFund('SPY')) as Portfolio
    expect(check(spy, ex({ categories: FEATURED })).filter((t) => t.side === 'buy')).toHaveLength(39)
    const swapped = check(spy, ex({ categories: ['fossil_fuels'], swaps: { XOM: 'CCJ' } }))
    expect(swapped.find((t) => t.ticker === 'CCJ')).toMatchObject({ side: 'buy', reason: 'Swapped in for XOM' })
  })

  it('the sample portfolio: direct holdings are sold as normal', async () => {
    const sample = await provider.getSamplePortfolio('sample')
    const trades = check(sample, ex({ categories: FEATURED }))
    expect(trades.filter((t) => t.side === 'sell').map((t) => t.ticker).sort()).toEqual(['LMT', 'MO', 'XOM'])
    expect(trades.filter((t) => t.side === 'buy')).toHaveLength(9)
  })

  it('the connected portfolio: funds that hold excluded companies are sold whole, direct ones individually', async () => {
    const connected = await provider.getSamplePortfolio('connected')
    const trades = check(connected, ex({ categories: FEATURED }))
    const sells = trades.filter((t) => t.side === 'sell').map((t) => t.ticker)
    expect(sells).toEqual(expect.arrayContaining(['VOO', 'VTI', 'XOM', 'CVX', 'LMT', 'RTX', 'PM', 'STZ', 'LVS', 'GEO']))
    expect(sells).toHaveLength(10)
    // A swap for a holding this portfolio does not contain changes nothing.
    expect(proposeTrades(connected, funds, tags, ex({ categories: FEATURED, tickers: ['UEC'], swaps: { UEC: 'NEE' } }), prices)).toEqual(trades)
  })

  it('a ticker exclusion on a company held three ways', async () => {
    const connected = await provider.getSamplePortfolio('connected')
    const trades = check(connected, ex({ tickers: ['TSLA'] }))
    expect(trades.filter((t) => t.side === 'sell').map((t) => t.ticker).sort()).toEqual(['TSLA', 'VOO', 'VTI'])
    expect(trades.some((t) => t.side === 'buy' && t.ticker === 'TSLA')).toBe(false)
  })

  it('is empty when the excluded categories touch nothing in the portfolio', async () => {
    const spy = (await provider.getFund('SPY')) as Portfolio
    expect(proposeTrades(spy, funds, tags, ex({ categories: ['private_prisons'] }), prices)).toEqual([])
  })
})
