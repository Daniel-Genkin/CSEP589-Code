<script setup>
import { band } from '@/utils/scoring';
import { computed } from 'vue';

const props = defineProps({
  score: { type: Number, required: true },
  short: { type: Boolean, default: false },
  showScore: { type: Boolean, default: false },
  size: { type: String, default: 'md' },
})

const meta = computed(() => band(props.score))
</script>

<template>
  <span class="score-chip" :class="`score-chip--${size}`" :style="{ color: meta.color, background: meta.bg }">
    <span class="score-chip__dot" />
    <span class="score-chip__label">{{ short ? meta.short : meta.label }}</span>
    <span v-if="showScore" class="score-chip__score num">{{ score }}</span>
  </span>
</template>

<style scoped>
.score-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 11px;
  border-radius: var(--radius-pill);
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}
.score-chip--sm {
  height: 24px;
  padding: 0 9px;
  font-size: 12px;
}
.score-chip__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}
.score-chip__label {
  color: color-mix(in srgb, currentColor 70%, var(--ink));
}
.score-chip__score {
  padding-left: 6px;
  margin-left: 2px;
  border-left: 1px solid color-mix(in srgb, currentColor 30%, transparent);
  color: var(--ink);
}
</style>
