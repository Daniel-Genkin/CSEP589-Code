<script setup>
import { useRouter } from 'vue-router'
import { ChevronLeft, X } from '@lucide/vue'

const props = defineProps({
  steps: { type: Number, default: 0 },
  step: { type: Number, default: 0 },
  label: { type: String, default: '' },
  back: { type: [Boolean, String], default: true },
  close: { type: String, default: '' },
  logoTo: { type: String, default: '/' },
})
const router = useRouter()
function goBack() {
  if (typeof props.back === 'string') router.push(props.back)
  else router.back()
}
</script>

<template>
  <header class="bar">
    <div class="left">
      <RouterLink v-if="close" :to="close" class="circle" aria-label="Close"><X :size="20" /></RouterLink>
      <button v-else-if="back" class="circle" aria-label="Back" @click="goBack"><ChevronLeft :size="22" /></button>
      <RouterLink :to="logoTo" class="display logo">Rally</RouterLink>
    </div>
    <div class="progress">
      <div v-if="steps" class="segs">
        <span v-for="i in steps" :key="i" :class="{ on: i <= step }" />
      </div>
      <p class="step">{{ label || (steps ? `Step ${step} of ${steps}` : '') }}</p>
    </div>
    <span class="tag"><span class="dot" style="background: var(--sun); width: 7px; height: 7px" />Demo</span>
  </header>
</template>

<style scoped>
.bar { display: flex; align-items: center; justify-content: space-between; height: 62px; padding: 0 9px 0 12px; border-radius: 999px; background: rgba(38, 36, 46, 0.92); border: 1px solid rgba(255, 255, 255, 0.07); box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35); }
.left { display: flex; align-items: center; gap: 14px; width: 220px; }
.circle { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.08); color: var(--white); }
.logo { font-size: 26px; color: var(--cream); }
.progress { width: 420px; display: flex; flex-direction: column; gap: 7px; }
.segs { display: flex; gap: 4px; }
.segs span { flex: 1; height: 4px; border-radius: 2px; background: var(--line); }
.segs span.on { background: var(--sun); }
.step { font-size: 12px; color: var(--dim); }
.tag { margin-left: 156px; }
</style>
