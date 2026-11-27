<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronRight, FileText, ShoppingBasket, ArrowLeftRight, Upload } from '@lucide/vue'
import AppShell from '@/components/v7/AppShell.vue'
import DotGrid from '@/components/v7/DotGrid.vue'
import Row from '@/components/v7/Row.vue'
import Receipt from '@/components/v7/Receipt.vue'
import { usePortfolioData } from '@/composables/usePortfolioData'
import { bigPct, money, share, useLinesResult, whole } from '@/composables/useLinesResult'
import { useAlertsStore } from '@/state/alerts'
import { useCatalogStore } from '@/state/catalog'
import { useDemoStore } from '@/state/demo'
import { listNames } from '@/utils/format'

const route = useRoute()
const catalog = useCatalogStore()
const demo = useDemoStore()
const alerts = useAlertsStore()
const data = usePortfolioData()
const r = useLinesResult(data)
onMounted(() => void alerts.load().catch(() => {}))

/** `?state=unavailable` pins the error state for design review. */
const state = computed(() => {
  if (!demo.portfolio) return 'empty'
  if (route.query.state === 'unavailable' || data.status.value === 'error') return 'unavailable'
  if (!r.ready.value) return 'loading'
  return r.flagged.value.count ? 'result' : 'clear'
})
const updateNames = computed(() => listNames([...new Set(alerts.unread.map((a) => data.nameOf(a.ticker)))]))
const actions = [
  { to: '/basket', icon: ShoppingBasket, title: 'Drop Companies', sub: 'Build a basket without them', tint: 'var(--sun)' },
  { to: '/redirect', icon: ArrowLeftRight, title: 'Redirect Deposits', sub: 'Send new money somewhere else', tint: 'var(--link)' },
  { to: '/check/receipt?dialog=share', icon: Upload, title: 'Share Your Receipt', sub: 'Holdings only, never balances', tint: 'var(--white)' },
]
const lineLabels = (ids: string[]) => ids.map((id) => catalog.label(id)).join(', ')
</script>

<template>
  <AppShell active="home" :glow="state === 'clear' ? 'green' : state === 'unavailable' ? 'grey' : 'warm'">
    <!-- Nothing checked yet -->
    <div v-if="state === 'empty'" class="head">
      <h1 class="display title">Check a fund first.</h1>
      <p class="body">Pick a fund you own and your lines, and Rally shows what crosses them. No signup needed.</p>
      <div class="row-btns"><RouterLink to="/check" class="btn btn-primary">Check a Fund</RouterLink><RouterLink to="/connect" class="btn btn-secondary">Connect an Account</RouterLink></div>
    </div>

    <!-- Loading -->
    <div v-else-if="state === 'loading'" class="grid" aria-busy="true">
      <section class="card summary skeleton"><p class="label">{{ r.fund.value }} · Reading your fund…</p><div class="sk sk-big" /><div class="sk" /><div class="sk" /></section>
      <aside class="side"><div class="card skeleton sk-card" /><div class="card skeleton sk-card" /></aside>
    </div>

    <!-- Data unavailable -->
    <template v-else-if="state === 'unavailable'">
      <header class="head"><h1 class="display title">We couldn’t find the data.</h1><p class="body">The check didn’t finish. Your lines are saved.</p></header>
      <div class="grid">
        <div class="col">
          <div class="card-pad main">
            <div class="list" style="padding-left: 0; background: none"><Row :tk="r.fund.value" :title="data.portfolio.value?.name ?? r.fund.value" :sub="`${catalog.selectedIds.length} lines · check didn’t finish`" /></div>
            <span class="tag" style="align-self: flex-start"><i class="dot" style="background: var(--flare)" />Data unavailable</span>
            <b class="t">The data didn’t come through.</b>
            <p class="dim">Rally couldn’t read the fund’s holdings or prices right now, so there’s nothing to show yet.</p>
            <div class="note"><p class="label" style="color: var(--flare)">Missing data isn’t 0%</p><p>Rally won’t show an old result or treat missing data as a clean fund.</p></div>
            <button class="btn btn-primary btn-block" @click="data.reload()">Try Again</button>
            <RouterLink to="/check" class="btn btn-secondary btn-block">Change Fund</RouterLink>
            <p class="caption center">Nothing was bought or sold.</p>
          </div>
        </div>
        <aside class="side">
          <div class="empty"><p class="display">No receipt.</p><p class="caption">Your receipt shows up once a check finishes.</p></div>
          <div class="card-pad">
            <div class="lh"><b>Your lines</b><span>{{ catalog.selectedIds.length }} saved</span></div>
            <div class="chips"><span v-for="l in catalog.selected" :key="l.id" class="chip"><i class="dot" :style="{ background: l.color }" />{{ l.label }}</span></div>
          </div>
        </aside>
      </div>
    </template>

    <!-- All clear -->
    <div v-else-if="state === 'clear'" class="grid">
      <div class="col">
        <span class="ok mono"><i class="dot" style="background: var(--green)" /> No conflicts found</span>
        <p class="label">Results ready · {{ r.fund.value }}</p>
        <p class="display zero">0%</p>
        <p class="lead">You’re all clear.</p>
        <p class="dim">None of your money in {{ r.fund.value }} goes to companies that cross your {{ catalog.selectedIds.length }} lines. You’ll get an update if that changes.</p>
        <div class="card-pad">
          <div class="lh"><b>Where every $100 goes</b><span style="color: var(--green)">All 100 clear</span></div>
          <DotGrid :segments="[{ n: 100, color: 'var(--green)' }]" :size="28" :gap="10" />
        </div>
        <p class="dim">This only checks {{ lineLabels(catalog.selectedIds) }}. It isn’t an endorsement of {{ r.fund.value }} or the companies in it.</p>
      </div>
      <aside class="side">
        <div class="paper"><Receipt :rotate="2" :meta="`Fund receipt · ${r.fund.value}`" :rows="[{ label: 'Checked lines', amount: String(catalog.selectedIds.length) }, { label: 'Matched companies', amount: '0' }]" total="$0.00" :total-sub="`per $100 in ${r.fund.value}`" rest="$100.00" total-color="var(--ink)" footer="No matches" /></div>
        <div class="card-pad">
          <div class="lh"><b>Your lines</b><span>{{ catalog.selectedIds.length }} lines</span></div>
          <div class="chips"><span v-for="l in catalog.selected" :key="l.id" class="chip"><i class="dot" :style="{ background: l.color }" />{{ l.label }}</span></div>
          <RouterLink to="/lines" class="btn btn-secondary btn-block" style="height: 44px; font-size: 15px">Edit Lines</RouterLink>
        </div>
      </aside>
    </div>

    <!-- Result -->
    <div v-else class="grid">
      <div class="col">
        <section class="card summary">
          <p class="label">{{ r.fund.value }} · {{ whole(r.totalUsd.value) }}</p>
          <div class="hero">
            <p class="display big">{{ bigPct(r.flagged.value.share) }}</p>
            <p class="lead">of your money in {{ r.fund.value }} crosses your lines</p>
          </div>
          <DotGrid :segments="r.dots.value" :size="28" :gap="10" />
          <p class="legend">
            <span v-for="l in r.lines.value.slice(0, 4)" :key="l.category"><i class="dot" :style="{ background: l.color }" /> {{ l.label }}</span>
          </p>
          <hr class="rule" />
          <RouterLink to="/breakdown" class="more">See Breakdown <ChevronRight :size="18" color="var(--mute)" /></RouterLink>
        </section>

        <div class="section-head">
          <h3>Who crosses your lines</h3>
          <RouterLink to="/breakdown" class="btn-link" style="height: auto">See All {{ r.companies.value.length }}</RouterLink>
        </div>
        <div class="list">
          <Row
            v-for="c in r.companies.value.slice(0, 4)"
            :key="c.ticker"
            :tk="c.ticker"
            :title="c.name"
            :sub="lineLabels(c.lines)"
            :dot="catalog.color(c.lines[0])"
            :right="share(c.weight)"
            :right-sub="`${money(c.weight * 100)} per $100`"
            icon="chev"
            to="/breakdown"
          />
        </div>
      </div>

      <aside class="side">
        <RouterLink to="/receipts" class="card upd">
          <span class="sq"><FileText :size="18" /></span>
          <span class="t"><b>{{ alerts.unreadCount ? `${alerts.unreadCount} new updates` : 'No new updates' }}</b><small>{{ alerts.unreadCount ? `About ${updateNames}` : 'You’re up to date' }}</small></span>
          <ChevronRight :size="18" color="var(--mute)" />
        </RouterLink>

        <div>
          <h3 class="h">What you can do</h3>
          <p class="hs">Or keep {{ r.fund.value }} as it is. Nothing changes.</p>
        </div>
        <div class="card acts">
          <RouterLink v-for="a in actions" :key="a.title" :to="a.to" class="act">
            <span class="sq" :style="{ color: a.tint }"><component :is="a.icon" :size="18" /></span>
            <span class="t"><b>{{ a.title }}</b><small>{{ a.sub }}</small></span>
            <ChevronRight :size="18" color="var(--mute)" />
          </RouterLink>
        </div>

        <div class="card-pad lines">
          <div class="lh"><b>Your lines</b><span>{{ catalog.selectedIds.length }} lines</span></div>
          <div class="chips">
            <span v-for="l in catalog.selected" :key="l.id" class="chip"><i class="dot" :style="{ background: l.color }" />{{ l.label }}</span>
          </div>
          <RouterLink to="/lines" class="btn btn-secondary btn-block" style="height: 44px; font-size: 15px">Edit Lines</RouterLink>
        </div>
      </aside>
    </div>
  </AppShell>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: 800px 456px; justify-content: space-between; gap: 24px; margin-top: 8px; }
.col { display: flex; flex-direction: column; gap: 20px; }
.summary { padding: 22px 20px 6px; display: flex; flex-direction: column; gap: 18px; }
.hero { display: flex; align-items: center; gap: 22px; margin-top: -4px; }
.big { font-size: 150px; color: var(--cream); background: linear-gradient(180deg, #fff 30%, #f2dca6); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.lead { font-weight: 500; font-size: 28px; line-height: 1.25; color: var(--white); max-width: 420px; }
.legend { display: flex; flex-wrap: wrap; gap: 20px; font-size: 13px; color: var(--dim); }
.legend span { display: inline-flex; align-items: center; gap: 7px; }
.more { display: flex; justify-content: space-between; align-items: center; height: 48px; color: var(--link); font-weight: 600; font-size: 15px; }
.side { display: flex; flex-direction: column; gap: 14px; }
.upd, .act { display: flex; align-items: center; gap: 14px; padding: 12px 16px; }
.upd { min-height: 62px; }
.sq { width: 40px; height: 40px; border-radius: 10px; background: #34313d; display: grid; place-items: center; color: var(--white); flex: none; }
.t { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.t b { font-weight: 600; font-size: 16px; color: var(--white); }
.t small { font-size: 13px; color: var(--dim); }
.h { font-weight: 600; font-size: 20px; color: var(--white); margin-top: 10px; }
.hs { font-size: 13px; color: var(--dim); margin-top: 4px; }
.acts { padding: 4px 0; }
.act { border-bottom: 1px solid var(--line); }
.act:last-child { border-bottom: 0; }
.act:hover b, .upd:hover b { color: var(--link); }
.lines { margin-top: 10px; gap: 14px; }
.lh { display: flex; justify-content: space-between; align-items: baseline; }
.lh b { font-weight: 600; font-size: 18px; color: var(--white); }
.lh span { font-size: 13px; color: var(--mute); }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { height: 34px; font-size: 14px; background: #2f2c38; }
.ok { align-self: flex-start; display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; background: rgba(75, 214, 126, 0.12); color: var(--green); font-weight: 500; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; }
.zero { font-size: 190px; color: var(--green); }
.paper { display: flex; justify-content: center; padding: 14px 0; }
.head { display: flex; flex-direction: column; gap: 12px; margin-top: 8px; }
.row-btns { display: flex; gap: 10px; margin-top: 8px; }
.title { font-size: 88px; color: var(--cream); }
.body { font-size: 17px; color: var(--dim); }
.main { gap: 14px; padding: 16px 16px 12px; }
.note { background: var(--ink); border-radius: 14px; padding: 14px 16px; display: flex; flex-direction: column; gap: 6px; font-size: 15px; color: var(--white); }
.center { text-align: center; }
.empty { border: 1.5px dashed #4a4654; border-radius: 20px; padding: 32px; text-align: center; display: flex; flex-direction: column; gap: 10px; }
.empty .display { font-size: 44px; color: #8a8594; }
.skeleton { min-height: 200px; }
.sk { height: 16px; border-radius: 8px; background: linear-gradient(90deg, #2a2832, #34313d, #2a2832); background-size: 200% 100%; animation: shimmer 1.4s linear infinite; }
.sk-big { height: 120px; width: 60%; }
.sk-card { height: 160px; }
@keyframes shimmer { to { background-position: -200% 0; } }
</style>
