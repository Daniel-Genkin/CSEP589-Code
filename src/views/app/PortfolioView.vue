<script setup>
import { investService, thesesService } from '@/api'
import BrokerageAccountForm from '@/components/invest/BrokerageAccountForm.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SecurityLogo from '@/components/ui/SecurityLogo.vue'
import UiModal from '@/components/ui/UiModal.vue'
import { useAsync } from '@/composables/useAsync'
import { useToast } from '@/composables/useToast'
import { useSessionStore } from '@/stores/session'
import { formatDate, formatMoney } from '@/utils/format'
import { SCHEDULES, formatReturn } from '@/utils/thesis'
import { ChevronDown, Landmark, Lightbulb, RefreshCw, ShieldCheck, Wallet } from '@lucide/vue'
import { computed, ref } from 'vue'

const session = useSessionStore()
const toast = useToast()

const { data: portfolio, loading, run: reload } = useAsync(() =>
  session.hasAccount ? investService.portfolio() : Promise.resolve(null),
)
const { data: mine, run: reloadMine } = useAsync(() => thesesService.list('mine'))

const accountOpen = ref(false)
const expanded = ref(null)
const savingSchedule = ref(null)
const selling = ref(null)
const sellTarget = ref(null)

const investable = computed(() => (mine.value ?? []).filter((t) => !t.invested).slice(0, 4))
const summary = computed(() => portfolio.value?.summary)

async function onAccountOpened() {
  accountOpen.value = false
  toast.success('Your brokerage account is open', { description: 'Pick a thesis to invest in.' })
  await reload()
}

async function changeSchedule(position, value) {
  savingSchedule.value = position.id
  try {
    const updated = await investService.updatePosition(position.id, { schedule: value })
    portfolio.value = {
      ...portfolio.value,
      positions: portfolio.value.positions.map((p) => (p.id === updated.id ? updated : p)),
    }
    toast.success('Rebalancing schedule updated', { description: `Next rebalance: ${formatDate(updated.nextRebalanceAt, { month: 'long', day: 'numeric' })}.` })
  } catch (err) {
    toast.error('Couldn’t change the schedule', { description: err.message })
  } finally {
    savingSchedule.value = null
  }
}

async function confirmSell() {
  const position = sellTarget.value
  selling.value = position.id
  try {
    const { proceeds } = await investService.sell(position.id)
    sellTarget.value = null
    toast.info(`Sold “${position.thesis.title}”`, { description: `${formatMoney(proceeds)} moved to your cash balance.` })
    await Promise.all([reload(), reloadMine()])
  } catch (err) {
    toast.error('Couldn’t sell', { description: err.message })
  } finally {
    selling.value = null
  }
}
</script>

<template>
  <div class="page portfolio">
    <header class="page-head">
      <div>
        <h1 class="page-title">Portfolio</h1>
        <p class="page-sub">The theses you own, held with Outvest’s registered brokerage partner.</p>
      </div>
    </header>

    <!-- No brokerage account yet -->
    <section v-if="!session.hasAccount" class="intro card">
      <div class="intro__copy">
        <span class="eyebrow"><Wallet :size="15" /> Invest from $10</span>
        <h2 class="h-2">Own the theses you believe in.</h2>
        <p class="muted">
          Building, workshopping and publishing are free. When a thesis feels solid, buy the whole basket in fractional
          shares. Opening a brokerage account takes about five minutes.
        </p>
        <ul class="intro__list">
          <li><Landmark :size="16" /> Held with Outvest’s registered brokerage partner</li>
          <li><RefreshCw :size="16" /> Rebalanced on the schedule you pick</li>
          <li><ShieldCheck :size="16" /> Alerts only when news affects your thesis</li>
        </ul>
        <button type="button" class="btn btn-primary btn-lg" @click="accountOpen = true">Open my brokerage account</button>
      </div>
    </section>

    <div v-else-if="loading" class="skeleton" style="height: 360px" />

    <template v-else-if="portfolio">
      <section class="summary card">
        <div class="summary__main">
          <p class="muted strong text-sm">Total value</p>
          <p class="summary__value num">{{ formatMoney(summary.value) }}</p>
          <p class="summary__gain" :class="summary.gain >= 0 ? 'is-up' : 'is-down'">
            {{ summary.gain >= 0 ? '+' : '−' }}{{ formatMoney(Math.abs(summary.gain)) }} ({{ formatReturn(summary.gainPct) }})
            <span class="muted">on {{ formatMoney(summary.invested) }} invested</span>
          </p>
          <p class="muted text-sm">The S&P 500 did {{ formatReturn(summary.benchmarkGainPct) }} over the same time.</p>
        </div>
        <div class="summary__account">
          <span class="summary__account-icon"><Landmark :size="18" /></span>
          <span>
            <strong>Brokerage account ••{{ portfolio.account.last4 }}</strong>
            <span class="muted text-sm">Funded from {{ portfolio.account.bank.name }} ••{{ portfolio.account.bank.last4 }}</span>
            <span v-if="portfolio.account.cash" class="muted text-sm">Cash: {{ formatMoney(portfolio.account.cash) }}</span>
          </span>
        </div>
      </section>

      <section v-if="portfolio.positions.length" class="positions">
        <article v-for="position in portfolio.positions" :key="position.id" class="position card">
          <div class="position__head">
            <div class="grow">
              <span class="topic-chip">{{ position.thesis.topic.short }}</span>
              <RouterLink :to="`/app/theses/${position.thesis.id}`" class="position__title">{{ position.thesis.title }}</RouterLink>
              <p class="muted text-sm">Invested {{ formatMoney(position.invested) }} since {{ formatDate(position.createdAt, { month: 'short', day: 'numeric', year: 'numeric' }) }}</p>
            </div>
            <div class="position__value">
              <p class="num strong">{{ formatMoney(position.value) }}</p>
              <p class="num text-sm" :class="position.gainPct >= 0 ? 'is-up' : 'is-down'">{{ formatReturn(position.gainPct) }}</p>
              <p class="muted text-xs">S&P 500 {{ formatReturn(position.benchmarkGainPct) }}</p>
            </div>
          </div>

          <div class="position__controls">
            <label class="position__schedule">
              <RefreshCw :size="15" />
              <span>Rebalance</span>
              <select
                class="input input--sm"
                :value="position.schedule"
                :disabled="savingSchedule === position.id"
                @change="changeSchedule(position, $event.target.value)"
              >
                <option v-for="s in SCHEDULES" :key="s.value" :value="s.value">{{ s.label }}</option>
              </select>
              <span class="muted text-sm">next {{ formatDate(position.nextRebalanceAt) }}</span>
            </label>
            <div class="position__actions">
              <RouterLink :to="`/app/theses/${position.thesis.id}/invest`" class="btn btn-soft btn-sm">Add money</RouterLink>
              <button type="button" class="btn btn-ghost btn-sm" @click="sellTarget = position">Sell</button>
              <button
                type="button"
                class="btn btn-ghost btn-sm btn-icon"
                :aria-expanded="expanded === position.id"
                aria-label="Show holdings"
                @click="expanded = expanded === position.id ? null : position.id"
              >
                <ChevronDown :size="18" class="chevron" :class="{ 'is-open': expanded === position.id }" />
              </button>
            </div>
          </div>

          <ul v-if="expanded === position.id" class="holdings">
            <li v-for="h in position.holdings" :key="h.symbol">
              <SecurityLogo :symbol="h.symbol" :name="h.name" :color="h.color" :size="30" />
              <span class="grow">
                <span class="holdings__name">{{ h.name }}</span>
                <span class="muted text-xs">{{ h.shares }} shares · {{ h.weight.toFixed(1) }}% target</span>
              </span>
              <span class="num strong">{{ formatMoney(h.value) }}</span>
            </li>
          </ul>
        </article>
      </section>

      <div v-else class="card">
        <EmptyState :icon="Wallet" title="Nothing invested yet" text="Pick one of your theses below and buy the basket from $10." />
      </div>

      <section v-if="investable.length" class="next">
        <h2 class="section-title">Ready to invest</h2>
        <ul class="next__list">
          <li v-for="t in investable" :key="t.id" class="next__item card">
            <span class="next__icon"><Lightbulb :size="17" /></span>
            <span class="grow">
              <strong>{{ t.title }}</strong>
              <span class="muted text-sm">{{ t.basket.length }} companies · {{ t.status === 'published' ? 'Published' : 'Draft' }}</span>
            </span>
            <RouterLink :to="`/app/theses/${t.id}/invest`" class="btn btn-primary btn-sm">Invest</RouterLink>
          </li>
        </ul>
      </section>
      <p class="disclaimer">Illustrative demo data. Values use simulated prices, not real market data.</p>
    </template>

    <UiModal :open="accountOpen" size="lg" label="Open a brokerage account" @close="accountOpen = false">
      <h2 class="h-3">Open your brokerage account</h2>
      <p class="muted modal-sub">You only do this once. After that, investing in any of your theses takes one tap.</p>
      <BrokerageAccountForm @opened="onAccountOpened" />
    </UiModal>

    <UiModal :open="Boolean(sellTarget)" size="sm" label="Sell basket" @close="sellTarget = null">
      <template v-if="sellTarget">
        <h2 class="h-3">Sell “{{ sellTarget.thesis.title }}”?</h2>
        <p class="muted modal-sub">
          We’ll sell every company in the basket and move about {{ formatMoney(sellTarget.value) }} to your cash balance. The
          thesis stays in your workshop.
        </p>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" @click="sellTarget = null">Keep it</button>
          <button type="button" class="btn btn-danger" :disabled="selling === sellTarget.id" @click="confirmSell">
            <span v-if="selling === sellTarget.id" class="spinner" />
            Sell basket
          </button>
        </div>
      </template>
    </UiModal>
  </div>
</template>

<style scoped>
.portfolio {
  max-width: 920px;
}
.is-up {
  color: var(--score-great);
}
.is-down {
  color: var(--score-low);
}
.intro {
  padding: 32px;
  background: var(--surface);
}
.intro__copy {
  max-width: 560px;
}
.intro .h-2 {
  margin: 10px 0 8px;
}
.intro__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 18px 0 24px;
  font-weight: 600;
}
.intro__list li {
  display: flex;
  align-items: center;
  gap: 10px;
}
.intro__list svg {
  box-sizing: content-box;
  flex-shrink: 0;
  padding: 3px;
  border: 1.5px solid var(--ink-solid);
  border-radius: 50%;
  background: var(--sun);
  color: var(--ink);
}
.summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  padding: 26px;
  margin-bottom: 24px;
}
.summary__value {
  margin-top: 4px;
  font-family: var(--font-display);
  font-size: 64px;
  line-height: 0.95;
}
.summary__gain {
  margin: 8px 0 2px;
  font-weight: 700;
}
.summary__account {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: var(--outline-thin);
  border-radius: 16px;
  background: var(--surface-muted);
}
.summary__account > span:last-child {
  display: flex;
  flex-direction: column;
  line-height: 1.4;
}
.summary__account-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border: 1.5px solid var(--ink-solid);
  border-radius: 12px;
  background: var(--sun);
  color: var(--ink);
}
.positions {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.position {
  padding: 20px;
}
.position__head {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}
.position__title {
  display: block;
  margin: 10px 0 4px;
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 400;
  line-height: 1;
  text-transform: uppercase;
}
.position__title:hover {
  color: var(--signal-ink);
}
.position__value {
  text-align: right;
}
.position__value .strong {
  font-family: var(--font-display);
  font-size: 30px;
  font-weight: 400;
}
.position__controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 2px dashed var(--line);
}
.position__schedule {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 650;
  color: var(--ink-2);
}
.input--sm {
  width: auto;
  height: 36px;
  padding: 0 10px;
  border-radius: 10px;
  font-size: 14px;
  appearance: auto;
}
.position__actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.chevron {
  transition: transform 0.25s var(--ease);
}
.chevron.is-open {
  transform: rotate(180deg);
}
.holdings {
  display: flex;
  flex-direction: column;
  margin-top: 12px;
}
.holdings li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 0;
  border-top: 2px dashed var(--line);
}
.holdings .grow {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}
.holdings__name {
  font-size: 14px;
  font-weight: 650;
}
.next {
  margin-top: 30px;
}
.next__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}
.next__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
}
.next__item .grow {
  display: flex;
  flex-direction: column;
}
.next__icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border: 1.5px solid var(--ink-solid);
  border-radius: 12px;
  background: var(--sun);
  color: var(--ink);
}
.modal-sub {
  margin: 6px 0 18px;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
@media (max-width: 640px) {
  .intro {
    padding: 22px;
  }
  .summary {
    padding: 20px;
  }
  .summary__value {
    font-size: 52px;
  }
  .position__head {
    flex-wrap: wrap;
  }
  .position__value {
    text-align: left;
  }
}
</style>
