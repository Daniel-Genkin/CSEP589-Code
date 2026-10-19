<script setup>
import { computed } from 'vue';

const props = defineProps({
  symbol: { type: String, required: true },
  name: { type: String, default: '' },
  color: { type: String, default: '#7a8a80' },
  type: { type: String, default: 'stock' },
  size: { type: Number, default: 44 },
})

const letter = computed(() => (props.name || props.symbol).trim()[0]?.toUpperCase() ?? '?')
</script>

<template>
  <span
    class="logo"
    :class="{ 'logo--etf': type === 'etf' }"
    :style="{ '--logo': color, width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * 0.46)}px` }"
    aria-hidden="true"
  >
    {{ letter }}
  </span>
</template>

<style scoped>
.logo {
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 30%;
  background: linear-gradient(150deg, color-mix(in srgb, var(--logo) 78%, #fff), var(--logo));
  color: #fff;
  font-family: var(--font-display);
  font-variation-settings: 'SOFT' 100;
  font-weight: 600;
  line-height: 1;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.16),
    0 6px 14px -8px var(--logo);
}
.logo--etf {
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.16),
    3px -3px 0 0 color-mix(in srgb, var(--logo) 35%, #fff),
    6px -6px 0 0 color-mix(in srgb, var(--logo) 16%, #fff);
}
</style>
