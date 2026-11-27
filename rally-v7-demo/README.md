# Rally V7 · test build

A clickable build of the **Rally V7** design (Figma: Rallie-Dashboard › Rally V7), made for testing with people. It lives in its own folder and doesn't touch the main Rally app in this repo. It uses **sample data only**: nothing connects to a broker, nothing is saved, and it is not investment advice.

## Run it

From the repo root:

```bash
cd rally-v7-demo
npm install
npm run dev        # http://localhost:5180
npm run build      # static site in rally-v7-demo/dist/ (works from any folder or GitHub Pages)
```

It has its own `package.json`, so the main app's `npm run dev`, tests, type check and GitHub Pages build ignore it.

## What's in it

| Route | Screen |
| --- | --- |
| `/` | Landing page, with a live "try it" receipt, scroll-driven walkthrough and motion |
| `/check` → `/check/lines` → `/check/amount` → `/check/printing` → `/check/receipt` | The check flow, ending in the receipt (share and save dialogs) |
| `/check/unsupported` | A fund Rally can't check yet (VXUS) |
| `/connect/1-3` | Connect an investing account (read-only) |
| `/signin`, `/signin/code` | Sign in with an emailed code |
| `/home`, `/whatif`, `/basket`, `/receipts`, `/lines`, `/explore` | The app tabs |
| `/whatif` | What-if: switch off lines or companies and see the back-test, growth of $10,000, flagged exposure and same-sector options update live |
| `/breakdown` | Where your money crosses your lines |
| `/basket/order/1-4` | Build a basket: review, open an Alpaca account, add money, done |
| `/redirect` | Redirect deposits (with the turn-on dialog) |
| `/alerts`, `/plans`, `/account` | Example alert email, Free vs Plus, account settings |
| `/home/clear`, `/home/unavailable` | Other Home states (also linked from Account › Demo states) |

The routes use hash URLs (`/#/check`), so the built site runs from any static host.

## Lines

The nine lines match question 11 of the Rally Investor Survey: Military & defense, Environment & climate, Human rights & conflict, Labor practices, Data privacy, Political donations, Diversity & inclusion, Corporate taxes and Animal welfare. Each has a one-line description in `src/data.js`.

## Notes for testers

- All numbers are sample data for VOO, VTI, QQQ and SCHD.
- The Alpaca account, the FINRA/SIPC line and the $9.99 Plus price are placeholders.
- Don't type real personal details into the account forms.
