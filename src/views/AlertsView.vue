<script setup lang="ts">
// F8 Live monitoring (Figma "Receipts"). A feed of seeded alerts about holdings: relative time,
// type, the holding, the category and one line of explanation. Filter by category, mark all
// read; the unread count shows in the nav. On the free plan the feed is a locked preview with
// an upgrade call to action.
//
// The feed is the same eight samples for everyone: it does not yet follow the user's holdings
// or selected categories (there is no specification for real monitoring). Each card says
// whether its holding is in the active portfolio.
import ReceiptPaper from '@/components/rally/ReceiptPaper.vue'
import { usePortfolioData } from '@/composables/usePortfolioData'
import { provider } from '@/data'
import { ALERT_TYPE_LABEL, useAlertsStore } from '@/state/alerts'
import { useCatalogStore } from '@/state/catalog'
import { useDemoStore } from '@/state/demo'
import type { Alert, CategoryId } from '@/types'
import { agoFromMinutes, plural } from '@/utils/format'
import { computed, nextTick, onMounted, ref, shallowRef, watch } from 'vue'
import ExposureReceipt from './portfolio/ExposureReceipt.vue'

/** How many alerts a free user sees through the lock. */
const PREVIEW = 2

const demo = useDemoStore()
const catalog = useCatalogStore()
const feed = useAlertsStore()
const data = usePortfolioData()

const filter = ref<CategoryId | null>(null)
const names = shallowRef(new Map<string, string>())
/** What just changed, for a screen reader. */
const announcement = ref('')

/** The feed needs the alerts and the category list (labels, colours, the filter). */
function load() {
  void Promise.allSettled([feed.load(), catalog.load()])
}
onMounted(load)
const status = computed(() => {
  if (feed.status === 'error' || catalog.status === 'error') return 'error'
  return feed.status === 'ready' && catalog.status === 'ready' ? 'ready' : 'loading'
})

// Company names for the holdings the alerts are about, whenever the alerts arrive.
watch(
  () => feed.alerts,
  async (alerts) => {
    if (!alerts.length) return
    const found = await provider.getSecurities([...new Set(alerts.map((a) => a.ticker))]).catch(() => [])
    names.value = new Map(found.map((s) => [s.ticker, s.name]))
  },
  { immediate: true },
)

const hasPortfolio = computed(() => data.status.value === 'ready' && data.rows.value.length > 0)
const held = computed(() => new Set(data.rows.value.map((r) => r.ticker)))
const filters = computed(() => {
  const counts = new Map<CategoryId, number>()
  for (const alert of feed.alerts) counts.set(alert.category, (counts.get(alert.category) ?? 0) + 1)
  return catalog.categories.filter((c) => counts.has(c.id)).map((c) => ({ id: c.id, label: c.label, color: c.color, count: counts.get(c.id)! }))
})
const activeFilter = computed(() => (filter.value && filters.value.some((f) => f.id === filter.value) ? filter.value : null))
const filtered = computed(() => (activeFilter.value ? feed.alerts.filter((a) => a.category === activeFilter.value) : feed.alerts))
const visible = computed(() => (demo.isPaid ? filtered.value : filtered.value.slice(0, PREVIEW)))
const visibleUnread = computed(() => visible.value.filter((a) => !feed.isRead(a.id)))
const showReceipt = computed(() => demo.account && hasPortfolio.value)

const unreadLine = () => (feed.unreadCount ? `${feed.unreadCount} unread.` : 'Nothing unread.')

/** The button that was pressed goes away, so keep the reader's place on the alert itself. */
function markRead(alert: Alert) {
  feed.markRead([alert.id])
  announcement.value = `Marked read. ${unreadLine()}`
  void nextTick(() => document.getElementById(`alert-${alert.id}`)?.focus())
}

/** Marks what is on screen: every alert, or the ones in the category being shown. */
function markAllRead() {
  const ids = visibleUnread.value.map((a) => a.id)
  if (!ids.length) return
  feed.markRead(ids)
  announcement.value = `${plural(ids.length, 'alert')} marked read. ${unreadLine()}`
}
</script>

<template>
  <div class="page">
    <div class="page-cols">
      <div class="col-main">
        <header class="page-head">
          <p class="eyebrow">
            Your Rally · Alerts<template v-if="demo.isPaid && feed.unreadCount"> · {{ feed.unreadCount }} unread</template><template v-if="!demo.isPaid"> · paid plan</template>
          </p>
          <h1 class="feed__title">The latest<br />receipts.</h1>
          <p class="lead">Sample alerts, not a live feed. They show what monitoring would tell you about what you hold.</p>
        </header>

        <!-- Free plan: a locked preview -->
        <section v-if="!demo.isPaid" class="card lock">
          <div class="lock__text">
            <span class="tag"><span class="dot" style="--dot: var(--sun)" />Locked · paid plan</span>
            <h2 class="title-lg">Rally keeps watch after you stop looking.</h2>
            <p class="body-muted">
              Live monitoring tells you when a company you hold is newly tagged, loses a tag, files, or drifts.
              <template v-if="status === 'ready' && visible.length">Below is a preview of {{ visible.length }} of {{ plural(feed.alerts.length, 'sample alert') }}.</template>
            </p>
          </div>
          <RouterLink :to="{ path: '/upgrade', query: { next: '/alerts' } }" class="btn btn-primary">See the paid plan</RouterLink>
        </section>

        <div v-if="demo.isPaid && status === 'ready'" class="toolbar">
          <div class="toolbar__filters" role="group" aria-label="Filter by category">
            <button type="button" class="chip" :class="{ 'is-active': !activeFilter }" :aria-pressed="!activeFilter" @click="filter = null">All · {{ feed.alerts.length }}</button>
            <button
              v-for="f in filters"
              :key="f.id"
              type="button"
              class="chip"
              :class="{ 'is-active': activeFilter === f.id }"
              :aria-pressed="activeFilter === f.id"
              @click="filter = activeFilter === f.id ? null : f.id"
            >
              <span class="dot dot-10" :style="{ '--dot': f.color }" />{{ f.label }} · {{ f.count }}
            </button>
          </div>
          <!-- aria-disabled, not disabled: the button keeps focus after it has done its job -->
          <button type="button" class="btn btn-outline btn-sm toolbar__mark" :aria-disabled="!visibleUnread.length" @click="markAllRead">
            {{ activeFilter ? 'Mark these read' : 'Mark all read' }}
          </button>
        </div>
        <p class="sr-only" role="status">{{ announcement }}</p>

        <div v-if="status === 'loading'" class="feed" role="status" aria-label="Loading alerts">
          <div v-for="n in 3" :key="n" class="skeleton" style="height: 168px; border-radius: 28px" />
        </div>
        <section v-else-if="status === 'error'" class="card card-pad failed" role="alert">
          <span class="tag"><span class="dot" style="--dot: var(--flare)" />Feed unavailable</span>
          <h2 class="title-lg">The alerts didn’t load.</h2>
          <button type="button" class="btn btn-primary" @click="load">Try again</button>
        </section>
        <ul v-else class="feed">
          <li v-for="alert in visible" :id="`alert-${alert.id}`" :key="alert.id" class="card alert" :class="{ 'is-read': demo.isPaid && feed.isRead(alert.id) }" tabindex="-1">
            <div class="alert__top">
              <p class="label-mono alert__label">
                <span class="dot dot-10" :style="{ '--dot': catalog.color(alert.category) }" />{{ catalog.label(alert.category) }} · {{ ALERT_TYPE_LABEL[alert.type] }}
              </p>
              <template v-if="demo.isPaid">
                <span v-if="feed.isRead(alert.id)" class="label-mono">Read</span>
                <button v-else type="button" class="alert__mark" :aria-label="`Mark read: ${alert.summary}`" @click="markRead(alert)">Mark read</button>
              </template>
              <span v-else class="label-mono">Preview</span>
            </div>
            <h2 class="alert__title">{{ alert.summary }}</h2>
            <p class="alert__meta">
              <span class="alert__ticker">{{ alert.ticker }}</span> · {{ names.get(alert.ticker) ?? alert.ticker }} · {{ agoFromMinutes(alert.offsetMinutes) }}
              <template v-if="hasPortfolio"> · {{ held.has(alert.ticker) ? 'in your portfolio' : 'not in your portfolio' }}</template>
            </p>
          </li>
          <li v-if="!visible.length" class="feed__empty">No alerts in that category.</li>
        </ul>
        <p v-if="!demo.isPaid && status === 'ready' && feed.alerts.length > visible.length" class="label-mono">{{ feed.alerts.length - visible.length }} more on the paid plan</p>
      </div>

      <aside class="col-side has-receipt">
        <template v-if="showReceipt">
          <ExposureReceipt :data="data" />
        </template>
        <template v-else>
          <p class="label-mono side-label">Your receipt</p>
          <ReceiptPaper class="side-receipt" compact flat skeleton note="Your receipt appears once you have a portfolio and a free account." />
        </template>

        <section class="card card-pad kinds">
          <h2 class="title-card">What sets off an alert.</h2>
          <ul>
            <li class="rule-top"><b>New tag</b><span>A company you hold is newly tagged in a category you care about.</span></li>
            <li class="rule-top"><b>Tag removed</b><span>A tag no longer applies, with the source that changed.</span></li>
            <li class="rule-top"><b>Filing</b><span>A new annual or quarterly report from a flagged holding.</span></li>
            <li class="rule-top"><b>Drift</b><span>A flagged holding has grown as a share of what you own.</span></li>
          </ul>
          <p class="small">These eight are samples and the same for everyone. A real specification for live monitoring is still open.</p>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.feed__title {
  font-size: clamp(88px, 9.2vw, 132px);
  line-height: 1;
}
.lock {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px;
  border: 1.5px solid var(--brand-400);
}
.lock__text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}
.toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.toolbar__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.toolbar .chip {
  padding: 8px 14px 8px 12px;
  font-size: 14px;
}
.toolbar__mark {
  flex: none;
}
.toolbar__mark[aria-disabled='true'] {
  opacity: 0.5;
  cursor: default;
}
.feed {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.feed__empty {
  padding: 28px;
  border: 1px dashed var(--border);
  border-radius: var(--radius-lg);
  text-align: center;
  color: var(--text-muted);
}
.alert {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
  padding: 24px;
}
.alert:focus {
  outline: none;
}
.alert:focus-visible {
  outline: 2px solid var(--brand-300);
  outline-offset: 2px;
}
.alert__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
}
.alert__label {
  display: flex;
  align-items: center;
  gap: 10px;
}
.alert__mark {
  font-size: 14px;
  font-weight: 500;
  color: var(--link);
}
.alert__mark:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.alert__title {
  font-family: var(--font-sans);
  font-size: 24px;
  font-weight: 500;
  line-height: 1.35;
  text-transform: none;
  color: var(--text);
}
.alert.is-read .alert__title {
  color: var(--text-muted);
}
.alert__meta {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text-muted);
}
.alert__ticker {
  color: var(--link);
}
.failed {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}
.side-label {
  align-self: center;
}
.kinds {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.kinds li {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 0;
}
.kinds li:first-child {
  border-top: 0;
  padding-top: 4px;
}
.kinds b {
  font-size: 16px;
  font-weight: 600;
}
.kinds span {
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-muted);
}
</style>
