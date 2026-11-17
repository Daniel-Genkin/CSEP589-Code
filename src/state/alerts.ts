// The monitoring feed: seeded alerts from the provider, and which of them the user has read.
import { provider } from '@/data'
import type { Alert } from '@/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useDemoStore } from './demo'

export const ALERT_TYPE_LABEL: Record<Alert['type'], string> = {
  new_tag: 'New tag',
  tag_removed: 'Tag removed',
  filing: 'Filing',
  drift: 'Drift',
}

export const useAlertsStore = defineStore('alerts', () => {
  const alerts = ref<Alert[]>([])
  const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
  let loading: Promise<void> | null = null

  const readIds = computed(() => new Set(useDemoStore().readAlertIds))
  const isRead = (id: string) => readIds.value.has(id)
  const unread = computed(() => alerts.value.filter((a) => !readIds.value.has(a.id)))
  const unreadCount = computed(() => unread.value.length)

  /** Newest first: the smallest offset from now. */
  function load(): Promise<void> {
    if (status.value === 'ready') return Promise.resolve()
    loading ??= (async () => {
      status.value = 'loading'
      try {
        alerts.value = [...(await provider.getAlerts())].sort((a, b) => a.offsetMinutes - b.offsetMinutes)
        status.value = 'ready'
      } catch (error) {
        status.value = 'error'
        throw error
      } finally {
        loading = null
      }
    })()
    return loading
  }

  const markRead = (ids: string[]) => useDemoStore().markAlertsRead(ids)
  const markAllRead = () => markRead(alerts.value.map((a) => a.id))

  return { alerts, status, unread, unreadCount, isRead, load, markRead, markAllRead }
})
