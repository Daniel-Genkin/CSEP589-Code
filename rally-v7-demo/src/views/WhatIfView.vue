<script setup>
import { computed, ref } from 'vue'
import AppShell from '../components/AppShell.vue'
import Toggle from '../components/Toggle.vue'
import Modal from '../components/Modal.vue'
import { LINES, WHATIF_COMPANIES, ALTERNATIVES, BACKTEST, BACKTEST_START, state } from '../data.js'
import { useTween } from '../tween.js'

// Which holdings are switched off. Starts with ExxonMobil, matching the Basket screen.
const off = ref(['XOM'])
const swaps = ref({})
const isOff = (tk) => off.value.includes(tk)
function flip(tk) {
  const i = off.value.indexOf(tk)
  if (i >= 0) {
    off.value.splice(i, 1)
    delete swaps.value[tk]
  } else off.value.push(tk)
}

const lineRows = computed(() =>
  LINES.filter((l) => WHATIF_COMPANIES.some((c) => c.line === l.id)).map((l) => {
    const cos = WHATIF_COMPANIES.filter((c) => c.line === l.id)
    const w = cos.reduce((s, c) => s + c.w, 0)
    return { ...l, cos, w, allOff: cos.every((c) => isOff(c.tk)) }
  }),
)
function flipLine(row) {
  if (row.allOff) off.value = off.value.filter((tk) => !row.cos.some((c) => c.tk === tk))
  else for (const c of row.cos) if (!isOff(c.tk)) off.value.push(c.tk)
}
const excludeAll = () => (off.value = WHATIF_COMPANIES.map((c) => c.tk))
const clearAll = () => {
  off.value = []
  swaps.value = {}
}

// Back-test
const BASE = 10.55
const delta = computed(() => WHATIF_COMPANIES.filter((c) => isOff(c.tk)).reduce((s, c) => s + c.impact, 0))
const shownDelta = useTween(delta)
const withEx = computed(() => BASE + delta.value)
const fmtPts = (n) => (n > 0.004 ? '+' : n < -0.004 ? '−' : '') + Math.abs(n).toFixed(2)

// Exposure, each holding counted once
const amount = computed(() => state.amount || 2000)
const before = WHATIF_COMPANIES.reduce((s, c) => s + c.w, 0)
const after = computed(() => WHATIF_COMPANIES.filter((c) => !isOff(c.tk)).reduce((s, c) => s + c.w, 0))
const dollars = (pct) => '$' + Math.round((amount.value * pct) / 100).toLocaleString('en-US')

// Chart
const W = 720
const H = 320
const PAD = { l: 52, r: 12, t: 12, b: 34 }
const N = BACKTEST.length
const yMin = 5000
const yMax = 20000
const x = (i) => PAD.l + (i / (N - 1)) * (W - PAD.l - PAD.r)
const y = (v) => PAD.t + (1 - (v - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b)
const withSeries = computed(() => BACKTEST.map((v, i) => v * Math.exp((delta.value / 100) * (i / 52))))
const path = (s) => s.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')
const spPath = path(BACKTEST)
const withPath = computed(() => path(withSeries.value))
const at = ref(N - 1)
const dateAt = (i) => {
  const d = new Date(BACKTEST_START.getTime() + i * 7 * 864e5)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
const money = (v) => '$' + Math.round(v).toLocaleString('en-US')
const years = [2022, 2023, 2024, 2025, 2026].map((yr) => ({ yr, i: Math.round(((new Date(`${yr}-01-01`) - BACKTEST_START) / 864e5 / 7)) }))
function hover(e) {
  const r = e.currentTarget.getBoundingClientRect()
  const px = ((e.clientX - r.left) / r.width) * W
  at.value = Math.max(0, Math.min(N - 1, Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * (N - 1))))
}

// Swap options
const optionsFor = ref(null)
const optCompany = computed(() => WHATIF_COMPANIES.find((c) => c.tk === optionsFor.value))
const excluded = computed(() => WHATIF_COMPANIES.filter((c) => isOff(c.tk)))
const lineOf = (id) => LINES.find((l) => l.id === id)
</script>

<template>
  <AppShell active="whatif" title="What if you cut them?" body="Switch off lines or single companies. See what it would have done against the S&P 500, before anything changes.">
    <p class="label crumb">VOO · What-if · Sample data</p>
    <div class="grid">
      <div class="col">
        <!-- Back-test -->
        <section class="card-pad block">
          <div class="bh"><h3>Back-tested return, a year</h3><span class="label">Nov 2021 – Nov 2026</span></div>
          <div class="big-row">
            <p class="display big" :class="{ up: shownDelta > 0.004, down: shownDelta < -0.004 }">{{ fmtPts(shownDelta) }}</p>
            <div>
              <p class="bl">points a year, with your exclusions</p>
              <p class="dim bs">
                <template v-if="!off.length">Nothing switched off yet. Pick a line or a company on the right.</template>
                <template v-else-if="delta < 0">In this back-test the exclusions cost {{ Math.abs(delta).toFixed(2) }} points a year.</template>
                <template v-else>In this back-test the exclusions added {{ delta.toFixed(2) }} points a year.</template>
              </p>
            </div>
          </div>
          <div class="trio">
            <div><p class="lg"><i style="background: #8a8594" />As it is</p><p class="mono v">{{ BASE.toFixed(2) }}%</p></div>
            <div><p class="lg"><i style="background: var(--sun)" />With your exclusions</p><p class="mono v sun">{{ withEx.toFixed(2) }}%</p></div>
            <div><p class="lg"><i style="background: var(--link)" />S&amp;P 500</p><p class="mono v">{{ BASE.toFixed(2) }}%</p></div>
          </div>
        </section>

        <!-- Growth chart -->
        <section class="card-pad block">
          <div class="bh"><h3>Growth of $10,000</h3><span class="label">Hover, or use the slider</span></div>
          <div class="chart-row">
            <svg :viewBox="`0 0 ${W} ${H}`" class="chart" role="img" aria-label="Growth of $10,000 over five years" @mousemove="hover">
              <g v-for="t in [5000, 10000, 15000, 20000]" :key="t">
                <line :x1="PAD.l" :x2="W - PAD.r" :y1="y(t)" :y2="y(t)" class="grid-l" />
                <text :x="PAD.l - 10" :y="y(t) + 4" class="ax" text-anchor="end">${{ t / 1000 }}K</text>
              </g>
              <text v-for="yy in years" :key="yy.yr" :x="x(yy.i)" :y="H - 8" class="ax" text-anchor="middle">{{ yy.yr }}</text>
              <path :d="spPath" class="ln sp" />
              <path :d="spPath" class="ln asis" />
              <path :d="withPath" class="ln with" />
              <line :x1="x(at)" :x2="x(at)" :y1="PAD.t" :y2="H - PAD.b" class="cursor" />
              <circle :cx="x(at)" :cy="y(BACKTEST[at])" r="5" class="pt sp-pt" />
              <circle :cx="x(at)" :cy="y(withSeries[at])" r="5" class="pt with-pt" />
            </svg>
            <div class="readout">
              <p class="label">{{ dateAt(at) }}</p>
              <p><span class="lg"><i style="background: #8a8594" />As it is</span><b class="mono">{{ money(BACKTEST[at]) }}</b></p>
              <p><span class="lg"><i style="background: var(--sun)" />With exclusions</span><b class="mono sun">{{ money(withSeries[at]) }}</b></p>
              <p><span class="lg"><i style="background: var(--link)" />S&amp;P 500</span><b class="mono">{{ money(BACKTEST[at]) }}</b></p>
            </div>
          </div>
          <label class="slider">
            <span class="label">Read the values at a date</span>
            <input v-model.number="at" type="range" min="0" :max="N - 1" :style="{ '--p': (at / (N - 1)) * 100 + '%' }" aria-label="Date" />
          </label>
          <p class="caption">Sample back-test. Past results don’t predict future returns. VOO tracks the S&amp;P 500, so “As it is” and “S&amp;P 500” are the same line here.</p>
        </section>

        <!-- Exposure -->
        <section class="card-pad block">
          <div class="bh"><h3>Flagged exposure, before and after</h3><span class="label">Each holding counted once</span></div>
          <div class="bar-h"><span>Before</span><span class="mono">{{ dollars(before) }} · {{ before.toFixed(1) }}%</span></div>
          <div class="track"><i :style="{ width: (before / 15) * 100 + '%', background: '#8a8594' }" /></div>
          <div class="bar-h"><span>After</span><span class="mono">{{ dollars(after) }} · {{ after.toFixed(1) }}%</span></div>
          <div class="track"><i :style="{ width: (after / 15) * 100 + '%', background: 'var(--sun)' }" /></div>
          <p class="caption">{{ WHATIF_COMPANIES.length }} holdings cross your lines before, {{ WHATIF_COMPANIES.length - off.length }} after. Weight you switch off is spread across what remains, in proportion to what you already hold.</p>
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
          <p v-if="!excluded.length" class="caption">Switch off a company to see options here.</p>
          <div v-for="c in excluded" :key="c.tk" class="opt">
            <span class="tk mono">{{ c.tk }}</span>
            <span class="t">
              <b>{{ c.name }}</b>
              <small v-if="swaps[c.tk]">Swapped for {{ swaps[c.tk] }} · {{ c.w.toFixed(1) }}% · {{ dollars(c.w) }}</small>
              <small v-else>{{ c.w.toFixed(1) }}% · {{ dollars(c.w) }} · its weight is spread across what remains</small>
            </span>
            <button class="btn btn-secondary btn-sm" @click="optionsFor = c.tk">{{ swaps[c.tk] ? 'Change' : 'See Options' }}</button>
          </div>
        </section>

        <!-- Act -->
        <section class="card-pad act">
          <div>
            <h3>Ready to act on it?</h3>
            <p class="dim bs">See the trades that would carry out this what-if. Nothing is sent without your approval.</p>
          </div>
          <RouterLink to="/basket/order/1" class="btn btn-primary" :class="{ off: !off.length }">Review Trades</RouterLink>
        </section>
      </div>

      <aside class="side">
        <section class="card-pad block">
          <div class="bh"><h3>Switch off a line</h3><span class="label">{{ lineRows.filter((r) => r.allOff).length }} of {{ lineRows.length }} off</span></div>
          <div v-for="r in lineRows" :key="r.id" class="tr">
            <i class="dot" :style="{ background: r.color, width: '10px', height: '10px' }" />
            <span class="t"><b>{{ r.name }}</b><small>{{ r.cos.length }} holding{{ r.cos.length > 1 ? 's' : '' }} · {{ dollars(r.w) }}</small></span>
            <Toggle :model-value="r.allOff" :label="r.name" @update:model-value="flipLine(r)" />
          </div>
          <div class="btns">
            <button class="btn btn-secondary btn-sm" @click="excludeAll">Switch Off All {{ WHATIF_COMPANIES.length }}</button>
            <button class="btn btn-secondary btn-sm" @click="clearAll">Clear Everything</button>
          </div>
          <p class="caption">Lines come from <RouterLink to="/lines" class="lnk">Lines</RouterLink>. Switching one off here doesn’t remove it there.</p>
        </section>

        <section class="card-pad block">
          <div class="bh"><h3>Switch off a company</h3><span class="label">{{ off.length }} of {{ WHATIF_COMPANIES.length }} off</span></div>
          <div v-for="c in WHATIF_COMPANIES" :key="c.tk" class="tr">
            <span class="tk mono">{{ c.tk }}</span>
            <span class="t"><b>{{ c.name }}</b><small><i class="dot" :style="{ background: lineOf(c.line).color }" /> {{ c.w.toFixed(1) }}% · {{ lineOf(c.line).name }}</small></span>
            <Toggle :model-value="isOff(c.tk)" :label="c.name" @update:model-value="flip(c.tk)" />
          </div>
        </section>
      </aside>
    </div>
  </AppShell>

  <Modal v-if="optCompany" :title="`Options for ${optCompany.name}`" @close="optionsFor = null">
    <p class="dim bs">Same sector, nothing on your lines. These are options, not recommendations.</p>
    <div class="list">
      <div v-for="a in ALTERNATIVES[optCompany.sector]" :key="a.tk" class="opt in-modal">
        <span class="tk mono">{{ a.tk }}</span>
        <span class="t"><b>{{ a.name }}</b><small>{{ a.note }} · would take {{ optCompany.w.toFixed(1) }}%</small></span>
        <button class="btn btn-sm" :class="swaps[optCompany.tk] === a.name ? 'btn-primary' : 'btn-secondary'" @click="swaps[optCompany.tk] = a.name">
          {{ swaps[optCompany.tk] === a.name ? 'Swapped In' : 'Swap In' }}
        </button>
      </div>
    </div>
    <button class="btn btn-primary btn-block" @click="optionsFor = null">Done</button>
    <p class="caption">The effect compares the back-test with this swap against the back-test without it. Sample data.</p>
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
.bh h3, .act h3 { font-weight: 600; font-size: 20px; color: var(--white); }
.big-row { display: flex; align-items: center; gap: 24px; }
.big { font-size: 96px; color: var(--cream); text-transform: none; min-width: 210px; transition: color 0.3s; }
.big.down { color: var(--cream); }
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
.ln { fill: none; stroke-linejoin: round; }
.sp { stroke: var(--link); stroke-width: 2.2; }
.asis { stroke: #8a8594; stroke-width: 1.4; stroke-dasharray: 4 5; }
.with { stroke: var(--sun); stroke-width: 2.4; transition: d 0.4s ease; }
.cursor { stroke: rgba(255, 255, 255, 0.25); stroke-dasharray: 3 4; }
.pt { stroke: var(--surf); stroke-width: 2; }
.sp-pt { fill: var(--link); }
.with-pt { fill: var(--sun); }
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
.tr { display: flex; align-items: center; gap: 14px; padding: 10px 0; border-top: 1px solid var(--line); }
.btns { display: flex; gap: 10px; flex-wrap: wrap; }
.lnk { color: var(--link); }
</style>
