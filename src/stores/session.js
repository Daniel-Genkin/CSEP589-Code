import { authService } from '@/api'
import { firstNameOf } from '@/utils/format'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useSessionStore = defineStore('session', () => {
  const user = ref(null)
  const ready = ref(false)
  let initializing = null

  const isAuthed = computed(() => Boolean(user.value))
  const planId = computed(() => user.value?.plan.id ?? 'free')
  const isPro = computed(() => Boolean(user.value?.plan.monitoring))
  const firstName = computed(() => firstNameOf(user.value?.name))

  function init() {
    if (ready.value) return Promise.resolve()
    initializing ??= (async () => {
      if (authService.hasSession()) {
        try {
          user.value = await authService.me()
        } catch {
          authService.clearSession()
        }
      }
      ready.value = true
    })()
    return initializing
  }

  async function refresh() {
    user.value = await authService.me()
    return user.value
  }

  async function login(credentials) {
    user.value = await authService.login(credentials)
  }

  async function signup(payload) {
    user.value = await authService.signup(payload)
  }

  async function oauth(provider, payload) {
    const result = await authService.oauth(provider, payload)
    user.value = result.user
    return result.isNew
  }

  async function logout() {
    await authService.logout()
    user.value = null
  }

  async function update(patch) {
    user.value = await authService.updateMe(patch)
    return user.value
  }

  return { user, ready, isAuthed, planId, isPro, firstName, init, refresh, login, signup, oauth, logout, update }
})
