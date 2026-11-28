<script setup lang="ts">
// The emailed code. Demo: no email is sent and any six digits sign you in.
import { computed, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import FlowShell from '@/components/v7/FlowShell.vue'
import { useCheckStore } from '@/state/check'
import { useDemoStore } from '@/state/demo'

const router = useRouter()
const demo = useDemoStore()
const check = useCheckStore()
if (!check.signInEmail) router.replace('/signin')

const digits = ref(['', '', '', '', '', ''])
const boxes = ref<(HTMLInputElement | null)[]>([])
const full = computed(() => digits.value.every((d) => d))
const sent = ref(false)

async function onInput(i: number, e: Event) {
  const el = e.target as HTMLInputElement
  const typed = el.value.replace(/\D/g, '')
  // A pasted code fills every box.
  if (typed.length > 1) {
    typed.slice(0, 6).split('').forEach((d, j) => (digits.value[j] = d))
    await nextTick()
    boxes.value[Math.min(typed.length, 5)]?.focus()
    return
  }
  digits.value[i] = typed
  el.value = typed
  if (typed && i < 5) {
    await nextTick()
    boxes.value[i + 1]?.focus()
  }
}
function onKey(i: number, e: KeyboardEvent) {
  if (e.key === 'Backspace' && !digits.value[i] && i > 0) boxes.value[i - 1]?.focus()
  if (e.key === 'Enter') submit()
}
function submit() {
  if (!full.value) return
  demo.createAccount(check.signInEmail)
  router.push(demo.portfolio ? '/home' : '/check')
}
</script>

<template>
  <FlowShell label="Sign in" back="/signin" logo-to="/" title="Check your email." :body="`We sent a 6-digit code to ${check.signInEmail}. It works for 10 minutes.`">
    <div class="section-head"><h3>Enter the code</h3></div>
    <div class="code">
      <input
        v-for="(d, i) in digits"
        :key="i"
        :ref="(el) => (boxes[i] = el as HTMLInputElement)"
        :value="d"
        inputmode="numeric"
        autocomplete="one-time-code"
        :aria-label="`Digit ${i + 1}`"
        :autofocus="i === 0"
        class="mono"
        @input="onInput(i, $event)"
        @keydown="onKey(i, $event)"
      />
    </div>
    <button class="btn btn-primary btn-block" :class="{ off: !full }" @click="submit">Continue</button>
    <button class="btn-link" style="align-self: flex-start" @click="sent = true">{{ sent ? 'New Code Sent' : 'Send a New Code' }}</button>
    <p class="caption">Demo: no email is sent. Any six digits sign you in.</p>
  </FlowShell>
</template>

<style scoped>
.code { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; }
.code input { height: 76px; border-radius: 16px; background: var(--surf); border: 1px solid var(--line); text-align: center; font-weight: 500; font-size: 30px; color: var(--cream); outline: none; caret-color: var(--sun); }
.code input:focus { border: 1.5px solid var(--sun); }
.off { opacity: 0.45; pointer-events: none; }
</style>
