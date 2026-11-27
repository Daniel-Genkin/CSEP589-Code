<script setup lang="ts">
// Receipts: updates on companies in your fund, and your fund receipt per $100. On the free plan
// one update shows; the rest are a Plus feature.
import { computed, onMounted } from 'vue'
import { ExternalLink } from '@lucide/vue'
import AppShell from '@/components/v7/AppShell.vue'
import Receipt from '@/components/v7/Receipt.vue'
import { usePortfolioData } from '@/composables/usePortfolioData'
import { money, share, useLinesResult } from '@/composables/useLinesResult'
import { sourceName } from '@/data/lines'
import { ALERT_TYPE_LABEL, useAlertsStore } from '@/state/alerts'
import { useCatalogStore } from '@/state/catalog'
import { useDemoStore } from '@/state/demo'
import { agoFromMinutes } from '@/utils/format'

const demo = useDemoStore()
const catalog = useCatalogStore()
const alerts = useAlertsStore()
const data = usePortfolioData()
const r = useLinesResult(data)
onMounted(() => void alerts.load().catch(() => {}))

const weightOf = (ticker: string) => data.rows.value.find((row) => row.ticker === ticker)?.weight ?? 0
const sourceOf = (ticker: string, category: string) => data.tags.value.find((t) => t.ticker === ticker && t.category === category)?.sourceUrl ?? null
const visible = computed(() => (demo.isPaid ? alerts.alerts : alerts.alerts.slice(0, 1)))
const locked = computed(() => (demo.isPaid ? 0 : Math.max(0, alerts.alerts.length - 1)))
const per100 = computed(() => r.lines.value.slice(0, 3).map((l) => ({ label: l.label, sub: l.top[0] ? data.nameOf(l.top[0].ticker) : '', amount: money(l.share * 100) })))
const held = (ticker: string) => {
  const w = weightOf(ticker)
  return w ? `${share(w, 2)} of your ${r.fund.value}` : `Not in ${r.fund.value || 'your fund'}`
}
</script>

<template>
  <AppShell active="receipts" title="Latest updates." :body="r.fund.value ? `What’s new on file for companies in ${r.fund.value}.` : 'What’s new on file for companies you own.'">
    <div class="grid">
      <div class="col">
        <div class="section-head">
          <h3>{{ alerts.unreadCount ? `${alerts.unreadCount} new` : 'All caught up' }}</h3>
          <button v-if="alerts.unreadCount" class="btn-link" style="height: auto" @click="alerts.markAllRead()">Mark All Read</button>
        </div>
        <p v-if="alerts.status === 'loading'" class="caption">Loading updates…</p>
        <p v-else-if="alerts.status === 'error'" class="caption">The updates didn’t load. <button class="btn-link" @click="alerts.load()">Try Again</button></p>
        <article v-for="a in visible" :key="a.id" class="card-pad upd" :class="{ read: alerts.isRead(a.id) }">
          <div class="top">
            <p class="label"><i class="dot" :style="{ background: catalog.color(a.category) }" /> {{ catalog.label(a.category) }} · {{ ALERT_TYPE_LABEL[a.type] }} · {{ agoFromMinutes(a.offsetMinutes) }}</p>
            <button class="mark" @click="alerts.markRead([a.id])">{{ alerts.isRead(a.id) ? 'Read' : 'Mark Read' }}</button>
          </div>
          <p class="text">{{ a.summary }}</p>
          <div class="chips">
            <span class="chip chip-s"><b class="mono">{{ a.ticker }}</b> {{ held(a.ticker) }}</span>
            <span class="chip chip-s"><i class="dot" :style="{ background: catalog.color(a.category) }" /> {{ catalog.label(a.category) }}</span>
          </div>
          <a v-if="sourceOf(a.ticker, a.category)" class="src" :href="sourceOf(a.ticker, a.category)!" target="_blank" rel="noopener noreferrer">{{ sourceName(sourceOf(a.ticker, a.category)!) }} <ExternalLink :size="12" /></a>
        </article>
        <div v-if="locked" class="card-pad lock">
          <b>{{ locked }} more update{{ locked > 1 ? 's' : '' }} on Plus</b>
          <p class="dim">Plus keeps watching what you own and tells you when something new is on file.</p>
          <RouterLink to="/upgrade?next=/receipts" class="btn btn-primary" style="align-self: flex-start">See Plus</RouterLink>
        </div>
        <p class="caption">Sample updates for this demo. The source links open the public record Rally would check.</p>
      </div>

      <aside class="side">
        <h3 class="h">Your fund receipt</h3>
        <div v-if="r.ready.value" class="paper">
          <Receipt mode="per100" :rotate="2" :meta="`Fund receipt · ${r.fund.value}`" :rows="per100.length ? per100 : [{ label: 'Nothing flagged', sub: 'on your lines', amount: '$0.00' }]" :total="money(r.flagged.value.share * 100)" :total-sub="`per $100 in ${r.fund.value}`" :rest="money(100 - r.flagged.value.share * 100)" footer="Per $100" />
        </div>
        <div v-else-if="!demo.portfolio" class="empty"><p class="dim">Check a fund and its receipt shows up here.</p><RouterLink to="/check" class="btn btn-secondary">Check a Fund</RouterLink></div>
        <div v-else class="sk" />
        <h3 class="h" style="margin-top: 20px">Share your receipt</h3>
        <p class="dim">Show friends what’s in your fund. Only holdings and your lines are shared, never balances or returns.</p>
        <div class="btns">
          <RouterLink to="/check/receipt?dialog=share" class="btn btn-secondary" :class="{ off: !demo.portfolio }">Share Receipt</RouterLink>
          <RouterLink to="/check/receipt?dialog=share" class="btn btn-secondary" :class="{ off: !demo.portfolio }">Save Image</RouterLink>
        </div>
      </aside>
    </div>
  </AppShell>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: 800px 456px; justify-content: space-between; gap: 24px; }
.col { display: flex; flex-direction: column; gap: 14px; }
.side { display: flex; flex-direction: column; gap: 12px; }
.h { font-weight: 600; font-size: 20px; color: var(--white); }
.paper { display: flex; justify-content: center; padding: 20px 0; }
.paper :deep(.receipt) { width: 320px; }
.side .dim { font-size: 15px; line-height: 1.45; }
.btns { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 8px; }
.upd { padding: 20px; gap: 14px; transition: opacity 0.2s; }
.upd.read { opacity: 0.55; }
.top { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.top .label { display: inline-flex; align-items: center; gap: 8px; }
.mark { color: var(--link); font-weight: 600; font-size: 15px; white-space: nowrap; }
.text { font-weight: 500; font-size: 18px; color: var(--white); line-height: 1.4; }
.chips { display: flex; gap: 8px; flex-wrap: wrap; }
.chip-s { height: 32px; font-size: 13px; color: var(--dim); }
.src { display: inline-flex; align-items: center; gap: 4px; color: var(--link); font-family: var(--mono); font-size: 13px; }
.lock { gap: 10px; border: 1.5px dashed #4a4654; background: none; }
.lock b { font-size: 17px; color: var(--white); }
.empty { display: flex; flex-direction: column; gap: 12px; align-items: flex-start; padding: 20px 0; }
.off { opacity: 0.4; pointer-events: none; }
.sk { height: 360px; border-radius: 20px; background: linear-gradient(90deg, #2a2832, #34313d, #2a2832); background-size: 200% 100%; animation: shimmer 1.4s linear infinite; }
@keyframes shimmer { to { background-position: -200% 0; } }
</style>
