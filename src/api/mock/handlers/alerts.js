import { ERROR_CODES } from '../../errors'
import { getTopic } from '../catalog'
import { db } from '../db'
import { alertDetail, fail, openPosition, serializeAlert } from '../model'
import { alertFromNews } from '../seed'

function findAlert(user, alertId) {
  const alert = db.alerts.find((a) => a.id === alertId && a.userId === user.id)
  if (!alert) fail(404, ERROR_CODES.NOT_FOUND, "We couldn't find that alert.")
  return alert
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
    // Demo stand-in for the news pipeline: pulls the next unseen story that affects one of the user's theses.
    method: 'POST',
    path: '/alerts/check',
    latency: 1400,
    handler: ({ user }) => {
      const theses = db.theses
        .filter((t) => t.userId === user.id && (t.status === 'published' || openPosition(user.id, t.id)))
        .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
      if (!theses.length) return { alert: null, reason: 'no-theses' }
      const seen = new Set(db.alerts.filter((a) => a.userId === user.id).map((a) => a.newsKey))
      for (const thesis of theses) {
        const news = getTopic(thesis.topicKey).news
        const index = news.findIndex((item, i) => !seen.has(`${thesis.topicKey}:${i}`) && user.preferences[item.kind] !== false)
        if (index === -1) continue
        const alert = alertFromNews(user.id, thesis, index, new Date().toISOString())
        db.alerts.push(alert)
        return { alert: serializeAlert(alert), reason: null }
      }
      return { alert: null, reason: 'caught-up' }
    },
  },
  {
    method: 'GET',
    path: '/alerts/:alertId',
    handler: ({ user, params }) => alertDetail(findAlert(user, params.alertId), user),
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
]
