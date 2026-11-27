<script setup>
import { nextTick, ref } from 'vue'
import FlowShell from '../components/FlowShell.vue'

const digits = ref(['4', '8', '2', '', '', ''])
const boxes = ref([])
async function onInput(i, e) {
  const v = e.target.value.replace(/\D/g, '').slice(-1)
  digits.value[i] = v
  if (v && i < 5) {
    await nextTick()
    boxes.value[i + 1]?.focus()
  }
}
function onKey(i, e) {
  if (e.key === 'Backspace' && !digits.value[i] && i > 0) boxes.value[i - 1]?.focus()
}
</script>

<template>
  <FlowShell label="Sign in" back="/signin" title="Check your email." body="We sent a 6-digit code to alex@example.com. It works for 10 minutes.">
    <div class="section-head"><h3>Enter the code</h3></div>
    <div class="code">
      <input
        v-for="(d, i) in digits"
        :key="i"
        :ref="(el) => (boxes[i] = el)"
        :value="d"
        inputmode="numeric"
        maxlength="1"
        :aria-label="`Digit ${i + 1}`"
        :autofocus="i === 3"
        class="mono"
        @input="onInput(i, $event)"
        @keydown="onKey(i, $event)"
      />
    </div>
    <RouterLink to="/home" class="btn btn-primary btn-block">Continue</RouterLink>
    <button class="btn-link" style="align-self: flex-start">Send a New Code</button>
  </FlowShell>
</template>

<style scoped>
.code { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; }
.code input { height: 76px; border-radius: 16px; background: var(--surf); border: 1px solid var(--line); text-align: center; font-weight: 500; font-size: 30px; color: var(--cream); outline: none; caret-color: var(--sun); }
.code input:focus { border: 1.5px solid var(--sun); }
</style>
