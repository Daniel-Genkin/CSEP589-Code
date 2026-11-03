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

// Logos use the brand accents (no greens), picked consistently per ticker.
const ACCENTS = ['#354BF4', '#E85A2A', '#8A6CF2', '#F07AB6', '#3A2A9E', '#D6472B', '#F7C54E']
const fill = computed(() => {
  let h = 0
  for (const ch of props.symbol) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return ACCENTS[h % ACCENTS.length]
})
</script>

<template>
  <span
    class="logo"
    :class="{ 'logo--etf': type === 'etf' }"
    :style="{ '--logo': fill, width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * 0.46)}px` }"
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
