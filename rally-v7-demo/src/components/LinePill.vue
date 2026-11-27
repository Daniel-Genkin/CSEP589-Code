<script setup>
import { Flag } from '@lucide/vue'

defineProps({
  label: String,
  color: String,
  size: { type: String, default: 'lg' }, // lg | md | sm
  flag: { type: Boolean, default: true },
  rotate: { type: Number, default: 0 },
  blur: { type: Number, default: 0 },
})
</script>

<template>
  <span
    class="pill"
    :class="size"
    :style="{
      background: color,
      transform: `rotate(${rotate}deg)`,
      filter: blur ? `blur(${blur}px)` : undefined,
      '--glow': `color-mix(in srgb, ${color} 38%, transparent)`,
    }"
  >
    <Flag v-if="flag" :size="size === 'lg' ? 18 : 14" fill="currentColor" :stroke-width="2.4" />
    {{ label }}
  </span>
</template>

<style scoped>
.pill { display: inline-flex; align-items: center; gap: 10px; border-radius: 999px; color: var(--ink); font-weight: 600; letter-spacing: -0.01em; white-space: nowrap; box-shadow: 0 14px 36px var(--glow); }
.lg { font-size: 20px; padding: 14px 24px 14px 18px; }
.md { font-size: 17px; padding: 10px 18px; gap: 8px; }
.sm { font-size: 13px; padding: 6px 12px; gap: 6px; box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3); }
</style>
