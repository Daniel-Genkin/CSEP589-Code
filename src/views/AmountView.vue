<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import FlowShell from '@/components/v7/FlowShell.vue'
import { DEFAULT_PORTFOLIO_USD } from '@/config/defaults'
import { useCheckStore } from '@/state/check'

const router = useRouter()
const check = useCheckStore()
const fund = check.input.split(',')[0]?.trim() || 'your fund'
const text = ref((check.amount ?? DEFAULT_PORTFOLIO_USD).toLocaleString('en-US'))
const presets = [1000, 5000, 10000, 25000]
const setAmount = (n: number) => (text.value = n.toLocaleString('en-US'))
function onInput(e: Event) {
  const n = parseInt((e.target as HTMLInputElement).value.replace(/\D/g, '') || '0', 10)
  text.value = n ? n.toLocaleString('en-US') : ''
}
function show() {
  const n = parseInt(text.value.replace(/\D/g, '') || '0', 10)
  check.amount = n > 0 ? n : null
  router.push('/check/printing')
}
function skip() {
  check.amount = null
  router.push('/check/printing')
}
</script>

<template>
  <FlowShell :steps="3" :step="3" back="/check/lines" :title="`How much is in ${fund}?`" :body="`Optional. It lets Rally show your result in dollars. Skip it and Rally uses $${DEFAULT_PORTFOLIO_USD.toLocaleString('en-US')} as an example.`">
    <label class="amount">
      <span class="display cur">$</span>
      <input class="display" :value="text" inputmode="numeric" aria-label="Amount in dollars" @input="onInput" @keydown.enter="show" />
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
