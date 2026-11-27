<script setup>
import { ref } from 'vue'
import AppShell from '../components/AppShell.vue'
import DotGrid from '../components/DotGrid.vue'
import Row from '../components/Row.vue'

const tab = ref('companies')
const legend = [
  { name: 'Data privacy', color: 'var(--pink)', pct: '4.0%' },
  { name: 'Environment & climate', color: 'var(--sun)', pct: '3.0%' },
  { name: 'Not in sample', color: 'var(--violet)', pct: '6.0%' },
  { name: 'Everything else', color: '#4a4654', pct: '87.0%' },
]
</script>

<template>
  <AppShell active="home" back-label="Breakdown">
    <div class="grid">
      <div class="col">
        <p class="label">VOO · S&amp;P 500 · Sample</p>
        <p class="display big">13%</p>
        <p class="lead">of your money in VOO crosses your lines.</p>
        <p class="dim s">That’s $13 of every $100 you invest, spread across 5 of its 503 companies.</p>
        <div class="tags">
          <span class="tag"><i class="dot" style="background: var(--link)" />No account connected</span>
          <span class="tag"><i class="dot" style="background: var(--link)" />Every flag has a source</span>
          <span class="tag"><i class="dot" style="background: var(--link)" />No buy or sell tips</span>
        </div>
        <div class="section-head" style="margin-top: 20px"><h3>Who crosses your lines</h3><span class="meta">5 companies</span></div>
        <div class="seg">
          <button :class="{ on: tab === 'companies' }" @click="tab = 'companies'">Companies</button>
          <button :class="{ on: tab === 'lines' }" @click="tab = 'lines'">Lines</button>
        </div>
        <div class="bar"><i style="flex: 4; background: var(--pink)" /><i style="flex: 3; background: var(--sun)" /><i style="flex: 6; background: var(--violet)" /><i style="flex: 18" /></div>
        <div v-if="tab === 'companies'" class="list">
          <Row tk="MSFT" title="Microsoft" sub="Data privacy" dot="var(--pink)" right="4.0%" right-sub="$4.00 per $100" icon="chev" to="/explore" />
          <Row tk="XOM" title="ExxonMobil" sub="Environment & climate · Excluded" dot="var(--sun)" right="3.0%" right-sub="$3.00 per $100" icon="chev" to="/explore" />
          <Row title="3 more companies" sub="Not in sample" right="6.0%"><template #right><span class="mono" style="color: var(--white)">6.0%</span></template></Row>
        </div>
        <div v-else class="list">
          <Row title="Data privacy" sub="Microsoft" dot="var(--pink)" right="4.0%" />
          <Row title="Environment & climate" sub="ExxonMobil" dot="var(--sun)" right="3.0%" />
          <Row title="Military & defense" sub="Not in sample" dot="var(--flare)" right="–" />
          <Row title="Human rights & conflict" sub="Not in sample" dot="var(--violet)" right="–" />
          <Row title="Labor practices" sub="Not in sample" dot="var(--signal)" right="–" />
        </div>
        <p class="caption">Tap a company to see why it’s flagged.</p>
      </div>
      <aside class="card-pad side">
        <div class="sh"><b>Where every $100 goes</b><span class="caption">1 dot = $1</span></div>
        <DotGrid :segments="[{ n: 4, color: 'var(--pink)' }, { n: 3, color: 'var(--sun)' }, { n: 6, color: 'var(--violet)' }]" :size="14" :gap="7" />
        <div class="legend">
          <div v-for="l in legend" :key="l.name"><span><i class="dot" :style="{ background: l.color }" /> {{ l.name }}</span><b class="mono">{{ l.pct }}</b></div>
        </div>
        <p class="caption">Sample numbers, not a live scan.</p>
      </aside>
    </div>
  </AppShell>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: 800px 456px; justify-content: space-between; gap: 24px; }
.col { display: flex; flex-direction: column; gap: 12px; }
.big { font-size: 190px; color: var(--cream); margin: 4px 0; }
.lead { font-weight: 500; font-size: 24px; color: var(--white); }
.s { font-size: 15px; }
.tags { display: flex; gap: 8px; margin-top: 4px; }
.seg { display: grid; grid-template-columns: 1fr 1fr; padding: 3px; border-radius: 999px; background: var(--surf); }
.seg button { height: 36px; border-radius: 999px; font-weight: 600; font-size: 14px; color: var(--dim); }
.seg button.on { background: #45424f; color: var(--white); }
.bar { display: flex; gap: 3px; height: 8px; width: 46%; }
.bar i { border-radius: 4px; }
.side { gap: 14px; padding: 20px; align-self: start; }
.sh { display: flex; justify-content: space-between; align-items: baseline; }
.sh b { font-weight: 600; font-size: 17px; color: var(--white); }
.legend > div { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--line); font-size: 15px; color: var(--white); }
.legend span { display: inline-flex; align-items: center; gap: 10px; }
.legend b { font-weight: 500; }
</style>
