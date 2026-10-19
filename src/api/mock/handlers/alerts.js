import { ERROR_CODES } from '../../errors'
import { BAND_LABELS, CATEGORY_KEYS, CATEGORY_LABELS, bandOf, etfsHolding, findNews, getSecurity, toSummary } from '../catalog'
import { db } from '../db'
import { brokerageById, fail, latestConnection, monitoringOf } from '../model'
import { joinWords, round1 } from '../utils'

function resolveScores(alert) {
  if (alert.kind !== 'forecast') {
    return { scoreBefore: alert.scoreBefore, scoreAfter: alert.scoreAfter, categoryChanges: alert.categoryChanges }
  }
  // Forecasts are computed live from the fund's rebalance projection.
  const sec = getSecurity(alert.symbol)
  const outlook = sec.fund.rebalance
  return {
    scoreBefore: outlook.currentScore,
    scoreAfter: outlook.projectedScore,
    categoryChanges: CATEGORY_KEYS.filter((k) => outlook.categoryShifts[k] !== 0).map((k) => ({
      key: k,
      before: sec.categories[k].score,
      after: sec.categories[k].score + outlook.categoryShifts[k],
    })),
  }
}

export function serializeAlert(alert) {
  const sec = getSecurity(alert.symbol)
  const scores = resolveScores(alert)
  return {
    id: alert.id,
    symbol: alert.symbol,
    kind: alert.kind,
    title: alert.title,
    summary: alert.summary,
    createdAt: alert.createdAt,
    readAt: alert.readAt,
    security: { ...toSummary(sec), score: sec.score },
    ...scores,
    categoryChanges: [...scores.categoryChanges].sort(
      (a, b) => Math.abs(b.after - b.before) - Math.abs(a.after - a.before),
    ),
    bandBefore: bandOf(scores.scoreBefore),
    bandAfter: bandOf(scores.scoreAfter),
    forecastFor: alert.kind === 'forecast' ? sec.fund.rebalance.nextAt : null,
  }
}

function exposureFor(user, symbol) {
  const connection = latestConnection(user)
  if (connection) {
    const total = connection.holdings.reduce((sum, h) => sum + (h.value ?? 0), 0)
    const direct = connection.holdings.find((h) => h.symbol === symbol)
    const directWeight = direct ? round1((direct.value / total) * 100) : null
    const viaEtfs = etfsHolding(symbol, connection.holdings.map((h) => h.symbol)).map((etf) => {
      const etfValue = connection.holdings.find((h) => h.symbol === etf.symbol).value
      return { ...etf, portfolioWeight: round1((etfValue / total) * etf.weight) }
    })
    return {
      source: 'linked',
      brokerageName: brokerageById(connection.brokerageId)?.name,
      holdsDirectly: Boolean(direct),
      directWeight,
      viaEtfs,
      totalWeight: round1((directWeight ?? 0) + viaEtfs.reduce((sum, e) => sum + e.portfolioWeight, 0)),
    }
  }
  const watched = monitoringOf(user)?.symbols ?? []
  return {
    source: 'watchlist',
    holdsDirectly: watched.includes(symbol),
    directWeight: null,
    viaEtfs: etfsHolding(symbol, watched).map((etf) => ({ ...etf, portfolioWeight: null })),
    totalWeight: null,
  }
}

function whyItMatters(user, alert, changes) {
  const changed = changes.map((c) => c.key)
  const matched = changed.filter((k) => user.values.includes(k))
  const labels = (keys) => joinWords(keys.map((k) => CATEGORY_LABELS[k]))
  const verb = (keys) => (keys.length > 1 ? 'matter' : 'matters')
  if (matched.length) {
    if (alert.kind === 'positive') return `You told us ${labels(matched)} ${verb(matched)} to you, and this is a real step in the right direction.`
    if (alert.kind === 'forecast') return `This forecast touches ${labels(matched)}, which you told us ${verb(matched)} to you.`
    return `You told us ${labels(matched)} ${verb(matched)} to you, and that's exactly where this landed.`
  }
  if (!changed.length) return "This doesn't move any single value much, but it's worth knowing about."
  return `This mostly affects ${labels(changed)}. That isn't one of the values you marked as most important, but it still moves the overall score.`
}

export function analysisLinkFor(user, symbol) {
  const scans = db.scans
    .filter((s) => s.userId === user.id)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  if (!scans.length) return null
  const symbolsOf = (scan) => scan.holdings.map((h) => h.symbol)
  const scan =
    scans.find((s) => symbolsOf(s).includes(symbol)) ??
    scans.find((s) => etfsHolding(symbol, symbolsOf(s)).length) ??
    scans[0]
  return { scanId: scan.id, symbol }
}

function findAlert(user, alertId) {
  const alert = db.alerts.find((a) => a.id === alertId && a.userId === user.id)
  if (!alert) fail(404, ERROR_CODES.NOT_FOUND, "We couldn't find that alert.")
  return alert
}

function alertDetail(user, alert) {
  const base = serializeAlert(alert)
  const sec = getSecurity(alert.symbol)
  return {
    ...base,
    whatHappened: alert.whatHappened,
    whyItMatters: whyItMatters(user, alert, base.categoryChanges),
    matchedValues: base.categoryChanges.map((c) => c.key).filter((k) => user.values.includes(k)),
    security: {
      ...base.security,
      bandLabel: BAND_LABELS[bandOf(sec.score)],
      holdingsCount: sec.holdingsCount ?? null,
    },
    sources: alert.sourceNewsIds.map(findNews).filter(Boolean),
    exposure: exposureFor(user, alert.symbol),
    emailedTo: user.email,
    emailedAt: alert.createdAt,
    analysisLink: analysisLinkFor(user, alert.symbol),
    rebalance: alert.kind === 'forecast' ? sec.fund.rebalance : null,
  }
}

export default [
  {
    method: 'GET',
    path: '/alerts',
    handler: ({ user }) =>
      db.alerts
        .filter((a) => a.userId === user.id)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        .map(serializeAlert),
  },
  {
    method: 'POST',
    path: '/alerts/read-all',
    handler: ({ user }) => {
      const now = new Date().toISOString()
      for (const alert of db.alerts) if (alert.userId === user.id && !alert.readAt) alert.readAt = now
      return null
    },
  },
  {
    method: 'GET',
    path: '/alerts/:alertId',
    handler: ({ user, params }) => alertDetail(user, findAlert(user, params.alertId)),
  },
  {
    method: 'POST',
    path: '/alerts/:alertId/read',
    latency: 120,
    handler: ({ user, params }) => {
      const alert = findAlert(user, params.alertId)
      alert.readAt ??= new Date().toISOString()
      return serializeAlert(alert)
    },
  },
  {
    method: 'GET',
    path: '/alerts/:alertId/email',
    handler: ({ user, params }) => {
      const alert = findAlert(user, params.alertId)
      const detail = alertDetail(user, alert)
      const name = detail.security.name
      const subject =
        alert.kind === 'positive'
          ? `Good news about ${name}`
          : alert.kind === 'forecast'
            ? `Heads up: ${detail.security.symbol} is about to change`
            : `Heads up: something changed with ${name}`
      return {
        from: 'outvest <alerts@outvest.app>',
        to: user.email,
        subject,
        preheader: alert.summary,
        sentAt: alert.createdAt,
        firstName: user.name.split(' ')[0],
        alert: detail,
      }
    },
  },
]
