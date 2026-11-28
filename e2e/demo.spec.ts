/// <reference types="node" />
import { expect, test } from '@playwright/test'

const ASSETS = [
  { ticker: 'AAPL', name: 'Apple Inc. Common Stock', exchange: 'NASDAQ', assetClass: 'us_equity', kind: 'stock', tradable: true, fractionable: true },
  { ticker: 'MSFT', name: 'Microsoft Corporation Common Stock', exchange: 'NASDAQ', assetClass: 'us_equity', kind: 'stock', tradable: true, fractionable: true },
  { ticker: 'NVDA', name: 'NVIDIA Corporation Common Stock', exchange: 'NASDAQ', assetClass: 'us_equity', kind: 'stock', tradable: true, fractionable: true },
  { ticker: 'SPY', name: 'SPDR S&P 500 ETF Trust', exchange: 'ARCA', assetClass: 'us_equity', kind: 'etf', tradable: true, fractionable: true },
  { ticker: 'VOO', name: 'Vanguard S&P 500 ETF', exchange: 'ARCA', assetClass: 'us_equity', kind: 'etf', tradable: true, fractionable: true },
  { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', exchange: 'ARCA', assetClass: 'us_equity', kind: 'etf', tradable: true, fractionable: true },
]
const PRICE: Record<string, number> = { AAPL: 225, MSFT: 510, NVDA: 180, SPY: 675, VOO: 620, VTI: 300 }
const DATE = '2026-11-21T20:00:00Z'
const HISTORY: Record<string, number[]> = {
  AAPL: [100, 150, 165],
  MSFT: [100, 90, 95],
  NVDA: [100, 160, 210],
  SPY: [100, 110, 121],
  VOO: [100, 111, 122],
  VTI: [100, 109, 120],
}
const SPY_HOLDINGS = {
  ticker: 'SPY',
  name: 'SPDR S&P 500 ETF Trust',
  holdingsAsOf: '2026-11-19',
  sourceLayer: 'issuer',
  positions: 3,
  zeroWeightPositions: 0,
  listedWeight: 0.2,
  unrepresentedWeight: 0.8,
  unmappedWeight: 0,
  citation: 'TickerInside, SPDR S&P 500 ETF Trust, CC BY 4.0',
  pageUrl: 'https://tickerinside.com/etf/spy/',
  sourceUrl: null,
  license: 'CC BY 4.0',
  holdings: [
    { ticker: 'AAPL', weight: 0.08 },
    { ticker: 'MSFT', weight: 0.07 },
    { ticker: 'NVDA', weight: 0.05 },
  ],
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/market-data**', async (route) => {
    const url = new URL(route.request().url())
    const mode = url.searchParams.get('mode') ?? 'latest'
    if (mode === 'assets') {
      const query = url.searchParams.get('query')?.toLowerCase()
      const symbols = url.searchParams.get('symbols')?.split(',') ?? []
      const assets = query
        ? ASSETS.filter((asset) => asset.ticker.toLowerCase().startsWith(query) || asset.name.toLowerCase().includes(query)).slice(0, 8)
        : ASSETS.filter((asset) => symbols.includes(asset.ticker))
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ source: 'alpaca', assets }) })
      return
    }
    if (mode === 'profiles') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          source: 'tickerinside',
          profiles: [
            { ticker: 'AAPL', name: 'Apple Inc.', sector: 'Information Technology', sourceUrl: 'https://tickerinside.com/stock/aapl/', asOf: DATE.slice(0, 10) },
            { ticker: 'MSFT', name: 'Microsoft', sector: 'Information Technology', sourceUrl: 'https://tickerinside.com/stock/msft/', asOf: DATE.slice(0, 10) },
            { ticker: 'NVDA', name: 'Nvidia', sector: 'Information Technology', sourceUrl: 'https://tickerinside.com/stock/nvda/', asOf: DATE.slice(0, 10) },
          ],
        }),
      })
      return
    }
    const symbols = url.searchParams.get('symbols')!.split(',')
    if (mode === 'holdings') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ source: 'tickerinside', funds: Object.fromEntries(symbols.map((symbol) => [symbol, symbol === 'SPY' ? SPY_HOLDINGS : null])) }),
      })
      return
    }
    if (mode === 'latest') {
      const prices = Object.fromEntries(symbols.map((symbol) => [symbol, { price: PRICE[symbol], asOf: DATE }]))
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ source: 'alpaca', prices }) })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        source: 'alpaca',
        dates: ['2024-01-02', '2025-01-02', '2026-01-02'],
        closes: Object.fromEntries(symbols.map((symbol) => [symbol, HISTORY[symbol]])),
        benchmark: 'SPY',
      }),
    })
  })
})

test('runs the V7 demo script on Alpaca quotes and TickerInside ETF holdings', async ({ page, baseURL }) => {
  const consoleErrors: string[] = []
  const outside: string[] = []
  page.on('pageerror', (error) => consoleErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('request', (request) => {
    const url = request.url()
    if (!url.startsWith(baseURL!) && !url.startsWith('data:') && !url.startsWith('blob:')) outside.push(url)
  })
  // The demo script runs on the simulated account: keep the live Alpaca endpoint (set up on some machines) out of it.
  await page.route('**/api/alpaca', (route) => route.fulfill({ json: { configured: false } }))

  // Landing, then the check flow: fund, lines, amount (skipped), printing, receipt.
  await page.goto('/')
  await page.goto('/check')
  await expect(page.locator('.sample-banner')).toContainText('Live market data')
  const input = page.getByRole('combobox', { name: 'Fund or tickers' })
  await input.fill('SPY')
  await input.press('Enter')
  await expect(page).toHaveURL(/\/check\/lines$/)
  await page.getByRole('link', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Skip for Now' }).click()
  await expect(page).toHaveURL(/\/check\/receipt$/, { timeout: 20_000 })
  await expect(page.locator('h1.title')).toContainText('crosses')
  await expect(page.locator('h1.title span')).not.toHaveText('…')

  // Save the lines with a free account, then the dashboard and the breakdown with its source line.
  await page.getByRole('button', { name: 'See What’s Inside' }).click()
  await page.getByLabel('Email').fill('alex@example.com')
  await page.getByRole('button', { name: 'Create Free Account' }).click()
  await expect(page).toHaveURL(/\/home$/)
  await expect(page.getByRole('heading', { name: 'Who crosses your lines' })).toBeVisible()
  await page.getByRole('link', { name: 'See Breakdown' }).click()
  await expect(page.locator('.holdings tbody .group')).toHaveCount(1)
  await expect(page.locator('.holdings')).toContainText('SPY')
  await expect(page.locator('.holdings')).toContainText('2026-11-19')
  await expect(page.locator('.holdings')).toContainText('TickerInside')

  // A ticker list: two companies held directly, no fund rows.
  await page.goto('/check')
  await input.fill('AAPL, MSFT')
  await input.press('Enter')
  await page.getByRole('link', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Skip for Now' }).click()
  await expect(page).toHaveURL(/\/check\/receipt$/, { timeout: 20_000 })
  await page.getByRole('button', { name: 'See What’s Inside' }).click()
  await expect(page).toHaveURL(/\/home$/)
  await page.goto('/breakdown')
  await expect(page.locator('.holdings tbody tr:not(.group)')).toHaveCount(2)
  await expect(page.locator('.holdings table')).toContainText('AAPL')
  await expect(page.locator('.holdings table')).toContainText('MSFT')

  // What-if: switch Microsoft off and the back-test moves.
  await page.locator('.nav-pill').getByRole('link', { name: 'What-if' }).click()
  await expect(page.locator('.trio dd')).toHaveCount(3)
  await expect(page.locator('.chart-line')).toHaveCount(3)
  await page.getByRole('switch', { name: /Microsoft/ }).first().click()
  await expect(page.getByRole('switch', { name: /Microsoft/ }).first()).toHaveAttribute('aria-checked', 'true')
  await expect(page.locator('.points')).not.toHaveText('0.00')

  // Basket: review, then the trades behind the Plus gate, handed over as a list.
  await page.locator('.nav-pill').getByRole('link', { name: 'Basket' }).click()
  await expect(page.locator('.list').first()).toContainText('MSFT')
  await page.getByRole('link', { name: 'Build My Basket' }).click()
  await expect(page).toHaveURL(/\/basket\/review$/)
  await page.getByRole('link', { name: /See the Trades/ }).click()
  await expect(page).toHaveURL(/\/upgrade\?next=/)
  await page.getByRole('button', { name: 'Try Plus' }).click()
  await expect(page).toHaveURL(/\/trades$/)
  await expect(page.locator('table tbody tr').first()).toContainText('MSFT')
  await page.getByRole('link', { name: 'I’ve Got the List' }).click()
  await expect(page.getByRole('heading', { name: 'Your list is ready.' })).toBeVisible()

  // Reset clears everything saved on this device.
  await page.getByRole('button', { name: 'Reset demo' }).click()
  await expect(page).toHaveURL(/\/$/)
  expect(await page.evaluate(() => localStorage.getItem('rally.demo.v1'))).toBeNull()

  expect(consoleErrors).toEqual([])
  expect(outside).toEqual([])
})
