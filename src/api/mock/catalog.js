// Read-only lookups over the fictional company universe and the copilot's topic templates.
import { COMPANIES } from './data/companies'
import { TOPICS, TRANSITION } from './data/topics'

const bySymbol = new Map(COMPANIES.map((c) => [c.symbol, c]))
const ALL_TOPICS = [...TOPICS, TRANSITION]

export const MAX_BASKET = 12
export const MIN_BASKET = 2
export const WEIGHTINGS = ['exposure', 'equal', 'bold', 'steady']

export const getCompany = (symbol) => bySymbol.get(String(symbol || '').toUpperCase()) ?? null
export const getTopic = (key) => ALL_TOPICS.find((t) => t.key === key) ?? null
export const topicMeta = (topic) => ({ key: topic.key, label: topic.label, short: topic.short })
export const listTopics = () => TOPICS.map(topicMeta)

export const toSummary = (c) => ({
  symbol: c.symbol,
  name: c.name,
  sector: c.sector,
  size: c.size,
  color: c.color,
  blurb: c.blurb,
})

// Share of the company's business tied to the topic (0-1). Broad "transition" theses use its biggest climate line.
export function exposureOf(company, topicKey) {
  if (topicKey === TRANSITION.key) return Math.max(...Object.values(company.exposure).map(([share]) => share))
  return company.exposure[topicKey]?.[0] ?? 0
}

export function whyOf(company, topicKey) {
  if (topicKey === TRANSITION.key) {
    const [, [, why]] = Object.entries(company.exposure).sort((a, b) => b[1][0] - a[1][0])[0]
    return why
  }
  return company.exposure[topicKey]?.[1] ?? 'Little of its business ties directly to this idea.'
}

// Multipliers on exposure: "bold" leans into smaller, more volatile companies; "steady" into larger ones.
const SIZE_TILT = {
  exposure: { large: 1, mid: 1, small: 1 },
  bold: { large: 0.55, mid: 1, small: 1.7 },
  steady: { large: 1.7, mid: 1, small: 0.5 },
}

// Target weights in percent (one decimal) that always add up to exactly 100.
export function weightBasket(symbols, topicKey, weighting = 'exposure') {
  const companies = symbols.map(getCompany).filter(Boolean)
  if (!companies.length) return []
  const raw = companies.map((c) => {
    if (weighting === 'equal') return 1
    const tilt = SIZE_TILT[weighting] ?? SIZE_TILT.exposure
    // Floor so a company with no direct exposure still gets a small slice instead of zero.
    return Math.max(exposureOf(c, topicKey), 0.06) * tilt[c.size]
  })
  const total = raw.reduce((sum, v) => sum + v, 0)
  const weights = raw.map((v) => Math.round((v / total) * 1000) / 10)
  const drift = Math.round((100 - weights.reduce((sum, w) => sum + w, 0)) * 10) / 10
  const largest = weights.indexOf(Math.max(...weights))
  weights[largest] = Math.round((weights[largest] + drift) * 10) / 10
  return companies.map((c, i) => ({ symbol: c.symbol, weight: weights[i] }))
}

export function basketView(symbols, topicKey, weighting) {
  return weightBasket(symbols, topicKey, weighting)
    .map(({ symbol, weight }) => {
      const c = getCompany(symbol)
      return {
        ...toSummary(c),
        weight,
        exposure: Math.round(exposureOf(c, topicKey) * 100),
        why: whyOf(c, topicKey),
      }
    })
    .sort((a, b) => b.weight - a.weight)
}

// Companies the copilot would suggest adding: most exposed first, excluding what's already in the basket.
export function suggestionsFor(topicKey, exclude = [], limit = 6) {
  return COMPANIES.filter((c) => !exclude.includes(c.symbol) && exposureOf(c, topicKey) >= 0.1)
    .sort((a, b) => exposureOf(b, topicKey) - exposureOf(a, topicKey))
    .slice(0, limit)
    .map((c) => ({ ...toSummary(c), exposure: Math.round(exposureOf(c, topicKey) * 100), why: whyOf(c, topicKey) }))
}

export function searchCompanies(query, topicKey, limit = 8) {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return []
  return COMPANIES.filter(
    (c) => c.symbol.toLowerCase().startsWith(q) || c.name.toLowerCase().includes(q) || c.sector.toLowerCase().includes(q),
  )
    .sort((a, b) => Number(b.symbol.toLowerCase() === q) - Number(a.symbol.toLowerCase() === q))
    .slice(0, limit)
    .map((c) => ({
      ...toSummary(c),
      exposure: topicKey ? Math.round(exposureOf(c, topicKey) * 100) : null,
      why: topicKey ? whyOf(c, topicKey) : null,
    }))
}

// Finds companies the user mentions by ticker (upper case) or by name, in the order they appear in the text.
export function mentionedCompanies(text) {
  const lower = text.toLowerCase()
  const found = []
  for (const c of COMPANIES) {
    const name = c.name.toLowerCase()
    const first = name.split(/\s+/)[0]
    const positions = [
      text.search(new RegExp(`\\b${c.symbol}\\b`)),
      lower.indexOf(name),
      first.length >= 5 ? lower.search(new RegExp(`\\b${first}\\b`)) : -1,
    ].filter((i) => i >= 0)
    if (positions.length) found.push({ company: c, at: Math.min(...positions) })
  }
  return found.sort((a, b) => a.at - b.at).map((f) => f.company)
}
