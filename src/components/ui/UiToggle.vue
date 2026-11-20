<script setup>
const model = defineModel({ type: Boolean, default: false })

defineProps({
  label: { type: String, required: true },
  description: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
})
</script>

<template>
  <label class="toggle" :class="{ 'is-disabled': disabled }">
    <span class="toggle__text">
      <span class="toggle__label">{{ label }}</span>
      <span v-if="description" class="toggle__description">{{ description }}</span>
    </span>
    <input v-model="model" type="checkbox" class="sr-only" role="switch" :disabled="disabled" />
    <span class="toggle__track" aria-hidden="true"><span class="toggle__thumb" /></span>
  </label>
</template>

<style scoped>
.toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  cursor: pointer;
}
.toggle.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.toggle__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.toggle__label {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.25;
}
.toggle__description {
  font-size: 13px;
  color: var(--text-muted);
}
.toggle__track {
  position: relative;
  flex-shrink: 0;
  width: 46px;
  height: 28px;
  border-radius: var(--radius-pill);
  background: var(--border);
  transition: background-color 0.25s var(--ease);
}
.toggle__thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--cream);
  transition: transform 0.25s var(--ease);
}
input:checked + .toggle__track {
  background: var(--brand-400);
}
input:checked + .toggle__track .toggle__thumb {
  transform: translateX(18px);
}
input:focus-visible + .toggle__track {
  box-shadow: var(--ring);
}
</style>
