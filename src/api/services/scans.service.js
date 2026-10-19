import { api } from '../client'

export const scansService = {
  /** GET /scans -> ScanSummary[] (newest first) */
  list: () => api.get('/scans'),

  /** POST /scans { source: 'linked'|'manual', connectionId?, holdings: [{ symbol, value? }] } -> { id, status } */
  create: (payload) => api.post('/scans', payload),

  /** GET /scans/:id -> Scan (status 'running' with progress, or 'complete' with summary + results) */
  get: (scanId) => api.get(`/scans/${scanId}`),

  /** GET /scans/:id/holdings/:symbol -> HoldingAnalysis (categories, news, ETF breakdown, rebalance outlook) */
  getHolding: (scanId, symbol) => api.get(`/scans/${scanId}/holdings/${symbol}`),
}
