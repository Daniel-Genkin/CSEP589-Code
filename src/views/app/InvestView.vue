<script setup>
import { ERROR_CODES, investService, isMockApi, thesesService } from '@/api'
import BrokerageAccountForm from '@/components/invest/BrokerageAccountForm.vue'
import SecurityLogo from '@/components/ui/SecurityLogo.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useToast } from '@/composables/useToast'
import { formatDate, formatMoney } from '@/utils/format'
import { SCHEDULES, scheduleLabel, splitDollars } from '@/utils/thesis'
import { ArrowLeft, BellRing, Check, CircleCheckBig, Landmark, Lock, ShieldAlert } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const toast = useToast()

const thesis = ref(null)
const account = ref(null)
const loading = ref(true)
const error = ref(null)
const step = ref('amount')
const amountInput = ref('50')
const schedule = ref('quarterly')
const placing = ref(false)
const orderError = ref('')
const result = ref(null)

const QUICK = [10, 25, 50, 100, 250]
const round2 = (n) => Math.round(n * 100) / 100

const amount = computed(() => round2(Number(String(amountInput.value).replace(/[^0-9.]/g, '')) || 0))
const amountError = computed(() => {
  if (amount.value < 10) return 'The minimum is $10.'
  if (amount.value > 50000) return 'This demo caps orders at $50,000.'
  return ''
})
const allocations = computed(() => {
  const basket = thesis.value?.basket ?? []
  const dollars = splitDollars(amount.value, basket.map((item) => item.weight))
  return basket.map((item, i) => ({ ...item, dollars: dollars[i] }))
})
const isTopUp = computed(() => Boolean(thesis.value?.position))
const steps = computed(() => [
  { key: 'account', label: account.value ? `Account ••${account.value.last4}` : 'Open account' },
  { key: 'amount', label: 'Amount & schedule' },
  { key: 'review', label: 'Review' },
])
const stepIndex = computed(() => ['account', 'amount', 'review', 'done'].indexOf(step.value))

onMounted(async () => {
  try {
    const [loaded, acct] = await Promise.all([thesesService.get(route.params.thesisId), investService.getAccount()])
    if (!loaded.isOwner) throw new Error('You can invest in theses you’ve built. Follow this one to see how it holds up.')
    thesis.value = loaded
    account.value = acct
    if (loaded.position) schedule.value = loaded.position.schedule
    step.value = acct ? 'amount' : 'account'
  } catch (err) {
    error.value = err
  } finally {
    loading.value = false
  }
})

function onAccountOpened(acct) {
  account.value = acct
  step.value = 'amount'
  toast.success('Your brokerage account is open', { description: 'Next, choose how much to invest.' })
}

function toReview() {
  if (amountError.value) return
  orderError.value = ''
  step.value = 'review'
}

async function placeOrder() {
  placing.value = true
  orderError.value = ''
  try {
    result.value = await thesesService.invest(thesis.value.id, { amount: amount.value, schedule: schedule.value })
    step.value = 'done'
  } catch (err) {
    if (err.code === ERROR_CODES.ACCOUNT_REQUIRED) step.value = 'account'
    orderError.value = err.message
  } finally {
    placing.value = false
  }
}
</script>

<template>
  <div class="page invest">
    <div v-if="loading" class="skeleton" style="height: 420px" />

    <div v-else-if="error" class="card">
      <EmptyState :icon="ShieldAlert" title="You can’t invest in this thesis" :text="error.message">
        <RouterLink :to="`/app/theses/${route.params.thesisId}`" class="btn btn-primary">Back to the thesis</RouterLink>
      </EmptyState>
    </div>

    <template v-else-if="thesis">
      <RouterLink :to="`/app/theses/${thesis.id}`" class="back-link"><ArrowLeft :size="16" /> Back to the thesis</RouterLink>
      <header class="page-head">
        <div>
          <p class="eyebrow">{{ isTopUp ? 'Add money' : 'Invest in one tap' }}</p>
          <h1 class="page-title">{{ thesis.title }}</h1>
          <p class="page-sub">
            {{ thesis.basket.length }} companies in fractional shares, through Outvest’s registered brokerage partner.
          </p>
        </div>
      </header>

      <ol v-if="step !== 'done'" class="stepper">
        <li v-for="(s, i) in steps" :key="s.key" :class="{ 'is-done': i < stepIndex, 'is-active': i === stepIndex }">
          <span class="stepper__dot"><Check v-if="i < stepIndex" :size="13" :stroke-width="3" /><template v-else>{{ i + 1 }}</template></span>
          {{ s.label }}
        </li>
      </ol>

      <section v-if="step === 'account'" class="card card-pad panel">
        <h2 class="h-3">Open your brokerage account</h2>
        <p class="muted panel__sub">You only do this once. After that, investing in any of your theses takes one tap.</p>
        <p v-if="orderError" class="field-error">{{ orderError }}</p>
        <BrokerageAccountForm @opened="onAccountOpened" />
      </section>

      <div v-else-if="step === 'amount'" class="grid">
        <section class="card card-pad panel">
          <h2 class="h-3">How much?</h2>
          <label class="amount" :class="{ 'is-invalid': amountError }">
            <span class="amount__sign">$</span>
            <input v-model="amountInput" class="amount__input num" inputmode="decimal" aria-label="Amount in dollars" />
          </label>
          <p v-if="amountError" class="field-error">{{ amountError }}</p>
          <p v-else class="muted text-sm">Minimum $10. Your money is split across the basket by weight.</p>
          <div class="quick">
            <button v-for="q in QUICK" :key="q" type="button" class="chip" :class="{ 'is-active': amount === q }" @click="amountInput = String(q)">
              ${{ q }}
            </button>
          </div>

          <h2 class="h-3 panel__title">How often should we rebalance?</h2>
          <div class="schedules" role="radiogroup" aria-label="Rebalancing schedule">
            <label v-for="s in SCHEDULES" :key="s.value" class="schedule" :class="{ 'is-on': schedule === s.value }">
              <input v-model="schedule" type="radio" name="schedule" :value="s.value" />
              <span class="schedule__label">{{ s.label }}</span>
              <span class="schedule__desc">{{ s.description }}</span>
            </label>
          </div>
          <p class="note"><BellRing :size="15" /> We’ll only alert you when news affects this thesis, plus a heads-up before each rebalance.</p>

          <button type="button" class="btn btn-primary btn-lg btn-block" :disabled="Boolean(amountError)" @click="toReview">Review order</button>
        </section>

        <aside class="card card-pad panel">
          <p class="card-title">Where your {{ formatMoney(amount || 0) }} goes</p>
          <ul class="alloc">
            <li v-for="item in allocations" :key="item.symbol">
              <SecurityLogo :symbol="item.symbol" :name="item.name" :color="item.color" :size="30" />
              <span class="grow">
                <span class="alloc__name">{{ item.name }}</span>
                <span class="muted text-xs">{{ item.weight.toFixed(1) }}%</span>
              </span>
              <span class="num strong">{{ formatMoney(item.dollars) }}</span>
            </li>
          </ul>
        </aside>
      </div>

      <section v-else-if="step === 'review'" class="card card-pad panel review">
        <h2 class="h-3">Review your order</h2>
        <dl class="review__rows">
          <div><dt>You’re buying</dt><dd>{{ formatMoney(amount) }} of “{{ thesis.title }}”</dd></div>
          <div><dt>Companies</dt><dd>{{ thesis.basket.length }}, in fractional shares</dd></div>
          <div><dt>From</dt><dd>{{ account.bank.name }} ••{{ account.bank.last4 }}</dd></div>
          <div><dt>Into</dt><dd>Brokerage account ••{{ account.last4 }}</dd></div>
          <div><dt>Rebalancing</dt><dd>{{ scheduleLabel(schedule) }}</dd></div>
        </dl>
        <p v-if="isTopUp" class="callout callout-lilac review__note">
          Adding money also rebalances what you already own to the basket’s latest weights.
        </p>
        <p class="review__risk">
          Investing involves risk, including loss of the money you invest. Past performance and backtests don’t predict future
          results.
        </p>
        <p v-if="isMockApi" class="review__demo"><Lock :size="14" /> Demo only: no real money moves.</p>
        <p v-if="orderError" class="field-error">{{ orderError }}</p>
        <div class="review__actions">
          <button type="button" class="btn btn-ghost" :disabled="placing" @click="step = 'amount'">Back</button>
          <button type="button" class="btn btn-primary btn-lg" :disabled="placing" @click="placeOrder">
            <span v-if="placing" class="spinner" />
            {{ placing ? 'Placing your order…' : `Buy ${formatMoney(amount)}` }}
          </button>
        </div>
      </section>

      <section v-else-if="step === 'done' && result" class="card card-pad panel done">
        <span class="done__icon"><CircleCheckBig :size="30" /></span>
        <h2 class="h-2">You own the idea.</h2>
        <p class="muted">
          Bought {{ formatMoney(result.order.amount) }} of “{{ thesis.title }}”. Next rebalance:
          {{ formatDate(result.position.nextRebalanceAt, { month: 'long', day: 'numeric' }) }}
          ({{ scheduleLabel(result.position.schedule).toLowerCase() }}).
        </p>
        <ul class="alloc done__alloc">
          <li v-for="item in result.order.allocations" :key="item.symbol">
            <SecurityLogo :symbol="item.symbol" :name="item.name" :color="item.color" :size="30" />
            <span class="grow">
              <span class="alloc__name">{{ item.name }}</span>
              <span class="muted text-xs">{{ item.shares }} shares at {{ formatMoney(item.price) }}</span>
            </span>
            <span class="num strong">{{ formatMoney(item.dollars) }}</span>
          </li>
        </ul>
        <div class="done__actions">
          <RouterLink to="/app/portfolio" class="btn btn-primary"><Landmark :size="16" /> View portfolio</RouterLink>
          <RouterLink :to="`/app/theses/${thesis.id}`" class="btn btn-secondary">Back to the thesis</RouterLink>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.invest {
  max-width: 980px;
}
.stepper {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 22px;
  margin-bottom: 18px;
}
.stepper li {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 650;
  color: var(--subtle);
}
.stepper li.is-active {
  color: var(--ink);
}
.stepper li.is-done {
  color: var(--ink-2);
}
.stepper__dot {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid currentColor;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
}
.is-active .stepper__dot {
  border-color: var(--ink-solid);
  background: var(--sun);
  color: var(--ink);
}
.is-done .stepper__dot {
  border-color: var(--ink-solid);
  background: var(--signal);
  color: var(--cream);
}
.panel__sub {
  margin: 4px 0 18px;
}
.panel__title {
  margin-top: 28px;
}
.grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}
.amount {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 14px 0 8px;
  padding: 6px 18px;
  border-radius: 20px;
  border: var(--outline);
  background: var(--surface);
  transition: box-shadow 0.2s;
}
.amount:focus-within {
  box-shadow: var(--shadow-sm);
}
.amount.is-invalid {
  border-color: var(--coral-500);
}
.amount.is-invalid:focus-within {
  box-shadow: 4px 4px 0 var(--coral-500);
}
.amount__sign {
  font-family: var(--font-display);
  font-size: 40px;
  color: var(--muted);
}
.amount__input {
  width: 100%;
  border: 0;
  outline: none;
  background: transparent;
  font-family: var(--font-display);
  font-size: 54px;
  line-height: 1.1;
}
.quick {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
.schedules {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}
.schedule {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 14px;
  border: var(--outline-thin);
  border-radius: 16px;
  background: var(--surface);
  cursor: pointer;
  transition:
    background-color 0.2s,
    box-shadow 0.2s,
    transform 0.2s;
}
.schedule input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.schedule:hover {
  background: var(--sun-50);
}
.schedule:focus-within {
  outline: 3px solid var(--signal);
  outline-offset: 2px;
}
.schedule.is-on {
  background: var(--sun-100);
  box-shadow: var(--shadow-sm);
  transform: translate(-2px, -2px);
}
.schedule__label {
  font-weight: 700;
}
.schedule__desc {
  font-size: 13px;
  color: var(--muted);
}
.note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 18px 0;
  font-size: 13.5px;
  color: var(--muted);
}
.note svg {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--signal);
}
.alloc {
  display: flex;
  flex-direction: column;
  margin-top: 10px;
}
.alloc li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 0;
  border-top: 2px dashed var(--line);
}
.alloc li:first-child {
  border-top: 0;
}
.alloc .grow {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}
.alloc__name {
  font-size: 14px;
  font-weight: 650;
}
.review {
  max-width: 620px;
}
.review__rows {
  display: flex;
  flex-direction: column;
  margin-top: 14px;
}
.review__rows div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
  border-top: 2px dashed var(--line);
}
.review__rows dt {
  color: var(--muted);
}
.review__rows dd {
  font-weight: 700;
  text-align: right;
}
.review__note {
  margin-top: 12px;
}
.review__risk {
  margin-top: 14px;
  font-size: 13px;
  color: var(--muted);
}
.review__demo {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 12.5px;
  color: var(--muted);
}
.review__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
.done {
  max-width: 640px;
}
.done__icon {
  display: grid;
  place-items: center;
  width: 60px;
  height: 60px;
  margin-bottom: 14px;
  border: var(--outline);
  border-radius: 20px;
  background: var(--sun);
  color: var(--ink);
  box-shadow: var(--shadow-sm);
  transform: rotate(-4deg);
}
.done .muted {
  margin-top: 6px;
}
.done__alloc {
  margin-top: 18px;
}
.done__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}
@media (max-width: 860px) {
  .grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (max-width: 520px) {
  .schedules {
    grid-template-columns: minmax(0, 1fr);
  }
  .review__actions .btn-lg {
    flex: 1;
  }
}
</style>
