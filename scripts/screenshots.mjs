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

// What to put in localStorage before the page loads.
const LINES_KEY = 'rally.lines.v1'
const DEMO_KEY = 'rally.demo.v1'
const withFund = { [LINES_KEY]: JSON.stringify({ lineKeys: ['oil', 'pay', 'senators'], baskets: [], fundSymbol: 'VOO', excluded: ['LOOP'] }) }
const paid = { [DEMO_KEY]: JSON.stringify({ plan: 'paid' }) }

const SHOTS = [
  { name: 'home', path: '/' },
  { name: 'portfolio', path: '/portfolio', storage: withFund },
  { name: 'portfolio-first-visit', path: '/portfolio' },
  { name: 'portfolio-scanning', path: '/portfolio?state=scanning', storage: withFund },
  { name: 'portfolio-zero-conflicts', path: '/portfolio?state=zero', storage: withFund },
  { name: 'portfolio-data-unavailable', path: '/portfolio?state=unavailable', storage: withFund },
  { name: 'whatif', path: '/whatif' },
  { name: 'settings', path: '/settings' },
  { name: 'upgrade', path: '/connect' }, // free plan: lands on the upgrade wall
  { name: 'connect', path: '/connect', storage: paid },
  { name: 'trades', path: '/trades', storage: paid },
  { name: 'alerts', path: '/alerts' },
  { name: 'not-found', path: '/nope' },
]

await mkdir(OUT, { recursive: true })
const browser = await chromium.launch()
const errors = []

for (const shot of SHOTS) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
  const page = await context.newPage()
  page.on('pageerror', (e) => errors.push(`${shot.name}: ${e.message}`))
  page.on('console', (m) => m.type() === 'error' && errors.push(`${shot.name}: ${m.text()}`))
  if (shot.storage) {
    await context.addInitScript((entries) => {
      for (const [key, value] of Object.entries(entries)) if (localStorage.getItem(key) === null) localStorage.setItem(key, value)
    }, shot.storage)
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
