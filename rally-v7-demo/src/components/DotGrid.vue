<script setup>
import { computed } from 'vue'

// 1 dot = $1 of every $100.
const props = defineProps({
  segments: { type: Array, default: () => [] }, // [{ n, color }]
  total: { type: Number, default: 100 },
  cols: { type: Number, default: 20 },
  size: { type: Number, default: 22 },
  gap: { type: Number, default: 9 },
  rest: { type: String, default: '#2c2a35' },
})
const dots = computed(() => {
  const out = []
  for (const s of props.segments) for (let i = 0; i < s.n; i++) out.push(s.color)
  while (out.length < props.total) out.push(props.rest)
  return out
})
</script>

<template>
  <div class="grid" :style="{ gridTemplateColumns: `repeat(${cols}, ${size}px)`, gap: gap + 'px' }">
    <span v-for="(c, i) in dots" :key="i" :style="{ width: size + 'px', height: size + 'px', background: c }" />
  </div>
</template>

<style scoped>
.grid { display: grid; }
.grid span { border-radius: 50%; }
</style>
