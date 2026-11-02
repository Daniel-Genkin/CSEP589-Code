<script setup>
import BrandSparkle from '@/components/brand/BrandSparkle.vue'
import { BRAND_NAME } from '@/config/brand'

defineProps({
  size: { type: Number, default: 30 },
  showWordmark: { type: Boolean, default: true },
  inverse: { type: Boolean, default: false },
})
</script>

<template>
  <span class="brand" :class="{ 'brand--inverse': inverse }">
    <span v-if="showWordmark" class="brand__word" :style="{ fontSize: `${Math.round(size * 1.1)}px` }">{{ BRAND_NAME }}</span>
    <BrandSparkle :size="Math.max(10, Math.round(size * 0.42))" color="#F7C54E" class="brand__spark" />
  </span>
</template>

<style scoped>
.brand {
  display: inline-flex;
  align-items: flex-start;
  gap: 3px;
  color: var(--ink);
}
.brand--inverse {
  color: var(--cream);
}
.brand__word {
  font-family: var(--font-display);
  text-transform: uppercase;
  letter-spacing: 0.01em;
  line-height: 1;
}
.brand__spark {
  margin-top: 1px;
}
</style>
