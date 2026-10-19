import { api } from '../client'

export const alertsService = {
  /** GET /alerts -> Alert[] (newest first) */
  list: () => api.get('/alerts'),

  /** GET /alerts/:id -> AlertDetail (what happened, score impact, exposure, sources) */
  get: (alertId) => api.get(`/alerts/${alertId}`),

  /** POST /alerts/:id/read */
  markRead: (alertId) => api.post(`/alerts/${alertId}/read`),

  /** POST /alerts/read-all */
  markAllRead: () => api.post('/alerts/read-all'),

  /** GET /alerts/:id/email -> rendered email payload (what the notification email contains) */
  getEmail: (alertId) => api.get(`/alerts/${alertId}/email`),
}
