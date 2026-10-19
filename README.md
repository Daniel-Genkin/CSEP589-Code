# outvest

A clickable Vue 3 mockup of **outvest**. It helps first-time investors check whether their stocks and ETFs line up with the values they care about. Every screen talks to a **mock API layer**. You can later point that layer at a real backend without changing the UI.

> All companies, tickers, scores and headlines are fictional demo data.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
```

**Demo shortcuts**
- `/login` → **Explore the demo account** opens Maya's account. She's on Pro and has scans, alerts and monitoring.
- `/signup` creates a fresh account on the Free plan. Use it to try the plan limits.
- `/s/demo` is a public shared analysis.
- **Settings → Reset demo data** wipes everything stored in the browser.

## Where each flow lives

| Flow | Routes |
| --- | --- |
| Ad-hoc scan | `/app/scan/new` (link a brokerage or build a list) → `/app/scan/:id/progress` → `/app/scan/:id` (results ranked by score, filter by value/type) → `/app/scan/:id/:symbol` (values, news, **Inside the fund**, **Rebalance outlook**) |
| Sign-up | `/signup`: account → values (skippable) → done. Google/Apple are mocked. |
| Continuous monitoring | `/app/monitoring` (watchlist, alert settings, **Check now**) → `/preview/email/:alertId` (the email) → `/app/alerts/:alertId` (what happened, score impact, exposure, sources) |
| Share with a friend | **Share** on any result or analysis → modal → public branded page `/s/:shareId` → signup with `?ref=` |
| Pricing / change plan | `/pricing` (public) and `/app/plan` (current plan, usage, change plan, billing history). `?upgrade=pro` opens checkout. |

## Architecture

```
src/api/
  client.js        # request(): "mock" → mock/server.js, "http" → fetch(VITE_API_BASE_URL + path)
  services/*.js    # the only API surface views use; each method documents its endpoint
  mock/            # in-browser stand-in backend (route table, localStorage DB, fictional research data)
src/stores/        # Pinia: session (user/plan), alerts (unread badge)
src/views/         # pages; src/components/ for UI, scan, share and billing pieces
```

## Connecting a real backend

1. Copy `.env.example` to `.env` and set `VITE_API_MODE=http`. Set `VITE_API_BASE_URL` (default `/api`). For local dev, also set `API_PROXY_TARGET`.
2. Implement the endpoints below. Response shapes match what `src/api/mock/handlers/*` returns, so use those as the spec.
3. Requests send `Authorization: Bearer <token>` (the token comes from login/signup). Errors should be `{ code, message, details }` using the codes in `src/api/errors.js`. Example: `SCAN_LIMIT_REACHED` or `SYMBOL_LIMIT_EXCEEDED` with status 402 drives the upgrade prompts.

| Area | Endpoints |
| --- | --- |
| Auth | `POST /auth/signup`, `POST /auth/login`, `POST /auth/oauth/:provider`, `POST /auth/logout`, `GET/PATCH /me` |
| Securities | `GET /securities/search?q=`, `GET /securities/popular`, `GET /securities/lookup?symbols=` |
| Portfolio | `GET /brokerages`, `GET/POST /portfolio/connections`, `DELETE /portfolio/connections/:id` |
| Scans | `GET/POST /scans`, `GET /scans/:id` (poll until `status: complete`), `GET /scans/:id/holdings/:symbol` |
| Monitoring | `GET /monitoring`, `PATCH /monitoring/settings`, `POST /monitoring/holdings`, `DELETE /monitoring/holdings/:symbol`, `POST /monitoring/checks` |
| Alerts | `GET /alerts`, `GET /alerts/:id`, `POST /alerts/:id/read`, `POST /alerts/read-all`, `GET /alerts/:id/email` |
| Sharing | `POST /shares`, `GET /public/shares/:id` (no auth) |
| Billing | `GET /billing/plans` (no auth), `GET/POST /billing/subscription`, `GET /billing/invoices` |

Notes for the real implementation:
- Brokerage linking and card entry are UI mocks. Swap in an aggregator (e.g. Plaid/SnapTrade) and Stripe Elements; the mock only stores display-safe card details.
- The mock skips password checks. The real backend must hash and verify passwords.
