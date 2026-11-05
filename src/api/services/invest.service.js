import { api } from '../client'

export const investService = {
  /** GET /invest/banks -> [{ id, name }] (funding sources for the account application) */
  banks: () => api.get('/invest/banks'),

  /** GET /invest/account -> BrokerageAccount | null */
  getAccount: () => api.get('/invest/account'),

  /**
   * POST /invest/account { legalName, dateOfBirth, street, city, state, zip, employment, experience, bankId, agreed }
   * -> BrokerageAccount. Opened with Outvest's registered brokerage partner, which verifies identity.
   */
  openAccount: (payload) => api.post('/invest/account', payload),

  /** GET /portfolio -> { account, summary, positions } */
  portfolio: () => api.get('/portfolio'),

  /** PATCH /portfolio/positions/:id { schedule } -> Position */
  updatePosition: (positionId, patch) => api.patch(`/portfolio/positions/${positionId}`, patch),

  /** POST /portfolio/positions/:id/sell -> { proceeds, account } */
  sell: (positionId) => api.post(`/portfolio/positions/${positionId}/sell`),
}
