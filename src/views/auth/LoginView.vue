<script setup>
import { isMockApi } from '@/api'
import AuthShell from '@/components/layout/AuthShell.vue'
import GoogleIcon from '@/components/ui/GoogleIcon.vue'
import { useSessionStore } from '@/stores/session'
import { Apple, ArrowRight, Sparkles } from '@lucide/vue'
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const session = useSessionStore()

const form = reactive({ email: '', password: '' })
const error = ref('')
const submitting = ref(false)
const oauthPending = ref(null)

// Only follow same-site paths to avoid open redirects.
function redirectTarget() {
  const target = route.query.redirect
  return typeof target === 'string' && target.startsWith('/') && !target.startsWith('//') ? target : '/app'
}

async function submit() {
  error.value = ''
  if (!form.email.trim() || !form.password) {
    error.value = 'Enter your email and password to continue.'
    return
  }
  submitting.value = true
  try {
    await session.login({ email: form.email, password: form.password })
    router.push(redirectTarget())
  } catch (err) {
    error.value = err.message
  } finally {
    submitting.value = false
  }
}

function useDemo() {
  form.email = 'maya@outvest.app'
  form.password = 'outvest-demo'
  submit()
}

async function continueWith(provider) {
  error.value = ''
  oauthPending.value = provider
  try {
    await session.oauth(provider)
    router.push(redirectTarget())
  } catch (err) {
    error.value = err.message
  } finally {
    oauthPending.value = null
  }
}
</script>

<template>
  <AuthShell>
    <template #header>
      <span class="text-sm muted">New here? <RouterLink to="/signup" class="link">Create an account</RouterLink></span>
    </template>

    <h1 class="auth-title">Welcome back</h1>
    <p class="auth-sub">Pick up where you left off.</p>

    <button v-if="isMockApi" type="button" class="demo" :disabled="submitting" @click="useDemo">
      <span class="demo__icon"><Sparkles :size="18" /></span>
      <span class="demo__text">
        <strong>Explore the demo account</strong>
        <span>Maya's Pro account with scans, alerts and monitoring</span>
      </span>
      <ArrowRight :size="18" />
    </button>

    <div class="oauth">
      <button type="button" class="btn btn-secondary btn-lg btn-block" :disabled="Boolean(oauthPending)" @click="continueWith('google')">
        <span v-if="oauthPending === 'google'" class="spinner" />
        <GoogleIcon v-else />
        Continue with Google
      </button>
      <button type="button" class="btn btn-secondary btn-lg btn-block" :disabled="Boolean(oauthPending)" @click="continueWith('apple')">
        <span v-if="oauthPending === 'apple'" class="spinner" />
        <Apple v-else :size="18" />
        Continue with Apple
      </button>
    </div>

    <div class="divider"><span>or</span></div>

    <form class="auth-form" novalidate @submit.prevent="submit">
      <div class="field">
        <label class="label" for="login-email">Email</label>
        <input id="login-email" v-model="form.email" type="email" class="input" autocomplete="email" placeholder="you@example.com" />
      </div>
      <div class="field">
        <label class="label" for="login-password">Password</label>
        <input id="login-password" v-model="form.password" type="password" class="input" autocomplete="current-password" placeholder="Your password" />
      </div>
      <p v-if="error" class="field-error">{{ error }}</p>
      <button type="submit" class="btn btn-primary btn-lg btn-block" :disabled="submitting">
        <span v-if="submitting" class="spinner" />
        {{ submitting ? 'Logging in…' : 'Log in' }}
      </button>
    </form>
  </AuthShell>
</template>

<style scoped>
.auth-title {
  font-size: 36px;
}
.auth-sub {
  margin-top: 10px;
  color: var(--muted);
  font-size: 16px;
}
.demo {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  margin-top: 26px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1.5px dashed var(--brand-300);
  background: var(--brand-25);
  text-align: left;
  color: var(--brand-800);
  transition: background-color 0.2s;
}
.demo:hover {
  background: var(--brand-50);
}
.demo__icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 12px;
  background: var(--brand-100);
}
.demo__text {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.demo__text span {
  font-size: 13px;
  color: var(--brand-700);
}
.oauth {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 18px;
}
.divider {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 22px 0;
  font-size: 13px;
  color: var(--subtle);
}
.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--line);
}
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
@media (max-width: 640px) {
  .auth-title {
    font-size: 30px;
  }
}
</style>
