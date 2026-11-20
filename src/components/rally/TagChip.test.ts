// @vitest-environment happy-dom
// PRD F2: "clicking any chip shows its reason and a working source link."
import type { ValuesTag } from '@/types'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TagChip from './TagChip.vue'

const tag: ValuesTag = {
  ticker: 'XOM',
  category: 'fossil_fuels',
  strength: 3,
  reason: 'Explores for, produces and refines oil and natural gas.',
  sourceUrl: 'https://finance.yahoo.com/quote/XOM/',
}
const chip = () => mount(TagChip, { props: { tag, label: 'Fossil fuels', color: 'var(--sun)', company: 'ExxonMobil' }, attachTo: document.body })

describe('TagChip', () => {
  it('shows only the category until it is clicked', () => {
    const wrapper = chip()
    expect(wrapper.get('button').text()).toBe('Fossil fuels')
    expect(wrapper.get('button').attributes('aria-expanded')).toBe('false')
    expect(wrapper.get('button').attributes('aria-controls')).toBeUndefined()
    expect(wrapper.find('.tag-chip__panel').exists()).toBe(false)
    wrapper.unmount()
  })

  it('opens the reason, the strength and a source link that leaves the app safely', async () => {
    const wrapper = chip()
    await wrapper.get('button').trigger('click')
    const panel = wrapper.get('.tag-chip__panel')
    expect(wrapper.get('button').attributes('aria-expanded')).toBe('true')
    expect(wrapper.get('button').attributes('aria-controls')).toBe(panel.attributes('id'))
    expect(panel.text()).toContain(tag.reason)
    expect(panel.text()).toContain('Strength 3 of 3')
    expect(panel.text()).toContain('ExxonMobil')
    const link = panel.get('a')
    expect(link.attributes('href')).toBe(tag.sourceUrl)
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toContain('noopener')
    expect(link.text()).toContain('finance.yahoo.com')
    wrapper.unmount()
  })

  it('closes on Escape (focus back on the chip), on a second click and on a click elsewhere', async () => {
    const wrapper = chip()
    const button = wrapper.get('button')
    await button.trigger('click')
    wrapper.get('a').element.focus()
    await wrapper.get('a').trigger('keydown', { key: 'Escape' })
    expect(button.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(button.element)

    await button.trigger('click')
    await button.trigger('click')
    expect(button.attributes('aria-expanded')).toBe('false')

    await button.trigger('click')
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(button.attributes('aria-expanded')).toBe('false')
    wrapper.unmount()
  })

  it('closes when focus leaves the chip and its panel', async () => {
    const wrapper = chip()
    await wrapper.get('button').trigger('click')
    await wrapper.trigger('focusout', { relatedTarget: document.body })
    expect(wrapper.get('button').attributes('aria-expanded')).toBe('false')
    wrapper.unmount()
  })

  it('describes each strength in words', async () => {
    for (const [strength, words] of [[1, 'Minor or indirect'], [2, 'A significant part of the business'], [3, 'A core business']] as const) {
      const wrapper = mount(TagChip, { props: { tag: { ...tag, strength }, label: 'Fossil fuels', color: 'red', company: 'X' } })
      await wrapper.get('button').trigger('click')
      expect(wrapper.get('.tag-chip__panel').text()).toContain(words)
      wrapper.unmount()
    }
  })
})
