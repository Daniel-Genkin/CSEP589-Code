<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@lucide/vue'
import FlowShell from '@/components/v7/FlowShell.vue'
import Row from '@/components/v7/Row.vue'
import { provider } from '@/data'
import { useCheckStore } from '@/state/check'
import type { Security } from '@/types'

const router = useRouter()
const check = useCheckStore()
const FUNDS = [
  { tk: 'VOO', name: 'Vanguard S&P 500 ETF', sub: 'Vanguard · S&P 500 index' },
  { tk: 'SPY', name: 'SPDR S&P 500 ETF Trust', sub: 'State Street · S&P 500 index' },
  { tk: 'IVV', name: 'iShares Core S&P 500 ETF', sub: 'BlackRock · S&P 500 index' },
]
const pick = ref(FUNDS.some((f) => f.tk === check.input) ? check.input : 'VOO')
const query = ref(FUNDS.some((f) => f.tk === check.input) ? '' : check.input)
const results = ref<Security[]>([])
let timer: ReturnType<typeof setTimeout> | undefined
let request = 0

watch(query, (q) => {
  clearTimeout(timer)
  const text = q.trim()
  if (!text || text.includes(',')) {
    results.value = []
    return
  }
  timer = setTimeout(async () => {
    const mine = ++request
    try {
      const found = await provider.searchSecurities(text)
      if (mine === request) results.value = found.slice(0, 5)
    } catch {
      if (mine === request) results.value = []
    }
  }, 220)
})
onBeforeUnmount(() => clearTimeout(timer))

function choose(tk: string) {
  pick.value = tk
  query.value = ''
  results.value = []
}
function next() {
  check.input = query.value.trim() ? query.value.trim().toUpperCase() : pick.value
  router.push('/check/lines')
}
</script>

<template>
  <FlowShell :steps="3" :step="1" back="/" title="Pick your fund." body="Choose the fund you own and Rally will show you what’s inside. It won’t tell you what to buy.">
    <div class="section-head"><h3>Choose a fund</h3></div>
    <label class="search">
      <Search :size="18" color="var(--dim)" />
      <input v-model="query" role="combobox" aria-label="Fund or tickers" :aria-expanded="results.length > 0" placeholder="Search any US fund or stock, or type tickers like AAPL, MSFT" @keydown.enter.prevent="next" />
    </label>
    <div v-if="results.length" class="list" role="listbox">
      <Row v-for="s in results" :key="s.ticker" :tk="s.ticker" :title="s.name" :sub="s.kind === 'etf' ? 'Fund' : 'Stock'" role="option" class="pickable" @click="choose(s.ticker)" />
    </div>
    <div v-else class="list">
      <Row v-for="f in FUNDS" :key="f.tk" :tk="f.tk" :title="f.name" :sub="f.sub" :icon="!query && pick === f.tk ? 'check' : undefined" class="pickable" @click="choose(f.tk)" />
    </div>
    <p class="caption">No account needed.</p>
    <button class="btn btn-primary btn-block" @click="next">Continue with {{ query.trim() ? query.trim().toUpperCase() : pick }}</button>

    <div class="section-head" style="margin-top: 12px"><h3>Or connect your account</h3></div>
    <div class="card-pad">
      <p class="t">See the funds you already own</p>
      <p class="dim">Connect your investing app to pull in your holdings. Read-only, on Plus.</p>
      <RouterLink to="/connect" class="btn btn-secondary btn-block">Connect an Account</RouterLink>
    </div>
  </FlowShell>
</template>

<style scoped>
.search { height: 52px; border-radius: 16px; background: var(--surf); border: 1px solid var(--line); display: flex; align-items: center; gap: 10px; padding: 0 16px; }
.search:focus-within { border-color: var(--sun); }
.search input { flex: 1; background: none; border: 0; outline: none; font-size: 15px; color: var(--white); }
.search input::placeholder { color: var(--mute); }
.pickable { cursor: pointer; }
.t { font-weight: 600; font-size: 18px; color: var(--white); }
.card-pad .dim { font-size: 15px; line-height: 1.45; }
</style>
