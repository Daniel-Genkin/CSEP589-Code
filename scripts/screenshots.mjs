// Screenshots of the app at 1440 px for comparing against the Figma exports in design/.
//
//   npm run dev -- --port 5199      (in another terminal)
//   node scripts/screenshots.mjs [outDir] [baseUrl]
//
// Each shot is a full-page PNG named after the screen. Not a test: nothing is asserted.
import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

const OUT = process.argv[2] ?? 'screenshots'
const BASE = process.argv[3] ?? 'http://localhost:5199'

// name, path, and what to put in localStorage before the page loads
const LINES_KEY = 'rally.lines.v1'
const withFund = { [LINES_KEY]: JSON.stringify({ lineKeys: ['oil', 'pay', 'senators'], fundSymbol: 'VOO', excluded: ['LOOP'] }) }
const SHOTS = [
  { name: 'landing', path: '/' },
  { name: 'dashboard', path: '/app', storage: withFund, login: true },
  { name: 'first-visit', path: '/app?state=first-visit', login: true },
  { name: 'scanning', path: '/app?state=scanning', storage: withFund, login: true },
  { name: 'zero-conflicts', path: '/app?state=zero', storage: withFund, login: true },
  { name: 'data-unavailable', path: '/app?state=unavailable', storage: withFund, login: true },
  { name: 'receipts', path: '/app/alerts', storage: withFund, login: true },
]

await mkdir(OUT, { recursive: true })
const browser = await chromium.launch()
const errors = []

for (const shot of SHOTS) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
  const page = await context.newPage()
  page.on('pageerror', (e) => errors.push(`${shot.name}: ${e.message}`))
  page.on('console', (m) => m.type() === 'error' && errors.push(`${shot.name}: ${m.text()}`))
  if (shot.login) {
    // The mock API's demo account; lands on /app.
    await page.goto(`${BASE}/login?demo=1`, { waitUntil: 'networkidle' })
    await page.waitForURL('**/app')
  }
  if (shot.storage) {
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
    await page.evaluate((entries) => Object.entries(entries).forEach(([k, v]) => localStorage.setItem(k, v)), shot.storage)
  }
  await page.goto(BASE + shot.path, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${OUT}/${shot.name}.png`, fullPage: true })
  console.log(`${shot.name} -> ${OUT}/${shot.name}.png`)
  await context.close()
}

await browser.close()
if (errors.length) {
  console.error(`Console errors:\n${errors.join('\n')}`)
  process.exitCode = 1
}
