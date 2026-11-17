<script setup>
// Figma "Receipts": the alert feed on the left, the fund receipt and sharing on the right.
import ReceiptPaper from '@/components/rally/ReceiptPaper.vue'
import { CATEGORY_LABELS } from '@/api/mock/catalog'
import { useAlertsStore } from '@/stores/alerts'
import { useLinesStore } from '@/stores/lines'
import { timeAgo } from '@/utils/format'
import { checkFund } from '@/utils/lines'
import { storeToRefs } from 'pinia'
import { computed, onMounted } from 'vue'
import { receiptProps } from './dashboard/receipt'

const KINDS = {
  negative: { label: 'Heads up', color: 'var(--flare)' },
  positive: { label: 'Good news', color: 'var(--pass)' },
  forecast: { label: 'Forecast', color: 'var(--brand-400)' },
}

const alerts = useAlertsStore()
const { lineKeys, fundSymbol } = storeToRefs(useLinesStore())

onMounted(() => alerts.fetch().catch(() => {}))

// The receipt is for the fund the user picked on the dashboard; until then it has not printed.
const result = computed(() => (fundSymbol.value ? checkFund(fundSymbol.value, lineKeys.value) : null))
const receipt = computed(() => (result.value ? receiptProps(result.value) : null))
const receiptPath = computed(() => ({ path: '/receipt', query: { fund: fundSymbol.value } }))

const labelOf = (alert) => {
  const category = CATEGORY_LABELS[alert.categoryChanges?.[0]?.key]
  return [category, KINDS[alert.kind].label].filter(Boolean).join(' · ')
}
</script>

<template>
  <div class="page">
    <div class="page-cols">
      <div class="col-main">
        <header class="page-head">
          <p class="eyebrow">
            Your Rally · Receipts<template v-if="alerts.unreadCount"> · {{ alerts.unreadCount }} unread</template>
          </p>
          <h1 class="feed__title">The latest<br />receipts.</h1>
          <p class="lead">Sample alerts, not a live feed. Weekly digest.</p>
          <button v-if="alerts.unreadCount > 1" type="button" class="btn btn-outline btn-sm" @click="alerts.markAllRead()">Mark all read</button>
        </header>

        <div v-if="!alerts.loaded" class="feed" aria-busy="true">
          <div v-for="n in 3" :key="n" class="skeleton" style="height: 168px; border-radius: 28px" />
        </div>

        <ul v-else-if="alerts.items.length" class="feed">
          <li v-for="alert in alerts.items" :key="alert.id" class="card alert" :class="{ 'is-read': alert.readAt }">
            <div class="alert__top">
              <p class="label-mono alert__label"><span class="dot dot-10" :style="{ '--dot': KINDS[alert.kind].color }" />{{ labelOf(alert) }}</p>
              <button v-if="!alert.readAt" type="button" class="alert__mark" @click="alerts.markRead(alert.id)">Mark read</button>
              <span v-else class="label-mono">Read</span>
            </div>
            <h2 class="alert__title">{{ alert.title }}</h2>
            <p class="alert__summary">{{ alert.summary }}</p>
            <RouterLink :to="`/app/alerts/${alert.id}`" class="source-link">{{ alert.security.name }} · {{ timeAgo(alert.createdAt) }} · see the sources ↗</RouterLink>
          </li>
        </ul>

        <div v-else class="card card-pad">
          <h2 class="title-card">No receipts yet.</h2>
          <p class="body-muted" style="margin-top: 8px">When something changes for a company in your fund, it shows up here.</p>
        </div>
      </div>

      <aside class="col-side has-receipt">
        <p class="label-mono side-label">Your fund receipt</p>
        <ReceiptPaper v-if="receipt" class="side-receipt" compact flat v-bind="receipt" />
        <ReceiptPaper v-else class="side-receipt" compact flat skeleton note="Your receipt appears after a scan. Pick a fund on the dashboard." />

        <section v-if="receipt" class="share">
          <p class="label-mono">Share · holdings only</p>
          <h2 class="title-section">Make the group chat nosy.</h2>
          <p class="body-muted">Your fund’s business, on a receipt. No balances. No performance figures. Just holdings and the lines you picked.</p>
          <div class="share__actions">
            <RouterLink :to="receiptPath" class="btn btn-outline">Share receipt</RouterLink>
            <RouterLink :to="receiptPath" class="btn btn-outline">Export image</RouterLink>
          </div>
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
.col-main {
  gap: 44px !important;
}
.col-side {
  gap: 36px !important;
}
.feed {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.alert {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
  padding: 24px;
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
.alert__summary {
  margin-top: -8px;
  color: var(--text-muted);
}
.alert .source-link {
  font-size: 13px;
}
.alert.is-read .alert__title {
  color: var(--text-muted);
}
.side-label {
  align-self: center;
}
.share {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
}
.share__actions {
  display: flex;
  gap: 12px;
  padding-top: 6px;
}
</style>
