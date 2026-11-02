<script setup>
import { LINES } from '@/utils/lines'

const model = defineModel({ type: Array, required: true })
defineProps({ tone: { type: String, default: 'dark' } }) // 'dark' = on Signal Blue, 'light' = on Cream

function toggle(key) {
  model.value = model.value.includes(key) ? model.value.filter((k) => k !== key) : [...model.value, key]
}
</script>

<template>
  <div class="line-picker" :class="`line-picker--${tone}`">
    <button
      v-for="line in LINES"
      :key="line.key"
      type="button"
      class="line-chip"
      :class="{ 'is-on': model.includes(line.key) }"
      :style="model.includes(line.key) ? { background: line.bg, color: line.fg } : null"
      :aria-pressed="model.includes(line.key)"
      @click="toggle(line.key)"
    >
      {{ model.includes(line.key) ? '✓' : '+' }} {{ line.label }}
    </button>
  </div>
</template>

<style scoped>
.line-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.line-chip {
  min-height: 56px;
  padding: 0 24px;
  border: 3px dashed var(--cream);
  border-radius: 999px;
  color: var(--cream);
  font-size: 19px;
  font-weight: 600;
}
.line-picker--light .line-chip {
  min-height: 46px;
  padding: 0 18px;
  font-size: 16px;
  border-color: var(--ink-solid);
  color: var(--ink);
}
.line-chip.is-on {
  border: 3px solid var(--ink-solid);
  box-shadow: var(--shadow-sm);
  font-weight: 700;
}
</style>
