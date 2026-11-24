// The PRD's demo script, start to finish on a fresh load (docs/PRD.md, "Demo script and
// definition of done"). One test, ten steps, run in order: each step depends on the one before.
// It also checks the two global rules that only a real browser can: no errors in the console,
// and no network request beyond the app's own files.
/// <reference types="node" />
import { type Page, expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

interface Scenario {
  portfolio: string
  label: string
  annualizedPct: { original: number; filtered: number; benchmark: number }
}
const reference: { scenarios: Scenario[] } = JSON.parse(readFileSync('src/domain/__fixtures__/backtest_reference.json', 'utf8'))

/** A result from the reference back-test script, for SPY. */
function scenario(label: string) {
  const found = reference.scenarios.find((s) => s.portfolio === 'SPY' && s.label === label)
  if (!found) throw new Error(`No reference scenario "${label}"`)
  return found.annualizedPct
}
const pct2 = (value: number) => `${value.toFixed(2)}%`
/** The difference in points as the screen writes it: "−0.16", "+0.41", "0.00". */
function points(value: number) {
  const text = Math.abs(value).toFixed(2)
  if (text === '0.00') return text
  return `${value < 0 ? '−' : '+'}${text}`
}
const dollars = (text: string) => Number(text.replace(/[^0-9.]/g, ''))

/** The three annualized returns on the What-if card: as it is, with exclusions, S&P 500. */
const returns = (page: Page) => page.locator('.results__three dd')
const stored = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('rally.demo.v1') ?? 'null'))
const nav = (page: Page, name: string | RegExp) => page.locator('.nav-pill .tabs').getByRole('link', { name }).click()
const alertsTab = (page: Page) => page.locator('.nav-pill .tab', { hasText: 'Alerts' })

test('the demo script runs start to finish', async ({ page, baseURL }) => {
  const consoleErrors: string[] = []
  const outside: string[] = []
  const pageLoads: string[] = []
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

  await test.step('1. Home: SPY gives a one-line result; a free account opens Portfolio with at least 30 holdings and the exposure headline', async () => {
    await page.goto('/')
    await expect(page.locator('.sample-banner')).toContainText('Sample data')
    // The seven featured categories are preselected.
    await expect(page.locator('.lines .chip[aria-pressed="true"]')).toHaveCount(7)

    const field = page.getByRole('combobox', { name: 'Fund or tickers' })
    await field.fill('SPY')
    await field.press('Enter')
    // F1: the result appears within a second.
    await expect(page.locator('.teaser__line')).toHaveText(/^\d+ holdings conflict\.$/i, { timeout: 1000 })
    // Before signup: one line and a prompt, no holdings table.
    await expect(page.locator('table')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Create free account' })).toBeVisible()

    await page.locator('#teaser-email').fill('alex@example.com')
    await page.getByRole('button', { name: 'Create free account' }).click()
    await expect(page).toHaveURL(/\/portfolio$/)
    const holdings = page.locator('.holdings tbody tr:not(.group)')
    await expect(holdings.nth(29)).toBeAttached()
    expect(await holdings.count()).toBeGreaterThanOrEqual(30)
    await expect(page.locator('#exposure-headline')).toHaveText(/^You have \$[\d,]+ in [a-z ]+\.$/)
  })

  await test.step('2. Values: deselect two categories; exposure on Portfolio updates without a reload', async () => {
    const headline = page.locator('#exposure-headline')
    await expect(headline).toHaveText('You have $375 in fossil fuels.')
    page.on('load', () => pageLoads.push(page.url()))

    await nav(page, 'Values')
    await expect(page).toHaveURL(/\/settings$/)
    // Fossil fuels is the largest category for SPY, so switching it off must change the headline.
    await page.getByRole('switch', { name: /^Fossil fuels/ }).uncheck({ force: true })
    await page.getByRole('switch', { name: /^Private prisons/ }).uncheck({ force: true })
    await expect(page.locator('.eyebrow')).toContainText(/5 of 18 selected/i)

    await nav(page, 'Portfolio')
    await expect(headline).toHaveText('You have $214 in animal testing.')
    expect(pageLoads, 'no full page load while moving between screens').toEqual([])
  })

  await test.step('3. What-if: exclude one category, then all; the returns and the difference match the reference back-test', async () => {
    await nav(page, 'What-if')
    const nothing = scenario('exclude nothing')
    await expect(returns(page).nth(0)).toHaveText(pct2(nothing.original))
    await expect(returns(page).nth(2)).toHaveText(pct2(nothing.benchmark))
    await expect(page.getByText('Past performance does not predict future results.').first()).toBeVisible()
    await expect(page.locator('.tax')).toContainText('Selling holdings can trigger a tax bill')

    const one = scenario('exclude tobacco')
    await page.getByRole('switch', { name: /^Tobacco/ }).check({ force: true })
    await expect(returns(page).nth(1)).toHaveText(pct2(one.filtered))
    await expect(page.locator('.results__diff .stat-md')).toHaveText(points(one.filtered - one.original))

    // "All" is the five categories still selected after step 2.
    const all = scenario('exclude the five left without fossil fuels and private prisons')
    await page.getByRole('button', { name: 'Exclude all 5' }).click()
    await expect(returns(page).nth(1)).toHaveText(pct2(all.filtered))
    await expect(page.locator('.results__diff .stat-md')).toHaveText(points(all.filtered - all.original))
    await expect(returns(page).nth(0)).toHaveText(pct2(all.original))
    await expect(page.locator('.chart__line')).toHaveCount(3)
  })

  await test.step('4. Alternatives: swap one in, the return and the chart update, undo restores them', async () => {
    const filtered = returns(page).nth(1)
    const endLabel = page.locator('.chart__end', { hasText: 'With your exclusions' })
    const before = { pct: await filtered.innerText(), end: await endLabel.textContent() }

    await expect(page.locator('.alternatives .tag')).toHaveText('Options, not recommendations')
    const row = page.locator('.alternatives__list > li').first()
    await row.getByRole('button', { name: /^See options/ }).click()
    const option = row.locator('.option').first()
    await expect(option).toContainText('Same sector, no flagged categories')
    await expect(option.locator('.option__facts dd').nth(1)).toHaveText(/pts a year$/)
    await option.getByRole('button', { name: /^Swap in/ }).click()
    await expect(filtered).not.toHaveText(before.pct)
    await expect(endLabel).not.toHaveText(before.end!)
    await expect.poll(async () => Object.keys((await stored(page)).exclusions.swaps)).toHaveLength(1)

    await row.getByRole('button', { name: /^Undo/ }).first().click()
    await expect(filtered).toHaveText(before.pct)
    await expect(endLabel).toHaveText(before.end!)
    await expect.poll(async () => (await stored(page)).exclusions.swaps).toEqual({})
  })

  await test.step('5. Connect brokerage routes to the upgrade wall; Start paid plan (demo) lands on Connect', async () => {
    await page.locator('.nav-pill').getByRole('link', { name: 'Connect brokerage' }).click()
    await expect(page).toHaveURL(/\/upgrade\?next=\/connect$/)
    await expect(page.locator('.plan--paid')).toContainText('a month, flat')
    await page.getByRole('button', { name: 'Start paid plan (demo)' }).click()
    await expect(page).toHaveURL(/\/connect$/)
    await expect(page.getByText('Rally reads what you own. The money stays at your broker.')).toBeVisible()
  })

  await test.step('6. Choose Alpaca: after about 1.5 s Portfolio shows the connected holdings and "Connected: Alpaca"', async () => {
    const started = Date.now()
    await page.getByRole('button', { name: 'Connect Alpaca' }).click()
    await expect(page.getByRole('dialog')).toContainText('Connecting to Alpaca')
    await expect(page).toHaveURL(/\/portfolio$/)
    const took = Date.now() - started
    expect(took, 'the simulated connection takes about 1.5 s').toBeGreaterThanOrEqual(1400)
    expect(took).toBeLessThan(4000)
    await expect(page.locator('.connected')).toHaveText('Connected: Alpaca')
    // The table shows the connected account: two funds, opened to their companies, and the direct holdings.
    await expect(page.locator('.holdings .group')).toHaveText([/VOO/, /VTI/, /Held directly.*\$27,840/s])
    await expect(page.locator('.hero__claim')).toContainText('your account')
    await expect.poll(async () => (await stored(page)).portfolio).toMatchObject({ origin: 'connected', brokerId: 'alpaca', totalUsd: 48_000 })
    expect((await stored(page)).portfolio.holdings).toHaveLength(25)
  })

  await test.step('7. Trades: sells equal buys within $1; Approve all confirms "Sent to Alpaca (simulated)"', async () => {
    await page.goto('/trades')
    await expect(page.locator('.tax')).toContainText('Selling can trigger a tax bill')
    await expect(page.locator('.list tbody tr').first()).toBeVisible()
    // Nothing shows as sent before a click.
    await expect(page.getByText('Nothing has been sent')).toBeVisible()
    await expect(page.locator('.list tbody tr.is-sent')).toHaveCount(0)
    await expect(page.getByText('Sent to Alpaca (simulated)')).toHaveCount(0)

    const rows = await page.locator('.list tbody tr').evaluateAll((trs) =>
      trs.map((tr) => {
        const numbers = tr.querySelectorAll('td.num')
        return { side: tr.querySelector('.side')!.textContent!.trim(), shares: numbers[0].textContent!.trim(), usd: numbers[1].textContent!.trim() }
      }),
    )
    const total = (side: string) => rows.filter((r) => r.side === side).reduce((sum, r) => sum + dollars(r.usd), 0)
    expect(total('Sell')).toBeGreaterThan(0)
    expect(Math.abs(total('Sell') - total('Buy')), 'sells equal buys within $1').toBeLessThan(1)
    for (const row of rows) expect(row.shares).toMatch(/^\d+\.\d{4}$/)

    await page.getByRole('button', { name: 'Approve all' }).click()
    await expect(page.getByText('Sent to Alpaca (simulated)')).toBeVisible()
    await expect(page.locator('.list tbody tr.is-sent')).toHaveCount(rows.length)
  })

  await test.step('8. Disconnect, connect Robinhood: Trades offers "Copy list" and "Download CSV" instead of approval', async () => {
    await page.goto('/connect')
    await page.getByRole('button', { name: 'Disconnect' }).click()
    await expect(page.locator('.linked')).toHaveCount(0)
    await expect.poll(async () => (await stored(page)).portfolio?.id).toBe('SPY')

    await page.getByRole('button', { name: 'Connect Robinhood' }).click()
    await expect(page).toHaveURL(/\/portfolio$/)
    await expect(page.locator('.connected')).toHaveText('Connected: Robinhood')

    await page.goto('/trades')
    await expect(page.getByRole('button', { name: 'Copy list' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Download CSV' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Approve/ })).toHaveCount(0)
    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download CSV' }).click()
    expect((await download).suggestedFilename()).toBe('rally-trade-list.csv')
  })

  await test.step('9. Alerts: eight alerts, the unread count clears on "Mark all read", the category filter works', async () => {
    await nav(page, /^Alerts/)
    await expect(page.locator('.feed .alert')).toHaveCount(8)
    await expect(alertsTab(page)).toContainText('Alerts · 8')

    await page.getByRole('button', { name: 'Mark all read' }).click()
    await expect(alertsTab(page)).toHaveText('Alerts')
    await expect(page.locator('.feed .alert.is-read')).toHaveCount(8)

    await page.locator('.toolbar .chip', { hasText: 'Defense and weapons' }).click()
    // Exactly the two defense alerts are left.
    await expect(page.locator('.feed .alert__label')).toHaveText([/defense and weapons/i, /defense and weapons/i])
    await expect(page.locator('.feed .alert__ticker')).toHaveText(['LMT', 'RTX'])
    await page.locator('.toolbar .chip', { hasText: 'All' }).click()
    await expect(page.locator('.feed .alert')).toHaveCount(8)
  })

  await test.step('10. Reset demo: back to the free plan with no portfolio', async () => {
    await page.getByRole('button', { name: 'Reset demo' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator('.nav-pill .tag')).toContainText(/Free plan/i)
    await expect.poll(() => stored(page)).toBeNull()
    await expect(page.locator('.teaser')).toHaveCount(0)
    await page.goto('/portfolio')
    await expect(page.getByRole('heading', { name: /First, what’s in your fund/i })).toBeVisible()
    await page.goto('/connect')
    await expect(page).toHaveURL(/\/upgrade\?next=\/connect$/)
  })

  expect(consoleErrors, 'no errors in the console during the demo script').toEqual([])
  expect(outside, 'no network requests beyond the app’s own files').toEqual([])
})
