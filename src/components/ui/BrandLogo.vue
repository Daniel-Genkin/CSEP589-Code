<script setup>
import BrandSparkle from './BrandSparkle.vue'
import BrandSpiral from './BrandSpiral.vue'

defineProps({
  size: { type: Number, default: 30 },
  showWordmark: { type: Boolean, default: true },
  inverse: { type: Boolean, default: false },
})
</script>

<template>
  <span class="brand" :class="{ 'brand--inverse': inverse, 'brand--mark': !showWordmark }">
    <template v-if="showWordmark">
      <span class="brand__word" :style="{ fontSize: `${Math.round(size * 1.1)}px` }">Outvest</span>
      <BrandSparkle class="brand__spark" :size="Math.max(10, Math.round(size * 0.42))" />
    </template>
    <BrandSpiral v-else class="brand__tile" :size="size" />
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
.brand--mark {
  align-items: center;
}
.brand__word {
  font-family: var(--font-display);
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.01em;
  line-height: 1;
}
.brand__spark {
  margin-top: 1px;
}
.brand__tile {
  border-radius: 22%;
  box-shadow: 2px 2px 0 var(--ink-solid);
}
</style>
