<script setup>
import FlowShell from '../components/FlowShell.vue'
import Row from '../components/Row.vue'
</script>

<template>
  <FlowShell :steps="3" :step="1" title="We can’t check VXUS yet." body="VXUS holds companies based outside the US. Rally checks US public records, so it can’t flag them yet.">
    <div class="section-head"><h3>Try a US fund</h3></div>
    <div class="list">
      <Row tk="VOO" title="Vanguard S&P 500 ETF" sub="Vanguard · S&P 500 index" icon="check" to="/check/lines" />
      <Row tk="VTI" title="Vanguard Total Stock Market ETF" sub="Vanguard · US total market" to="/check/lines" />
      <Row tk="QQQ" title="Invesco QQQ Trust" sub="Invesco · Nasdaq-100 index" to="/check/lines" />
    </div>
    <RouterLink to="/check/lines" class="btn btn-primary btn-block">Check VOO Instead</RouterLink>
    <button class="btn-link" style="align-self: flex-start" @click="$router.back()">Tell Me When VXUS Is Ready</button>
  </FlowShell>
</template>
