<script setup>
// Made-up names and sample data always wear this sticker.
defineProps({
  tilt: { type: Number, default: 6 },
})
</script>

<template>
  <span class="sample" :style="{ transform: `rotate(${tilt}deg)` }">Sample data</span>
</template>

<style scoped>
.sample {
  display: inline-block;
  background: var(--bubblegum);
  color: var(--ink);
  border: 3px solid var(--ink-solid);
  border-radius: 999px;
  padding: 6px 14px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
}
</style>
