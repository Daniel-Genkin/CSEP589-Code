<script setup>
import SecurityLogo from '@/components/ui/SecurityLogo.vue'
import { computed } from 'vue'

const props = defineProps({
  items: { type: Array, required: true },
  max: { type: Number, default: 5 },
  size: { type: Number, default: 28 },
})
const shown = computed(() => props.items.slice(0, props.max))
const extra = computed(() => Math.max(0, props.items.length - props.max))
</script>

<template>
  <span class="logo-stack" :aria-label="items.map((i) => i.name).join(', ')">
    <SecurityLogo
      v-for="item in shown"
      :key="item.symbol"
      :symbol="item.symbol"
      :name="item.name"
      :color="item.color"
      :size="size"
      class="logo-stack__logo"
    />
    <span v-if="extra" class="logo-stack__more" :style="{ width: `${size}px`, height: `${size}px` }">+{{ extra }}</span>
  </span>
</template>

<style scoped>
.logo-stack {
  display: inline-flex;
  align-items: center;
}
.logo-stack__logo,
.logo-stack__more {
  margin-left: -6px;
}
.logo-stack__logo:first-child {
  margin-left: 0;
}
.logo-stack__more {
  display: inline-grid;
  place-items: center;
  border: 2px solid var(--ink-solid);
  border-radius: 30%;
  background: var(--sun);
  color: var(--ink);
  box-shadow: var(--shadow-xs);
  font-size: 11px;
  font-weight: 800;
}
</style>
