import { api } from '../client'

export const monitoringService = {
  /** GET /monitoring -> Monitoring | { locked: true, requiredPlan } */
  get: () => api.get('/monitoring'),

  /** PATCH /monitoring/settings { frequency?, sensitivity?, categories?, includeRebalances?, paused? } -> Settings */
  updateSettings: (settings) => api.patch('/monitoring/settings', settings),

  /** POST /monitoring/holdings { symbol } -> MonitoredHolding */
  watch: (symbol) => api.post('/monitoring/holdings', { symbol }),

  /** DELETE /monitoring/holdings/:symbol */
  unwatch: (symbol) => api.delete(`/monitoring/holdings/${symbol}`),

  /** POST /monitoring/checks -> { checkedAt, newAlerts: Alert[] }. Real backend runs this on a schedule and emails users. */
  checkNow: () => api.post('/monitoring/checks'),
}
