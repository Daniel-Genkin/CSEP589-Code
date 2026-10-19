<script setup>
import { CATEGORY_MAP } from '@/utils/scoring';
import { computed } from 'vue';

const props = defineProps({
  category: { type: String, required: true },
  size: { type: Number, default: 36 },
})

const meta = computed(() => CATEGORY_MAP[props.category])
</script>

<template>
  <span
    class="cat-icon"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      color: `var(--cat-${category})`,
      background: `var(--cat-${category}-bg)`,
    }"
    aria-hidden="true"
  >
    <component :is="meta.icon" :size="Math.round(size * 0.5)" :stroke-width="2.1" />
  </span>
</template>

<style scoped>
.cat-icon {
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 32%;
}
</style>
