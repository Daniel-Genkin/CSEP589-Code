<script setup>
import { ref } from 'vue'
import FlowShell from '../components/FlowShell.vue'
import Row from '../components/Row.vue'
import { FUNDS } from '../data.js'

const pick = ref('VOO')
</script>

<template>
  <FlowShell :steps="3" :step="1" back="/" title="Pick your fund." body="Choose the fund you own and Rally will show you what’s inside. It won’t tell you what to buy.">
    <div class="section-head"><h3>Choose a fund</h3></div>
    <div class="list">
      <Row v-for="f in FUNDS" :key="f.tk" :tk="f.tk" :title="f.name" :sub="f.sub" :icon="pick === f.tk ? 'check' : null" class="pickable" @click="pick = f.tk" />
    </div>
    <p class="caption">No account needed.</p>
    <RouterLink to="/check/lines" class="btn btn-primary btn-block">Continue with {{ pick }}</RouterLink>

    <div class="section-head" style="margin-top: 12px"><h3>Or connect your account</h3></div>
    <div class="card-pad">
      <p class="t">See the funds you already own</p>
      <p class="dim">Connect your investing app to pull in your funds. This demo doesn’t connect to anything.</p>
      <RouterLink to="/connect/1" class="btn btn-secondary btn-block">Connect an Account</RouterLink>
    </div>
  </FlowShell>
</template>

<style scoped>
.pickable { cursor: pointer; }
.t { font-weight: 600; font-size: 18px; color: var(--white); }
.card-pad .dim { font-size: 15px; line-height: 1.45; }
</style>
