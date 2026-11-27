import { computed, ref } from 'vue'

// One shared, rAF-throttled scroll listener for every scroll-linked effect on the page.
export const scrollY = ref(0)
export const vh = ref(800)
export const docH = ref(1)
export const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

let started = false
let ticking = false
function update() {
  scrollY.value = window.scrollY
  vh.value = window.innerHeight
  docH.value = document.documentElement.scrollHeight
  ticking = false
}
export function startScroll() {
  if (started) return
  started = true
  update()
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true
      requestAnimationFrame(update)
    }
  }, { passive: true })
  window.addEventListener('resize', update)
}

export const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n))

// 0 when the element's top reaches the bottom of the screen, 1 when its bottom leaves the top.
export function useInView(elRef) {
  return computed(() => {
    scrollY.value
    vh.value
    const el = elRef.value?.$el || elRef.value
    if (!el || reduced) return 1
    const r = el.getBoundingClientRect()
    return clamp((vh.value - r.top) / (vh.value + r.height))
  })
}

// For tall sticky sections: 0 when the section's top hits the top of the screen, 1 when its end arrives.
export function usePinned(elRef) {
  return computed(() => {
    scrollY.value
    vh.value
    const el = elRef.value
    if (!el) return 0
    const r = el.getBoundingClientRect()
    return clamp(-r.top / Math.max(1, r.height - vh.value))
  })
}

export const pageProgress = computed(() => clamp(scrollY.value / Math.max(1, docH.value - vh.value)))
