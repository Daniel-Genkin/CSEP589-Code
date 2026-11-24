import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCatalogStore } from './catalog'
import { useDemoStore } from './demo'

const FEATURED = ['defense', 'fossil_fuels', 'private_prisons', 'tobacco', 'alcohol', 'gambling', 'animal_testing']

beforeEach(() => {
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {}, removeItem: () => {} })
  setActivePinia(createPinia())
})

describe('catalog store', () => {
  it('loads the categories once, featured first', async () => {
    const catalog = useCatalogStore()
    expect(catalog.status).toBe('idle')
    await Promise.all([catalog.load(), catalog.load()])
    expect(catalog.status).toBe('ready')
    expect(catalog.featuredIds).toEqual(FEATURED)
    expect(catalog.others.length).toBeGreaterThanOrEqual(8)
    expect(catalog.label('fossil_fuels')).toBe('Fossil fuels')
    expect(catalog.label('unknown')).toBe('unknown')
  })

  it('selects the featured seven until the user chooses', async () => {
    const catalog = useCatalogStore()
    await catalog.load()
    expect(catalog.selectedIds).toEqual(FEATURED)
    expect(useDemoStore().selectedCategories).toBeNull()
  })

  it('switches one category off from the defaults, then follows the user’s choice in catalog order', async () => {
    const catalog = useCatalogStore()
    await catalog.load()
    catalog.toggle('tobacco')
    expect(catalog.selectedIds).toEqual(FEATURED.filter((id) => id !== 'tobacco'))
    catalog.toggle('sector:energy')
    catalog.toggle('tobacco')
    expect(catalog.selectedIds).toEqual([...FEATURED, 'sector:energy'])
    expect(catalog.selected.map((c) => c.label)).toContain('Energy')
  })

  it('ignores a saved category that is no longer in the data', async () => {
    const catalog = useCatalogStore()
    await catalog.load()
    useDemoStore().setCategories(['defense', 'retired_category'])
    expect(catalog.selectedIds).toEqual(['defense'])
  })

  it('migrates a fully stale saved selection to the featured live lines', async () => {
    const catalog = useCatalogStore()
    const demo = useDemoStore()
    demo.setCategories(['retired_category'])
    await catalog.load()
    expect(catalog.selectedIds).toEqual(FEATURED)
    expect(demo.selectedCategories).toEqual(FEATURED)
  })
})
