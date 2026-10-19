// Derived research data: what the real backend's scoring pipeline would compute per security.
import { ETFS, POPULAR_SYMBOLS, STOCKS } from './data/securities'
import { DAY, isoAgo, isoAhead, joinWords, mean, round1 } from './utils'

export const CATEGORY_KEYS = ['climate', 'labor', 'equity', 'privacy', 'animals', 'governance']

export const CATEGORY_LABELS = {
  climate: 'Planet & Climate',
  labor: 'Workers & Fair Pay',
  equity: 'Diversity & Inclusion',
  privacy: 'Privacy & Data',
  animals: 'Animal Welfare',
  governance: 'Transparency & Lobbying',
}

const PHRASES = {
  climate: 'climate',
  labor: 'worker treatment',
  equity: 'inclusion',
  privacy: 'privacy',
  animals: 'animal welfare',
  governance: 'transparency',
}

export const BAND_LABELS = { great: 'Strongly aligned', good: 'Mostly aligned', mixed: 'Mixed bag', low: 'Concerning' }

export function bandOf(score) {
  if (score >= 80) return 'great'
  if (score >= 65) return 'good'
  if (score >= 45) return 'mixed'
  return 'low'
}

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

function prepareNews(symbol, items) {
  return items.map((item, index) => ({
    id: `${symbol.toLowerCase()}-${index + 1}`,
    title: item.title,
    source: item.source,
    url: `https://example.com/news/${slugify(item.title)}`,
    publishedAt: isoAgo(item.daysAgo * DAY),
    sentiment: item.sentiment,
    summary: item.summary,
    categories: item.categories,
    impact: item.impact,
  }))
}

function summarize(sec) {
  const ranked = CATEGORY_KEYS.map((k) => [k, sec.categories[k].score]).sort((a, b) => b[1] - a[1])
  const [best1, best2] = ranked.map(([k]) => PHRASES[k])
  const [worst1, worst2] = ranked.reverse().map(([k]) => PHRASES[k])
  const band = bandOf(sec.score)
  let text
  if (band === 'great') text = `${sec.name} lines up well with the values we track, especially ${best1} and ${best2}.`
  else if (band === 'good') text = `${sec.name} is mostly aligned. It's strong on ${best1}, with room to improve on ${worst1}.`
  else if (band === 'mixed') text = `${sec.name} is a mixed bag: strong on ${best1}, but ${worst1} and ${worst2} hold it back.`
  else text = `${sec.name} raises real concerns, especially around ${worst1} and ${worst2}.`
  if (sec.type === 'etf') text += ` As an ETF, this score blends all ${sec.holdingsCount} companies inside, weighted by size.`
  return text
}

/* ---------- Stocks ---------- */

const stocks = new Map(
  STOCKS.map((raw) => {
    const categories = Object.fromEntries(
      CATEGORY_KEYS.map((k) => [k, { score: raw.categories[k][0], note: raw.categories[k][1] }]),
    )
    const sec = {
      symbol: raw.symbol,
      name: raw.name,
      type: 'stock',
      sector: raw.sector,
      color: raw.color,
      blurb: raw.blurb,
      trend: raw.trend,
      flags: raw.flags,
      categories,
      score: Math.round(mean(CATEGORY_KEYS.map((k) => categories[k].score))),
      news: prepareNews(raw.symbol, raw.news),
    }
    sec.summary = summarize(sec)
    return [raw.symbol, sec]
  }),
)

/* ---------- ETFs ---------- */

const scoresOf = (sec) => Object.fromEntries(CATEGORY_KEYS.map((k) => [k, sec.categories[k].score]))

function blend(raw, constituents) {
  const parts = [
    ...constituents.filter((c) => c.weight > 0).map((c) => ({ weight: c.weight, scores: scoresOf(stocks.get(c.symbol)) })),
    { weight: raw.others.weight, scores: raw.others.categories },
  ]
  const total = parts.reduce((sum, p) => sum + p.weight, 0)
  return Object.fromEntries(
    CATEGORY_KEYS.map((k) => [k, parts.reduce((sum, p) => sum + p.weight * p.scores[k], 0) / total]),
  )
}

function fundCategoryNote(raw, key) {
  const held = raw.constituents
    .map((c) => ({ ...c, sec: stocks.get(c.symbol) }))
    .sort((a, b) => b.weight - a.weight)
  const label = (h) => `${h.sec.name} (${h.sec.categories[key].score})`
  const lifts = held.filter((h) => h.sec.categories[key].score >= 75).slice(0, 2)
  const drags = held.filter((h) => h.sec.categories[key].score < 45).slice(0, 2)
  const others = `The other ${raw.others.count} companies average ${raw.others.categories[key]}.`
  const parts = []
  if (lifts.length) parts.push(`Lifted by ${joinWords(lifts.map(label))}`)
  if (drags.length) parts.push(`${lifts.length ? 'held back by' : 'Held back by'} ${joinWords(drags.map(label))}`)
  return parts.length ? `${parts.join(', ')}. ${others}` : `Its biggest holdings sit close to the fund average. ${others}`
}

function bandMix(raw) {
  const mix = { great: 0, good: 0, mixed: 0, low: 0 }
  for (const c of raw.constituents) mix[bandOf(stocks.get(c.symbol).score)] += c.weight
  for (const [band, share] of Object.entries(raw.others.bands)) mix[band] += share * raw.others.weight
  const total = Object.values(mix).reduce((sum, v) => sum + v, 0)
  return Object.fromEntries(Object.entries(mix).map(([k, v]) => [k, round1((v / total) * 100)]))
}

function rebalanceOutlook(raw, currentExact) {
  const currentScore = Math.round(mean(Object.values(currentExact)))
  const weights = new Map(raw.constituents.map((c) => [c.symbol, c.weight]))

  const changes = raw.rebalance.changes.map((change) => {
    const sec = stocks.get(change.symbol)
    const from = weights.get(change.symbol) ?? 0
    const kind = from === 0 ? 'add' : change.to === 0 ? 'remove' : change.to > from ? 'increase' : 'decrease'
    const direction = Math.sign((change.to - from) * (sec.score - currentScore))
    return {
      symbol: sec.symbol,
      name: sec.name,
      color: sec.color,
      score: sec.score,
      from,
      to: change.to,
      kind,
      reason: change.reason,
      effect: direction > 0 ? 'helps' : direction < 0 ? 'hurts' : 'neutral',
    }
  })

  for (const change of raw.rebalance.changes) weights.set(change.symbol, change.to)
  const projectedExact = blend(
    raw,
    [...weights].map(([symbol, weight]) => ({ symbol, weight })),
  )
  const projectedScore = Math.round(mean(Object.values(projectedExact)))

  return {
    frequency: raw.rebalance.frequency,
    nextAt: isoAhead(raw.rebalance.daysAhead * DAY),
    method: raw.rebalance.method,
    confidence: raw.rebalance.confidence,
    summary: raw.rebalance.summary,
    currentScore,
    projectedScore,
    projectedRange: raw.rebalance.confidence === 'Announced' ? [projectedScore, projectedScore] : [projectedScore - 1, projectedScore + 1],
    categoryShifts: Object.fromEntries(
      CATEGORY_KEYS.map((k) => [k, Math.round(projectedExact[k]) - Math.round(currentExact[k])]),
    ),
    changes,
  }
}

const etfs = new Map(
  ETFS.map((raw) => {
    const exact = blend(raw, raw.constituents)
    const categories = Object.fromEntries(
      CATEGORY_KEYS.map((k) => [k, { score: Math.round(exact[k]), note: fundCategoryNote(raw, k) }]),
    )
    const constituents = raw.constituents.map((c) => {
      const sec = stocks.get(c.symbol)
      return { symbol: sec.symbol, name: sec.name, color: sec.color, sector: sec.sector, weight: c.weight, score: sec.score }
    })
    const viaNews = [...constituents]
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 4)
      .map((c) => ({ ...stocks.get(c.symbol).news[0], via: { symbol: c.symbol, name: c.name, weight: c.weight } }))

    const sec = {
      symbol: raw.symbol,
      name: raw.name,
      type: 'etf',
      sector: raw.sector,
      color: raw.color,
      blurb: raw.blurb,
      trend: raw.trend,
      flags: [...new Set(constituents.flatMap((c) => stocks.get(c.symbol).flags))],
      categories,
      score: Math.round(mean(Object.values(exact))),
      issuer: raw.issuer,
      holdingsCount: raw.holdingsCount,
      expenseRatio: raw.expenseRatio,
      strategy: raw.strategy,
      insight: raw.insight,
      news: [...prepareNews(raw.symbol, raw.news), ...viaNews].sort(
        (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
      ),
      fund: {
        constituents,
        others: {
          count: raw.others.count,
          weight: raw.others.weight,
          score: Math.round(mean(Object.values(raw.others.categories))),
        },
        bandMix: bandMix(raw),
        rebalance: rebalanceOutlook(raw, exact),
      },
    }
    sec.summary = summarize(sec)
    return [raw.symbol, sec]
  }),
)

/* ---------- Public helpers ---------- */

export const getSecurity = (symbol) => stocks.get(symbol) ?? etfs.get(symbol) ?? null

export const allSecurities = () => [...stocks.values(), ...etfs.values()]

export const popularSecurities = () => POPULAR_SYMBOLS.map(getSecurity)

export const findNews = (newsId) => {
  for (const sec of allSecurities()) {
    const item = sec.news.find((n) => n.id === newsId && !n.via)
    if (item) return { ...item, symbol: sec.symbol }
  }
  return null
}

export const toSummary = (sec) => ({
  symbol: sec.symbol,
  name: sec.name,
  type: sec.type,
  sector: sec.sector,
  color: sec.color,
})

// ETFs (from a list of symbols) that hold `symbol`, with the fund weight.
export function etfsHolding(symbol, candidates) {
  return candidates
    .map(getSecurity)
    .filter((sec) => sec?.type === 'etf')
    .map((etf) => ({ etf, holding: etf.fund.constituents.find((c) => c.symbol === symbol) }))
    .filter((x) => x.holding)
    .map(({ etf, holding }) => ({ symbol: etf.symbol, name: etf.name, color: etf.color, weight: holding.weight }))
}
