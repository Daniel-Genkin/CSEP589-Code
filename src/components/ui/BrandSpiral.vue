<script setup>
defineProps({
  size: { type: Number, default: 40 },
  // Draw the blue rounded tile behind the squares (the app-icon look).
  tile: { type: Boolean, default: true },
  spin: { type: Boolean, default: false },
})

const layers = [
  { fill: '#F7C54E', rotate: 0, scale: 1 },
  { fill: '#E85A2A', rotate: 15, scale: 0.84 },
  { fill: '#D6472B', rotate: 30, scale: 0.7 },
  { fill: '#F07AB6', rotate: 45, scale: 0.58 },
  { fill: '#8A6CF2', rotate: 60, scale: 0.47 },
  { fill: '#3A2A9E', rotate: 75, scale: 0.37 },
  { fill: '#FFF4D6', rotate: 90, scale: 0.2 },
]
</script>

<template>
  <svg class="spiral" :class="{ 'spiral--spin': spin }" :width="size" :height="size" viewBox="-100 -100 200 200" aria-hidden="true">
    <rect v-if="tile" x="-100" y="-100" width="200" height="200" rx="40" fill="#354BF4" />
    <g class="spiral__art" transform="rotate(-8)">
      <path
        v-for="layer in layers"
        :key="layer.fill"
        d="M-66,-66H66V66H-66Z"
        :transform="`rotate(${layer.rotate}) scale(${layer.scale})`"
        :fill="layer.fill"
      />
    </g>
  </svg>
</template>

<style scoped>
.spiral {
  flex-shrink: 0;
  overflow: visible;
}
.spiral--spin .spiral__art {
  transform-origin: 0 0;
  animation: spiral-spin 40s linear infinite;
}
@keyframes spiral-spin {
  from {
    transform: rotate(-8deg);
  }
  to {
    transform: rotate(352deg);
  }
}
</style>
