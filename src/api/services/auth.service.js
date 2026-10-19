import { api } from '../client'
import { tokenStore } from '../token'

export const authService = {
  /** POST /auth/signup { name, email, password, referralCode? } -> { token, user } */
  async signup(payload) {
    const { token, user } = await api.post('/auth/signup', payload)
    tokenStore.set(token)
    return user
  },

  /** POST /auth/login { email, password } -> { token, user } */
  async login(payload) {
    const { token, user } = await api.post('/auth/login', payload)
    tokenStore.set(token)
    return user
  },

  /** POST /auth/oauth/:provider -> { token, user, isNew } */
  async oauth(provider, payload = {}) {
    const { token, user, isNew } = await api.post(`/auth/oauth/${provider}`, payload)
    tokenStore.set(token)
    return { user, isNew }
  },

  /** POST /auth/logout */
  async logout() {
    try {
      await api.post('/auth/logout')
    } finally {
      tokenStore.clear()
    }
  },

  hasSession: () => Boolean(tokenStore.get()),
  clearSession: () => tokenStore.clear(),

  /** GET /me -> User */
  me: () => api.get('/me'),

  /** PATCH /me { name?, email?, values?, preferences? } -> User */
  updateMe: (patch) => api.patch('/me', patch),
}
