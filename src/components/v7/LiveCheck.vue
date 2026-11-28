<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDemoStore } from '@/state/demo'
import { useCheckStore } from '@/state/check'
import { Check, Plus } from '@lucide/vue'
import Receipt from './Receipt.vue'
import Stamp from './Stamp.vue'
import { LINES, FUND_MIX, DEFAULT_LINES } from '@/landing/sample.js'
import { useTween, fmtPct } from '@/v7/tween.js'
import { useInView, clamp } from '@/v7/scroll.js'

// The landing's "try it" receipt: pick a fund, lines and an amount, and it reprints.
// It also prints out of the slot as the section scrolls into view, then the stamp lands.
const router = useRouter()
const root = ref(null)
const seen = useInView(root)
const printed = computed(() => clamp((seen.value - 0.12) / 0.3))
const stamped = computed(() => clamp((printed.value - 0.85) / 0.15))
const fund = ref('VOO')
const picked = ref([...DEFAULT_LINES])
const amount = ref(2000)
const focus = ref(LINES.find((l) => l.id === 'diversity'))
const prints = ref(0)

function toggle(l) {
  const i = picked.value.indexOf(l.id)
  if (i >= 0) picked.value.splice(i, 1)
  else picked.value.push(l.id)
  focus.value = l
  prints.value++
}
function setFund(f) {
  fund.value = f
  prints.value++
}

const mix = computed(() => FUND_MIX[fund.value])
const items = computed(() =>
  LINES.filter((l) => picked.value.includes(l.id))
    .map((l) => ({ ...l, pct: mix.value[l.id] || 0 }))
    .sort((a, b) => b.pct - a.pct),
)
const total = computed(() => Math.min(100, items.value.reduce((s, i) => s + i.pct, 0)))
const shown = useTween(total)
const dollars = computed(() => (amount.value * total.value) / 100)
const shownDollars = useTween(dollars)

const money = (n) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const whole = (n) => '$' + Math.round(n).toLocaleString('en-US')
const rows = computed(() => {
  const hits = items.value.filter((i) => i.pct > 0)
  const out = hits.slice(0, 3).map((i) => ({ label: i.name, sub: `${i.pct.toFixed(1)}% of ${fund.value}`, amount: money((amount.value * i.pct) / 100) }))
  const rest = hits.slice(3)
  if (rest.length) {
    const p = rest.reduce((s, i) => s + i.pct, 0)
    out.push({ label: `${rest.length} more line${rest.length > 1 ? 's' : ''}`, sub: `${p.toFixed(1)}% of ${fund.value}`, amount: money((amount.value * p) / 100) })
  }
  if (!out.length) out.push({ label: 'Nothing flagged', sub: 'Pick a line to check', amount: '$0.00' })
  return out
})

// Carry the fund, lines and amount into the real check.
const demo = useDemoStore()
const checkFlow = useCheckStore()
function check() {
  demo.setCategories([...picked.value])
  checkFlow.input = fund.value
  checkFlow.amount = amount.value
  router.push('/check/lines')
}
</script>

<template>
  <div ref="root" class="live">
    <div v-stagger="{ x: -60, y: 0, step: 0.08 }" class="controls">
      <p class="eyebrow">Try it</p>
      <h2 class="h2">“What is my money paying for?”</h2>
      <p class="lead">Pick a fund and the lines you care about. The receipt reprints as you go.</p>

      <div class="ctl">
        <p class="label">Fund</p>
        <div class="seg">
          <button v-for="(f, k) in FUND_MIX" :key="k" :class="{ on: fund === k }" :title="f.name" @click="setFund(k)">{{ k }}</button>
        </div>
      </div>

      <div class="ctl">
        <p class="label">Your lines · {{ picked.length }}</p>
        <div class="chips">
          <button v-for="l in LINES" :key="l.id" class="lc" :class="{ on: picked.includes(l.id) }" :aria-pressed="picked.includes(l.id)" @click="toggle(l)" @mouseenter="focus = l" @focus="focus = l">
            <i v-if="picked.includes(l.id)" class="dot" :style="{ background: l.color }" />
            {{ l.name }}
            <Check v-if="picked.includes(l.id)" :size="14" />
            <Plus v-else :size="14" />
          </button>
        </div>
        <p class="desc"><b>{{ focus.name }}:</b> {{ focus.desc }}</p>
      </div>

      <div class="ctl">
        <div class="amt-row"><p class="label">Amount in {{ fund }}</p><p class="amt mono">{{ whole(amount) }}</p></div>
        <input v-model.number="amount" class="range" type="range" min="100" max="10000" step="100" aria-label="Amount" :style="{ '--p': ((amount - 100) / 9900) * 100 + '%' }" />
      </div>

      <button class="btn btn-primary" style="align-self: flex-start; margin-top: 8px" @click="check">Check My Fund</button>
    </div>

    <div class="visual">
      <div v-reveal="{ y: 30, scale: 0.8, blur: 6 }" class="readout">
        <p class="display pct">{{ fmtPct(shown) }}</p>
        <p class="rt">of your {{ whole(amount) }} in {{ fund }} crosses your lines. That’s <b>{{ whole(shownDollars) }}</b>.</p>
      </div>
      <div class="slot" />
      <div class="print" :style="{ clipPath: `inset(0 -200px ${(1 - printed) * 100}% -200px)`, transform: `translateY(${(1 - printed) * -40}px)` }">
        <div :key="prints" class="paper">
          <Receipt :rotate="-3" :zoom="1.08" :meta="`Receipt · ${fund} · Sample`" :rows="rows" :total="money(dollars)" :total-sub="`of your ${whole(amount)} in ${fund}`" :rest="money(amount - dollars)" />
        </div>
      </div>
      <Stamp class="stamp" :value="fmtPct(shown)" :size="124" :style="{ opacity: stamped, transform: `rotate(-14deg) scale(${1.6 - stamped * 0.6})` }" />
      <p class="caption note">Sample numbers for four funds. Every flag in the real check links to its source.</p>
    </div>
  </div>
</template>

<style scoped>
.live { display: grid; grid-template-columns: 486px 588px; justify-content: space-between; align-items: start; }
.controls { display: flex; flex-direction: column; gap: 26px; }
.controls .eyebrow { margin-bottom: -6px; }
.h2 { font-weight: 600; font-size: 52px; line-height: 58px; letter-spacing: -0.02em; color: var(--cream); }
.lead { font-size: 19px; line-height: 30px; color: var(--dim); margin-top: -6px; }
.ctl { display: flex; flex-direction: column; gap: 12px; }
.seg { display: inline-flex; gap: 6px; padding: 4px; border-radius: 999px; background: var(--surf); align-self: flex-start; }
.seg button { height: 38px; padding: 0 18px; border-radius: 999px; font-family: var(--mono); font-weight: 500; font-size: 14px; color: var(--dim); transition: background 0.15s, color 0.15s; }
.seg button.on { background: var(--sun); color: var(--ink); }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.lc { display: inline-flex; align-items: center; gap: 7px; height: 36px; padding: 0 13px; border-radius: 999px; border: 1px solid #4a4654; font-weight: 500; font-size: 14px; color: var(--white); transition: background 0.15s, border-color 0.15s, transform 0.1s; }
.lc:hover { border-color: var(--dim); }
.lc:active { transform: scale(0.96); }
.lc :deep(svg) { color: var(--dim); }
.lc.on { background: var(--cream); border-color: var(--cream); color: var(--ink); font-weight: 600; }
.lc.on :deep(svg) { color: var(--ink); }
.desc { min-height: 22px; font-size: 14px; color: var(--dim); }
.desc b { color: var(--white); font-weight: 600; }
.amt-row { display: flex; justify-content: space-between; align-items: baseline; }
.amt { font-weight: 500; font-size: 18px; color: var(--cream); }
.range { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; border-radius: 3px; background: linear-gradient(90deg, var(--sun) var(--p), #34313d var(--p)); outline: none; }
.range::-webkit-slider-thumb { -webkit-appearance: none; width: 22px; height: 22px; border-radius: 50%; background: var(--cream); border: 4px solid var(--sun); cursor: grab; }
.range::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: var(--cream); border: 4px solid var(--sun); cursor: grab; }
.visual { position: relative; display: flex; flex-direction: column; align-items: center; }
.readout { align-self: stretch; display: flex; align-items: center; gap: 20px; margin-bottom: 30px; }
.pct { flex: none; font-size: 112px; color: var(--sun); min-width: 230px; text-transform: none; }
.rt { font-size: 18px; line-height: 1.5; color: var(--dim); }
.rt b { color: var(--white); font-weight: 600; }
.slot { width: 380px; height: 14px; border-radius: 999px; background: #0e0d12; box-shadow: inset 0 3px 6px rgba(0, 0, 0, 0.8), 0 1px 0 rgba(255, 255, 255, 0.06); margin-bottom: -4px; position: relative; z-index: 2; }
.print { padding-top: 14px; will-change: clip-path, transform; }
.paper { position: relative; animation: reprint 0.38s cubic-bezier(0.2, 0.7, 0.2, 1); }
.stamp { position: absolute; top: 190px; right: 40px; z-index: 3; transition: none; }
.note { margin-top: 30px; }
@keyframes reprint { from { transform: translateY(-14px); opacity: 0.6; } }
</style>
