<script setup lang="ts">
// "Growth of $10,000": a line per series over the back-test window.
// Hand-drawn SVG, no chart library. One y-axis; 2px lines; hairline grid; a legend plus a
// direct label at the end of each line; a crosshair with one readout for every series, moved by
// the pointer or by a slider (a native control, so it works with a keyboard and a screen
// reader alike); and the same numbers as a table.
import { usd } from '@/utils/format'
import { computed, ref } from 'vue'

export interface ChartSeries {
  key: string
  label: string
  /** Line colour. Text never uses it: labels and values stay in text tokens. */
  color: string
  values: number[]
}

const props = defineProps<{
  /** ISO dates, oldest first, aligned with every series' values */
  dates: string[]
  series: ChartSeries[]
  /** Sentence for screen readers describing what the chart shows */
  summary: string
}>()

// Drawing box, in SVG units, sized to the card it sits in (about 750px wide) so text renders
// close to its stated size. The right margin holds the end-of-line labels.
const W = 752
const H = 340
const M = { top: 16, right: 150, bottom: 34, left: 54 }
const plotW = W - M.left - M.right
const plotH = H - M.top - M.bottom
const SLIDER_STEP = 21 // about one month of trading days per arrow key
const MIN_LABEL_GAP = 30

const n = computed(() => props.dates.length)

/** A step of 1, 2, 2.5 or 5 times a power of ten that gives about `count` ticks. */
function niceStep(span: number, count: number) {
  const raw = span / count
  const power = 10 ** Math.floor(Math.log10(raw))
  const unit = raw / power
  return (unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 2.5 ? 2.5 : unit <= 5 ? 5 : 10) * power
}

const scale = computed(() => {
  let lo = Infinity
  let hi = -Infinity
  for (const s of props.series) {
    for (const v of s.values) {
      if (v < lo) lo = v
      if (v > hi) hi = v
    }
  }
  if (!Number.isFinite(lo)) return { lo: 0, hi: 1, ticks: [0, 1] }
  const step = niceStep(Math.max(hi - lo, 1), 4)
  const min = Math.floor(lo / step) * step
  const max = Math.ceil(hi / step) * step
  const ticks: number[] = []
  for (let t = min; t <= max + step / 2; t += step) ticks.push(t)
  return { lo: min, hi: max, ticks }
})

const x = (i: number) => M.left + (n.value > 1 ? (i / (n.value - 1)) * plotW : 0)
const y = (v: number) => M.top + plotH - ((v - scale.value.lo) / (scale.value.hi - scale.value.lo || 1)) * plotH

const paths = computed(() =>
  props.series.map((s) => ({ ...s, d: s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join('') })),
)

// One tick at the first trading day of each calendar year.
const years = computed(() => {
  const out: { index: number; label: string }[] = []
  props.dates.forEach((date, i) => {
    const year = date.slice(0, 4)
    if (i > 0 && props.dates[i - 1].slice(0, 4) !== year) out.push({ index: i, label: year })
  })
  return out
})

// Compact ("$15K") on an axis that reaches $10,000 and whose ticks are whole hundreds; in full
// otherwise, so two ticks never share a label. One style per axis.
const compact = computed(() => scale.value.hi >= 10_000 && scale.value.ticks.every((t) => t % 100 === 0))
const tickLabel = (value: number) => (compact.value ? `$${(value / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}K` : usd(value))

// Labels at the end of each line, nudged apart so they never overlap.
const endLabels = computed(() => {
  const labels = props.series
    .map((s) => ({ key: s.key, label: s.label, value: s.values[s.values.length - 1], at: y(s.values[s.values.length - 1]) }))
    .sort((a, b) => a.at - b.at)
  for (let i = 1; i < labels.length; i++) labels[i].at = Math.max(labels[i].at, labels[i - 1].at + MIN_LABEL_GAP)
  const overflow = labels.length ? labels[labels.length - 1].at - (M.top + plotH) : 0
  if (overflow > 0) for (const l of labels) l.at -= overflow
  return labels
})

// The pointer and the slider share one index.
const active = ref<number | null>(null)
const svg = ref<SVGSVGElement | null>(null)
const sliding = ref(false)

function indexAt(clientX: number) {
  const box = svg.value!.getBoundingClientRect()
  const px = ((clientX - box.left) / box.width) * W
  return Math.min(n.value - 1, Math.max(0, Math.round(((px - M.left) / plotW) * (n.value - 1))))
}
function onSlide(event: Event) {
  active.value = Math.min(n.value - 1, Number((event.target as HTMLInputElement).value))
}
/** Moving the pointer away keeps the readout while the slider has focus. */
function onPointerLeave() {
  if (!sliding.value) active.value = null
}

const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
const formatDate = (iso: string) => dateFormat.format(new Date(`${iso}T00:00:00Z`))

const readout = computed(() => {
  if (active.value === null || !n.value) return null
  const i = active.value
  return {
    date: formatDate(props.dates[i]),
    left: (x(i) / W) * 100,
    flip: x(i) > M.left + plotW * 0.6,
    rows: props.series.map((s) => ({ key: s.key, label: s.label, color: s.color, value: s.values[i], cy: y(s.values[i]) })),
  }
})

/** What the slider says it is on: the date and every series' value there. */
const valueText = computed(() => {
  const i = active.value ?? n.value - 1
  if (!n.value) return ''
  return `${formatDate(props.dates[i])}: ${props.series.map((s) => `${s.label} ${usd(s.values[i])}`).join(', ')}`
})

// The table view: the start, the last trading day of each year, and the end.
const tableRows = computed(() => {
  if (!n.value) return []
  const picks = new Set<number>([0, n.value - 1])
  for (const { index } of years.value) picks.add(index - 1)
  return [...picks].sort((a, b) => a - b).map((i) => ({ date: formatDate(props.dates[i]), values: props.series.map((s) => s.values[i]) }))
})
</script>

<template>
  <figure class="chart">
    <ul class="chart__legend" aria-hidden="true">
      <li v-for="s in series" :key="s.key"><span class="chart__key" :style="{ background: s.color }" />{{ s.label }}</li>
    </ul>

    <div v-if="n" class="chart__plot">
      <svg ref="svg" :viewBox="`0 0 ${W} ${H}`" role="img" :aria-label="summary" @pointermove="active = indexAt($event.clientX)" @pointerleave="onPointerLeave">
        <!-- grid and axes: hairline, recessive -->
        <g class="chart__grid">
          <line v-for="tick in scale.ticks" :key="tick" :x1="M.left" :x2="M.left + plotW" :y1="y(tick)" :y2="y(tick)" />
        </g>
        <g class="chart__ticks">
          <text v-for="tick in scale.ticks" :key="tick" :x="M.left - 10" :y="y(tick)" text-anchor="end" dominant-baseline="middle">{{ tickLabel(tick) }}</text>
          <text v-for="year in years" :key="year.label" :x="x(year.index)" :y="H - 10" text-anchor="middle">{{ year.label }}</text>
        </g>

        <!-- the lines -->
        <path v-for="p in paths" :key="p.key" :d="p.d" :stroke="p.color" class="chart__line" />

        <!-- end-of-line labels: series name and final value, in text colours -->
        <g v-for="l in endLabels" :key="l.key" class="chart__end">
          <text :x="M.left + plotW + 12" :y="l.at - 6" class="chart__end-name">{{ l.label }}</text>
          <text :x="M.left + plotW + 12" :y="l.at + 10" class="chart__end-value">{{ usd(l.value) }}</text>
        </g>

        <!-- crosshair -->
        <g v-if="readout && active !== null">
          <line class="chart__cross" :x1="x(active)" :x2="x(active)" :y1="M.top" :y2="M.top + plotH" />
          <circle v-for="row in readout.rows" :key="row.key" :cx="x(active)" :cy="row.cy" r="5" :fill="row.color" class="chart__dot" />
        </g>
      </svg>

      <div v-if="readout" class="chart__tip" :class="{ 'is-flipped': readout.flip }" :style="{ left: `${readout.left}%` }" aria-hidden="true">
        <p class="label-mono">{{ readout.date }}</p>
        <p v-for="row in readout.rows" :key="row.key" class="chart__tip-row">
          <span class="chart__key" :style="{ background: row.color }" />
          <strong>{{ usd(row.value) }}</strong>
          <span>{{ row.label }}</span>
        </p>
      </div>
    </div>

    <label v-if="n" class="chart__slider">
      <span class="label-mono">Read the values at a date</span>
      <input
        type="range"
        min="0"
        :max="n - 1"
        :step="SLIDER_STEP"
        :value="active ?? n - 1"
        :aria-valuetext="valueText"
        @input="onSlide"
        @focus="((sliding = true), (active ??= n - 1))"
        @blur="((sliding = false), (active = null))"
      />
    </label>

    <figcaption class="chart__caption">
      <slot />
      <details class="chart__table">
        <summary>View as a table</summary>
        <table>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th v-for="s in series" :key="s.key" scope="col" class="num">{{ s.label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in tableRows" :key="row.date">
              <th scope="row">{{ row.date }}</th>
              <td v-for="(value, i) in row.values" :key="i" class="num">{{ usd(value) }}</td>
            </tr>
          </tbody>
        </table>
      </details>
    </figcaption>
  </figure>
</template>

<style scoped>
.chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}
.chart__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 22px;
  font-size: 14px;
  font-weight: 500;
}
.chart__legend li {
  display: flex;
  align-items: center;
  gap: 8px;
}
/* A short stroke of the series colour, not a box */
.chart__key {
  flex: none;
  width: 16px;
  height: 3px;
  border-radius: 2px;
}
.chart__plot {
  position: relative;
}
svg {
  display: block;
  width: 100%;
  height: auto;
  border-radius: var(--radius-sm);
  touch-action: pan-y;
}
.chart__grid line {
  stroke: var(--hairline);
  stroke-width: 1;
}
.chart__ticks text {
  fill: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 12px;
}
.chart__line {
  fill: none;
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
}
.chart__end-name {
  fill: var(--text-muted);
  font-size: 12px;
  font-weight: 500;
}
.chart__end-value {
  fill: var(--text);
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
}
.chart__cross {
  stroke: var(--border);
  stroke-width: 1;
}
/* 2px ring in the surface colour so a dot stays legible where lines cross */
.chart__dot {
  stroke: var(--surface);
  stroke-width: 2;
}
.chart__tip {
  position: absolute;
  top: 8px;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 210px;
  margin-left: 14px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--ink);
  pointer-events: none;
}
.chart__tip.is-flipped {
  margin-left: -14px;
  transform: translateX(-100%);
}
.chart__tip-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-muted);
}
.chart__tip-row strong {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
}
/* The slider lines up with the plot area so its thumb sits under the crosshair */
.chart__slider {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 calc(150 / 752 * 100%) 0 calc(54 / 752 * 100%);
}
.chart__slider input {
  width: 100%;
  height: 20px;
  margin: 0;
  accent-color: var(--brand-400);
  cursor: pointer;
}
.chart__caption {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-muted);
}
.chart__table summary {
  width: fit-content;
  cursor: pointer;
  color: var(--link);
}
.chart__table table {
  width: 100%;
  margin-top: 10px;
  border-collapse: collapse;
}
.chart__table th,
.chart__table td {
  padding: 8px 10px;
  border-top: 1px solid var(--hairline);
  font-size: 13px;
  font-weight: 400;
  text-align: left;
  color: var(--text);
}
.chart__table thead th {
  border-top: 0;
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.chart__table .num {
  font-family: var(--font-mono);
  text-align: right;
}
</style>
