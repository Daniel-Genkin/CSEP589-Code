import { ERROR_CODES } from '../../errors'
import { CATEGORY_KEYS } from '../catalog'
import { db } from '../db'
import { fail, isValidEmail, serializeUser } from '../model'
import { defaultMonitoringSettings } from '../seed'
import { randomId } from '../utils'

function createSession(userId) {
  const token = `tok_${crypto.randomUUID()}`
  db.sessions[token] = userId
  return token
}

function createUser({ name, email, referralCode }) {
  const user = {
    id: randomId('usr'),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    createdAt: new Date().toISOString(),
    values: [],
    referralCode: `${name.trim().split(/\s+/)[0].slice(0, 4).toUpperCase()}${randomId('', 2).toUpperCase()}`,
    referredBy: referralCode || null,
    subscription: { planId: 'free', interval: 'month', status: 'active', startedAt: new Date().toISOString(), renewsAt: null },
    paymentMethod: null,
    preferences: { productEmails: true, weeklyRecap: true },
  }
  db.users.push(user)
  db.monitoring[user.id] = { symbols: [], settings: defaultMonitoringSettings(), lastCheckedAt: null, poolCursor: 0 }
  return user
}

const findByEmail = (email) => db.users.find((u) => u.email === String(email || '').trim().toLowerCase())

export default [
  {
    method: 'POST',
    path: '/auth/signup',
    public: true,
    handler: ({ body }) => {
      const errors = {}
      if (!body.name?.trim()) errors.name = 'Tell us what to call you.'
      if (!isValidEmail(body.email)) errors.email = 'That email doesn’t look quite right.'
      if (!body.password || body.password.length < 8) errors.password = 'Use at least 8 characters.'
      if (Object.keys(errors).length) fail(422, ERROR_CODES.VALIDATION, 'Please check the highlighted fields.', errors)
      if (findByEmail(body.email)) {
        fail(409, ERROR_CODES.EMAIL_TAKEN, 'An account with this email already exists. Try logging in instead.', {
          email: 'This email already has an account.',
        })
      }
      const user = createUser(body)
      return { token: createSession(user.id), user: serializeUser(user) }
    },
  },
  {
    method: 'POST',
    path: '/auth/login',
    public: true,
    handler: ({ body }) => {
      // Mock only checks that the account exists. The real backend must verify a password hash.
      const user = findByEmail(body.email)
      if (!user || !body.password) {
        fail(401, ERROR_CODES.INVALID_CREDENTIALS, "That email and password don't match an account.")
      }
      return { token: createSession(user.id), user: serializeUser(user) }
    },
  },
  {
    method: 'POST',
    path: '/auth/oauth/:provider',
    public: true,
    latency: 900,
    handler: ({ params, body }) => {
      if (!['google', 'apple'].includes(params.provider)) fail(400, ERROR_CODES.VALIDATION, 'Unsupported sign-in provider.')
      const email = params.provider === 'apple' ? 'jordan@privaterelay.appleid.com' : 'jordan.lee@gmail.com'
      let user = findByEmail(email)
      const isNew = !user
      if (!user) user = createUser({ name: 'Jordan Lee', email, referralCode: body.referralCode })
      return { token: createSession(user.id), user: serializeUser(user), isNew }
    },
  },
  {
    method: 'POST',
    path: '/auth/logout',
    public: true,
    handler: ({ token }) => {
      if (token) delete db.sessions[token]
      return null
    },
  },
  {
    method: 'GET',
    path: '/me',
    handler: ({ user }) => serializeUser(user),
  },
  {
    method: 'PATCH',
    path: '/me',
    handler: ({ user, body }) => {
      if ('name' in body) {
        if (!body.name?.trim()) fail(422, ERROR_CODES.VALIDATION, 'Name can’t be empty.', { name: 'Name can’t be empty.' })
        user.name = body.name.trim().slice(0, 60)
      }
      if ('email' in body) {
        if (!isValidEmail(body.email)) fail(422, ERROR_CODES.VALIDATION, 'Please enter a valid email.', { email: 'Please enter a valid email.' })
        const existing = findByEmail(body.email)
        if (existing && existing.id !== user.id) fail(409, ERROR_CODES.EMAIL_TAKEN, 'That email is already in use.', { email: 'Already in use.' })
        user.email = body.email.trim().toLowerCase()
      }
      if (Array.isArray(body.values)) user.values = body.values.filter((v) => CATEGORY_KEYS.includes(v))
      if (body.preferences) {
        user.preferences = {
          productEmails: Boolean(body.preferences.productEmails ?? user.preferences.productEmails),
          weeklyRecap: Boolean(body.preferences.weeklyRecap ?? user.preferences.weeklyRecap),
        }
      }
      return serializeUser(user)
    },
  },
]
