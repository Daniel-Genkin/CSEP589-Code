<script setup>
import { formatReturn } from '@/utils/thesis'
import { computed, onBeforeUnmount, onMounted, ref, useId } from 'vue'

const props = defineProps({
  points: { type: Array, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  height: { type: Number, default: 220 },
  basketLabel: { type: String, default: 'Your basket' },
  benchmarkLabel: { type: String, default: 'S&P 500' },
  basketReturn: { type: Number, default: null },
  benchmarkReturn: { type: Number, default: null },
  compact: { type: Boolean, default: false },
})

const root = ref(null)
const width = ref(560)
const hover = ref(null)
const gradientId = `perf-${useId()}`
let observer = null

onMounted(() => {
  width.value = root.value?.clientWidth || 560
  observer = new ResizeObserver(([entry]) => (width.value = Math.max(240, entry.contentRect.width)))
  observer.observe(root.value)
})
onBeforeUnmount(() => observer?.disconnect())

const pad = computed(() => (props.compact ? { l: 40, r: 10, t: 10, b: 22 } : { l: 46, r: 14, t: 12, b: 26 }))

const scale = computed(() => {
  const values = props.points.flatMap((p) => [p.basket, p.benchmark])
  const lo = Math.min(100, ...values)
  const hi = Math.max(100, ...values)
  const span = hi - lo || 10
  const step = [5, 10, 20, 25, 50, 100].find((s) => span / s <= 4) ?? 200
  const min = Math.floor((lo - span * 0.04) / step) * step
  const max = Math.ceil((hi + span * 0.04) / step) * step
  const ticks = []
  for (let v = min; v <= max + 0.001; v += step) ticks.push(v)
  return { min, max, ticks }
})

const plotW = computed(() => width.value - pad.value.l - pad.value.r)
const plotH = computed(() => props.height - pad.value.t - pad.value.b)
const x = (i) => pad.value.l + (props.points.length > 1 ? (i / (props.points.length - 1)) * plotW.value : plotW.value / 2)
const y = (v) => pad.value.t + (1 - (v - scale.value.min) / (scale.value.max - scale.value.min)) * plotH.value

const pathFor = (key) => props.points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(' ')
const basketPath = computed(() => pathFor('basket'))
const benchmarkPath = computed(() => pathFor('benchmark'))
const areaPath = computed(
  () => `${basketPath.value} L${x(props.points.length - 1).toFixed(1)},${(pad.value.t + plotH.value).toFixed(1)} L${x(0).toFixed(1)},${(pad.value.t + plotH.value).toFixed(1)} Z`,
)

const last = computed(() => props.points.at(-1))
const ahead = computed(() => last.value.basket >= last.value.benchmark)
const legendBasket = computed(() => formatReturn(props.basketReturn ?? last.value.basket - 100))
const legendBenchmark = computed(() => formatReturn(props.benchmarkReturn ?? last.value.benchmark - 100))

function dateAt(i) {
  const start = Date.parse(props.startDate)
  const end = Date.parse(props.endDate)
  const t = props.points.length > 1 ? start + ((end - start) * i) / (props.points.length - 1) : end
  return new Date(t).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function onMove(event) {
  const rect = event.currentTarget.getBoundingClientRect()
  const px = ((event.clientX - rect.left) / rect.width) * width.value
  const i = Math.round(((px - pad.value.l) / plotW.value) * (props.points.length - 1))
  hover.value = Math.min(props.points.length - 1, Math.max(0, i))
}

const tip = computed(() => {
  if (hover.value === null) return null
  const p = props.points[hover.value]
  const left = x(hover.value)
  return {
    left,
    alignRight: left > width.value * 0.62,
    date: hover.value === props.points.length - 1 ? 'Today' : dateAt(hover.value),
    basket: formatReturn(p.basket - 100),
    benchmark: formatReturn(p.benchmark - 100),
  }
})
</script>

<template>
  <div ref="root" class="chart" :class="{ 'chart--compact': compact }">
    <div class="chart__legend">
      <span class="chart__key chart__key--basket">{{ basketLabel }} <strong class="num">{{ legendBasket }}</strong></span>
      <span class="chart__key chart__key--benchmark">{{ benchmarkLabel }} <strong class="num">{{ legendBenchmark }}</strong></span>
    </div>
    <div class="chart__plot">
      <svg
        :width="width"
        :height="height"
        :viewBox="`0 0 ${width} ${height}`"
        role="img"
        :aria-label="`${basketLabel} ${legendBasket} versus ${benchmarkLabel} ${legendBenchmark}`"
        @pointermove="onMove"
        @pointerleave="hover = null"
      >
        <defs>
          <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" :stop-color="ahead ? '#354BF4' : '#D6472B'" stop-opacity="0.2" />
            <stop offset="1" :stop-color="ahead ? '#354BF4' : '#D6472B'" stop-opacity="0" />
          </linearGradient>
        </defs>
        <g class="chart__grid">
          <g v-for="tick in scale.ticks" :key="tick">
            <line :x1="pad.l" :x2="width - pad.r" :y1="y(tick)" :y2="y(tick)" :class="{ 'is-base': tick === 100 }" />
            <text :x="pad.l - 8" :y="y(tick) + 4" text-anchor="end">{{ tick === 100 ? '0%' : formatReturn(tick - 100).replace('.0', '') }}</text>
          </g>
        </g>
        <path :d="areaPath" :fill="`url(#${gradientId})`" />
        <path :d="benchmarkPath" class="chart__line chart__line--benchmark" />
        <path :d="basketPath" class="chart__line chart__line--basket" :class="{ 'is-behind': !ahead }" />
        <text :x="pad.l" :y="height - 6" class="chart__axis">{{ dateAt(0) }}</text>
        <text :x="width - pad.r" :y="height - 6" class="chart__axis" text-anchor="end">Today</text>
        <g v-if="tip">
          <line :x1="tip.left" :x2="tip.left" :y1="pad.t" :y2="pad.t + plotH" class="chart__cursor" />
          <circle :cx="tip.left" :cy="y(points[hover].benchmark)" r="4" class="chart__dot chart__dot--benchmark" />
          <circle :cx="tip.left" :cy="y(points[hover].basket)" r="4.5" class="chart__dot chart__dot--basket" />
        </g>
      </svg>
      <div v-if="tip" class="chart__tip" :class="{ 'is-right': tip.alignRight }" :style="{ left: `${tip.left}px` }">
        <p class="chart__tip-date">{{ tip.date }}</p>
        <p><span class="chart__swatch chart__swatch--basket" />{{ basketLabel }} <strong class="num">{{ tip.basket }}</strong></p>
        <p><span class="chart__swatch chart__swatch--benchmark" />{{ benchmarkLabel }} <strong class="num">{{ tip.benchmark }}</strong></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart {
  position: relative;
  width: 100%;
}
.chart__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 18px;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 650;
  color: var(--muted);
}
.chart__key {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}
.chart__key::before {
  content: '';
  width: 16px;
  height: 4px;
  border-radius: 2px;
}
.chart__key--basket::before {
  background: var(--signal);
}
.chart__key--benchmark::before {
  background: var(--subtle);
}
.chart__key strong {
  color: var(--ink);
}
.chart__plot {
  position: relative;
}
svg {
  display: block;
  overflow: visible;
  touch-action: pan-y;
}
.chart__grid line {
  stroke: var(--line);
  stroke-width: 1;
}
.chart__grid line.is-base {
  stroke: var(--line-strong);
  stroke-dasharray: 4 4;
}
.chart__grid text,
.chart__axis {
  fill: var(--subtle);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
}
.chart__line {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.chart__line--basket {
  stroke: var(--signal);
  stroke-width: 3;
}
.chart__line--basket.is-behind {
  stroke: var(--ember);
}
.chart__line--benchmark {
  stroke: var(--subtle);
  stroke-width: 2;
}
.chart__cursor {
  stroke: var(--line-strong);
  stroke-width: 1;
}
.chart__dot {
  stroke: var(--ink-solid);
  stroke-width: 2;
}
.chart__dot--basket {
  fill: var(--sun);
}
.chart__dot--benchmark {
  fill: var(--cream);
}
.chart__tip {
  position: absolute;
  top: 0;
  z-index: 3;
  min-width: 170px;
  margin-left: 12px;
  padding: 10px 12px;
  border: var(--outline-thin);
  border-radius: 12px;
  background: var(--ink);
  color: var(--cream);
  font-size: 12.5px;
  line-height: 1.6;
  pointer-events: none;
  box-shadow: 4px 4px 0 var(--sun);
}
.chart__tip.is-right {
  transform: translateX(calc(-100% - 24px));
}
.chart__tip-date {
  font-family: var(--font-mono);
  font-weight: 500;
  color: rgba(255, 244, 214, 0.7);
}
.chart__tip strong {
  margin-left: 4px;
}
.chart__swatch {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 6px;
  border-radius: 50%;
}
.chart__swatch--basket {
  background: var(--brand-300);
}
.chart__swatch--benchmark {
  background: #b9b4c0;
}
</style>
