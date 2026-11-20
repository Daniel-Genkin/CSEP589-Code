// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import GrowthChart from './GrowthChart.vue'

// Two years of month-ends.
const dates = Array.from({ length: 25 }, (_, i) => new Date(Date.UTC(2024, i, 28)).toISOString().slice(0, 10))
const line = (rate: number) => dates.map((_, i) => 10_000 * (1 + rate) ** i)
const series = [
  { key: 'original', label: 'As it is', color: '#e85a2a', values: line(0.01) },
  { key: 'filtered', label: 'With your exclusions', color: '#b98a1e', values: line(0.008) },
  { key: 'benchmark', label: 'S&P 500', color: '#5a6bf6', values: line(0.006) },
]
const chart = () => mount(GrowthChart, { props: { dates, series, summary: 'Growth of $10,000 over two years.' }, slots: { default: '<p class="note">Disclosure</p>' } })

describe('GrowthChart', () => {
  it('draws one 2px line per series on a single axis, with a legend and end labels in text colours', () => {
    const wrapper = chart()
    const lines = wrapper.findAll('path.chart__line')
    expect(lines).toHaveLength(3)
    expect(lines.map((l) => l.attributes('stroke'))).toEqual(['#e85a2a', '#b98a1e', '#5a6bf6'])
    expect(lines.every((l) => l.attributes('d')!.startsWith('M'))).toBe(true)
    expect(wrapper.findAll('.chart__legend li').map((li) => li.text())).toEqual(['As it is', 'With your exclusions', 'S&P 500'])
    const ends = wrapper.findAll('.chart__end').map((g) => g.text())
    expect(ends).toHaveLength(3)
    expect(ends.some((text) => text.includes('S&P 500') && text.includes('$11,544'))).toBe(true)
    // labels never carry the series colour
    expect(wrapper.findAll('.chart__end text').every((t) => !t.attributes('fill'))).toBe(true)
  })

  it('describes itself and offers the same numbers as a table', () => {
    const wrapper = chart()
    expect(wrapper.get('svg').attributes('aria-label')).toBe('Growth of $10,000 over two years.')
    expect(wrapper.get('.note').text()).toBe('Disclosure')
    const rows = wrapper.findAll('.chart__table tbody tr')
    // the start, the last point of each year that ends inside the window, and the end
    expect(rows.map((r) => r.get('th').text())).toEqual(['Jan 28, 2024', 'Dec 28, 2024', 'Dec 28, 2025', 'Jan 28, 2026'])
    expect(rows[0].findAll('td').map((td) => td.text())).toEqual(['$10,000', '$10,000', '$10,000'])
    expect(wrapper.findAll('.chart__table thead th').map((th) => th.text())).toEqual(['Date', 'As it is', 'With your exclusions', 'S&P 500'])
  })

  it('uses round axis ticks that cover the data, compact from $10,000 up', () => {
    const wrapper = chart()
    const ticks = wrapper.findAll('.chart__ticks text[text-anchor="end"]').map((t) => t.text())
    expect(ticks[0]).toBe('$10K')
    expect(ticks.at(-1)).toBe('$13K')
    expect(wrapper.findAll('.chart__ticks text[text-anchor="middle"]').map((t) => t.text())).toEqual(['2025', '2026'])
  })

  it('reads every series at a date through a slider, values first', async () => {
    const wrapper = chart()
    const slider = wrapper.get('input[type="range"]')
    expect(wrapper.find('.chart__tip').exists()).toBe(false)
    expect(slider.attributes('max')).toBe('24')

    await slider.trigger('focus')
    const tip = wrapper.get('.chart__tip')
    expect(tip.get('.label-mono').text()).toBe('Jan 28, 2026')
    expect(tip.findAll('.chart__tip-row').map((r) => r.text())).toEqual(['$12,697As it is', '$12,107With your exclusions', '$11,544S&P 500'])
    expect(slider.attributes('aria-valuetext')).toBe('Jan 28, 2026: As it is $12,697, With your exclusions $12,107, S&P 500 $11,544')

    await slider.setValue('0')
    expect(wrapper.get('.chart__tip .label-mono').text()).toBe('Jan 28, 2024')
    expect(slider.attributes('aria-valuetext')).toContain('Jan 28, 2024: As it is $10,000')

    // The pointer leaving the plot does not take the readout away from someone using the slider.
    await wrapper.get('svg').trigger('pointerleave')
    expect(wrapper.find('.chart__tip').exists()).toBe(true)
    await slider.trigger('blur')
    expect(wrapper.find('.chart__tip').exists()).toBe(false)
  })

  it('labels a narrow axis in full so no two ticks read the same', () => {
    const flat = [{ key: 'a', label: 'A', color: '#e85a2a', values: dates.map((_, i) => 10_000 + i * 40) }]
    const ticks = mount(GrowthChart, { props: { dates, series: flat, summary: 'Flat' } })
      .findAll('.chart__ticks text[text-anchor="end"]')
      .map((t) => t.text())
    expect(new Set(ticks).size).toBe(ticks.length)
    expect(ticks).toContain('$10,250')
  })

  it('draws nothing broken for an empty series list or no dates', () => {
    expect(mount(GrowthChart, { props: { dates, series: [], summary: 'Empty' } }).findAll('path.chart__line')).toHaveLength(0)
    const noDates = mount(GrowthChart, { props: { dates: [], series: [{ key: 'a', label: 'A', color: 'red', values: [] }], summary: 'Empty' } })
    expect(noDates.find('svg').exists()).toBe(false)
    expect(noDates.findAll('.chart__table tbody tr')).toHaveLength(0)
  })
})
