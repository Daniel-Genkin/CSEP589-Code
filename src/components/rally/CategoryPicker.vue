<script setup lang="ts">
// The selected categories as removable chips, plus a dashed "+ Add a line" chip that opens the
// rest (Figma "Your lines" card). For on/off chips that show every category, use CategoryChips.
import { useClickOutside } from '@/composables/useClickOutside'
import type { Category, CategoryId } from '@/types'
import { computed, ref } from 'vue'

const props = defineProps<{
  /** Every category the user could pick, in display order */
  categories: Category[]
  selected: CategoryId[]
}>()
defineEmits<{ toggle: [id: CategoryId] }>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
useClickOutside(root, () => (open.value = false))

const chosen = computed(() => props.categories.filter((c) => props.selected.includes(c.id)))
const available = computed(() => props.categories.filter((c) => !props.selected.includes(c.id)))
</script>

<template>
  <div ref="root" class="picker">
    <button v-for="category in chosen" :key="category.id" type="button" class="chip" :aria-label="`Remove ${category.label}`" @click="$emit('toggle', category.id)">
      <span class="dot dot-10" :style="{ '--dot': category.color }" />{{ category.label }}<span class="chip__x" aria-hidden="true">×</span>
    </button>

    <div v-if="available.length" class="picker__add">
      <button type="button" class="chip chip-add" :aria-expanded="open" @click="open = !open">+ Add a line</button>
      <Transition name="pop">
        <ul v-if="open" class="picker__menu">
          <li v-for="category in available" :key="category.id">
            <button type="button" @click="$emit('toggle', category.id)"><span class="dot dot-10" :style="{ '--dot': category.color }" />{{ category.label }}</button>
          </li>
        </ul>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.picker {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 8px;
}
.picker__add {
  position: relative;
}
.picker__menu {
  position: absolute;
  z-index: 20;
  top: calc(100% + 8px);
  left: 0;
  min-width: 260px;
  max-height: 320px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-float);
}
.picker__menu button {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  font-size: 15px;
  font-weight: 500;
  text-align: left;
}
.picker__menu button:hover {
  background: var(--surface-2);
}
</style>
