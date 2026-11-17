<script setup>
// Figma "Data unavailable": the scan could not finish. Missing data is never shown as a clean result.
import LineChips from '@/components/rally/LineChips.vue'
import { getSecurity } from '@/api/mock/catalog'
import { SURVEY_URL } from '@/config/brand'
import { useLinesStore } from '@/stores/lines'
import { pluralize } from '@/utils/format'
import { LINE_OPTIONS } from '@/utils/lines'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

const props = defineProps({ symbol: { type: String, required: true } })
defineEmits(['retry', 'change-fund'])

const { lineKeys } = storeToRefs(useLinesStore())
const fund = computed(() => getSecurity(props.symbol))
const count = computed(() => lineKeys.value.length)
const linesLabel = computed(() => pluralize(count.value, 'line'))
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
            <span class="ticker-tile ticker-tile-lg">{{ symbol }}</span>
            <div class="gone__fund">
              <p class="gone__name">{{ fund?.name ?? symbol }}</p>
              <p class="body-muted">{{ linesLabel }} · scan incomplete</p>
            </div>
            <span class="tag"><span class="dot" style="--dot: var(--flare)" />Data unavailable</span>
          </header>
          <h2 class="title-lg">The data didn’t come through.</h2>
          <p class="gone__text">
            We can’t retrieve the holdings and source data needed to verify your fund exposure right now. No completed result is available for this scan.
          </p>
          <div class="inset">
            <p class="label-mono gone__flag">Exposure: unavailable — not zero</p>
            <p>
              We won’t pass off missing data as a clean fund, or show an older receipt as a fresh result. Basket building and result sharing are unavailable
              until a scan succeeds.
            </p>
          </div>
          <div class="gone__actions">
            <button type="button" class="btn btn-primary" @click="$emit('retry')">Retry scan</button>
            <button type="button" class="btn btn-outline" @click="$emit('change-fund')">Change fund →</button>
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
              <span class="means__text"><b>Basket building</b><span>Unavailable until a scan succeeds. No stale result will be used.</span></span>
              <span class="label-mono">Unavailable</span>
            </li>
            <li>
              <span class="dot" style="--dot: var(--flare)" />
              <span class="means__text"><b>Result sharing</b><span>Unavailable. We won’t share an incomplete receipt.</span></span>
              <span class="label-mono">Unavailable</span>
            </li>
            <li>
              <span class="dot" style="--dot: var(--sun)" />
              <span class="means__text"><b>Your saved lines</b><span>All {{ count }} choices are intact. Edit or retry anytime.</span></span>
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
          <LineChips v-model="lineKeys" :lines="LINE_OPTIONS" />
          <p class="small">Retry with these choices, or change your fund. We’ll generate a new receipt only after the required data is available.</p>
          <button type="button" class="btn btn-outline" @click="$emit('retry')">Rescan with these lines</button>
        </section>

        <section class="support">
          <p class="label-mono">Support · data issues</p>
          <h2 class="title-card">Still stuck?</h2>
          <p class="body-muted">If the problem persists, let us know. We log data gaps so we can fix them. No automatic trades. Ever.</p>
          <a :href="SURVEY_URL" target="_blank" rel="noopener" class="btn btn-outline">Report a data issue ↗</a>
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
.support {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}
</style>
