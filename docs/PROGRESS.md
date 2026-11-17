# Rally v1 progress

Working notes for the build described in `docs/AGENT_TASK.md`. Updated after every PR.
If you are picking this up cold: read this file and `docs/STYLE.md` first.

## Status

| PR | Branch | What | State |
| --- | --- | --- | --- |
| 1 | `rally-v1/01-redesign` | Redesign: Figma tokens, style guide, restyle of the screens that have frames | Open |

Next: Phase 2, starting with the app shell and routing (the PRD's eight routes), then the data layer, domain functions, and one PR per screen.

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

## Placeholders

- All holdings, weights, company names and alerts in PR 1 come from the existing mock API (made-up companies). Replaced by the seeded dataset in Phase 2.
- "Source: sample research note" links on the dashboard point at the old company page; real source URLs arrive with seeded values tags.
- Dashboard states can be pinned for review with `/app?state=first-visit|scanning|zero|unavailable`. Remove once the states are driven by real provider results.
- "Share receipt" and "Export image" go to the existing `/receipt` page (which can save an image).
- Option 3 "Redirect new money" is a static design demo.

## Notes

- Figma MCP: Landing, Dashboard, Receipts, First visit and Scanning were read through the Figma MCP (design context and variables). The account's MCP call quota ran out after that, so Zero conflicts and Data unavailable were measured from the PNG exports in `design/` (colours sampled exactly, sizes within about 1px).
- Pre-redesign screens that have no frame (`/receipt`, `/check`, `/browse`, `/company/:symbol`, `/pricing`, login and signup, scan flow, baskets, monitoring, plan, settings, shared analysis, email preview) only received the new tokens so they stay legible. They are Outvest-era screens that the PRD's routing replaces in the next PR, so they were not restyled one by one.
- Fonts are now bundled (`@fontsource`), so the app loads nothing from Google Fonts.
- Screenshots: `node scripts/screenshots.mjs <outDir>` with the dev server on port 5199.
