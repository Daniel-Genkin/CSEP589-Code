<script setup>
// The spiral: seven squares turning in. Hero art, one per layout.
defineProps({
  size: { type: Number, default: 320 },
  rotate: { type: Number, default: -8 },
})
const layers = [
  { r: 0, s: 1, fill: '#F7C54E' },
  { r: 15, s: 0.84, fill: '#E85A2A' },
  { r: 30, s: 0.7, fill: '#D6472B' },
  { r: 45, s: 0.58, fill: '#F07AB6' },
  { r: 60, s: 0.47, fill: '#8A6CF2' },
  { r: 75, s: 0.37, fill: '#3A2A9E' },
  { r: 90, s: 0.2, fill: '#FFF4D6' },
]
</script>

<template>
  <svg :width="size" :height="size" viewBox="-100 -100 200 200" aria-hidden="true" :style="{ transform: `rotate(${rotate}deg)` }">
    <path v-for="l in layers" :key="l.r" d="M-66,-66H66V66H-66Z" :transform="`rotate(${l.r}) scale(${l.s})`" :fill="l.fill" />
  </svg>
</template>
