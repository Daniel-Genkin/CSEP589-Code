<script setup lang="ts">
// Figma "Data unavailable": the data could not be read. Missing data is never shown as a clean result.
import CategoryPicker from '@/components/rally/CategoryPicker.vue'
import { useCatalogStore } from '@/state/catalog'
import { useDemoStore } from '@/state/demo'
import type { Portfolio } from '@/types'
import { plural } from '@/utils/format'
import { computed } from 'vue'

const props = defineProps<{ portfolio: Portfolio }>()
defineEmits<{ retry: [] }>()

const demo = useDemoStore()
const catalog = useCatalogStore()
const count = computed(() => catalog.selectedIds.length)
const tile = computed(() => (props.portfolio.origin === 'fund' ? props.portfolio.id : String(props.portfolio.holdings.length)))
</script>

<template>
  <div class="page">
    <div class="page-cols">
      <div class="col-main">
        <header class="page-head">
          <p class="eyebrow">Your Rally · Portfolio</p>
          <h1 class="gone__title">We couldn’t<br />find the data.</h1>
          <p class="lead">We couldn’t finish this scan. Your lines are saved; your result isn’t ready.</p>
        </header>

        <section class="card card-pad gone" role="alert">
          <header class="gone__head">
            <span class="ticker-tile ticker-tile-lg">{{ tile }}</span>
            <div class="gone__fund">
              <p class="gone__name">{{ portfolio.name }}</p>
              <p class="body-muted">{{ plural(count, 'line') }} · scan incomplete</p>
            </div>
            <span class="tag"><span class="dot" style="--dot: var(--flare)" />Data unavailable</span>
          </header>
          <h2 class="title-lg">The data didn’t come through.</h2>
          <p class="gone__text">We can’t read the holdings and source data needed to work out your exposure right now. No completed result is available for this scan.</p>
          <div class="inset">
            <p class="label-mono gone__flag">Exposure: unavailable — not zero</p>
            <p>We won’t pass off missing data as a clean portfolio, or show an older receipt as a fresh result. What-if and trades are unavailable until a scan succeeds.</p>
          </div>
          <div class="gone__actions">
            <button type="button" class="btn btn-primary" @click="$emit('retry')">Retry scan</button>
            <button type="button" class="btn btn-outline" @click="demo.setPortfolio(null)">Change fund →</button>
          </div>
          <p class="label-mono">Nothing has moved. No account is connected.</p>
        </section>

        <section class="means">
          <header class="means__head">
            <h2 class="title-section">What this means for you.</h2>
            <p class="label-mono">We hold the receipt until it’s complete.</p>
          </header>
          <ul>
            <li>
              <span class="dot" style="--dot: var(--flare)" />
              <span class="means__text"><b>What-if</b><span>Unavailable until a scan succeeds. No stale result will be used.</span></span>
              <span class="label-mono">Unavailable</span>
            </li>
            <li>
              <span class="dot" style="--dot: var(--flare)" />
              <span class="means__text"><b>Trades</b><span>Unavailable. We won’t propose trades from an incomplete scan.</span></span>
              <span class="label-mono">Unavailable</span>
            </li>
            <li>
              <span class="dot" style="--dot: var(--sun)" />
              <span class="means__text"><b>Your saved lines</b><span>All {{ plural(count, 'choice') }} are intact. Edit or retry anytime.</span></span>
              <span class="label-mono">Saved</span>
            </li>
          </ul>
        </section>
      </div>

      <aside class="col-side has-receipt">
        <div class="no-receipt" aria-hidden="true">
          <p class="no-receipt__title">No receipt.</p>
          <p class="label-mono">We hold the receipt until it’s complete.</p>
        </div>

        <section class="card card-pad side-lines">
          <header class="row-between">
            <h2 class="title-card">Your lines. Still yours.</h2>
            <p class="label-mono">{{ count }} saved</p>
          </header>
          <CategoryPicker :categories="catalog.categories" :selected="catalog.selectedIds" @toggle="catalog.toggle" />
          <p class="small">Retry with these choices, or change your fund. We’ll print a new receipt only after the data is available.</p>
          <button type="button" class="btn btn-outline" @click="$emit('retry')">Rescan with these lines</button>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.gone__title {
  font-size: clamp(88px, 8.9vw, 128px);
  line-height: 1;
}
.gone {
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.gone__head {
  display: flex;
  align-items: center;
  gap: 16px;
}
.gone__fund {
  flex: 1 1 0;
  min-width: 0;
}
.gone__name {
  font-size: 19px;
  font-weight: 600;
  line-height: 1.25;
}
.gone__text {
  font-size: 16px;
  line-height: 1.5;
  color: var(--text-muted);
}
.gone__flag {
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--flare);
}
.gone__actions {
  display: flex;
  gap: 12px;
}
.means {
  display: flex;
  flex-direction: column;
  gap: 28px;
}
.means ul {
  display: flex;
  flex-direction: column;
  gap: 28px;
}
.means__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}
.means li {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--hairline);
}
.means li .dot {
  width: 10px;
  height: 10px;
}
.means__text {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.means__text b {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.25;
}
.means__text span {
  font-size: 14px;
  color: var(--text-muted);
}
.no-receipt {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  align-self: center;
  width: 416px;
  max-width: 100%;
  height: 380px;
  border: 1px dashed var(--border);
  border-radius: 6px;
  transform: rotate(1.5deg);
}
.no-receipt__title {
  font-family: var(--font-display);
  font-size: 56px;
  line-height: 1;
  text-transform: uppercase;
  color: var(--text-muted);
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
