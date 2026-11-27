<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import FlowShell from '../components/FlowShell.vue'
import { state } from '../data.js'

const router = useRouter()
const text = ref((state.amount || 2000).toLocaleString('en-US'))
const presets = [500, 1000, 5000, 10000]
function setAmount(n) {
  text.value = n.toLocaleString('en-US')
}
function onInput(e) {
  const n = parseInt(e.target.value.replace(/\D/g, '') || '0', 10)
  text.value = n ? n.toLocaleString('en-US') : ''
}
function show() {
  const n = parseInt(text.value.replace(/\D/g, '') || '0', 10)
  state.amount = n || null
  router.push('/check/printing')
}
function skip() {
  state.amount = null
  router.push('/check/printing')
}
</script>

<template>
  <FlowShell :steps="3" :step="3" back="/check/lines" title="How much is in VOO?" body="Optional. It lets Rally show your result in dollars. It stays on this device.">
    <label class="amount">
      <span class="display cur">$</span>
      <input class="display" :value="text" inputmode="numeric" aria-label="Amount in VOO" @input="onInput" />
    </label>
    <div class="presets">
      <button v-for="p in presets" :key="p" class="chip chip-outline" @click="setAmount(p)">${{ p.toLocaleString('en-US') }}</button>
    </div>
    <button class="btn btn-primary btn-block" style="margin-top: 20px" @click="show">Show My Receipt</button>
    <button class="btn-link" style="align-self: flex-start" @click="skip">Skip for Now</button>
  </FlowShell>
</template>

<style scoped>
.amount { display: flex; align-items: baseline; margin-top: 18px; }
.cur, .amount input { font-size: 112px; color: var(--cream); }
.amount input { width: 100%; background: none; border: 0; outline: none; caret-color: var(--sun); padding: 0; }
.presets { display: flex; gap: 8px; }
.presets .chip { height: 36px; font-size: 14px; }
</style>
