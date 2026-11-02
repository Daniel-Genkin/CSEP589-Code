// The user's lines and saved baskets, kept in this browser so they carry from the
// public pages into the dashboard. Demo-grade persistence (localStorage), no backend.
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const KEY = 'rallie.lines.v1'

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {}
  } catch {
    return {}
  }
}

export const useLinesStore = defineStore('lines', () => {
  const saved = load()
  const lineKeys = ref(saved.lineKeys ?? ['oil', 'pay', 'senators'])
  // A basket is a fund minus the companies the user chose to drop.
  const baskets = ref(saved.baskets ?? [])

  watch(
    [lineKeys, baskets],
    () => {
      try {
        localStorage.setItem(KEY, JSON.stringify({ lineKeys: lineKeys.value, baskets: baskets.value }))
      } catch {
        // Storage blocked: changes last for this visit only.
      }
    },
    { deep: true },
  )

  function saveBasket({ name, from, removed }) {
    baskets.value = [{ id: `bsk_${Date.now()}`, name, from, removed, createdAt: new Date().toISOString() }, ...baskets.value]
  }
  function deleteBasket(id) {
    baskets.value = baskets.value.filter((b) => b.id !== id)
  }

  return { lineKeys, baskets, saveBasket, deleteBasket }
})
