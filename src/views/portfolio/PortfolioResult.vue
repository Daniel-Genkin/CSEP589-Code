<script setup lang="ts">
// Figma "Rally · Dashboard": how much of the portfolio crosses the user's lines, who is behind
// it, and what they can do about it.
import CategoryPicker from '@/components/rally/CategoryPicker.vue'
import DotGrid from '@/components/rally/DotGrid.vue'
import type { PortfolioData } from '@/composables/usePortfolioData'
import { categoriesByTicker } from '@/domain/exposure'
import { shortName } from '@/domain/portfolio'
import { useCatalogStore } from '@/state/catalog'
import { useDemoStore } from '@/state/demo'
import { headlinePct, listNames, pct, plural, usd } from '@/utils/format'
import { computed } from 'vue'
import ExposureReceipt from './ExposureReceipt.vue'
import HoldingsTable from './HoldingsTable.vue'

const props = defineProps<{ data: PortfolioData }>()

const SHOWN = 2
const LEGEND_MAX = 3

const demo = useDemoStore()
const catalog = useCatalogStore()

const portfolio = computed(() => props.data.portfolio.value!)
const rows = computed(() => props.data.rows.value)
const tags = computed(() => props.data.tags.value)
const flagged = computed(() => props.data.flagged.value)
/** "SPY" for a fund, otherwise a plain phrase that reads in a sentence. */
const what = computed(() => (portfolio.value.origin === 'fund' ? portfolio.value.id : 'your portfolio'))

const linesOf = computed(() => categoriesByTicker(tags.value, props.data.selectedIds.value))
const crossers = computed(() => rows.value.filter((r) => linesOf.value.has(r.ticker)))

// One group per category, each company counted under the first selected category it is tagged in,
// so the dots never count a company twice.
const groups = computed(() => {
  const byCategory = new Map<string, { id: string; label: string; color: string; share: number; names: string[] }>()
  for (const row of crossers.value) {
    const id = linesOf.value.get(row.ticker)![0]
    const group = byCategory.get(id) ?? { id, label: catalog.label(id), color: catalog.color(id), share: 0, names: [] }
    group.share += row.weight
    group.names.push(props.data.nameOf(row.ticker))
    byCategory.set(id, group)
  }
  const sorted = [...byCategory.values()].sort((a, b) => b.share - a.share)
  if (sorted.length <= LEGEND_MAX) return sorted
  const rest = sorted.slice(LEGEND_MAX - 1)
  return [
    ...sorted.slice(0, LEGEND_MAX - 1),
    { id: 'other', label: 'Other lines', color: 'var(--violet)', share: rest.reduce((sum, g) => sum + g.share, 0), names: rest.flatMap((g) => g.names) },
  ]
})

// Whole dots per group: round the total, then hand out the leftover dots by largest remainder.
const segments = computed(() => {
  const target = Math.max(Math.round(flagged.value.share * 100), flagged.value.count ? 1 : 0)
  const parts = groups.value.map((g) => ({ color: g.color, count: Math.floor(g.share * 100), rest: (g.share * 100) % 1 }))
  let left = target - parts.reduce((sum, p) => sum + p.count, 0)
  for (const part of [...parts].sort((a, b) => b.rest - a.rest)) {
    if (left <= 0) break
    part.count += 1
    left -= 1
  }
  return parts
})
const dots = computed(() => segments.value.reduce((sum, s) => sum + s.count, 0))

const shown = computed(() =>
  crossers.value.slice(0, SHOWN).map((row) => {
    const lines = linesOf.value.get(row.ticker)!
    const tag = tags.value.find((t) => t.ticker === row.ticker && t.category === lines[0])!
    return { row, lines, tag, host: new URL(tag.sourceUrl).hostname.replace(/^www\./, '') }
  }),
)
const hidden = computed(() => crossers.value.slice(SHOWN))
const hiddenShare = computed(() => hidden.value.reduce((sum, r) => sum + r.weight, 0))
const excludedCount = computed(() => demo.exclusions.tickers.length + demo.exclusions.categories.length)
</script>

<template>
  <div class="page dash">
    <div class="page-cols">
      <div class="col-main">
        <section class="hero">
          <p class="eyebrow">Your Rally · Portfolio · {{ shortName(portfolio) }} · sample data</p>
          <p class="lead">Here’s what {{ what }} is up to.</p>
          <div class="hero__number">
            <p class="stat-xl">{{ headlinePct(flagged.share) }}</p>
            <div class="hero__sentence">
              <h1 class="hero__claim">of your money in {{ what }}<br />crosses your lines.</h1>
              <p class="hero__fine">
                {{ headlinePct(flagged.share) }} of your dollars, not {{ headlinePct(flagged.share) }} of the companies<br />
                {{ usd(flagged.usd) }} of {{ usd(portfolio.totalUsd) }} · {{ flagged.count }} of {{ plural(rows.length, 'company', 'companies') }}
              </p>
            </div>
          </div>
          <ul class="hero__trust">
            <li class="tag"><span class="dot" />{{ portfolio.origin === 'connected' ? 'Read-only connection' : 'No account connected' }}</li>
            <li class="tag"><span class="dot" />Every flag links to its source</li>
            <li class="tag"><span class="dot" />Never tells you to buy or sell</li>
          </ul>
        </section>

        <section class="card card-pad every">
          <header class="row-between">
            <h2 class="title-sm">Where every $100 in {{ what }} goes</h2>
            <p class="label-mono">1 dot = $1</p>
          </header>
          <DotGrid :segments="segments" :label="`${dots} of 100 dots cross your lines`" />
          <ul class="legend">
            <li v-for="group in groups" :key="group.id">
              <p class="legend__name"><span class="dot dot-10" :style="{ '--dot': group.color }" />{{ group.label }}</p>
              <p class="legend__pct">{{ pct(group.share) }}</p>
              <p class="legend__who">{{ listNames(group.names) }}</p>
            </li>
            <li>
              <p class="legend__name"><span class="dot dot-10" style="--dot: var(--border)" />Passes your lines</p>
              <p class="legend__pct">{{ pct(1 - flagged.share) }}</p>
              <p class="legend__who">Everything else in {{ what }}</p>
            </li>
          </ul>
          <p class="small">Sample weights, not a live scan. Each company is counted once, under the first of your lines it crosses.</p>
        </section>

        <section class="card card-pad lines">
          <header class="row-between">
            <h2 class="title-card">Your lines. Your call.</h2>
            <p class="label-mono">{{ data.selectedIds.value.length }} selected</p>
          </header>
          <CategoryPicker :categories="catalog.categories" :selected="data.selectedIds.value" @toggle="catalog.toggle" />
          <p class="small">These are industry choices, not verdicts. Every figure on this page follows them.</p>
          <RouterLink to="/settings" class="btn btn-outline btn-md">All categories</RouterLink>
        </section>
      </div>

      <aside class="col-side">
        <ExposureReceipt :data="data" />

        <section class="card who">
          <header class="row-between who__head">
            <h2 class="title-card">Who crosses your lines</h2>
            <p class="label-mono">{{ shown.length }} of {{ crossers.length }} shown</p>
          </header>

          <article v-for="{ row, lines, tag, host } in shown" :key="row.ticker" class="holding rule-top">
            <div class="holding__top">
              <span class="ticker-tile">{{ row.ticker }}</span>
              <div class="holding__company">
                <h3 class="holding__name">{{ data.nameOf(row.ticker) }}</h3>
                <p class="holding__line"><span class="dot" :style="{ '--dot': catalog.color(lines[0]) }" />{{ lines.map(catalog.label).join(' · ') }}</p>
              </div>
              <div class="holding__weight">
                <p class="num-mono holding__pct">{{ pct(row.weight) }}</p>
                <p class="holding__per">{{ usd(row.valueUsd) }}</p>
              </div>
            </div>
            <p class="holding__why">{{ tag.reason }}</p>
            <div class="holding__actions">
              <a :href="tag.sourceUrl" target="_blank" rel="noopener noreferrer" class="source-link">Source: {{ host }} ↗</a>
              <button v-if="demo.exclusions.tickers.includes(row.ticker)" type="button" class="btn btn-quiet btn-sm" @click="demo.toggleExcludedTicker(row.ticker)">
                Excluded · Undo
              </button>
              <button v-else type="button" class="btn btn-outline btn-sm" @click="demo.toggleExcludedTicker(row.ticker)">Exclude in What-if</button>
            </div>
          </article>

          <div v-if="hidden.length" class="who__more rule-top">
            <span class="dot" style="--dot: var(--violet)" />
            <div class="who__more-text">
              <p class="who__more-title">{{ plural(hidden.length, 'more company', 'more companies') }}</p>
              <p class="who__more-sub">In the table below, with reasons and sources</p>
            </div>
            <p class="num-mono who__more-pct">{{ pct(hiddenShare) }}</p>
          </div>
        </section>
      </aside>
    </div>

    <HoldingsTable :data="data" />

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
          <p class="label-mono">Option 1 · Keep what you hold</p>
          <h3 class="keep__title">Keep {{ what }} as it is.</h3>
          <p class="body-muted">Nothing changes. {{ headlinePct(flagged.share) }} stays in companies that cross your lines, and now you know which ones.</p>
        </div>
        <span class="tag"><span class="dot" />Portfolio unchanged</span>
      </article>

      <div class="options__pair">
        <article class="card card-pad option">
          <p class="label-mono">Option 2 · Cut companies · free</p>
          <h3 class="title-lg">See what cutting them would cost.</h3>
          <p class="body-muted">
            Switch off whole categories or single companies and see the back-tested return next to the S&amp;P 500, before anything changes.
            <template v-if="excludedCount"> You have {{ plural(excludedCount, 'exclusion') }} waiting there.</template>
          </p>
          <div class="option__actions">
            <RouterLink to="/whatif" class="btn btn-primary">Open What-if</RouterLink>
          </div>
          <p class="small">A what-if, not an order. Past performance does not predict future results.</p>
        </article>

        <article class="card card-pad option">
          <p class="label-mono">Option 3 · Act on it · paid plan</p>
          <h3 class="title-lg">Bring your real account.</h3>
          <p class="body-muted">Connect a brokerage to check what you actually hold, keep watch for changes, and review trades before anything is sent.</p>
          <div class="option__actions">
            <RouterLink to="/connect" class="btn btn-outline">Connect brokerage</RouterLink>
          </div>
          <p class="small">Rally reads what you own. The money stays at your broker.</p>
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
.option__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: auto;
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
