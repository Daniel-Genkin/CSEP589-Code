// Shared domain helpers for mock handlers (what backend services/serializers would do).
import { ApiError } from '../errors'
import { basketView, getCompany, getTopic, suggestionsFor, toSummary, topicMeta, weightBasket } from './catalog'
import { db } from './db'
import { growthSince, performance, performanceSince, priceOf } from './market'
import { mean, round1, splitDollars } from './utils'

export const fail = (status, code, message, details) => {
  throw new ApiError(status, message, code, details)
}

export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || '').trim())
export const firstNameOf = (name) => String(name || '').trim().split(/\s+/)[0]
export const initialsOf = (name) =>
  String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

const round2 = (n) => Math.round(n * 100) / 100

export const SCHEDULE_MONTHS = { monthly: 1, quarterly: 3, semiannual: 6, yearly: 12 }

export const findUser = (userId) => db.users.find((u) => u.id === userId)

export function serializeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    handle: user.handle,
    bio: user.bio,
    createdAt: user.createdAt,
    referralCode: user.referralCode,
    preferences: user.preferences,
    brokerage: user.brokerage ? { status: user.brokerage.status, last4: user.brokerage.accountNumber.slice(-4) } : null,
  }
}

// ---------- Theses & track records ----------

export const weightsOf = (thesis) => weightBasket(thesis.symbols, thesis.topicKey, thesis.weighting)

// How a published thesis has done since the author made the call, measured on the basket as published.
export function recordOf(thesis) {
  if (thesis.status !== 'published') return null
  return performanceSince(thesis.publishedBasket, thesis.publishedAt)
}

const brief = (record) =>
  record &&
  (record.tooEarly
    ? { tooEarly: true, days: record.days }
    : {
        tooEarly: false,
        days: record.days,
        basketReturn: record.basketReturn,
        benchmarkReturn: record.benchmarkReturn,
        excess: record.excess,
      })

export function trackRecord(userId) {
  const calls = db.theses.filter((t) => t.userId === userId && t.status === 'published')
  const scored = calls.map(recordOf).filter((r) => !r.tooEarly)
  return {
    calls: calls.length,
    scored: scored.length,
    beating: scored.filter((r) => r.excess > 0).length,
    avgExcess: scored.length ? round1(mean(scored.map((r) => r.excess))) : null,
  }
}

export function authorOf(userId) {
  const user = findUser(userId)
  return {
    id: user.id,
    name: user.name,
    firstName: firstNameOf(user.name),
    initials: initialsOf(user.name),
    handle: user.handle,
    bio: user.bio,
    record: trackRecord(user.id),
  }
}

export const findThesis = (thesisId) => db.theses.find((t) => t.id === thesisId)

export function openPosition(userId, thesisId) {
  return db.positions.find((p) => p.userId === userId && p.thesisId === thesisId && p.status === 'open') ?? null
}

const claimCounts = (claims) => ({
  total: claims.length,
  supported: claims.filter((c) => c.status === 'supported').length,
  mixed: claims.filter((c) => c.status === 'mixed').length,
  weak: claims.filter((c) => c.status === 'weak').length,
})

export function thesisSummary(thesis, viewer) {
  const weights = weightsOf(thesis)
  const backtest = performance(weights)
  return {
    id: thesis.id,
    title: thesis.title,
    statement: thesis.statement,
    idea: thesis.idea,
    status: thesis.status,
    createdAt: thesis.createdAt,
    updatedAt: thesis.updatedAt,
    publishedAt: thesis.publishedAt,
    topic: topicMeta(getTopic(thesis.topicKey)),
    author: authorOf(thesis.userId),
    claimCounts: claimCounts(thesis.claims),
    basket: weights
      .map(({ symbol, weight }) => {
        const c = getCompany(symbol)
        return { symbol, name: c.name, color: c.color, weight }
      })
      .sort((a, b) => b.weight - a.weight),
    backtest: { basketReturn: backtest.basketReturn, benchmarkReturn: backtest.benchmarkReturn, excess: backtest.excess },
    record: brief(recordOf(thesis)),
    followers: thesis.baseFollowers + thesis.followerIds.length,
    commentsCount: thesis.comments.length,
    isOwner: viewer?.id === thesis.userId,
    isFollowing: Boolean(viewer && thesis.followerIds.includes(viewer.id)),
    invested: Boolean(viewer && openPosition(viewer.id, thesis.id)),
  }
}

export function serializeComment(thesis, comment) {
  const author = findUser(comment.userId)
  const claimIndex = thesis.claims.findIndex((c) => c.id === comment.claimId)
  const company = comment.symbol ? getCompany(comment.symbol) : null
  return {
    id: comment.id,
    kind: comment.kind,
    text: comment.text,
    createdAt: comment.createdAt,
    status: comment.status ?? null,
    claim: claimIndex >= 0 ? { id: comment.claimId, number: claimIndex + 1, text: thesis.claims[claimIndex].text } : null,
    company: company ? { ...toSummary(company), inBasket: thesis.symbols.includes(company.symbol) } : null,
    author: {
      name: author.name,
      handle: author.handle,
      initials: initialsOf(author.name),
      isAuthor: comment.userId === thesis.userId,
    },
  }
}

const sameBasket = (a, b) =>
  a.length === b.length && a.every((x) => b.some((y) => y.symbol === x.symbol && Math.abs(y.weight - x.weight) < 0.05))

export function thesisDetail(thesis, viewer) {
  const summary = thesisSummary(thesis, viewer)
  const isOwner = summary.isOwner
  const record = recordOf(thesis)
  const position = isOwner ? openPosition(viewer.id, thesis.id) : null
  const showComments = thesis.status === 'published' || isOwner
  return {
    ...summary,
    horizon: thesis.horizon,
    notice: isOwner ? thesis.notice : null,
    weighting: thesis.weighting,
    claims: thesis.claims.map((claim) => ({
      ...claim,
      challenges: thesis.comments.filter((c) => c.kind === 'challenge' && c.claimId === claim.id).length,
    })),
    counterarguments: thesis.counterarguments,
    basket: basketView(thesis.symbols, thesis.topicKey, thesis.weighting),
    backtest: performance(weightsOf(thesis)),
    record,
    basketChangedSincePublish: Boolean(thesis.publishedBasket && !sameBasket(thesis.publishedBasket, weightsOf(thesis))),
    messages: isOwner ? thesis.messages : [],
    comments: showComments ? thesis.comments.map((c) => serializeComment(thesis, c)).reverse() : [],
    suggestions: isOwner ? suggestionsFor(thesis.topicKey, thesis.symbols) : [],
    position: position ? positionSummary(position) : null,
    basketChangedSinceInvest: Boolean(position && !sameBasket(position.weights, weightsOf(thesis))),
  }
}

// ---------- Brokerage, positions ----------

function addMonths(iso, months) {
  const date = new Date(iso)
  date.setMonth(date.getMonth() + months)
  return date
}

export function nextRebalanceOf(position) {
  const months = SCHEDULE_MONTHS[position.schedule]
  let next = addMonths(position.lastRebalancedAt, months)
  while (next.getTime() <= Date.now()) next = addMonths(next.toISOString(), months)
  return next.toISOString()
}

export function serializeAccount(user) {
  const account = user.brokerage
  if (!account) return null
  return {
    status: account.status,
    last4: account.accountNumber.slice(-4),
    openedAt: account.openedAt,
    legalName: account.legalName,
    bank: account.bank,
    cash: round2(account.cash),
  }
}

export function positionSummary(position) {
  const thesis = findThesis(position.thesisId)
  let invested = 0
  let value = 0
  let benchmarkValue = 0
  for (const lot of position.lots) {
    const growth = growthSince(position.weights, lot.at)
    invested += lot.amount
    value += lot.amount * growth.basket
    benchmarkValue += lot.amount * growth.benchmark
  }
  const holdingValues = splitDollars(round2(value), position.weights.map((w) => w.weight))
  return {
    id: position.id,
    thesis: thesis ? { id: thesis.id, title: thesis.title, topic: topicMeta(getTopic(thesis.topicKey)) } : null,
    schedule: position.schedule,
    createdAt: position.createdAt,
    lastRebalancedAt: position.lastRebalancedAt,
    nextRebalanceAt: nextRebalanceOf(position),
    invested: round2(invested),
    value: round2(value),
    gain: round2(value - invested),
    gainPct: round1((value / invested - 1) * 100),
    benchmarkGainPct: round1((benchmarkValue / invested - 1) * 100),
    lots: position.lots,
    holdings: position.weights
      .map(({ symbol, weight }, i) => {
        const price = priceOf(symbol)
        return {
          ...toSummary(getCompany(symbol)),
          weight,
          value: holdingValues[i],
          price,
          shares: Math.round((holdingValues[i] / price) * 10000) / 10000,
        }
      })
      .sort((a, b) => b.weight - a.weight),
  }
}

// ---------- Alerts ----------

export function serializeAlert(alert) {
  const thesis = findThesis(alert.thesisId)
  return {
    id: alert.id,
    kind: alert.kind,
    title: alert.title,
    summary: alert.summary,
    createdAt: alert.createdAt,
    readAt: alert.readAt,
    thesis: thesis ? { id: thesis.id, title: thesis.title, topic: topicMeta(getTopic(thesis.topicKey)) } : null,
  }
}

export function alertDetail(alert, user) {
  const thesis = findThesis(alert.thesisId)
  const claimIndex = thesis ? thesis.claims.findIndex((c) => c.id === alert.claimId) : -1
  const weights = thesis ? weightsOf(thesis) : []
  const position = thesis ? openPosition(user.id, thesis.id) : null
  return {
    ...serializeAlert(alert),
    whatHappened: alert.whatHappened,
    source: alert.source,
    action: alert.action,
    claim: claimIndex >= 0 ? { ...thesis.claims[claimIndex], number: claimIndex + 1 } : null,
    companies: alert.companies.map((symbol) => ({
      ...toSummary(getCompany(symbol)),
      inBasket: weights.some((w) => w.symbol === symbol),
      weight: weights.find((w) => w.symbol === symbol)?.weight ?? null,
    })),
    position: position ? positionSummary(position) : null,
  }
}
