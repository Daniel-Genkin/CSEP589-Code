// Shared domain helpers for mock handlers (what backend services/serializers would do).
import { ApiError, ERROR_CODES } from '../errors'
import { getSecurity, toSummary } from './catalog'
import { BROKERAGES, PLANS } from './data/reference'
import { db } from './db'

export const fail = (status, code, message, details) => {
  throw new ApiError(status, message, code, details)
}

export const planById = (planId) => PLANS.find((p) => p.id === planId)
export const planOf = (user) => planById(user.subscription.planId)
export const brokerageById = (id) => BROKERAGES.find((b) => b.id === id)

export function usageOf(user) {
  const now = new Date()
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const resetsAt = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
  const plan = planOf(user)
  const scansUsed = db.scans.filter((s) => s.userId === user.id && Date.parse(s.createdAt) >= periodStart).length
  return {
    scansUsed,
    scansLimit: plan.limits.scansPerMonth,
    symbolsPerScan: plan.limits.symbolsPerScan,
    resetsAt,
  }
}

export function serializeUser(user) {
  const plan = planOf(user)
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    values: user.values,
    referralCode: user.referralCode,
    preferences: user.preferences,
    plan: {
      id: plan.id,
      name: plan.name,
      interval: user.subscription.interval,
      monitoring: plan.limits.monitoring,
    },
    usage: usageOf(user),
  }
}

export function requireMonitoringPlan(user) {
  if (!planOf(user).limits.monitoring) {
    fail(402, ERROR_CODES.PLAN_REQUIRED, 'Continuous monitoring is part of outvest Pro.', { requiredPlan: 'pro' })
  }
}

export function requireSecurity(symbol) {
  const sec = getSecurity(String(symbol || '').toUpperCase())
  if (!sec) fail(404, ERROR_CODES.UNKNOWN_SYMBOL, `We don't have research on "${symbol}" yet.`)
  return sec
}

export function monitoringOf(user) {
  return db.monitoring[user.id]
}

export function latestConnection(user) {
  return db.connections
    .filter((c) => c.userId === user.id)
    .sort((a, b) => Date.parse(b.syncedAt) - Date.parse(a.syncedAt))[0]
}

export function serializeConnection(connection) {
  const brokerage = brokerageById(connection.brokerageId)
  const holdings = connection.holdings.map((h) => ({ ...toSummary(getSecurity(h.symbol)), value: h.value }))
  return {
    id: connection.id,
    brokerageId: brokerage.id,
    brokerageName: brokerage.name,
    color: brokerage.color,
    linkedAt: connection.linkedAt,
    syncedAt: connection.syncedAt,
    holdings,
    totalValue: holdings.reduce((sum, h) => sum + (h.value ?? 0), 0),
  }
}

export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || '').trim())
