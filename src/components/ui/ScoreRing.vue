<script setup>
import { band } from '@/utils/scoring'
import { computed, onMounted, ref, watch } from 'vue'

const props = defineProps({
  score: { type: Number, required: true },
  size: { type: Number, default: 56 },
  stroke: { type: Number, default: 0 },
  caption: { type: String, default: '' },
  muted: { type: Boolean, default: false },
})

const strokeWidth = computed(() => props.stroke || Math.max(4, Math.round(props.size / 11)))
const radius = computed(() => (props.size - strokeWidth.value) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const drawn = ref(0)
const dashOffset = computed(() => circumference.value * (1 - drawn.value / 100))
const meta = computed(() => band(props.score))

onMounted(() => requestAnimationFrame(() => (drawn.value = props.score)))
watch(
  () => props.score,
  (value) => (drawn.value = value),
)
</script>

<template>
  <div
    class="ring"
    :class="{ 'ring--muted': muted }"
    :style="{ width: `${size}px`, height: `${size}px`, '--ring-color': meta.color }"
    role="img"
    :aria-label="`Score ${score} out of 100: ${meta.label}`"
  >
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
      <circle class="ring__track" :cx="size / 2" :cy="size / 2" :r="radius" :stroke-width="strokeWidth" />
      <circle
        class="ring__value"
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        :stroke-width="strokeWidth"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
      />
    </svg>
    <div class="ring__center">
      <span class="ring__score num" :style="{ fontSize: `${Math.round(size * 0.34)}px` }">{{ score }}</span>
      <span v-if="caption" class="ring__caption" :style="{ fontSize: `${Math.max(9, Math.round(size * 0.095))}px` }">
        {{ caption }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.ring {
  position: relative;
  flex-shrink: 0;
}
.ring svg {
  display: block;
  transform: rotate(-90deg);
}
.ring__track {
  fill: none;
  stroke: color-mix(in srgb, var(--ring-color) 15%, #efece4);
}
.ring__value {
  fill: none;
  stroke: var(--ring-color);
  stroke-linecap: round;
  transition: stroke-dashoffset 1.1s var(--ease);
}
.ring__center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
.ring__score {
  font-weight: 760;
  letter-spacing: -0.03em;
  color: var(--ink);
}
.ring__caption {
  margin-top: 4px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
}
.ring--muted {
  filter: grayscale(0.6);
  opacity: 0.55;
}
</style>
