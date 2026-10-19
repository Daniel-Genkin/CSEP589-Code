<script setup>
import EmptyState from '@/components/ui/EmptyState.vue'
import SecurityLogo from '@/components/ui/SecurityLogo.vue'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import { useAlertsStore } from '@/stores/alerts'
import { useSessionStore } from '@/stores/session'
import { timeAgo } from '@/utils/format'
import { BANDS } from '@/utils/scoring'
import { ArrowRight, BellOff, CalendarClock, CheckCheck, ChevronRight, Radar, ThumbsUp, TriangleAlert } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'

const alerts = useAlertsStore()
const session = useSessionStore()
const filter = ref('all')

onMounted(() => alerts.fetch().catch(() => {}))

const KINDS = {
  negative: { label: 'Heads up', icon: TriangleAlert },
  positive: { label: 'Good news', icon: ThumbsUp },
  forecast: { label: 'Forecast', icon: CalendarClock },
}

const options = computed(() => [
  { value: 'all', label: 'All', count: alerts.items.length },
  { value: 'unread', label: 'Unread', count: alerts.unreadCount },
  { value: 'negative', label: 'Heads up' },
  { value: 'positive', label: 'Good news' },
  { value: 'forecast', label: 'Forecasts' },
])

const visible = computed(() => {
  if (filter.value === 'all') return alerts.items
  if (filter.value === 'unread') return alerts.items.filter((a) => !a.readAt)
  return alerts.items.filter((a) => a.kind === filter.value)
})
</script>

<template>
  <div class="page">
    <header class="page-head">
      <div>
        <h1 class="page-title">Alerts</h1>
        <p class="page-sub">Everything worth knowing about your holdings, in one calm place.</p>
      </div>
      <button v-if="alerts.unreadCount" type="button" class="btn btn-secondary" @click="alerts.markAllRead()">
        <CheckCheck :size="17" /> Mark all as read
      </button>
    </header>

    <div v-if="!alerts.loaded" class="stack gap-3">
      <div v-for="n in 4" :key="n" class="skeleton" style="height: 112px" />
    </div>

    <template v-else-if="alerts.items.length">
      <SegmentedControl v-model="filter" :options="options" label="Filter alerts" class="filters" />

      <TransitionGroup v-if="visible.length" tag="ul" name="fade" class="list">
        <li v-for="alert in visible" :key="alert.id">
          <RouterLink :to="`/app/alerts/${alert.id}`" class="alert card" :class="[`alert--${alert.kind}`, { 'is-unread': !alert.readAt }]">
            <span class="alert__kind"><component :is="KINDS[alert.kind].icon" :size="18" /></span>
            <span class="alert__body">
              <span class="alert__meta">
                <span class="alert__label">{{ KINDS[alert.kind].label }}</span>
                <span aria-hidden="true">·</span>
                <span>{{ timeAgo(alert.createdAt) }}</span>
                <span v-if="!alert.readAt" class="alert__new">New</span>
              </span>
              <span class="alert__title">{{ alert.title }}</span>
              <span class="alert__summary">{{ alert.summary }}</span>
              <span class="alert__security">
                <SecurityLogo :symbol="alert.symbol" :name="alert.security.name" :color="alert.security.color" :type="alert.security.type" :size="24" />
                {{ alert.security.name }}
              </span>
            </span>
            <span class="alert__scores">
              <span class="alert__score num" :style="{ color: BANDS[alert.bandBefore].color }">{{ alert.scoreBefore }}</span>
              <ArrowRight :size="14" class="muted" />
              <span class="alert__score num" :style="{ color: BANDS[alert.bandAfter].color }">{{ alert.scoreAfter }}</span>
            </span>
            <ChevronRight :size="18" class="alert__chevron hide-sm" />
          </RouterLink>
        </li>
      </TransitionGroup>
      <div v-else class="card">
        <EmptyState :icon="CheckCheck" title="Nothing here" text="No alerts match this filter right now." />
      </div>
    </template>

    <div v-else class="card">
      <EmptyState
        v-if="session.isPro"
        :icon="BellOff"
        title="You're all caught up"
        text="We haven't spotted anything worth your attention yet. When something changes, it will show up here and in your inbox."
      >
        <RouterLink to="/app/monitoring" class="btn btn-secondary">Manage monitoring</RouterLink>
      </EmptyState>
      <EmptyState
        v-else
        :icon="Radar"
        title="Alerts come with Pro"
        text="Pro keeps watch over your holdings and lets you know, calmly, when something changes how they line up with your values."
      >
        <RouterLink :to="{ path: '/app/plan', query: { upgrade: 'pro' } }" class="btn btn-primary">Upgrade to Pro</RouterLink>
      </EmptyState>
    </div>
  </div>
</template>

<style scoped>
.filters {
  margin-bottom: 18px;
}
.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.alert {
  position: relative;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 20px 22px;
  transition:
    box-shadow 0.25s var(--ease),
    border-color 0.25s var(--ease),
    transform 0.25s var(--ease);
}
.alert:hover {
  border-color: var(--line-strong);
  box-shadow: var(--shadow);
  transform: translateY(-1px);
}
.alert.is-unread {
  border-color: var(--brand-200);
}
.alert__kind {
  display: grid;
  place-items: center;
  align-self: flex-start;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: 14px;
}
.alert--negative .alert__kind {
  background: var(--score-low-bg);
  color: var(--score-low);
}
.alert--positive .alert__kind {
  background: var(--score-great-bg);
  color: var(--score-great);
}
.alert--forecast .alert__kind {
  background: var(--sky-100);
  color: var(--sky-700);
}
.alert__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}
.alert__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--muted);
}
.alert__label {
  font-weight: 750;
}
.alert--negative .alert__label {
  color: var(--score-low);
}
.alert--positive .alert__label {
  color: var(--score-great);
}
.alert--forecast .alert__label {
  color: var(--sky-700);
}
.alert__new {
  padding: 1px 7px;
  border-radius: var(--radius-pill);
  background: var(--coral-500);
  color: #fff;
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.alert__title {
  font-size: 16.5px;
  font-weight: 720;
  line-height: 1.35;
}
.alert__summary {
  font-size: 14px;
  color: var(--ink-2);
}
.alert__security {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  font-size: 13px;
  font-weight: 650;
  color: var(--muted);
}
.alert__scores {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 14px;
  background: var(--surface-muted);
}
.alert__score {
  font-size: 18px;
  font-weight: 780;
}
.alert__chevron {
  color: var(--subtle);
}
@media (max-width: 640px) {
  .alert {
    flex-wrap: wrap;
    padding: 16px;
    gap: 12px;
  }
  .alert__scores {
    margin-left: 54px;
  }
}
</style>
