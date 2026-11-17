// Screenshots of the app at 1440 px for comparing against the Figma exports in design/.
//
//   npm run dev -- --port 5199      (in another terminal)
//   node scripts/screenshots.mjs [outDir] [baseUrl]
//
// Each shot is a full-page PNG named after the screen. Not a test: nothing is asserted,
// but console errors are printed and make the script exit non-zero.
import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

const OUT = process.argv[2] ?? 'screenshots'
const BASE = process.argv[3] ?? 'http://localhost:5199'
const DEMO_KEY = 'rally.demo.v1'

/** Check a fund or tickers on Home (or the sample portfolio, by its button label) and wait for the one-line result. */
async function check(page, text) {
  if (text === 'My sample portfolio') {
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: text }).click()
  } else await page.goto(`${BASE}/?q=${encodeURIComponent(text)}`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.teaser__line')
}

/** Check, then create the free account, which lands on /portfolio. Waits for the scan to finish. */
async function signedUp(page, text = 'SPY', ready = '.dash') {
  await check(page, text)
  await page.locator('#teaser-email').fill('alex@example.com')
  await page.getByRole('button', { name: 'Create free account' }).click()
  await page.waitForURL('**/portfolio')
  await page.waitForSelector(ready)
}

const paid = (page) => page.addInitScript((key) => localStorage.getItem(key) ?? localStorage.setItem(key, JSON.stringify({ plan: 'paid' })), DEMO_KEY)

// name, and either a path to open or steps that leave the page on the screen to capture
const SHOTS = [
  { name: 'home', path: '/' },
  { name: 'home-result', steps: (page) => check(page, 'SPY') },
  {
    name: 'home-unknown-ticker',
    steps: async (page) => {
      await page.goto(`${BASE}/?q=SPX`, { waitUntil: 'networkidle' })
      await page.waitForSelector('.finder__message p')
    },
  },
  { name: 'portfolio-first-visit', path: '/portfolio' },
  {
    name: 'portfolio-gate',
    steps: async (page) => {
      await check(page, 'SPY')
      await page.goto(`${BASE}/portfolio`, { waitUntil: 'networkidle' })
      await page.waitForSelector('.teaser__line')
    },
  },
  { name: 'portfolio', steps: (page) => signedUp(page) },
  {
    name: 'portfolio-tag-open',
    steps: async (page) => {
      await signedUp(page)
      await page.locator('.holdings .tag-chip__button').first().click()
      await page.locator('.holdings').scrollIntoViewIfNeeded()
    },
  },
  { name: 'portfolio-tickers', steps: (page) => signedUp(page, 'VOO, SPY, NVDA') },
  {
    name: 'portfolio-scanning',
    steps: async (page) => {
      await signedUp(page)
      await page.goto(`${BASE}/portfolio?state=scanning`, { waitUntil: 'networkidle' })
    },
  },
  {
    name: 'portfolio-zero-conflicts',
    steps: async (page) => {
      await signedUp(page, 'AAPL, MSFT, NVDA', '.zero__claim')
    },
  },
  {
    name: 'portfolio-data-unavailable',
    steps: async (page) => {
      await signedUp(page)
      await page.goto(`${BASE}/portfolio?state=unavailable`, { waitUntil: 'networkidle' })
    },
  },
  { name: 'whatif-empty', path: '/whatif' },
  {
    name: 'whatif',
    steps: async (page) => {
      await signedUp(page, 'My sample portfolio')
      await page.goto(`${BASE}/whatif`, { waitUntil: 'networkidle' })
      await page.getByRole('button', { name: /Exclude all/ }).click()
      await page.waitForSelector('.chart__line')
    },
  },
  {
    name: 'whatif-alternatives',
    steps: async (page) => {
      await signedUp(page)
      await page.goto(`${BASE}/whatif`, { waitUntil: 'networkidle' })
      await page.getByRole('switch', { name: /^Fossil fuels/ }).check({ force: true })
      const row = page.locator('.alternatives__list > li', { hasText: 'ExxonMobil' })
      await row.getByRole('button', { name: 'See options' }).click()
      await row.locator('.option').first().getByRole('button', { name: 'Swap in' }).click()
      await page.waitForFunction(() => ![...document.querySelectorAll('.option__facts dd')].some((dd) => dd.textContent.trim() === '…'))
      await page.locator('.alternatives').scrollIntoViewIfNeeded()
    },
  },
  {
    name: 'whatif-spy',
    steps: async (page) => {
      await signedUp(page)
      await page.goto(`${BASE}/whatif`, { waitUntil: 'networkidle' })
      await page.getByRole('switch', { name: /^Fossil fuels/ }).check({ force: true })
      await page.waitForSelector('.chart__line')
      const box = await page.locator('.chart svg').boundingBox()
      await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.5)
    },
  },
  { name: 'settings', path: '/settings' },
  { name: 'upgrade', path: '/connect' }, // free plan: lands on the upgrade wall
  { name: 'connect', path: '/connect', before: paid },
  { name: 'trades', path: '/trades', before: paid },
  { name: 'alerts', path: '/alerts' },
  { name: 'not-found', path: '/nope' },
]

const only = process.argv.slice(4)
await mkdir(OUT, { recursive: true })
const browser = await chromium.launch()
const errors = []

for (const shot of SHOTS) {
  if (only.length && !only.includes(shot.name)) continue
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
  const page = await context.newPage()
  page.on('pageerror', (e) => errors.push(`${shot.name}: ${e.message}`))
  page.on('console', (m) => m.type() === 'error' && errors.push(`${shot.name}: ${m.text()}`))
  try {
    if (shot.before) await shot.before(page)
    if (shot.steps) await shot.steps(page)
    else await page.goto(BASE + shot.path, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(900)
    await page.screenshot({ path: `${OUT}/${shot.name}.png`, fullPage: true })
    console.log(`${shot.name} -> ${OUT}/${shot.name}.png`)
  } catch (error) {
    errors.push(`${shot.name}: ${error.message.split('\n')[0]}`)
  }
  await context.close()
}

await browser.close()
if (errors.length) {
  console.error(`Problems:\n${errors.join('\n')}`)
  process.exitCode = 1
}
