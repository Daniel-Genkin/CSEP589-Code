# Rally progress

Working notes for the build described in `docs/AGENT_TASK.md`. Updated after every PR.
If you are picking this up cold: read this file and `docs/STYLE.md` first.

## Rally V7 UI (branch `rally-v7-demo`)

The V7 design (Figma page "Rally V7") replaces the whole UI. The data, domain and server layers stay: live Alpaca prices and history, dated TickerInside fund holdings with attribution, the back-test, exclusions and redistribution, trade proposals, Alpaca paper orders, the plan gate and Reset demo. Sections further down describe the v1 build before V7; where they disagree, this section wins.

**Screens** (see the README table): Landing, the check flow (fund, lines, amount, printing, receipt, unsupported), Home, Breakdown, What-if, Basket (review, trades, done), Receipts, Lines, Explore, Alerts example, Redirect, Connect, Plans, Sign in, Account, Not found. Old screens and components (`PortfolioView`, `SettingsView`, `UpgradeView`, `components/rally`, `components/layout`, `UiModal`, `UiToggle`, `InfoTip`) are removed with their tests. `/portfolio`, `/settings` and `/plans` redirect.

**What is real and what is sample**

| Live | Sample (marked on screen) |
| --- | --- |
| Fund and stock search, prices, history (Alpaca) | Which companies cross which line (`src/data/lines.ts`) |
| Fund holdings with date and CC BY 4.0 attribution (TickerInside) | Updates on Receipts (`SAMPLE_ALERTS`) |
| Exposure, receipt, dot grid, breakdown, back-test, swaps, trades | Explore, the example alert email, Redirect deposits, landing previews |
| Alpaca paper account and orders, when keys are set | Sign-in code (any six digits), Plus upgrade (no payment) |

**Verification:** `npm run typecheck` and `npm test` pass. `e2e/demo.spec.ts` is rewritten for the V7 flow (check SPY → receipt → save → Home → Breakdown with the TickerInside line; tickers AAPL, MSFT → Breakdown; What-if switch; Basket → review → Plus gate → trades → done; Reset demo). Last run: 2026-11-27, passing, with no console errors and no request beyond the app's own files. The same steps were also walked by hand in a browser against a local mock of `/api/market-data`.

### Conflicts logged with V7

16. **Sample values tags.** v1 removed every fabricated dataset ("no bundled values-tag dataset, no fabricated alert feed"). V7 needs companies on the nine survey lines, and no source-checked tags exist yet, so the team chose hand-written sample tags. Every tag carries a reason and the public record it would come from, and every screen that shows one says it is sample. Replace with real tags before anyone relies on a result.
17. **Lines replace categories.** The PRD's values categories and the v1 sector lines are replaced by the nine issues from the Rally Investor Survey (question 11): Military & defense, Environment & climate, Human rights & conflict, Labor practices, Data privacy (picked by default), Political donations, Diversity & inclusion, Corporate taxes, Animal welfare. Each has a one-line description.
18. **Vocabulary and navigation.** V7 uses Figma's words throughout: lines, receipts, basket, Home. Tabs are Home, What-if, Basket, Receipts, Lines, Explore. This settles conflicts 4 and 11 in V7's favour.
19. **Result before signup.** The PRD allowed only a one-line count before a free account (conflict 13). V7 shows the full receipt and lets people share it; the breakdown, What-if and Basket come after a free account.
20. **Sharing the receipt.** Conflict 10 removed sharing; V7 brings back Share and Save Image. The share card shows holdings and lines per $100 only, never balances or returns. The buttons close the dialog; no image is made yet.
21. **Basket and trades.** V7's basket flow in Figma opens a brokerage account, takes an SSN and moves money. The app keeps the PRD's behaviour instead: Basket uses the What-if exclusions, Review shows what changes, and the existing approval-gated trade list carries it out (Plus). No account opening or money movement.
22. **Growth chart table view.** The v1 chart had a "View as a table" and arrow-key navigation on the plot. The V7 chart has a hover crosshair, a keyboard slider and a readout of every series; the table view is gone. For design review.

### Conflicts 1 to 15 with V7 (issue #24 review, 2026-11-27)

Each of the 15 conflicts logged under "Open conflicts" below, checked against the V7 app and the "Rally V7" Figma page.

| # | Conflict | Status with V7 | Decision |
| --- | --- | --- | --- |
| 1 | Ground colour | V7 is near-black with cream headlines | Closed: dark ground. Update the PRD's "cream background". |
| 2 | Which Figma file | V7 lives in `Rz7e0qpk8bVIEn4teghPfP` (the file the PRD links), page "Rally V7" | Closed: that page is the source of truth. |
| 3 | Ask vs don't stop | Process note for the agent | Closed. |
| 4 | Vocabulary | V7 uses Figma's words: lines, receipts, basket, Home | Closed. Update the PRD's wording. |
| 5 | Lines vs the seven categories | Replaced by the nine survey lines (conflict 17) | Closed. **Open:** confirm the five picked by default. |
| 6 | Funds on First visit | VOO, SPY, IVV, as in the V7 frame | Closed in Figma's favour. |
| 7 | Receipts frame metrics | Every V7 screen uses the same 800 + 456 layout | Closed. |
| 8 | Performance numbers on the dashboard | Basket shows the real back-test gap against the S&P 500 | Closed. |
| 9 | Flare contrast | The 13px flare label on `#2f2c39` is gone. The Trades Sell pill was 3.8:1 (flare on its own tint) | Fixed: Sell text is `#ff8a62`, 5.8:1. Flare text is 5.1:1 on the page and 4.6:1 on cards. The landing search badge went from 10px to 11px. |
| 10 | Sharing the receipt | V7 brings back Share and Save Image ("Reveal · Share" frame); the PRD puts sharing out of scope | **Open.** The buttons close the dialog; no image is made yet. |
| 11 | Navigation labels | Tabs: Home, What-if, Basket, Receipts, Lines, Explore | Closed. The What-if screen is not on the V7 Figma page yet. |
| 12 | Two navs | The landing page has its own marketing nav again; app screens use the app nav; flows use the step bar | Accepted. Update the PRD's "one shell". |
| 13 | Landing content before signup | V7 shows the full receipt before signup (conflict 19) | **Open.** Recommended: accept V7 and update the PRD. |
| 14 | Redirect new money | Back in V7 (two frames); a sample page in the app | **Open:** keep as a sample or cut. |
| 15 | Home tab | V7 has one | Closed. |

**Still open for the team:** sample values tags (16), the receipt and sharing before signup (10, 13, 19, 20), the basket flow (21: Figma opens an account and adds money; the app uses trade approval), Redirect deposits (14), and the five default lines (5).

**Screens and states in the app with no V7 frame:** What-if (the whole screen); Trades and the Done page's "Your list is ready" version; Breakdown's holdings table and "why flagged" dialog; Home's loading and "check a fund first" states; the Receipts locked preview on the free plan; Connect's "already connected" state and step 3 (the frame shows "Choose a fund"; the app shows the holdings found); the printing error; Not found.

The two frames once measured from PNG exports (Zero conflicts, Data unavailable) now have V7 frames read from Figma. `docs/STYLE.md` was rewritten for V7.

### Placeholders added with V7

- **Line tags** (`src/data/lines.ts`): about 55 large US companies, hand-written. Companies outside that list are never flagged, so a fund can read lower than it should.
- **Updates** (`SAMPLE_ALERTS`): five invented examples on XOM, LMT, PLTR, META and AMZN.
- **Lines you add yourself**: kept for the visit and shown on Lines, not checked against anything.
- **Explore, Redirect, the alert email and the landing previews** run on `src/landing/sample.js`.
- **Plan name and price**: "Plus" at `PLAN_PRICE_USD` ($5), still a placeholder.

## Status

| PR | Branch | What | State |
| --- | --- | --- | --- |
| 1 | `rally-v1/01-redesign` | Redesign: Figma tokens, style guide, restyle of the screens that have frames | Open, [#7](https://github.com/Daniel-Genkin/CSEP589-Code/pull/7) |
| 2 | `rally-v1/02-shell` | App shell and routing: the eight routes, sample-data banner, plan gate, persisted state, Reset demo; Outvest-era screens removed | Open, [#8](https://github.com/Daniel-Genkin/CSEP589-Code/pull/8) |
| 3 | `rally-v1/03-data` | Data layer: `DataProvider`, `SeededProvider`, seed files, yfinance price pull, placeholder tags, the unrun Claude tagging script | Open, [#9](https://github.com/Daniel-Genkin/CSEP589-Code/pull/9) |
| 4 | `rally-v1/04-domain` | Domain functions with unit tests: look-through, exposure, exclusions and redistribution, back-test, trades; reference back-test script | Open, [#10](https://github.com/Daniel-Genkin/CSEP589-Code/pull/10) |
| 5 | `rally-v1/05-home` | F1 Home: category chips, ticker input with autocomplete, samples, one-line result, free-account prompt; Portfolio moved to seeded data | Open, [#11](https://github.com/Daniel-Genkin/CSEP589-Code/pull/11) |
| 6 | `rally-v1/06-portfolio` | F2 Portfolio: holdings table with fund grouping, sort, filter, tag popovers and inline weights; receipt-style exposure panel | Open, [#12](https://github.com/Daniel-Genkin/CSEP589-Code/pull/12) |
| 7 | `rally-v1/07-whatif` | F3 What-if: category and company toggles, back-tested returns against the S&P 500, growth chart, exposure before and after | Open, [#13](https://github.com/Daniel-Genkin/CSEP589-Code/pull/13) |
| 8 | `rally-v1/08-alternatives` | F4 Alternatives: up to three same-sector options per excluded holding, effect on the back-test, swap in and undo | Open, [#14](https://github.com/Daniel-Genkin/CSEP589-Code/pull/14) |
| 9 | `rally-v1/09-upgrade` | F5 Upgrade: Free and Paid side by side at `PLAN_PRICE_USD`, simulated checkout, return to `next` | Open, [#15](https://github.com/Daniel-Genkin/CSEP589-Code/pull/15) |
| 10 | `rally-v1/10-connect` | F6 Connect brokerage: broker list, simulated connection, connected sample account, Disconnect, the Connected badge | Open, [#16](https://github.com/Daniel-Genkin/CSEP589-Code/pull/16) |
| 11 | `rally-v1/11-trades` | F7 Trade approval: proposed trades for the what-if, approve selected or all, Copy list and Download CSV for list-only brokers | Open, [#17](https://github.com/Daniel-Genkin/CSEP589-Code/pull/17) |
| 12 | `rally-v1/12-alerts` | F8 Live monitoring: the seeded feed, category filter, mark all read, unread count in the nav, locked preview on the free plan | Open, [#18](https://github.com/Daniel-Genkin/CSEP589-Code/pull/18) |
| 13 | `rally-v1/13-settings` | F9 Values settings: a switch for every category, select all and none, persisted | Open, [#19](https://github.com/Daniel-Genkin/CSEP589-Code/pull/19) |
| 14 | `rally-v1/14-e2e` | End-to-end smoke test of the PRD's demo script, and the results by step | Open, [#20](https://github.com/Daniel-Genkin/CSEP589-Code/pull/20) |

Planned stack (14 PRs): 3 data layer and seed, 4 domain functions and tests, 5 to 13 one per requirement F1 to F9, 14 end-to-end demo script.

All 14 PRs are open, each based on the one before (PR 1 on `rally-restyle`). Nothing is merged. Review and merge them in order.

Next: human work, tracked as seven GitHub issues labelled `needs-human`:

| Issue | What | PRD | Priority |
| --- | --- | --- | --- |
| [#21](https://github.com/Daniel-Genkin/CSEP589-Code/issues/21) | Values tags: run the Claude tagging script and spot-check every tag | F2, F3, F4, F8 | P0 |
| [#22](https://github.com/Daniel-Genkin/CSEP589-Code/issues/22) | Seed data: real fund holdings, the sample portfolio from a real customer, tickers outside the S&P 500 | F1, F2, F4, F6, F7 | P0 |
| [#23](https://github.com/Daniel-Genkin/CSEP589-Code/issues/23) | Back-test: confirm the method and the numbers against the team's verified script | F3, F4 | P0 |
| [#24](https://github.com/Daniel-Genkin/CSEP589-Code/issues/24) | Design review: screens built without a Figma frame, and 15 logged conflicts | F1 to F9 | P0 |
| [#25](https://github.com/Daniel-Genkin/CSEP589-Code/issues/25) | Decisions before the pitch: price, legal wording, the free gate, featured categories, brokers | F1, F4, F5, F6, F7, F9 | P1 |
| [#26](https://github.com/Daniel-Genkin/CSEP589-Code/issues/26) | Live monitoring: write the specification and replace the sample feed | F8 | P1 |
| [#27](https://github.com/Daniel-Genkin/CSEP589-Code/issues/27) | Review and merge the 14 stacked PRs, and verify the demo by hand | F1 to F9 | P0 |

## Demo script results

`npm run test:e2e` builds the app, serves the build and walks the PRD's demo script in Chromium (`e2e/demo.spec.ts`). Last run: 2026-11-17, all ten steps pass, twice in a row, with no console errors and no request beyond the app's own files.

| Step | Result | What the test checks |
| --- | --- | --- |
| 1. Home: type SPY, one-line result, free account, Portfolio | Pass | Seven categories preselected; "21 holdings conflict." within a second; no table before signup; after signup at least 30 holdings and "You have $375 in fossil fuels." |
| 2. Values: deselect two categories, exposure updates without a reload | Pass | Fossil fuels and Private prisons off; the headline becomes "You have $214 in animal testing."; no page load |
| 3. What-if: exclude one category, then all | Pass | Returns and the difference in points equal the reference script: nothing excluded 11.94%, tobacco 11.78% (-0.16), all five still selected 11.66% (-0.27); three chart lines |
| 4. Alternatives: swap one in, undo | Pass | The filtered return and the chart's end label change on swap and return on undo |
| 5. Connect brokerage to /upgrade, Start paid plan (demo) to /connect | Pass | `/upgrade?next=/connect`, then `/connect` |
| 6. Choose Alpaca | Pass | Dialog, then Portfolio after 1.4 to 4 s with "Connected: Alpaca", the VOO and VTI groups and the direct holdings (25 holdings, $48,000) |
| 7. Trades: sells equal buys within $1, Approve all | Pass | Nothing sent before the click; four-decimal quantities; "Sent to Alpaca (simulated)" and every row marked sent |
| 8. Disconnect, connect Robinhood, Trades | Pass | Back to SPY on disconnect; "Copy list" and "Download CSV", no approve buttons; the CSV downloads |
| 9. Alerts: eight alerts, Mark all read, category filter | Pass | "Alerts · 8" in the nav, cleared by Mark all read; the Defense filter leaves LMT and RTX |
| 10. Reset demo | Pass | Free plan, nothing in storage, Portfolio back to first visit, `/connect` gated again |

Two things to read with these results:

- **Step 3 matches a placeholder reference.** The PRD's reference is the team's verified Python script, which was not available. `scripts/data/backtest_reference.py` stands in for it (see Placeholders). The TypeScript agrees with it to nine significant figures; whether both are right is for the team to confirm.
- **Step 3 "all" means the five categories still selected** after step 2 switched two off, because What-if lists the selected categories. The reference has a scenario for exactly that.

## Requirement status

| Requirement | State | Notes |
| --- | --- | --- |
| G Global behaviour | Done (PR 2) | Routing, banner, persistence, Reset demo, plan gate. Loading states arrive screen by screen. |
| F1 Home | Done (PR 5) | Screenshot upload is built and hidden behind `VITE_SHOW_SCREENSHOT_UPLOAD`, as the PRD asks. |
| F2 Portfolio | Done (PR 6) | The "Connected: Alpaca" badge was added with F6 (PR 10). |
| F3 What-if | Done (PR 7) | Matches the reference back-test for the same inputs; the reference itself is a placeholder (see Placeholders). Fossil fuels alone moves SPY by 0.59 points, outside the PRD's expected 0.5: data-driven, reported in PR 4. |
| F4 Alternatives | Done (PR 8) | Options for energy holdings are uranium companies outside the S&P 500 (see Placeholders): a data decision for the team. |
| F5 Upgrade | Done (PR 9) | `PLAN_PRICE_USD` is $5, a placeholder. |
| F6 Connect brokerage | Done (PR 10) | Every broker loads the same connected sample account. |
| F7 Trade approval | Done (PR 11) | Estimates use current Alpaca prices through the middleware. Approval is simulated: nothing is sent anywhere. |
| F8 Live monitoring | Done (PR 12) | Eight sample alerts. No real specification for monitoring exists yet (PRD open item). |
| F9 Values settings | Done (PR 13) | 18 categories: the seven values categories, then the 11 sectors in the seed. |

## Screens and states with no Figma frame (for design review)

Built from `docs/STYLE.md`. Listed here as they land.

- **Home: the input pill** (tickers, portfolio value, button). Adapted from the Landing frame's fund picker, which only had five fixed fund chips.
- **Home: category chips** above the input. The Landing frame's rotated line pills were decoration around a receipt; the PRD needs seven working toggles.
- **Home: the one-line result card** ("21 holdings conflict.") with the free-account form and a skeleton receipt. No frame shows a pre-signup result.
- **Home: unknown-ticker message** under the input.
- **Portfolio: the account gate** (portfolio chosen, no account yet). Same card as Home's result.
- **Portfolio: "Everything you hold" table**, with fund group rows, sort headers, category filter chips, the "By fund / Combined" switch and inline weight fields. The Dashboard frame only shows two holdings and "3 more companies".
- **Portfolio: tag popover** (reason, strength, source) opened from a chip in the table.
- **Portfolio: exposure receipt.** The receipt component is from Figma; using it for one row per category with a headline sentence above it is new. The Dashboard frame has a "Your VOO receipt" link card instead.
- **Portfolio: options 2 and 3** now point to What-if and Connect brokerage (see conflict 14).
- **What-if: "Options for what you excluded"** (F4): one row per excluded holding, opening three option cards with the weight it would take, the effect on the back-test, and Swap in / Undo.
- **Values settings: the whole screen**: two groups of switches (values categories, sectors), the select all / select none row, the explainer card.
- **Alerts: the states the Receipts frame does not show**: the category filter and "Mark all read" row, the read state of a card, the locked preview on the free plan, and the lock on the nav tab. The feed cards, the headline and the receipt column follow the Receipts frame.
- **Trade approval: the whole screen**: the trade table, the approve actions, the list-only actions, the empty state. Also the "Ready to act on it?" card at the foot of What-if that links to it.
- **Connect brokerage: the whole screen**, the connecting dialog, and the "Connected: Alpaca" badge on Portfolio. (The First visit frame has an "Option B · Connect an account" card, but no frame shows the broker list or a connected state.)
- **Upgrade: the whole screen.** Two plan cards (Free, Paid) and the promise line.
- **What-if: the whole screen.** Results card (difference in points, three annualized returns), the growth chart, the before-and-after exposure bars, the two panels of switches, the tax line and the empty states.

## How the Figma frames map to the PRD's routes

| Figma frame | Node | In PR 1 (existing app) | PRD route it becomes in Phase 2 |
| --- | --- | --- | --- |
| Landing | 97:210 | `/` | `/` Home (F1). The fund picker becomes the ticker input with category chips above it; the hero receipt becomes the one-line result and the signup prompt. |
| First visit | 81:1007 | `/app` with no fund chosen | `/portfolio` with no active portfolio (empty state that sends the user to Home or to Connect brokerage). |
| Scanning | 81:1124 | `/app` while a scan runs | The shimmer loading state while curated portfolio data and Alpaca market data are requested, used on `/portfolio` and in the Connect dialog. |
| Dashboard | 81:211 | `/app` with a result | `/portfolio` (F2): hero figure, dot grid, "Who crosses your lines", category chips, receipt summary. "What you can do about it" becomes the entry to `/whatif` (F3/F4), `/connect` and `/trades`. |
| Zero conflicts | 81:1254 | `/app` when nothing crosses | `/portfolio` when no holding is flagged in the selected categories. |
| Data unavailable | 81:1520 | `/app` when the fund cannot be read | Error state for any provider failure or unknown ticker on `/portfolio`. |
| Receipts | 93:212 | `/app/alerts` | `/alerts` (F8): the feed, with the receipt summary beside it. |
| Mobile dashboard | 81:1629 | not built | Out of scope for v1. |

PRD screens with **no Figma frame** (to be built from `docs/STYLE.md` and listed here for design review as they land): `/whatif`, `/settings`, `/upgrade`, `/connect`, `/trades`, plus the Home result line and signup prompt.

## Data layer (PR 3)

- Production no longer reads `SeededProvider`, generated prices or sample market/tag data. `AlpacaProvider` searches Alpaca's official active asset catalog, loads latest quotes and requests adjusted historical bars. The original sample-portfolio and brokerage buttons remain as live-priced demo presets.
- `api/market-data.js` and `server/alpaca-market-data.js` form the server-only Alpaca middleware. Credentials stay outside the browser, symbol requests are batched, historical pages are followed to completion, and daily closes are aligned before the app runs its back-test.
- ETF constituent look-through now uses TickerInside's free, keyless US ETF holdings API. The middleware caches dated issuer/SEC holdings maps and preserves `holdings_as_of`, source layer, citation and licence for the UI.
- Alpaca remains authoritative for the ETF's live quote/history. TickerInside data is shown only as dated holdings, including any cash/other/unmapped remainder, rather than being presented as real-time.
- TickerInside's sector profiles now feed the original category chips, exposure receipt, What-if exclusions and alternatives, so the hosted UI flow is preserved with real classifications instead of the old sample tags.
- The old seeded provider remains only as a Vitest/domain-test fixture. Vite's production module graph does not import it, and the production build no longer emits the generated prices chunk.

## Domain layer (PR 4)

Pure functions in `src/domain/`, no UI, storage or network, all unit tested (138 tests in the repo).

| File | What it does | PRD |
| --- | --- | --- |
| `portfolio.ts` | Parse the ticker input, closest-ticker suggestion, equal-weight portfolios, inline weight edits that re-normalize, look-through of funds with weights combined across sources | F1, F2 |
| `exposure.ts` | Dollars, share, count and top three per category; total flagged counting each holding once | F2 |
| `exclusions.ts` | Which holdings an exclusion removes, pro rata redistribution, swaps | F3, F4 |
| `backtest.ts` | Growth of $10,000 for original, filtered and benchmark; annualized return; difference in points | F3 |
| `trades.ts` | Proposed sells and buys, including "sell the whole fund, buy back the rest"; CSV and text export | F7 |

Numeric acceptance criteria covered by tests:
- **F2**: every exposure figure for SPY at $10,000 is reproduced by hand arithmetic from the seed (`exposure.test.ts`).
- **F3**: results equal the reference script to nine significant figures for 17 scenarios (`backtest.reference.test.ts`); exposure to each excluded category is $0 after filtering; a recalculation takes well under 300 ms.
- **F7**: sells equal buys within $1 for SPY, the sample portfolio and the connected portfolio; quantities have four decimal places; nothing is proposed when nothing is excluded.

**How the back-test treats funds.** A fund position is back-tested on the fund's own price history, and excluding a company inside it subtracts that company's slice (its weight in the fund times its return). So an untouched SPY portfolio tracks the S&P 500 line exactly. The first version looked through to the 60-company sample instead and returned 23% a year for "SPY" against the real 12%, because the sample is weighted by today's market caps; that was a modelling bug and was fixed before this PR.

**Back-test results on the seed (2021-11-01 to 2026-10-30):** S&P 500 (SPY) 11.94% a year. SPY with all seven categories excluded: 11.03%, a drag of 0.91 points (the PRD expects within 1.5). One category at a time: all within 0.5 points except fossil fuels at -0.59. That overshoot is data-driven, not a code bug: the sample fund gives each company about 1.6 times its real S&P 500 weight, so every exclusion is overstated by about that much. Reported, not forced to match.

## Open conflicts (Figma vs PRD vs existing code)

Rule from AGENT_TASK: Figma wins for the look, the PRD wins for behaviour, log and continue.

These are the v1 conflicts as first logged. Their status with V7 is in "Conflicts 1 to 15 with V7" near the top of this file.

1. **Ground colour.** PRD brand cues say "cream background"; every Figma frame is on an ink (near-black) ground with cream only for display type, the receipt and one landing section. Followed Figma.
2. **Which Figma file.** The PRD links `Rz7e0qpk8bVIEn4teghPfP` ("Rallie Dashboard"); AGENT_TASK names `0TV8YD5J0HeUampygg1DqE` ("Rallie Dashboard (Copy)") as the source of truth. Used the copy.
3. **"Ask the user" vs "do not stop".** PRD says to flag Figma/PRD discrepancies and ask; AGENT_TASK says do not stop to ask. Followed AGENT_TASK; conflicts are logged here and in PR descriptions.
4. **Vocabulary.** Figma says "lines", "receipts", "basket", "Dashboard"; the PRD says "values categories", "alerts", "what-if", "Portfolio". PR 1 keeps the Figma words on the existing screens. Phase 2 uses the PRD's screen names for routes and navigation and keeps the Figma voice in headlines. Needs a team decision.
5. **Lines vs the seven categories.** Figma's dashboard lines are Defense, Oil & gas, Health insurance, Tobacco, Data centers; the PRD's featured seven are defense, fossil fuels, private prisons, tobacco, alcohol, gambling, animal testing. Phase 2 follows the PRD (categories are data).
6. **Funds on First visit.** Figma shows VOO, SPY, IVV; the existing mock data has VOO, VTI, QQQ, SCHD, IWM; the PRD seeds SPY, VOO, VTI. PR 1 shows the existing funds; Phase 2 seeds the PRD's three.
7. **Receipts frame metrics.** That frame uses 32/72/96 page spacing and a 64px column gap that overflows its own 1280 container by 24px; the other five app frames use 24/40/40 and a 40px gap. Used the common metrics so the screens line up.
8. **Performance numbers on the dashboard.** Figma's "Option 2" card shows a tracking gap vs. the S&P 500 (-0.4 pp, +9.6% vs +10.0%). The existing app has no price data, so PR 1 shows what it can compute (weight left out, share that still crosses) and says the return comparison comes with the back-test. Real figures arrive with F3.
9. **Flare contrast.** Figma uses flare (`#e85a2a`) for a 13px label on a `#2f2c39` panel (3.9:1, below AA for small text). Kept as designed; flagged for design review.

10. **Sharing the receipt.** The Figma Receipts and Zero conflicts frames have "Share receipt" and "Export image" buttons; the PRD puts social sharing of the receipt out of scope (the receipt-style summary stays). Followed the PRD: the buttons were removed in PR 2.
11. **Navigation labels.** Figma tabs are Dashboard / Your basket / Receipts / How it works; the shell uses the PRD's screens: Portfolio / What-if / Alerts / Values, plus a "Connect brokerage" button (the demo script clicks it). Needs design sign-off.
12. **Two navs in Figma.** The Landing frame has its own marketing nav (How it works, The lineup, Join the waitlist). The PRD wants one app where a banner and footer appear on every screen, so Home sits inside the same shell as the other seven screens.

13. **Landing content the PRD rules out before signup.** The Landing frame shows a full receipt with company names, a ticker tape, an "awkward part" stats row and a lineup table. The PRD allows only a one-line count before the free account, so Home keeps the hero, "How it works" and the closing headline and drops those four. The receipt appears as a blank skeleton until signup.
14. **Dashboard "Option 3 · Redirect new money".** Not in the PRD. Replaced by "Bring your real account" (Connect brokerage, paid), which is the PRD's next step in the journey. "Option 2" now opens What-if instead of showing a tracking gap inline.
15. **A "Home" tab in the nav.** The Figma nav has no Home tab (the wordmark links home). Added one because Home is one of the PRD's eight screens and the demo script returns to it.

## Placeholders

- **Values tags** (`src/data/seed/generated/tags.json`): rule-based and hand-checked by `scripts/data/placeholder_tags.py`, not the Claude tagging script the PRD describes. `scripts/data/tag_values.py` is written and not run (needs a credential and a human spot-check). Only tags with a checked source exist, so some real exposures are missing (for example, only two drug makers carry an animal-testing tag).
- **Fund holdings** (`funds.json`): a 60-company sample of the largest names weighted by market cap, not the funds' real holdings. SPY and VOO share one list.
- **Sample portfolios** (`src/data/seed/portfolios.ts`): invented. "My sample portfolio" should be modeled on a real interviewed customer with their permission; the team supplies it.
- **Alerts** (`src/data/seed/alerts.ts`): eight invented examples.
- **Non-S&P 500 tickers:** GEO, CXW (private prisons) and CCJ, UEC, LEU (uranium, so energy holdings have three alternatives) are outside the PRD's "real S&P 500 tickers".
- **`parseScreenshot`**: returns the sample portfolio for any image, as the PRD specifies for v1.
- **Reference back-test script** (`scripts/data/backtest_reference.py`): the PRD's reference is the team's verified Python script, which was not available. This stand-in is an independent pandas implementation of the method documented in `src/domain/backtest.ts` (fixed weights rebalanced daily, growth of $10,000, compound annual growth rate). The TypeScript matches it; whether both match the team's script is unverified.

- The simulated free account stores an email address in localStorage and sends nothing anywhere.
- Two brief or rare Portfolio states can be pinned for review: `/portfolio?state=scanning` and `/portfolio?state=unavailable` (a portfolio must be loaded first).
- **Price** (`src/config/plan.ts`): `PLAN_PRICE_USD = 5` is a placeholder. The PRD says surveys land at $5 to $7 and the final price is an open item.

## Notes

- Figma MCP: Landing, Dashboard, Receipts, First visit and Scanning were read through the Figma MCP (design context and variables). The account's MCP call quota ran out after that, so Zero conflicts and Data unavailable were measured from the PNG exports in `design/` (colours sampled exactly, sizes within about 1px).
- PR 2 removed the Outvest-era screens and their mock API (`/receipt`, `/check`, `/browse`, `/company/:symbol`, `/pricing`, login and signup, scan flow, baskets, monitoring, plan, old settings, shared analysis, email preview). The Receipts screen built in PR 1 went with the old alerts API; F8 rebuilds it on seeded alerts from the same frame.
- New code is TypeScript (`npm run typecheck`), tested with Vitest (`npm test`). Existing shared components stay JavaScript.
- Fonts are now bundled (`@fontsource`), so the app loads nothing from Google Fonts.
- Screenshots: `node scripts/screenshots.mjs <outDir>` with the dev server on port 5199 (one PNG per route and state).
- Width: every screen was checked for horizontal overflow at 1024 px and 1440 px (none, after PR 14 moved the exposure tooltip). Layout below 1024 px is out of scope for v1.
- **Vercel previews.** The task said not to deploy to Vercel, and no deploy command was run. The repository's Vercel integration builds a preview for every pushed branch, so each PR has one. Production was not touched. This was noticed only after PR 14 was pushed; see issue #27.
- End-to-end: `npm run test:e2e` (Playwright, Chromium; run `npx playwright install chromium` once). It is not part of `npm test`.
