<script setup>
const model = defineModel({ type: [String, Number, Boolean], required: true })

defineProps({
  options: { type: Array, required: true },
  label: { type: String, default: '' },
})
</script>

<template>
  <div class="tabs" role="tablist" :aria-label="label">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="tab"
      class="tab"
      :class="{ 'is-active': model === option.value }"
      :aria-selected="model === option.value"
      @click="model = option.value"
    >
      <component :is="option.icon" v-if="option.icon" :size="15" />
      {{ option.label }}
      <span v-if="option.count !== undefined" class="count">{{ option.count }}</span>
      <span v-if="option.badge" class="seg-badge">{{ option.badge }}</span>
    </button>
  </div>
</template>

<style scoped>
.seg-badge {
  padding: 2px 7px;
  border-radius: var(--radius-pill);
  background: var(--brand-100);
  color: var(--brand-700);
  font-size: 11px;
  font-weight: 750;
}
</style>
