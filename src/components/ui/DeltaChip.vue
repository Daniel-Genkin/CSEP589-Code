<script setup>
import { Minus, TrendingDown, TrendingUp } from '@lucide/vue';

defineProps({
  value: { type: Number, required: true },
  suffix: { type: String, default: '' },
  subtle: { type: Boolean, default: false },
})
</script>

<template>
  <span
    class="delta num"
    :class="{
      'delta--up': value > 0,
      'delta--down': value < 0,
      'delta--subtle': subtle,
    }"
  >
    <TrendingUp v-if="value > 0" :size="14" :stroke-width="2.4" />
    <TrendingDown v-else-if="value < 0" :size="14" :stroke-width="2.4" />
    <Minus v-else :size="14" :stroke-width="2.4" />
    {{ value > 0 ? '+' : value < 0 ? '−' : '' }}{{ Math.abs(value) }}{{ suffix }}
  </span>
</template>

<style scoped>
.delta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  padding: 0 8px;
  border-radius: var(--radius-pill);
  font-size: 12.5px;
  font-weight: 700;
  white-space: nowrap;
  background: var(--bg-tint);
  color: var(--muted);
}
.delta--up {
  background: var(--score-great-bg);
  color: var(--score-great);
}
.delta--down {
  background: var(--score-low-bg);
  color: var(--score-low);
}
.delta--subtle {
  background: transparent;
  padding: 0;
  height: auto;
}
</style>
