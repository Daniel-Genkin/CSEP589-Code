<script setup>
// Figma "Rally · Dashboard": the share of the fund that crosses the user's lines,
// who is behind it, and the three things they can do about it.
import DotGrid from '@/components/rally/DotGrid.vue'
import LineChips from '@/components/rally/LineChips.vue'
import { useToast } from '@/composables/useToast'
import { useLinesStore } from '@/stores/lines'
import { headlinePct, pct1 as fmtPct, pluralize, usd2 as fmtUsd } from '@/utils/format'
import { LINE_OPTIONS, checkBasket } from '@/utils/lines'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

const props = defineProps({
  // checkFund() output: { fund, rows, crossers, crossingPct }
  result: { type: Object, required: true },
})
defineEmits(['rescan'])

const SHOWN = 2
const LEGEND_MAX = 3

const store = useLinesStore()
const { lineKeys, excluded } = storeToRefs(store)
const toast = useToast()

const fund = computed(() => props.result.fund)
const symbol = computed(() => fund.value.symbol)
const crossers = computed(() => props.result.crossers)
const pct = computed(() => props.result.crossingPct)
// Whole dots; a real exposure under 1% still gets one.
const pctRound = computed(() => Math.max(Math.round(pct.value), pct.value > 0 ? 1 : 0))
const pctHead = computed(() => headlinePct(pct.value))

// One group per line, each company counted under the first line it crosses.
const groups = computed(() => {
  const byLine = new Map()
  for (const row of crossers.value) {
    const line = row.crossed[0]
    const group = byLine.get(line.key) ?? { key: line.key, label: line.label, color: line.bg, weight: 0, names: [] }
    group.weight += row.weight
    group.names.push(row.name)
    byLine.set(line.key, group)
  }
  const sorted = [...byLine.values()].sort((a, b) => b.weight - a.weight)
  if (sorted.length <= LEGEND_MAX) return sorted
  const rest = sorted.slice(LEGEND_MAX - 1)
  return [
    ...sorted.slice(0, LEGEND_MAX - 1),
    { key: 'other', label: 'Other lines', color: 'var(--violet)', weight: rest.reduce((sum, g) => sum + g.weight, 0), names: rest.flatMap((g) => g.names) },
  ]
})

// Whole dots per group, sharing out the rounding so the coloured dots add up to the headline.
const segments = computed(() => {
  const target = pctRound.value
  const floors = groups.value.map((g) => ({ color: g.color, count: Math.floor(g.weight), rest: g.weight % 1 }))
  let left = target - floors.reduce((sum, f) => sum + f.count, 0)
  for (const f of [...floors].sort((a, b) => b.rest - a.rest)) {
    if (left <= 0) break
    f.count += 1
    left -= 1
  }
  return floors
})

const shown = computed(() => crossers.value.slice(0, SHOWN))
const hidden = computed(() => crossers.value.slice(SHOWN))
const hiddenPct = computed(() => hidden.value.reduce((sum, r) => sum + r.weight, 0))

// Option 2: the fund minus the companies marked "Exclude from basket".
const basket = computed(() => checkBasket(symbol.value, excluded.value, lineKeys.value))
const excludedRows = computed(() => props.result.rows.filter((r) => excluded.value.includes(r.symbol)))
const basketPct = computed(() => basket.value.after.crossingPct)
const basketTitle = computed(() => {
  const first = excludedRows.value[0]
  if (!first) return 'Cut companies. Still your call.'
  return excludedRows.value.length > 1 ? `Less ${first.symbol} and ${excludedRows.value.length - 1} more. Still your call.` : `Less ${first.symbol}. Still your call.`
})
const barWidth = (value) => `${Math.max(2, (value / Math.max(pct.value, basketPct.value, 0.01)) * 100)}%`

function redirect() {
  toast.info('Design demo', { description: 'Nothing is scheduled. Redirecting new money is not connected yet.' })
}
</script>

<template>
  <div class="page dash">
    <div class="page-cols">
      <div class="col-main">
        <section class="hero">
          <p class="eyebrow">Your Rally · Portfolio · {{ symbol }} · sample data</p>
          <p class="lead">Here’s what your fund is up to.</p>
          <div class="hero__number">
            <p class="stat-xl">{{ pctHead }}</p>
            <div class="hero__sentence">
              <h1 class="hero__claim">of your money in {{ symbol }}<br />crosses your lines.</h1>
              <p class="hero__fine">
                {{ pctHead }} of your dollars, not {{ pctHead }} of the companies<br />
                {{ fmtUsd(pct) }} of every $100 · {{ crossers.length }} of {{ fund.holdingsCount }} companies
              </p>
            </div>
          </div>
          <ul class="hero__trust">
            <li class="tag"><span class="dot" />No account connected</li>
            <li class="tag"><span class="dot" />Every flag links to its source</li>
            <li class="tag"><span class="dot" />Never tells you to buy or sell</li>
          </ul>
        </section>

        <section class="card card-pad every">
          <header class="row-between">
            <h2 class="title-sm">Where every $100 in {{ symbol }} goes</h2>
            <p class="label-mono">1 dot = $1</p>
          </header>
          <DotGrid :segments="segments" :label="`${pctRound} of 100 dots cross your lines`" />
          <ul class="legend">
            <li v-for="group in groups" :key="group.key">
              <p class="legend__name"><span class="dot dot-10" :style="{ '--dot': group.color }" />{{ group.label }}</p>
              <p class="legend__pct">{{ fmtPct(group.weight) }}</p>
              <p class="legend__who">{{ group.names.join(', ') }}</p>
            </li>
            <li>
              <p class="legend__name"><span class="dot dot-10" style="--dot: var(--border)" />Passes your lines</p>
              <p class="legend__pct">{{ fmtPct(100 - pct) }}</p>
              <p class="legend__who">Everything else in {{ symbol }}</p>
            </li>
          </ul>
          <p class="small">Illustrative weights, not a live scan. Sample names, sample weights.</p>
        </section>
      </div>

      <aside class="col-side">
        <section class="card who">
          <header class="row-between who__head">
            <h2 class="title-card">Who crosses your lines</h2>
            <p class="label-mono">{{ shown.length }} of {{ crossers.length }} shown</p>
          </header>

          <article v-for="row in shown" :key="row.symbol" class="holding rule-top">
            <div class="holding__top">
              <span class="ticker-tile">{{ row.symbol }}</span>
              <div class="holding__company">
                <h3 class="holding__name">{{ row.name }}</h3>
                <p class="holding__line"><span class="dot" :style="{ '--dot': row.crossed[0].bg }" />{{ row.crossed.map((c) => c.label).join(' · ') }}</p>
              </div>
              <div class="holding__weight">
                <p class="num-mono holding__pct">{{ fmtPct(row.weight) }}</p>
                <p class="holding__per">{{ fmtUsd(row.weight) }} per $100</p>
              </div>
            </div>
            <p class="holding__why">{{ row.crossed[0].receipt }}</p>
            <div class="holding__actions">
              <p class="source-link">Source: sample research note</p>
              <button v-if="excluded.includes(row.symbol)" type="button" class="btn btn-quiet btn-sm" @click="store.toggleExcluded(row.symbol)">
                Excluded · Undo
              </button>
              <button v-else type="button" class="btn btn-outline btn-sm" @click="store.toggleExcluded(row.symbol)">Exclude from basket</button>
            </div>
          </article>

          <div v-if="hidden.length" class="who__more rule-top">
            <span class="dot" style="--dot: var(--violet)" />
            <div class="who__more-text">
              <p class="who__more-title">{{ pluralize(hidden.length, 'more company', 'more companies') }}</p>
              <p class="who__more-sub">Not shown in this sample</p>
            </div>
            <p class="num-mono who__more-pct">{{ fmtPct(hiddenPct) }}</p>
          </div>
        </section>

        <section class="card card-pad lines">
          <header class="row-between">
            <h2 class="title-card">Your lines. Your call.</h2>
            <p class="label-mono">{{ lineKeys.length }} selected</p>
          </header>
          <LineChips v-model="lineKeys" :lines="LINE_OPTIONS" />
          <p class="small">These are industry choices, not verdicts. Rescan {{ symbol }} to update your receipt.</p>
          <button type="button" class="btn btn-outline btn-md" @click="$emit('rescan')">Rescan {{ symbol }}</button>
        </section>
      </aside>
    </div>

    <section class="options">
      <header class="options__head">
        <div>
          <h2 class="title-section">What you can do about it.</h2>
          <p class="body-muted">Three options. Rally shows you what you own. It never tells you to buy or sell.</p>
        </div>
        <p class="label-mono">Nothing moves automatically</p>
      </header>

      <article class="card keep">
        <div class="keep__text">
          <p class="label-mono">Option 1 · Keep your fund</p>
          <h3 class="keep__title">Keep {{ symbol }} as it is.</h3>
          <p class="body-muted">Nothing changes. {{ pctHead }} stays in companies that cross your lines, and now you know which ones.</p>
        </div>
        <span class="tag"><span class="dot" />Original fund unchanged</span>
      </article>

      <div class="options__pair">
        <article class="card card-pad option">
          <p class="label-mono">Option 2 · Cut companies · sample</p>
          <h3 class="title-lg">{{ basketTitle }}</h3>
          <div class="option__stat">
            <p class="stat-md">-{{ basket.removedPct.toFixed(1) }}%</p>
            <div class="option__stat-text">
              <p class="option__stat-label">of {{ symbol }} left out of your basket</p>
              <p class="small">Return comparison vs. the S&amp;P 500 comes with the back-test.</p>
            </div>
          </div>
          <div class="compare">
            <div>
              <p class="compare__row"><span>Your basket · crosses your lines</span><span class="num-mono">{{ fmtPct(basketPct) }}</span></p>
              <div class="bar"><span :style="{ width: barWidth(basketPct) }" /></div>
            </div>
            <div>
              <p class="compare__row"><span>{{ symbol }} as it is</span><span class="num-mono">{{ fmtPct(pct) }}</span></p>
              <div class="bar"><span :style="{ width: barWidth(pct), background: 'var(--bar-muted)' }" /></div>
            </div>
          </div>
          <p class="small">
            Your basket = {{ symbol }} minus your selected exclusions, proportionally reweighted. This is not your original fund. Illustrative only; not
            actual or forecast performance.
          </p>
          <div class="option__actions">
            <RouterLink to="/whatif" class="btn btn-primary">Build my basket</RouterLink>
            <button v-for="row in excludedRows.slice(0, 1)" :key="row.symbol" type="button" class="btn btn-outline" @click="store.toggleExcluded(row.symbol)">
              Excluded · {{ row.name }} ({{ row.symbol }}) · Undo
            </button>
          </div>
          <p class="small">Review first. Nothing moves automatically. Rally does not hold money or act as a broker.</p>
        </article>

        <article class="card card-pad option">
          <p class="label-mono">Option 3 · Redirect new money · demo</p>
          <h3 class="title-lg">The next dollar is yours.</h3>
          <div class="option__stat">
            <p class="stat-md">$100/month</p>
            <div class="option__stat-text">
              <p class="small">Illustrative amount</p>
            </div>
          </div>
          <p class="option__lede">Keep my fund. Change only new money.</p>
          <dl class="details">
            <div class="rule-top">
              <dt class="label-mono">Destination</dt>
              <dd>{{ symbol }} · {{ fund.name }}</dd>
            </div>
            <div class="rule-top">
              <dt class="label-mono">Status</dt>
              <dd>Not active · no transfer scheduled</dd>
            </div>
          </dl>
          <button type="button" class="btn btn-outline" @click="redirect">Redirect</button>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dash {
  gap: 40px;
}

/* Hero */
.hero {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
}
.hero__number {
  display: flex;
  align-items: flex-end;
  gap: 28px;
}
.hero__sentence {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-bottom: 36px;
}
.hero__claim {
  font-family: var(--font-sans);
  font-size: 32px;
  font-weight: 500;
  line-height: 1.25;
  text-transform: none;
  color: var(--text);
}
.hero__fine {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.7;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.hero__trust {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 10px;
}

/* Every $100 */
.every {
  display: flex;
  flex-direction: column;
  gap: 28px;
}
.legend {
  display: flex;
  gap: 20px;
}
.legend li {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.legend__name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  line-height: 18px;
}
.legend__pct {
  font-family: var(--font-mono);
  font-size: 22px;
  font-weight: 500;
  line-height: 1.3;
}
.legend__who {
  font-size: 13px;
  line-height: 1.4;
  color: var(--text-muted);
}

/* Who crosses your lines */
.who {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 28px 28px 24px;
}
.who__head {
  padding-bottom: 12px;
}
.holding {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px 0;
}
.holding__top {
  display: flex;
  align-items: center;
  gap: 14px;
}
.holding__company {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.holding__name {
  font-size: 19px;
  font-weight: 600;
  line-height: 1.175;
}
.holding__line {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 14px;
  font-weight: 500;
  line-height: 16px;
  color: var(--text-muted);
}
.holding__weight {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  white-space: nowrap;
}
.holding__pct {
  font-size: 22px;
  line-height: 1.3;
}
.holding__per {
  font-size: 12px;
  color: var(--text-muted);
}
.holding__why {
  font-size: 14px;
  line-height: 1.45;
  color: var(--text-muted);
}
.holding__actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}
.who__more {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 0 6px;
}
.who__more-text {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.who__more-title {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.175;
}
.who__more-sub {
  font-size: 13px;
  color: var(--text-muted);
}
.who__more-pct {
  font-size: 18px;
}

/* Your lines */
.lines {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
}
.lines > header {
  width: 100%;
}

/* What you can do about it */
.options {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.options__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}
.options__head > div {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.keep {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px 40px;
}
.keep__text {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.keep__title {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.175;
}
.options__pair {
  display: flex;
  align-items: stretch;
  gap: 24px;
}
.option {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}
.option__stat {
  display: flex;
  align-items: flex-end;
  gap: 20px;
}
.option__stat-text {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 14px;
}
.option__stat-label {
  font-size: 17px;
  font-weight: 500;
  line-height: 1.175;
}
.option__lede {
  font-size: 17px;
  color: var(--text-muted);
}
.compare {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
}
.compare > div {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.compare__row {
  display: flex;
  justify-content: space-between;
  font-weight: 500;
  line-height: 18px;
}
.option__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
.details {
  width: 100%;
}
.details > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 0;
}
.details dd {
  font-weight: 500;
  text-align: right;
}

@media (max-width: 1180px) {
  .stat-xl {
    font-size: 128px;
  }
  .hero__claim {
    font-size: 26px;
  }
  .options__pair {
    flex-direction: column;
  }
}
</style>
