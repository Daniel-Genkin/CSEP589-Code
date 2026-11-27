<script setup lang="ts">
import { computed } from 'vue'
import FlowShell from '@/components/v7/FlowShell.vue'
import Row from '@/components/v7/Row.vue'
import { usePortfolioData } from '@/composables/usePortfolioData'
import { useWhatIf } from '@/composables/useWhatIf'
import { share, useLinesResult, whole } from '@/composables/useLinesResult'
import { useDemoStore } from '@/state/demo'
import { listNames, signed } from '@/utils/format'

const demo = useDemoStore()
const data = usePortfolioData()
const whatIf = useWhatIf(data)
const r = useLinesResult(data)

const excluded = computed(() => data.rows.value.filter((row) => whatIf.excluded.value.has(row.ticker)))
const leftOutShare = computed(() => excluded.value.reduce((s, row) => s + row.weight, 0))
const swaps = computed(() => Object.entries(whatIf.plan.value.swaps))
const kept = computed(() => data.rows.value.length - excluded.value.length + swaps.value.length)
const body = computed(() =>
  !r.ready.value
    ? 'Reading your fund…'
    : excluded.value.length
      ? `Your basket follows ${r.fund.value} without ${listNames(excluded.value.map((row) => data.nameOf(row.ticker)))}. Their ${share(leftOutShare.value)} is spread across the other ${kept.value.toLocaleString('en-US')} companies.`
      : `Nothing is excluded yet, so your basket is the same as ${r.fund.value}.`,
)
const bt = computed(() => whatIf.backtest.value)
</script>

<template>
  <FlowShell :steps="3" :step="1" label="Basket · Step 1 of 3" back="/basket" logo-to="/home" title="Review your basket." :body="body">
    <template v-if="r.ready.value">
      <div class="section-head"><h3>What changes</h3></div>
      <div class="list">
        <Row :tk="excluded[0]?.ticker" title="Left out" :sub="listNames(excluded.map((row) => data.nameOf(row.ticker)))" :right="`${excluded.length} compan${excluded.length === 1 ? 'y' : 'ies'}`" />
        <Row v-for="[from, to] in swaps" :key="from" :tk="to" :title="`${to} takes ${from}’s place`" sub="Swapped in from What-if" />
        <Row title="Companies in your basket" :right="kept.toLocaleString('en-US')" />
        <Row title="Crosses your lines" :right="`${share(r.ofMoney(whatIf.before.value.usd))} → ${share(r.ofMoney(whatIf.after.value.usd))}`" />
        <Row title="Your basket, a year" :sub="bt ? `S&P 500 ${bt.annualizedPct.benchmark.toFixed(2)}%` : 'Back-test running…'" :right="bt ? `${bt.annualizedPct.filtered.toFixed(2)}%` : '…'" />
        <Row v-if="bt" title="Against your fund as it is" :right="`${signed(whatIf.points.value)} pts`" />
      </div>
      <div class="section-head"><h3>How it’s carried out</h3></div>
      <div class="list">
        <Row title="Sells" :sub="`What you drop, from your ${whole(r.totalUsd.value)}`" icon="check" />
        <Row title="Buys" sub="The money goes back into what you keep" icon="check" />
        <Row title="You approve every trade" sub="Nothing is sent until you say so" icon="check" />
      </div>
      <RouterLink to="/trades" class="btn btn-primary btn-block" :class="{ off: !excluded.length }">{{ demo.isPaid ? 'See the Trades' : 'See the Trades · Plus' }}</RouterLink>
      <RouterLink to="/basket" class="btn-link" style="align-self: flex-start">Change Basket</RouterLink>
      <p class="caption">Back-test on Alpaca prices. Past results don’t predict future returns. Which companies cross which line is sample data.</p>
    </template>
    <div v-else-if="data.status.value === 'error'" class="card-pad"><p class="dim">The holdings didn’t load. <button class="btn-link" @click="data.reload()">Try Again</button></p></div>
  </FlowShell>
</template>

<style scoped>
.off { opacity: 0.4; pointer-events: none; }
</style>
