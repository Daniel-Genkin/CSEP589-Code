import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import { lineCategories, sampleLineTags } from '@/data/lines'
import { exposureByCategory, totalFlagged } from '@/domain/exposure'
import type { CompanyRow } from '@/domain/portfolio'
import { useCatalogStore } from '@/state/catalog'
import type { Portfolio } from '@/types'
import { bigPct, money, share, useLinesResult, whole } from './useLinesResult'
import type { PortfolioData } from './usePortfolioData'

beforeEach(() => {
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {}, removeItem: () => {} })
  setActivePinia(createPinia())
  useCatalogStore().categories = lineCategories()
})

const row = (ticker: string, weight: number): CompanyRow => ({ ticker, weight, valueUsd: weight * 1000, slices: [{ via: 'VOO', weight }] })

function fakeData(rows: CompanyRow[], selected: string[]): PortfolioData {
  const portfolio = { id: 'VOO', name: 'Vanguard S&P 500 ETF', origin: 'fund', totalUsd: 1000, holdings: [] } as unknown as Portfolio
  const tags = sampleLineTags(rows.map((r) => r.ticker))
  const names: Record<string, string> = { XOM: 'ExxonMobil', MSFT: 'Microsoft', AAPL: 'Apple' }
  return {
    status: ref('ready'),
    portfolio: computed(() => portfolio),
    rows: computed(() => rows),
    tags: computed(() => tags),
    selectedIds: computed(() => selected),
    exposures: computed(() => exposureByCategory(rows, tags, selected)),
    flagged: computed(() => totalFlagged(rows, tags, selected)),
    nameOf: (t: string) => names[t] ?? t,
  } as unknown as PortfolioData
}

describe('useLinesResult', () => {
  const rows = [row('OTHER', 0.87), row('AAPL', 0.06), row('MSFT', 0.04), row('XOM', 0.03)]

  it('adds up what crosses the selected lines, biggest line first', () => {
    const r = useLinesResult(fakeData(rows, ['environment', 'privacy']))
    expect(r.fund.value).toBe('VOO')
    expect(r.flagged.value.share).toBeCloseTo(0.07)
    expect(r.lines.value.map((l) => l.label)).toEqual(['Data privacy', 'Environment & climate'])
    expect(r.companies.value.map((c) => [c.ticker, c.lines])).toEqual([
      ['MSFT', ['privacy']],
      ['XOM', ['environment']],
    ])
  })

  it('draws one dot per $1 of every $100, coloured by line', () => {
    const r = useLinesResult(fakeData(rows, ['environment', 'privacy']))
    expect(r.dots.value).toEqual([
      { n: 4, color: 'var(--bubblegum)' },
      { n: 3, color: 'var(--sun)' },
    ])
  })

  it('prints the three biggest lines on the receipt, then the rest together', () => {
    const r = useLinesResult(fakeData(rows, ['environment', 'privacy', 'taxes']))
    // AAPL and MSFT cross Corporate taxes too: 6% + 4%.
    expect(r.receiptRows.value.map((x) => [x.label, x.amount])).toEqual([
      ['Corporate taxes', '$100.00'],
      ['Data privacy', '$40.00'],
      ['Environment & climate', '$30.00'],
    ])
    const four = useLinesResult(fakeData([...rows, row('LMT', 0.01)], ['environment', 'privacy', 'taxes', 'military']))
    expect(four.receiptRows.value.at(-1)).toMatchObject({ label: '1 more line', sub: 'Military & defense', amount: '$10.00' })
  })

  it('counts shares against your whole amount, and says how much of the fund the list covers', () => {
    // A fund whose holdings list covers only half of it: MSFT is 4% of the fund, not 8%.
    const half = [row('OTHER', 0.43), row('MSFT', 0.04), row('XOM', 0.03)]
    const r = useLinesResult(fakeData(half, ['environment', 'privacy']))
    expect(r.coverage.value).toBeCloseTo(0.5)
    expect(r.flagged.value.share).toBeCloseTo(0.07)
    expect(r.flagged.value.usd).toBeCloseTo(70)
    expect(r.lines.value.map((l) => l.share)).toEqual([expect.closeTo(0.04), expect.closeTo(0.03)])
    expect(r.dots.value.reduce((s, d) => s + d.n, 0)).toBe(7)
  })

  it('finds nothing when no line is selected', () => {
    const r = useLinesResult(fakeData(rows, []))
    expect(r.flagged.value.count).toBe(0)
    expect(r.dots.value).toEqual([])
    expect(r.receiptRows.value).toEqual([])
  })
})

describe('number formats', () => {
  it('writes money, whole dollars, shares and the headline percent', () => {
    expect(money(1234.5)).toBe('$1,234.50')
    expect(whole(1234.5)).toBe('$1,235')
    expect(share(0.1234)).toBe('12.3%')
    expect(bigPct(0.13)).toBe('13%')
    expect(bigPct(0.001)).toBe('<1%')
    expect(bigPct(0)).toBe('0%')
  })
})
