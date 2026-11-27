<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import FlowShell from '@/components/v7/FlowShell.vue'
import { inspect, portfolioFromInput } from '@/composables/useHoldingsCheck'
import { totalFlagged, exposureByCategory } from '@/domain/exposure'
import { useCatalogStore } from '@/state/catalog'
import { useCheckStore } from '@/state/check'
import { useDemoStore } from '@/state/demo'

// Runs the real check: builds the portfolio, looks through every fund, tags every company,
// then hands over to the receipt. The printout animates while that happens.
const router = useRouter()
const demo = useDemoStore()
const catalog = useCatalogStore()
const check = useCheckStore()

const stage = ref<'checking' | 'error'>('checking')
const companies = ref(0)
const checked = ref(0)
const hits = ref<Record<string, number>>({})
const flaggedCount = ref(0)
const error = ref('')
const lines = computed(() => catalog.categories.filter((c) => catalog.selectedIds.includes(c.id)))
let raf = 0
let alive = true

async function run() {
  const started = performance.now()
  try {
    await catalog.load()
    const result = await portfolioFromInput(check.input, check.totalUsd())
    if ('problem' in result) {
      const p = result.problem
      router.replace({ path: '/check/unsupported', query: p.kind === 'unknown' ? { ticker: p.ticker, suggestion: p.suggestion ?? undefined } : { ticker: check.input } })
      return
    }
    const found = await inspect(result.portfolio)
    if (!alive) return
    if (!found.rows.length) {
      router.replace({ path: '/check/unsupported', query: { ticker: check.input, reason: 'holdings' } })
      return
    }
    companies.value = found.rows.length
    const exposures = exposureByCategory(found.rows, found.tags, catalog.selectedIds)
    hits.value = Object.fromEntries(exposures.map((e) => [e.category, e.count]))
    flaggedCount.value = totalFlagged(found.rows, found.tags, catalog.selectedIds).count
    demo.setPortfolio(result.portfolio)
    // Let the count finish printing before the receipt.
    const tick = () => {
      const p = Math.min((performance.now() - started) / 2400, 1)
      checked.value = Math.round(p * companies.value)
      if (p < 1) raf = requestAnimationFrame(tick)
      else if (alive) router.replace('/check/receipt')
    }
    raf = requestAnimationFrame(tick)
  } catch (e) {
    if (!alive) return
    stage.value = 'error'
    error.value = e instanceof Error ? e.message : 'The data didn’t come through.'
  }
}
onMounted(run)
onBeforeUnmount(() => {
  alive = false
  cancelAnimationFrame(raf)
})
</script>

<template>
  <FlowShell close="/" label=" " :title="stage === 'error' ? 'We couldn’t find the data.' : 'Printing your receipt…'" :body="stage === 'error' ? 'The check didn’t finish. Nothing was bought or sold.' : companies ? `${flaggedCount} companies cross your lines so far.` : 'Looking inside your fund.'">
    <template #left>
      <div v-if="stage === 'checking'" class="cond">
        <div class="ch"><b>The conditions we’re checking</b><span class="label">{{ lines.length }} lines</span></div>
        <div class="chips">
          <span v-for="l in lines" :key="l.id" class="lc" :class="{ hit: hits[l.id] }" :style="hits[l.id] ? { background: l.color } : {}">
            <i class="dot" :style="{ background: hits[l.id] ? 'var(--ink)' : 'var(--dim)' }" />{{ l.label }}<template v-if="hits[l.id]"> · {{ hits[l.id] }}</template>
          </span>
        </div>
      </div>
      <div v-else class="cond">
        <p class="note"><span class="label" style="color: var(--flare)">Missing data isn’t 0%</span><br />{{ error }}</p>
        <div class="row-btns">
          <button class="btn btn-primary" @click="(stage = 'checking'), run()">Try Again</button>
          <RouterLink to="/check" class="btn btn-secondary">Change Fund</RouterLink>
        </div>
      </div>
    </template>
    <div v-if="stage === 'checking'" class="printer">
      <div class="paper">
        <p class="display brand">Rally</p>
        <p class="meta">Receipt · {{ check.input }}</p>
        <hr class="dash" />
        <div class="line"><p class="lbl">Companies in your fund</p><p class="amt">{{ companies || '…' }}</p></div>
        <div class="line hl"><p class="lbl">Crossing your lines</p><p class="amt">{{ companies ? flaggedCount : '…' }}</p></div>
        <div class="line"><p class="lbl">Checking companies</p><p class="amt">{{ checked }} of {{ companies || '…' }}</p></div>
        <div class="bar"><i :style="{ width: companies ? (checked / companies) * 100 + '%' : '8%' }" /></div>
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
.note { background: var(--surf); border-radius: 14px; padding: 14px 16px; font-size: 15px; color: var(--white); line-height: 1.5; }
.row-btns { display: flex; gap: 10px; }
.printer { display: flex; flex-direction: column; align-items: center; padding-top: 160px; }
.paper { width: 300px; background: var(--paper); color: var(--ink); font-family: var(--mono); padding: 26px 20px 24px; position: relative; animation: print 2.4s ease-out both; }
.paper::before { content: ''; position: absolute; top: -8px; left: 0; right: 0; height: 8px; background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='8'%3E%3Cpolygon points='0,8 7,0 14,8' fill='%23FFF4D6'/%3E%3C/svg%3E") repeat-x; background-size: 14px 8px; }
.slot { width: 344px; height: 20px; border-radius: 999px; background: #0e0d12; margin-top: -2px; box-shadow: 0 -8px 20px rgba(0, 0, 0, 0.6); }
.brand { text-align: center; font-size: 30px; }
.meta { text-align: center; margin-top: 10px; font-size: 10.5px; letter-spacing: 0.06em; text-transform: uppercase; color: #4a4654; }
.dash { border: 0; border-top: 1.5px dashed #2f2c38; margin: 10px 0; }
.line { display: flex; justify-content: space-between; gap: 10px; padding: 7px 8px; }
.line.hl { background: var(--sun); }
.lbl { font-weight: 500; font-size: 11.5px; letter-spacing: 0.04em; text-transform: uppercase; }
.amt { font-weight: 500; font-size: 12.5px; white-space: nowrap; }
.bar { height: 4px; margin: 0 8px; background: #d9cfb3; border-radius: 2px; }
.bar i { display: block; height: 100%; background: var(--ink); border-radius: 2px; transition: width 0.2s; }
@keyframes print { from { clip-path: inset(70% 0 0 0); transform: translateY(70px); } to { clip-path: inset(0); transform: none; } }
</style>
