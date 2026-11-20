<script lang="ts">
// How the table is being viewed. Kept outside the component so sorting, filtering and collapsed
// funds survive the screen switching between its "breakdown" and "zero conflicts" layouts.
import { reactive } from 'vue'

type SortKey = 'weight' | 'value' | 'ticker'
const freshView = () => ({
  portfolio: '',
  view: 'grouped' as 'grouped' | 'combined',
  sort: { key: 'weight' as SortKey, descending: true },
  filter: null as string | null,
  collapsed: new Set<string>(),
})
const ui = reactive(freshView())
</script>

<script setup lang="ts">
// The holdings table (PRD F2): ticker, name, sector, weight, value and the values tags on each
// holding as chips. Companies that came from a fund are grouped under it and can be collapsed.
// Sortable by weight, value and ticker; filterable by category. In a ticker-built portfolio the
// weights can be edited in place and re-normalize to 100%.
import TagChip from '@/components/rally/TagChip.vue'
import type { PortfolioData } from '@/composables/usePortfolioData'
import { categoriesByTicker } from '@/domain/exposure'
import { constituentsOf, positionsOf, setHoldingWeight } from '@/domain/portfolio'
import { useCatalogStore } from '@/state/catalog'
import { useDemoStore } from '@/state/demo'
import type { ValuesTag } from '@/types'
import { pct, plural, usd } from '@/utils/format'
import { computed, nextTick, toRef, watch } from 'vue'

const props = defineProps<{ data: PortfolioData }>()

interface Line {
  ticker: string
  weight: number
  valueUsd: number
  /** Funds this company is held through (combined view) */
  via?: string
}
interface Group {
  /** The fund, or null for holdings held directly */
  fund: string | null
  weight: number
  valueUsd: number
  lines: Line[]
  /** Companies in the group before the category filter */
  size: number
}

const demo = useDemoStore()
const catalog = useCatalogStore()

const view = toRef(ui, 'view')
const sort = toRef(ui, 'sort')
const filter = toRef(ui, 'filter')
const collapsed = toRef(ui, 'collapsed')

const portfolio = computed(() => props.data.portfolio.value!)
const funds = computed(() => props.data.funds.value)
const editable = computed(() => portfolio.value.origin === 'tickers' && portfolio.value.holdings.length > 1)

// A different portfolio starts with a fresh view.
watch(
  () => `${portfolio.value.origin}:${portfolio.value.id}`,
  (key) => {
    if (ui.portfolio !== key) Object.assign(ui, freshView(), { portfolio: key })
  },
  { immediate: true },
)

/** The tags to show on a holding: only the categories the user has switched on, in their order. */
const tagsOf = computed(() => {
  const byKey = new Map(props.data.tags.value.map((t) => [`${t.ticker}|${t.category}`, t]))
  const map = new Map<string, ValuesTag[]>()
  for (const [ticker, categories] of categoriesByTicker(props.data.tags.value, props.data.selectedIds.value)) {
    map.set(ticker, categories.map((c) => byKey.get(`${ticker}|${c}`)!))
  }
  return map
})

const filters = computed(() =>
  props.data.exposures.value.filter((e) => e.count > 0).map((e) => ({ id: e.category, label: catalog.label(e.category), color: catalog.color(e.category), count: e.count })),
)
// A filter only applies while its chip is on screen: the category is selected and something is tagged in it.
const activeFilter = computed(() => (filter.value && filters.value.some((f) => f.id === filter.value) ? filter.value : null))
watch(activeFilter, (active) => {
  if (!active) filter.value = null // forget a filter whose chip has gone, so it cannot come back unasked
})
const matches = (ticker: string) => !activeFilter.value || (tagsOf.value.get(ticker) ?? []).some((t) => t.category === activeFilter.value)

const compare = (a: Line, b: Line) => {
  const { key, descending } = sort.value
  const order = key === 'ticker' ? a.ticker.localeCompare(b.ticker) : key === 'value' ? a.valueUsd - b.valueUsd : a.weight - b.weight
  return (descending ? -order : order) || a.ticker.localeCompare(b.ticker)
}

const groups = computed<Group[]>(() => {
  const out: Group[] = []
  const direct: Line[] = []
  for (const position of positionsOf(portfolio.value, funds.value)) {
    if (!position.isFund) {
      direct.push({ ticker: position.ticker, weight: position.weight, valueUsd: position.valueUsd })
      continue
    }
    const inside = constituentsOf(portfolio.value, funds.value, position.ticker)
    const lines = inside.map((c) => ({ ticker: c.ticker, weight: position.weight * c.weight, valueUsd: position.valueUsd * c.weight }))
    const shown = lines.filter((l) => matches(l.ticker)).sort(compare)
    // While filtering, a fund with nothing that matches is left out.
    if (shown.length || !activeFilter.value) out.push({ fund: position.ticker, weight: position.weight, valueUsd: position.valueUsd, size: lines.length, lines: shown })
  }
  out.sort((a, b) => compare({ ticker: a.fund!, weight: a.weight, valueUsd: a.valueUsd }, { ticker: b.fund!, weight: b.weight, valueUsd: b.valueUsd }))
  const directShown = direct.filter((l) => matches(l.ticker))
  if (directShown.length || (direct.length && !activeFilter.value)) {
    out.push({
      fund: null,
      weight: direct.reduce((sum, l) => sum + l.weight, 0),
      valueUsd: direct.reduce((sum, l) => sum + l.valueUsd, 0),
      size: direct.length,
      lines: direct.filter((l) => matches(l.ticker)).sort(compare),
    })
  }
  return out
})

const combined = computed<Line[]>(() =>
  props.data.rows.value
    .filter((row) => matches(row.ticker))
    .map((row) => ({ ticker: row.ticker, weight: row.weight, valueUsd: row.valueUsd, via: [...new Set(row.slices.map((s) => s.via ?? 'Direct'))].join(', ') }))
    .sort(compare),
)

const hasFunds = computed(() => groups.value.some((g) => g.fund))
const mixed = computed(() => hasFunds.value && portfolio.value.origin !== 'fund')
/** Rows on screen right now: collapsed funds contribute none. */
const shownCount = computed(() =>
  view.value === 'combined' ? combined.value.length : groups.value.reduce((sum, g) => sum + (g.fund && collapsed.value.has(g.fund) ? 0 : g.lines.length), 0),
)
const nothingMatches = computed(() => (view.value === 'combined' ? !combined.value.length : !groups.value.length))

function sortBy(key: SortKey) {
  sort.value = sort.value.key === key ? { key, descending: !sort.value.descending } : { key, descending: key !== 'ticker' }
}
const ariaSort = (key: SortKey) => (sort.value.key !== key ? 'none' : sort.value.descending ? 'descending' : 'ascending')
const arrow = (key: SortKey) => (sort.value.key !== key ? '' : sort.value.descending ? '↓' : '↑')

function toggleGroup(fund: string) {
  const next = new Set(collapsed.value)
  if (!next.delete(fund)) next.add(fund)
  collapsed.value = next
}

const percentOf = (weight: number) => Number((weight * 100).toFixed(2))
const weightField = (ticker: string) => document.querySelector<HTMLInputElement>(`input[data-weight-for="${ticker}"]`)

/** Set one holding's weight; the rest re-normalize so the portfolio still sums to 100%. */
async function setWeight(ticker: string, event: Event) {
  const input = event.target as HTMLInputElement
  const typed = input.value.trim()
  const percent = Number(typed)
  // An emptied or unreadable field changes nothing: put the current weight back.
  if (typed !== '' && Number.isFinite(percent)) {
    const prices = Object.fromEntries([...props.data.securities.value].map(([t, s]) => [t, s.price]))
    demo.updatePortfolio(setHoldingWeight(portfolio.value, ticker, percent / 100, prices))
  }
  // Rows re-sort after an edit, which can drop keyboard focus. Remember where it was.
  const focused = (document.activeElement as HTMLElement | null)?.dataset?.weightFor
  await nextTick()
  // The field shows what was typed until told otherwise; a clamped or rounded value must show as stored.
  for (const holding of portfolio.value.holdings) {
    const field = weightField(holding.ticker)
    if (field && field !== document.activeElement) field.value = String(percentOf(holding.weight))
  }
  const current = weightField(ticker)
  if (current && current === document.activeElement) current.value = String(percentOf(portfolio.value.holdings.find((h) => h.ticker === ticker)?.weight ?? 0))
  if (focused && (document.activeElement as HTMLElement | null)?.dataset?.weightFor !== focused) weightField(focused)?.focus()
}
const sectorOf = (ticker: string) => props.data.securities.value.get(ticker)?.sector ?? ''
</script>

<template>
  <section class="card holdings">
    <header class="holdings__head">
      <div>
        <h2 class="title-card">Everything you hold</h2>
        <p class="body-muted">
          {{ plural(data.rows.value.length, 'company', 'companies') }}<template v-if="hasFunds">, with funds broken into what they hold</template>.
          <template v-if="editable && view === 'grouped'"> Edit a weight and the rest re-balance to 100%.</template>
        </p>
      </div>
      <div v-if="mixed" class="tabs holdings__view" role="group" aria-label="How to list holdings">
        <button type="button" class="tab" :class="{ 'is-active': view === 'grouped' }" :aria-pressed="view === 'grouped'" @click="view = 'grouped'">By fund</button>
        <button type="button" class="tab" :class="{ 'is-active': view === 'combined' }" :aria-pressed="view === 'combined'" @click="view = 'combined'">Combined</button>
      </div>
    </header>

    <div class="holdings__filters" role="group" aria-label="Filter by category">
      <button type="button" class="chip" :class="{ 'is-active': !activeFilter }" :aria-pressed="!activeFilter" @click="filter = null">All · {{ data.rows.value.length }}</button>
      <button
        v-for="f in filters"
        :key="f.id"
        type="button"
        class="chip"
        :class="{ 'is-active': activeFilter === f.id }"
        :aria-pressed="activeFilter === f.id"
        @click="filter = activeFilter === f.id ? null : f.id"
      >
        <span class="dot dot-10" :style="{ '--dot': f.color }" />{{ f.label }} · {{ f.count }}
      </button>
      <p class="label-mono holdings__count">{{ plural(shownCount, 'row') }} shown</p>
    </div>

    <div>
      <table>
        <thead>
          <tr>
            <th scope="col" :aria-sort="ariaSort('ticker')">
              <button type="button" class="sort" @click="sortBy('ticker')">Ticker <span aria-hidden="true">{{ arrow('ticker') }}</span></button>
            </th>
            <th scope="col">Company</th>
            <th scope="col">Sector</th>
            <th v-if="view === 'combined'" scope="col">Held through</th>
            <th scope="col">Lines crossed</th>
            <th scope="col" class="num" :aria-sort="ariaSort('weight')">
              <button type="button" class="sort" @click="sortBy('weight')"><span aria-hidden="true">{{ arrow('weight') }}</span> Weight</button>
            </th>
            <th scope="col" class="num" :aria-sort="ariaSort('value')">
              <button type="button" class="sort" @click="sortBy('value')"><span aria-hidden="true">{{ arrow('value') }}</span> Value</button>
            </th>
          </tr>
        </thead>

        <tbody v-if="view === 'combined'">
          <tr v-for="line in combined" :key="line.ticker">
            <td class="num-mono ticker">{{ line.ticker }}</td>
            <td>{{ data.nameOf(line.ticker) }}</td>
            <td class="muted">{{ sectorOf(line.ticker) }}</td>
            <td class="muted">{{ line.via }}</td>
            <td>
              <span class="tags">
                <TagChip v-for="tag in tagsOf.get(line.ticker) ?? []" :key="tag.category" :tag="tag" :label="catalog.label(tag.category)" :color="catalog.color(tag.category)" :company="data.nameOf(line.ticker)" />
              </span>
            </td>
            <td class="num num-mono">{{ pct(line.weight, 2) }}</td>
            <td class="num num-mono">{{ usd(line.valueUsd) }}</td>
          </tr>
        </tbody>

        <template v-else>
          <tbody v-for="group in groups" :key="group.fund ?? 'direct'">
            <tr v-if="group.fund" class="group">
              <td class="num-mono ticker">
                <button type="button" class="group__toggle" :aria-expanded="!collapsed.has(group.fund)" :aria-label="`${collapsed.has(group.fund) ? 'Show' : 'Hide'} the companies in ${group.fund}`" @click="toggleGroup(group.fund)">
                  <span aria-hidden="true">{{ collapsed.has(group.fund) ? '+' : '−' }}</span>{{ group.fund }}
                </button>
              </td>
              <td>
                <strong>{{ data.nameOf(group.fund) }}</strong>
              </td>
              <td class="muted">Fund</td>
              <td class="muted">{{ group.lines.length === group.size ? plural(group.size, 'company', 'companies') : `${group.lines.length} of ${group.size} companies` }} inside</td>
              <td class="num num-mono">
                <label v-if="editable" class="weight">
                  <span class="sr-only">Weight of {{ group.fund }} in percent</span>
                  <input type="number" min="0" max="100" step="0.01" :data-weight-for="group.fund" :value="percentOf(group.weight)" @change="setWeight(group.fund, $event)" />%
                </label>
                <template v-else>{{ pct(group.weight, 2) }}</template>
              </td>
              <td class="num num-mono">{{ usd(group.valueUsd) }}</td>
            </tr>
            <tr v-else-if="hasFunds" class="group group--direct">
              <td colspan="4"><strong>Held directly</strong></td>
              <td class="num num-mono">{{ pct(group.weight, 2) }}</td>
              <td class="num num-mono">{{ usd(group.valueUsd) }}</td>
            </tr>
            <template v-if="!group.fund || !collapsed.has(group.fund)">
              <tr v-for="line in group.lines" :key="line.ticker" :class="{ 'is-inside': group.fund }">
                <td class="num-mono ticker">{{ line.ticker }}</td>
                <td>{{ data.nameOf(line.ticker) }}</td>
                <td class="muted">{{ sectorOf(line.ticker) }}</td>
                <td>
                  <span class="tags">
                    <TagChip v-for="tag in tagsOf.get(line.ticker) ?? []" :key="tag.category" :tag="tag" :label="catalog.label(tag.category)" :color="catalog.color(tag.category)" :company="data.nameOf(line.ticker)" />
                  </span>
                </td>
                <td class="num num-mono">
                  <label v-if="editable && !group.fund" class="weight">
                    <span class="sr-only">Weight of {{ line.ticker }} in percent</span>
                    <input type="number" min="0" max="100" step="0.01" :data-weight-for="line.ticker" :value="percentOf(line.weight)" @change="setWeight(line.ticker, $event)" />%
                  </label>
                  <template v-else>{{ pct(line.weight, 2) }}</template>
                </td>
                <td class="num num-mono">{{ usd(line.valueUsd) }}</td>
              </tr>
            </template>
          </tbody>
        </template>
      </table>
      <p v-if="nothingMatches" class="holdings__empty">Nothing you hold is tagged in that category.</p>
    </div>
  </section>
</template>

<style scoped>
.holdings {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 28px 28px 20px;
}
.holdings__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}
.holdings__head > div:first-child {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.holdings__view {
  padding: 4px;
  border-radius: var(--radius-pill);
  background: var(--ink);
}
.holdings__view .tab {
  padding: 8px 16px;
  font-size: 13px;
}
.holdings__filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.holdings__filters .chip {
  padding: 8px 14px 8px 12px;
  font-size: 14px;
}
.holdings__count {
  margin-left: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th {
  padding: 10px 12px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-align: left;
  text-transform: uppercase;
  color: var(--text-muted);
  white-space: nowrap;
}
.sort {
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  color: inherit;
}
.sort:hover,
th[aria-sort='ascending'] .sort,
th[aria-sort='descending'] .sort {
  color: var(--text);
}
td {
  padding: 12px;
  border-top: 1px solid var(--hairline);
  font-size: 15px;
  vertical-align: middle;
}
.num {
  text-align: right;
  white-space: nowrap;
}
.muted {
  font-size: 14px;
  color: var(--text-muted);
}
.ticker {
  color: var(--cream);
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.group td {
  background: var(--surface-inset);
}
.group td:first-child {
  border-radius: var(--radius-sm) 0 0 var(--radius-sm);
}
.group td:last-child {
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}
.group strong {
  font-weight: 600;
}
.group__toggle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font: inherit;
  color: inherit;
}
.group__toggle span {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border: 1px solid var(--border);
  border-radius: 50%;
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1;
  color: var(--text);
}
.is-inside td:first-child {
  padding-left: 42px;
}
.weight {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.weight input {
  width: 84px;
  height: 34px;
  padding: 0 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  background: var(--ink);
  font: inherit;
  text-align: right;
  color: var(--text);
  appearance: textfield;
}
.weight input::-webkit-outer-spin-button,
.weight input::-webkit-inner-spin-button {
  appearance: none;
  margin: 0;
}
.weight input:focus {
  outline: none;
  border-color: var(--brand-400);
  box-shadow: var(--ring);
}
.holdings__empty {
  padding: 28px 12px;
  text-align: center;
  color: var(--text-muted);
}
</style>
