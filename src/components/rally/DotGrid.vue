<script setup>
// "1 dot = $1": a row-wrapped grid of dots, coloured by segment, the rest empty.
import { computed } from 'vue'

const props = defineProps({
  // [{ count, color }] in display order; counts are whole dots
  segments: { type: Array, default: () => [] },
  total: { type: Number, default: 100 },
  size: { type: Number, default: 26 },
  gap: { type: Number, default: 10 },
  emptyColor: { type: String, default: 'var(--track)' },
  label: { type: String, default: '' },
})

const dots = computed(() => {
  const out = []
  for (const seg of props.segments) for (let i = 0; i < seg.count && out.length < props.total; i++) out.push(seg.color)
  while (out.length < props.total) out.push(props.emptyColor)
  return out
})
</script>

<template>
  <div class="dot-grid" role="img" :aria-label="label" :style="{ gap: `${gap}px`, '--dot-size': `${size}px` }">
    <span v-for="(color, i) in dots" :key="i" :style="{ background: color }" />
  </div>
</template>

<style scoped>
.dot-grid {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  width: 100%;
}
.dot-grid span {
  flex: none;
  width: var(--dot-size);
  height: var(--dot-size);
  border-radius: 50%;
  transition: background-color 0.3s var(--ease);
}
</style>
