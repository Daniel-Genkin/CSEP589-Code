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
src/components/     layout (app shell), rally (nav, footer, receipt, dot grid, chips), ui (toast, modal, toggle)
src/views/          one file per screen
src/styles/main.css design tokens and shared classes
scripts/            screenshots for design review
```

The PRD's layers (data, domain, state, ui) arrive in that order; `docs/PROGRESS.md` says which are in place.
