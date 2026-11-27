<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ExternalLink } from '@lucide/vue'
import AppShell from '@/components/v7/AppShell.vue'
import DotGrid from '@/components/v7/DotGrid.vue'
import Row from '@/components/v7/Row.vue'
import Modal from '@/components/v7/Modal.vue'
import { usePortfolioData } from '@/composables/usePortfolioData'
import { bigPct, money, share, useLinesResult, whole } from '@/composables/useLinesResult'
import { sourceName } from '@/data/lines'
import { categoriesByTicker } from '@/domain/exposure'
import { constituentsOf, positionsOf } from '@/domain/portfolio'
import { useCatalogStore } from '@/state/catalog'
import { useDemoStore } from '@/state/demo'
import { plural } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const demo = useDemoStore()
const catalog = useCatalogStore()
const data = usePortfolioData()
const r = useLinesResult(data)

const tab = ref<'companies' | 'lines'>('companies')
const lineLabels = (ids: string[]) => ids.map((id) => catalog.label(id)).join(', ')
const excludedNote = (ticker: string, lines: string[]) =>
  demo.exclusions.tickers.includes(ticker) || lines.some((l) => demo.exclusions.categories.includes(l)) ? ' · Switched off in What-if' : ''

/** Every selected line, with what the fund holds in it (or nothing). */
const lineRows = computed(() =>
  catalog.selected.map((l) => {
    const e = r.lines.value.find((x) => x.category === l.id)
    return { id: l.id, label: l.label, color: l.color, share: e?.share ?? 0, sub: e ? `${plural(e.count, 'company', 'companies')} · ${e.top.map((t) => data.nameOf(t.ticker)).slice(0, 2).join(', ')}` : 'Nothing you hold' }
  }),
)
const barSegments = computed(() => r.lines.value.map((l) => ({ flex: Math.max(l.share * 100, 0.6), color: l.color })))
/** A company on two lines counts in each, so the lines can add up to more than the total. */
const overlaps = computed(() => r.lines.value.reduce((s, l) => s + l.share, 0) > r.flagged.value.share + 0.0005)
const legend = computed(() => [
  ...r.lines.value.map((l) => ({ label: l.label, color: l.color, pct: share(l.share) })),
  { label: 'Everything else', color: '#4a4654', pct: share(Math.max(0, 1 - r.flagged.value.share)) },
])

// Holdings, grouped by what you actually hold: each fund with the companies inside it.
const SHOW = 12
const openGroups = ref<Set<string>>(new Set())
const flaggedLines = computed(() => categoriesByTicker(data.tags.value, data.selectedIds.value))
const groups = computed(() => {
  const p = data.portfolio.value
  if (!p || !r.ready.value) return []
  const positions = positionsOf(p, data.funds.value)
  return positions.map((pos) => {
    const inside = pos.isFund ? constituentsOf(p, data.funds.value, pos.ticker).filter((c) => c.weight > 0).sort((a, b) => b.weight - a.weight) : []
    return { ...pos, inside, source: data.fundSources.value.get(pos.ticker) ?? null }
  })
})
const hasFunds = computed(() => groups.value.some((g) => g.isFund))
const toggleGroup = (t: string) => {
  const next = new Set(openGroups.value)
  next.has(t) ? next.delete(t) : next.add(t)
  openGroups.value = next
}

// Why a company is flagged: its tags on your lines, each with a source.
const company = computed(() => (route.query.company ? String(route.query.company) : null))
const companyTags = computed(() => (company.value ? data.tags.value.filter((t) => t.ticker === company.value && data.selectedIds.value.includes(t.category)) : []))
const companyRow = computed(() => r.companies.value.find((c) => c.ticker === company.value))
const closeWhy = () => router.replace('/breakdown')
const strengthLabel = ['', 'Minor', 'Moderate', 'Major']
</script>

<template>
  <AppShell active="home" back-label="Breakdown" :glow="r.ready.value && !r.flagged.value.count ? 'green' : 'warm'">
    <div v-if="!demo.portfolio" class="empty">
      <p class="display">Nothing to break down.</p>
      <p class="dim">Check a fund first and its breakdown shows up here.</p>
      <RouterLink to="/check" class="btn btn-primary">Check a Fund</RouterLink>
    </div>

    <div v-else-if="data.status.value === 'error'" class="card-pad err" role="alert">
      <span class="tag" style="align-self: flex-start"><i class="dot" style="background: var(--flare)" />Data unavailable</span>
      <b>The holdings didn’t load.</b>
      <p class="dim">Rally won’t show old numbers. Your lines are saved.</p>
      <button class="btn btn-primary" style="align-self: flex-start" @click="data.reload()">Try Again</button>
    </div>

    <div v-else-if="!r.ready.value" class="grid" aria-busy="true">
      <div class="col"><p class="label">{{ r.fund.value }} · Reading your fund…</p><div class="sk sk-big" /><div class="sk" /><div class="sk" /></div>
      <aside class="card-pad side"><div class="sk" style="height: 220px" /></aside>
    </div>

    <template v-else>
      <div class="grid">
        <div class="col">
          <p class="label">{{ r.fund.value }} · {{ data.portfolio.value?.name }} · {{ demo.dataLabel }}</p>
          <p class="display big">{{ bigPct(r.flagged.value.share) }}</p>
          <p class="lead">of your money in {{ r.fund.value }} crosses your lines.</p>
          <p class="dim s">
            That’s {{ money(r.flagged.value.share * 100) }} of every $100, or {{ whole(r.flagged.value.usd) }} of your {{ whole(r.totalUsd.value) }}, spread across
            {{ r.flagged.value.count }} of its {{ data.rows.value.length.toLocaleString('en-US') }} companies.
          </p>
          <div class="tags">
            <span class="tag"><i class="dot" style="background: var(--link)" />{{ demo.isConnected ? 'Account connected' : 'No account connected' }}</span>
            <span class="tag"><i class="dot" style="background: var(--link)" />Every flag has a source</span>
            <span class="tag"><i class="dot" style="background: var(--link)" />No buy or sell tips</span>
          </div>

          <div class="section-head" style="margin-top: 20px"><h3>Who crosses your lines</h3><span class="meta">{{ plural(r.companies.value.length, 'company', 'companies') }}</span></div>
          <div class="seg" role="tablist">
            <button role="tab" :aria-selected="tab === 'companies'" :class="{ on: tab === 'companies' }" @click="tab = 'companies'">Companies</button>
            <button role="tab" :aria-selected="tab === 'lines'" :class="{ on: tab === 'lines' }" @click="tab = 'lines'">Lines</button>
          </div>
          <div v-if="barSegments.length" class="bar" :style="{ width: Math.max(8, r.flagged.value.share * 100 * 3) + '%' }">
            <i v-for="(b, i) in barSegments" :key="i" :style="{ flex: b.flex, background: b.color }" />
          </div>
          <div v-if="tab === 'companies'" class="list">
            <p v-if="!r.companies.value.length" class="caption" style="padding: 16px 0">Nothing in {{ r.fund.value }} crosses your lines.</p>
            <Row
              v-for="c in r.companies.value"
              :key="c.ticker"
              :tk="c.ticker"
              :title="c.name"
              :sub="lineLabels(c.lines) + excludedNote(c.ticker, c.lines)"
              :dot="catalog.color(c.lines[0])"
              :right="share(c.weight)"
              :right-sub="`${money(c.weight * 100)} per $100`"
              icon="chev"
              :to="`/breakdown?company=${c.ticker}`"
            />
          </div>
          <div v-else class="list">
            <Row v-for="l in lineRows" :key="l.id" :title="l.label" :sub="l.sub" :dot="l.color" :right="l.share ? share(l.share) : '–'" />
          </div>
          <p class="caption">Tap a company to see why it’s flagged.</p>
        </div>

        <aside class="card-pad side">
          <div class="sh"><b>Where every $100 goes</b><span class="caption">1 dot = $1</span></div>
          <DotGrid :segments="r.dots.value.length ? r.dots.value : [{ n: 0, color: 'var(--green)' }]" :size="14" :gap="7" />
          <div class="legend">
            <div v-for="l in legend" :key="l.label"><span><i class="dot" :style="{ background: l.color }" /> {{ l.label }}</span><b class="mono">{{ l.pct }}</b></div>
          </div>
          <p v-if="overlaps" class="caption">A company on two lines counts in each, so the lines add up to more than the {{ share(r.flagged.value.share) }} total.</p>
          <p class="caption">Which companies cross which line is sample data for this demo. Prices and fund holdings are live.</p>
        </aside>
      </div>

      <!-- Holdings -->
      <section class="card-pad holdings">
        <div class="hh">
          <h3>What’s inside</h3>
          <span class="label">{{ plural(data.rows.value.length, 'company', 'companies') }}</span>
        </div>
        <table>
          <thead>
            <tr><th>Ticker</th><th>Name</th><th>Lines</th><th class="num">Weight</th><th class="num">Value</th></tr>
          </thead>
          <tbody v-for="g in groups" :key="g.ticker">
            <tr v-if="g.isFund" class="group">
              <td class="mono tkc">{{ g.ticker }}</td>
              <td>
                <b>{{ data.nameOf(g.ticker) }}</b>
                <small v-if="g.source" class="src">
                  Holdings as of {{ g.source.holdingsAsOf ?? 'date not stated' }} ·
                  <a v-if="g.source.pageUrl" :href="g.source.pageUrl" target="_blank" rel="noopener noreferrer">TickerInside <ExternalLink :size="11" /></a>
                  <template v-else>TickerInside</template>
                  · CC BY 4.0
                </small>
              </td>
              <td class="dim">{{ plural(g.inside.length, 'company', 'companies') }} inside</td>
              <td class="num mono">{{ share(g.weight, 2) }}</td>
              <td class="num mono">{{ whole(g.valueUsd) }}</td>
            </tr>
            <template v-if="g.isFund">
              <tr v-for="c in openGroups.has(g.ticker) ? g.inside : g.inside.slice(0, SHOW)" :key="c.ticker" class="inside">
                <td class="mono tkc">{{ c.ticker }}</td>
                <td>{{ data.nameOf(c.ticker) }}</td>
                <td>
                  <span v-for="l in flaggedLines.get(c.ticker) ?? []" :key="l" class="lt"><i class="dot" :style="{ background: catalog.color(l) }" />{{ catalog.label(l) }}</span>
                </td>
                <td class="num mono">{{ share(c.weight * g.weight, 2) }}</td>
                <td class="num mono">{{ whole(c.weight * g.valueUsd) }}</td>
              </tr>
              <tr v-if="g.inside.length > SHOW" class="more-row">
                <td colspan="5"><button class="btn-link" @click="toggleGroup(g.ticker)">{{ openGroups.has(g.ticker) ? 'Show Fewer' : `Show All ${g.inside.length}` }}</button></td>
              </tr>
            </template>
            <tr v-else :class="{ inside: hasFunds }">
              <td class="mono tkc">{{ g.ticker }}</td>
              <td>{{ data.nameOf(g.ticker) }}</td>
              <td>
                <span v-for="l in flaggedLines.get(g.ticker) ?? []" :key="l" class="lt"><i class="dot" :style="{ background: catalog.color(l) }" />{{ catalog.label(l) }}</span>
              </td>
              <td class="num mono">{{ share(g.weight, 2) }}</td>
              <td class="num mono">{{ whole(g.valueUsd) }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="r.coverage.value < 0.98" class="caption">
          The holdings list covers {{ share(r.coverage.value) }} of {{ r.fund.value }}. The rest is cash or holdings the source doesn’t list, and isn’t counted, so the real share could be higher.
        </p>
        <p v-if="data.fundSources.value.size" class="caption">
          Fund holdings come from TickerInside (CC BY 4.0), using dated issuer files or SEC Form N-PORT filings. Each fund’s date is shown above.
        </p>
      </section>
    </template>
  </AppShell>

  <Modal v-if="company && companyRow" :title="`Why ${companyRow.name} is flagged`" @close="closeWhy">
    <p class="dim why-sub">{{ share(companyRow.weight, 2) }} of {{ r.fund.value }} · {{ money(companyRow.weight * 100) }} of every $100</p>
    <div class="list">
      <div v-for="t in companyTags" :key="t.category" class="why">
        <p class="wl"><i class="dot" :style="{ background: catalog.color(t.category) }" />{{ catalog.label(t.category) }}<span class="label">{{ strengthLabel[t.strength] }}</span></p>
        <p class="wr">{{ t.reason }}</p>
        <a :href="t.sourceUrl" target="_blank" rel="noopener noreferrer" class="ws">{{ sourceName(t.sourceUrl) }} <ExternalLink :size="12" /></a>
      </div>
    </div>
    <RouterLink to="/whatif" class="btn btn-primary btn-block">See It in What-if</RouterLink>
    <p class="caption">Sample tag for this demo. The source link opens the public record Rally would check.</p>
  </Modal>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: 800px 456px; justify-content: space-between; gap: 24px; }
.col { display: flex; flex-direction: column; gap: 12px; }
.big { font-size: 190px; color: var(--cream); margin: 4px 0; }
.lead { font-weight: 500; font-size: 24px; color: var(--white); }
.s { font-size: 15px; max-width: 640px; }
.tags { display: flex; gap: 8px; margin-top: 4px; flex-wrap: wrap; }
.seg { display: grid; grid-template-columns: 1fr 1fr; padding: 3px; border-radius: 999px; background: var(--surf); }
.seg button { height: 36px; border-radius: 999px; font-weight: 600; font-size: 14px; color: var(--dim); }
.seg button.on { background: #45424f; color: var(--white); }
.bar { display: flex; gap: 3px; height: 8px; max-width: 100%; }
.bar i { border-radius: 4px; }
.side { gap: 14px; padding: 20px; align-self: start; }
.sh { display: flex; justify-content: space-between; align-items: baseline; }
.sh b { font-weight: 600; font-size: 17px; color: var(--white); }
.legend > div { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--line); font-size: 15px; color: var(--white); }
.legend span { display: inline-flex; align-items: center; gap: 10px; }
.legend b { font-weight: 500; }
.holdings { margin-top: 32px; padding: 22px; gap: 14px; }
.hh { display: flex; justify-content: space-between; align-items: baseline; }
.hh h3 { font-weight: 600; font-size: 20px; color: var(--white); }
table { width: 100%; border-collapse: collapse; font-size: 14px; color: var(--white); }
th { text-align: left; font-family: var(--mono); font-weight: 500; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--mute); padding: 8px 10px; border-bottom: 1px solid var(--line); }
td { padding: 10px; border-bottom: 1px solid var(--line); vertical-align: middle; }
.num { text-align: right; white-space: nowrap; }
.tkc { font-size: 12px; color: var(--cream); width: 80px; }
.group td { background: #2a2832; }
.group b { font-weight: 600; }
.src { display: block; margin-top: 3px; font-size: 12px; color: var(--dim); }
.src a { color: var(--link); display: inline-flex; align-items: center; gap: 3px; }
.inside td:first-child { padding-left: 24px; }
.lt { display: inline-flex; align-items: center; gap: 6px; margin-right: 10px; font-size: 13px; color: var(--dim); white-space: nowrap; }
.more-row td { text-align: center; }
.empty { display: flex; flex-direction: column; align-items: flex-start; gap: 14px; margin-top: 40px; }
.empty .display { font-size: 88px; color: var(--cream); }
.err { gap: 12px; max-width: 640px; margin-top: 20px; }
.err b { font-size: 20px; color: var(--white); }
.sk { height: 16px; border-radius: 8px; background: linear-gradient(90deg, #2a2832, #34313d, #2a2832); background-size: 200% 100%; animation: shimmer 1.4s linear infinite; }
.sk-big { height: 150px; width: 50%; }
@keyframes shimmer { to { background-position: -200% 0; } }
.why-sub { font-size: 14px; }
.why { padding: 14px 16px; display: flex; flex-direction: column; gap: 6px; border-bottom: 1px solid var(--line); }
.why:last-child { border-bottom: 0; }
.wl { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 16px; color: var(--white); }
.wl .label { margin-left: auto; }
.wr { font-size: 15px; color: var(--dim); line-height: 1.45; }
.ws { display: inline-flex; align-items: center; gap: 4px; color: var(--link); font-size: 14px; font-weight: 500; }
</style>
