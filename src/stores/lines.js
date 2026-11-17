// The user's lines and saved baskets, kept in this browser so they carry from the
// public pages into the dashboard. Demo-grade persistence (localStorage), no backend.
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const KEY = 'rally.lines.v1'
const DEFAULTS = JSON.stringify({ lineKeys: ['oil', 'pay', 'senators'], baskets: [], fundSymbol: null, excluded: [] })

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
  // The fund the dashboard is about. Empty until the first-visit screen picks one.
  const fundSymbol = ref(saved.fundSymbol ?? null)
  // Companies the user marked "Exclude from basket" on the dashboard.
  const excluded = ref(saved.excluded ?? [])

  watch(
    [lineKeys, baskets, fundSymbol, excluded],
    () => {
      try {
        const json = JSON.stringify({ lineKeys: lineKeys.value, baskets: baskets.value, fundSymbol: fundSymbol.value, excluded: excluded.value })
        // Defaults (fresh, or after "Reset demo") are not worth storing.
        if (json === DEFAULTS) localStorage.removeItem(KEY)
        else localStorage.setItem(KEY, json)
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

  function setFund(symbol) {
    if (symbol !== fundSymbol.value) excluded.value = []
    fundSymbol.value = symbol
  }
  function toggleExcluded(symbol) {
    excluded.value = excluded.value.includes(symbol) ? excluded.value.filter((s) => s !== symbol) : [...excluded.value, symbol]
  }

  // "Reset demo" puts everything back to the defaults.
  function reset() {
    lineKeys.value = ['oil', 'pay', 'senators']
    baskets.value = []
    fundSymbol.value = null
    excluded.value = []
  }

  return { lineKeys, baskets, fundSymbol, excluded, saveBasket, deleteBasket, setFund, toggleExcluded, reset }
})
