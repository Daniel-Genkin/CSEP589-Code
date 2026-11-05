import { ERROR_CODES } from '../../errors'
import { db } from '../db'
import { fail, isValidEmail, serializeUser } from '../model'
import { defaultPreferences } from '../seed'
import { randomId } from '../utils'

const HANDLE_PATTERN = /^[a-z0-9_]{3,20}$/
const PREFERENCE_KEYS = Object.keys(defaultPreferences())

function createSession(userId) {
  const token = `tok_${crypto.randomUUID()}`
  db.sessions[token] = userId
  return token
}

function uniqueHandle(name) {
  const base = (name.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9_]/g, '') || 'investor').slice(0, 14).padEnd(3, '0')
  let handle = base
  while (db.users.some((u) => u.handle === handle)) handle = `${base}${Math.floor(100 + Math.random() * 900)}`
  return handle
}

function createUser({ name, email, referralCode }) {
  const user = {
    id: randomId('usr'),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    handle: uniqueHandle(name),
    bio: '',
    createdAt: new Date().toISOString(),
    referralCode: `${name.trim().split(/\s+/)[0].slice(0, 4).toUpperCase()}${randomId('', 2).toUpperCase()}`,
    referredBy: referralCode || null,
    preferences: defaultPreferences(),
    brokerage: null,
  }
  db.users.push(user)
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
      // Validate everything first so a rejected request never half-applies.
      const errors = {}
      const changes = {}
      if ('name' in body) {
        if (!body.name?.trim()) errors.name = 'Name can’t be empty.'
        else changes.name = body.name.trim().slice(0, 60)
      }
      if ('email' in body) {
        if (!isValidEmail(body.email)) errors.email = 'Please enter a valid email.'
        else changes.email = body.email.trim().toLowerCase()
      }
      if ('handle' in body) {
        const handle = String(body.handle ?? '').trim().replace(/^@/, '').toLowerCase()
        if (!HANDLE_PATTERN.test(handle)) errors.handle = 'Use 3–20 lowercase letters, numbers or underscores.'
        else changes.handle = handle
      }
      if ('bio' in body) {
        const bio = String(body.bio ?? '').trim()
        if (bio.length > 160) errors.bio = 'Keep it under 160 characters.'
        else changes.bio = bio
      }
      if (Object.keys(errors).length) fail(422, ERROR_CODES.VALIDATION, Object.values(errors)[0], errors)

      const emailOwner = changes.email ? findByEmail(changes.email) : null
      if (emailOwner && emailOwner.id !== user.id) {
        fail(409, ERROR_CODES.EMAIL_TAKEN, 'That email is already in use.', { email: 'Already in use.' })
      }
      if (changes.handle && db.users.some((u) => u.handle === changes.handle && u.id !== user.id)) {
        fail(409, ERROR_CODES.HANDLE_TAKEN, 'That handle is taken.', { handle: 'That handle is taken.' })
      }

      Object.assign(user, changes)
      if (body.preferences && typeof body.preferences === 'object') {
        for (const key of PREFERENCE_KEYS) {
          if (key in body.preferences) user.preferences[key] = Boolean(body.preferences[key])
        }
      }
      return serializeUser(user)
    },
  },
]
