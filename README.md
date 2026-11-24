# Rally

A desktop web demo that shows an investor what they own, where it conflicts with their values, and what changing it would cost. Vue 3, Vite, Pinia and vue-router. Everything runs in the browser on pre-generated sample data: no backend, no accounts, no network calls beyond the app's own files.

The product brief is `docs/PRD.md`. The look is defined in `docs/STYLE.md` (read from the Figma frames exported in `design/`). Build status, open conflicts and placeholders are tracked in `docs/PROGRESS.md`.

> Sample data throughout. Rally shares information, not investment advice.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production build in dist/
npm test             # unit tests (Vitest)
npm run test:e2e     # the PRD's demo script in a real browser (Playwright; run `npx playwright install chromium` once)
npm run typecheck    # vue-tsc over the TypeScript and Vue files
```

## Screens

| Route | Screen | Tier |
| --- | --- | --- |
| `/` | Home: enter a fund or tickers | Free |
| `/portfolio` | Portfolio: holdings and values exposure | Free |
| `/whatif` | What-if: exclude, see the impact, swap | Free |
| `/settings` | Values: choose categories | Free |
| `/upgrade` | Upgrade: pricing and simulated checkout | Wall |
| `/connect` | Connect brokerage | Paid |
| `/trades` | Trade approval | Paid |
| `/alerts` | Live monitoring | Paid |

Opening a paid screen on the free plan goes to `/upgrade?next=…` and returns there after the simulated upgrade. "Reset demo" in the footer clears everything the demo has stored.

## Layout

```
src/types.ts        shared types (Security, Portfolio, Exclusions, …)
src/state/          plan, account, categories, active portfolio, exclusions; persisted to localStorage
src/router/         the eight routes and the plan gate
src/data/           DataProvider, SeededProvider and the seed files (the only place they are imported)
src/domain/         pure functions: look-through, exposure, exclusions, back-test, trades
src/composables/    data loading for screens (provider calls + domain functions)
src/components/     layout (app shell), rally (nav, footer, receipt, chips, input), ui (toast, modal, toggle)
src/views/          one file per screen
src/styles/main.css design tokens and shared classes
scripts/            screenshots for design review; scripts/data makes the seed
```

The PRD's layers (data, domain, state, ui) arrive in that order; `docs/PROGRESS.md` says which are in place.

## Live Alpaca paper account (optional)

With keys set, **Connect brokerage → Alpaca** reads a real Alpaca *paper-trading* account, and **Approve** on the Trades page places the approved trades there as market orders. Without keys everything stays simulated.

1. Create a free paper account at <https://app.alpaca.markets> and generate Paper Trading API keys.
2. Copy `.env.example` to `.env.local` and fill in `ALPACA_KEY_ID` and `ALPACA_SECRET_KEY`. Never commit it. On Vercel, set the same two variables in the project settings.
3. Optional: `npm run seed:alpaca` shows a demo portfolio of flagged and ordinary companies; `npm run seed:alpaca -- --place` buys it.
4. `npm run dev`, then connect Alpaca.

The keys stay on the server (`server/alpaca.js`, served by `api/alpaca.js` on Vercel and by a Vite middleware locally). The server only talks to `paper-api.alpaca.markets`, never sells more than is held, and refuses malformed orders. Orders placed outside US market hours wait for the next open.
