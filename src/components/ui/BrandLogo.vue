<script setup>
import { useId } from 'vue';

defineProps({
  size: { type: Number, default: 30 },
  showWordmark: { type: Boolean, default: true },
  inverse: { type: Boolean, default: false },
})

// Unique per instance: a shared id breaks when the first copy sits in a display:none container.
const gradientId = `outvest-mark-${useId()}`
</script>

<template>
  <span class="brand" :class="{ 'brand--inverse': inverse }">
    <svg class="brand__mark" :width="size" :height="size" viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient :id="gradientId" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#43A877" />
          <stop offset="1" stop-color="#1A5B3C" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="10" :fill="`url(#${gradientId})`" />
      <path d="M9.5 22.5C9.5 14.6 14.8 9.5 22.5 9.5c0 7.9-5.3 13-13 13Z" fill="#fff" fill-opacity=".95" />
      <path d="M9.5 22.5 16.8 15.2" stroke="#1F7149" stroke-width="1.7" stroke-linecap="round" />
    </svg>
    <span v-if="showWordmark" class="brand__word" :style="{ fontSize: `${Math.round(size * 0.82)}px` }">outvest</span>
  </span>
</template>

<style scoped>
.brand {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: var(--ink);
}
.brand--inverse {
  color: #fff;
}
.brand__mark {
  flex-shrink: 0;
}
.brand__word {
  font-family: var(--font-display);
  font-variation-settings: 'SOFT' 100;
  font-weight: 620;
  letter-spacing: -0.035em;
  line-height: 1;
  padding-bottom: 2px;
}
</style>
