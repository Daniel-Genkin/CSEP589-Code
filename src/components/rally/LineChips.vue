<script setup>
// The user's lines as removable chips, plus a dashed "+ Add a line" chip that opens the rest.
import { useClickOutside } from '@/composables/useClickOutside'
import { computed, ref } from 'vue'

const props = defineProps({
  // every line the user could pick: [{ key, label, color }]
  lines: { type: Array, required: true },
  // selected keys (v-model)
  modelValue: { type: Array, required: true },
  readonly: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const root = ref(null)
useClickOutside(root, () => (open.value = false))

const selected = computed(() => props.modelValue.map((key) => props.lines.find((l) => l.key === key)).filter(Boolean))
const available = computed(() => props.lines.filter((l) => !props.modelValue.includes(l.key)))

function remove(key) {
  emit(
    'update:modelValue',
    props.modelValue.filter((k) => k !== key),
  )
}
function add(key) {
  emit('update:modelValue', [...props.modelValue, key])
  if (available.value.length <= 1) open.value = false
}
</script>

<template>
  <div ref="root" class="line-chips">
    <template v-for="line in selected" :key="line.key">
      <span v-if="readonly" class="chip"><span class="dot dot-10" :style="{ '--dot': line.color }" />{{ line.label }}</span>
      <button v-else type="button" class="chip" :aria-label="`Remove ${line.label}`" @click="remove(line.key)">
        <span class="dot dot-10" :style="{ '--dot': line.color }" />{{ line.label }}<span class="chip__x" aria-hidden="true">×</span>
      </button>
    </template>

    <div v-if="!readonly && available.length" class="line-chips__add">
      <button type="button" class="chip chip-add" :aria-expanded="open" @click="open = !open">+ Add a line</button>
      <Transition name="pop">
        <ul v-if="open" class="line-chips__menu">
          <li v-for="line in available" :key="line.key">
            <button type="button" @click="add(line.key)"><span class="dot dot-10" :style="{ '--dot': line.color }" />{{ line.label }}</button>
          </li>
        </ul>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.line-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 8px;
}
.line-chips__add {
  position: relative;
}
.line-chips__menu {
  position: absolute;
  z-index: 20;
  top: calc(100% + 8px);
  left: 0;
  min-width: 240px;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-float);
}
.line-chips__menu button {
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
.line-chips__menu button:hover {
  background: var(--surface-2);
}
</style>
