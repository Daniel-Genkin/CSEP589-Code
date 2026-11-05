import { ERROR_CODES } from '../../errors'
import { MAX_BASKET, MIN_BASKET, WEIGHTINGS, getCompany, weightBasket } from '../catalog'
import { acceptSuggestionNote, publishNote, respond } from '../copilot'
import { db } from '../db'
import { fail, findThesis, findUser, openPosition, serializeComment, thesisDetail, thesisSummary } from '../model'
import { createThesisRecord } from '../seed'
import { randomId } from '../utils'
import { requireDraft } from './copilot'

const now = () => new Date().toISOString()
const COMMENT_KINDS = ['challenge', 'suggestion', 'comment']

function visibleThesis(thesisId, user) {
  const thesis = findThesis(thesisId)
  if (!thesis || (thesis.status !== 'published' && thesis.userId !== user?.id)) {
    fail(404, ERROR_CODES.NOT_FOUND, 'We couldn’t find that thesis. It may be a draft that hasn’t been published.')
  }
  return thesis
}

function ownThesis(thesisId, user) {
  const thesis = findThesis(thesisId)
  if (!thesis) fail(404, ERROR_CODES.NOT_FOUND, 'We couldn’t find that thesis.')
  if (thesis.userId !== user.id) fail(403, ERROR_CODES.FORBIDDEN, 'Only the author can change this thesis.')
  return thesis
}

function publishedThesis(thesisId, user) {
  const thesis = visibleThesis(thesisId, user)
  if (thesis.status !== 'published') fail(409, ERROR_CODES.VALIDATION, 'Publish the thesis first.')
  return thesis
}

function copilotSays(thesis, text) {
  thesis.messages.push({ id: randomId('msg', 6), role: 'copilot', text, at: now() })
}

const touch = (thesis) => (thesis.updatedAt = now())

export default [
  {
    method: 'GET',
    path: '/theses',
    handler: ({ user, query }) => {
      const list =
        query.scope === 'following'
          ? db.theses
              .filter((t) => t.status === 'published' && t.followerIds.includes(user.id))
              .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
          : db.theses.filter((t) => t.userId === user.id).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
      return list.map((t) => thesisSummary(t, user))
    },
  },
  {
    method: 'POST',
    path: '/theses',
    latency: 2600,
    handler: ({ user, body }) => {
      const thesis = createThesisRecord({ id: randomId('th', 8), userId: user.id, draft: requireDraft(body), createdAt: now() })
      db.theses.push(thesis)
      return thesisDetail(thesis, user)
    },
  },
  {
    method: 'GET',
    path: '/theses/:thesisId',
    public: true,
    handler: ({ user, params }) => thesisDetail(visibleThesis(params.thesisId, user), user),
  },
  {
    method: 'PATCH',
    path: '/theses/:thesisId',
    handler: ({ user, params, body }) => {
      const thesis = ownThesis(params.thesisId, user)
      // Validate everything first so a rejected request never half-applies.
      const errors = {}
      const changes = {}
      if ('title' in body) {
        const title = String(body.title ?? '').trim()
        if (title.length < 3 || title.length > 80) errors.title = 'Use 3–80 characters.'
        else changes.title = title
      }
      if ('statement' in body) {
        const statement = String(body.statement ?? '').trim()
        if (statement.length < 20 || statement.length > 500) errors.statement = 'Use 20–500 characters.'
        else changes.statement = statement
      }
      if ('weighting' in body) {
        if (!WEIGHTINGS.includes(body.weighting)) errors.weighting = 'Pick a weighting.'
        else changes.weighting = body.weighting
      }
      if (Object.keys(errors).length) fail(422, ERROR_CODES.VALIDATION, 'Please check the highlighted fields.', errors)
      Object.assign(thesis, changes)
      touch(thesis)
      return thesisDetail(thesis, user)
    },
  },
  {
    method: 'DELETE',
    path: '/theses/:thesisId',
    handler: ({ user, params }) => {
      const thesis = ownThesis(params.thesisId, user)
      if (thesis.status === 'published') {
        fail(409, ERROR_CODES.VALIDATION, 'Published theses stay on your public track record, good calls and bad.')
      }
      if (openPosition(user.id, thesis.id)) fail(409, ERROR_CODES.VALIDATION, 'Sell this basket in Portfolio before deleting the thesis.')
      db.theses = db.theses.filter((t) => t.id !== thesis.id)
      db.alerts = db.alerts.filter((a) => a.thesisId !== thesis.id)
      return null
    },
  },
  {
    method: 'POST',
    path: '/theses/:thesisId/basket',
    handler: ({ user, params, body }) => {
      const thesis = ownThesis(params.thesisId, user)
      const company = getCompany(body.symbol)
      if (!company) fail(404, ERROR_CODES.NOT_FOUND, `We don’t have research on “${body.symbol}” yet.`)
      if (thesis.symbols.includes(company.symbol)) fail(409, ERROR_CODES.VALIDATION, `${company.name} is already in the basket.`)
      if (thesis.symbols.length >= MAX_BASKET) fail(422, ERROR_CODES.BASKET_LIMIT, `Baskets top out at ${MAX_BASKET} companies.`)
      thesis.symbols.push(company.symbol)
      touch(thesis)
      return thesisDetail(thesis, user)
    },
  },
  {
    method: 'DELETE',
    path: '/theses/:thesisId/basket/:symbol',
    handler: ({ user, params }) => {
      const thesis = ownThesis(params.thesisId, user)
      const symbol = params.symbol.toUpperCase()
      if (!thesis.symbols.includes(symbol)) fail(404, ERROR_CODES.NOT_FOUND, 'That company isn’t in the basket.')
      if (thesis.symbols.length <= MIN_BASKET) fail(422, ERROR_CODES.BASKET_LIMIT, `A basket needs at least ${MIN_BASKET} companies.`)
      thesis.symbols = thesis.symbols.filter((s) => s !== symbol)
      touch(thesis)
      return thesisDetail(thesis, user)
    },
  },
  {
    method: 'POST',
    path: '/theses/:thesisId/messages',
    latency: 1100,
    handler: ({ user, params, body }) => {
      const thesis = ownThesis(params.thesisId, user)
      const text = String(body.text ?? '').trim()
      if (!text) fail(422, ERROR_CODES.VALIDATION, 'Type a message first.')
      if (text.length > 500) fail(422, ERROR_CODES.VALIDATION, 'Keep messages under 500 characters.')
      thesis.messages.push({ id: randomId('msg', 6), role: 'user', text, at: now() })
      copilotSays(thesis, respond(thesis, text))
      touch(thesis)
      return thesisDetail(thesis, user)
    },
  },
  {
    method: 'POST',
    path: '/theses/:thesisId/publish',
    latency: 900,
    handler: ({ user, params }) => {
      const thesis = ownThesis(params.thesisId, user)
      if (thesis.status === 'published') fail(409, ERROR_CODES.VALIDATION, 'This thesis is already published.')
      thesis.status = 'published'
      thesis.publishedAt = now()
      thesis.publishedBasket = weightBasket(thesis.symbols, thesis.topicKey, thesis.weighting)
      copilotSays(thesis, publishNote(thesis))
      touch(thesis)
      return thesisDetail(thesis, user)
    },
  },
  {
    method: 'POST',
    path: '/theses/:thesisId/follow',
    latency: 200,
    handler: ({ user, params }) => {
      const thesis = publishedThesis(params.thesisId, user)
      if (thesis.userId === user.id) fail(409, ERROR_CODES.VALIDATION, 'You can’t follow your own thesis.')
      if (!thesis.followerIds.includes(user.id)) thesis.followerIds.push(user.id)
      return { isFollowing: true, followers: thesis.baseFollowers + thesis.followerIds.length }
    },
  },
  {
    method: 'DELETE',
    path: '/theses/:thesisId/follow',
    latency: 200,
    handler: ({ user, params }) => {
      const thesis = publishedThesis(params.thesisId, user)
      thesis.followerIds = thesis.followerIds.filter((id) => id !== user.id)
      return { isFollowing: false, followers: thesis.baseFollowers + thesis.followerIds.length }
    },
  },
  {
    method: 'POST',
    path: '/theses/:thesisId/comments',
    handler: ({ user, params, body }) => {
      const thesis = publishedThesis(params.thesisId, user)
      const kind = COMMENT_KINDS.includes(body.kind) ? body.kind : 'comment'
      const text = String(body.text ?? '').trim()
      const errors = {}
      if (text.length < 2) errors.text = 'Add a note so the author knows what you mean.'
      if (text.length > 500) errors.text = 'Keep it under 500 characters.'
      if (thesis.userId === user.id && kind !== 'comment') {
        errors.kind = 'As the author, change the basket directly and reply with a comment.'
      }
      if (kind === 'challenge' && !thesis.claims.some((c) => c.id === body.claimId)) errors.claimId = 'Pick the claim you’re challenging.'
      const company = kind === 'suggestion' ? getCompany(body.symbol) : null
      if (kind === 'suggestion' && !company) errors.symbol = 'Pick a company to suggest.'
      if (company && thesis.symbols.includes(company.symbol)) errors.symbol = `${company.name} is already in the basket.`
      if (Object.keys(errors).length) fail(422, ERROR_CODES.VALIDATION, Object.values(errors)[0], errors)

      const comment = {
        id: randomId('cmt', 6),
        userId: user.id,
        kind,
        text,
        createdAt: now(),
        status: kind === 'suggestion' ? 'open' : null,
        ...(kind === 'challenge' && { claimId: body.claimId }),
        ...(company && { symbol: company.symbol }),
      }
      thesis.comments.push(comment)
      return serializeComment(thesis, comment)
    },
  },
  {
    method: 'POST',
    path: '/theses/:thesisId/comments/:commentId/accept',
    handler: ({ user, params }) => {
      const thesis = ownThesis(params.thesisId, user)
      const comment = thesis.comments.find((c) => c.id === params.commentId)
      if (!comment || comment.kind !== 'suggestion') fail(404, ERROR_CODES.NOT_FOUND, 'We couldn’t find that suggestion.')
      if (comment.status !== 'open') fail(409, ERROR_CODES.VALIDATION, 'You’ve already handled this suggestion.')
      const company = getCompany(comment.symbol)
      if (thesis.symbols.includes(company.symbol)) {
        comment.status = 'accepted'
      } else {
        if (thesis.symbols.length >= MAX_BASKET) fail(422, ERROR_CODES.BASKET_LIMIT, `Baskets top out at ${MAX_BASKET} companies.`)
        copilotSays(thesis, acceptSuggestionNote(thesis, company, findUser(comment.userId).handle))
        comment.status = 'accepted'
      }
      touch(thesis)
      return thesisDetail(thesis, user)
    },
  },
  {
    method: 'POST',
    path: '/theses/:thesisId/comments/:commentId/dismiss',
    handler: ({ user, params }) => {
      const thesis = ownThesis(params.thesisId, user)
      const comment = thesis.comments.find((c) => c.id === params.commentId)
      if (!comment || comment.kind !== 'suggestion') fail(404, ERROR_CODES.NOT_FOUND, 'We couldn’t find that suggestion.')
      comment.status = 'dismissed'
      return thesisDetail(thesis, user)
    },
  },
]
