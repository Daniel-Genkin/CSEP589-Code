<script setup>
import { computed } from 'vue'
import { state, RECEIPT_ROWS } from '../data.js'

// By default this prints the sample VOO receipt for the amount entered in the check flow.
// With no amount (or mode="per100") it shows every $100. Pass rows/total to print something else.
const props = defineProps({
  mode: { type: String, default: 'auto' }, // auto | dollars | per100
  rotate: { type: Number, default: -3 },
  zoom: { type: Number, default: 1 },
  meta: { type: String, default: 'Receipt · VOO · Nov 19 2026' },
  footer: { type: String, default: 'Every flag has a source' },
  otherLabel: { type: String, default: 'Other lines' },
  rows: { type: Array, default: null }, // [{ label, sub, amount }]
  total: { type: String, default: null },
  totalSub: { type: String, default: null },
  rest: { type: String, default: null },
  totalColor: { type: String, default: 'var(--flare)' },
})

const money = (n) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const base = computed(() => {
  const dollars = props.mode === 'dollars' || (props.mode === 'auto' && state.amount)
  const amt = dollars ? state.amount || 2000 : 100
  const pct = RECEIPT_ROWS.reduce((s, r) => s + r.pct, 0)
  return {
    rows: RECEIPT_ROWS.map((r, i) => ({ label: i === 2 ? props.otherLabel : r.label, sub: r.sub, amount: money((amt * r.pct) / 100) })),
    total: money((amt * pct) / 100),
    totalSub: dollars ? `of your ${money(amt).replace('.00', '')} in VOO` : 'per $100 in VOO',
    rest: money(amt - (amt * pct) / 100),
  }
})
const view = computed(() => ({
  rows: props.rows || base.value.rows,
  total: props.total ?? base.value.total,
  totalSub: props.totalSub ?? base.value.totalSub,
  rest: props.rest ?? base.value.rest,
}))
</script>

<template>
  <div class="receipt" :style="{ transform: `rotate(${rotate}deg)`, zoom }">
    <p class="display brand">Rally</p>
    <p class="meta">{{ meta }}</p>
    <hr class="dash" />
    <div v-for="r in view.rows" :key="r.label" class="line">
      <div>
        <p class="lbl">{{ r.label }}</p>
        <p v-if="r.sub" class="sub">{{ r.sub }}</p>
      </div>
      <p class="amt">{{ r.amount }}</p>
    </div>
    <hr class="dash" />
    <div class="line total">
      <div>
        <p class="lbl nowrap">Crosses your lines</p>
        <p class="sub">{{ view.totalSub }}</p>
      </div>
      <p class="display big" :style="{ color: totalColor }">{{ view.total }}</p>
    </div>
    <div class="line">
      <p class="lbl">Everything else</p>
      <p class="amt">{{ view.rest }}</p>
    </div>
    <hr class="dash" />
    <div class="barcode" />
    <p class="foot">{{ footer }}</p>
  </div>
</template>

<style scoped>
.receipt { position: relative; width: 300px; padding: 26px 22px 20px; background: var(--paper); color: var(--ink); font-family: var(--mono); box-shadow: 0 24px 48px rgba(0, 0, 0, 0.45); }
.receipt::before, .receipt::after { content: ''; position: absolute; left: 0; right: 0; height: 8px; background-repeat: repeat-x; background-size: 14px 8px; }
.receipt::before { top: -8px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='8'%3E%3Cpolygon points='0,8 7,0 14,8' fill='%23FFF4D6'/%3E%3C/svg%3E"); }
.receipt::after { bottom: -8px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='8'%3E%3Cpolygon points='0,0 7,8 14,0' fill='%23FFF4D6'/%3E%3C/svg%3E"); }
.brand { font-size: 30px; text-align: center; color: var(--ink); }
.meta { margin-top: 10px; text-align: center; font-size: 10.5px; letter-spacing: 0.06em; text-transform: uppercase; color: #4a4654; }
.dash { border: 0; border-top: 1.5px dashed #2f2c38; margin: 10px 0; }
.line { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; padding: 5px 0; }
.lbl { font-weight: 500; font-size: 11.5px; letter-spacing: 0.04em; text-transform: uppercase; color: var(--ink); }
.nowrap { white-space: nowrap; }
.sub { margin-top: 2px; font-size: 10px; color: #6b6676; }
.amt { font-weight: 500; font-size: 12.5px; color: var(--ink); white-space: nowrap; }
.total { align-items: center; }
.big { font-size: 33px; line-height: 1; white-space: nowrap; }
.barcode { height: 36px; margin: 8px auto 6px; width: 70%; background: repeating-linear-gradient(90deg, #17161d 0 2px, transparent 2px 4px, #17161d 4px 5px, transparent 5px 7px, #17161d 7px 10px, transparent 10px 12px); }
.foot { text-align: center; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: #4a4654; }
</style>
