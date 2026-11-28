<script setup lang="ts">
// What-if: switch off whole lines or single companies and see what the portfolio would have
// returned with and without them next to the S&P 500, plus how much still crosses your lines.
// Excluded weight is spread across what remains, or swapped into an alternative.
import { computed, ref, shallowRef, watch } from 'vue'
import AppShell from '@/components/v7/AppShell.vue'
import Toggle from '@/components/v7/Toggle.vue'
import Modal from '@/components/v7/Modal.vue'
import { usePortfolioData } from '@/composables/usePortfolioData'
import { useWhatIf } from '@/composables/useWhatIf'
import { share, whole } from '@/composables/useLinesResult'
import { SERIES_COLORS as C } from '@/config/chart'
import { provider } from '@/data'
import { categoriesByTicker } from '@/domain/exposure'
import { shortName } from '@/domain/portfolio'
import { useCatalogStore } from '@/state/catalog'
import { useDemoStore } from '@/state/demo'
import type { Security } from '@/types'
import { plural, signed } from '@/utils/format'
import { useTween } from '@/v7/tween.js'

const demo = useDemoStore()
const catalog = useCatalogStore()
const data = usePortfolioData()
const whatIf = useWhatIf(data)

const name = computed(() => (data.portfolio.value ? shortName(data.portfolio.value) : ''))
const loaded = computed(() => data.status.value === 'ready')
const bt = computed(() => whatIf.backtest.value)
const failed = computed(() => loaded.value && whatIf.status.value === 'error')
const hasExclusions = computed(() => whatIf.excluded.value.size > 0)

// Switches
const linesOf = computed(() => categoriesByTicker(data.tags.value, data.selectedIds.value))
const lineRows = computed(() =>
  whatIf.exposuresBefore.value.map((e) => ({
    id: e.category,
    label: catalog.label(e.category),
    color: catalog.color(e.category),
    usd: e.usd,
    count: e.count,
    on: demo.exclusions.categories.includes(e.category),
  })),
)
const allOff = computed(() => lineRows.value.length > 0 && lineRows.value.every((l) => l.on))
// A company gets a switch if it crosses a selected line, or was already switched off by hand.
const companyRows = computed(() => data.rows.value.filter((r) => linesOf.value.has(r.ticker) || demo.exclusions.tickers.includes(r.ticker)))
const viaLine = (ticker: string) => (linesOf.value.get(ticker) ?? []).filter((c) => demo.exclusions.categories.includes(c))
const companySub = (ticker: string, weight: number) => {
  const via = viaLine(ticker)
  if (via.length) return `Off with ${via.map(catalog.label).join(', ')}`
  return `${share(weight, 2)} · ${(linesOf.value.get(ticker) ?? []).map(catalog.label).join(', ') || 'Not on your lines now'}`
}
const offCount = computed(() => companyRows.value.filter((r) => whatIf.excluded.value.has(r.ticker)).length)

// Back-test
const points = computed(() => whatIf.points.value)
const shown = useTween(points)
const verdict = computed(() => {
  if (whatIf.pending.value) return 'Recalculating for your latest change…'
  if (!hasExclusions.value) return 'Nothing switched off yet. Pick a line or a company on the right.'
  if (Math.abs(points.value) < 0.005) return 'In this back-test the exclusions made no real difference to the yearly return.'
  return `In this back-test the exclusions ${points.value < 0 ? 'cost' : 'added'} ${Math.abs(points.value).toFixed(2)} points a year.`
})
const span = computed(() => {
  const d = bt.value?.dates
  if (!d?.length) return ''
  const f = (s: string) => new Date(s).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
  return `${f(d[0])} – ${f(d[d.length - 1])}`
})
const tracksBenchmark = computed(() => !!bt.value && bt.value.original.every((v, i) => Math.abs(v - bt.value!.benchmark[i]) < 0.5))

// Chart
const W = 720
const H = 320
const PAD = { l: 56, r: 12, t: 12, b: 34 }
const N = computed(() => bt.value?.dates.length ?? 0)
const range = computed(() => {
  if (!bt.value) return { lo: 0, hi: 1, ticks: [] as number[] }
  const all = [...bt.value.original, ...bt.value.filtered, ...bt.value.benchmark]
  const step = 2500
  const lo = Math.floor(Math.min(...all) / step) * step
  const hi = Math.ceil(Math.max(...all) / step) * step
  const every = Math.max(step, Math.ceil((hi - lo) / 4 / step) * step)
  const ticks: number[] = []
  for (let t = lo; t <= hi; t += every) ticks.push(t)
  return { lo, hi: Math.max(hi, lo + step), ticks }
})
const x = (i: number) => PAD.l + (N.value > 1 ? i / (N.value - 1) : 0) * (W - PAD.l - PAD.r)
const y = (v: number) => PAD.t + (1 - (v - range.value.lo) / (range.value.hi - range.value.lo)) * (H - PAD.t - PAD.b)
const path = (s: number[]) => s.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')
const series = computed(() =>
  bt.value
    ? [
        { key: 'original', label: 'As it is', color: C.original, values: bt.value.original, dash: true },
        { key: 'filtered', label: 'With your exclusions', color: C.filtered, values: bt.value.filtered, dash: false },
        { key: 'benchmark', label: 'S&P 500', color: C.benchmark, values: bt.value.benchmark, dash: false },
      ]
    : [],
)
const years = computed(() => {
  const d = bt.value?.dates ?? []
  const out: { yr: string; i: number }[] = []
  d.forEach((s, i) => {
    const yr = s.slice(0, 4)
    if (!out.some((o) => o.yr === yr) && i > 0 && d[i - 1].slice(0, 4) !== yr) out.push({ yr, i })
  })
  return out
})
const at = ref(0)
watch(N, (n) => (at.value = Math.max(0, n - 1)), { immediate: true })
const dateAt = (i: number) => (bt.value?.dates[i] ? new Date(bt.value.dates[i]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : '')
function hover(e: MouseEvent) {
  const r = (e.currentTarget as SVGElement).getBoundingClientRect()
  const px = ((e.clientX - r.left) / r.width) * W
  at.value = Math.max(0, Math.min(N.value - 1, Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * (N.value - 1))))
}
const chartSummary = computed(() =>
  bt.value ? `Growth of $10,000. As it is: ${whole(bt.value.original.at(-1)!)}. With your exclusions: ${whole(bt.value.filtered.at(-1)!)}. S&P 500: ${whole(bt.value.benchmark.at(-1)!)}.` : '',
)

// Exposure before and after
const ofMoney = (usd: number) => (data.portfolio.value?.totalUsd ? usd / data.portfolio.value.totalUsd : 0)
const barWidth = (usd: number) => `${Math.max(whatIf.before.value.usd > 0 ? (usd / whatIf.before.value.usd) * 100 : 0, usd > 0 ? 1 : 0)}%`

// Options for an excluded company: same sector, nothing on your lines
const excludedRows = computed(() => data.rows.value.filter((r) => whatIf.excluded.value.has(r.ticker)))
const optionsFor = ref<string | null>(null)
const optRow = computed(() => excludedRows.value.find((r) => r.ticker === optionsFor.value) ?? null)
const options = shallowRef<{ security: Security; effect: number | null }[] | 'loading' | 'error'>('loading')
let request = 0
async function loadOptions() {
  const ticker = optionsFor.value
  const portfolio = data.portfolio.value
  const mine = ++request
  if (!ticker || !portfolio) return
  options.value = 'loading'
  const { [ticker]: _own, ...otherSwaps } = demo.exclusions.swaps
  const exclusions = { ...demo.exclusions, swaps: otherSwaps }
  try {
    const found = await provider.getAlternatives(ticker, data.selectedIds.value)
    if (mine !== request) return
    options.value = found.map((security) => ({ security, effect: null }))
    const [base, ...each] = await Promise.all([
      provider.getBacktest(portfolio, exclusions),
      ...found.map((alt) => provider.getBacktest(portfolio, { ...exclusions, swaps: { ...otherSwaps, [ticker]: alt.ticker } })),
    ])
    if (mine !== request) return
    options.value = found.map((security, i) => ({ security, effect: each[i].annualizedPct.filtered - base.annualizedPct.filtered }))
  } catch {
    if (mine === request) options.value = 'error'
  }
}
watch(optionsFor, loadOptions)
watch(excludedRows, (rows) => {
  if (optionsFor.value && !rows.some((r) => r.ticker === optionsFor.value)) optionsFor.value = null
})
const optList = computed(() => (Array.isArray(options.value) ? options.value : []))
</script>

<template>
  <AppShell active="whatif" title="What if you cut them?" body="Switch off lines or single companies. See what it would have done against the S&P 500, before anything changes.">
    <p v-if="demo.portfolio" class="label crumb">{{ name }} · What-if · {{ demo.dataLabel }}</p>

    <div v-if="!demo.portfolio" class="empty">
      <p class="display">No fund yet.</p>
      <p class="dim">Check a fund or a few tickers first.</p>
      <RouterLink to="/check" class="btn btn-primary">Check a Fund</RouterLink>
    </div>
    <div v-else-if="!demo.account && !demo.isConnected" class="empty">
      <p class="display">Save your lines first.</p>
      <p class="dim">What-if comes with a free account.</p>
      <RouterLink to="/check/receipt?dialog=save" class="btn btn-primary">Create Free Account</RouterLink>
    </div>
    <div v-else-if="data.status.value === 'error'" class="card-pad err" role="alert">
      <span class="tag" style="align-self: flex-start"><i class="dot" style="background: var(--flare)" />Data unavailable</span>
      <b>Your holdings didn’t load.</b>
      <p class="dim">Rally won’t show old numbers. Your switches are saved.</p>
      <button class="btn btn-primary" style="align-self: flex-start" @click="data.reload()">Try Again</button>
    </div>
    <div v-else-if="!loaded" class="grid" aria-busy="true">
      <div class="col"><div class="sk" style="height: 220px" /><div class="sk" style="height: 420px" /></div>
      <aside class="side"><div class="sk" style="height: 520px" /></aside>
    </div>

    <div v-else class="grid">
      <div class="col">
        <section v-if="failed" class="card-pad block" role="alert">
          <span class="tag" style="align-self: flex-start"><i class="dot" style="background: var(--flare)" />Back-test unavailable</span>
          <h3>The back-test didn’t come through.</h3>
          <p class="dim bs">Rally won’t show old returns. Your switches are saved, so change them on the right or try again.</p>
          <div class="btns">
            <button class="btn btn-primary btn-sm" @click="whatIf.recalculate()">Try Again</button>
            <button class="btn btn-secondary btn-sm" @click="demo.clearExclusions()">Clear Everything</button>
          </div>
        </section>

        <!-- Back-test -->
        <section v-else class="card-pad block results" :class="{ pending: whatIf.pending.value }" aria-live="polite" :aria-busy="!bt || whatIf.pending.value">
          <div class="bh"><h3>Back-tested return, a year</h3><span class="label">{{ bt ? span : 'Running the back-test…' }}</span></div>
          <template v-if="bt">
            <div class="big-row">
              <p class="display big points" :class="{ up: shown > 0.004 }">{{ signed(shown) }}</p>
              <div>
                <p class="bl">points a year, with your exclusions</p>
                <p class="dim bs">{{ verdict }}</p>
              </div>
            </div>
            <dl class="trio">
              <div><dt class="lg"><i :style="{ background: C.original }" />As it is</dt><dd class="mono v">{{ bt.annualizedPct.original.toFixed(2) }}%</dd></div>
              <div><dt class="lg"><i :style="{ background: C.filtered }" />With your exclusions</dt><dd class="mono v sun">{{ bt.annualizedPct.filtered.toFixed(2) }}%</dd></div>
              <div><dt class="lg"><i :style="{ background: C.benchmark }" />S&amp;P 500</dt><dd class="mono v">{{ bt.annualizedPct.benchmark.toFixed(2) }}%</dd></div>
            </dl>
          </template>
          <template v-else><div class="sk" style="height: 96px; width: 60%" /><div class="sk" style="height: 60px" /></template>
        </section>

        <!-- Growth chart -->
        <section v-if="!failed" class="card-pad block">
          <div class="bh"><h3>Growth of $10,000</h3><span class="label">Hover, or use the slider</span></div>
          <template v-if="bt">
            <div class="chart-row">
              <svg :viewBox="`0 0 ${W} ${H}`" class="chart" role="img" :aria-label="chartSummary" @mousemove="hover">
                <g v-for="t in range.ticks" :key="t">
                  <line :x1="PAD.l" :x2="W - PAD.r" :y1="y(t)" :y2="y(t)" class="grid-l" />
                  <text :x="PAD.l - 10" :y="y(t) + 4" class="ax" text-anchor="end">${{ (t / 1000).toFixed(t % 1000 ? 1 : 0) }}K</text>
                </g>
                <text v-for="yy in years" :key="yy.yr" :x="x(yy.i)" :y="H - 8" class="ax" text-anchor="middle">{{ yy.yr }}</text>
                <path v-for="s in series" :key="s.key" :d="path(s.values)" class="ln chart-line" :class="s.key" :stroke="s.color" :stroke-dasharray="s.dash ? '4 5' : undefined" />
                <line :x1="x(at)" :x2="x(at)" :y1="PAD.t" :y2="H - PAD.b" class="cursor" />
                <circle v-for="s in series" :key="s.key" :cx="x(at)" :cy="y(s.values[at])" r="5" class="pt" :fill="s.color" />
              </svg>
              <div class="readout">
                <p class="label">{{ dateAt(at) }}</p>
                <p v-for="s in series" :key="s.key"><span class="lg"><i :style="{ background: s.color }" />{{ s.label }}</span><b class="mono">{{ whole(s.values[at]) }}</b></p>
              </div>
            </div>
            <label class="slider">
              <span class="label">Read the values at a date</span>
              <input v-model.number="at" type="range" min="0" :max="N - 1" :style="{ '--p': (N > 1 ? (at / (N - 1)) * 100 : 100) + '%' }" aria-label="Date" />
            </label>
            <p class="caption">
              Back-test on Alpaca historical prices. Past results don’t predict future returns.
              <template v-if="tracksBenchmark"> {{ name }} tracks the S&amp;P 500, so “As it is” and “S&amp;P 500” are the same line here.</template>
            </p>
          </template>
          <div v-else class="sk" style="height: 320px" />
        </section>

        <!-- Exposure -->
        <section class="card-pad block">
          <div class="bh"><h3>Crossing your lines, before and after</h3><span class="label">{{ plural(data.selectedIds.value.length, 'line') }} · each holding counted once</span></div>
          <div class="bar-h"><span>Before</span><span class="mono">{{ whole(whatIf.before.value.usd) }} · {{ share(ofMoney(whatIf.before.value.usd)) }}</span></div>
          <div class="track"><i :style="{ width: barWidth(whatIf.before.value.usd), background: '#8a8594' }" /></div>
          <div class="bar-h"><span>After</span><span class="mono">{{ whole(whatIf.after.value.usd) }} · {{ share(ofMoney(whatIf.after.value.usd)) }}</span></div>
          <div class="track"><i :style="{ width: barWidth(whatIf.after.value.usd), background: 'var(--sun)' }" /></div>
          <p class="caption">
            {{ plural(whatIf.before.value.count, 'holding') }} cross your lines before, {{ whatIf.after.value.count }} after. Weight you switch off is spread across what remains, in proportion to
            what you already hold.
          </p>
        </section>

        <!-- Options -->
        <section class="card-pad block">
          <div class="bh top">
            <div>
              <h3>Options for what you switched off</h3>
              <p class="dim bs">Same sector, nothing on your lines. Swap one in and it takes the excluded holding’s weight.</p>
            </div>
            <span class="tag"><i class="dot" style="background: var(--sun)" />Options, not recommendations</span>
          </div>
          <p v-if="!excludedRows.length" class="caption">Switch off a line or a company to see options here.</p>
          <div v-for="c in excludedRows.slice(0, 12)" :key="c.ticker" class="opt">
            <span class="tk mono">{{ c.ticker }}</span>
            <span class="t">
              <b>{{ data.nameOf(c.ticker) }}</b>
              <small v-if="whatIf.plan.value.swaps[c.ticker]">Swapped for {{ whatIf.plan.value.swaps[c.ticker] }} · {{ share(c.weight, 2) }} · {{ whole(c.valueUsd) }}</small>
              <small v-else>{{ share(c.weight, 2) }} · {{ whole(c.valueUsd) }} · its weight is spread across what remains</small>
            </span>
            <button class="btn btn-secondary btn-sm" @click="optionsFor = c.ticker">{{ whatIf.plan.value.swaps[c.ticker] ? 'Change' : 'See Options' }}</button>
          </div>
          <p v-if="excludedRows.length > 12" class="caption">And {{ excludedRows.length - 12 }} more switched off.</p>
        </section>

        <!-- Act -->
        <section class="card-pad act">
          <div>
            <h3>Ready to act on it?</h3>
            <p class="dim bs">See the trades that would carry out this what-if. Nothing is sent without your approval.</p>
          </div>
          <RouterLink to="/basket" class="btn btn-primary" :class="{ off: !hasExclusions }">Build Basket</RouterLink>
        </section>
        <p class="caption tax"><i class="dot" style="background: var(--sun)" /> Selling can trigger a tax bill. This is a what-if: nothing has been sold.</p>
      </div>

      <aside class="side">
        <section class="card-pad block">
          <div class="bh"><h3>Switch off a line</h3><span class="label">{{ demo.exclusions.categories.length }} of {{ lineRows.length }} off</span></div>
          <div v-for="l in lineRows" :key="l.id" class="tr">
            <i class="dot" :style="{ background: l.color, width: '10px', height: '10px' }" />
            <span class="t"><b>{{ l.label }}</b><small>{{ l.count ? `${plural(l.count, 'holding')} · ${whole(l.usd)}` : 'Nothing you hold' }}</small></span>
            <Toggle :model-value="l.on" :label="l.label" @update:model-value="demo.toggleExcludedCategory(l.id)" />
          </div>
          <div class="btns">
            <button class="btn btn-secondary btn-sm" :disabled="allOff" @click="demo.setExcludedCategories(lineRows.map((l) => l.id))">Switch Off All {{ lineRows.length }}</button>
            <button class="btn btn-secondary btn-sm" :disabled="!demo.exclusions.categories.length && !demo.exclusions.tickers.length" @click="demo.clearExclusions()">Clear Everything</button>
          </div>
          <p class="caption">Lines come from <RouterLink to="/lines" class="lnk">Lines</RouterLink>. Switching one off here doesn’t remove it there.</p>
        </section>

        <section class="card-pad block">
          <div class="bh"><h3>Switch off a company</h3><span class="label">{{ offCount }} of {{ companyRows.length }} off</span></div>
          <p v-if="!companyRows.length" class="dim bs">Nothing you hold crosses your lines.</p>
          <div class="companies">
            <div v-for="c in companyRows" :key="c.ticker" class="tr">
              <span class="tk mono">{{ c.ticker }}</span>
              <span class="t"><b>{{ data.nameOf(c.ticker) }}</b><small><i class="dot" :style="{ background: catalog.color((linesOf.get(c.ticker) ?? [])[0]) }" /> {{ companySub(c.ticker, c.weight) }}</small></span>
              <Toggle
                :model-value="whatIf.excluded.value.has(c.ticker)"
                :disabled="viaLine(c.ticker).length > 0"
                :label="data.nameOf(c.ticker)"
                @update:model-value="demo.toggleExcludedTicker(c.ticker)"
              />
            </div>
          </div>
        </section>
      </aside>
    </div>
  </AppShell>

  <Modal v-if="optRow" :title="`Options for ${data.nameOf(optRow.ticker)}`" @close="optionsFor = null">
    <p class="dim bs">Same sector, nothing on your lines. These are options, not recommendations.</p>
    <p v-if="options === 'loading'" class="caption">Looking for options…</p>
    <p v-else-if="options === 'error'" class="caption">The options didn’t load. <button class="btn-link" @click="loadOptions()">Try Again</button></p>
    <p v-else-if="!optList.length" class="caption">No company in the same sector is clear of your lines.</p>
    <div v-else class="list">
      <div v-for="o in optList" :key="o.security.ticker" class="opt in-modal">
        <span class="tk mono">{{ o.security.ticker }}</span>
        <span class="t">
          <b>{{ o.security.name }}</b>
          <small>{{ o.security.sector }} · would take {{ share(optRow.weight, 2) }}<template v-if="o.effect !== null"> · {{ signed(o.effect) }} pts a year</template></small>
        </span>
        <button
          class="btn btn-sm"
          :class="whatIf.plan.value.swaps[optRow.ticker] === o.security.ticker ? 'btn-primary' : 'btn-secondary'"
          @click="whatIf.plan.value.swaps[optRow.ticker] === o.security.ticker ? demo.undoSwap(optRow.ticker) : demo.swap(optRow.ticker, o.security.ticker)"
        >
          {{ whatIf.plan.value.swaps[optRow.ticker] === o.security.ticker ? 'Swapped In' : 'Swap In' }}
        </button>
      </div>
    </div>
    <button class="btn btn-primary btn-block" @click="optionsFor = null">Done</button>
    <p class="caption">The effect compares the back-test with this swap against the back-test without it. Live prices; sample line tags.</p>
  </Modal>
</template>

<style scoped>
.crumb { margin-top: -18px; }
.grid { display: grid; grid-template-columns: 800px 456px; justify-content: space-between; gap: 24px; align-items: start; }
.col, .side { display: flex; flex-direction: column; gap: 20px; }
.side { position: sticky; top: 100px; }
.block { padding: 22px 22px 20px; gap: 16px; }
.bh { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; }
.bh.top { align-items: flex-start; }
.bh .tag { white-space: nowrap; flex: none; }
.bh h3, .act h3, .block > h3 { font-weight: 600; font-size: 20px; color: var(--white); }
.results.pending .big-row, .results.pending .trio { opacity: 0.45; transition: opacity 0.15s; }
.big-row { display: flex; align-items: center; gap: 24px; }
.big { font-size: 96px; color: var(--cream); text-transform: none; min-width: 210px; transition: color 0.3s; }
.big.up { color: var(--green); }
.bl { font-weight: 500; font-size: 20px; color: var(--white); }
.bs { font-size: 15px; line-height: 1.45; margin-top: 4px; }
.trio { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.trio > div { border-top: 1px solid var(--line); padding-top: 14px; display: flex; flex-direction: column; gap: 8px; }
.lg { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; font-size: 14px; color: var(--white); }
.lg i { width: 14px; height: 3px; border-radius: 2px; }
.v { font-size: 26px; color: var(--cream); }
.sun { color: var(--sun) !important; }
.chart-row { display: grid; grid-template-columns: 1fr 170px; gap: 12px; align-items: center; }
.chart { width: 100%; height: auto; cursor: crosshair; }
.grid-l { stroke: var(--line); stroke-width: 1; }
.ax { fill: var(--mute); font-family: var(--mono); font-size: 11px; }
.ln { fill: none; stroke-linejoin: round; stroke-width: 2.2; }
.ln.original { stroke-width: 1.6; }
.ln.filtered { stroke-width: 2.6; }
.cursor { stroke: rgba(255, 255, 255, 0.25); stroke-dasharray: 3 4; }
.pt { stroke: var(--surf); stroke-width: 2; }
.readout { display: flex; flex-direction: column; gap: 10px; }
.readout p:not(.label) { display: flex; flex-direction: column; gap: 2px; }
.readout b { font-weight: 500; font-size: 16px; color: var(--white); }
.readout .lg { font-weight: 500; font-size: 12px; color: var(--dim); }
.slider { display: flex; flex-direction: column; gap: 10px; }
.slider input { -webkit-appearance: none; appearance: none; height: 6px; border-radius: 3px; background: linear-gradient(90deg, var(--link) var(--p), #34313d var(--p)); outline: none; }
.slider input::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%; background: var(--cream); border: 4px solid var(--link); cursor: grab; }
.slider input::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: var(--cream); border: 4px solid var(--link); }
.bar-h { display: flex; justify-content: space-between; font-weight: 500; font-size: 15px; color: var(--white); margin-bottom: -6px; }
.track { height: 10px; border-radius: 5px; background: #2c2a35; overflow: hidden; }
.track i { display: block; height: 100%; border-radius: 5px; transition: width 0.45s cubic-bezier(0.2, 0.7, 0.2, 1); }
.opt { display: flex; align-items: center; gap: 14px; padding: 12px 0; border-top: 1px solid var(--line); }
.opt.in-modal { padding: 12px 16px 12px 0; }
.opt.in-modal:first-child { border-top: 0; }
.tk { width: 44px; height: 44px; border-radius: 12px; background: #34313d; display: grid; place-items: center; font-weight: 500; font-size: 11px; color: var(--cream); flex: none; }
.t { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.t b { font-weight: 600; font-size: 16px; color: var(--white); }
.t small { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--dim); }
.act { flex-direction: row; justify-content: space-between; align-items: center; gap: 24px; padding: 24px; }
.act .off { opacity: 0.4; pointer-events: none; }
.tax { display: flex; align-items: center; gap: 8px; }
.tr { display: flex; align-items: center; gap: 14px; padding: 10px 0; border-top: 1px solid var(--line); }
.companies { max-height: 560px; overflow-y: auto; margin-right: -8px; padding-right: 8px; }
.btns { display: flex; gap: 10px; flex-wrap: wrap; }
.btns .btn:disabled { opacity: 0.4; pointer-events: none; }
.lnk { color: var(--link); }
.empty { display: flex; flex-direction: column; align-items: flex-start; gap: 14px; margin-top: 20px; }
.empty .display { font-size: 72px; color: var(--cream); }
.err { gap: 12px; max-width: 640px; }
.err b { font-size: 20px; color: var(--white); }
.sk { border-radius: 20px; background: linear-gradient(90deg, #2a2832, #34313d, #2a2832); background-size: 200% 100%; animation: shimmer 1.4s linear infinite; }
@keyframes shimmer { to { background-position: -200% 0; } }
</style>
