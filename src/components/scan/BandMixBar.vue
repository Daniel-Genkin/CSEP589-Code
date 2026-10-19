<script setup>
import { formatPercent } from '@/utils/format'
import { BAND_ORDER, BANDS } from '@/utils/scoring'
import { onMounted, ref } from 'vue'

const props = defineProps({
  mix: { type: Object, required: true },
  legend: { type: Boolean, default: true },
  height: { type: Number, default: 12 },
})

const activeBands = BAND_ORDER.filter((k) => props.mix[k] > 0)
const shown = ref(Object.fromEntries(BAND_ORDER.map((k) => [k, 0])))
onMounted(() => requestAnimationFrame(() => (shown.value = { ...props.mix })))
</script>

<template>
  <div class="mix">
    <div class="mix__bar" :style="{ height: `${height}px` }" role="img" :aria-label="BAND_ORDER.map((k) => `${BANDS[k].label} ${mix[k]}%`).join(', ')">
      <span
        v-for="key in activeBands"
        :key="key"
        class="mix__segment"
        :style="{ width: `${shown[key]}%`, background: BANDS[key].color }"
      />
    </div>
    <ul v-if="legend" class="mix__legend">
      <li v-for="key in BAND_ORDER" :key="key">
        <span class="mix__dot" :style="{ background: BANDS[key].color }" />
        {{ BANDS[key].label }}
        <strong class="num">{{ formatPercent(mix[key]) }}</strong>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.mix__bar {
  display: flex;
  gap: 3px;
  width: 100%;
  overflow: hidden;
  border-radius: var(--radius-pill);
  background: #efebe2;
}
.mix__segment {
  height: 100%;
  border-radius: 3px;
  transition: width 1s var(--ease);
}
.mix__segment:first-child {
  border-radius: var(--radius-pill) 3px 3px var(--radius-pill);
}
.mix__segment:last-child {
  border-radius: 3px var(--radius-pill) var(--radius-pill) 3px;
}
.mix__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  margin-top: 12px;
  font-size: 13px;
  color: var(--muted);
}
.mix__legend li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.mix__legend strong {
  color: var(--ink);
  font-weight: 700;
}
.mix__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
</style>
