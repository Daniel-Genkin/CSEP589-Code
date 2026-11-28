import { ref, watch } from 'vue'

// Eases a displayed number toward its source value whenever the source changes.
export function useTween(source, ms = 550) {
  const out = ref(source.value)
  let raf
  watch(source, (to) => {
    cancelAnimationFrame(raf)
    const from = out.value
    const t0 = performance.now()
    const step = (t) => {
      const p = Math.min((t - t0) / ms, 1)
      out.value = from + (to - from) * (1 - Math.pow(1 - p, 3))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
  })
  return out
}

export const fmtPct = (n) => (Math.abs(n - Math.round(n)) < 0.05 ? Math.round(n) : n.toFixed(1)) + '%'
