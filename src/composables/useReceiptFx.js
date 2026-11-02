// The receipt's little theatrics: fields type themselves out, totals roll up.
import { onBeforeUnmount, ref, toValue, watch } from 'vue'

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Type a value out one character at a time, whenever it changes.
export function useTypewriter(source, { speed = 28, delay = 0 } = {}) {
  const text = ref('')
  const typing = ref(false)
  let wait
  let timer

  const stop = () => {
    clearTimeout(wait)
    clearInterval(timer)
    typing.value = false
  }

  watch(
    () => toValue(source),
    (value) => {
      stop()
      if (!value || prefersReducedMotion()) {
        text.value = value
        return
      }
      text.value = ''
      wait = setTimeout(() => {
        let i = 0
        typing.value = true
        timer = setInterval(() => {
          i += 1
          text.value = value.slice(0, i)
          if (i >= value.length) stop()
        }, speed)
      }, delay)
    },
    { immediate: true },
  )

  onBeforeUnmount(stop)
  return { text, typing }
}

// Roll a number from its last value to the new one.
export function useCountUp(source, { duration = 750, delay = 0 } = {}) {
  const value = ref(0)
  let wait
  let raf

  const stop = () => {
    clearTimeout(wait)
    cancelAnimationFrame(raf)
  }

  watch(
    () => toValue(source),
    (to) => {
      stop()
      if (prefersReducedMotion()) {
        value.value = to
        return
      }
      const from = value.value
      wait = setTimeout(() => {
        const start = performance.now()
        const step = (now) => {
          const t = Math.min(1, (now - start) / duration)
          value.value = from + (to - from) * (1 - Math.pow(1 - t, 3))
          if (t < 1) raf = requestAnimationFrame(step)
        }
        raf = requestAnimationFrame(step)
      }, delay)
    },
    { immediate: true },
  )

  onBeforeUnmount(stop)
  return value
}
