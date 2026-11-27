<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import FlowShell from '../components/FlowShell.vue'
import { LINES, state } from '../data.js'

const router = useRouter()
const checked = ref(0)
const hits = { environment: 1, privacy: 1 }
const lines = computed(() => LINES.filter((l) => state.lines.includes(l.id)))
let t
onMounted(() => {
  const start = performance.now()
  const tick = () => {
    const p = Math.min((performance.now() - start) / 2500, 1)
    checked.value = Math.round(p * 503)
    if (p < 1) t = requestAnimationFrame(tick)
    else router.replace('/check/receipt')
  }
  t = requestAnimationFrame(tick)
})
onBeforeUnmount(() => cancelAnimationFrame(t))
</script>

<template>
  <FlowShell close="/home" label=" " title="Printing your receipt…" body="2 companies cross your lines so far.">
    <template #left>
      <div class="cond">
        <div class="ch"><b>The conditions we’re checking</b><span class="label">{{ lines.length }} lines</span></div>
        <div class="chips">
          <span v-for="l in lines" :key="l.id" class="lc" :class="{ hit: hits[l.id] }" :style="hits[l.id] ? { background: l.color } : {}">
            <i class="dot" :style="{ background: hits[l.id] ? 'var(--ink)' : 'var(--dim)' }" />{{ l.name }}<template v-if="hits[l.id]"> · {{ hits[l.id] }}</template>
          </span>
        </div>
        <RouterLink to="/check/receipt" class="btn-link" style="align-self: flex-start">Skip to Results</RouterLink>
      </div>
    </template>
    <div class="printer">
      <div class="paper">
        <p class="display brand">Rally</p>
        <p class="meta">Receipt · VOO · Nov 19 2026</p>
        <hr class="dash" />
        <div class="line"><div><p class="lbl">Data privacy</p><p class="sub">Microsoft · 4.0%</p></div><p class="amt">{{ state.amount ? '$' + (state.amount * 0.04).toFixed(2) : '$4.00' }}</p></div>
        <div class="line hl"><div><p class="lbl">Environment &amp; climate</p><p class="sub">ExxonMobil · 3.0%</p></div><p class="amt">{{ state.amount ? '$' + (state.amount * 0.03).toFixed(2) : '$3.00' }}</p></div>
        <div class="line"><p class="lbl">Checking companies</p><p class="amt">{{ checked }} of 503</p></div>
        <div class="bar"><i :style="{ width: (checked / 503) * 100 + '%' }" /></div>
      </div>
      <div class="slot" />
    </div>
  </FlowShell>
</template>

<style scoped>
.cond { margin-top: 18px; display: flex; flex-direction: column; gap: 14px; max-width: 696px; }
.ch { display: flex; justify-content: space-between; align-items: baseline; }
.ch b { font-weight: 600; font-size: 16px; color: var(--white); }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.lc { display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 14px; border-radius: 999px; border: 1px solid #4a4654; font-weight: 500; font-size: 14px; color: var(--white); }
.lc.hit { color: var(--ink); border-color: transparent; }
.printer { position: relative; display: flex; flex-direction: column; align-items: center; padding-top: 160px; }
.paper { width: 300px; background: var(--paper); color: var(--ink); font-family: var(--mono); padding: 26px 20px 24px; position: relative; animation: print 2.5s ease-out both; }
.paper::before { content: ''; position: absolute; top: -8px; left: 0; right: 0; height: 8px; background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='8'%3E%3Cpolygon points='0,8 7,0 14,8' fill='%23FFF4D6'/%3E%3C/svg%3E") repeat-x; background-size: 14px 8px; }
.slot { width: 344px; height: 20px; border-radius: 999px; background: #0e0d12; margin-top: -2px; box-shadow: 0 -8px 20px rgba(0, 0, 0, 0.6); position: relative; }
.brand { text-align: center; font-size: 30px; }
.meta { text-align: center; margin-top: 10px; font-size: 10.5px; letter-spacing: 0.06em; text-transform: uppercase; color: #4a4654; }
.dash { border: 0; border-top: 1.5px dashed #2f2c38; margin: 10px 0; }
.line { display: flex; justify-content: space-between; gap: 10px; padding: 7px 8px; }
.line.hl { background: var(--sun); }
.lbl { font-weight: 500; font-size: 11.5px; letter-spacing: 0.04em; text-transform: uppercase; }
.sub { font-size: 10px; color: #6b6676; margin-top: 2px; }
.amt { font-weight: 500; font-size: 12.5px; white-space: nowrap; }
.bar { height: 4px; margin: 0 8px; background: #d9cfb3; border-radius: 2px; }
.bar i { display: block; height: 100%; background: var(--ink); border-radius: 2px; }
@keyframes print { from { clip-path: inset(70% 0 0 0); transform: translateY(70px); } to { clip-path: inset(0); transform: none; } }
</style>
