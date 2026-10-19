<script setup>
import { monitoringService, scansService } from '@/api'
import DeltaChip from '@/components/ui/DeltaChip.vue'
import PlanBadge from '@/components/ui/PlanBadge.vue'
import ScoreChip from '@/components/ui/ScoreChip.vue'
import ScoreRing from '@/components/ui/ScoreRing.vue'
import SecurityLogo from '@/components/ui/SecurityLogo.vue'
import { useAsync } from '@/composables/useAsync'
import { useAlertsStore } from '@/stores/alerts'
import { useSessionStore } from '@/stores/session'
import { formatDate, timeAgo } from '@/utils/format'
import { BAND_ORDER, BANDS, CATEGORY_MAP } from '@/utils/scoring'
import {
    ArrowRight,
    BellRing,
    ChevronRight,
    GraduationCap,
    History,
    Link2,
    ListPlus,
    Plus,
    Radar,
    Sparkles,
} from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'

const session = useSessionStore()
const alerts = useAlertsStore()

const { data: scans, loading } = useAsync(() => scansService.list())
const { data: monitoring } = useAsync(() => (session.isPro ? monitoringService.get() : Promise.resolve(null)))
const latestScan = ref(null)

const latest = computed(() => scans.value?.find((s) => s.status === 'complete') ?? null)
watch(latest, async (scan) => {
  latestScan.value = scan ? await scansService.get(scan.id) : null
})

onMounted(() => alerts.ensureLoaded().catch(() => {}))

const greeting = (() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
})()
const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

const usage = computed(() => session.user?.usage)
const usagePct = computed(() =>
  usage.value?.scansLimit ? Math.min(100, (usage.value.scansUsed / usage.value.scansLimit) * 100) : 0,
)
const recentAlerts = computed(() => alerts.items.slice(0, 3))

const learn = [
  {
    q: 'What is an ETF?',
    a: 'A single investment that holds a basket of companies, sometimes hundreds. Easy to buy, but you own a slice of everything inside, good and not-so-good.',
  },
  {
    q: 'What does “rebalance” mean?',
    a: 'Funds periodically adjust which companies they hold and how much. That can change what you own without you doing anything.',
  },
  {
    q: 'Do values-aligned picks earn less?',
    a: 'Not necessarily. Research is mixed and it depends on the company. outvest focuses on values, so pair it with your own research on price and risk.',
  },
]
</script>

<template>
  <div class="page dashboard">
    <header class="page-head">
      <div>
        <p class="eyebrow">{{ today }}</p>
        <h1 class="page-title">{{ greeting }}, {{ session.firstName }}</h1>
        <p class="page-sub">Here's how your investments line up with what you care about.</p>
      </div>
      <RouterLink to="/app/scan/new" class="btn btn-primary"><Plus :size="18" /> New scan</RouterLink>
    </header>

    <div v-if="loading" class="dash-grid">
      <div class="skeleton dash-span-2" style="height: 380px" />
      <div class="skeleton" style="height: 380px" />
    </div>

    <!-- First-time state -->
    <section v-else-if="!scans?.length" class="welcome card">
      <div class="welcome__copy">
        <span class="eyebrow"><Sparkles :size="15" /> Let's start</span>
        <h2 class="h-2">Run your first scan</h2>
        <p class="welcome__text">
          Link your brokerage or type a few tickers you own or are curious about. We'll do the research and explain
          what we find, calmly and in plain English.
        </p>
        <div class="welcome__options">
          <RouterLink :to="{ path: '/app/scan/new', query: { mode: 'link' } }" class="welcome__option">
            <span class="welcome__option-icon"><Link2 :size="20" /></span>
            <span>
              <strong>Link a portfolio</strong>
              <span>Read-only and takes about a minute</span>
            </span>
            <ChevronRight :size="18" />
          </RouterLink>
          <RouterLink :to="{ path: '/app/scan/new', query: { mode: 'manual' } }" class="welcome__option">
            <span class="welcome__option-icon welcome__option-icon--lilac"><ListPlus :size="20" /></span>
            <span>
              <strong>Build a list</strong>
              <span>Type a few stocks or ETFs</span>
            </span>
            <ChevronRight :size="18" />
          </RouterLink>
        </div>
      </div>
      <div class="welcome__art" aria-hidden="true">
        <ScoreRing :score="78" :size="150" caption="example" />
      </div>
    </section>

    <div v-else class="dash-grid">
      <!-- Latest scan snapshot -->
      <section v-if="latest" class="card card-pad dash-span-2 snapshot">
        <div class="card-head">
          <div>
            <p class="card-title">Your latest scan</p>
            <p class="card-sub">
              {{ formatDate(latest.createdAt) }} ·
              {{ latest.source === 'linked' ? `Linked from ${latest.brokerageName}` : 'Your list' }} ·
              {{ latest.holdingsCount }} holdings
            </p>
          </div>
          <RouterLink :to="`/app/scan/${latest.id}`" class="btn btn-secondary btn-sm">View results <ArrowRight :size="15" /></RouterLink>
        </div>

        <template v-if="latestScan?.summary">
          <div class="snapshot__body">
            <ScoreRing :score="latestScan.summary.score" :size="112" caption="overall" />
            <div class="snapshot__text">
              <p class="snapshot__headline">{{ latestScan.summary.headline }}</p>
              <p class="muted">
                Strongest on <strong>{{ CATEGORY_MAP[latestScan.summary.strongest].label }}</strong>, weakest on
                <strong>{{ CATEGORY_MAP[latestScan.summary.weakest].label }}</strong>.
              </p>
              <div class="snapshot__counts">
                <template v-for="key in BAND_ORDER" :key="key">
                  <span v-if="latestScan.summary.counts[key]" class="snapshot__count" :style="{ color: BANDS[key].color, background: BANDS[key].bg }">
                    {{ latestScan.summary.counts[key] }} {{ BANDS[key].group }}
                  </span>
                </template>
              </div>
            </div>
          </div>
          <ul class="snapshot__list">
            <li v-for="item in latestScan.results" :key="item.symbol">
              <RouterLink :to="`/app/scan/${latest.id}/${item.symbol}`" class="snapshot__row">
                <SecurityLogo :symbol="item.symbol" :name="item.name" :color="item.color" :type="item.type" :size="34" />
                <span class="snapshot__id">
                  <strong>{{ item.symbol }}</strong>
                  <span>{{ item.name }}</span>
                </span>
                <ScoreChip :score="item.score" short show-score size="sm" />
              </RouterLink>
            </li>
          </ul>
        </template>
        <div v-else class="skeleton" style="height: 260px" />
      </section>

      <!-- Side column -->
      <div class="dash-side">
        <section v-if="session.isPro" class="card card-pad monitor">
          <div class="monitor__head">
            <span class="monitor__icon"><Radar :size="20" /></span>
            <span class="monitor__status"><span class="pulse" /> Monitoring on</span>
          </div>
          <p class="monitor__title">
            Watching {{ monitoring?.stats.watching ?? '…' }} holdings
            <span class="muted">· {{ monitoring?.stats.companiesCovered ?? '…' }} companies</span>
          </p>
          <p class="muted text-sm">Last check {{ monitoring ? timeAgo(monitoring.lastCheckedAt) : '…' }}</p>
          <div class="monitor__actions">
            <RouterLink v-if="alerts.unreadCount" to="/app/alerts" class="btn btn-soft btn-sm">
              <BellRing :size="15" /> {{ alerts.unreadCount }} new {{ alerts.unreadCount === 1 ? 'alert' : 'alerts' }}
            </RouterLink>
            <RouterLink to="/app/monitoring" class="btn btn-ghost btn-sm">Manage</RouterLink>
          </div>
        </section>
        <section v-else class="card card-pad monitor monitor--upsell">
          <span class="monitor__icon"><BellRing :size="20" /></span>
          <p class="monitor__title">Want a heads-up when things change?</p>
          <p class="muted text-sm">Pro watches your holdings and emails you a calm summary when something's worth a look.</p>
          <RouterLink to="/app/plan" class="btn btn-primary btn-sm">Try Pro <ArrowRight :size="15" /></RouterLink>
        </section>

        <section class="card card-pad usage">
          <div class="row-between">
            <p class="card-title">Your plan</p>
            <PlanBadge :plan-id="session.planId" />
          </div>
          <template v-if="usage?.scansLimit">
            <p class="usage__count num">{{ usage.scansUsed }} / {{ usage.scansLimit }} <span>scans used this month</span></p>
            <div class="usage__track"><span :style="{ width: `${usagePct}%` }" /></div>
            <p class="muted text-sm">Resets {{ formatDate(usage.resetsAt) }} · up to {{ usage.symbolsPerScan }} holdings per scan</p>
            <RouterLink to="/app/plan" class="link text-sm">Get unlimited scans →</RouterLink>
          </template>
          <template v-else>
            <p class="usage__count">Unlimited <span>scans · {{ usage?.scansUsed ?? 0 }} this month</span></p>
            <RouterLink to="/app/plan" class="link text-sm">Manage plan →</RouterLink>
          </template>
        </section>
      </div>

      <!-- Alerts -->
      <section v-if="recentAlerts.length" class="card card-pad dash-span-2">
        <div class="card-head">
          <p class="card-title">Recent alerts</p>
          <RouterLink to="/app/alerts" class="link text-sm">See all</RouterLink>
        </div>
        <ul class="alerts-mini">
          <li v-for="alert in recentAlerts" :key="alert.id">
            <RouterLink :to="`/app/alerts/${alert.id}`" class="alerts-mini__row" :class="{ 'is-unread': !alert.readAt }">
              <SecurityLogo :symbol="alert.symbol" :name="alert.security.name" :color="alert.security.color" :type="alert.security.type" :size="38" />
              <span class="alerts-mini__text">
                <strong>{{ alert.title }}</strong>
                <span>{{ alert.symbol }} · {{ timeAgo(alert.createdAt) }}</span>
              </span>
              <DeltaChip :value="alert.scoreAfter - alert.scoreBefore" />
            </RouterLink>
          </li>
        </ul>
      </section>

      <!-- Learn -->
      <section class="card card-pad learn" :class="{ 'dash-span-2': !recentAlerts.length }">
        <p class="card-title learn__title"><GraduationCap :size="18" /> New to this? Start here</p>
        <details v-for="item in learn" :key="item.q" class="learn__item">
          <summary>{{ item.q }}</summary>
          <p>{{ item.a }}</p>
        </details>
      </section>

      <!-- History -->
      <section class="card dash-span-3 history">
        <div class="card-head history__head">
          <p class="card-title"><History :size="17" /> Scan history</p>
        </div>
        <ul>
          <li v-for="scan in scans" :key="scan.id">
            <RouterLink :to="scan.status === 'complete' ? `/app/scan/${scan.id}` : `/app/scan/${scan.id}/progress`" class="history__row">
              <span class="history__date">
                <strong>{{ formatDate(scan.createdAt) }}</strong>
                <span>{{ timeAgo(scan.createdAt) }}</span>
              </span>
              <span class="history__source">
                <span class="badge" :class="scan.source === 'linked' ? 'badge-brand' : 'badge-sky'">
                  {{ scan.source === 'linked' ? scan.brokerageName : 'Your list' }}
                </span>
              </span>
              <span class="history__symbols">
                {{ scan.symbols.slice(0, 4).join(', ') }}<template v-if="scan.symbols.length > 4"> +{{ scan.symbols.length - 4 }}</template>
              </span>
              <span class="history__score">
                <ScoreChip v-if="scan.score !== null" :score="scan.score" short show-score size="sm" />
                <span v-else class="badge badge-sky">Scanning…</span>
              </span>
              <ChevronRight :size="18" class="history__chevron" />
            </RouterLink>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped>
.dash-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}
.dash-span-2 {
  grid-column: span 2;
}
.dash-span-3 {
  grid-column: 1 / -1;
}
.dash-side {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.welcome {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  align-items: center;
  gap: 24px;
  padding: 36px;
  background:
    radial-gradient(circle at 85% 30%, rgba(128, 197, 157, 0.25), transparent 50%),
    var(--surface);
}
.welcome .h-2 {
  margin-top: 10px;
}
.welcome__text {
  margin-top: 10px;
  max-width: 520px;
  color: var(--ink-2);
}
.welcome__options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 24px;
}
.welcome__option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--surface);
  transition:
    border-color 0.2s,
    box-shadow 0.2s,
    transform 0.2s var(--ease);
}
.welcome__option:hover {
  border-color: var(--brand-300);
  box-shadow: var(--shadow-sm);
  transform: translateY(-2px);
}
.welcome__option > span:nth-child(2) {
  display: flex;
  flex-direction: column;
  flex: 1;
  font-size: 13px;
  color: var(--muted);
}
.welcome__option strong {
  font-size: 15px;
  color: var(--ink);
}
.welcome__option-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: 14px;
  background: var(--brand-50);
  color: var(--brand-600);
}
.welcome__option-icon--lilac {
  background: var(--lilac-100);
  color: var(--lilac-700);
}
.welcome__art {
  display: grid;
  place-items: center;
}

.snapshot__body {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 20px;
  border-radius: 20px;
  background: var(--surface-muted);
}
.snapshot__headline {
  font-family: var(--font-display);
  font-variation-settings: 'SOFT' 100;
  font-size: 24px;
  font-weight: 560;
  line-height: 1.2;
  margin-bottom: 6px;
}
.snapshot__counts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}
.snapshot__count {
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  font-size: 12.5px;
  font-weight: 700;
}
.snapshot__list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px 18px;
  margin-top: 16px;
}
.snapshot__row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 8px;
  border-radius: 14px;
  transition: background-color 0.2s;
}
.snapshot__row:hover {
  background: var(--surface-muted);
}
.snapshot__id {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  line-height: 1.3;
}
.snapshot__id span {
  font-size: 12.5px;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.monitor {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.monitor__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.monitor__icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: var(--brand-50);
  color: var(--brand-600);
}
.monitor--upsell .monitor__icon {
  margin-bottom: 8px;
  background: var(--coral-50);
  color: var(--coral-500);
}
.monitor__status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: var(--brand-700);
}
.pulse {
  position: relative;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--brand-500);
}
.pulse::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid var(--brand-400);
  animation: pulse 2s ease-out infinite;
}
@keyframes pulse {
  from {
    opacity: 0.8;
    transform: scale(0.6);
  }
  to {
    opacity: 0;
    transform: scale(1.6);
  }
}
.monitor__title {
  font-weight: 700;
  font-size: 16px;
}
.monitor__actions {
  display: flex;
  gap: 6px;
  margin-top: 10px;
}
.monitor--upsell .btn {
  align-self: flex-start;
  margin-top: 10px;
}

.usage {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.usage__count {
  font-size: 24px;
  font-weight: 760;
  letter-spacing: -0.02em;
}
.usage__count span {
  font-size: 14px;
  font-weight: 600;
  color: var(--muted);
  letter-spacing: 0;
}
.usage__track {
  height: 8px;
  border-radius: var(--radius-pill);
  background: var(--bg-tint);
  overflow: hidden;
}
.usage__track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--brand-400), var(--brand-600));
}

.alerts-mini__row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 10px;
  border-radius: 14px;
  transition: background-color 0.2s;
}
.alerts-mini__row:hover {
  background: var(--surface-muted);
}
.alerts-mini__row.is-unread strong::after {
  content: '';
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-left: 8px;
  border-radius: 50%;
  background: var(--coral-500);
  vertical-align: middle;
}
.alerts-mini__text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.alerts-mini__text strong {
  font-size: 14.5px;
  line-height: 1.35;
}
.alerts-mini__text span {
  font-size: 12.5px;
  color: var(--muted);
}

.learn__title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.learn__item {
  border-top: 1px solid var(--line);
}
.learn__item summary {
  padding: 13px 0;
  font-weight: 650;
  font-size: 14.5px;
  cursor: pointer;
  list-style: none;
  display: flex;
  justify-content: space-between;
}
.learn__item summary::after {
  content: '+';
  color: var(--muted);
  font-weight: 500;
  font-size: 18px;
  line-height: 1;
}
.learn__item[open] summary::after {
  content: '–';
}
.learn__item summary::-webkit-details-marker {
  display: none;
}
.learn__item p {
  padding-bottom: 14px;
  font-size: 14px;
  color: var(--ink-2);
}

.history__head {
  padding: 22px 24px 0;
  margin-bottom: 8px;
}
.history__head .card-title {
  display: flex;
  align-items: center;
  gap: 8px;
}
.history__row {
  display: grid;
  grid-template-columns: 140px 150px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 16px;
  padding: 14px 24px;
  border-top: 1px solid var(--line);
  transition: background-color 0.2s;
}
.history__row:hover {
  background: var(--surface-muted);
}
.history li:last-child .history__row {
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
}
.history__date {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}
.history__date span {
  font-size: 12.5px;
  color: var(--muted);
}
.history__symbols {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.history__chevron {
  color: var(--subtle);
}

@media (max-width: 1100px) {
  .dash-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .dash-span-2,
  .dash-span-3 {
    grid-column: 1 / -1;
  }
  .dash-side {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 720px) {
  .dash-grid,
  .dash-side {
    grid-template-columns: minmax(0, 1fr);
  }
  .welcome {
    grid-template-columns: minmax(0, 1fr);
    padding: 24px;
  }
  .welcome__art {
    display: none;
  }
  .welcome__options {
    grid-template-columns: minmax(0, 1fr);
  }
  .snapshot__body {
    flex-direction: column;
    align-items: flex-start;
  }
  .snapshot__list {
    grid-template-columns: minmax(0, 1fr);
  }
  .history__row {
    grid-template-columns: minmax(0, 1fr) auto auto;
    padding: 14px 18px;
  }
  .history__source,
  .history__symbols {
    display: none;
  }
}
</style>
