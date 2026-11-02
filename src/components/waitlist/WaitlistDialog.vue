<script setup>
import UiModal from '@/components/ui/UiModal.vue'
import { BRAND_NAME } from '@/config/brand'
import { useWaitlistStore } from '@/stores/waitlist'
import { nextTick, ref, useTemplateRef, watch } from 'vue'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const waitlist = useWaitlistStore()
const email = ref('')
const invalid = ref(false)
const sentTo = ref('')
const input = useTemplateRef('input')
const doneButton = useTemplateRef('doneButton')
let returnFocus = null

watch(
  () => waitlist.isOpen,
  async (open) => {
    if (open) {
      returnFocus = document.activeElement
      email.value = ''
      invalid.value = false
      sentTo.value = ''
      await nextTick()
      input.value?.focus()
    } else {
      returnFocus?.focus?.()
    }
  },
)

async function submit() {
  const value = email.value.trim()
  if (!EMAIL.test(value)) {
    invalid.value = true
    input.value?.focus()
    return
  }
  waitlist.join(value)
  sentTo.value = value
  await nextTick()
  doneButton.value?.focus()
}
</script>

<template>
  <UiModal :open="waitlist.isOpen" label="Join the waitlist" @close="waitlist.isOpen = false">
    <form v-if="!sentTo" class="wl" novalidate @submit.prevent="submit">
      <p class="label-mono wl__eyebrow">Early access</p>
      <h2 class="wl__title">Get on the <span>list.</span></h2>
      <p class="wl__lede">Be first in line when {{ BRAND_NAME }} opens up. One email when it's your turn. No spam, no judgment.</p>

      <label class="label-mono" for="wl-email">Your email</label>
      <input
        id="wl-email"
        ref="input"
        v-model="email"
        class="wl__input"
        type="email"
        inputmode="email"
        autocomplete="email"
        placeholder="you@example.com"
        :aria-invalid="invalid"
        aria-describedby="wl-error"
        required
        @input="invalid = false"
      />
      <p id="wl-error" class="wl__error" role="alert">{{ invalid ? 'Enter a valid email address.' : '' }}</p>

      <button type="submit" class="btn btn-flare wl__submit">Save my spot ↗</button>
    </form>

    <div v-else class="wl">
      <p class="label-mono wl__eyebrow">You're in</p>
      <h2 class="wl__title">Spot <span>saved.</span></h2>
      <p class="wl__lede">We'll email <b>{{ sentTo }}</b> when {{ BRAND_NAME }} opens up.</p>
      <button ref="doneButton" type="button" class="btn btn-flare wl__submit" @click="waitlist.isOpen = false">Done</button>
    </div>
  </UiModal>
</template>

<style scoped>
.wl {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
  color: var(--ink);
}
.wl__eyebrow {
  color: var(--peach-700);
}
.wl__title {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(44px, 9vw, 64px);
  line-height: 0.95;
  text-transform: uppercase;
}
.wl__title span {
  color: var(--flare);
}
.wl__lede {
  font-size: 17px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}
.wl__input {
  width: 100%;
  min-height: 56px;
  padding: 0 22px;
  border: var(--outline);
  border-radius: var(--radius-pill);
  background: #fff;
  font: inherit;
  font-size: 18px;
  color: var(--ink);
}
.wl__input[aria-invalid='true'] {
  border-color: var(--flare);
  background: var(--peach-50);
}
.wl__error {
  min-height: 1.2em;
  margin-top: -6px;
  font-weight: 600;
  font-size: 15px;
  color: var(--peach-700);
}
.wl__submit {
  --btn-h: 64px;
  padding: 0 34px;
  border-width: 3px;
  font-family: var(--font-display);
  font-weight: 400;
  font-size: 26px;
  text-transform: uppercase;
  box-shadow: var(--shadow);
}
</style>
