// @vitest-environment happy-dom
// PRD F9: a switch for every category in the seed, the seven values categories first, select
// all and select none, persisted; and the choice reaches the other screens without a reload.
import { usePortfolioData } from '@/composables/usePortfolioData'
import { provider } from '@/data'
import { useCatalogStore } from '@/state/catalog'
import { STORAGE_KEY, useDemoStore } from '@/state/demo'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import SettingsView from './SettingsView.vue'

const FEATURED = ['Defense and weapons', 'Fossil fuels', 'Private prisons', 'Tobacco', 'Alcohol', 'Gambling', 'Animal testing']

async function open() {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:all(.*)*', component: SettingsView }] })
  await router.push('/settings')
  const wrapper = mount(SettingsView, { global: { plugins: [router] } })
  await vi.waitFor(() => expect(wrapper.findAll('[role="switch"]').length).toBeGreaterThan(7))
  return wrapper
}
const saved = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
const labels = (wrapper: Awaited<ReturnType<typeof open>>) => wrapper.findAll('.toggle__label').map((l) => l.text())
const on = (wrapper: Awaited<ReturnType<typeof open>>) => wrapper.findAll<HTMLInputElement>('[role="switch"]').filter((s) => s.element.checked).length

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
})

describe('SettingsView', () => {
  it('has a switch for every category in the seed, the seven values categories first and on', async () => {
    const wrapper = await open()
    const categories = await provider.getCategories()
    expect(labels(wrapper)).toHaveLength(categories.length)
    expect(labels(wrapper).slice(0, 7)).toEqual(FEATURED)
    expect(new Set(labels(wrapper))).toEqual(new Set(categories.map((c) => c.label)))
    expect(on(wrapper)).toBe(7)
    expect(wrapper.get('.eyebrow').text()).toContain(`7 of ${categories.length} selected`)
  })

  it('persists a single switch, select none and select all', async () => {
    const wrapper = await open()
    const total = labels(wrapper).length

    await wrapper.findAll('[role="switch"]')[1].setValue(false) // Fossil fuels
    await nextTick()
    expect(saved().selectedCategories).toEqual(['defense', 'private_prisons', 'tobacco', 'alcohol', 'gambling', 'animal_testing'])

    await wrapper.findAll('button').find((b) => b.text() === 'Select none')!.trigger('click')
    await nextTick()
    expect(on(wrapper)).toBe(0)
    expect(saved().selectedCategories).toEqual([])

    await wrapper.findAll('button').find((b) => b.text() === 'Select all')!.trigger('click')
    await nextTick()
    expect(on(wrapper)).toBe(total)
    expect(saved().selectedCategories).toHaveLength(total)

    // A new visit reads the saved choice.
    setActivePinia(createPinia())
    expect(useDemoStore().selectedCategories).toHaveLength(total)
  })

  it('changes exposure for the active portfolio as soon as a switch changes, with no reload', async () => {
    const wrapper = await open()
    const demo = useDemoStore()
    demo.setPortfolio(await provider.getSamplePortfolio('sample'))

    // What /portfolio and /whatif read.
    let data!: ReturnType<typeof usePortfolioData>
    mount(defineComponent({ setup: () => ((data = usePortfolioData()), () => h('div')) }))
    await vi.waitFor(() => expect(data.status.value).toBe('ready'))
    await flushPromises()

    const before = data.flagged.value.usd
    expect(data.largest.value?.category).toBe('fossil_fuels')
    expect(data.exposures.value).toHaveLength(7)

    await wrapper.findAll('[role="switch"]')[1].setValue(false) // Fossil fuels off
    await nextTick()
    expect(data.exposures.value).toHaveLength(6)
    expect(data.exposures.value.some((e) => e.category === 'fossil_fuels')).toBe(false)
    expect(data.flagged.value.usd).toBeLessThan(before)

    // A sector works exactly like a values category.
    const energy = wrapper.findAll('.toggle').find((t) => t.find('.toggle__label').text() === 'Energy')!
    await energy.get('[role="switch"]').setValue(true)
    await nextTick()
    expect(useCatalogStore().selectedIds).toContain('sector:energy')
    expect(data.exposures.value.find((e) => e.category === 'sector:energy')!.usd).toBeGreaterThan(0)
  })
})
