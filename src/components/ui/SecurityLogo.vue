<script setup>
import { computed } from 'vue';

const props = defineProps({
  symbol: { type: String, required: true },
  name: { type: String, default: '' },
  color: { type: String, default: '#5b5764' },
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
  border: 2px solid var(--ink-solid);
  background: var(--logo);
  color: var(--cream);
  font-family: var(--font-display);
  font-weight: 400;
  line-height: 1;
  text-shadow: 1.5px 1.5px 0 var(--ink-solid);
  box-shadow: 2px 2px 0 var(--ink-solid);
}
.logo--etf {
  box-shadow:
    3px 3px 0 var(--ink-solid),
    6px 6px 0 color-mix(in srgb, var(--logo) 45%, #fff4d6);
}
</style>
