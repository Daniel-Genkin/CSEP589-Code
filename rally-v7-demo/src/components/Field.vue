<script setup>
const model = defineModel({ type: String, default: '' })
defineProps({ label: String, placeholder: String, hint: String, type: { type: String, default: 'text' }, autofocus: Boolean })
</script>

<template>
  <label class="field">
    <span class="lbl">{{ label }}</span>
    <input v-model="model" :type="type" :placeholder="placeholder" :autofocus="autofocus" />
    <span v-if="hint" class="hint">{{ hint }}</span>
  </label>
</template>

<style scoped>
.field { display: flex; flex-direction: column; gap: 8px; }
.lbl { font-weight: 500; font-size: 13px; color: var(--dim); }
input { height: 52px; padding: 0 16px; border-radius: 14px; background: var(--ink); border: 1px solid var(--line); font-size: 17px; color: var(--cream); outline: none; }
input::placeholder { color: var(--mute); }
input:focus { border: 1.5px solid var(--sun); }
.hint { font-size: 13px; color: var(--mute); }
</style>
