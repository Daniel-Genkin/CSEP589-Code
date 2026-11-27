<script setup>
import { ref } from 'vue'
import AppShell from '../components/AppShell.vue'
import Row from '../components/Row.vue'
import Toggle from '../components/Toggle.vue'

const digest = ref(true)
const updates = ref(true)
</script>

<template>
  <AppShell title="Account." body="Your profile, plan and connected accounts.">
    <div class="grid">
      <div class="col">
        <div class="grp">
          <div class="section-head"><h3>Profile</h3></div>
          <div class="list"><Row title="Name" right="Alex Lee" /><Row title="Email" right="alex@example.com" /><Row title="Sign-in" right="Email code" /></div>
        </div>
        <div class="grp">
          <div class="section-head"><h3>Connected accounts</h3></div>
          <div class="list">
            <Row tk="FID" title="Fidelity" sub="Read-only · connected Nov 27" right="Disconnect" right-tone="link" />
            <Row tk="ALP" title="Alpaca Securities" sub="Basket account · opened Nov 27" right="Manage" right-tone="link" />
          </div>
        </div>
        <div class="grp">
          <div class="section-head"><h3>Privacy</h3></div>
          <div class="list">
            <Row title="Download my data" right="Download" right-tone="link" />
            <Row title="Delete my account" sub="Removes your lines and settings. Basket holdings stay at Alpaca." right="Delete" right-tone="flare" />
          </div>
        </div>
      </div>
      <aside class="col">
        <div class="grp">
          <div class="section-head"><h3>Plan</h3></div>
          <div class="list"><Row title="Free" sub="Check one fund at a time" right="See Plans" right-tone="link" to="/plans" /></div>
        </div>
        <div class="grp">
          <div class="section-head"><h3>Alerts</h3></div>
          <div class="card rows">
            <div class="lr"><span class="t"><b>Weekly Digest</b><small>News on companies in your fund, once a week.</small></span><Toggle v-model="digest" label="Weekly Digest" /></div>
            <div class="lr"><span class="t"><b>Source Updates</b><small>When there’s new info on a flagged company.</small></span><Toggle v-model="updates" label="Source Updates" /></div>
          </div>
        </div>
        <div class="grp">
          <div class="section-head"><h3>Demo states</h3></div>
          <div class="list">
            <Row title="All clear" sub="What Home looks like with 0% crossing" icon="chev" to="/home/clear" />
            <Row title="Data unavailable" sub="What Home looks like when a scan fails" icon="chev" to="/home/unavailable" />
            <Row title="Fund we can’t check" sub="VXUS, a non-US fund" icon="chev" to="/check/unsupported" />
          </div>
        </div>
        <RouterLink to="/" class="btn btn-secondary btn-block">Sign Out</RouterLink>
      </aside>
    </div>
  </AppShell>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: 800px 456px; justify-content: space-between; gap: 24px; }
.col { display: flex; flex-direction: column; gap: 32px; }
.grp { display: flex; flex-direction: column; gap: 12px; }
.rows { padding: 0 16px; }
.lr { display: flex; align-items: center; gap: 14px; min-height: 63px; border-bottom: 1px solid var(--line); }
.lr:last-child { border-bottom: 0; }
.t { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.t b { font-weight: 600; font-size: 16px; color: var(--white); }
.t small { font-size: 13px; color: var(--dim); }
</style>
