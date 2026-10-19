import { api } from '../client'

export const billingService = {
  /** GET /billing/plans -> Plan[] (public) */
  listPlans: () => api.get('/billing/plans'),

  /** GET /billing/subscription -> Subscription */
  getSubscription: () => api.get('/billing/subscription'),

  /** POST /billing/subscription { planId, interval, paymentMethod? } -> Subscription. Real backend: create/modify the Stripe subscription. */
  changePlan: (payload) => api.post('/billing/subscription', payload),

  /** GET /billing/invoices -> Invoice[] */
  listInvoices: () => api.get('/billing/invoices'),
}
