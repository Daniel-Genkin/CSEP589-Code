<script setup>
import { APP_STORE_URL, GOOGLE_PLAY_URL } from '@/config/links'
import { Apple } from '@lucide/vue'

defineProps({
  // Cream buttons for dark or blue backgrounds.
  inverse: { type: Boolean, default: false },
})
</script>

<template>
  <div class="stores" :class="{ 'stores--inverse': inverse }">
    <a :href="APP_STORE_URL" class="store" target="_blank" rel="noopener noreferrer">
      <Apple :size="24" />
      <span class="store__text">
        <span class="store__small">Download on the</span>
        <span class="store__big">App Store</span>
      </span>
    </a>
    <a :href="GOOGLE_PLAY_URL" class="store" target="_blank" rel="noopener noreferrer">
      <svg width="21" height="23" viewBox="0 0 20 22" aria-hidden="true">
        <path d="M1 1.2 11.3 11 1 20.8c-.3-.3-.5-.7-.5-1.2V2.4c0-.5.2-.9.5-1.2Z" fill="#00D7FE" />
        <path d="M14.8 7.5 11.3 11 1 1.2c.4-.3 1-.4 1.6-.1l12.2 6.4Z" fill="#00F076" />
        <path d="M14.8 14.5 2.6 20.9c-.6.3-1.2.2-1.6-.1L11.3 11l3.5 3.5Z" fill="#FF3A44" />
        <path d="m18.4 9.4-3.6-1.9L11.3 11l3.5 3.5 3.6-1.9c1.2-.7 1.2-2.5 0-3.2Z" fill="#FFD400" />
      </svg>
      <span class="store__text">
        <span class="store__small">Get it on</span>
        <span class="store__big">Google Play</span>
      </span>
    </a>
  </div>
</template>

<style scoped>
.stores {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}
.store {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 54px;
  padding: 0 20px 0 16px;
  border-radius: 16px;
  border: var(--outline-thin);
  background: var(--ink-solid);
  color: var(--cream);
  box-shadow: var(--shadow-sm);
  transition:
    transform 0.15s var(--ease),
    box-shadow 0.15s var(--ease);
}
.store:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 var(--ink-solid);
}
.store:active {
  transform: translate(2px, 2px);
  box-shadow: none;
}
.store__text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}
.store__small {
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.04em;
  opacity: 0.85;
}
.store__big {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.stores--inverse .store {
  background: var(--cream);
  color: var(--ink);
}
.stores--inverse .store:hover {
  background: #fff9e8;
}
</style>
