// The seed's contract (PRD "Seed contents") and the provider's behaviour, checked through the
// DataProvider interface so the tests read the data the way the app does.
import type { Category, Portfolio, Security } from '@/types'
import { beforeAll, describe, expect, it } from 'vitest'
import { ALERTS } from './seed/alerts'
import fundsFile from './seed/generated/funds.json'
import securitiesFile from './seed/generated/securities.json'
import tagsFile from './seed/generated/tags.json'
import { DEFAULT_PORTFOLIO_USD, MAX_SEARCH_RESULTS, SeededProvider } from './seeded'

const FEATURED = ['defense', 'fossil_fuels', 'private_prisons', 'tobacco', 'alcohol', 'gambling', 'animal_testing']
const provider = new SeededProvider(0)
const allTickers = securitiesFile.securities.map((s) => s.ticker)
const stocks = securitiesFile.securities.filter((s) => s.kind === 'stock')
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)

let categories: Category[]
beforeAll(async () => {
  categories = await provider.getCategories()
})

describe('seed contents', () => {
  it('has at least 60 securities across at least 8 sectors, each with a sector, industry and price', () => {
    expect(stocks.length).toBeGreaterThanOrEqual(60)
    expect(new Set(stocks.map((s) => s.sector)).size).toBeGreaterThanOrEqual(8)
    for (const s of securitiesFile.securities) {
      expect(s.sector, s.ticker).toBeTruthy()
      expect(s.industry, s.ticker).toBeTruthy()
      expect(s.price, s.ticker).toBeGreaterThan(0)
    }
    expect(new Set(allTickers).size).toBe(allTickers.length)
  })

  it('has three funds, SPY, VOO and VTI, each with 40 to 60 holdings whose weights sum to 1', async () => {
    expect(Object.keys(fundsFile.funds).sort()).toEqual(['SPY', 'VOO', 'VTI'])
    for (const ticker of ['SPY', 'VOO', 'VTI']) {
      const fund = (await provider.getFund(ticker)) as Portfolio
      expect(fund.origin).toBe('fund')
      expect(fund.holdings.length).toBeGreaterThanOrEqual(40)
      expect(fund.holdings.length).toBeLessThanOrEqual(60)
      expect(sum(fund.holdings.map((h) => h.weight))).toBeCloseTo(1, 9)
      expect(sum(fund.holdings.map((h) => h.valueUsd))).toBeCloseTo(DEFAULT_PORTFOLIO_USD, 6)
      for (const h of fund.holdings) expect(stocks.some((s) => s.ticker === h.ticker), `${ticker} holds ${h.ticker}`).toBe(true)
    }
  })

  it('has "My sample portfolio": 12 holdings worth $10,000', async () => {
    const sample = await provider.getSamplePortfolio('sample')
    expect(sample.name).toBe('My sample portfolio')
    expect(sample.holdings).toHaveLength(12)
    expect(sample.totalUsd).toBe(10_000)
    expect(sum(sample.holdings.map((h) => h.weight))).toBeCloseTo(1, 9)
    expect(sum(sample.holdings.map((h) => h.valueUsd))).toBeCloseTo(10_000, 6)
  })

  it('has a connected portfolio: 25 holdings worth $48,000, mixing stocks and ETFs', async () => {
    const connected = await provider.getSamplePortfolio('connected')
    expect(connected.origin).toBe('connected')
    expect(connected.holdings).toHaveLength(25)
    expect(connected.totalUsd).toBe(48_000)
    expect(sum(connected.holdings.map((h) => h.weight))).toBeCloseTo(1, 9)
    const kinds = new Set((await provider.getSecurities(connected.holdings.map((h) => h.ticker))).map((s) => s.kind))
    expect(kinds).toEqual(new Set(['stock', 'etf']))
  })

  it('computes shares from seeded prices', async () => {
    const sample = await provider.getSamplePortfolio('sample')
    const [aapl] = await provider.getSecurities(['AAPL'])
    const holding = sample.holdings.find((h) => h.ticker === 'AAPL')!
    expect(holding.valueUsd).toBeCloseTo(1_500, 6)
    expect(holding.shares).toBeCloseTo(1_500 / aapl.price, 9)
  })

  it('lists the seven featured categories first, then one per sector', () => {
    expect(categories.slice(0, 7).map((c) => c.id)).toEqual(FEATURED)
    expect(categories.slice(0, 7).every((c) => c.featured)).toBe(true)
    const rest = categories.slice(7)
    expect(rest.length).toBeGreaterThanOrEqual(8)
    expect(rest.every((c) => !c.featured && c.id.startsWith('sector:'))).toBe(true)
  })

  it('only tags seed tickers, in known categories, with a strength, a reason and an https source', async () => {
    const ids = new Set(categories.map((c) => c.id))
    const tags = await provider.getTags(allTickers)
    expect(tags.length).toBeGreaterThan(tagsFile.tags.length) // values tags plus sector tags
    for (const tag of tags) {
      expect(allTickers, tag.ticker).toContain(tag.ticker)
      expect(ids.has(tag.category), `${tag.ticker} ${tag.category}`).toBe(true)
      expect([1, 2, 3]).toContain(tag.strength)
      expect(tag.reason.length, tag.ticker).toBeGreaterThan(10)
      expect(tag.sourceUrl, tag.ticker).toMatch(/^https:\/\/[^\s]+$/)
    }
  })

  it('has no duplicate tag for the same ticker and category', async () => {
    const keys = (await provider.getTags(allTickers)).map((t) => `${t.ticker}|${t.category}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('has at least three alternatives for every flagged security, same sector, none tagged in the featured categories', async () => {
    const featuredTags = tagsFile.tags
    const flagged = [...new Set(featuredTags.map((t) => t.ticker))]
    expect(flagged.length).toBeGreaterThan(10)
    const taggedFeatured = new Set(featuredTags.map((t) => t.ticker))
    for (const ticker of flagged) {
      const [target] = await provider.getSecurities([ticker])
      const alternatives = await provider.getAlternatives(ticker, FEATURED)
      expect(alternatives.length, `alternatives for ${ticker}`).toBe(3)
      for (const alt of alternatives) {
        expect(alt.sector, `${ticker} -> ${alt.ticker}`).toBe(target.sector)
        expect(alt.kind).toBe('stock')
        expect(taggedFeatured.has(alt.ticker), `${alt.ticker} is flagged`).toBe(false)
      }
    }
  })

  it('has eight alerts of the four types, each naming a seed holding and a category it is tagged in', async () => {
    const alerts = await provider.getAlerts()
    expect(alerts).toHaveLength(8)
    expect(new Set(alerts.map((a) => a.type))).toEqual(new Set(['new_tag', 'tag_removed', 'filing', 'drift']))
    expect(new Set(alerts.map((a) => a.id)).size).toBe(8)
    const tags = await provider.getTags(allTickers)
    for (const alert of alerts) {
      expect(allTickers, alert.id).toContain(alert.ticker)
      expect(tags.some((t) => t.ticker === alert.ticker && t.category === alert.category), alert.id).toBe(true)
      expect(alert.offsetMinutes).toBeGreaterThan(0)
      expect(alert.summary.length).toBeGreaterThan(10)
    }
  })

  it('has about five years of daily prices for every seed ticker and the benchmark', async () => {
    const prices = await provider.loadPrices()
    expect(prices.benchmark).toBe('SPY')
    expect(prices.dates.length).toBeGreaterThan(1_200)
    const years = (Date.parse(prices.dates.at(-1)!) - Date.parse(prices.dates[0])) / (365.25 * 86_400_000)
    expect(years).toBeGreaterThan(4.9)
    expect(years).toBeLessThan(5.1)
    expect([...prices.dates].sort()).toEqual(prices.dates)
    for (const ticker of allTickers) {
      const closes = prices.closes[ticker]
      expect(closes, ticker).toHaveLength(prices.dates.length)
      expect(closes.every((c) => Number.isFinite(c) && c > 0), ticker).toBe(true)
    }
  })
})

describe('SeededProvider', () => {
  const tickersOf = (list: Security[]) => list.map((s) => s.ticker)

  it('searches after one character, by ticker and by name', async () => {
    expect(await provider.searchSecurities('')).toEqual([])
    expect(await provider.searchSecurities('  ')).toEqual([])
    expect((await provider.searchSecurities('s')).length).toBeGreaterThan(0)
    expect(tickersOf(await provider.searchSecurities('spy'))[0]).toBe('SPY')
    expect(tickersOf(await provider.searchSecurities('exxon'))).toContain('XOM')
    expect(tickersOf(await provider.searchSecurities('NV'))[0]).toBe('NVDA')
    expect((await provider.searchSecurities('a')).length).toBeLessThanOrEqual(MAX_SEARCH_RESULTS)
    expect(await provider.searchSecurities('zzzz')).toEqual([])
  })

  it('returns ticker and name with every result', async () => {
    for (const s of await provider.searchSecurities('m')) {
      expect(s.ticker).toBeTruthy()
      expect(s.name).toBeTruthy()
    }
  })

  it('returns null for an unknown fund and accepts any case', async () => {
    expect(await provider.getFund('NOPE')).toBeNull()
    expect(await provider.getFund('AAPL')).toBeNull() // a stock is not a fund
    expect((await provider.getFund('spy'))?.id).toBe('SPY')
  })

  it('returns tags only for the tickers asked', async () => {
    const tags = await provider.getTags(['XOM', 'AAPL'])
    expect(new Set(tags.map((t) => t.ticker))).toEqual(new Set(['XOM', 'AAPL']))
    expect(tags.some((t) => t.ticker === 'XOM' && t.category === 'fossil_fuels')).toBe(true)
    expect(tags.some((t) => t.ticker === 'AAPL' && FEATURED.includes(t.category))).toBe(false)
  })

  it('treats a sector as a category like any other', async () => {
    const tags = await provider.getTags(['XOM'])
    expect(tags.some((t) => t.category === 'sector:energy')).toBe(true)
    // With the whole sector flagged, nothing in it can be an alternative.
    expect(await provider.getAlternatives('XOM', ['sector:energy'])).toEqual([])
  })

  it('offers no alternatives for an unknown ticker or a fund', async () => {
    expect(await provider.getAlternatives('NOPE', FEATURED)).toEqual([])
    expect(await provider.getAlternatives('SPY', FEATURED)).toEqual([])
  })

  it('leaves unknown tickers out of getSecurities and keeps the order asked', async () => {
    expect(tickersOf(await provider.getSecurities(['MSFT', 'NOPE', 'aapl']))).toEqual(['MSFT', 'AAPL'])
  })

  it('returns the sample portfolio for any screenshot (v1 stub)', async () => {
    const holdings = await provider.parseScreenshot(new Blob(['not an image']))
    expect(holdings).toEqual((await provider.getSamplePortfolio('sample')).holdings)
  })

  it('gives the same answer every time and hands out copies', async () => {
    expect(await provider.getFund('VTI')).toEqual(await provider.getFund('VTI'))
    expect(await provider.searchSecurities('co')).toEqual(await provider.searchSecurities('co'))
    const first = await provider.getAlerts()
    first[0].summary = 'changed'
    expect((await provider.getAlerts())[0].summary).toBe(ALERTS[0].summary)
    const tags = await provider.getTags(['XOM'])
    tags[0].reason = 'changed'
    expect((await provider.getTags(['XOM']))[0].reason).not.toBe('changed')
  })

  it('resolves well inside the 500 ms budget with the default delay', async () => {
    const started = Date.now()
    await new SeededProvider().getFund('SPY')
    expect(Date.now() - started).toBeLessThan(500)
  })
})
