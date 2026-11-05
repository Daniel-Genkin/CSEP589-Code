<script setup>
defineProps({
  size: { type: Number, default: 16 },
  color: { type: String, default: '#F7C54E' },
})
</script>

<template>
  <svg class="sparkle" :width="size" :height="size" viewBox="-10 -10 20 20" aria-hidden="true">
    <path d="M0,-10 L2.2,-2.2 L10,0 L2.2,2.2 L0,10 L-2.2,2.2 L-10,0 L-2.2,-2.2Z" :fill="color" />
  </svg>
</template>

<style scoped>
.sparkle {
  flex-shrink: 0;
}
</style>
