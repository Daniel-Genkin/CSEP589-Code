<script setup lang="ts">
// F3 What-if and F4 Alternatives. Switch off whole categories or single flagged companies and see what the
// portfolio would have earned with and without the change, next to the S&P 500, plus how much
// flagged exposure is left. Excluded weight is redistributed pro rata. No Figma frame: built
// from docs/STYLE.md.
import GrowthChart, { type ChartSeries } from '@/components/rally/GrowthChart.vue'
import UiToggle from '@/components/ui/UiToggle.vue'
import { usePortfolioData } from '@/composables/usePortfolioData'
import { useWhatIf } from '@/composables/useWhatIf'
import { SERIES_COLORS } from '@/config/chart'
import { categoriesByTicker } from '@/domain/exposure'
import { shortName } from '@/domain/portfolio'
import { useCatalogStore } from '@/state/catalog'
import { useDemoStore } from '@/state/demo'
import { pct, plural, signed, usd } from '@/utils/format'
import { computed } from 'vue'
import AlternativesPanel from './whatif/AlternativesPanel.vue'

const COLORS = SERIES_COLORS

const demo = useDemoStore()
const catalog = useCatalogStore()
const data = usePortfolioData()
const whatIf = useWhatIf(data)

const portfolio = computed(() => demo.portfolio)
const name = computed(() => (portfolio.value ? shortName(portfolio.value) : ''))
const loaded = computed(() => data.status.value === 'ready')
const ready = computed(() => loaded.value && whatIf.backtest.value !== null)
const failed = computed(() => loaded.value && whatIf.status.value === 'error')
const result = computed(() => whatIf.backtest.value!)
const hasExclusions = computed(() => whatIf.excluded.value.size > 0)

const linesOf = computed(() => categoriesByTicker(data.tags.value, data.selectedIds.value))
// A company gets a switch if it is flagged in a selected category, or is already switched off
// by hand (so an exclusion can never be hidden by deselecting its category).
const companyRows = computed(() => data.rows.value.filter((r) => linesOf.value.has(r.ticker) || demo.exclusions.tickers.includes(r.ticker)))
const companyNote = (ticker: string) => (linesOf.value.get(ticker) ?? []).map(catalog.label).join(', ') || 'Not in your lines now'

const categoryRows = computed(() =>
  whatIf.exposuresBefore.value.map((e) => ({
    id: e.category,
    label: catalog.label(e.category),
    color: catalog.color(e.category),
    usd: e.usd,
    count: e.count,
    on: demo.exclusions.categories.includes(e.category),
    after: whatIf.exposuresAfter.value.find((a) => a.category === e.category)?.usd ?? 0,
  })),
)
const allExcluded = computed(() => categoryRows.value.length > 0 && categoryRows.value.every((c) => c.on))

/** The excluded categories a company is tagged in, if any: it is then excluded through them. */
const viaCategory = (ticker: string) => (linesOf.value.get(ticker) ?? []).filter((c) => demo.exclusions.categories.includes(c))

const series = computed<ChartSeries[]>(() => [
  { key: 'original', label: 'As it is', color: COLORS.original, values: result.value.original },
  { key: 'filtered', label: 'With your exclusions', color: COLORS.filtered, values: result.value.filtered },
  { key: 'benchmark', label: 'S&P 500', color: COLORS.benchmark, values: result.value.benchmark },
])

const years = computed(() => {
  const dates = result.value.dates
  return ((Date.parse(dates[dates.length - 1]) - Date.parse(dates[0])) / (365.25 * 86_400_000)).toFixed(1)
})
const chartSummary = computed(
  () =>
    `Growth of $10,000 over ${years.value} years. As it is: ${usd(result.value.original.at(-1)!)}. With your exclusions: ${usd(result.value.filtered.at(-1)!)}. S&P 500: ${usd(result.value.benchmark.at(-1)!)}.`,
)
// For an S&P 500 fund the portfolio line and the benchmark line are the same line. Say so.
const tracksBenchmark = computed(() => result.value.original.every((value, i) => Math.abs(value - result.value.benchmark[i]) < 0.5))
const verdict = computed(() => {
  if (whatIf.pending.value) return 'Recalculating for your latest change…'
  if (!hasExclusions.value) return 'Nothing is excluded yet, so both lines are the same. Switch something off on the right.'
  const points = whatIf.points.value
  if (Math.abs(points) < 0.005) return 'In this back-test the exclusions made no measurable difference to the yearly return.'
  return `In this back-test the exclusions ${points < 0 ? 'cost' : 'added'} ${Math.abs(points).toFixed(2)} points a year.`
})
const barWidth = (value: number) => `${Math.max(whatIf.before.value.usd > 0 ? (value / whatIf.before.value.usd) * 100 : 0, value > 0 ? 1 : 0)}%`
</script>

<template>
  <div class="page">
    <header class="page-head">
      <p class="eyebrow">Your Rally · What-if<template v-if="portfolio"> · {{ name }}</template> · {{ demo.dataLabel }}</p>
      <h1 class="page-title">What if you<br />cut them?</h1>
      <p class="lead">Switch off categories or single companies. See what it would have cost against the S&amp;P 500, before anything changes.</p>
    </header>

    <!-- Nothing to test yet -->
    <section v-if="!portfolio" class="empty">
      <p class="label-mono">No portfolio yet</p>
      <p class="empty__title">Pick a fund or type a few tickers first.</p>
      <RouterLink to="/" class="btn btn-primary">Go to Home</RouterLink>
    </section>
    <!-- A connected brokerage counts as having an account, the same rule Portfolio uses. -->
    <section v-else-if="!demo.account && !demo.isConnected" class="empty">
      <p class="label-mono">Free account needed</p>
      <p class="empty__title">What-if uses the breakdown, which comes with a free account.</p>
      <RouterLink to="/portfolio" class="btn btn-primary">Create a free account</RouterLink>
    </section>
    <section v-else-if="data.status.value === 'error'" class="card card-pad failed" role="alert">
      <span class="tag"><span class="dot" style="--dot: var(--flare)" />Data unavailable</span>
      <h2 class="title-lg">Your holdings didn’t load.</h2>
      <p class="body-muted">No figures are shown rather than stale ones. Your exclusions are saved.</p>
      <button type="button" class="btn btn-primary" @click="data.reload()">Try again</button>
    </section>

    <!-- Holdings still loading: no figures yet, so none are shown -->
    <div v-else-if="!loaded" class="page-cols" aria-busy="true">
      <div class="col-main">
        <div class="skeleton" style="height: 220px; border-radius: 28px" />
        <div class="skeleton" style="height: 420px; border-radius: 28px" />
      </div>
      <aside class="col-side"><div class="skeleton" style="height: 520px; border-radius: 28px" /></aside>
    </div>

    <div v-else class="page-cols">
      <div class="col-main">
        <!-- The back-test failed. The switches stay, so the change that caused it can be undone. -->
        <section v-if="failed" class="card card-pad failed" role="alert">
          <span class="tag"><span class="dot" style="--dot: var(--flare)" />Back-test unavailable</span>
          <h2 class="title-lg">The back-test didn’t come through.</h2>
          <p class="body-muted">No returns are shown rather than stale ones. Your exclusions are saved; change them on the right, or try again.</p>
          <div class="failed__actions">
            <button type="button" class="btn btn-primary" @click="whatIf.recalculate()">Try again</button>
            <button type="button" class="btn btn-outline" @click="demo.clearExclusions()">Clear exclusions</button>
          </div>
        </section>

        <!-- Results -->
        <section v-if="!failed" class="card card-pad results" :class="{ 'is-pending': whatIf.pending.value }" aria-live="polite" :aria-busy="!ready || whatIf.pending.value">
          <header class="row-between">
            <h2 class="title-card">Back-tested return, a year</h2>
            <p class="label-mono">
              <template v-if="!ready">Running the back-test…</template>
              <template v-else>{{ result.dates[0] }} to {{ result.dates.at(-1) }} · recalculated in {{ Math.round(whatIf.lastMs.value) }} ms</template>
            </p>
          </header>
          <template v-if="ready">
            <div class="results__diff">
              <p class="stat-md">{{ signed(whatIf.points.value) }}</p>
              <div class="results__diff-text">
                <p class="results__unit">points a year, with your exclusions</p>
                <p class="body-muted">{{ verdict }}</p>
              </div>
            </div>
            <dl class="results__three">
              <div>
                <dt><span class="key" :style="{ background: COLORS.original }" />As it is</dt>
                <dd>{{ result.annualizedPct.original.toFixed(2) }}%</dd>
              </div>
              <div>
                <dt><span class="key" :style="{ background: COLORS.filtered }" />With your exclusions</dt>
                <dd>{{ result.annualizedPct.filtered.toFixed(2) }}%</dd>
              </div>
              <div>
                <dt><span class="key" :style="{ background: COLORS.benchmark }" />S&amp;P 500</dt>
                <dd>{{ result.annualizedPct.benchmark.toFixed(2) }}%</dd>
              </div>
            </dl>
          </template>
          <template v-else>
            <div class="skeleton" style="height: 72px; width: 60%" />
            <div class="skeleton" style="height: 64px" />
          </template>
        </section>

        <!-- Chart -->
        <section v-if="!failed" class="card card-pad">
          <header class="row-between chart-head">
            <h2 class="title-card">Growth of $10,000</h2>
            <p class="label-mono">Hover, or use the slider</p>
          </header>
          <GrowthChart v-if="ready" :dates="result.dates" :series="series" :summary="chartSummary">
            <p class="disclosure">Back-test on Alpaca historical prices. Past performance does not predict future results.</p>
            <p v-if="tracksBenchmark">{{ name }} tracks the S&amp;P 500, so “As it is” and “S&amp;P 500” are the same line here.</p>
          </GrowthChart>
          <div v-else class="skeleton" style="height: 360px" />
        </section>

        <!-- Exposure before and after -->
        <section class="card card-pad exposure">
          <header class="row-between">
            <h2 class="title-card">Flagged exposure, before and after</h2>
            <p class="label-mono">{{ plural(data.selectedIds.value.length, 'line') }} · each holding counted once</p>
          </header>
          <div class="compare">
            <div>
              <p class="compare__row"><span>Before</span><span class="num-mono">{{ usd(whatIf.before.value.usd) }} · {{ pct(whatIf.before.value.share) }}</span></p>
              <div class="bar"><span :style="{ width: barWidth(whatIf.before.value.usd), background: 'var(--bar-muted)' }" /></div>
            </div>
            <div>
              <p class="compare__row"><span>After</span><span class="num-mono">{{ usd(whatIf.after.value.usd) }} · {{ pct(whatIf.after.value.share) }}</span></p>
              <div class="bar"><span :style="{ width: barWidth(whatIf.after.value.usd) }" /></div>
            </div>
          </div>
          <p class="small">
            {{ plural(whatIf.before.value.count, 'holding') }} flagged before, {{ whatIf.after.value.count }} after. Weight you exclude is spread across what remains, in
            proportion to what you already hold.
          </p>
        </section>

        <AlternativesPanel :data="data" :excluded="whatIf.excluded.value" :swaps="whatIf.plan.value.swaps" />

        <section v-if="whatIf.excluded.value.size" class="card next">
          <div>
            <h2 class="title-card">Ready to act on it?</h2>
            <p class="body-muted">See the trades that would carry out this what-if. Nothing is sent without your approval.</p>
          </div>
          <RouterLink to="/trades" class="btn btn-primary">Review trades<template v-if="!demo.isPaid"> · paid plan</template></RouterLink>
        </section>

        <p class="tax"><span class="dot" style="--dot: var(--sun)" />Selling holdings can trigger a tax bill. This is a what-if: nothing has been sold.</p>
      </div>

      <aside class="col-side">
        <section class="card card-pad panel">
          <header class="row-between">
            <h2 class="title-card">Exclude a category</h2>
            <p class="label-mono">{{ demo.exclusions.categories.length }} of {{ categoryRows.length }} off</p>
          </header>
          <ul class="switches">
            <li v-for="c in categoryRows" :key="c.id" class="rule-top">
              <span class="dot dot-10" :style="{ '--dot': c.color }" />
              <UiToggle
                :model-value="c.on"
                :label="c.label"
                :description="c.count ? `${plural(c.count, 'holding')} · ${usd(c.usd)}${c.on ? ` → ${usd(c.after)}` : ''}` : 'Nothing you hold'"
                @update:model-value="demo.toggleExcludedCategory(c.id)"
              />
            </li>
          </ul>
          <div class="panel__actions">
            <button type="button" class="btn btn-outline btn-sm" :disabled="allExcluded" @click="demo.setExcludedCategories(categoryRows.map((c) => c.id))">Exclude all {{ categoryRows.length }}</button>
            <button type="button" class="btn btn-outline btn-sm" :disabled="!demo.exclusions.categories.length && !demo.exclusions.tickers.length" @click="demo.clearExclusions()">Clear everything</button>
          </div>
          <p class="small">Categories come from <RouterLink to="/settings" class="link">Values</RouterLink>. Excluding one here does not deselect it there.</p>
        </section>

        <section class="card card-pad panel">
          <header class="row-between">
            <h2 class="title-card">Exclude a company</h2>
            <p class="label-mono">{{ companyRows.filter((r) => whatIf.excluded.value.has(r.ticker)).length }} of {{ companyRows.length }} off</p>
          </header>
          <p v-if="!companyRows.length" class="body-muted">Nothing you hold is flagged in your lines.</p>
          <ul v-else class="switches switches--companies">
            <li v-for="row in companyRows" :key="row.ticker" class="rule-top">
              <span class="ticker-tile company__tile">{{ row.ticker }}</span>
              <UiToggle
                :model-value="whatIf.excluded.value.has(row.ticker)"
                :disabled="viaCategory(row.ticker).length > 0"
                :label="data.nameOf(row.ticker)"
                :description="
                  viaCategory(row.ticker).length ? `Off with ${viaCategory(row.ticker).map(catalog.label).join(', ')}` : `${pct(row.weight, 2)} · ${companyNote(row.ticker)}`
                "
                @update:model-value="demo.toggleExcludedTicker(row.ticker)"
              />
            </li>
          </ul>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  min-height: 260px;
  padding: 24px;
  border: 1px dashed var(--border);
  border-radius: var(--radius-lg);
  text-align: center;
}
.empty__title {
  font-size: 20px;
  font-weight: 600;
}
.failed {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}
.failed__actions {
  display: flex;
  gap: 12px;
}
/* What is shown belongs to the previous inputs until the new result arrives */
.results.is-pending .results__diff,
.results.is-pending .results__three {
  opacity: 0.45;
  transition: opacity 0.15s var(--ease);
}
.results {
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.results__diff {
  display: flex;
  align-items: flex-end;
  gap: 20px;
}
.results__diff-text {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 8px;
}
.results__unit {
  font-size: 17px;
  font-weight: 500;
}
.results__three {
  display: flex;
  gap: 20px;
}
.results__three > div {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 16px;
  border-top: 1px solid var(--hairline);
}
.results__three dt {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}
.results__three dd {
  font-family: var(--font-mono);
  font-size: 22px;
  font-weight: 500;
}
.key {
  flex: none;
  width: 16px;
  height: 3px;
  border-radius: 2px;
}
.chart-head {
  margin-bottom: 18px;
}
.disclosure {
  color: var(--text);
}
.exposure {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.compare {
  display: flex;
  flex-direction: column;
  gap: 14px;
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
}
.next {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 24px 28px;
}
.next > div {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.tax {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  color: var(--text-muted);
}
.panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.switches li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
}
.switches li:first-child {
  border-top: 0;
  padding-top: 4px;
}
.switches :deep(.toggle) {
  flex: 1 1 0;
  min-width: 0;
}
.switches--companies {
  max-height: 520px;
  margin-right: -10px;
  padding-right: 10px;
  overflow-y: auto;
}
.company__tile {
  width: 44px;
  height: 44px;
  font-size: 11px;
}
.panel__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
