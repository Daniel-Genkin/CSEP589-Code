<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FlowShell from '@/components/v7/FlowShell.vue'
import Row from '@/components/v7/Row.vue'
import { useCheckStore } from '@/state/check'

const route = useRoute()
const router = useRouter()
const check = useCheckStore()
const ticker = computed(() => String(route.query.ticker || check.input || 'this fund').toUpperCase())
const suggestion = computed(() => (route.query.suggestion ? String(route.query.suggestion) : ''))
const noHoldings = computed(() => route.query.reason === 'holdings')
const title = computed(() => (noHoldings.value ? `We can’t check ${ticker.value} yet.` : `We couldn’t find ${ticker.value}.`))
const body = computed(() =>
  noHoldings.value
    ? `Rally couldn’t read what ${ticker.value} holds. It checks US stocks and funds whose holdings are on public record.`
    : suggestion.value
      ? `Did you mean ${suggestion.value}? Rally checks US stocks and funds listed on Alpaca.`
      : 'Rally checks US stocks and funds listed on Alpaca. Try a fund below.',
)
function use(tk: string) {
  check.input = tk
  router.push('/check/printing')
}
</script>

<template>
  <FlowShell :steps="3" :step="1" back="/check" :title="title" :body="body">
    <template v-if="suggestion">
      <div class="section-head"><h3>Did you mean</h3></div>
      <div class="list"><Row :tk="suggestion" :title="suggestion" sub="Closest match" icon="chev" class="pick" @click="use(suggestion)" /></div>
    </template>
    <div class="section-head"><h3>Try a US fund</h3></div>
    <div class="list">
      <Row tk="VOO" title="Vanguard S&P 500 ETF" sub="Vanguard · S&P 500 index" icon="chev" class="pick" @click="use('VOO')" />
      <Row tk="VTI" title="Vanguard Total Stock Market ETF" sub="Vanguard · US total market" icon="chev" class="pick" @click="use('VTI')" />
      <Row tk="QQQ" title="Invesco QQQ Trust" sub="Invesco · Nasdaq-100 index" icon="chev" class="pick" @click="use('QQQ')" />
    </div>
    <button class="btn btn-primary btn-block" @click="use('VOO')">Check VOO Instead</button>
    <RouterLink to="/check" class="btn-link" style="align-self: flex-start">Change Fund</RouterLink>
  </FlowShell>
</template>

<style scoped>
.pick { cursor: pointer; }
</style>
