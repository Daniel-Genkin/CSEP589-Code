import { api } from '../client'

export const thesesService = {
  /** GET /theses?scope=mine|following -> ThesisSummary[] */
  list: (scope = 'mine') => api.get('/theses', { scope }),

  /** POST /theses { idea } -> ThesisDetail (the copilot drafts claims, basket, counterarguments and a backtest). 422 OFF_THEME. */
  create: (idea) => api.post('/theses', { idea }),

  /** GET /theses/:id -> ThesisDetail (auth optional; drafts are only visible to their author) */
  get: (thesisId) => api.get(`/theses/${thesisId}`),

  /** PATCH /theses/:id { title?, statement?, weighting? } -> ThesisDetail */
  update: (thesisId, patch) => api.patch(`/theses/${thesisId}`, patch),

  /** DELETE /theses/:id (drafts without an open position only) */
  remove: (thesisId) => api.delete(`/theses/${thesisId}`),

  /** POST /theses/:id/basket { symbol } -> ThesisDetail */
  addCompany: (thesisId, symbol) => api.post(`/theses/${thesisId}/basket`, { symbol }),

  /** DELETE /theses/:id/basket/:symbol -> ThesisDetail */
  removeCompany: (thesisId, symbol) => api.delete(`/theses/${thesisId}/basket/${symbol}`),

  /** POST /theses/:id/messages { text } -> ThesisDetail (includes the copilot's reply; the basket may change) */
  sendMessage: (thesisId, text) => api.post(`/theses/${thesisId}/messages`, { text }),

  /** POST /theses/:id/publish -> ThesisDetail (track record starts now) */
  publish: (thesisId) => api.post(`/theses/${thesisId}/publish`),

  /** POST /theses/:id/follow -> { isFollowing, followers } */
  follow: (thesisId) => api.post(`/theses/${thesisId}/follow`),

  /** DELETE /theses/:id/follow -> { isFollowing, followers } */
  unfollow: (thesisId) => api.delete(`/theses/${thesisId}/follow`),

  /** POST /theses/:id/comments { kind: challenge|suggestion|comment, text, claimId?, symbol? } -> Comment */
  comment: (thesisId, payload) => api.post(`/theses/${thesisId}/comments`, payload),

  /** POST /theses/:id/comments/:commentId/accept -> ThesisDetail (adds the suggested company) */
  acceptSuggestion: (thesisId, commentId) => api.post(`/theses/${thesisId}/comments/${commentId}/accept`),

  /** POST /theses/:id/comments/:commentId/dismiss -> ThesisDetail */
  dismissSuggestion: (thesisId, commentId) => api.post(`/theses/${thesisId}/comments/${commentId}/dismiss`),

  /** POST /theses/:id/invest { amount, schedule } -> { position, order }. 409 ACCOUNT_REQUIRED, 422 MIN_INVESTMENT. */
  invest: (thesisId, payload) => api.post(`/theses/${thesisId}/invest`, payload),
}
