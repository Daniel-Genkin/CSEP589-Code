import { provider as shared } from '@/data'
import { SeededProvider } from '@/data/seeded'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ALERT_TYPE_LABEL, useAlertsStore } from './alerts'
import { useDemoStore } from './demo'

beforeEach(() => setActivePinia(createPinia()))

describe('alerts store', () => {
  it('loads the eight seeded alerts, newest first, all unread', async () => {
    const feed = useAlertsStore()
    expect(feed.status).toBe('idle')
    await feed.load()
    expect(feed.status).toBe('ready')
    expect(feed.alerts).toHaveLength(8)
    expect(feed.unreadCount).toBe(8)
    const offsets = feed.alerts.map((a) => a.offsetMinutes)
    expect(offsets).toEqual([...offsets].sort((a, b) => a - b))
  })

  it('counts down as alerts are read, and clears on mark all read', async () => {
    const feed = useAlertsStore()
    await feed.load()
    feed.markRead([feed.alerts[0].id])
    expect(feed.unreadCount).toBe(7)
    expect(feed.isRead(feed.alerts[0].id)).toBe(true)
    feed.markAllRead()
    expect(feed.unreadCount).toBe(0)
    expect(useDemoStore().readAlertIds).toHaveLength(8)
  })

  it('is unread again after Reset demo', async () => {
    const feed = useAlertsStore()
    await feed.load()
    feed.markAllRead()
    useDemoStore().reset()
    expect(feed.unreadCount).toBe(8)
  })

  it('asks the provider once however many screens load it', async () => {
    const getAlerts = vi.spyOn(shared, 'getAlerts')
    const feed = useAlertsStore()
    await Promise.all([feed.load(), feed.load()])
    await feed.load()
    expect(feed.alerts).toHaveLength(8)
    expect(getAlerts).toHaveBeenCalledTimes(1)
    getAlerts.mockRestore()
  })

  it('can be loaded again after a failure', async () => {
    const getAlerts = vi.spyOn(shared, 'getAlerts').mockRejectedValueOnce(new Error('offline'))
    const feed = useAlertsStore()
    await expect(feed.load()).rejects.toThrow('offline')
    expect(feed.status).toBe('error')
    await feed.load()
    expect(feed.status).toBe('ready')
    expect(feed.unreadCount).toBe(8)
    getAlerts.mockRestore()
  })

  it('only references holdings and categories present in the seed, with a label for every type (PRD F8)', async () => {
    const provider = new SeededProvider(0)
    const feed = useAlertsStore()
    await feed.load()
    const categories = new Set((await provider.getCategories()).map((c) => c.id))
    const securities = await provider.getSecurities(feed.alerts.map((a) => a.ticker))
    const known = new Set(securities.map((s) => s.ticker))
    const tags = await provider.getTags(feed.alerts.map((a) => a.ticker))
    for (const alert of feed.alerts) {
      expect(known.has(alert.ticker), alert.ticker).toBe(true)
      expect(categories.has(alert.category), alert.category).toBe(true)
      expect(ALERT_TYPE_LABEL[alert.type]).toBeTruthy()
      // The holding is tagged in the category the alert is about.
      expect(tags.some((t) => t.ticker === alert.ticker && t.category === alert.category), `${alert.ticker} in ${alert.category}`).toBe(true)
    }
  })
})
