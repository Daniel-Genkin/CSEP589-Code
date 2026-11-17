# Rally v1 progress

Working notes for the build described in `docs/AGENT_TASK.md`. Updated after every PR.
If you are picking this up cold: read this file and `docs/STYLE.md` first.

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
| 9 | `rally-v1/09-upgrade` | F5 Upgrade: Free and Paid side by side at `PLAN_PRICE_USD`, simulated checkout, return to `next` | Open |

Planned stack (14 PRs): 3 data layer and seed, 4 domain functions and tests, 5 to 13 one per requirement F1 to F9, 14 end-to-end demo script.

Next: PR 10, F6 Connect brokerage (broker list, simulated connection, connected sample portfolio, Disconnect, the "Connected" badge on Portfolio).

## Requirement status

| Requirement | State | Notes |
| --- | --- | --- |
| G Global behaviour | Done (PR 2) | Routing, banner, persistence, Reset demo, plan gate. Loading states arrive screen by screen. |
| F1 Home | Done (PR 5) | Screenshot upload is built and hidden behind `VITE_SHOW_SCREENSHOT_UPLOAD`, as the PRD asks. |
| F2 Portfolio | Done (PR 6) | The "Connected: <broker>" badge belongs to F6 and arrives with it. |
| F3 What-if | Done (PR 7) | Matches the reference back-test for the same inputs; the reference itself is a placeholder (see Placeholders). Fossil fuels alone moves SPY by 0.59 points, outside the PRD's expected 0.5: data-driven, reported in PR 4. |
| F4 Alternatives | Done (PR 8) | Options for energy holdings are uranium companies outside the S&P 500 (see Placeholders): a data decision for the team. |
| F5 Upgrade | Done (PR 9) | `PLAN_PRICE_USD` is $5, a placeholder. |
| F6 to F9 | Not started | `/settings`, `/connect`, `/trades`, `/alerts` are placeholders. |

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
- **Upgrade: the whole screen.** Two plan cards (Free, Paid) and the promise line.
- **What-if: the whole screen.** Results card (difference in points, three annualized returns), the growth chart, the before-and-after exposure bars, the two panels of switches, the tax line and the empty states.

## How the Figma frames map to the PRD's routes

| Figma frame | Node | In PR 1 (existing app) | PRD route it becomes in Phase 2 |
| --- | --- | --- | --- |
| Landing | 97:210 | `/` | `/` Home (F1). The fund picker becomes the ticker input with category chips above it; the hero receipt becomes the one-line result and the signup prompt. |
| First visit | 81:1007 | `/app` with no fund chosen | `/portfolio` with no active portfolio (empty state that sends the user to Home or to Connect brokerage). |
| Scanning | 81:1124 | `/app` while a scan runs | The loading state for seeded calls (G: "Seeded calls show a loading state"), used on `/portfolio` and in the Connect dialog. |
| Dashboard | 81:211 | `/app` with a result | `/portfolio` (F2): hero figure, dot grid, "Who crosses your lines", category chips, receipt summary. "What you can do about it" becomes the entry to `/whatif` (F3/F4), `/connect` and `/trades`. |
| Zero conflicts | 81:1254 | `/app` when nothing crosses | `/portfolio` when no holding is flagged in the selected categories. |
| Data unavailable | 81:1520 | `/app` when the fund cannot be read | Error state for any provider failure or unknown ticker on `/portfolio`. |
| Receipts | 93:212 | `/app/alerts` | `/alerts` (F8): the feed, with the receipt summary beside it. |
| Mobile dashboard | 81:1629 | not built | Out of scope for v1. |

PRD screens with **no Figma frame** (to be built from `docs/STYLE.md` and listed here for design review as they land): `/whatif`, `/settings`, `/upgrade`, `/connect`, `/trades`, plus the Home result line and signup prompt.

## Data layer (PR 3)

- `src/data/provider.ts` is the PRD's `DataProvider` plus two additions the screens need: `getCategories()` and `getSecurities(tickers)`. `src/data/index.ts` exports the one `provider` instance; nothing outside `src/data/` imports seed files.
- `SeededProvider` answers from `src/data/seed/`: 89 stocks across 11 Yahoo Finance sectors plus SPY, VOO and VTI (60 holdings each); 23 placeholder values tags; one extra category per sector, derived from the data; two sample portfolios; eight sample alerts; 1,255 trading days of adjusted closes (2021-11-01 to 2026-10-30).
- How the files are made, and what is real versus sample: `scripts/data/README.md`.

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
- **F3**: results equal the reference script to nine significant figures for 16 scenarios (`backtest.reference.test.ts`); exposure to each excluded category is $0 after filtering; a recalculation takes well under 300 ms.
- **F7**: sells equal buys within $1 for SPY, the sample portfolio and the connected portfolio; quantities have four decimal places; nothing is proposed when nothing is excluded.

**How the back-test treats funds.** A fund position is back-tested on the fund's own price history, and excluding a company inside it subtracts that company's slice (its weight in the fund times its return). So an untouched SPY portfolio tracks the S&P 500 line exactly. The first version looked through to the 60-company sample instead and returned 23% a year for "SPY" against the real 12%, because the sample is weighted by today's market caps; that was a modelling bug and was fixed before this PR.

**Back-test results on the seed (2021-11-01 to 2026-10-30):** S&P 500 (SPY) 11.94% a year. SPY with all seven categories excluded: 11.03%, a drag of 0.91 points (the PRD expects within 1.5). One category at a time: all within 0.5 points except fossil fuels at -0.59. That overshoot is data-driven, not a code bug: the sample fund gives each company about 1.6 times its real S&P 500 weight, so every exclusion is overstated by about that much. Reported, not forced to match.

## Open conflicts (Figma vs PRD vs existing code)

Rule from AGENT_TASK: Figma wins for the look, the PRD wins for behaviour, log and continue.

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
