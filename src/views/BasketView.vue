<script setup lang="ts">
// Basket: your fund without the companies you drop. Uses the same exclusions as What-if, so a
// company dropped here is switched off there too.
import { computed, ref } from 'vue'
import { Search } from '@lucide/vue'
import AppShell from '@/components/v7/AppShell.vue'
import BasketCompare from '@/components/v7/BasketCompare.vue'
import Row from '@/components/v7/Row.vue'
import { usePortfolioData } from '@/composables/usePortfolioData'
import { useWhatIf } from '@/composables/useWhatIf'
import { share, useLinesResult } from '@/composables/useLinesResult'
import { useCatalogStore } from '@/state/catalog'
import { useDemoStore } from '@/state/demo'

const demo = useDemoStore()
const catalog = useCatalogStore()
const data = usePortfolioData()
const whatIf = useWhatIf(data)
const r = useLinesResult(data)

const lineLabels = (ids: string[]) => ids.map((id) => catalog.label(id)).join(', ')
const lineIds = (ticker: string) => r.companies.value.find((c) => c.ticker === ticker)?.lines ?? []
const viaLine = (ticker: string) => lineIds(ticker).filter((l) => demo.exclusions.categories.includes(l))

const excluded = computed(() => data.rows.value.filter((row) => whatIf.excluded.value.has(row.ticker)))
const crossing = computed(() => r.companies.value.filter((c) => !whatIf.excluded.value.has(c.ticker)))
const SHOW = 8
const showAll = ref(false)

function undo(ticker: string) {
  const via = viaLine(ticker)
  if (via.length) for (const l of via) demo.toggleExcludedCategory(l)
  if (demo.exclusions.tickers.includes(ticker)) demo.toggleExcludedTicker(ticker)
}
const excludeAll = () => demo.setExcludedCategories(r.lines.value.map((l) => l.category))

// Search any company in the fund, not only the ones that cross your lines.
const q = ref('')
const matches = computed(() => {
  const s = q.value.trim().toLowerCase()
  if (s.length < 1) return []
  return data.rows.value.filter((row) => !whatIf.excluded.value.has(row.ticker) && (row.ticker.toLowerCase().startsWith(s) || data.nameOf(row.ticker).toLowerCase().includes(s))).slice(0, 6)
})
function drop(ticker: string) {
  demo.toggleExcludedTicker(ticker)
  q.value = ''
}

const bt = computed(() => whatIf.backtest.value)
</script>

<template>
  <AppShell active="basket" title="Your basket." :body="r.fund.value ? `${r.fund.value} without the companies you drop. The rest are reweighted to fill the gap.` : 'Your fund without the companies you drop.'">
    <div v-if="!demo.portfolio" class="empty">
      <p class="dim">Check a fund first, then drop the companies you don’t want.</p>
      <RouterLink to="/check" class="btn btn-primary" style="align-self: flex-start">Check a Fund</RouterLink>
    </div>
    <div v-else-if="data.status.value === 'error'" class="card-pad err" role="alert">
      <b>Your holdings didn’t load.</b>
      <p class="dim">Rally won’t show old numbers.</p>
      <button class="btn btn-primary" style="align-self: flex-start" @click="data.reload()">Try Again</button>
    </div>
    <div v-else-if="!r.ready.value" class="grid" aria-busy="true"><div class="sk" style="height: 360px" /><div class="sk" style="height: 360px" /></div>

    <div v-else class="grid">
      <div class="col">
        <div class="search-wrap">
          <label class="search"><Search :size="17" color="var(--dim)" /><input v-model="q" placeholder="Search a company to exclude" aria-label="Search a company to exclude" @keydown.esc="q = ''" /></label>
          <div v-if="matches.length" class="menu" role="listbox">
            <button v-for="m in matches" :key="m.ticker" class="opt" role="option" @mousedown.prevent="drop(m.ticker)">
              <span class="mono tkc">{{ m.ticker }}</span><span class="nm">{{ data.nameOf(m.ticker) }}</span><span class="mono dim">{{ share(m.weight, 2) }}</span>
            </button>
          </div>
        </div>

        <div class="section-head"><h3>Excluded</h3><span class="meta">{{ excluded.length }}</span></div>
        <div v-if="excluded.length" class="list">
          <Row
            v-for="c in excluded.slice(0, 20)"
            :key="c.ticker"
            :tk="c.ticker"
            :title="data.nameOf(c.ticker)"
            :sub="`${viaLine(c.ticker).length ? 'With ' + lineLabels(viaLine(c.ticker)) : lineLabels(lineIds(c.ticker)) || 'Dropped by hand'} · ${share(c.weight, 2)} of ${r.fund.value}`"
            :dot="lineIds(c.ticker)[0] ? catalog.color(lineIds(c.ticker)[0]) : undefined"
          >
            <template #right><button class="btn-link" @click="undo(c.ticker)">Undo</button></template>
          </Row>
        </div>
        <p class="caption">
          <template v-if="excluded.length > 20">And {{ excluded.length - 20 }} more. </template>
          {{ excluded.length ? 'Their share is spread across the other companies in the fund.' : 'Nothing excluded yet.' }}
        </p>

        <div class="section-head" style="margin-top: 12px">
          <h3>Still crossing your lines</h3>
          <button v-if="crossing.length" class="btn-link" style="height: auto" @click="excludeAll">Exclude All {{ crossing.length }}</button>
        </div>
        <div v-if="crossing.length" class="list">
          <Row v-for="c in showAll ? crossing : crossing.slice(0, SHOW)" :key="c.ticker" :tk="c.ticker" :title="c.name" :sub="`${lineLabels(c.lines)} · ${share(c.weight)}`" :dot="catalog.color(c.lines[0])">
            <template #right><button class="chip ex" @click="demo.toggleExcludedTicker(c.ticker)">Exclude</button></template>
          </Row>
        </div>
        <p v-else class="caption">Nothing left in your basket crosses your lines.</p>
        <button v-if="crossing.length > SHOW" class="btn-link" style="align-self: flex-start" @click="showAll = !showAll">{{ showAll ? 'Show Fewer' : `Show All ${crossing.length}` }}</button>
      </div>

      <aside class="side">
        <BasketCompare
          :fund="r.fund.value"
          :before="r.ofMoney(whatIf.before.value.usd)"
          :after="r.ofMoney(whatIf.after.value.usd)"
          :companies-before="data.rows.value.length"
          :companies-after="data.rows.value.length - excluded.length + Object.keys(whatIf.plan.value.swaps).length"
          :basket-pct="bt ? bt.annualizedPct.filtered : null"
          :benchmark-pct="bt ? bt.annualizedPct.benchmark : null"
        />
        <RouterLink to="/whatif" class="btn-link" style="align-self: flex-start; height: 32px">See the full back-test in What-if →</RouterLink>
        <div class="section-head" style="margin-top: 8px"><h3>New money</h3></div>
        <div class="list"><Row title="Redirect Deposits" :sub="`Send new money somewhere other than ${r.fund.value}`" icon="chev" to="/redirect" /></div>
        <RouterLink to="/basket/review" class="btn btn-primary btn-block" :class="{ off: !excluded.length }" style="margin-top: 8px">Build My Basket</RouterLink>
        <p class="caption center">Nothing happens until you review and approve the trades. Rally never holds your money.</p>
      </aside>
    </div>
  </AppShell>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: 800px 456px; justify-content: space-between; gap: 24px; }
.col, .side { display: flex; flex-direction: column; gap: 14px; }
.side { align-self: start; position: sticky; top: 100px; }
.search-wrap { position: relative; }
.search { height: 46px; border-radius: 999px; background: var(--surf); display: flex; align-items: center; gap: 10px; padding: 0 18px; }
.search input { flex: 1; background: none; border: 0; outline: none; font-size: 15px; }
.search input::placeholder { color: var(--dim); }
.menu { position: absolute; z-index: 5; top: 52px; left: 0; right: 0; background: var(--raise); border-radius: 16px; padding: 6px; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5); display: flex; flex-direction: column; }
.opt { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 10px; text-align: left; font-size: 15px; color: var(--white); }
.opt:hover { background: #3a3744; }
.tkc { width: 56px; font-size: 12px; color: var(--cream); }
.nm { flex: 1; }
.ex { height: 34px; font-size: 14px; font-weight: 600; background: #34313d; }
.center { text-align: center; }
.off { opacity: 0.4; pointer-events: none; }
.empty { display: flex; flex-direction: column; gap: 14px; }
.err { gap: 12px; max-width: 640px; }
.err b { font-size: 20px; color: var(--white); }
.sk { border-radius: 20px; background: linear-gradient(90deg, #2a2832, #34313d, #2a2832); background-size: 200% 100%; animation: shimmer 1.4s linear infinite; }
@keyframes shimmer { to { background-position: -200% 0; } }
</style>
