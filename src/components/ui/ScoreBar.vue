<script setup>
import { band } from '@/utils/scoring'
import { computed, onMounted, ref, watch } from 'vue'

const props = defineProps({
  score: { type: Number, required: true },
  height: { type: Number, default: 8 },
  color: { type: String, default: '' },
  previous: { type: Number, default: null },
})

const width = ref(0)
const fill = computed(() => props.color || band(props.score).color)

onMounted(() => requestAnimationFrame(() => (width.value = props.score)))
watch(
  () => props.score,
  (value) => (width.value = value),
)
</script>

<template>
  <div class="bar" :style="{ height: `${height}px` }">
    <div v-if="previous !== null" class="bar__previous" :style="{ width: `${previous}%` }" />
    <div class="bar__fill" :style="{ width: `${width}%`, background: fill }" />
  </div>
</template>

<style scoped>
.bar {
  position: relative;
  width: 100%;
  border-radius: var(--radius-pill);
  background: #efebe2;
  overflow: hidden;
}
.bar__fill,
.bar__previous {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: inherit;
}
.bar__fill {
  transition: width 1s var(--ease);
}
.bar__previous {
  background: repeating-linear-gradient(-45deg, #d9d2c2 0 4px, #e6e0d3 4px 8px);
}
</style>
