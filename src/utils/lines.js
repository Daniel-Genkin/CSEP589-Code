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

// Look through funds: a portfolio's real exposure to each company, in % of the whole portfolio.
// positions: [{ symbol, weight }] where weight is the % of the portfolio (should sum to ~100).
export function lookThrough(positions) {
  const byCompany = new Map()
  const unknown = []
  for (const pos of positions) {
    const sec = getSecurity(pos.symbol)
    if (!sec) {
      unknown.push(pos.symbol)
      continue
    }
    const parts = sec.type === 'etf' ? sec.fund.constituents.map((c) => ({ symbol: c.symbol, weight: (c.weight * pos.weight) / 100 })) : [{ symbol: sec.symbol, weight: pos.weight }]
    for (const part of parts) byCompany.set(part.symbol, (byCompany.get(part.symbol) ?? 0) + part.weight)
  }
  return { holdings: [...byCompany].map(([symbol, weight]) => ({ symbol, weight })), unknown }
}

export function checkPortfolio(positions, lineKeys) {
  const { holdings, unknown } = lookThrough(positions)
  return { ...checkHoldings(holdings, lineKeys), unknown }
}

// Turn "VOO 60, NOVA 25%, QQQ $1,200" (or one per line) into positions that sum to 100.
export function parseHoldings(text) {
  const entries = text
    .split(/[\n,;]+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const match = chunk.match(/^\$?([A-Za-z.]{1,6})\s*[:=-]?\s*\$?([\d,.]+)?\s*%?$/)
      if (!match) return null
      return { symbol: match[1].toUpperCase(), amount: match[2] ? parseFloat(match[2].replace(/,/g, '')) : null }
    })
    .filter(Boolean)
  if (!entries.length) return []
  const withAmounts = entries.filter((e) => e.amount)
  const equal = 100 / entries.length
  const total = withAmounts.reduce((sum, e) => sum + e.amount, 0)
  return entries.map((e) => ({
    symbol: e.symbol,
    weight: withAmounts.length === entries.length && total > 0 ? (e.amount / total) * 100 : equal,
  }))
}

// Premade portfolios so visitors get a result without sharing anything.
export const EXAMPLE_PORTFOLIOS = [
  {
    key: 'roth',
    name: 'First-job Roth IRA',
    blurb: 'The default: an index fund and a little tech.',
    positions: [
      { symbol: 'VOO', weight: 70 },
      { symbol: 'QQQ', weight: 20 },
      { symbol: 'NOVA', weight: 10 },
    ],
  },
  {
    key: 'app',
    name: 'Brand-loyal app account',
    blurb: 'A total-market fund plus the companies you use every day.',
    positions: [
      { symbol: 'VTI', weight: 50 },
      { symbol: 'LOOP', weight: 20 },
      { symbol: 'QUIK', weight: 15 },
      { symbol: 'VOLT', weight: 15 },
    ],
  },
  {
    key: 'safe',
    name: 'The "safe" dividend mix',
    blurb: 'Steady payers, as recommended by your uncle.',
    positions: [
      { symbol: 'SCHD', weight: 60 },
      { symbol: 'VOO', weight: 30 },
      { symbol: 'BURG', weight: 10 },
    ],
  },
  {
    key: 'green',
    name: 'Climate-curious',
    blurb: 'Clean energy and an "ESG" fund. Surely this one is clean?',
    positions: [
      { symbol: 'ICLN', weight: 40 },
      { symbol: 'ESGU', weight: 40 },
      { symbol: 'SOLR', weight: 20 },
    ],
  },
]

// Borrow someone's lines. These are made-up sample profiles, never real people:
// real partners (creators, nonprofits) would publish their own lines later.
export const TRUSTED_PROFILES = [
  { key: 'climate', name: 'Climate Cass', handle: '@climatecass', kind: 'Sample creator', bg: '#E85A2A', lines: ['oil', 'senators'] },
  { key: 'labor', name: 'Union Hall Weekly', handle: 'sample newsletter', kind: 'Sample newsletter', bg: '#F07AB6', lines: ['pay', 'fair'] },
  { key: 'privacy', name: 'Data Detox Club', handle: 'sample campus club', kind: 'Sample club', bg: '#8A6CF2', lines: ['data', 'senators'] },
  { key: 'animals', name: 'Bunny Brigade', handle: 'sample nonprofit', kind: 'Sample nonprofit', bg: '#F7C54E', lines: ['bunnies', 'oil'] },
  { key: 'peace', name: 'Peace Fund Pals', handle: 'sample group', kind: 'Sample group', bg: '#3A2A9E', fg: '#FFF4D6', lines: ['weapons', 'senators'] },
]

// A basket = a fund minus companies the user chose to drop. The rest of the fund is
// scaled back up to 100%. The user picks; Rallie never recommends what to remove.
export function checkBasket(symbol, removed, lineKeys) {
  const fund = getSecurity(symbol)
  if (!fund || fund.type !== 'etf') return null
  const drop = new Set(removed)
  const removedPct = fund.fund.constituents.filter((c) => drop.has(c.symbol)).reduce((sum, c) => sum + c.weight, 0)
  const scale = 100 / (100 - removedPct)
  const kept = fund.fund.constituents.filter((c) => !drop.has(c.symbol)).map((c) => ({ symbol: c.symbol, weight: c.weight * scale }))
  return { fund, removedPct, before: checkFund(symbol, lineKeys), after: checkHoldings(kept, lineKeys) }
}
