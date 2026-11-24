// Proposed trades: what it takes to turn the active portfolio into its what-if version.
//
// A single company cannot be sold out of a fund. When an excluded company is held through a
// fund, the fund position is sold whole and its remaining companies are bought individually in
// their fund weights. Excluded weight is redistributed pro rata (or goes to a swapped-in
// alternative). Directly held companies are sold as normal. Nothing here sends anything.
import type { Exclusions, Portfolio, ProposedTrade, ValuesTag } from '@/types'
import { applyExclusions, planRedistribution } from './exclusions'
import { type FundMap, type Prices, constituentsOf, fundsIn, lookThrough, positionsOf } from './portfolio'

const SHARE_DP = 4
const MIN_TRADE_USD = 0.005

const roundShares = (shares: number) => Math.round(shares * 10 ** SHARE_DP) / 10 ** SHARE_DP

const list = (tickers: string[]) => (tickers.length <= 3 ? tickers.join(', ') : `${tickers.slice(0, 3).join(', ')} and ${tickers.length - 3} more`)

/**
 * Sells first (largest first), then buys (largest first).
 * `prices` are the provider's current prices per ticker. A trade with no price is an error, not
 * a line quietly left out: a list missing one leg would no longer reach the what-if portfolio.
 * With nothing excluded in this portfolio the list is empty.
 */
export function proposeTrades(portfolio: Portfolio, funds: FundMap, tags: ValuesTag[], exclusions: Exclusions, prices: Prices): ProposedTrade[] {
  const rows = lookThrough(portfolio, funds)
  const heldFunds = fundsIn(portfolio, funds)
  const { excluded, swaps, scale: growth } = planRedistribution(rows, tags, exclusions, heldFunds)
  if (!excluded.size) return []

  const total = portfolio.totalUsd
  const target = applyExclusions(rows, tags, exclusions, heldFunds) // company -> weight after the what-if
  const swappedIn = new Map<string, string[]>() // alternative -> the holdings it replaces
  for (const [from, to] of Object.entries(swaps)) swappedIn.set(to, [...(swappedIn.get(to) ?? []), from])

  const sells: ProposedTrade[] = []
  const buys: ProposedTrade[] = []
  const push = (bucket: ProposedTrade[], side: 'sell' | 'buy', ticker: string, usd: number, reason: string) => {
    if (usd < MIN_TRADE_USD) return
    const price = prices[ticker]
    if (!(price > 0)) throw new Error(`No price for ${ticker}`)
    const shares = roundShares(usd / price)
    if (shares <= 0) return
    bucket.push({ side, ticker, shares, estUsd: Math.round(shares * price * 100) / 100, reason })
  }

  // What is already covered by positions that stay as they are (funds with nothing excluded inside).
  const covered = new Map<string, number>()
  const brokenFunds = new Map<string, string[]>() // company -> the broken funds it used to sit in
  const directUsd = new Map<string, number>()

  for (const position of positionsOf(portfolio, funds)) {
    if (!position.isFund) {
      directUsd.set(position.ticker, (directUsd.get(position.ticker) ?? 0) + position.valueUsd)
      continue
    }
    const inside = constituentsOf(portfolio, funds, position.ticker)
    const hit = inside.filter((c) => excluded.has(c.ticker)).map((c) => c.ticker)
    if (hit.length) {
      // Broken: sell the whole fund, rebuy what is left of it company by company.
      push(sells, 'sell', position.ticker, position.valueUsd, `Holds ${list(hit)}, which you excluded. A fund is sold whole.`)
      for (const c of inside) if (!excluded.has(c.ticker)) brokenFunds.set(c.ticker, [...(brokenFunds.get(c.ticker) ?? []), position.ticker])
    } else {
      // Untouched fund: it stays a fund and takes its pro rata share of the redistributed weight.
      const grownUsd = position.valueUsd * growth
      push(buys, 'buy', position.ticker, grownUsd - position.valueUsd, 'Pro rata share of the weight you excluded')
      for (const c of inside) covered.set(c.ticker, (covered.get(c.ticker) ?? 0) + grownUsd * c.weight)
    }
  }

  // Everything else is held company by company: trade the gap between target and what is there.
  const tickers = new Set([...Object.keys(target), ...directUsd.keys()])
  for (const ticker of tickers) {
    const wanted = (target[ticker] ?? 0) * total - (covered.get(ticker) ?? 0)
    const held = directUsd.get(ticker) ?? 0
    const gap = wanted - held
    if (gap < -MIN_TRADE_USD) {
      const why = excluded.has(ticker) ? 'You excluded this holding' : 'Trim to the what-if weight'
      push(sells, 'sell', ticker, -gap, why)
    } else if (gap > MIN_TRADE_USD) {
      const replaced = swappedIn.get(ticker)
      const from = brokenFunds.get(ticker)
      let why = 'Pro rata share of the weight you excluded'
      if (replaced) why = `Swapped in for ${list(replaced)}`
      else if (from) why = `Rebuilds ${list([...new Set(from)])} without the companies you excluded`
      push(buys, 'buy', ticker, gap, why)
    }
  }

  const bySize = (a: ProposedTrade, b: ProposedTrade) => b.estUsd - a.estUsd || a.ticker.localeCompare(b.ticker)
  return [...sells.sort(bySize), ...buys.sort(bySize)]
}

export function tradeTotals(trades: ProposedTrade[]): { sellUsd: number; buyUsd: number } {
  let sellUsd = 0
  let buyUsd = 0
  for (const t of trades) {
    if (t.side === 'sell') sellUsd += t.estUsd
    else buyUsd += t.estUsd
  }
  return { sellUsd, buyUsd }
}

const csvCell = (value: string | number) => {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** The trade list as CSV: side, ticker, quantity, estimated dollars, reason. */
export function tradesToCsv(trades: ProposedTrade[]): string {
  const lines = [['Side', 'Ticker', 'Quantity', 'Estimated USD', 'Reason']]
  for (const t of trades) lines.push([t.side === 'sell' ? 'Sell' : 'Buy', t.ticker, t.shares.toFixed(SHARE_DP), t.estUsd.toFixed(2), t.reason])
  return lines.map((cells) => cells.map(csvCell).join(',')).join('\n') + '\n'
}

/** The same list as plain text, one trade per line, for pasting into a broker's notes. */
export function tradesToText(trades: ProposedTrade[]): string {
  return trades.map((t) => `${t.side === 'sell' ? 'SELL' : 'BUY'} ${t.shares.toFixed(SHARE_DP)} ${t.ticker} (about $${t.estUsd.toFixed(2)})`).join('\n')
}
