import { api } from '../client'

export const portfolioService = {
  /** GET /brokerages -> Brokerage[] */
  listBrokerages: () => api.get('/brokerages'),

  /** GET /portfolio/connections -> Connection[] (each with holdings) */
  listConnections: () => api.get('/portfolio/connections'),

  /** POST /portfolio/connections { brokerageId } -> Connection. Real backend: exchange an aggregator (Plaid/SnapTrade) token here. */
  link: (brokerageId) => api.post('/portfolio/connections', { brokerageId }),

  /** DELETE /portfolio/connections/:id */
  unlink: (connectionId) => api.delete(`/portfolio/connections/${connectionId}`),
}
