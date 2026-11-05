// Synthetic, deterministic market data for the demo: monthly returns for a benchmark ("S&P 500") and every fictional
// company, seeded from its ticker. Backtests, track records and position values all read from the same series,
// which ends at the current month. None of this is real price data.
import { COMPANIES } from './data/companies'
import { TOPICS } from './data/topics'

export const HISTORY_MONTHS = 60
const MONTH_MS = 30.44 * 24 * 60 * 60 * 1000
const BENCH_MEAN = 0.0085
const BENCH_VOL = 0.042
// Topic alphas describe a typical basket; single companies are only partly exposed, so scale them up.
const ALPHA_SCALE = 1.7

const TOPIC_ALPHA = Object.fromEntries(TOPICS.map((t) => [t.key, t.alpha]))
const SIZE = {
  large: { beta: 1, vol: 0.14 },
  mid: { beta: 1.1, vol: 0.22 },
  small: { beta: 1.22, vol: 0.32 },
}
const companies = new Map(COMPANIES.map((c) => [c.symbol, c]))
const cache = new Map()

function hash(text) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function rng(seed) {
  let s = seed
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function normal(rand) {
  const u = 1 - rand()
  const v = rand()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

const memo = (key, build) => {
  if (!cache.has(key)) cache.set(key, build())
  return cache.get(key)
}

// Subtracts each block's average (blocks counted back from the latest month) so noise adds wiggle but no drift.
function withoutDrift(values, block) {
  const out = [...values]
  for (let end = out.length; end > 0; end -= block) {
    const start = Math.max(0, end - block)
    const avg = out.slice(start, end).reduce((sum, v) => sum + v, 0) / (end - start)
    for (let i = start; i < end; i++) out[i] -= avg
  }
  return out
}

export function benchmarkReturns() {
  return memo('$benchmark', () => {
    const rand = rng(hash('S&P 500 · outvest demo'))
    const noise = Array.from({ length: HISTORY_MONTHS }, () => BENCH_VOL * normal(rand))
    return withoutDrift(noise, HISTORY_MONTHS).map((n) => BENCH_MEAN + n)
  })
}

// Company return = market move scaled by beta + the topic's drift + company-specific noise that nets out each quarter.
function companyReturns(symbol) {
  return memo(symbol, () => {
    const company = companies.get(symbol)
    const rand = rng(hash(symbol))
    const { beta, vol } = SIZE[company?.size ?? 'mid']
    const topicAlpha = Object.entries(company?.exposure ?? {}).reduce(
      (sum, [topic, [share]]) => sum + share * (TOPIC_ALPHA[topic] ?? 0),
      0,
    )
    const alpha = topicAlpha * ALPHA_SCALE + (rand() - 0.5) * 0.03
    const noise = withoutDrift(
      Array.from({ length: HISTORY_MONTHS }, () => (vol / Math.sqrt(12)) * normal(rand)),
      3,
    )
    return benchmarkReturns().map((m, t) => BENCH_MEAN + beta * (m - BENCH_MEAN) + alpha / 12 + noise[t])
  })
}

const round1 = (n) => Math.round(n * 10) / 10
const round2 = (n) => Math.round(n * 100) / 100
const toPct = (growth) => round1((growth - 1) * 100)

function monthsAgoIso(months) {
  return new Date(Date.now() - months * MONTH_MS).toISOString()
}

// Growth of a monthly-rebalanced basket vs the benchmark over the last `months` months.
export function performance(weights, months = HISTORY_MONTHS) {
  const span = Math.min(HISTORY_MONTHS, Math.max(1, Math.round(months)))
  const bench = benchmarkReturns().slice(-span)
  const rows = weights.map(({ symbol, weight }) => ({ w: weight / 100, r: companyReturns(symbol).slice(-span) }))

  let basket = 1
  let benchmark = 1
  let peak = 1
  let maxDrawdown = 0
  let monthsAhead = 0
  const points = [{ basket: 100, benchmark: 100 }]
  for (let t = 0; t < span; t++) {
    const r = rows.reduce((sum, row) => sum + row.w * row.r[t], 0)
    basket *= 1 + r
    benchmark *= 1 + bench[t]
    peak = Math.max(peak, basket)
    maxDrawdown = Math.min(maxDrawdown, basket / peak - 1)
    if (r > bench[t]) monthsAhead++
    points.push({ basket: round2(basket * 100), benchmark: round2(benchmark * 100) })
  }

  // Derive the headline numbers from the rounded final point so they match the chart exactly.
  const basketReturn = round1(points.at(-1).basket - 100)
  const benchmarkReturn = round1(points.at(-1).benchmark - 100)
  return {
    months: span,
    startDate: monthsAgoIso(span),
    endDate: new Date().toISOString(),
    points,
    basketReturn,
    benchmarkReturn,
    excess: round1(basketReturn - benchmarkReturn),
    annualized: span >= 12 ? toPct(basket ** (12 / span)) : null,
    benchmarkAnnualized: span >= 12 ? toPct(benchmark ** (12 / span)) : null,
    maxDrawdown: round1(maxDrawdown * 100),
    monthsAhead,
  }
}

// Track record since a thesis was published. Under three weeks is too early to call.
export function performanceSince(weights, iso) {
  const days = (Date.now() - Date.parse(iso)) / (24 * 60 * 60 * 1000)
  if (days < 21) return { tooEarly: true, days: Math.max(0, Math.floor(days)) }
  return { tooEarly: false, days: Math.floor(days), ...performance(weights, days / 30.44) }
}

// Growth factors for money invested at `iso`, used to value positions.
export function growthSince(weights, iso) {
  const months = Math.round((Date.now() - Date.parse(iso)) / MONTH_MS)
  if (months < 1) return { basket: 1, benchmark: 1 }
  const result = performance(weights, months)
  return { basket: 1 + result.basketReturn / 100, benchmark: 1 + result.benchmarkReturn / 100 }
}

// Illustrative share price, used to show fractional share counts.
export function priceOf(symbol) {
  const seed = hash(`${symbol}:price`)
  return round2(12 + (seed % 23000) / 100)
}
