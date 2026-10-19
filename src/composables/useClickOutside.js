import { onBeforeUnmount, onMounted } from 'vue'

export function useClickOutside(targets, handler) {
  const listener = (event) => {
    const elements = (Array.isArray(targets) ? targets : [targets]).map((t) => t.value).filter(Boolean)
    if (elements.some((el) => el.contains(event.target))) return
    handler(event)
  }
  onMounted(() => document.addEventListener('pointerdown', listener))
  onBeforeUnmount(() => document.removeEventListener('pointerdown', listener))
}
