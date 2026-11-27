<script setup lang="ts">
// Your fund today next to your basket: how much crosses your lines, how many companies, and the
// back-tested yearly return against the S&P 500. Numbers come from the caller.
import { computed } from 'vue'

const props = defineProps<{
  fund: string
  before: number
  after: number
  companiesBefore: number
  companiesAfter: number
  /** Back-tested yearly return, in percent. null while it is worked out. */
  basketPct: number | null
  benchmarkPct: number | null
  /** Replaces the caption, for example to say the numbers are a sample */
  note?: string
}>()

const pct = (n: number) => (n > 0 && n < 0.005 ? '<1%' : `${(n * 100).toFixed(n * 100 < 10 && n > 0 ? 1 : 0)}%`)
const gap = computed(() => (props.basketPct === null || props.benchmarkPct === null ? null : props.basketPct - props.benchmarkPct))
const scale = computed(() => Math.max(1, Math.abs(props.basketPct ?? 0), Math.abs(props.benchmarkPct ?? 0)) * 1.3)
const width = (v: number | null) => `${v === null ? 0 : Math.max(2, (Math.abs(v) / scale.value) * 100)}%`
const signedPct = (v: number) => `${v < 0 ? '−' : '+'}${Math.abs(v).toFixed(1)}%`
</script>

<template>
  <div class="card-pad compare">
    <div class="top">
      <div>
        <p class="label">{{ fund }} today</p>
        <p class="display pct">{{ pct(before) }}</p>
        <p class="s">crosses your lines<br />{{ companiesBefore.toLocaleString('en-US') }} companies</p>
      </div>
      <span class="arrow">→</span>
      <div>
        <p class="label">Your basket</p>
        <p class="display pct mine">{{ pct(after) }}</p>
        <p class="s">crosses your lines<br />{{ companiesAfter.toLocaleString('en-US') }} companies</p>
      </div>
    </div>
    <hr class="rule" />
    <template v-if="gap !== null">
      <p class="gap">
        <span class="display">{{ Math.abs(gap).toFixed(2) }} pts</span>
        {{ Math.abs(gap) < 0.005 ? 'from' : gap < 0 ? 'behind' : 'ahead of' }} the S&amp;P 500 a year
      </p>
      <div class="bar-row"><span>Your basket</span><span class="mono">{{ signedPct(basketPct!) }}</span></div>
      <div class="track"><span :style="{ width: width(basketPct), background: 'var(--sun)' }" /></div>
      <div class="bar-row"><span>S&amp;P 500</span><span class="mono">{{ signedPct(benchmarkPct!) }}</span></div>
      <div class="track"><span :style="{ width: width(benchmarkPct), background: '#8a8594' }" /></div>
      <p class="caption">{{ note ?? 'Back-tested yearly return on Alpaca prices. Past results don’t predict future returns.' }}</p>
    </template>
    <p v-else class="caption">Running the back-test…</p>
  </div>
</template>

<style scoped>
.compare { gap: 10px; }
.top { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 16px; }
.pct { font-size: 44px; color: var(--cream); margin: 6px 0 4px; }
.pct.mine { color: var(--link); }
.s { font-size: 13px; color: var(--dim); line-height: 1.35; }
.arrow { color: var(--dim); font-size: 18px; }
.gap { display: flex; align-items: baseline; gap: 10px; font-weight: 500; font-size: 14px; color: var(--white); }
.gap .display { font-size: 32px; color: var(--cream); text-transform: none; }
.bar-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--dim); margin-top: 4px; }
.bar-row .mono { color: var(--white); }
.track { height: 6px; border-radius: 3px; background: #34313d; }
.track span { display: block; height: 100%; border-radius: 3px; transition: width 0.45s; }
</style>
