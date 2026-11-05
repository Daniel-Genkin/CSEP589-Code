<script setup>
import { communityService, investService, thesesService } from '@/api'
import PromptBar from '@/components/thesis/PromptBar.vue'
import ThesisCard from '@/components/thesis/ThesisCard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useAsync } from '@/composables/useAsync'
import { useAlertsStore } from '@/stores/alerts'
import { useSessionStore } from '@/stores/session'
import { formatMoney, timeAgo } from '@/utils/format'
import { ALERT_KINDS, EXAMPLE_IDEAS, formatReturn } from '@/utils/thesis'
import { ArrowRight, Lightbulb, Wallet } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const session = useSessionStore()
const alerts = useAlertsStore()

const { data: mine, loading } = useAsync(() => thesesService.list('mine'))
const { data: trending } = useAsync(() => communityService.list({ sort: 'trending', limit: 4 }))
const { data: portfolio } = useAsync(() => (session.hasAccount ? investService.portfolio() : Promise.resolve(null)))
const idea = ref('')

onMounted(() => alerts.ensureLoaded().catch(() => {}))

const greeting = (() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
})()
const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
const recentAlerts = computed(() => alerts.items.slice(0, 3))
const trendingOthers = computed(() => (trending.value ?? []).filter((t) => !t.isOwner).slice(0, 2))

function pitch(text) {
  router.push({ path: '/app/pitch', query: { idea: text } })
}
</script>

<template>
  <div class="page dashboard">
    <header class="page-head">
      <div>
        <p class="eyebrow">{{ today }}</p>
        <h1 class="page-title">{{ greeting }}, {{ session.firstName }}</h1>
        <p class="page-sub">What’s your next climate hot take?</p>
      </div>
    </header>

    <section class="card pitch-card">
      <PromptBar v-model="idea" :examples="EXAMPLE_IDEAS.slice(0, 3)" @submit="pitch" />
    </section>

    <div v-if="loading" class="dash-grid">
      <div class="skeleton" style="height: 380px" />
      <div class="skeleton" style="height: 380px" />
    </div>

    <div v-else class="dash-grid">
      <div class="dash-main">
        <section>
          <div class="block-head">
            <h2 class="section-title">Your theses</h2>
            <RouterLink v-if="mine?.length" to="/app/theses" class="link text-sm">See all</RouterLink>
          </div>
          <div v-if="mine?.length" class="cards">
            <ThesisCard v-for="t in mine.slice(0, 4)" :key="t.id" :thesis="t" :to="`/app/theses/${t.id}`" :show-author="false" />
          </div>
          <div v-else class="card">
            <EmptyState :icon="Lightbulb" title="No theses yet" text="Pitch an idea above and the copilot will turn it into a thesis you can test." />
          </div>
        </section>

        <section v-if="trendingOthers.length">
          <div class="block-head">
            <h2 class="section-title">Trending in the community</h2>
            <RouterLink to="/app/community" class="link text-sm">Browse</RouterLink>
          </div>
          <div class="cards">
            <ThesisCard v-for="t in trendingOthers" :key="t.id" :thesis="t" :to="`/app/theses/${t.id}`" />
          </div>
        </section>
      </div>

      <aside class="dash-side">
        <section class="card card-pad">
          <template v-if="portfolio">
            <div class="card-head">
              <p class="card-title">Portfolio</p>
              <RouterLink to="/app/portfolio" class="link text-sm">Open</RouterLink>
            </div>
            <p class="value num">{{ formatMoney(portfolio.summary.value) }}</p>
            <p class="text-sm" :class="portfolio.summary.gainPct >= 0 ? 'is-up' : 'is-down'">
              {{ formatReturn(portfolio.summary.gainPct) }}
              <span class="muted">vs {{ formatReturn(portfolio.summary.benchmarkGainPct) }} for the S&P 500</span>
            </p>
            <ul class="mini-list">
              <li v-for="p in portfolio.positions" :key="p.id">
                <RouterLink :to="`/app/theses/${p.thesis.id}`" class="grow mini-list__name">{{ p.thesis.title }}</RouterLink>
                <span class="num">{{ formatMoney(p.value) }}</span>
                <span class="num text-xs" :class="p.gainPct >= 0 ? 'is-up' : 'is-down'">{{ formatReturn(p.gainPct) }}</span>
              </li>
            </ul>
          </template>
          <template v-else>
            <span class="side-icon"><Wallet :size="18" /></span>
            <p class="card-title">Invest from $10</p>
            <p class="muted text-sm side-text">
              When a thesis feels solid, buy the whole basket in fractional shares. Opening a brokerage account takes about
              five minutes.
            </p>
            <RouterLink to="/app/portfolio" class="btn btn-secondary btn-sm">How investing works <ArrowRight :size="15" /></RouterLink>
          </template>
        </section>

        <section class="card card-pad">
          <div class="card-head">
            <p class="card-title">Latest alerts</p>
            <RouterLink to="/app/alerts" class="link text-sm">All</RouterLink>
          </div>
          <ul v-if="recentAlerts.length" class="alert-list">
            <li v-for="alert in recentAlerts" :key="alert.id">
              <RouterLink :to="`/app/alerts/${alert.id}`" class="alert-row" :class="{ 'is-unread': !alert.readAt }">
                <span class="alert-row__icon" :class="`alert-row__icon--${ALERT_KINDS[alert.kind].tone}`">
                  <component :is="ALERT_KINDS[alert.kind].icon" :size="16" />
                </span>
                <span class="grow">
                  <span class="alert-row__title">{{ alert.title }}</span>
                  <span class="muted text-xs">{{ alert.thesis?.title }} · {{ timeAgo(alert.createdAt) }}</span>
                </span>
              </RouterLink>
            </li>
          </ul>
          <p v-else class="muted text-sm">Nothing yet. You’ll only hear from us when news affects one of your theses.</p>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.pitch-card {
  padding: 20px;
  margin-bottom: 30px;
  border-radius: 26px;
}
.dash-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 24px;
  align-items: start;
}
.dash-main {
  display: flex;
  flex-direction: column;
  gap: 30px;
  min-width: 0;
}
.dash-side {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.block-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
}
.cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}
.value {
  font-family: var(--font-display);
  font-size: 44px;
  line-height: 1;
}
.is-up {
  color: var(--score-great);
}
.is-down {
  color: var(--score-low);
}
.mini-list {
  display: flex;
  flex-direction: column;
  margin-top: 12px;
}
.mini-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 0;
  border-top: 2px dashed var(--line);
  font-size: 14px;
  font-weight: 650;
}
.mini-list__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mini-list__name:hover {
  color: var(--signal-ink);
}
.side-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  margin-bottom: 12px;
  border: 1.5px solid var(--ink-solid);
  border-radius: 12px;
  background: var(--sun);
  color: var(--ink);
}
.side-text {
  margin: 4px 0 14px;
}
.alert-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.alert-row {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px;
  margin: 0 -8px;
  border-radius: 12px;
  transition: background-color 0.2s;
}
.alert-row:hover {
  background: var(--surface-muted);
}
.alert-row .grow {
  display: flex;
  flex-direction: column;
  line-height: 1.35;
}
.alert-row__title {
  font-size: 13.5px;
  font-weight: 650;
}
.alert-row.is-unread .alert-row__title::after {
  content: '';
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-left: 6px;
  border-radius: 50%;
  background: var(--flare);
  vertical-align: middle;
}
.alert-row__icon {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border: 1.5px solid var(--ink-solid);
  border-radius: 10px;
}
.alert-row__icon--up {
  background: var(--score-great-bg);
  color: var(--score-great);
}
.alert-row__icon--down {
  background: var(--score-low-bg);
  color: var(--score-low);
}
.alert-row__icon--lilac {
  background: var(--lilac-100);
  color: var(--lilac-700);
}
@media (max-width: 1180px) {
  .dash-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .dash-side {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 760px) {
  .cards,
  .dash-side {
    grid-template-columns: minmax(0, 1fr);
  }
  .pitch-card {
    padding: 14px;
  }
}
</style>
