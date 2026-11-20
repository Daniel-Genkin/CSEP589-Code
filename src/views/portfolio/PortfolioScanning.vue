<script setup lang="ts">
// Figma "Scanning": the portfolio is being checked against the user's lines; no result yet.
// This is the loading state for seeded calls on this screen.
import ReceiptPaper from '@/components/rally/ReceiptPaper.vue'
import { useCatalogStore } from '@/state/catalog'
import type { Portfolio } from '@/types'
import { plural } from '@/utils/format'
import { computed } from 'vue'

const props = defineProps<{ portfolio: Portfolio }>()

const catalog = useCatalogStore()
const count = computed(() => catalog.selectedIds.length)
const linesLabel = computed(() => plural(count.value, 'line'))
const tile = computed(() => (props.portfolio.origin === 'fund' ? props.portfolio.id : String(props.portfolio.holdings.length)))
</script>

<template>
  <div class="page">
    <div class="page-cols">
      <div class="col-main">
        <header class="page-head">
          <p class="eyebrow">Scan in progress · Step 3 of 3</p>
          <h1 class="scan__title">Scanning<br />{{ portfolio.origin === 'fund' ? portfolio.id : 'your picks' }}...</h1>
          <p class="lead">Hold the receipt. You picked your lines; now we’re checking what you hold against them.</p>
        </header>

        <section class="card card-pad scan" aria-live="polite" aria-busy="true">
          <header class="scan__head">
            <span class="ticker-tile ticker-tile-lg">{{ tile }}</span>
            <div class="scan__fund">
              <p class="scan__name">{{ portfolio.name }}</p>
              <p class="body-muted">{{ linesLabel }} · scanning now</p>
            </div>
            <span class="tag"><span class="dot" />In progress</span>
          </header>
          <h2 class="title-lg">Scan in progress.</h2>
          <p class="scan__text">Reading the fine print: matching holdings to your {{ linesLabel }} and collecting the source for each tag. Your receipt isn’t ready yet.</p>
          <div class="scan__bar" role="progressbar" aria-label="Scan progress"><span /></div>
          <p class="label-mono scan__bar-label">Checking holdings…</p>

          <ol class="scan__steps">
            <li class="rule-top is-done">
              <span class="scan__n">01</span>
              <span class="scan__step"><b>Pick what you hold</b><span>{{ portfolio.name }}</span></span>
              <span class="label-mono">Done</span>
            </li>
            <li class="rule-top is-done">
              <span class="scan__n">02</span>
              <span class="scan__step"><b>Pick your lines</b><span>{{ plural(count, 'choice') }} saved</span></span>
              <span class="label-mono">Done</span>
            </li>
            <li class="rule-top is-now">
              <span class="scan__n">03</span>
              <span class="scan__step"><b>Scan and print your receipt</b><span>Matching holdings and collecting sources…</span></span>
              <span class="label-mono">In progress</span>
            </li>
          </ol>
          <p class="label-mono">No result, exposure or trades yet.</p>
        </section>
      </div>

      <aside class="col-side has-receipt">
        <ReceiptPaper
          class="side-receipt"
          compact
          flat
          :subtitle="`Conflict receipt · ${portfolio.origin === 'fund' ? portfolio.id : 'your picks'}`"
          :meta="[{ label: 'Lines', value: `${count} saved` }]"
          skeleton
          :skeleton-rows="2"
          note="Printing… your receipt isn’t ready yet."
        />
        <section class="card card-pad side-lines">
          <header class="row-between">
            <h2 class="title-sm">The conditions we’re checking.</h2>
            <p class="label-mono">{{ count }} selected</p>
          </header>
          <ul class="chips">
            <li v-for="category in catalog.selected" :key="category.id" class="chip"><span class="dot dot-10" :style="{ '--dot': category.color }" />{{ category.label }}</li>
          </ul>
          <p class="small">Sample data. Nothing is sent anywhere.</p>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.scan__title {
  font-size: clamp(80px, 7.8vw, 112px);
  line-height: 1;
}
.scan {
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.scan__head {
  display: flex;
  align-items: center;
  gap: 16px;
}
.scan__fund {
  flex: 1 1 0;
  min-width: 0;
}
.scan__name {
  font-size: 19px;
  font-weight: 600;
  line-height: 1.25;
}
.scan__text {
  font-size: 16px;
  line-height: 1.5;
  color: var(--text-muted);
}
.scan__bar {
  position: relative;
  height: 12px;
  border-radius: var(--radius-pill);
  background: var(--track);
  overflow: hidden;
}
.scan__bar span {
  position: absolute;
  top: 0;
  left: 20%;
  width: 200px;
  height: 100%;
  border-radius: var(--radius-pill);
  background: var(--brand-400);
  animation: sweep 1.6s var(--ease) infinite alternate;
}
@keyframes sweep {
  from {
    left: 0;
  }
  to {
    left: calc(100% - 200px);
  }
}
.scan__bar-label {
  margin-top: -12px;
}
.scan__steps li {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 18px 0;
}
.scan__n {
  display: grid;
  place-items: center;
  flex: none;
  width: 44px;
  height: 44px;
  border: 1px solid var(--border);
  border-radius: 50%;
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
}
.is-done .scan__n {
  border-color: var(--sun);
  background: var(--sun);
  color: var(--ink);
}
.is-now .scan__n {
  border-color: var(--brand-300);
  color: var(--brand-300);
}
.is-now .label-mono {
  color: var(--brand-300);
}
.scan__step {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.scan__step b {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.25;
}
.scan__step span {
  font-size: 14px;
  color: var(--text-muted);
}
.side-lines {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
