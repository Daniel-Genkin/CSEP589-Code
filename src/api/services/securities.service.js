import { api } from '../client'

export const securitiesService = {
  /** GET /securities/search?q= -> SecuritySummary[] */
  search: (q) => api.get('/securities/search', { q }),

  /** GET /securities/popular -> SecuritySummary[] */
  popular: () => api.get('/securities/popular'),

  /** GET /securities/lookup?symbols=A,B -> { found: SecuritySummary[], unknown: string[] } */
  lookup: (symbols) => api.get('/securities/lookup', { symbols: symbols.join(',') }),
}
