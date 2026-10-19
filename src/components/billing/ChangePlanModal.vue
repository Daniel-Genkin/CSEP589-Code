<script setup>
import { billingService } from '@/api'
import PlanBadge from '@/components/ui/PlanBadge.vue'
import UiModal from '@/components/ui/UiModal.vue'
import { useSessionStore } from '@/stores/session'
import { formatDateLong, formatMoney } from '@/utils/format'
import { ArrowRight, CreditCard, Lock, PartyPopper } from '@lucide/vue'
import { computed, reactive, ref, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  plan: { type: Object, default: null },
  interval: { type: String, default: 'month' },
  subscription: { type: Object, default: null },
})
const emit = defineEmits(['close', 'changed'])
const session = useSessionStore()

const TIER = { free: 0, premium: 1, pro: 2 }
const step = ref('confirm')
const saving = ref(false)
const error = ref('')
const result = ref(null)
const card = reactive({ name: '', number: '', expiry: '', cvc: '' })
const cardErrors = reactive({})

watch(
  () => props.open,
  (open) => {
    if (!open) return
    step.value = 'confirm'
    error.value = ''
    Object.assign(card, { name: session.user?.name ?? '', number: '', expiry: '', cvc: '' })
    Object.keys(cardErrors).forEach((k) => delete cardErrors[k])
  },
)

const price = computed(() => (props.plan ? props.plan.prices[props.interval] : 0))
const fromPlanId = computed(() => props.subscription?.planId ?? 'free')
const isUpgrade = computed(() => props.plan && TIER[props.plan.id] > TIER[fromPlanId.value])
const needsCard = computed(() => price.value > 0 && !props.subscription?.paymentMethod)
const losesMonitoring = computed(() => fromPlanId.value === 'pro' && props.plan?.id !== 'pro')
const intervalLabel = computed(() => (props.interval === 'year' ? 'year' : 'month'))

function fillTestCard() {
  Object.assign(card, { number: '4242 4242 4242 4242', expiry: '12/29', cvc: '123' })
}

function formatNumber(event) {
  card.number = event.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(event) {
  const digits = event.target.value.replace(/\D/g, '').slice(0, 4)
  card.expiry = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}

function validateCard() {
  Object.keys(cardErrors).forEach((k) => delete cardErrors[k])
  const digits = card.number.replace(/\s/g, '')
  if (!card.name.trim()) cardErrors.name = 'Enter the name on your card.'
  if (!/^\d{15,16}$/.test(digits)) cardErrors.number = 'Card numbers are 15–16 digits.'
  const [mm, yy] = card.expiry.split('/').map(Number)
  const now = new Date()
  const expired = !mm || mm > 12 || !yy || 2000 + yy < now.getFullYear() || (2000 + yy === now.getFullYear() && mm < now.getMonth() + 1)
  if (expired) cardErrors.expiry = 'Use a future date (MM/YY).'
  if (!/^\d{3,4}$/.test(card.cvc)) cardErrors.cvc = '3 or 4 digits.'
  return Object.keys(cardErrors).length === 0
}

function brandOf(digits) {
  if (digits.startsWith('4')) return 'Visa'
  if (/^5[1-5]/.test(digits)) return 'Mastercard'
  if (/^3[47]/.test(digits)) return 'Amex'
  return 'Card'
}

async function confirm() {
  error.value = ''
  if (needsCard.value && !validateCard()) return
  saving.value = true
  try {
    const digits = card.number.replace(/\s/g, '')
    const [mm, yy] = card.expiry.split('/').map(Number)
    // Only display-safe details leave the form. A real integration would tokenize the card with Stripe Elements instead.
    const paymentMethod = needsCard.value
      ? { brand: brandOf(digits), last4: digits.slice(-4), expMonth: mm, expYear: 2000 + yy }
      : undefined
    result.value = await billingService.changePlan({ planId: props.plan.id, interval: props.interval, paymentMethod })
    await session.refresh()
    step.value = 'success'
    emit('changed', result.value)
  } catch (err) {
    error.value = err.message
  } finally {
    saving.value = false
  }
}

const nextStep = computed(() => {
  if (props.plan?.id === 'pro') return { label: 'Set up monitoring', to: '/app/monitoring' }
  if (props.plan?.id === 'premium') return { label: 'Start a scan', to: '/app/scan/new' }
  return { label: 'Back to home', to: '/app' }
})
</script>

<template>
  <UiModal :open="open" size="md" label="Change plan" :dismissible="!saving" @close="emit('close')">
    <div v-if="plan && step === 'confirm'" class="change">
      <p class="eyebrow">{{ isUpgrade ? 'Upgrade' : 'Change plan' }}</p>
      <h2 class="change__title">
        {{ isUpgrade ? `Upgrade to ${plan.name}` : `Switch to ${plan.name}` }}
      </h2>

      <div class="change__summary">
        <div class="change__row">
          <span class="muted">Plan</span>
          <span class="change__plans">
            <PlanBadge :plan-id="fromPlanId" />
            <ArrowRight :size="14" class="muted" />
            <PlanBadge :plan-id="plan.id" />
          </span>
        </div>
        <div class="change__row">
          <span class="muted">Billing</span>
          <span class="strong">{{ price === 0 ? 'Free' : `${formatMoney(price)} / ${intervalLabel}` }}</span>
        </div>
        <div v-if="price > 0" class="change__row change__row--total">
          <span>Due today</span>
          <span class="num">{{ formatMoney(price) }}</span>
        </div>
      </div>

      <div v-if="losesMonitoring" class="callout callout-sun">
        <span>
          Monitoring and email alerts will pause. We'll keep your watchlist and settings, so you can pick up where you
          left off if you come back to Pro.
        </span>
      </div>
      <div v-else-if="plan.id === 'pro'" class="callout">
        <span>We'll start watching the holdings from your linked account or latest scan right away.</span>
      </div>

      <div v-if="needsCard" class="card-form">
        <div class="row-between">
          <p class="card-form__title"><CreditCard :size="17" /> Payment details</p>
          <button type="button" class="link text-sm" @click="fillTestCard">Use test card</button>
        </div>
        <div class="field">
          <label class="label" for="card-name">Name on card</label>
          <input id="card-name" v-model="card.name" class="input" :class="{ 'is-invalid': cardErrors.name }" autocomplete="cc-name" />
          <span v-if="cardErrors.name" class="field-error">{{ cardErrors.name }}</span>
        </div>
        <div class="field">
          <label class="label" for="card-number">Card number</label>
          <input
            id="card-number"
            :value="card.number"
            class="input num"
            :class="{ 'is-invalid': cardErrors.number }"
            inputmode="numeric"
            autocomplete="cc-number"
            placeholder="1234 1234 1234 1234"
            @input="formatNumber"
          />
          <span v-if="cardErrors.number" class="field-error">{{ cardErrors.number }}</span>
        </div>
        <div class="card-form__split">
          <div class="field">
            <label class="label" for="card-exp">Expiry</label>
            <input
              id="card-exp"
              :value="card.expiry"
              class="input num"
              :class="{ 'is-invalid': cardErrors.expiry }"
              inputmode="numeric"
              autocomplete="cc-exp"
              placeholder="MM/YY"
              @input="formatExpiry"
            />
            <span v-if="cardErrors.expiry" class="field-error">{{ cardErrors.expiry }}</span>
          </div>
          <div class="field">
            <label class="label" for="card-cvc">CVC</label>
            <input
              id="card-cvc"
              v-model="card.cvc"
              class="input num"
              :class="{ 'is-invalid': cardErrors.cvc }"
              inputmode="numeric"
              autocomplete="cc-csc"
              maxlength="4"
              placeholder="123"
            />
            <span v-if="cardErrors.cvc" class="field-error">{{ cardErrors.cvc }}</span>
          </div>
        </div>
      </div>
      <p v-else-if="price > 0 && subscription?.paymentMethod" class="change__card">
        <CreditCard :size="16" /> Paying with {{ subscription.paymentMethod.brand }} ending in
        {{ subscription.paymentMethod.last4 }}
      </p>

      <p v-if="error" class="field-error">{{ error }}</p>

      <button type="button" class="btn btn-primary btn-lg btn-block" :disabled="saving" @click="confirm">
        <span v-if="saving" class="spinner" />
        {{ saving ? 'Updating your plan…' : price > 0 ? `Confirm and pay ${formatMoney(price)}` : `Switch to ${plan.name}` }}
      </button>
      <p class="change__fine"><Lock :size="13" /> Cancel or change anytime. Prorated credit applies automatically.</p>
    </div>

    <div v-else-if="plan && step === 'success'" class="success">
      <span class="success__icon"><PartyPopper :size="30" /></span>
      <h2 class="success__title">You're on {{ plan.name }}</h2>
      <p class="muted">
        <template v-if="result?.renewsAt">Renews {{ formatDateLong(result.renewsAt) }}. </template>
        <template v-if="plan.id === 'pro'">We'll keep watch and email you when something worth knowing happens.</template>
        <template v-else-if="plan.id === 'premium'">Scan as many stocks and ETFs as you like.</template>
        <template v-else>Your past scans are still here whenever you need them.</template>
      </p>
      <RouterLink :to="nextStep.to" class="btn btn-primary btn-lg" @click="emit('close')">
        {{ nextStep.label }} <ArrowRight :size="18" />
      </RouterLink>
    </div>
  </UiModal>
</template>

<style scoped>
.change {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.change__title {
  margin-top: -6px;
  font-size: 30px;
}
.change__summary {
  padding: 6px 18px;
  border: 1px solid var(--line);
  border-radius: 18px;
}
.change__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  font-size: 15px;
}
.change__row + .change__row {
  border-top: 1px solid var(--line);
}
.change__row--total {
  font-weight: 750;
  font-size: 17px;
}
.change__plans {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.card-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  border-radius: 18px;
  background: var(--surface-muted);
  border: 1px solid var(--line);
}
.card-form__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
}
.card-form__split {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.change__card {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--muted);
}
.change__fine {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--subtle);
}
.success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px 0 4px;
  text-align: center;
}
.success__icon {
  display: grid;
  place-items: center;
  width: 68px;
  height: 68px;
  margin-bottom: 8px;
  border-radius: 22px;
  background: linear-gradient(140deg, var(--brand-100), var(--sun-100));
  color: var(--brand-700);
}
.success__title {
  font-size: 32px;
}
.success .btn {
  margin-top: 12px;
}
</style>
