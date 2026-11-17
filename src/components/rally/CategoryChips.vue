<script setup lang="ts">
// The values categories as on/off chips. On: filled chip with the category's colour dot.
// Off: dashed "+ Label". Used on Home, Portfolio and What-if; Values settings has the full list.
import type { Category, CategoryId } from '@/types'

defineProps<{
  categories: Category[]
  selected: CategoryId[]
  /** Accessible name for the group */
  label: string
}>()
defineEmits<{ toggle: [id: CategoryId] }>()
</script>

<template>
  <div class="category-chips" role="group" :aria-label="label">
    <button
      v-for="category in categories"
      :key="category.id"
      type="button"
      class="chip"
      :class="{ 'chip-add': !selected.includes(category.id) }"
      :aria-pressed="selected.includes(category.id)"
      @click="$emit('toggle', category.id)"
    >
      <template v-if="selected.includes(category.id)"><span class="dot dot-10" :style="{ '--dot': category.color }" />{{ category.label }}</template>
      <template v-else>+ {{ category.label }}</template>
    </button>
  </div>
</template>

<style scoped>
.category-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
