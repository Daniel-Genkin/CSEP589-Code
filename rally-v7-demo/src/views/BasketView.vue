<script setup>
import { computed, ref } from 'vue'
import { Search } from '@lucide/vue'
import AppShell from '../components/AppShell.vue'
import BasketCompare from '../components/BasketCompare.vue'
import Row from '../components/Row.vue'

const companies = ref([
  { tk: 'XOM', name: 'ExxonMobil', line: 'Environment & climate', color: 'var(--sun)', pct: '3.0%', out: true },
  { tk: 'MSFT', name: 'Microsoft', line: 'Data privacy', color: 'var(--pink)', pct: '4.0%', out: false },
])
const excluded = computed(() => companies.value.filter((c) => c.out))
const crossing = computed(() => companies.value.filter((c) => !c.out))
</script>

<template>
  <AppShell active="basket" title="Your basket." body="Your fund without the companies you drop. The rest are reweighted to fill the gap.">
    <div class="grid">
      <div class="col">
        <label class="search"><Search :size="17" color="var(--dim)" /><input placeholder="Search a company to exclude" /></label>
        <div class="section-head"><h3>Excluded</h3><span class="meta">{{ excluded.length }}</span></div>
        <div v-if="excluded.length" class="list">
          <Row v-for="c in excluded" :key="c.tk" :tk="c.tk" :title="c.name" :sub="`${c.line} · ${c.pct} of VOO`" :dot="c.color">
            <template #right><button class="btn-link" @click="c.out = false">Undo</button></template>
          </Row>
        </div>
        <p class="caption">{{ excluded.length ? 'Its share is spread across the other companies in the fund.' : 'Nothing excluded yet.' }}</p>

        <div class="section-head" style="margin-top: 12px">
          <h3>Still crossing your lines</h3>
          <button class="btn-link" style="height: auto" @click="companies.forEach((c) => (c.out = true))">Exclude All 4</button>
        </div>
        <div class="list">
          <Row v-for="c in crossing" :key="c.tk" :tk="c.tk" :title="c.name" :sub="`${c.line} · ${c.pct}`" :dot="c.color">
            <template #right><button class="chip ex" @click="c.out = true">Exclude</button></template>
          </Row>
          <Row title="3 more companies" sub="Not in sample · 6.0%" />
        </div>
      </div>

      <aside class="side">
        <BasketCompare />
        <RouterLink to="/whatif" class="btn-link" style="align-self: flex-start; height: 32px">See the full back-test in What-if →</RouterLink>
        <div class="section-head" style="margin-top: 8px"><h3>New money</h3></div>
        <div class="list"><Row title="Redirect Deposits" sub="$100/month into VOO · not set up" icon="chev" to="/redirect" /></div>
        <RouterLink to="/basket/order/1" class="btn btn-primary btn-block" style="margin-top: 8px">Build My Basket</RouterLink>
        <p class="caption center">Nothing happens until you review and confirm. Orders go through Alpaca Securities LLC, member FINRA/SIPC. Rally never holds your money.</p>
      </aside>
    </div>
  </AppShell>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: 800px 456px; justify-content: space-between; gap: 24px; }
.col, .side { display: flex; flex-direction: column; gap: 14px; }
.search { height: 46px; border-radius: 999px; background: var(--surf); display: flex; align-items: center; gap: 10px; padding: 0 18px; }
.search input { flex: 1; background: none; border: 0; outline: none; font-size: 15px; }
.search input::placeholder { color: var(--dim); }
.ex { height: 34px; font-size: 14px; font-weight: 600; background: #34313d; }
.center { text-align: center; }
</style>
