import type { Portfolio } from '@/types'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { STORAGE_KEY, initialState, loadState, useDemoStore } from './demo'

class MemoryStorage {
  private items = new Map<string, string>()
  getItem = (key: string) => this.items.get(key) ?? null
  setItem = (key: string, value: string) => void this.items.set(key, value)
  removeItem = (key: string) => void this.items.delete(key)
  get size() {
    return this.items.size
  }
}

const portfolio = (id: string, origin: Portfolio['origin'] = 'tickers'): Portfolio => ({
  id,
  name: id,
  totalUsd: 10_000,
  origin,
  holdings: [{ ticker: 'AAPL', weight: 1, valueUsd: 10_000, shares: 40 }],
})

let storage: MemoryStorage

beforeEach(() => {
  storage = new MemoryStorage()
  vi.stubGlobal('localStorage', storage)
  setActivePinia(createPinia())
})

describe('demo store', () => {
  it('starts on the free plan with no portfolio', () => {
    const demo = useDemoStore()
    expect(demo.plan).toBe('free')
    expect(demo.portfolio).toBeNull()
    expect(demo.selectedCategories).toBeNull()
    expect(demo.exclusions).toEqual({ categories: [], tickers: [], swaps: {} })
  })

  it('persists plan, categories, portfolio and exclusions, and a new store reads them back', async () => {
    const demo = useDemoStore()
    demo.upgrade()
    demo.createAccount(' alex@example.com ')
    demo.setCategories(['defense', 'tobacco'])
    demo.setPortfolio(portfolio('SPY', 'fund'))
    demo.toggleExcludedCategory('tobacco')
    demo.toggleExcludedTicker('XOM')
    demo.swap('XOM', 'NEE')
    await nextTick()

    setActivePinia(createPinia())
    const reloaded = useDemoStore()
    expect(reloaded.plan).toBe('paid')
    expect(reloaded.account).toEqual({ email: 'alex@example.com' })
    expect(reloaded.selectedCategories).toEqual(['defense', 'tobacco'])
    expect(reloaded.portfolio?.id).toBe('SPY')
    expect(reloaded.exclusions).toEqual({ categories: ['tobacco'], tickers: ['XOM'], swaps: { XOM: 'NEE' } })
  })

  it('drops an excluded category when it is deselected', () => {
    const demo = useDemoStore()
    demo.setCategories(['defense', 'tobacco'])
    demo.setExcludedCategories(['defense', 'tobacco'])
    demo.toggleCategory('tobacco')
    expect(demo.selectedCategories).toEqual(['defense'])
    expect(demo.exclusions.categories).toEqual(['defense'])
  })

  it('toggles from the defaults the first time, so one switch changes one category', () => {
    const demo = useDemoStore()
    demo.toggleCategory('tobacco', ['defense', 'tobacco', 'alcohol'])
    expect(demo.selectedCategories).toEqual(['defense', 'alcohol'])
    demo.toggleCategory('tobacco', ['defense', 'tobacco', 'alcohol'])
    expect(demo.selectedCategories).toEqual(['defense', 'alcohol', 'tobacco'])
  })

  it('removes the swap when its ticker is no longer excluded', () => {
    const demo = useDemoStore()
    demo.toggleExcludedTicker('XOM')
    demo.swap('XOM', 'NEE')
    demo.toggleExcludedTicker('XOM')
    expect(demo.exclusions).toEqual({ categories: [], tickers: [], swaps: {} })
  })

  it('clears ticker exclusions and swaps for a new portfolio but keeps category exclusions', () => {
    const demo = useDemoStore()
    demo.setCategories(['defense'])
    demo.setPortfolio(portfolio('A'))
    demo.toggleExcludedCategory('defense')
    demo.toggleExcludedTicker('XOM')
    demo.setPortfolio(portfolio('B'))
    expect(demo.exclusions).toEqual({ categories: ['defense'], tickers: [], swaps: {} })
  })

  it('restores the previous portfolio on disconnect and keeps exclusions across the connection', () => {
    const demo = useDemoStore()
    demo.setPortfolio(portfolio('SPY', 'fund'))
    demo.toggleExcludedTicker('XOM')
    demo.connect({ ...portfolio('connected', 'connected'), brokerId: 'alpaca' })
    expect(demo.isConnected).toBe(true)
    expect(demo.exclusions.tickers).toEqual(['XOM'])
    // Switching broker must not overwrite what Disconnect goes back to.
    demo.connect({ ...portfolio('connected', 'connected'), brokerId: 'robinhood' })
    demo.disconnect()
    expect(demo.portfolio?.id).toBe('SPY')
    expect(demo.isConnected).toBe(false)
    expect(demo.previousPortfolio).toBeNull()
  })

  it('reset returns to the free plan with no portfolio and leaves nothing in storage', async () => {
    const demo = useDemoStore()
    expect(demo.resets).toBe(0)
    demo.upgrade()
    demo.setCategories(['defense'])
    demo.setPortfolio(portfolio('SPY', 'fund'))
    demo.markAlertsRead(['a1'])
    await nextTick()
    expect(storage.getItem(STORAGE_KEY)).not.toBeNull()

    storage.setItem('rally.lines.v1', '{}')
    demo.reset()
    await nextTick()
    expect(demo.plan).toBe('free')
    expect(demo.portfolio).toBeNull()
    expect(demo.selectedCategories).toBeNull()
    expect(demo.readAlertIds).toEqual([])
    expect(storage.size).toBe(0)
  })
})

describe('loadState', () => {
  it('returns the initial state for missing or broken JSON', () => {
    expect(loadState(undefined)).toEqual(initialState())
    expect(loadState({ getItem: () => '{not json' })).toEqual(initialState())
    expect(loadState({ getItem: () => '"a string"' })).toEqual(initialState())
  })

  it('repairs fields of the wrong shape instead of failing', () => {
    const state = loadState({
      getItem: () => JSON.stringify({ plan: 'gold', selectedCategories: 'defense', portfolio: { id: 'x' }, exclusions: { categories: ['defense'], swaps: [] } }),
    })
    expect(state.plan).toBe('free')
    expect(state.selectedCategories).toBeNull()
    expect(state.portfolio).toBeNull()
    expect(state.exclusions).toEqual({ categories: ['defense'], tickers: [], swaps: {} })
  })

  it('drops a saved portfolio with damaged holdings, and swaps that are not tickers', () => {
    const good = { id: 'SPY', name: 'SPY', totalUsd: 10_000, origin: 'fund', holdings: [{ ticker: 'AAPL', weight: 1, valueUsd: 10_000, shares: 40 }] }
    const read = (state: object) => loadState({ getItem: () => JSON.stringify(state) })
    expect(read({ portfolio: good }).portfolio?.id).toBe('SPY')
    expect(read({ portfolio: { ...good, holdings: [null] } }).portfolio).toBeNull()
    expect(read({ portfolio: { ...good, origin: 'whatever' } }).portfolio).toBeNull()
    expect(read({ portfolio: null, previousPortfolio: good }).previousPortfolio).toBeNull()
    expect(read({ exclusions: { swaps: { XOM: 5, CVX: 'NEE' } } }).exclusions.swaps).toEqual({ CVX: 'NEE' })
  })

  it('goes back to the earlier portfolio when a saved connected portfolio names no known broker', () => {
    const before = { id: 'SPY', name: 'SPY', totalUsd: 10_000, origin: 'fund', holdings: [{ ticker: 'AAPL', weight: 1, valueUsd: 10_000, shares: 40 }] }
    const account = { ...before, id: 'connected', origin: 'connected' }
    const read = (state: object) => loadState({ getItem: () => JSON.stringify(state) })

    const known = read({ portfolio: { ...account, brokerId: 'alpaca' }, previousPortfolio: before })
    expect(known.portfolio?.brokerId).toBe('alpaca')
    expect(known.previousPortfolio?.id).toBe('SPY')

    for (const brokerId of [undefined, 'etrade']) {
      const unknown = read({ portfolio: { ...account, brokerId }, previousPortfolio: before })
      expect(unknown.portfolio?.id).toBe('SPY')
      expect(unknown.previousPortfolio).toBeNull()
    }
    expect(read({ portfolio: { ...account } }).portfolio).toBeNull()
  })
})
