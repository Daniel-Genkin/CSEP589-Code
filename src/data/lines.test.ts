import { describe, expect, it } from 'vitest'
import { LINE_IDS, LINES, SAMPLE_ALERTS, SOURCES, lineCategories, sampleLineTags, sourceName } from './lines'

describe('lines', () => {
  it('lists the nine survey lines, five picked by default, each with a one-line description', () => {
    expect(LINES.map((l) => l.label)).toEqual([
      'Military & defense',
      'Environment & climate',
      'Human rights & conflict',
      'Labor practices',
      'Data privacy',
      'Political donations',
      'Diversity & inclusion',
      'Corporate taxes',
      'Animal welfare',
    ])
    expect(new Set(LINE_IDS).size).toBe(9)
    expect(LINES.filter((l) => l.featured)).toHaveLength(5)
    for (const l of LINES) expect(l.description.length).toBeGreaterThan(10)
  })

  it('gives the catalog the same lines, descriptions included', () => {
    const categories = lineCategories()
    expect(categories.map((c) => c.id)).toEqual(LINE_IDS)
    expect(categories.every((c) => c.description)).toBe(true)
  })

  it('tags only the tickers asked for, every tag on a known line with a known source', () => {
    const tags = sampleLineTags(['xom', 'MSFT', 'XOM', 'NOPE'])
    expect([...new Set(tags.map((t) => t.ticker))].sort()).toEqual(['MSFT', 'XOM'])
    const sources = new Set<string>(Object.values(SOURCES).map((s) => s.url))
    for (const t of sampleLineTags(['LMT', 'PLTR', 'AMZN', 'TSN', 'META', 'TSLA', 'AAPL', 'LLY', 'T'])) {
      expect(LINE_IDS).toContain(t.category)
      expect(sources.has(t.sourceUrl)).toBe(true)
      expect([1, 2, 3]).toContain(t.strength)
    }
  })

  it('covers every line with at least one company', () => {
    const all = sampleLineTags(['LMT', 'XOM', 'PLTR', 'AMZN', 'META', 'T', 'TSLA', 'AAPL', 'TSN'])
    expect(new Set(all.map((t) => t.category))).toEqual(new Set(LINE_IDS))
  })

  it('names a source by its URL', () => {
    expect(sourceName(SOURCES.fec.url)).toBe('FEC')
    expect(sourceName('https://example.com')).toBe('Source')
  })

  it('has sample alerts on known lines, newest first', () => {
    expect(SAMPLE_ALERTS.every((a) => LINE_IDS.includes(a.category))).toBe(true)
    const offsets = SAMPLE_ALERTS.map((a) => a.offsetMinutes)
    expect(offsets).toEqual([...offsets].sort((a, b) => a - b))
  })
})
