import { ERROR_CODES } from '../../errors'
import { CATEGORY_KEYS, getSecurity, toSummary } from '../catalog'
import { db } from '../db'
import { fail, monitoringOf, planOf, requireMonitoringPlan, requireSecurity } from '../model'
import { ALERT_POOL } from '../seed'
import { HOUR, clone, randomId } from '../utils'
import { analysisLinkFor, serializeAlert } from './alerts'

const FREQUENCIES = ['instant', 'daily', 'weekly']
const SENSITIVITIES = ['major', 'balanced', 'all']

function serializeHolding(user, symbol) {
  const sec = getSecurity(symbol)
  const alerts = db.alerts
    .filter((a) => a.userId === user.id && a.symbol === symbol)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  return {
    ...toSummary(sec),
    score: sec.score,
    trend: sec.trend,
    holdingsCount: sec.holdingsCount ?? null,
    alertsCount: alerts.length,
    lastAlertAt: alerts[0]?.createdAt ?? null,
    lastAlertKind: alerts[0]?.kind ?? null,
    analysisLink: analysisLinkFor(user, symbol),
  }
}

function alertMatchesSettings(candidate, settings) {
  if (candidate.kind === 'forecast') return settings.includeRebalances
  if (!candidate.categoryChanges?.length) return true
  return candidate.categoryChanges.some((c) => settings.categories.includes(c.key))
}

export default [
  {
    method: 'GET',
    path: '/monitoring',
    handler: ({ user }) => {
      const monitoring = monitoringOf(user)
      if (!planOf(user).limits.monitoring) {
        return { locked: true, requiredPlan: 'pro', watchCount: monitoring.symbols.length }
      }
      const alerts = db.alerts.filter((a) => a.userId === user.id)
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()
      return {
        locked: false,
        settings: { ...monitoring.settings, email: user.email },
        holdings: monitoring.symbols.map((symbol) => serializeHolding(user, symbol)),
        lastCheckedAt: monitoring.lastCheckedAt,
        nextCheckAt: monitoring.lastCheckedAt ? new Date(Date.parse(monitoring.lastCheckedAt) + HOUR).toISOString() : null,
        stats: {
          watching: monitoring.symbols.length,
          companiesCovered: monitoring.symbols.reduce((sum, s) => sum + (getSecurity(s).holdingsCount ?? 1), 0),
          alertsThisMonth: alerts.filter((a) => Date.parse(a.createdAt) >= monthStart).length,
          unread: alerts.filter((a) => !a.readAt).length,
        },
      }
    },
  },
  {
    method: 'PATCH',
    path: '/monitoring/settings',
    handler: ({ user, body }) => {
      requireMonitoringPlan(user)
      const { settings } = monitoringOf(user)
      if ('frequency' in body) {
        if (!FREQUENCIES.includes(body.frequency)) fail(422, ERROR_CODES.VALIDATION, 'Unknown alert frequency.')
        settings.frequency = body.frequency
      }
      if ('sensitivity' in body) {
        if (!SENSITIVITIES.includes(body.sensitivity)) fail(422, ERROR_CODES.VALIDATION, 'Unknown alert sensitivity.')
        settings.sensitivity = body.sensitivity
      }
      if (Array.isArray(body.categories)) settings.categories = body.categories.filter((k) => CATEGORY_KEYS.includes(k))
      if ('includeRebalances' in body) settings.includeRebalances = Boolean(body.includeRebalances)
      return { ...settings, email: user.email }
    },
  },
  {
    method: 'POST',
    path: '/monitoring/holdings',
    handler: ({ user, body }) => {
      requireMonitoringPlan(user)
      const sec = requireSecurity(body.symbol)
      const monitoring = monitoringOf(user)
      if (!monitoring.symbols.includes(sec.symbol)) monitoring.symbols.push(sec.symbol)
      return serializeHolding(user, sec.symbol)
    },
  },
  {
    method: 'DELETE',
    path: '/monitoring/holdings/:symbol',
    handler: ({ user, params }) => {
      requireMonitoringPlan(user)
      const monitoring = monitoringOf(user)
      monitoring.symbols = monitoring.symbols.filter((s) => s !== params.symbol.toUpperCase())
      return null
    },
  },
  {
    method: 'POST',
    path: '/monitoring/checks',
    latency: 1800,
    handler: ({ user }) => {
      requireMonitoringPlan(user)
      const monitoring = monitoringOf(user)
      const now = new Date().toISOString()
      monitoring.lastCheckedAt = now

      const newAlerts = []
      while (monitoring.poolCursor < ALERT_POOL.length && !newAlerts.length) {
        const candidate = ALERT_POOL[monitoring.poolCursor]
        monitoring.poolCursor += 1
        if (!monitoring.symbols.includes(candidate.symbol)) continue
        if (!alertMatchesSettings(candidate, monitoring.settings)) continue
        const alert = { ...clone(candidate), id: randomId('alt'), userId: user.id, createdAt: now, readAt: null }
        db.alerts.push(alert)
        newAlerts.push(serializeAlert(alert))
      }
      return { checkedAt: now, newAlerts }
    },
  },
]
