<script setup>
import AuthShell from '@/components/layout/AuthShell.vue'
import CategoryIcon from '@/components/ui/CategoryIcon.vue'
import GoogleIcon from '@/components/ui/GoogleIcon.vue'
import { useSessionStore } from '@/stores/session'
import { CATEGORIES } from '@/utils/scoring'
import { Apple, ArrowRight, Check, Eye, EyeOff, Gift, PartyPopper, ScanSearch } from '@lucide/vue'
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const session = useSessionStore()

const step = ref(1)
const form = reactive({ name: '', email: '', password: '' })
const errors = reactive({})
const showPassword = ref(false)
const submitting = ref(false)
const oauthPending = ref(null)
const values = ref([])
const savingValues = ref(false)

const referralCode = computed(() => (typeof route.query.ref === 'string' ? route.query.ref.slice(0, 16) : null))
const inviter = computed(() => (typeof route.query.from === 'string' ? route.query.from.slice(0, 30) : null))
const planIntent = computed(() => (['premium', 'pro'].includes(route.query.plan) ? route.query.plan : null))

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

async function submit() {
  if (!validate()) return
  submitting.value = true
  try {
    await session.signup({ ...form, referralCode: referralCode.value })
    step.value = 2
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
    const isNew = await session.oauth(provider, { referralCode: referralCode.value })
    if (isNew) step.value = 2
    else finish()
  } catch (err) {
    errors.form = err.message
  } finally {
    oauthPending.value = null
  }
}

function toggleValue(key) {
  values.value = values.value.includes(key) ? values.value.filter((k) => k !== key) : [...values.value, key]
}

async function saveValues() {
  savingValues.value = true
  try {
    if (values.value.length) await session.update({ values: values.value })
    step.value = 3
  } finally {
    savingValues.value = false
  }
}

function finish() {
  if (planIntent.value) {
    router.push({ path: '/app/plan', query: { upgrade: planIntent.value, interval: route.query.interval === 'year' ? 'year' : 'month' } })
  } else {
    router.push('/app/scan/new')
  }
}
</script>

<template>
  <AuthShell>
    <template #header>
      <span v-if="step === 1" class="text-sm muted">
        Have an account? <RouterLink to="/login" class="link">Log in</RouterLink>
      </span>
      <span v-else class="steps-indicator text-sm muted">Step {{ Math.min(step, 2) }} of 2</span>
    </template>

    <!-- Step 1: account -->
    <div v-if="step === 1">
      <div v-if="referralCode" class="invite">
        <Gift :size="18" />
        <span>
          <strong>{{ inviter ? `${inviter} invited you to outvest` : 'You were invited to outvest' }}</strong>
          Join free and check your own stocks the same way.
        </span>
      </div>

      <h1 class="auth-title">Let's get you set up</h1>
      <p class="auth-sub">Just three things. You can run your first scan in about two minutes.</p>

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
          {{ submitting ? 'Creating your account…' : 'Create free account' }}
          <ArrowRight v-if="!submitting" :size="18" />
        </button>
      </form>
    </div>

    <!-- Step 2: values -->
    <div v-else-if="step === 2">
      <h1 class="auth-title">What matters most to you?</h1>
      <p class="auth-sub">Pick any that feel important. We'll highlight them in your results. You can change this anytime.</p>

      <div class="values-pick">
        <button
          v-for="cat in CATEGORIES"
          :key="cat.key"
          type="button"
          class="value-option"
          :class="{ 'is-on': values.includes(cat.key) }"
          :aria-pressed="values.includes(cat.key)"
          @click="toggleValue(cat.key)"
        >
          <CategoryIcon :category="cat.key" :size="38" />
          <span class="value-option__text">
            <span class="value-option__label">{{ cat.label }}</span>
            <span class="value-option__desc">{{ cat.description }}</span>
          </span>
          <span class="value-option__check"><Check :size="14" :stroke-width="3" /></span>
        </button>
      </div>

      <div class="values-actions">
        <button type="button" class="btn btn-ghost btn-lg" @click="step = 3">Skip for now</button>
        <button type="button" class="btn btn-primary btn-lg grow" :disabled="savingValues" @click="saveValues">
          <span v-if="savingValues" class="spinner" />
          {{ values.length ? `Save ${values.length} ${values.length === 1 ? 'value' : 'values'}` : 'Continue' }}
          <ArrowRight v-if="!savingValues" :size="18" />
        </button>
      </div>
    </div>

    <!-- Step 3: done -->
    <div v-else class="done">
      <span class="done__icon"><PartyPopper :size="32" /></span>
      <h1 class="auth-title">You're in, {{ session.firstName }}!</h1>
      <p class="auth-sub">
        Let's see how your investments line up with what you care about. No pressure, no jargon. Just clarity.
      </p>
      <ul class="done__list">
        <li><Check :size="16" /> 1 free scan this month, up to 5 stocks or ETFs</li>
        <li><Check :size="16" /> Full values breakdown and news for each one</li>
        <li><Check :size="16" /> Share any analysis with a friend</li>
      </ul>
      <button type="button" class="btn btn-primary btn-lg btn-block" @click="finish">
        <ScanSearch :size="18" />
        {{ planIntent ? `Finish upgrading to ${planIntent === 'pro' ? 'Pro' : 'Premium'}` : 'Run my first scan' }}
      </button>
      <RouterLink to="/app" class="btn btn-ghost btn-block">Explore the dashboard first</RouterLink>
    </div>
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
  border-radius: 16px;
  background: linear-gradient(120deg, var(--peach-50), var(--lilac-50));
  border: 1px solid var(--peach-100);
  font-size: 14px;
  color: var(--ink-2);
}
.invite svg {
  flex-shrink: 0;
  margin-top: 1px;
  color: var(--peach-500);
}
.invite strong {
  display: block;
  color: var(--ink);
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
.values-pick {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 24px;
}
.value-option {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border: 1.5px solid var(--line);
  border-radius: 18px;
  background: var(--surface);
  text-align: left;
  transition:
    border-color 0.2s,
    background-color 0.2s;
}
.value-option:hover {
  border-color: var(--line-strong);
}
.value-option.is-on {
  border-color: var(--brand-400);
  background: var(--brand-25);
}
.value-option__text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.value-option__label {
  font-weight: 700;
}
.value-option__desc {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.4;
}
.value-option__check {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1.5px solid var(--line-strong);
  color: transparent;
  transition: all 0.2s;
}
.is-on .value-option__check {
  border-color: var(--brand-600);
  background: var(--brand-600);
  color: #fff;
}
.values-actions {
  display: flex;
  gap: 10px;
  margin-top: 22px;
}
.done {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.done__icon {
  display: grid;
  place-items: center;
  width: 68px;
  height: 68px;
  margin-bottom: 18px;
  border-radius: 22px;
  background: linear-gradient(140deg, var(--brand-100), var(--sun-100));
  color: var(--brand-700);
}
.done__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 22px 0 26px;
  padding: 18px;
  border-radius: 18px;
  background: var(--surface);
  border: 1px solid var(--line);
  font-size: 14.5px;
  font-weight: 600;
}
.done__list li {
  display: flex;
  align-items: center;
  gap: 10px;
}
.done__list svg {
  flex-shrink: 0;
  color: var(--brand-500);
}
.done .btn-ghost {
  margin-top: 6px;
}
@media (max-width: 640px) {
  .auth-title {
    font-size: 30px;
  }
}
</style>
