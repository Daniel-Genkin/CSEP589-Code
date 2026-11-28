<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

// Counts a stat up from zero the first time it scrolls into view.
const props = defineProps({ value: String })
const el = ref(null)
const num = parseFloat(props.value.replace(/[^\d.]/g, ''))
const prefix = props.value.match(/^[^\d]*/)[0]
const suffix = props.value.match(/[^\d.]*$/)[0]
const text = ref(isNaN(num) ? props.value : prefix + '0' + suffix)
let io, raf
onMounted(() => {
  if (isNaN(num) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    text.value = props.value
    return
  }
  io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return
    io.disconnect()
    const t0 = performance.now()
    const step = (t) => {
      const p = Math.min((t - t0) / 1100, 1)
      text.value = prefix + Math.round(num * (1 - Math.pow(1 - p, 3))) + suffix
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
  }, { threshold: 0.6 })
  io.observe(el.value)
})
onBeforeUnmount(() => {
  io?.disconnect()
  cancelAnimationFrame(raf)
})
</script>

<template>
  <p ref="el" class="display">{{ text }}</p>
</template>
