# Outvest

A clickable Vue 3 mockup of **Outvest**, the investing app that turns a climate hot take into a real portfolio. Pitch an idea in plain language, workshop it with an AI copilot and the community, then invest in the finished basket from $10. Every screen talks to a **mock API layer**. You can later point that layer at a real backend without changing the UI.

> All companies, tickers, prices, evidence, backtests and headlines are fictional demo data. The AI copilot is mocked: it matches your idea to a climate topic and answers follow-ups with simple rules.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
```

**Demo shortcuts**
- `/` has the AI prompt bar in the hero. Type a climate hot take (or tap an example) and the copilot's draft thesis appears right there, no account needed.
- `/login` → **Explore the demo account** opens Maya Okafor's account: a published heat pump thesis with community activity, two invested baskets and thesis alerts.
- `/signup` creates a fresh account with no brokerage account, so you can try opening one in the invest flow.
- `/t/th_heatpumps` is a public thesis page and `/u/mayaokafor` is a public track record.
- **Alerts → Check for news** pulls the next story that affects one of your published or invested theses.
- **Settings → Reset demo data** wipes everything stored in the browser.

## Where each flow lives

| Flow | Routes |
| --- | --- |
| Try an idea (no account) | `/` prompt bar → inline copilot draft → **Save it and keep workshopping** → `/signup?idea=` → `/app/pitch?idea=` → `/app/theses/:id` |
| Pitch | `/app/pitch` (plain-language idea, example starters, off-theme ideas get climate suggestions) |
| Workshop with AI | `/app/theses/:id`: claims checked against filings, policy and adoption data; the basket (add/remove companies, weighting); strongest arguments against; 5-year backtest vs the S&P 500; copilot chat to push back |
| Workshop with the community | **Publish** in the workshop → `/app/community` (trending, new, top calls) → follow, challenge a claim, suggest a company (the author can add it in one tap) → public pages `/t/:id` and `/u/:handle` |
| Invest | `/app/theses/:id/invest` (open a brokerage account if needed → amount from $10 → rebalancing schedule → review) → `/app/portfolio` (value vs the S&P 500, schedule, add money, sell) |
| Alerts | `/app/alerts` → `/app/alerts/:id` (what happened, the claim it affects, companies in your basket, the copilot's suggestion) |
| Pricing | `/pricing` (free to build, workshop and publish; invest from $10) |

## Architecture

```
src/api/
  client.js        # request(): "mock" → mock/server.js, "http" → fetch(VITE_API_BASE_URL + path)
  services/*.js    # the only API surface views use; each method documents its endpoint
  mock/            # in-browser stand-in backend
    data/          # fictional climate companies and the copilot's topic templates (claims, evidence, news)
    copilot.js     # idea → thesis draft, plus chat replies that can reshape the basket
    market.js      # deterministic synthetic prices for backtests, track records and positions
    handlers/      # route tables; seed.js builds the demo accounts through the same copilot code
src/components/thesis/  # prompt bar, copilot chat, claims, basket, backtest chart, community thread
src/stores/        # Pinia: session (user), alerts (unread badge)
src/views/         # public pages, auth, and the /app screens
src/config/links.js # App Store and Google Play links
```

## App store links

The site links to the iOS and Android apps. Set `VITE_APP_STORE_URL` and `VITE_GOOGLE_PLAY_URL` (see `.env.example`) to the real listings. Until then the buttons point at the store home pages.

## Connecting a real backend

1. Copy `.env.example` to `.env` and set `VITE_API_MODE=http`. Set `VITE_API_BASE_URL` (default `/api`). For local dev, also set `API_PROXY_TARGET`.
2. Implement the endpoints below. Response shapes match what `src/api/mock/handlers/*` returns, so use those as the spec.
3. Requests send `Authorization: Bearer <token>` (the token comes from login/signup). Errors should be `{ code, message, details }` using the codes in `src/api/errors.js`. For example, `OFF_THEME` (422, `details.suggestions`) explains ideas without a climate angle, and `ACCOUNT_REQUIRED` (409) sends investors to open a brokerage account.

| Area | Endpoints |
| --- | --- |
| Auth | `POST /auth/signup`, `POST /auth/login`, `POST /auth/oauth/:provider`, `POST /auth/logout`, `GET/PATCH /me` |
| Copilot (no auth) | `GET /public/themes`, `POST /public/copilot/preview` |
| Theses | `GET/POST /theses`, `GET/PATCH/DELETE /theses/:id`, `POST /theses/:id/basket`, `DELETE /theses/:id/basket/:symbol`, `POST /theses/:id/messages`, `POST /theses/:id/publish` |
| Community | `GET /community/theses`, `GET /people/:handle`, `GET /companies/search`, `POST/DELETE /theses/:id/follow`, `POST /theses/:id/comments`, `POST /theses/:id/comments/:commentId/accept`, `POST /theses/:id/comments/:commentId/dismiss` |
| Invest | `GET /invest/banks`, `GET/POST /invest/account`, `POST /theses/:id/invest`, `GET /portfolio`, `PATCH /portfolio/positions/:id`, `POST /portfolio/positions/:id/sell` |
| Alerts | `GET /alerts`, `GET /alerts/:id`, `POST /alerts/:id/read`, `POST /alerts/read-all`, `POST /alerts/check` (demo only) |

Notes for the real implementation:
- The copilot needs a real model plus research data (filings, policy trackers, adoption data) behind `POST /public/copilot/preview`, `POST /theses` and `POST /theses/:id/messages`.
- Account opening, identity checks, bank linking and orders belong to the registered brokerage partner. The mock only validates the form and never moves money.
- Backtests and track records here use synthetic prices. Use real price history, and keep the hypothetical-performance disclosures.
- The mock skips password checks. The real backend must hash and verify passwords.
