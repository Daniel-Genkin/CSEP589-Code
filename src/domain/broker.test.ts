import { describe, expect, it } from 'vitest'
import { describeOrder, ordersFromTrades, portfolioFromPositions, pricesFromPortfolio, shortHash } from './broker'
import { proposeTrades } from './trades'

const pos = (symbol: string, qty: number, marketValue: number) => ({ symbol, qty, marketValue, price: marketValue / qty })

describe('portfolioFromPositions', () => {
  it('weights each position by its share of what is held, largest first', () => {
    const p = portfolioFromPositions([pos('AAPL', 10, 1000), pos('XOM', 20, 3000)], 'alpaca', 'Alpaca paper account')!
    expect(p.totalUsd).toBe(4000)
    expect(p.holdings.map((h) => h.ticker)).toEqual(['XOM', 'AAPL'])
    expect(p.holdings[0].weight).toBeCloseTo(0.75)
    expect(p.holdings.reduce((s, h) => s + h.weight, 0)).toBeCloseTo(1)
    expect(p).toMatchObject({ origin: 'connected', brokerId: 'alpaca', live: true })
  })

  it('ignores shorts and zero-value positions, and gives null when nothing is held', () => {
    expect(portfolioFromPositions([pos('AAPL', -2, -300), pos('MSFT', 1, 0)], 'alpaca', 'x')).toBeNull()
    expect(portfolioFromPositions([], 'alpaca', 'x')).toBeNull()
  })
})

describe('sizing trades on a live account', () => {
  const portfolio = portfolioFromPositions([pos('MO', 20.374762292, 1476.36), pos('AAPL', 17.216, 6020.3), pos('MSFT', 11.864, 5862.15)], 'alpaca', 'Alpaca paper account')!

  it('prices each holding at what the broker values it (value / shares)', () => {
    const prices = pricesFromPortfolio(portfolio)
    expect(prices.MO).toBeCloseTo(1476.36 / 20.374762292, 4)
    expect(prices.AAPL).toBeCloseTo(6020.3 / 17.216, 4)
  })

  it('sells every share of an excluded holding, not a slice sized from a stale price', () => {
    // The seeded price for MO is far from the live one: sizing from it would leave shares behind.
    const staleSeeded = { MO: 78.03, AAPL: 350, MSFT: 480 }
    const stale = proposeTrades(portfolio, {}, [], { categories: [], tickers: ['MO'], swaps: {} }, staleSeeded)
    expect(stale.find((t) => t.side === 'sell')!.shares).toBeLessThan(19)

    const live = proposeTrades(portfolio, {}, [], { categories: [], tickers: ['MO'], swaps: {} }, { ...staleSeeded, ...pricesFromPortfolio(portfolio) })
    const sell = live.find((t) => t.side === 'sell')!
    expect(sell).toMatchObject({ ticker: 'MO' })
    expect(sell.shares).toBeCloseTo(20.374762292, 3)
  })
})

describe('orders', () => {
  const trade = { side: 'sell' as const, ticker: 'XOM', shares: 2.5, estUsd: 280, reason: '' }

  it('turns a trade list into orders one for one', () => {
    expect(ordersFromTrades([trade])).toEqual([{ side: 'sell', symbol: 'XOM', qty: 2.5 }])
  })

  it('gives the same list the same ids on the same day, and a different list or day new ones', () => {
    const a = ordersFromTrades([trade], 'list-1', '2026-11-23')
    const again = ordersFromTrades([trade], 'list-1', '2026-11-23')
    expect(a[0].clientOrderId).toBe(again[0].clientOrderId)
    expect(a[0].clientOrderId).toMatch(/^rally-[0-9a-z]{8}-2026-11-23-sell-XOM$/)
    expect(ordersFromTrades([trade], 'list-2', '2026-11-23')[0].clientOrderId).not.toBe(a[0].clientOrderId)
    expect(ordersFromTrades([trade], 'list-1', '2026-11-24')[0].clientOrderId).not.toBe(a[0].clientOrderId)
    expect(shortHash('x')).toHaveLength(8)
  })

  it('describes results in plain language', () => {
    expect(describeOrder({ symbol: 'A', side: 'buy', ok: true, status: 'filled' })).toBe('Filled')
    expect(describeOrder({ symbol: 'A', side: 'buy', ok: true, status: 'accepted' })).toBe('Placed · waits for market')
    expect(describeOrder({ symbol: 'A', side: 'buy', ok: false, error: 'insufficient buying power' })).toBe('insufficient buying power')
    expect(describeOrder({ symbol: 'A', side: 'buy', ok: false, duplicate: true, error: 'x' })).toBe('Already placed')
  })
})
