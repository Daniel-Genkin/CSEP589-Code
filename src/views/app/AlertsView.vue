<script setup>
import { isMockApi } from '@/api'
import EmptyState from '@/components/ui/EmptyState.vue'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import { useToast } from '@/composables/useToast'
import { useAlertsStore } from '@/stores/alerts'
import { timeAgo } from '@/utils/format'
import { ALERT_KINDS } from '@/utils/thesis'
import { BellOff, CheckCheck, ChevronRight, Newspaper } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'

const alerts = useAlertsStore()
const toast = useToast()
const filter = ref('all')
const checking = ref(false)

onMounted(() => alerts.fetch().catch(() => {}))

const options = computed(() => [
  { value: 'all', label: 'All', count: alerts.items.length },
  { value: 'unread', label: 'Unread', count: alerts.unreadCount },
])
const shown = computed(() => (filter.value === 'unread' ? alerts.items.filter((a) => !a.readAt) : alerts.items))

async function checkNow() {
  checking.value = true
  try {
    const { alert, reason } = await alerts.check()
    if (alert) toast.success('New alert', { description: alert.title, action: { label: 'Open', to: `/app/alerts/${alert.id}` } })
    else if (reason === 'no-theses') toast.info('Nothing to check yet', { description: 'Publish or invest in a thesis and we’ll watch the news for it.' })
    else toast.info('You’re caught up', { description: 'No new stories affect your theses right now.' })
  } catch (err) {
    toast.error('Couldn’t check for news', { description: err.message })
  } finally {
    checking.value = false
  }
}
</script>

<template>
  <div class="page alerts-page">
    <header class="page-head">
      <div>
        <h1 class="page-title">Alerts</h1>
        <p class="page-sub">Only when news affects one of your theses, plus a heads-up before each rebalance. No market noise.</p>
      </div>
      <div class="head-actions">
        <button v-if="alerts.unreadCount" type="button" class="btn btn-ghost btn-sm" @click="alerts.markAllRead()">
          <CheckCheck :size="16" /> Mark all read
        </button>
        <button v-if="isMockApi" type="button" class="btn btn-secondary btn-sm" :disabled="checking" @click="checkNow">
          <span v-if="checking" class="spinner" />
          <Newspaper v-else :size="16" />
          Check for news
        </button>
      </div>
    </header>

    <SegmentedControl v-model="filter" :options="options" label="Filter alerts" class="filter" />

    <div v-if="alerts.loading && !alerts.loaded" class="list">
      <div v-for="n in 3" :key="n" class="skeleton" style="height: 96px" />
    </div>

    <ul v-else-if="shown.length" class="list">
      <li v-for="alert in shown" :key="alert.id">
        <RouterLink :to="`/app/alerts/${alert.id}`" class="row card" :class="{ 'is-unread': !alert.readAt }">
          <span class="row__icon" :class="`row__icon--${ALERT_KINDS[alert.kind].tone}`">
            <component :is="ALERT_KINDS[alert.kind].icon" :size="19" />
          </span>
          <span class="row__body">
            <span class="row__meta">
              {{ ALERT_KINDS[alert.kind].label }} · {{ timeAgo(alert.createdAt) }}
              <span v-if="!alert.readAt" class="row__new">New</span>
            </span>
            <span class="row__title">{{ alert.title }}</span>
            <span class="row__summary">{{ alert.summary }}</span>
            <span v-if="alert.thesis" class="topic-chip row__thesis">{{ alert.thesis.title }}</span>
          </span>
          <ChevronRight :size="18" class="row__chevron" />
        </RouterLink>
      </li>
    </ul>

    <div v-else class="card">
      <EmptyState
        :icon="BellOff"
        :title="filter === 'unread' ? 'No unread alerts' : 'No alerts yet'"
        text="We only alert you when news strengthens or weakens a claim in one of your theses, or before a rebalance."
      />
    </div>
  </div>
</template>

<style scoped>
.alerts-page {
  max-width: 880px;
}
.head-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.filter {
  margin-bottom: 18px;
}
.list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.row {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 18px;
  transition:
    transform 0.2s var(--ease),
    box-shadow 0.2s var(--ease);
}
.row:hover {
  transform: translate(-2px, -2px);
  box-shadow: 8px 8px 0 var(--ink-solid);
}
.row.is-unread {
  background: var(--sun-50);
}
.row__icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border: 1.5px solid var(--ink-solid);
  border-radius: 13px;
}
.row__icon--up {
  background: var(--score-great-bg);
  color: var(--score-great);
}
.row__icon--down {
  background: var(--score-low-bg);
  color: var(--score-low);
}
.row__icon--lilac {
  background: var(--lilac-100);
  color: var(--lilac-700);
}
.row__body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  gap: 3px;
}
.row__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  font-weight: 650;
  color: var(--muted);
}
.row__new {
  padding: 1px 8px;
  border: 1.5px solid var(--ink-solid);
  border-radius: var(--radius-pill);
  background: var(--flare);
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.row__title {
  font-weight: 700;
  line-height: 1.35;
}
.row__summary {
  font-size: 14px;
  color: var(--ink-2);
}
.row__thesis {
  align-self: flex-start;
  margin-top: 6px;
}
.row__chevron {
  flex-shrink: 0;
  margin-top: 10px;
  color: var(--subtle);
}
</style>
