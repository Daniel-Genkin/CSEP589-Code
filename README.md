# Rally

A desktop Vue application that builds a portfolio from user-entered US stock and ETF symbols. Official security metadata comes from Alpaca's Assets API; current prices and historical bars come from the Alpaca Market Data API. Dated ETF constituent weights come from TickerInside's keyless API.

The production application has no bundled ETF constituent or values-tag dataset and no fabricated alert feed. Alpaca paper-trading is available when server credentials are configured; other brokerage connections use the live-priced fallback account.

The product brief is `docs/PRD.md`. The look is defined in `docs/STYLE.md` (read from the Figma frames exported in `design/`). Build status, open conflicts and placeholders are tracked in `docs/PROGRESS.md`.

> Alpaca market data; user-entered weights. Rally shares information, not investment advice.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production build in dist/
npm test             # unit tests (Vitest)
npm run test:e2e     # the PRD's demo script in a real browser (Playwright; run `npx playwright install chromium` once)
npm run typecheck    # vue-tsc over the TypeScript and Vue files
```

## Alpaca market data

Copy `.env.example` to `.env.local`, set `ALPACA_API_KEY_ID` and `ALPACA_API_SECRET_KEY`, and choose the matching live or paper `ALPACA_TRADING_API_URL`. The browser never receives either credential.

`npm run dev` and `npm run preview` expose the same `/api/market-data` middleware used by the Vercel function in `api/market-data.js`. It searches Alpaca's active US-equity asset catalog, requests latest minute bars, and follows paginated split/dividend-adjusted daily bars through yesterday on the `iex` feed by default.

For Vercel, add the Alpaca credentials and Trading API base URL to the project's server environment.

Alpaca does not publish ETF constituent holdings. Rally fetches available issuer-file and SEC Form N-PORT holdings from TickerInside through the same server middleware. No API key is needed. Every fund displays `holdings_as_of`, its source layer, and a linked TickerInside attribution under CC BY 4.0.

Holdings freshness varies by fund. State Street issuer files can be current within a few days, while funds supplied from SEC filings can be several months old. The UI always shows the date rather than presenting delayed holdings as live.

## Screens

| Route | Screen | Tier |
| --- | --- | --- |
| `/` | Home: enter a fund or tickers | Free |
| `/portfolio` | Portfolio: live positions, exposure and ETF look-through | Free |
| `/whatif` | What-if: exclusions, alternatives and Alpaca history | Free |
| `/settings` | Live TickerInside sector lines | Free |
| `/upgrade` | Upgrade: pricing and simulated checkout | Wall |
| `/connect` | Alpaca paper positions or a live-priced demo account | Paid |
| `/trades` | Trade estimate, list, or approved Alpaca paper orders | Paid |
| `/alerts` | Monitoring UI with no fabricated events | Paid |

Opening a paid screen on the free plan goes to `/upgrade?next=…` and returns there after the simulated upgrade. "Reset demo" in the footer clears everything the demo has stored.

## Layout

```
src/types.ts        shared types (Security, Portfolio, Exclusions, …)
src/state/          active portfolio and exclusions; persisted to localStorage
src/router/         the eight routes and the plan gate
src/data/           Alpaca provider and browser client; test-only legacy fixtures are not bundled
api/                Vercel function for the same-origin Alpaca middleware
server/             Alpaca and TickerInside requests, pagination, validation, caching and aggregation
src/domain/         pure functions: look-through, exposure, exclusions, back-test, trades
src/composables/    data loading for screens (provider calls + domain functions)
src/components/     layout (app shell), rally (nav, footer, receipt, chips, input), ui (toast, modal, toggle)
src/views/          one file per screen
src/styles/main.css design tokens and shared classes
scripts/            screenshots for design review; legacy data-generation scripts are not used at runtime
```

The PRD's layers (data, domain, state, ui) arrive in that order; `docs/PROGRESS.md` says which are in place.

## Live Alpaca paper account (optional)

With keys set, **Connect brokerage → Alpaca** reads a real Alpaca *paper-trading* account, and **Approve** on the Trades page places the approved trades there as market orders. Without keys everything stays simulated.

1. Create a free paper account at <https://app.alpaca.markets> and generate Paper Trading API keys.
2. Copy `.env.example` to `.env.local` and fill in `ALPACA_API_KEY_ID` and `ALPACA_API_SECRET_KEY`. Never commit it. On Vercel, set the same two variables in the project settings.
3. Optional: `npm run seed:alpaca` shows a demo portfolio of flagged and ordinary companies; `npm run seed:alpaca -- --place` buys it.
4. `npm run dev`, then connect Alpaca.

The keys stay on the server (`server/alpaca.js`, served by `api/alpaca.js` on Vercel and by a Vite middleware locally). The server only talks to `paper-api.alpaca.markets`, never sells more than is held, and refuses malformed orders. Orders placed outside US market hours wait for the next open.
