import { ERROR_CODES } from '../../errors'
import { BAND_LABELS, CATEGORY_KEYS, bandOf, etfsHolding, getSecurity, toSummary } from '../catalog'
import { db } from '../db'
import { brokerageById, fail, monitoringOf, planOf, usageOf } from '../model'
import { randomId, round1 } from '../utils'

export const SCAN_STAGES = [
  'Gathering your holdings',
  'Unpacking ETFs into their companies',
  'Reading recent news from 40+ sources',
  'Scoring across 6 values',
  'Sorting your results',
]

const HEADLINES = {
  great: 'Your picks line up really well with your values.',
  good: 'Your picks are mostly aligned with your values.',
  mixed: 'Your picks are a mixed bag.',
  low: 'A few of your picks raise real concerns.',
}

function progressOf(scan) {
  const elapsed = Date.now() - Date.parse(scan.createdAt)
  const progress = Math.min(100, Math.round((elapsed / scan.durationMs) * 100))
  return {
    status: progress >= 100 ? 'complete' : 'running',
    progress,
    stage: Math.min(SCAN_STAGES.length - 1, Math.floor((progress / 100) * SCAN_STAGES.length)),
  }
}

function companiesCovered(holdings) {
  return holdings.reduce((sum, h) => {
    const sec = getSecurity(h.symbol)
    return sum + (sec.type === 'etf' ? sec.holdingsCount : 1)
  }, 0)
}

function buildResults(scan) {
  const totalValue = scan.holdings.reduce((sum, h) => sum + (h.value ?? 0), 0)
  const weighted = totalValue > 0

  const results = scan.holdings
    .map((h) => {
      const sec = getSecurity(h.symbol)
      const item = {
        ...toSummary(sec),
        blurb: sec.blurb,
        score: sec.score,
        trend: sec.trend,
        flags: sec.flags,
        summary: sec.summary,
        categories: sec.categories,
        news: {
          total: sec.news.length,
          positive: sec.news.filter((n) => n.sentiment === 'positive').length,
          negative: sec.news.filter((n) => n.sentiment === 'negative').length,
        },
        weight: weighted ? round1(((h.value ?? 0) / totalValue) * 100) : null,
      }
      if (sec.type === 'etf') {
        item.etf = {
          holdingsCount: sec.holdingsCount,
          bandMix: sec.fund.bandMix,
          topHoldings: sec.fund.constituents.slice(0, 3),
          nextRebalanceAt: sec.fund.rebalance.nextAt,
          projectedScore: sec.fund.rebalance.projectedScore,
          frequency: sec.fund.rebalance.frequency,
        }
      }
      return item
    })
    .sort((a, b) => b.score - a.score)

  const w = (item) => (weighted ? item.weight : 1)
  const totalWeight = results.reduce((sum, item) => sum + w(item), 0)
  const categories = Object.fromEntries(
    CATEGORY_KEYS.map((k) => [k, Math.round(results.reduce((sum, i) => sum + w(i) * i.categories[k].score, 0) / totalWeight)]),
  )
  const score = Math.round(results.reduce((sum, i) => sum + w(i) * i.score, 0) / totalWeight)
  const counts = { great: 0, good: 0, mixed: 0, low: 0 }
  for (const item of results) counts[bandOf(item.score)] += 1
  const rankedCategories = Object.entries(categories).sort((a, b) => b[1] - a[1])

  return {
    summary: {
      score,
      band: bandOf(score),
      headline: HEADLINES[bandOf(score)],
      counts,
      categories,
      strongest: rankedCategories[0][0],
      weakest: rankedCategories.at(-1)[0],
      weighted,
      stockCount: results.filter((r) => r.type === 'stock').length,
      etfCount: results.filter((r) => r.type === 'etf').length,
    },
    results,
  }
}

function serializeScan(scan, { withResults = false } = {}) {
  const state = progressOf(scan)
  const base = {
    id: scan.id,
    createdAt: scan.createdAt,
    source: scan.source,
    brokerageName: scan.brokerageId ? brokerageById(scan.brokerageId)?.name : null,
    holdingsCount: scan.holdings.length,
    companiesCovered: companiesCovered(scan.holdings),
    ...state,
    stages: SCAN_STAGES,
  }
  if (!withResults) {
    return {
      ...base,
      symbols: scan.holdings.map((h) => h.symbol),
      score: state.status === 'complete' ? buildResults(scan).summary.score : null,
    }
  }
  return {
    ...base,
    holdings: scan.holdings.map((h) => toSummary(getSecurity(h.symbol))),
    ...(state.status === 'complete' ? buildResults(scan) : {}),
  }
}

function findScan(user, scanId) {
  const scan = db.scans.find((s) => s.id === scanId && s.userId === user.id)
  if (!scan) fail(404, ERROR_CODES.NOT_FOUND, "We couldn't find that scan.")
  return scan
}

export default [
  {
    method: 'GET',
    path: '/scans',
    handler: ({ user }) =>
      db.scans
        .filter((s) => s.userId === user.id)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        .map((scan) => serializeScan(scan)),
  },
  {
    method: 'POST',
    path: '/scans',
    latency: 700,
    handler: ({ user, body }) => {
      const holdings = []
      const seen = new Set()
      for (const h of Array.isArray(body.holdings) ? body.holdings : []) {
        const symbol = String(h.symbol || '').trim().toUpperCase()
        if (!symbol || seen.has(symbol)) continue
        seen.add(symbol)
        holdings.push({ symbol, ...(typeof h.value === 'number' && { value: h.value }) })
      }
      if (!holdings.length) fail(422, ERROR_CODES.VALIDATION, 'Add at least one stock or ETF to scan.')
      if (holdings.length > 50) fail(422, ERROR_CODES.VALIDATION, 'Scans can include up to 50 holdings at a time.')

      const unknown = holdings.filter((h) => !getSecurity(h.symbol)).map((h) => h.symbol)
      if (unknown.length) {
        fail(422, ERROR_CODES.UNKNOWN_SYMBOL, `We don't have research on ${unknown.join(', ')} yet.`, { unknown })
      }

      const plan = planOf(user)
      const usage = usageOf(user)
      if (usage.scansLimit !== null && usage.scansUsed >= usage.scansLimit) {
        fail(402, ERROR_CODES.SCAN_LIMIT_REACHED, `You've used your free scan for this month.`, {
          limit: usage.scansLimit,
          resetsAt: usage.resetsAt,
          suggestedPlan: 'premium',
        })
      }
      if (plan.limits.symbolsPerScan !== null && holdings.length > plan.limits.symbolsPerScan) {
        fail(402, ERROR_CODES.SYMBOL_LIMIT_EXCEEDED, `Free scans include up to ${plan.limits.symbolsPerScan} stocks or ETFs.`, {
          limit: plan.limits.symbolsPerScan,
          suggestedPlan: 'premium',
        })
      }

      const etfCount = holdings.filter((h) => getSecurity(h.symbol).type === 'etf').length
      const connection = body.connectionId ? db.connections.find((c) => c.id === body.connectionId && c.userId === user.id) : null
      const scan = {
        id: randomId('scn', 6),
        userId: user.id,
        source: body.source === 'linked' && connection ? 'linked' : 'manual',
        connectionId: connection?.id ?? null,
        brokerageId: connection?.brokerageId ?? null,
        holdings,
        createdAt: new Date().toISOString(),
        durationMs: Math.min(12000, 6000 + holdings.length * 450 + etfCount * 1200),
      }
      db.scans.push(scan)
      return { id: scan.id, status: 'running' }
    },
  },
  {
    method: 'GET',
    path: '/scans/:scanId',
    latency: 200,
    handler: ({ user, params }) => serializeScan(findScan(user, params.scanId), { withResults: true }),
  },
  {
    method: 'GET',
    path: '/scans/:scanId/holdings/:symbol',
    handler: ({ user, params }) => {
      const scan = findScan(user, params.scanId)
      const sec = getSecurity(params.symbol.toUpperCase())
      if (!sec) fail(404, ERROR_CODES.UNKNOWN_SYMBOL, "We couldn't find that holding.")

      const totalValue = scan.holdings.reduce((sum, h) => sum + (h.value ?? 0), 0)
      const holding = scan.holdings.find((h) => h.symbol === sec.symbol)
      const monitoring = monitoringOf(user)
      const { fund, ...security } = sec

      return {
        scan: {
          id: scan.id,
          createdAt: scan.createdAt,
          source: scan.source,
          brokerageName: scan.brokerageId ? brokerageById(scan.brokerageId)?.name : null,
        },
        inScan: Boolean(holding),
        weight: holding && totalValue > 0 ? round1(((holding.value ?? 0) / totalValue) * 100) : null,
        parentEtfs: etfsHolding(sec.symbol, scan.holdings.map((h) => h.symbol)),
        security: { ...security, band: bandOf(sec.score), bandLabel: BAND_LABELS[bandOf(sec.score)] },
        fund: fund ?? null,
        watched: Boolean(monitoring?.symbols.includes(sec.symbol)),
        canWatch: planOf(user).limits.monitoring,
      }
    },
  },
]
