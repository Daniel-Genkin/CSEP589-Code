// "Lines" are the things a user won't fund. Each maps to the research data the mock
// backend already has: a category score below the "concerning" cutoff, or a flag.
import { getSecurity } from '@/api/mock/catalog'

const CONCERNING = 45

export const LINES = [
  {
    key: 'oil',
    label: 'Not my oil money',
    reason: "Burns what you're against",
    category: 'climate',
    bg: '#E85A2A',
    fg: '#17161D',
    test: (sec) => sec.flags.includes('Fossil fuels') || sec.categories.climate.score < CONCERNING,
  },
  {
    key: 'pay',
    label: 'Pay your people',
    reason: 'Underpays the people',
    category: 'labor',
    bg: '#F07AB6',
    fg: '#17161D',
    test: (sec) => sec.categories.labor.score < CONCERNING,
  },
  {
    key: 'senators',
    label: 'Stop buying senators',
    reason: 'Lobbies on your dime',
    category: 'governance',
    bg: '#F7C54E',
    fg: '#17161D',
    test: (sec) => sec.categories.governance.score < CONCERNING,
  },
  {
    key: 'weapons',
    label: 'Weapons',
    reason: 'Makes weapons',
    category: null,
    bg: '#D6472B',
    fg: '#17161D',
    test: (sec) => sec.flags.includes('Weapons'),
  },
  {
    key: 'data',
    label: 'Hands off my data',
    reason: 'Loose with your data',
    category: 'privacy',
    bg: '#8A6CF2',
    fg: '#17161D',
    test: (sec) => sec.categories.privacy.score < CONCERNING,
  },
  {
    key: 'bunnies',
    label: 'Leave the bunnies alone',
    reason: 'Rough on animals',
    category: 'animals',
    bg: '#3A2A9E',
    fg: '#FFF4D6',
    test: (sec) => sec.categories.animals.score < CONCERNING,
  },
  {
    key: 'fair',
    label: 'Treat people fairly',
    reason: 'Falls short on fairness',
    category: 'equity',
    bg: '#354BF4',
    fg: '#FFF4D6',
    test: (sec) => sec.categories.equity.score < CONCERNING,
  },
]

export const LINE_MAP = Object.fromEntries(LINES.map((l) => [l.key, l]))

// The real ETFs the demo lets you pick, with a one-line nickname in the brand voice.
export const DEMO_FUNDS = [
  { symbol: 'VOO', nickname: 'the one everybody owns', bg: '#FFF4D6' },
  { symbol: 'VTI', nickname: 'the one that owns everything', bg: '#8A6CF2' },
  { symbol: 'QQQ', nickname: 'the shiny tech one', bg: '#F7C54E' },
  { symbol: 'SCHD', nickname: 'the "safe" one', bg: '#F07AB6' },
  { symbol: 'IWM', nickname: 'the small-fry one', bg: '#E85A2A' },
]

// Which of the user's lines a single company crosses, with the receipt for each.
export function crossedLines(sec, lineKeys) {
  return lineKeys
    .map((key) => LINE_MAP[key])
    .filter((line) => line && line.test(sec))
    .map((line) => ({
      ...line,
      receipt: line.category ? sec.categories[line.category].note : `${sec.name} is flagged for ${line.label.toLowerCase()}.`,
    }))
}

// Check a holding list (symbol + weight in %) against the user's lines.
export function checkHoldings(holdings, lineKeys) {
  const rows = holdings
    .map((h) => {
      const sec = getSecurity(h.symbol)
      if (!sec) return null
      return { symbol: sec.symbol, name: sec.name, sector: sec.sector, weight: h.weight, sec, crossed: crossedLines(sec, lineKeys) }
    })
    .filter(Boolean)
    .sort((a, b) => b.weight - a.weight)

  const crossers = rows.filter((r) => r.crossed.length)
  const crossingPct = crossers.reduce((sum, r) => sum + r.weight, 0)
  const top = rows.slice(0, 7)
  return {
    rows,
    crossers,
    crossingPct,
    perTenK: Math.round((crossingPct / 100) * 10000),
    bigNames: { crossing: top.filter((r) => r.crossed.length).length, total: top.length },
    // Lineup: biggest names first, the ones that cross your lines at the top.
    lineup: [...top].sort((a, b) => Number(b.crossed.length > 0) - Number(a.crossed.length > 0) || b.weight - a.weight),
  }
}

export function checkFund(symbol, lineKeys) {
  const fund = getSecurity(symbol)
  if (!fund || fund.type !== 'etf') return null
  return { fund, ...checkHoldings(fund.fund.constituents, lineKeys) }
}
