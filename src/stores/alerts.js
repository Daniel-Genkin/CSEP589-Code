import { alertsService } from '@/api'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useAlertsStore = defineStore('alerts', () => {
  const items = ref([])
  const loaded = ref(false)
  const loading = ref(false)

  const unreadCount = computed(() => items.value.filter((a) => !a.readAt).length)

  let inFlight = null

  // One request at a time: the layout and the Receipts page both ask on mount.
  function fetch() {
    inFlight ??= (async () => {
      loading.value = true
      try {
        items.value = await alertsService.list()
        loaded.value = true
      } finally {
        loading.value = false
        inFlight = null
      }
    })()
    return inFlight
  }

  function ensureLoaded() {
    return loaded.value ? Promise.resolve() : fetch()
  }

  async function markRead(alertId) {
    if (items.value.find((a) => a.id === alertId)?.readAt) return
    const updated = await alertsService.markRead(alertId)
    // Re-find: the list may have loaded while the request was in flight.
    const alert = items.value.find((a) => a.id === alertId)
    if (alert) alert.readAt = updated.readAt
  }

  async function markAllRead() {
    await alertsService.markAllRead()
    const now = new Date().toISOString()
    for (const alert of items.value) alert.readAt ??= now
  }

  function reset() {
    items.value = []
    loaded.value = false
  }

  return { items, loaded, loading, unreadCount, fetch, ensureLoaded, markRead, markAllRead, reset }
})
