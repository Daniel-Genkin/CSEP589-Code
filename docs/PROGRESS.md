# Rally v1 progress

Working notes for the build described in `docs/AGENT_TASK.md`. Updated after every PR.
If you are picking this up cold: read this file and `docs/STYLE.md` first.

## Status

| PR | Branch | What | State |
| --- | --- | --- | --- |
| 1 | `rally-v1/01-redesign` | Redesign: Figma tokens, style guide, restyle of the screens that have frames | Open, [#7](https://github.com/Daniel-Genkin/CSEP589-Code/pull/7) |
| 2 | `rally-v1/02-shell` | App shell and routing: the eight routes, sample-data banner, plan gate, persisted state, Reset demo; Outvest-era screens removed | Open, [#8](https://github.com/Daniel-Genkin/CSEP589-Code/pull/8) |
| 3 | `rally-v1/03-data` | Data layer: `DataProvider`, `SeededProvider`, seed files, yfinance price pull, placeholder tags, the unrun Claude tagging script | Open |

Planned stack (14 PRs): 3 data layer and seed, 4 domain functions and tests, 5 to 13 one per requirement F1 to F9, 14 end-to-end demo script.

Next: PR 4, the domain functions (look-through, exposure, exclusions and redistribution, back-test, trades) with unit tests, and `getBacktest` wired to them.

## What works after PR 2

- Global behaviour (G): single-page routing with the History API, view transitions, back and forward, state kept across navigation, the "Sample data" banner on every screen, plan + categories + portfolio + exclusions persisted to localStorage (`src/state/demo.ts`), "Reset demo" in the footer, and gated routes (`/connect`, `/trades`) redirecting free users to `/upgrade?next=…` and back after the simulated upgrade.
- `/` and `/portfolio` show the PR 1 designs on the old sample data (made-up companies) until F1 and F2 move them to the seeded provider.
- `/whatif`, `/settings`, `/connect`, `/trades`, `/alerts` are placeholders in the final chrome; `/upgrade` has the working button but not the pricing card.

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
- `getBacktest` rejects until PR 4 adds the back-test math it calls.
- How the files are made, and what is real versus sample: `scripts/data/README.md`.

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

## Placeholders

- **Values tags** (`src/data/seed/generated/tags.json`): rule-based and hand-checked by `scripts/data/placeholder_tags.py`, not the Claude tagging script the PRD describes. `scripts/data/tag_values.py` is written and not run (needs a credential and a human spot-check). Only tags with a checked source exist, so some real exposures are missing (for example, only two drug makers carry an animal-testing tag).
- **Fund holdings** (`funds.json`): a 60-company sample of the largest names weighted by market cap, not the funds' real holdings. SPY and VOO share one list.
- **Sample portfolios** (`src/data/seed/portfolios.ts`): invented. "My sample portfolio" should be modeled on a real interviewed customer with their permission; the team supplies it.
- **Alerts** (`src/data/seed/alerts.ts`): eight invented examples.
- **Non-S&P 500 tickers:** GEO, CXW (private prisons) and CCJ, UEC, LEU (uranium, so energy holdings have three alternatives) are outside the PRD's "real S&P 500 tickers".
- **`parseScreenshot`**: returns the sample portfolio for any image, as the PRD specifies for v1.

- `/` and `/portfolio` still read the old sample data (made-up companies) through `src/utils/lines.js` and `src/api/mock/catalog.js`, with their own small store (`src/stores/lines.js`). F1 and F2 replace these and delete the old files.
- "Source: sample research note" on the portfolio is plain text; real source links arrive with seeded values tags.
- Portfolio states can be pinned for review with `/portfolio?state=first-visit|scanning|zero|unavailable`. Remove once the states are driven by real provider results.
- Option 3 "Redirect new money" is a static design demo.
- `/upgrade` shows no pricing yet (F5).

## Notes

- Figma MCP: Landing, Dashboard, Receipts, First visit and Scanning were read through the Figma MCP (design context and variables). The account's MCP call quota ran out after that, so Zero conflicts and Data unavailable were measured from the PNG exports in `design/` (colours sampled exactly, sizes within about 1px).
- PR 2 removed the Outvest-era screens and their mock API (`/receipt`, `/check`, `/browse`, `/company/:symbol`, `/pricing`, login and signup, scan flow, baskets, monitoring, plan, old settings, shared analysis, email preview). The Receipts screen built in PR 1 went with the old alerts API; F8 rebuilds it on seeded alerts from the same frame.
- New code is TypeScript (`npm run typecheck`), tested with Vitest (`npm test`). Existing shared components stay JavaScript.
- Fonts are now bundled (`@fontsource`), so the app loads nothing from Google Fonts.
- Screenshots: `node scripts/screenshots.mjs <outDir>` with the dev server on port 5199 (one PNG per route and state).
