<script setup>
import { computed, ref } from 'vue'
import FlowShell from '../components/FlowShell.vue'
import Row from '../components/Row.vue'

const props = defineProps({ step: String })
const n = computed(() => Number(props.step))
const app = ref('Fidelity')
const apps = [['RH', 'Robinhood'], ['FID', 'Fidelity'], ['SCHW', 'Charles Schwab'], ['VG', 'Vanguard'], ['WB', 'Webull']]
const fund = ref('VOO')
const found = [
  ['VOO', 'Vanguard S&P 500 ETF', '$2,000 in this account'],
  ['FXAIX', 'Fidelity 500 Index Fund', '$850 in this account'],
  ['QQQ', 'Invesco QQQ Trust', '$430 in this account'],
]
</script>

<template>
  <FlowShell v-if="n === 1" :steps="3" :step="1" label="Connect · Step 1 of 3" back="/check" title="Where do you invest?" body="Rally connects through a secure partner and only reads what you hold. It can’t move money or place trades.">
    <div class="section-head"><h3>Choose your app</h3></div>
    <div class="list">
      <Row v-for="a in apps" :key="a[1]" :tk="a[0]" :title="a[1]" :sub="app === a[1] ? 'Selected' : undefined" :icon="app === a[1] ? 'check' : null" style="cursor: pointer" @click="app = a[1]" />
    </div>
    <p class="caption">Don’t see yours? You can type a fund instead.</p>
    <RouterLink to="/connect/2" class="btn btn-primary btn-block">Continue with {{ app }}</RouterLink>
    <RouterLink to="/check" class="btn-link" style="align-self: flex-start">Type a Fund Instead</RouterLink>
  </FlowShell>

  <FlowShell v-else-if="n === 2" :steps="3" :step="2" label="Connect · Step 2 of 3" back="/connect/1" title="Here’s what Rally sees." :body="`You’ll sign in on ${app}’s own site, so Rally never sees your password. You can disconnect any time.`">
    <div class="section-head"><h3>Rally can see</h3></div>
    <div class="list">
      <Row title="Which funds and stocks you hold" icon="check" />
      <Row title="How much is in each one" icon="check" />
    </div>
    <div class="section-head"><h3>Rally can’t</h3></div>
    <div class="list">
      <Row title="Move money or place trades" icon="close" />
      <Row title="See your password" icon="close" />
      <Row title="Change anything in your account" icon="close" />
    </div>
    <RouterLink to="/connect/3" class="btn btn-primary btn-block">Continue to {{ app }}</RouterLink>
    <RouterLink to="/check" class="btn-link" style="align-self: flex-start">Not Now</RouterLink>
    <p class="caption">Read-only. Handled by a secure connection partner.</p>
  </FlowShell>

  <FlowShell v-else :steps="3" :step="3" label="Connect · Step 3 of 3" back="/connect/2" title="We found 3 funds." :body="`These are in your ${app} account. Pick one to check first. You can check the others any time.`">
    <div class="section-head"><h3>{{ app }} · Individual</h3></div>
    <div class="list">
      <Row v-for="f in found" :key="f[0]" :tk="f[0]" :title="f[1]" :sub="f[2]" :icon="fund === f[0] ? 'check' : null" style="cursor: pointer" @click="fund = f[0]" />
    </div>
    <p class="caption">Connected to {{ app }}. Read-only.</p>
    <RouterLink to="/check/lines" class="btn btn-primary btn-block">Check {{ fund }}</RouterLink>
  </FlowShell>
</template>
