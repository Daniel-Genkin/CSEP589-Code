import { ERROR_CODES } from '../../errors'
import { PLANS } from '../data/reference'
import { db } from '../db'
import { fail, latestConnection, monitoringOf, planById, planOf, usageOf } from '../model'
import { DAY, randomId } from '../utils'

function serializeSubscription(user) {
  const plan = planOf(user)
  const { interval, status, startedAt, renewsAt } = user.subscription
  return {
    planId: plan.id,
    planName: plan.name,
    interval,
    status,
    startedAt,
    renewsAt,
    price: plan.prices[interval],
    paymentMethod: user.paymentMethod,
    usage: usageOf(user),
  }
}

// When someone moves to Pro, start watching what they already own so monitoring isn't empty.
function seedWatchlist(user) {
  const monitoring = monitoringOf(user)
  if (!monitoring || monitoring.symbols.length) return
  const connection = latestConnection(user)
  const latestScan = db.scans
    .filter((s) => s.userId === user.id)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0]
  const source = connection?.holdings ?? latestScan?.holdings ?? []
  monitoring.symbols = source.map((h) => h.symbol)
  monitoring.lastCheckedAt = new Date().toISOString()
}

export default [
  {
    method: 'GET',
    path: '/billing/plans',
    public: true,
    handler: () => PLANS,
  },
  {
    method: 'GET',
    path: '/billing/subscription',
    handler: ({ user }) => serializeSubscription(user),
  },
  {
    method: 'POST',
    path: '/billing/subscription',
    latency: 1100,
    handler: ({ user, body }) => {
      const plan = planById(body.planId)
      if (!plan) fail(422, ERROR_CODES.VALIDATION, 'Please choose a valid plan.')
      const interval = body.interval === 'year' ? 'year' : 'month'
      const price = plan.prices[interval]

      // Only display-safe card details ever reach the backend; a real integration would send a Stripe payment method id.
      if (body.paymentMethod) {
        const { brand, last4, expMonth, expYear } = body.paymentMethod
        if (!/^\d{4}$/.test(String(last4))) fail(422, ERROR_CODES.VALIDATION, 'Please check your card details.')
        user.paymentMethod = { brand: String(brand || 'Card'), last4: String(last4), expMonth: Number(expMonth), expYear: Number(expYear) }
      }
      if (price > 0 && !user.paymentMethod) {
        fail(422, 'PAYMENT_METHOD_REQUIRED', 'Add a payment method to switch to a paid plan.')
      }

      const now = Date.now()
      user.subscription = {
        planId: plan.id,
        interval,
        status: 'active',
        startedAt: new Date(now).toISOString(),
        renewsAt: price > 0 ? new Date(now + (interval === 'year' ? 365 : 30) * DAY).toISOString() : null,
      }
      if (price > 0) {
        db.invoices.push({
          id: randomId('inv', 6),
          userId: user.id,
          date: new Date(now).toISOString(),
          description: `${plan.name} · ${interval === 'year' ? 'Yearly' : 'Monthly'}`,
          amount: price,
          status: 'paid',
        })
      }
      if (plan.limits.monitoring) seedWatchlist(user)
      return serializeSubscription(user)
    },
  },
  {
    method: 'GET',
    path: '/billing/invoices',
    handler: ({ user }) =>
      db.invoices
        .filter((i) => i.userId === user.id)
        .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
        .map(({ userId, ...invoice }) => invoice),
  },
]
