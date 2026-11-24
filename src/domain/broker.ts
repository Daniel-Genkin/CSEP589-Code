// Turning a real brokerage account into the portfolio the rest of the app understands, and
// sizing the orders that carry out a trade list. Pure functions: no network.
import type { BrokerId, Portfolio, ProposedTrade } from '@/types'

/** One position as the server reports it. */
export interface BrokerPosition {
  symbol: string
  qty: number
  marketValue: number
  price: number
}

export interface BrokerAccount {
  status: string
  equity: number
  cash: number
  buyingPower: number
}

/**
 * A portfolio from account positions: weights are each position's share of what is held in
 * positions (cash is not counted, because weights here are shares of holdings). Largest first.
 * Returns null when nothing with a value is held.
 */
export function portfolioFromPositions(positions: BrokerPosition[], brokerId: BrokerId, name: string): Portfolio | null {
  const held = positions.filter((p) => p.qty > 0 && p.marketValue > 0)
  const total = held.reduce((sum, p) => sum + p.marketValue, 0)
  if (!held.length || !(total > 0)) return null
  return {
    id: 'connected',
    name,
    totalUsd: Math.round(total * 100) / 100,
    origin: 'connected',
    brokerId,
    live: true,
    holdings: held
      .slice()
      .sort((a, b) => b.marketValue - a.marketValue || a.symbol.localeCompare(b.symbol))
      .map((p) => ({ ticker: p.symbol.toUpperCase(), weight: p.marketValue / total, valueUsd: Math.round(p.marketValue * 100) / 100, shares: p.qty })),
  }
}

/**
 * Each held ticker's price as the broker values it (value / shares). Sizing trades with these,
 * not the seeded prices, is what makes "sell this holding" sell every share held.
 */
export function pricesFromPortfolio(portfolio: Portfolio): Record<string, number> {
  const prices: Record<string, number> = {}
  for (const h of portfolio.holdings) if (h.shares > 0 && h.valueUsd > 0) prices[h.ticker] = h.valueUsd / h.shares
  return prices
}

export interface OrderRequest {
  side: 'buy' | 'sell'
  symbol: string
  qty: number
  /** Same id for the same list on the same day, so the broker refuses to place it twice */
  clientOrderId?: string
}

/** A short stable hash (not secret): the same text always gives the same 8 characters. */
export function shortHash(text: string): string {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0
  return h.toString(36).padStart(8, '0')
}

/**
 * The orders for a trade list, in the same order. With `listId` each order gets an id built from
 * the list and the day, so approving the same list again (a reload, a double click) cannot place
 * the orders twice. A different list, or the same list tomorrow, gets new ids.
 */
export function ordersFromTrades(trades: ProposedTrade[], listId?: string, today = new Date().toISOString().slice(0, 10)): OrderRequest[] {
  const prefix = listId ? `rally-${shortHash(listId)}-${today}` : null
  return trades.map((t) => ({ side: t.side, symbol: t.ticker, qty: t.shares, ...(prefix ? { clientOrderId: `${prefix}-${t.side}-${t.ticker}` } : {}) }))
}

export interface OrderResult {
  symbol: string
  side: 'buy' | 'sell'
  ok: boolean
  /** The broker already has an order with this id: it was placed before, so it is not placed again */
  duplicate?: boolean
  /** What the broker did with it: "accepted", "filled", "pending_new" and so on */
  status?: string
  error?: string
}

/** A short plain-language line for an order result. */
export function describeOrder(result: OrderResult): string {
  if (result.duplicate) return 'Already placed'
  if (!result.ok) return result.error ?? 'Refused'
  switch (result.status) {
    case 'filled':
      return 'Filled'
    case 'partially_filled':
      return 'Partly filled'
    case 'rejected':
    case 'canceled':
    case 'expired':
      return 'Not placed'
    default:
      // Accepted outside market hours waits for the next open.
      return 'Placed · waits for market'
  }
}
