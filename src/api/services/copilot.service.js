import { api } from '../client'

export const copilotService = {
  /** GET /public/themes -> { themes: [{ key, label, live, topics: [{ key, label, short }] }] } (no auth) */
  themes: () => api.get('/public/themes'),

  /**
   * POST /public/copilot/preview { idea } -> ThesisPreview (no auth, nothing saved)
   * { idea, topic, title, statement, notice, claims, counterarguments, basket, backtest, intro }
   * 422 OFF_THEME (details.suggestions) when the idea has no climate angle.
   */
  preview: (idea) => api.post('/public/copilot/preview', { idea }),
}
