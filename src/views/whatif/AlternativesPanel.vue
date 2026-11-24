<script setup lang="ts">
// F4 Alternatives. For each excluded holding: up to three companies in the same sector that
// carry no tag in any of the user's selected categories. "Swap in" gives the excluded holding's
// weight to the alternative instead of spreading it pro rata. These are options, not
// recommendations: nothing here says which to pick.
import type { PortfolioData } from '@/composables/usePortfolioData'
import { provider } from '@/data'
import { useDemoStore } from '@/state/demo'
import type { Security } from '@/types'
import { pct, signed, usd } from '@/utils/format'
import { computed, nextTick, ref, shallowRef, watch } from 'vue'

const props = defineProps<{
  data: PortfolioData
  /** Tickers the what-if removes */
  excluded: Set<string>
  /** The swaps the what-if is actually applying (a stored swap that no longer qualifies is not here) */
  swaps: Record<string, string>
}>()

interface Option {
  security: Security
  /** Change in the what-if's yearly return if this option is swapped in, in points. null while it is worked out. */
  effect: number | null
}

const demo = useDemoStore()

// Only the open row holds options. They depend on the portfolio, the selected categories and
// every other exclusion and swap, so they are loaded for one row at a time and reloaded
// whenever any of those change.
const open = ref<string | null>(null)
const options = shallowRef<Option[] | 'loading' | 'error'>('loading')
let request = 0

const rows = computed(() => props.data.rows.value.filter((r) => props.excluded.has(r.ticker)))

/** Everything the open row's options and effects are computed from, except that row's own swap. */
const inputs = computed(() => {
  const ticker = open.value
  const portfolio = props.data.portfolio.value
  if (!ticker || !portfolio) return null
  const { [ticker]: _own, ...otherSwaps } = demo.exclusions.swaps
  return { ticker, portfolio, selected: props.data.selectedIds.value, exclusions: { ...demo.exclusions, swaps: otherSwaps } }
})
const inputsKey = computed(() =>
  inputs.value
    ? JSON.stringify([inputs.value.ticker, inputs.value.selected, inputs.value.exclusions, inputs.value.portfolio.id, inputs.value.portfolio.holdings.map((h) => [h.ticker, h.weight])])
    : '',
)

async function load() {
  const current = inputs.value
  const mine = ++request
  if (!current) return
  options.value = 'loading'
  try {
    const found = await provider.getAlternatives(current.ticker, current.selected)
    if (mine !== request) return // the row was closed, or its inputs changed
    options.value = found.map((security) => ({ security, effect: null }))
    // The what-if with nothing swapped for this holding, then with each option swapped in.
    const [base, ...withEach] = await Promise.all([
      provider.getBacktest(current.portfolio, current.exclusions),
      ...found.map((alt) => provider.getBacktest(current.portfolio, { ...current.exclusions, swaps: { ...current.exclusions.swaps, [current.ticker]: alt.ticker } })),
    ])
    if (mine !== request) return
    options.value = found.map((security, i) => ({ security, effect: withEach[i].annualizedPct.filtered - base.annualizedPct.filtered }))
  } catch {
    if (mine === request) options.value = 'error'
  }
}
watch(inputsKey, load)

// A row that is no longer excluded closes.
watch(
  () => props.excluded,
  (now) => {
    if (open.value && !now.has(open.value)) open.value = null
  },
)

const list = computed(() => (Array.isArray(options.value) ? options.value : []))
const toggleId = (ticker: string) => `options-toggle-${ticker}`
const focusToggle = (ticker: string) => nextTick(() => document.getElementById(toggleId(ticker))?.focus())

function toggle(ticker: string) {
  open.value = open.value === ticker ? null : ticker
}
/** Undo removes the button that was pressed, so put focus on the row's own toggle. */
function undo(ticker: string) {
  demo.undoSwap(ticker)
  void focusToggle(ticker)
}
function retry(ticker: string) {
  void load()
  void focusToggle(ticker)
}
</script>

<template>
  <section class="card card-pad alternatives">
    <header class="row-between">
      <div>
        <h2 class="title-card">Options for what you excluded</h2>
        <p class="body-muted">Same sector, no flagged categories. Swap one in and it takes the excluded holding’s weight.</p>
      </div>
      <span class="tag"><span class="dot" style="--dot: var(--sun)" />Options, not recommendations</span>
    </header>

    <p v-if="!rows.length" class="alternatives__empty">Exclude a category or a company and its options appear here.</p>

    <ul v-else class="alternatives__list">
      <li v-for="row in rows" :key="row.ticker" class="rule-top">
        <div class="excluded">
          <span class="ticker-tile excluded__tile">{{ row.ticker }}</span>
          <div class="excluded__text">
            <p class="excluded__name">{{ data.nameOf(row.ticker) }}</p>
            <p class="body-muted excluded__meta">
              {{ pct(row.weight, 2) }} · {{ usd(row.valueUsd) }} ·
              <template v-if="swaps[row.ticker]">its weight goes to {{ swaps[row.ticker] }}</template>
              <template v-else>its weight is spread across what remains</template>
            </p>
          </div>
          <button v-if="swaps[row.ticker]" type="button" class="btn btn-quiet btn-sm" :aria-label="`Undo the swap of ${data.nameOf(row.ticker)} for ${swaps[row.ticker]}`" @click="undo(row.ticker)">
            Swapped for {{ swaps[row.ticker] }} · Undo
          </button>
          <button
            :id="toggleId(row.ticker)"
            type="button"
            class="btn btn-outline btn-sm"
            :aria-expanded="open === row.ticker"
            :aria-controls="open === row.ticker ? `options-${row.ticker}` : undefined"
            :aria-label="`${open === row.ticker ? 'Hide' : 'See'} options for ${data.nameOf(row.ticker)}`"
            @click="toggle(row.ticker)"
          >
            {{ open === row.ticker ? 'Hide options' : 'See options' }}
          </button>
        </div>

        <div v-if="open === row.ticker" :id="`options-${row.ticker}`" class="options">
          <p v-if="options === 'loading'" class="label-mono" role="status">Finding options in the same sector…</p>
          <p v-else-if="options === 'error'" class="field-error" role="alert">
            Options didn’t load. <button type="button" class="link" @click="retry(row.ticker)">Try again</button>
          </p>
          <p v-else-if="!list.length" class="body-muted">No company in the live TickerInside sector pool is free of your selected categories.</p>
          <ul v-else class="options__list">
            <li v-for="option in list" :key="option.security.ticker" class="option" :class="{ 'is-in': swaps[row.ticker] === option.security.ticker }">
              <div class="option__head">
                <span class="ticker-tile option__tile">{{ option.security.ticker }}</span>
                <div>
                  <p class="option__name">{{ option.security.name }}</p>
                  <p class="small">{{ option.security.sector }}</p>
                </div>
              </div>
              <dl class="option__facts">
                <div>
                  <dt class="label-mono">Weight it would take</dt>
                  <dd>{{ pct(row.weight, 2) }}</dd>
                </div>
                <div>
                  <dt class="label-mono">Effect on the back-test</dt>
                  <dd>{{ option.effect === null ? '…' : `${signed(option.effect)} pts a year` }}</dd>
                </div>
              </dl>
              <p class="small">Same sector, no flagged categories</p>
              <button
                v-if="swaps[row.ticker] === option.security.ticker"
                type="button"
                class="btn btn-quiet btn-sm"
                :aria-label="`Undo the swap of ${data.nameOf(row.ticker)} for ${option.security.name}`"
                @click="undo(row.ticker)"
              >
                Swapped in · Undo
              </button>
              <button v-else type="button" class="btn btn-outline btn-sm" :aria-label="`Swap in ${option.security.name} for ${data.nameOf(row.ticker)}`" @click="demo.swap(row.ticker, option.security.ticker)">
                Swap in
              </button>
            </li>
          </ul>
        </div>
      </li>
    </ul>
    <p class="small">The effect compares the back-test with this swap against the back-test without it. Past performance does not predict future results.</p>
  </section>
</template>

<style scoped>
.alternatives {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.alternatives > header > div {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.alternatives__empty {
  padding: 28px 16px;
  border: 1px dashed var(--border);
  border-radius: var(--radius-lg);
  text-align: center;
  color: var(--text-muted);
}
.alternatives__list > li {
  padding: 16px 0;
}
.alternatives__list > li:first-child {
  border-top: 0;
  padding-top: 0;
}
.excluded {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
}
.excluded__tile {
  width: 44px;
  height: 44px;
  font-size: 11px;
}
.excluded__text {
  flex: 1 1 220px;
  min-width: 0;
}
.excluded__name {
  font-size: 17px;
  font-weight: 600;
}
.excluded__meta {
  font-size: 14px;
}
.options {
  padding: 16px 0 4px;
}
.options__list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}
.option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 18px;
  border: 1px solid var(--hairline);
  border-radius: var(--radius-lg);
}
.option.is-in {
  padding: 17.5px;
  border: 1.5px solid var(--brand-400);
  background: var(--surface-2);
}
.option__head {
  display: flex;
  align-items: center;
  gap: 12px;
}
.option__tile {
  width: 44px;
  height: 44px;
  font-size: 11px;
  background: var(--track);
}
.option__name {
  font-weight: 600;
  line-height: 1.25;
}
.option__facts {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}
.option__facts dd {
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 500;
}
.option .btn {
  margin-top: auto;
}
</style>
