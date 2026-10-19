<script setup>
import { monitoringService } from '@/api'
import TickerSearch from '@/components/scan/TickerSearch.vue'
import DeltaChip from '@/components/ui/DeltaChip.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import PlanBadge from '@/components/ui/PlanBadge.vue'
import ScoreChip from '@/components/ui/ScoreChip.vue'
import SecurityLogo from '@/components/ui/SecurityLogo.vue'
import UiToggle from '@/components/ui/UiToggle.vue'
import { useAsync } from '@/composables/useAsync'
import { useToast } from '@/composables/useToast'
import { useAlertsStore } from '@/stores/alerts'
import { timeAgo } from '@/utils/format'
import { CATEGORIES } from '@/utils/scoring'
import {
    ArrowRight,
    BellRing,
    Building2,
    CalendarClock,
    Check,
    Clock,
    Mail,
    Radar,
    RefreshCw,
    Sparkles,
    X,
} from '@lucide/vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'

const toast = useToast()
const alerts = useAlertsStore()
const { data: monitoring, loading } = useAsync(() => monitoringService.get())

const FREQUENCIES = [
  { value: 'instant', label: 'Right away', hint: 'One email per alert' },
  { value: 'daily', label: 'Daily digest', hint: 'Bundled at 8am' },
  { value: 'weekly', label: 'Weekly recap', hint: 'Sunday mornings' },
]
const SENSITIVITIES = [
  { value: 'major', label: 'Only big changes', hint: 'Score moves of 5+ points' },
  { value: 'balanced', label: 'Balanced', hint: 'Recommended for most people' },
  { value: 'all', label: 'Everything', hint: 'Every story we track' },
]

const settings = reactive({ frequency: 'instant', sensitivity: 'balanced', categories: [], includeRebalances: true })
const saved = ref('')
const saving = ref(false)
const checking = ref(false)

const snapshot = () => JSON.stringify({ ...settings, categories: [...settings.categories].sort() })
const dirty = computed(() => snapshot() !== saved.value)

watch(monitoring, (m) => {
  if (!m || m.locked) return
  const { frequency, sensitivity, categories, includeRebalances } = m.settings
  Object.assign(settings, { frequency, sensitivity, categories: [...categories], includeRebalances })
  saved.value = snapshot()
})

onMounted(() => alerts.ensureLoaded().catch(() => {}))

const symbols = computed(() => monitoring.value?.holdings?.map((h) => h.symbol) ?? [])
const latestAlertId = computed(() => alerts.items[0]?.id)
const recent = computed(() => alerts.items.slice(0, 3))

async function refresh() {
  monitoring.value = await monitoringService.get()
}

function toggleCategory(key) {
  settings.categories = settings.categories.includes(key)
    ? settings.categories.filter((k) => k !== key)
    : [...settings.categories, key]
}

async function save() {
  saving.value = true
  try {
    await monitoringService.updateSettings({ ...settings })
    saved.value = snapshot()
    toast.success('Alert settings saved', { description: 'Changes apply to your next check.' })
  } catch (err) {
    toast.error("Couldn't save settings", { description: err.message })
  } finally {
    saving.value = false
  }
}

async function checkNow() {
  checking.value = true
  try {
    const result = await monitoringService.checkNow()
    await Promise.all([refresh(), alerts.fetch()])
    const [first] = result.newAlerts
    if (first) {
      toast.success('Something new is worth a look', {
        description: `${first.symbol}: ${first.title}. We emailed you a summary.`,
        action: { label: 'Open email', to: `/preview/email/${first.id}` },
        timeout: 8000,
      })
    } else {
      toast.info('All quiet', { description: "Nothing new worth your attention. We'll keep watching." })
    }
  } catch (err) {
    toast.error("Couldn't run a check", { description: err.message })
  } finally {
    checking.value = false
  }
}

async function watchSymbol(security) {
  try {
    await monitoringService.watch(security.symbol)
    await refresh()
    toast.success(`Watching ${security.symbol}`)
  } catch (err) {
    toast.error("Couldn't add that holding", { description: err.message })
  }
}

async function unwatch(symbol) {
  try {
    await monitoringService.unwatch(symbol)
    await refresh()
    toast.info(`Stopped watching ${symbol}`)
  } catch (err) {
    toast.error("Couldn't update monitoring", { description: err.message })
  }
}

const KIND_ICONS = { negative: BellRing, positive: Sparkles, forecast: CalendarClock }
</script>

<template>
  <div class="page">
    <div v-if="loading" class="stack gap-4">
      <div class="skeleton" style="height: 70px; max-width: 520px" />
      <div class="skeleton" style="height: 110px" />
      <div class="skeleton" style="height: 420px" />
    </div>

    <!-- Locked: not on Pro -->
    <div v-else-if="monitoring?.locked" class="locked">
      <div class="locked__preview" aria-hidden="true">
        <div class="locked__stats">
          <div v-for="n in 4" :key="n" class="locked__stat" />
        </div>
        <div v-for="n in 5" :key="n" class="locked__row">
          <span class="locked__logo" />
          <span class="locked__line" />
          <span class="locked__pill" />
        </div>
      </div>
      <div class="locked__card card">
        <span class="locked__icon"><Radar :size="26" /></span>
        <PlanBadge plan-id="pro" />
        <h1 class="locked__title">Let outvest keep watch</h1>
        <p class="locked__text">
          Companies change. Pro checks your holdings around the clock and emails you when something's worth a look,
          with a calm summary of what happened and how it affects the values you care about.
        </p>
        <ul class="locked__list">
          <li><Check :size="16" /> Continuous monitoring of every holding and ETF</li>
          <li><Check :size="16" /> Plain-English email alerts, never spammy</li>
          <li><Check :size="16" /> Heads-ups before ETF rebalances change what you own</li>
        </ul>
        <RouterLink :to="{ path: '/app/plan', query: { upgrade: 'pro' } }" class="btn btn-primary btn-lg btn-block">
          Upgrade to Pro · $9.99/mo <ArrowRight :size="18" />
        </RouterLink>
        <RouterLink to="/pricing" class="link text-sm">Compare plans</RouterLink>
      </div>
    </div>

    <template v-else-if="monitoring">
      <header class="page-head">
        <div>
          <div class="title-row">
            <h1 class="page-title">Monitoring</h1>
            <span class="live"><span class="live__dot" /> Active</span>
          </div>
          <p class="page-sub">We check your holdings around the clock and only email you when something is worth a look.</p>
        </div>
        <div class="head-actions">
          <RouterLink v-if="latestAlertId" :to="`/preview/email/${latestAlertId}`" class="btn btn-ghost">
            <Mail :size="17" /> Preview alert email
          </RouterLink>
          <button type="button" class="btn btn-secondary" :disabled="checking" @click="checkNow">
            <RefreshCw :size="16" :class="{ spinning: checking }" />
            {{ checking ? 'Checking…' : 'Check now' }}
          </button>
        </div>
      </header>

      <div class="stats">
        <div class="stat card">
          <span class="stat__icon"><Radar :size="18" /></span>
          <span class="stat__value num">{{ monitoring.stats.watching }}</span>
          <span class="stat__label">holdings watched</span>
        </div>
        <div class="stat card">
          <span class="stat__icon stat__icon--lilac"><Building2 :size="18" /></span>
          <span class="stat__value num">{{ monitoring.stats.companiesCovered.toLocaleString() }}</span>
          <span class="stat__label">companies covered</span>
        </div>
        <div class="stat card">
          <span class="stat__icon stat__icon--coral"><BellRing :size="18" /></span>
          <span class="stat__value num">{{ monitoring.stats.alertsThisMonth }}</span>
          <span class="stat__label">alerts this month</span>
        </div>
        <div class="stat card">
          <span class="stat__icon stat__icon--sun"><Clock :size="18" /></span>
          <span class="stat__value stat__value--sm">{{ timeAgo(monitoring.lastCheckedAt) || 'Not yet' }}</span>
          <span class="stat__label">last check · next {{ timeAgo(monitoring.nextCheckAt) }}</span>
        </div>
      </div>

      <div class="grid">
        <section class="card watch">
          <div class="watch__head">
            <div>
              <p class="card-title">What we're watching</p>
              <p class="card-sub">Holdings from linked accounts are added automatically.</p>
            </div>
          </div>
          <div class="watch__add">
            <TickerSearch :selected="symbols" placeholder="Add a stock or ETF to watch" @select="watchSymbol" />
          </div>
          <ul v-if="monitoring.holdings.length">
            <li v-for="h in monitoring.holdings" :key="h.symbol" class="watch__row">
              <RouterLink
                :to="h.analysisLink ? `/app/scan/${h.analysisLink.scanId}/${h.symbol}` : '/app/scan/new'"
                class="watch__id"
              >
                <SecurityLogo :symbol="h.symbol" :name="h.name" :color="h.color" :type="h.type" :size="40" />
                <span class="watch__text">
                  <span class="watch__symbol">
                    {{ h.symbol }} <span v-if="h.type === 'etf'" class="badge badge-etf">ETF</span>
                  </span>
                  <span class="watch__name">{{ h.name }}</span>
                </span>
              </RouterLink>
              <span class="watch__last hide-sm">
                <template v-if="h.lastAlertAt">
                  <component :is="KIND_ICONS[h.lastAlertKind]" :size="14" /> Last alert {{ timeAgo(h.lastAlertAt) }}
                </template>
                <template v-else>No alerts yet</template>
              </span>
              <DeltaChip :value="h.trend" subtle class="hide-sm" />
              <ScoreChip :score="h.score" short show-score size="sm" />
              <button type="button" class="watch__remove" :aria-label="`Stop watching ${h.symbol}`" @click="unwatch(h.symbol)">
                <X :size="16" />
              </button>
            </li>
          </ul>
          <EmptyState v-else :icon="Radar" title="Nothing on your watchlist yet" text="Add a stock or ETF above, or link a brokerage to watch everything you own." />
        </section>

        <aside class="side">
          <section class="card card-pad settings">
            <p class="card-title">Alert settings</p>
            <p class="card-sub">Emails go to {{ monitoring.settings.email }}</p>

            <fieldset class="settings__group">
              <legend class="label">How often</legend>
              <label v-for="opt in FREQUENCIES" :key="opt.value" class="option" :class="{ 'is-on': settings.frequency === opt.value }">
                <input v-model="settings.frequency" type="radio" name="frequency" :value="opt.value" />
                <span class="option__text">
                  <span class="option__label">{{ opt.label }}</span>
                  <span class="option__hint">{{ opt.hint }}</span>
                </span>
              </label>
            </fieldset>

            <fieldset class="settings__group">
              <legend class="label">What's worth an alert</legend>
              <label v-for="opt in SENSITIVITIES" :key="opt.value" class="option" :class="{ 'is-on': settings.sensitivity === opt.value }">
                <input v-model="settings.sensitivity" type="radio" name="sensitivity" :value="opt.value" />
                <span class="option__text">
                  <span class="option__label">{{ opt.label }}</span>
                  <span class="option__hint">{{ opt.hint }}</span>
                </span>
              </label>
            </fieldset>

            <fieldset class="settings__group">
              <legend class="label">Values to watch</legend>
              <div class="settings__chips">
                <button
                  v-for="cat in CATEGORIES"
                  :key="cat.key"
                  type="button"
                  class="chip"
                  :class="{ 'is-active': settings.categories.includes(cat.key) }"
                  :aria-pressed="settings.categories.includes(cat.key)"
                  @click="toggleCategory(cat.key)"
                >
                  <component :is="cat.icon" :size="14" /> {{ cat.short }}
                </button>
              </div>
            </fieldset>

            <UiToggle
              v-model="settings.includeRebalances"
              label="ETF rebalance heads-ups"
              description="A forecast before your funds reshuffle."
            />

            <button type="button" class="btn btn-primary btn-block" :disabled="!dirty || saving" @click="save">
              <span v-if="saving" class="spinner" />
              {{ dirty ? 'Save settings' : 'Settings saved' }}
            </button>
          </section>

          <section v-if="recent.length" class="card card-pad recent">
            <div class="row-between">
              <p class="card-title">Recent alerts</p>
              <RouterLink to="/app/alerts" class="link text-sm">All alerts</RouterLink>
            </div>
            <ul>
              <li v-for="a in recent" :key="a.id">
                <RouterLink :to="`/app/alerts/${a.id}`" class="recent__row">
                  <SecurityLogo :symbol="a.symbol" :name="a.security.name" :color="a.security.color" :type="a.security.type" :size="30" />
                  <span class="recent__title">{{ a.title }}</span>
                  <DeltaChip :value="a.scoreAfter - a.scoreBefore" />
                </RouterLink>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </template>
  </div>
</template>

<style scoped>
.title-row {
  display: flex;
  align-items: center;
  gap: 14px;
}
.live {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 30px;
  padding: 0 12px;
  border-radius: var(--radius-pill);
  background: var(--brand-50);
  color: var(--brand-700);
  font-size: 13px;
  font-weight: 750;
}
.live__dot {
  position: relative;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--brand-500);
}
.live__dot::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid var(--brand-400);
  animation: ripple 2s ease-out infinite;
}
@keyframes ripple {
  from {
    opacity: 0.8;
    transform: scale(0.6);
  }
  to {
    opacity: 0;
    transform: scale(1.7);
  }
}
.head-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.spinning {
  animation: spin 0.9s linear infinite;
}
.stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}
.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 18px;
}
.stat__icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  margin-bottom: 10px;
  border-radius: 12px;
  background: var(--brand-50);
  color: var(--brand-600);
}
.stat__icon--lilac {
  background: var(--lilac-100);
  color: var(--lilac-700);
}
.stat__icon--coral {
  background: var(--coral-50);
  color: var(--coral-500);
}
.stat__icon--sun {
  background: var(--sun-100);
  color: var(--sun-700);
}
.stat__value {
  font-size: 28px;
  font-weight: 780;
  letter-spacing: -0.03em;
  line-height: 1.1;
}
.stat__value--sm {
  font-size: 20px;
  line-height: 1.4;
}
.stat__label {
  font-size: 13px;
  color: var(--muted);
}
.grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 18px;
  align-items: start;
}
.watch__head {
  padding: 22px 22px 0;
}
.watch__add {
  padding: 16px 22px;
}
.watch__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 176px 48px 132px 32px;
  align-items: center;
  gap: 14px;
  padding: 12px 22px;
  border-top: 1px solid var(--line);
}
.watch__row > :nth-child(3),
.watch__row > :nth-child(4) {
  justify-self: end;
}
.watch__id {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.watch__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.watch__symbol {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 750;
}
.watch__name {
  font-size: 13px;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.watch__id:hover .watch__symbol {
  color: var(--brand-600);
}
.watch__last {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--muted);
  white-space: nowrap;
}
.watch__remove {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: var(--subtle);
}
.watch__remove:hover {
  background: var(--bg-tint);
  color: var(--ink);
}
.side {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.settings {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.settings .card-sub {
  margin-top: -14px;
}
.settings__group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  border: 0;
}
.settings__group legend {
  margin-bottom: 8px;
}
.option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 14px;
  cursor: pointer;
  transition:
    border-color 0.2s,
    background-color 0.2s;
}
.option.is-on {
  border-color: var(--brand-300);
  background: var(--brand-25);
}
.option__text {
  display: flex;
  flex-direction: column;
}
.option__label {
  font-size: 14.5px;
  font-weight: 650;
}
.option__hint {
  font-size: 12.5px;
  color: var(--muted);
}
.settings__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.recent ul {
  margin-top: 10px;
}
.recent__row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-top: 1px solid var(--line);
}
.recent__title {
  flex: 1;
  min-width: 0;
  font-size: 13.5px;
  font-weight: 650;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Locked */
.locked {
  position: relative;
  min-height: 640px;
}
.locked__preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
  filter: blur(4px);
  opacity: 0.55;
  pointer-events: none;
}
.locked__stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 8px;
}
.locked__stat {
  height: 110px;
  border-radius: 22px;
  background: var(--surface);
  border: 1px solid var(--line);
}
.locked__row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: 18px;
  background: var(--surface);
  border: 1px solid var(--line);
}
.locked__logo {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--brand-100);
}
.locked__line {
  flex: 1;
  height: 12px;
  border-radius: 6px;
  background: var(--bg-tint);
}
.locked__pill {
  width: 80px;
  height: 24px;
  border-radius: 12px;
  background: var(--score-mixed-bg);
}
.locked__card {
  position: absolute;
  top: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: min(520px, calc(100% - 24px));
  padding: 34px;
  border-radius: 30px;
  box-shadow: var(--shadow-lg);
  text-align: center;
}
.locked__icon {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 22px;
  background: linear-gradient(140deg, var(--brand-100), var(--lilac-100));
  color: var(--brand-700);
}
.locked__title {
  font-size: 32px;
}
.locked__text {
  color: var(--ink-2);
}
.locked__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  margin: 6px 0 10px;
  padding: 16px 18px;
  border-radius: 18px;
  background: var(--surface-muted);
  text-align: left;
  font-size: 14.5px;
  font-weight: 600;
}
.locked__list li {
  display: flex;
  align-items: center;
  gap: 10px;
}
.locked__list svg {
  flex-shrink: 0;
  color: var(--brand-500);
}

@media (max-width: 1100px) {
  .grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (max-width: 820px) {
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 640px) {
  .watch__row {
    grid-template-columns: minmax(0, 1fr) auto 32px;
    padding: 12px 16px;
    gap: 10px;
  }
  .watch__head,
  .watch__add {
    padding-left: 16px;
    padding-right: 16px;
  }
  .locked__card {
    padding: 24px;
  }
}
</style>
