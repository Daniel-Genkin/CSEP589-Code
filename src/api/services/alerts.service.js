import { api } from '../client'

export const alertsService = {
  /** GET /alerts -> Alert[] (newest first). Alerts only fire when news affects one of your theses. */
  list: () => api.get('/alerts'),

  /** GET /alerts/:id -> AlertDetail (what happened, the claim it affects, companies in your basket, suggested action) */
  get: (alertId) => api.get(`/alerts/${alertId}`),

  /** POST /alerts/:id/read */
  markRead: (alertId) => api.post(`/alerts/${alertId}/read`),

  /** POST /alerts/read-all */
  markAllRead: () => api.post('/alerts/read-all'),

  /** POST /alerts/check -> { alert: Alert | null, reason: 'no-theses' | 'caught-up' | null } (demo: pulls the next relevant story) */
  check: () => api.post('/alerts/check'),
}
