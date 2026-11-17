<script setup lang="ts">
// Figma "Zero conflicts": the scan finished and nothing in the portfolio crosses the user's lines.
// With no lines picked nothing was checked, so the screen says that instead of calling it clean.
import CategoryPicker from '@/components/rally/CategoryPicker.vue'
import ConnectedBadge from '@/components/rally/ConnectedBadge.vue'
import DotGrid from '@/components/rally/DotGrid.vue'
import ReceiptPaper from '@/components/rally/ReceiptPaper.vue'
import type { PortfolioData } from '@/composables/usePortfolioData'
import { useCatalogStore } from '@/state/catalog'
import { plural } from '@/utils/format'
import { computed } from 'vue'
import HoldingsTable from './HoldingsTable.vue'

const props = defineProps<{ data: PortfolioData }>()

const catalog = useCatalogStore()
const portfolio = computed(() => props.data.portfolio.value!)
const what = computed(() => (portfolio.value.origin === 'fund' ? portfolio.value.id : 'your portfolio'))
const receiptName = computed(() => (portfolio.value.origin === 'fund' ? portfolio.value.id : 'your picks'))
const count = computed(() => catalog.selectedIds.length)
const none = computed(() => count.value === 0)
const names = computed(() => catalog.selected.map((c) => c.label))
const linesLabel = computed(() => `${plural(count.value, 'line')} checked`)
</script>

<template>
  <div class="page">
    <div class="page-cols">
      <div class="col-main">
        <header class="page-head zero__head">
          <p class="eyebrow">Your Rally · Portfolio · sample data</p>
          <ConnectedBadge :portfolio="portfolio" />
          <template v-if="none">
            <p class="tag"><span class="dot" style="--dot: var(--sun)" />No lines picked</p>
            <p class="lead">Nothing has been checked yet.</p>
            <div class="zero__number">
              <p class="stat-xl zero__pct is-none">–</p>
              <div class="zero__sentence">
                <h1 class="zero__claim">Pick a line,<br />then look again.</h1>
                <p class="label-mono zero__fine">0 lines checked</p>
              </div>
            </div>
            <p class="zero__note">Without a line there is nothing to match, so this is not a clean result. Add one on the right.</p>
          </template>
          <template v-else>
            <p class="tag tag-pass"><span class="dot" style="--dot: var(--pass)" />No conflicts found</p>
            <p class="lead">Your receipt is in.</p>
            <div class="zero__number">
              <p class="stat-xl zero__pct">0%</p>
              <div class="zero__sentence">
                <h1 class="zero__claim">You’re clean,<br />for now.</h1>
                <p class="label-mono zero__fine">$0 of every $100 · {{ linesLabel }}</p>
              </div>
            </div>
            <p class="zero__note">No matches to the lines in this scan. That’s the result, not a promise forever.</p>
          </template>
        </header>

        <section class="card card-pad every">
          <header class="row-between">
            <h2 class="title-sm">Where every $100 in {{ what }} goes</h2>
            <p v-if="none" class="label-mono">1 dot = $1 · nothing checked</p>
            <p v-else class="label-mono zero__all">1 dot = $1 · all 100 pass</p>
          </header>
          <DotGrid v-if="none" label="No lines picked, so no dots are checked" />
          <DotGrid v-else :segments="[{ count: 100, color: 'var(--pass)' }]" label="All 100 dots pass your lines" />
          <ul class="legend">
            <li>
              <p class="legend__name">Your lines</p>
              <p class="legend__val">{{ count }}</p>
              <p class="legend__who">{{ names.join(' · ') || 'No lines picked' }}</p>
            </li>
            <li>
              <p class="legend__name">Matched companies</p>
              <p class="legend__val">0</p>
              <p class="legend__who">{{ none ? 'Nothing was checked' : `Of ${plural(data.rows.value.length, 'holding')}` }}</p>
            </li>
            <li>
              <p class="legend__name">Scanned</p>
              <p class="legend__val">{{ portfolio.origin === 'fund' ? portfolio.id : data.rows.value.length }}</p>
              <p class="legend__who">{{ portfolio.name }} · sample holdings</p>
            </li>
          </ul>
          <p class="small">Sample data. Tags cover only what a checked source supports, so a clean result can still miss something.</p>
        </section>

        <section class="covers">
          <header class="covers__head">
            <h2 class="title-section">What this scan covers.</h2>
            <p class="label-mono">Sample data · holdings only</p>
          </header>
          <p class="covers__text">
            This result covers only your selected lines<template v-if="names.length"> ({{ names.join(', ') }})</template> and the tags in the sample data. It is not an
            endorsement of the fund or of every company inside it, and it is not a promise forever.
          </p>
          <div class="covers__foot rule-top">
            <p class="label-mono">0 matched companies</p>
            <p class="label-mono">{{ linesLabel }} · no exclusions needed</p>
          </div>
        </section>
      </div>

      <aside class="col-side has-receipt">
        <ReceiptPaper v-if="none" class="side-receipt" compact flat skeleton :subtitle="`Conflict receipt · ${receiptName}`" note="Pick a line to print a receipt." />
        <ReceiptPaper
          v-else
          class="side-receipt"
          compact
          flat
          :subtitle="`Conflict receipt · ${receiptName}`"
          :meta="[
            { label: 'Checked lines', value: String(count) },
            { label: 'Matched companies', value: '0' },
          ]"
          :total="{ label: 'Crosses your lines', note: `per $100 in ${what}`, value: '$0.00', tone: 'ink' }"
          :after="[{ label: 'Passes your lines', value: '$100.00' }]"
          footer="No matches. For now. · Sample data"
        />

        <section class="card card-pad side-lines">
          <header class="row-between">
            <h2 class="title-card">Your lines. Still editable.</h2>
            <p class="label-mono">{{ count }} selected</p>
          </header>
          <CategoryPicker :categories="catalog.categories" :selected="catalog.selectedIds" @toggle="catalog.toggle" />
          <p class="small">Want a wider check? Add a line and the result updates.</p>
          <RouterLink to="/settings" class="btn btn-outline">All categories</RouterLink>
        </section>
      </aside>
    </div>

    <HoldingsTable :data="data" />
  </div>
</template>

<style scoped>
.zero__head {
  gap: 14px;
}
.zero__number {
  display: flex;
  align-items: center;
  gap: 32px;
}
.zero__pct {
  color: var(--pass);
}
.zero__pct.is-none {
  color: var(--text-muted);
}
.zero__sentence {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.zero__claim {
  font-family: var(--font-sans);
  font-size: 32px;
  font-weight: 500;
  line-height: 1.25;
  text-transform: none;
  color: var(--text);
}
.zero__fine {
  font-size: 13px;
}
.zero__note {
  font-size: 17px;
  color: var(--text-muted);
}
.zero__all {
  color: var(--pass);
}
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
  font-weight: 600;
  line-height: 18px;
}
.legend__val {
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
.covers {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.covers__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}
.covers__text {
  font-size: 16px;
  line-height: 1.55;
  color: var(--text-muted);
}
.covers__foot {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-top: 6px;
  padding-top: 16px;
}
.side-lines {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
}
.side-lines > header {
  width: 100%;
}
</style>
