# Rally

Rally shows which companies are inside your funds and which ones cross the lines you care about. Pick a fund (or type a few tickers), pick your lines, and get a receipt of where every $100 goes.

The UI is **Rally V7** (Figma page "Rally V7", described in `docs/STYLE.md`). Official security metadata comes from Alpaca's Assets API; current prices and historical bars come from the Alpaca Market Data API. Dated ETF constituent weights come from TickerInside's keyless API. Alpaca paper trading is available when server credentials are configured; other brokerage connections use a live-priced demo account.

**Sample data:** the nine lines are the issues from the Rally Investor Survey (question 11). Which companies cross which line is hand-written sample data in `src/data/lines.ts`, each tag pointing at the public record it would come from (USAspending, EPA ECHO, OSHA, FTC, FEC, EEOC, SEC EDGAR, Federal Register). The updates on Receipts, the Explore page and Redirect deposits are sample too. See `docs/PROGRESS.md` › Placeholders.

The product brief is `docs/PRD.md`. Build status, open conflicts and placeholders are tracked in `docs/PROGRESS.md`.

> Live market data; sample values tags. Rally shares information, not investment advice.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production build in dist/
npm test             # unit tests (Vitest)
npm run test:e2e     # the V7 demo script in a real browser (Playwright; run `npx playwright install chromium` once)
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
| `/` | Landing: scroll-driven page with a live sample check (no network calls) | Free |
| `/check` → `/check/lines` → `/check/amount` → `/check/printing` → `/check/receipt` | Check a fund: pick a fund or tickers, pick your lines, optional amount, the receipt prints, then share or save | Free |
| `/check/unsupported` | A ticker Rally can't find, or a fund whose holdings it can't read | Free |
| `/home` | Dashboard: share that crosses your lines, dot grid, who crosses them, updates, what you can do (`?state=unavailable` pins the error state) | Free |
| `/breakdown` | Companies and lines tabs, where every $100 goes, holdings by fund with the TickerInside date, why each company is flagged | Free |
| `/whatif` | Switch off lines or companies: back-test against the S&P 500, growth chart, before and after, options to swap in | Free account |
| `/basket` → `/basket/review` → `/trades` → `/basket/done` | Build a basket without the companies you drop, then the trades to carry it out | Trades are Plus |
| `/receipts` | Updates on companies in your fund, and your receipt per $100 | Free (one update), Plus |
| `/lines` | Switch any of the nine lines on or off, or add your own | Free |
| `/explore`, `/alerts`, `/redirect` | Explore a company's record, an example alert email, redirect new deposits (sample) | Free |
| `/connect` | Alpaca paper positions or a live-priced demo account | Plus |
| `/upgrade`, `/signin`, `/account` | Plans, email-code sign-in (simulated), account and Reset demo | |

Opening a Plus screen on the free plan goes to `/upgrade?next=…` and returns there after the simulated upgrade. "Reset demo" in the footer clears everything the demo has stored. The old routes `/portfolio`, `/settings` and `/plans` redirect to `/home`, `/lines` and `/upgrade`.

## Layout

```
src/types.ts        shared types (Security, Portfolio, Exclusions, …)
src/state/          active portfolio and exclusions; persisted to localStorage
src/router/         the routes and the plan gate
src/data/           Alpaca provider and browser client; lines.ts holds the nine lines and their sample tags; test-only legacy fixtures are not bundled
api/                Vercel function for the same-origin Alpaca middleware
server/             Alpaca and TickerInside requests, pagination, validation, caching and aggregation
src/domain/         pure functions: look-through, exposure, exclusions, back-test, trades
src/composables/    data loading for screens (provider calls + domain functions)
src/components/v7/  the V7 components (shells, nav, rows, receipt, dot grid, toggle, dialogs); previews/ for the landing page
src/components/ui/  the toast host
src/landing/        sample data for the landing page previews
src/v7/             scroll and number-tween helpers for the V7 motion
src/views/          one file per screen
src/styles/main.css design tokens and shared classes
scripts/            screenshots for design review; legacy data-generation scripts are not used at runtime
```

The PRD's layers (data, domain, state, ui) arrive in that order; `docs/PROGRESS.md` says which are in place.

## Live Alpaca paper account (optional)

With keys set, **Connect an account → Alpaca** reads a real Alpaca *paper-trading* account, and **Approve All** on the Trades page (Basket → Build My Basket → See the Trades) places the approved trades there as market orders. Without keys everything stays simulated.

1. Create a free paper account at <https://app.alpaca.markets> and generate Paper Trading API keys.
2. Copy `.env.example` to `.env.local` and fill in `ALPACA_API_KEY_ID` and `ALPACA_API_SECRET_KEY`. Never commit it. On Vercel, set the same two variables in the project settings.
3. Optional: `npm run seed:alpaca` shows a demo portfolio of flagged and ordinary companies; `npm run seed:alpaca -- --place` buys it.
4. `npm run dev`, then connect Alpaca.

The keys stay on the server (`server/alpaca.js`, served by `api/alpaca.js` on Vercel and by a Vite middleware locally). The server only talks to `paper-api.alpaca.markets`, never sells more than is held, and refuses malformed orders. Orders placed outside US market hours wait for the next open.
