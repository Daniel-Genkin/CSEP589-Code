<script setup>
const on = defineModel({ type: Boolean, default: false })
defineProps({ label: String })
</script>

<template>
  <button class="toggle" :class="{ on }" role="switch" :aria-checked="on" :aria-label="label" @click="on = !on">
    <span class="knob" />
  </button>
</template>

<style scoped>
.toggle { width: 51px; height: 31px; border-radius: 999px; background: #3a3744; position: relative; transition: background 0.18s; flex: none; }
.toggle.on { background: var(--sun); }
.knob { position: absolute; top: 2px; left: 2px; width: 27px; height: 27px; border-radius: 50%; background: #fff; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3); transition: transform 0.18s; }
.on .knob { transform: translateX(20px); }
</style>
