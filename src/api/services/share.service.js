import { api } from '../client'

export const shareService = {
  /** POST /shares { scanId, symbol, note? } -> { id, path, createdAt } */
  create: (payload) => api.post('/shares', payload),

  /** GET /public/shares/:id -> PublicShare (no auth required) */
  getPublic: (shareId) => api.get(`/public/shares/${shareId}`),
}
