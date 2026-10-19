<script setup>
import { Sparkles } from '@lucide/vue';

defineProps({
  planId: { type: String, required: true },
  name: { type: String, default: '' },
})

const NAMES = { free: 'Free', premium: 'Premium', pro: 'Pro' }
</script>

<template>
  <span class="plan-badge" :class="`plan-badge--${planId}`">
    <Sparkles v-if="planId !== 'free'" :size="12" :stroke-width="2.4" />
    {{ name || NAMES[planId] }}
  </span>
</template>

<style scoped>
.plan-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 24px;
  padding: 0 10px;
  border-radius: var(--radius-pill);
  font-size: 12px;
  font-weight: 750;
  letter-spacing: 0.01em;
  white-space: nowrap;
}
.plan-badge--free {
  background: var(--bg-tint);
  color: var(--ink-2);
}
.plan-badge--premium {
  background: var(--lilac-100);
  color: var(--lilac-700);
}
.plan-badge--pro {
  background: linear-gradient(120deg, var(--brand-100), #e6f5d9);
  color: var(--brand-700);
}
</style>
