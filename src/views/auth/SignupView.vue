<script setup>
import AuthShell from '@/components/layout/AuthShell.vue'
import GoogleIcon from '@/components/ui/GoogleIcon.vue'
import { useSessionStore } from '@/stores/session'
import { Apple, ArrowRight, Eye, EyeOff, Gift, Sparkles } from '@lucide/vue'
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const session = useSessionStore()

const form = reactive({ name: '', email: '', password: '' })
const errors = reactive({})
const showPassword = ref(false)
const submitting = ref(false)
const oauthPending = ref(null)

const referralCode = computed(() => (typeof route.query.ref === 'string' ? route.query.ref.slice(0, 16) : null))
const inviter = computed(() => (typeof route.query.from === 'string' ? route.query.from.slice(0, 30) : null))
// A pitch typed on the landing page (or a public thesis page) carries through sign-up into the workshop.
const idea = computed(() => (typeof route.query.idea === 'string' ? route.query.idea.trim().slice(0, 280) : ''))

function clearErrors() {
  Object.keys(errors).forEach((key) => delete errors[key])
}

function validate() {
  clearErrors()
  if (!form.name.trim()) errors.name = 'Tell us what to call you.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) errors.email = 'That email doesn’t look quite right.'
  if (form.password.length < 8) errors.password = 'Use at least 8 characters.'
  return Object.keys(errors).length === 0
}

function finish() {
  router.push({ path: '/app/pitch', query: idea.value ? { idea: idea.value } : { welcome: '1' } })
}

async function submit() {
  if (!validate()) return
  submitting.value = true
  try {
    await session.signup({ ...form, referralCode: referralCode.value })
    finish()
  } catch (err) {
    if (err.details && typeof err.details === 'object') Object.assign(errors, err.details)
    else errors.form = err.message
  } finally {
    submitting.value = false
  }
}

async function continueWith(provider) {
  clearErrors()
  oauthPending.value = provider
  try {
    await session.oauth(provider, { referralCode: referralCode.value })
    finish()
  } catch (err) {
    errors.form = err.message
  } finally {
    oauthPending.value = null
  }
}
</script>

<template>
  <AuthShell>
    <template #header>
      <span class="text-sm muted">
        Have an account? <RouterLink :to="{ name: 'login', query: idea ? { redirect: `/app/pitch?idea=${encodeURIComponent(idea)}` } : {} }" class="link">Log in</RouterLink>
      </span>
    </template>

    <div v-if="referralCode" class="invite">
      <Gift :size="18" />
      <span>
        <strong>{{ inviter ? `${inviter} invited you to Outvest` : 'You were invited to Outvest' }}</strong>
        Join free and test your own climate take.
      </span>
    </div>

    <div v-if="idea" class="idea">
      <span class="idea__label"><Sparkles :size="14" /> Your take</span>
      <p class="idea__text">“{{ idea }}”</p>
      <p class="idea__note">We’ll open it in your workshop as soon as your account is ready.</p>
    </div>

    <h1 class="auth-title">{{ idea ? 'Save your thesis' : 'Create your free account' }}</h1>
    <p class="auth-sub">
      Building, workshopping and publishing a thesis is free. Investing is optional, from $10.
    </p>

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

    <div class="divider"><span>or use your email</span></div>

    <form class="auth-form" novalidate @submit.prevent="submit">
      <div class="field">
        <label class="label" for="name">What should we call you?</label>
        <input id="name" v-model="form.name" class="input" :class="{ 'is-invalid': errors.name }" autocomplete="given-name" placeholder="Your first name" />
        <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
      </div>
      <div class="field">
        <label class="label" for="email">Email</label>
        <input id="email" v-model="form.email" type="email" class="input" :class="{ 'is-invalid': errors.email }" autocomplete="email" placeholder="you@example.com" />
        <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
      </div>
      <div class="field">
        <label class="label" for="password">Password</label>
        <div class="password">
          <input
            id="password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            class="input"
            :class="{ 'is-invalid': errors.password }"
            autocomplete="new-password"
            placeholder="At least 8 characters"
          />
          <button type="button" class="password__toggle" :aria-label="showPassword ? 'Hide password' : 'Show password'" @click="showPassword = !showPassword">
            <EyeOff v-if="showPassword" :size="18" />
            <Eye v-else :size="18" />
          </button>
        </div>
        <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
      </div>

      <p v-if="errors.form" class="field-error">{{ errors.form }}</p>

      <button type="submit" class="btn btn-primary btn-lg btn-block" :disabled="submitting">
        <span v-if="submitting" class="spinner" />
        {{ submitting ? 'Creating your account…' : idea ? 'Create account and open my thesis' : 'Create free account' }}
        <ArrowRight v-if="!submitting" :size="18" />
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
.invite {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 24px;
  padding: 14px 16px;
  border: var(--outline-thin);
  border-radius: 16px;
  background: var(--peach-50);
  font-size: 14px;
  color: var(--ink-2);
}
.invite svg {
  flex-shrink: 0;
  margin-top: 1px;
  color: var(--flare);
}
.invite strong {
  display: block;
  color: var(--ink);
}
.idea {
  margin-bottom: 24px;
  padding: 16px 18px;
  border: var(--outline-thin);
  border-radius: 18px;
  background: var(--sun-100);
  box-shadow: var(--shadow-sm);
}
.idea__label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--deep-violet);
}
.idea__text {
  margin-top: 6px;
  font-family: var(--font-wink);
  font-size: 23px;
  font-style: italic;
  line-height: 1.25;
}
.idea__note {
  margin-top: 6px;
  font-size: 13.5px;
  color: var(--muted);
}
.oauth {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 28px;
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
.auth-form .btn {
  margin-top: 6px;
}
.password {
  position: relative;
}
.password .input {
  padding-right: 48px;
}
.password__toggle {
  position: absolute;
  top: 50%;
  right: 8px;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  margin-top: -18px;
  border-radius: 10px;
  color: var(--muted);
}
.password__toggle:hover {
  background: var(--bg-tint);
}
@media (max-width: 640px) {
  .auth-title {
    font-size: 30px;
  }
}
</style>
