> # **Rally PRD: Desktop Demo (v1)**

Nov 15, 2026

How to read this document: the sections up to Open items describe the product in plain language, for the team and reviewers. Implementation Details holds the routes, screen sizes, acceptance criteria, data, types and architecture the coding agent builds from. Links in the first part point to the matching requirements in the second.

> ## **Overview and goal**

Rally v1 is a desktop web demo that shows an investor what they own, where it conflicts with their values, and what changing it would cost, using pre-generated data end to end.

A coding agent builds it from this document. Every number on screen comes from a seeded dataset that is prepared in advance, so a real data source can replace it later without changing what the user sees (technical details are in Implementation Details).

**What the demo must prove**

* Rally's value arrives before signup: type a fund or tickers and get a one-line answer ("5 holdings conflict", "\$X of your portfolio conflicts") with no account link, plus a strong nudge to create a free account for the detail.  
* The core loop works: see holdings, find conflicts with a dollar figure, remove or swap them, and see the return impact against the S\&P 500\.  
* The paid tier is real: account linking, live monitoring and approval-gated trade routing are visible and sit behind a simulated upgrade.  
* A viewer can say in one sentence what the paid plan does and why someone would pay for it.

**Decisions already made (Nov 15\)**

* Desktop first, because it is easiest to demo.  
* Pre-generated data now (real prices, sourced tags, sample portfolios), saved as files so the app makes no network calls; live APIs later.  
* Account linking is a paid feature for now, because each connected account costs us an estimated \$1 to \$2 a month. Linking is read-only: it checks what you hold, and trades only happen after separate approval. This can change.

The pitch deck, memo and go-to-market are out of scope for this document.

> ## **Principles and positioning**

Rally is a portfolio-intelligence tool, not a broker, fund or adviser. The line for the product is: "We don't hold your money. We show you what you're buying."

1. **No custody.** Rally reads holdings and proposes trades. Trades happen in the user's own brokerage, only after explicit approval, and where the broker's API allows it (Alpaca first) Rally places the approved trades directly. For brokers that don't let outside apps trade (Robinhood is the team's example), Rally gives a trade list to execute manually.  
2. **Free value first.** Anyone gets the headline result with no signup and no account link. It is deliberately brief (showing only the top conflict) and paired with strong prompts to create a free account for the full breakdown, so the detail builds a moat. A free account is email only, never a brokerage link. Survey respondents distrusted linking accounts, and reviewers reportedly want value on the landing page without signup.  
3. **Surface the decision, don't make it.** Show exposure, cost and alternatives. Never say "you should". Alternatives are labelled as options.  
4. **Be honest about cost.** Always show the return impact of filtering next to the S\&P 500\. Team back-testing puts the drag at up to about 1.5 percentage points a year, and respondents said even that is a lot to give up.  
5. **Label sample data.** Every screen says figures are sample or pre-generated until live data is connected.  
6. **Flat pricing.** The paid plan is a flat monthly fee shown as \$5/month (a placeholder: surveys land at \$5 to \$7, and about 1 in 7 respondents would pay \$9.99). The price is a single setting that can be changed at will (see F5 in Implementation Details). No percentage-of-assets fees.

> ## **Users and core journey**

The primary user is a retail investor, mostly 18 to 29, who holds broad index funds or ETFs and cares about at least one values category. Interviews and surveys skew to this group. They will give up a little return for alignment, but not much, and many want a free version.

The journey runs from free to paid, and every screen follows the team's Figma designs (https\://www\.figma.com/design/Rz7e0qpk8bVIEn4teghPfP/Rallie-Dashboard). Steps 1 to 5 are free; steps 6 to 9 are paid.

1. Land on Home, confirm the values categories they care about, and type a fund name or tickers, or pick a sample.  
2. See a one-line result, for example "5 holdings conflict", counting only the categories they picked, with a strong prompt to create a free account for the breakdown.  
3. Create the free account (email only), then see the holdings and the dollar exposure in each of their chosen categories, and adjust the choice if they like.  
4. Turn off categories or single companies and see the projected return impact against the S\&P 500\.  
5. Browse alternatives for removed holdings and swap them in.  
6. Ask to connect a brokerage, monitor live, or send trades, and hit the upgrade wall.  
7. Take the simulated upgrade, connect a sample brokerage, and see the connected holdings.  
8. Review proposed trades, then approve them (or copy the list for a list-only broker).  
9. Check the alerts feed for later changes.

> ## **Scope**

v1 is a desktop-first, single-page front-end demo with simulated backend behavior. Nothing talks to a real brokerage, payment processor or market-data source. For the Dec 3 demo, each in-scope item is marked P0 (must ship) or P1 (build if time allows).

**In scope**

* P0: Entering a fund or tickers, importing a portfolio from a screenshot (P1: interface only, upload control hidden in the demo), with a sample portfolio.  
* P0: Holdings breakdown and values exposure in dollars.  
* P0: What-if exclusions with a back-tested return impact against the S\&P 500\.  
* P0: Alternatives for excluded holdings and swapping them in.  
* P0: Upgrade wall and simulated paid plan.  
* P0: Alerts feed. P1: Simulated brokerage connection and trade approval.  
* P0: Values category settings.

**Out of scope for v1**

* Real authentication (the free account is simulated), payments, live brokerage connections, and live market-data or values-data services (all data is prepared in advance; see Implementation Details).  
* Mobile layouts for v1. The design leaves room to add mobile later; the existing mobile build is not extended.  
* Social sharing of the receipt card with friends (no survey respondent wanted it). The receipt-style summary itself stays.  
* Education content, interests or themes beyond values (the Outvest ideas, including the pickleball content), and consulting.  
* Real vision-model parsing of screenshots (stretch goal if possible).  
* Selling aggregate data to institutions (only an event-log sketch is in scope, see the aggregate data export sketch in Implementation Details), and managed custom index funds.

> ## **What the app looks like**

The demo is one desktop web app. A banner on every screen says the figures are sample data, a footer link resets the demo, and moving between screens feels like one app, not separate pages. Plan and choices are remembered as the user moves around. Each screen below links to its exact requirements in Implementation Details.

**Home.** A single input box where the user types a fund (SPY) or several tickers ("VOO, SPY, NVDA"), or clicks a sample portfolio. Above the box, chips for the values categories they care about are preselected, so the user chooses their own values and Rally does not decide for them. After submitting, they see only one line, such as "5 holdings conflict" or "\$1,240 of your portfolio conflicts", counting only the categories they picked, and a strong prompt to create a free email-only account for the details. After signup, funds are broken into the companies they hold, so the user sees what they really own. Requirements: F1. Home.

**Portfolio.** Shown after the free account is created. A table lists each holding with its sector, weight, dollar value and colored chips for any values categories it touches. Each chip opens the reason it was applied and a link to its source. Companies that came from a fund are grouped under it and can be expanded. Next to the table is a receipt-style summary: for each category the user cares about, how many dollars and what share of the portfolio are exposed, and the biggest contributors, with a plain headline such as "You have \$X in private prisons". Requirements: F2. Portfolio.

**What-if.** The user switches off whole categories or single companies. The screen shows what the portfolio would earn per year, with and without the change, next to the S\&P 500, as a growth chart, plus how much flagged exposure is left. The return difference is always shown, with a note that past results do not predict the future. A one-line note reminds the user that selling holdings can trigger a tax bill. Requirements: F3. What-if.

**Alternatives.** For each removed company, up to three similar companies in the same sector that carry none of the user's flagged tags, labelled "Options, not recommendations". One click swaps one in, and the chart updates. Requirements: F4. Alternatives.

**Values.** A settings page with a switch for each category, the seven main ones (defense, fossil fuels, private prisons, tobacco, alcohol, gambling, animal testing) first. These come from the team's early notes; Open items compares them with survey answers. Changing a switch updates every other screen. Requirements: F9. Values settings.

**Upgrade.** When a free user tries to connect a brokerage, monitor live or send trades, they land on a simple pricing card comparing Free and Paid at one flat monthly price. A "Start paid plan (demo)" button upgrades them with no payment form, then returns them to what they were doing. Requirements: F5. Upgrade.

**Connect brokerage (paid).** A list of brokers. Webull and Alpaca are marked as able to place approved trades; Schwab is marked as trading case by case; Robinhood and Fidelity are marked list-only. Choosing one shows a short simulated connection, then loads a sample connected account. The copy makes clear that Rally reads what you own and the money stays at your broker. Requirements: F6. Connect brokerage.

**Trade approval (paid).** A list of the trades needed to carry out the user's what-if choices. Selling one company held inside a fund means selling the whole fund and buying back its other companies, so the list shows exactly that. Nothing is sent until the user approves. Users of list-only brokers, such as Robinhood and Fidelity, get a list on an equally polished screen, with Copy list and Download CSV in place of approval and no extra steps. A one-line note reminds them that selling can trigger a tax bill. Requirements: F7. Trade approval.

**Live monitoring (paid).** A feed of alerts about holdings, for example a company newly tagged in a category the user cares about, with an unread count in the navigation. Free users see a locked preview. Requirements: F8. Live monitoring.

**Where the data comes from.** All figures are prepared in advance from real market prices and sourced values tags, so the demo runs anywhere with no live services. Details: Illustrated data spec.

> ## **Open items**

* A real specification for live monitoring. v1 only shows a seeded feed. 14 of 26 early respondents wanted alerts, and they are the main reason to keep paying each month.  
* Replacement suggestions in "Alternatives" may count as investment advice. Be wary of legal implications.  
* Whether account linking stays paid. The team chose paid for now. One unverified estimate puts SnapTrade at about \$100 a month plus \$1 to \$2 per user.  
* Final price. \$5/month is a placeholder.  
* Which broker connections can place trades (examples described below)  
* Mobile, after the desktop demo.  
* Data source: yfinance versus Alpaca for prices and categories, and how values tags are generated, need the team's decision.  
* Regulatory question: a one-line answer on whether placing trades, or giving trade lists for a fee, makes Rally an adviser. Get a legal view before pitching.  
* Free gate: the waitlist form had 33 visits and 0 completions, and most survey respondents want free only. This PRD shows a one-line count first and gates the breakdown behind a free email account. Isabel proposes showing the top conflict with its source for free. Needs a team decision.  
* Featured categories versus the survey: in the early cut (n=25) the top issues were human rights and conflicts (19), lobbying and donations (10) and labor practices (9). Only defense overlaps with the seven. Decide whether to add those or keep the seven.  
* Schwab: the Nov 12 check of SnapTrade's list found trading is case by case, and Fidelity and Vanguard are read-only. v1 treats Schwab as list-only and adds Fidelity as list-only.  
* Demo customer: choose a real interviewee for the sample portfolio walkthrough and get their permission.  
* Priorities: the P0 and P1 labels in Scope are proposed and need team review.

> # **Implementation Details**

Everything below is for the implementing agent: routes, screen sizes, requirements with acceptance criteria, data and types, architecture, the demo script and future swap points. The sections above describe the product for people; this part specifies how to build it.

> ## **Screens and requirements**

Eight screens carry the demo. Each requirement below has acceptance criteria an agent can test.

| Route | Screen | Tier | Purpose |
| ----- | ----- | ----- | ----- |
| / | Home | Free | Enter a fund or tickers |
| /portfolio | Portfolio | Free | Holdings and values exposure |
| /whatif | What-if | Free | Exclude, see impact, swap |
| /settings | Values | Free | Choose categories |
| /upgrade | Upgrade | Wall | Pricing and simulated checkout |
| /connect | Connect brokerage | Paid | Pick a broker, load a sample account |
| /trades | Trade approval | Paid | Review and approve proposed trades |
| /alerts | Live monitoring | Paid | Seeded alert feed |

> ### **G. Global behavior**

* The app is a single-page app: client-side routing with the History API, smooth view transitions, state kept across navigation, working back and forward buttons, and no full page reloads. It must not read as a set of static HTML pages. Every screen must match the Figma designs (see Architecture and build guidance). A persistent "Sample data" banner appears on every screen.  
* Plan (free or paid), selected categories, the active portfolio and exclusions persist in localStorage. A "Reset demo" link in the footer clears all of it.  
* Designed at 1440 px wide, usable down to 1024 px. No mobile layout in v1, but no logic or component may assume desktop only.  
* Any gated action while on the free plan routes to /upgrade with a `next` parameter and returns there after upgrade.  
* Seeded calls show a loading state and resolve in under 500 ms. No uncaught errors in the console during the demo script.

> ### **F1. Home**

* Above the input, chips for the featured values categories are preselected and editable, and share their state with F9. One input accepts a fund ticker (SPY) or several tickers separated by commas or spaces. A portfolio value field defaults to \$10,000 and is editable.  
* Autocomplete over seeded securities starts after one character and shows ticker and name. An "Upload a screenshot" option sends the image to parseScreenshot and loads the result as a ticker portfolio the user can correct before continuing. v1 uses a stub that returns the sample portfolio for any image, which looks fake in a demo, so the upload control is hidden in the demo build and the stub sits behind a flag.  
* Two sample buttons: "S\&P 500 fund (SPY)" and "My sample portfolio".  
* Several tickers with no amounts are equal-weighted. A fund among them (for example "VOO, SPY, NVDA") is expanded into the companies it holds (shown after signup), with weights combined across sources. The fund stays visible as a group that can be expanded or collapsed, so the index fund concept stays broken apart.  
* An unknown ticker shows an inline error naming it and the closest match. It never crashes.  
* Result: submitting shows only a one-line summary that counts conflicts in the selected categories only, such as "5 holdings conflict" or "\$1,240 of your portfolio conflicts", with a strong prompt to create a free account (email only, simulated) to see which ones and why. No holdings table or per-category detail appears before signup. Accepted: entering SPY and pressing Enter shows that summary in under 1 s, and after account creation /portfolio shows at least 30 holdings.

> ### **F2. Portfolio**

* Shown after the free account is created. Holdings table with ticker, name, sector, weight, value in dollars and values tags as chips, each of which opens its reason, strength and source link; holdings that came from a fund are grouped under it and expandable. Sortable by weight, value and ticker, and filterable by category chip.  
* For ticker-built portfolios, weights are editable inline and re-normalize to 100%.  
* Exposure panel, laid out as a receipt-style summary: for each selected category, the dollar exposure, share of portfolio, number of flagged holdings and the top three contributors. A headline sentence names the largest one, for example "You have \$X in private prisons".  
* Exposure is the full position value of every holding tagged in that category, and a tooltip says so. A holding tagged in several categories counts in each. The total flagged figure counts each holding once.  
* Accepted: a unit test reproduces every exposure figure for SPY at \$10,000 from the seed by hand arithmetic. Accepted: clicking any chip shows its reason and a working source link.

> ### **F3. What-if**

* Toggles exclude whole categories or single flagged companies. Excluded weight is redistributed pro rata across the remaining holdings. This is the only redistribution strategy in v1.  
* Results show annualized back-tested return for the original portfolio, the filtered portfolio and the S\&P 500 (about five years of real prices, pre-generated), the signed difference in points per year, and flagged exposure before and after in dollars and percent.  
* A line chart shows growth of \$10,000 for the three series. A disclosure line reads: "Back-test on historical prices. Past performance does not predict future results."  
* Expected in past runs, not a pass/fail limit: excluding all seven categories from SPY moves annualized return by at most 1.5 points against the original, and excluding any one category by at most 0.5 points. Accepted: results equal the output of the reference back-test script (see Illustrated data spec) for the same inputs. If they differ, the agent finds out why: a code bug is fixed, while a data-driven difference is flagged to the user, not forced to match. After filtering, exposure to each excluded category is \$0. Recalculation takes under 300 ms. A one-line note says that selling holdings can trigger a tax bill.

> ### **F4. Alternatives**

* For each excluded holding, show up to three alternatives in the same sector. Each shows its weight, a reason ("Same sector, no flagged categories") and its effect on the back-test.  
* "Swap in" replaces that holding's share of the pro rata redistribution with the chosen alternative. Undo is available.  
* A label reads "Options, not recommendations".  
* Accepted: no alternative carries a tag in any selected category. A swap updates the chart and exposures immediately.

> ### **F5. Upgrade**

* A pricing card compares Free and Paid at a flat price read from PLAN\_PRICE\_USD (currently \$5/month, a placeholder). Paid lists: connect your brokerage, live monitoring, and approval-gated trades.  
* "Start paid plan (demo)" sets the plan to paid. There is no payment form.  
* Accepted: from the free plan, clicking "Connect brokerage" lands on /upgrade, and after upgrading lands on /connect.

> ### **F6. Connect brokerage (paid)**

* Broker list: Webull and Alpaca marked "can place approved trades", Schwab marked "trading case by case" (treated as list-only in v1), and Robinhood and Fidelity marked "trade list only".  
* Copy states that Rally reads what you own and the money stays at your broker.  
* Choosing a broker opens a simulated connection dialog that resolves after about 1.5 s and loads the connected sample portfolio (see Illustrated data spec). A "Disconnect" action restores the previous portfolio.  
* Accepted: after connecting, /portfolio shows the connected holdings with a "Connected: \<broker\>" badge.

> ### **F7. Trade approval (paid)**

* Trades are proposed from the current What-if state, applied to the active portfolio (category exclusions carry over to a connected portfolio; ticker exclusions and swaps apply only to holdings it contains): sells for excluded holdings, and buys for swaps and the pro rata redistribution. A single company cannot be sold out of a fund, so when an excluded company is held through a fund (the common case for SPY or VOO), the list sells the whole fund position and buys its remaining constituents individually in their fund weights, with the excluded weight redistributed pro rata. Directly held companies are sold as normal. Fractional quantities to four decimal places at seeded prices. With nothing excluded, the page shows an empty state linking to /whatif. Above the list, one line says that selling can trigger a tax bill.  
* Columns: side, ticker, quantity, estimated dollars, reason. Each row has a checkbox. "Approve selected" and "Approve all" are the only actions that mark trades as sent, and the confirmation says "Sent to \<broker\> (simulated)".  
* For list-only brokers (Robinhood, Fidelity and, in v1, Schwab), the approve actions are replaced by "Copy list" and "Download CSV", on a screen as polished as the approval screen. This is a main path for many users, not a fallback, and copying takes one tap.  
* Accepted: nothing shows as sent before a click, and total sells equal total buys within \$1.

> ### **F8. Live monitoring (paid)**

* A feed of the seeded alerts with relative timestamps, type, affected holding, category and a one-line explanation. Filter by category, mark all read, and an unread count in the nav.  
* On the free plan, the nav shows a locked preview with an upgrade call to action.  
* Accepted: alerts only reference holdings and categories present in the seed.

> ### **F9. Values settings**

* Toggles for every category in the seed, with the seven values categories featured first, plus select all and select none, persisted.  
* Accepted: changing a toggle changes exposure on /portfolio and /whatif without a reload.

> ## **Illustrated data spec**

All data is seeded and deterministic, and the UI reads it only through a DataProvider interface. All data is generated before the demo by scripts the programmer runs, saved as files and read at runtime through the provider, so the app makes no network calls. Prices are real market history and every values tag carries a source link. Portfolios and alerts are samples.

> ### **Values categories**

Categories are data, not code. Seven values categories are featured first in the UI, but any sector or industry category that yfinance provides can be used the same way, with no extra functionality required.

| Id | Label | Basis in the team's notes |
| ----- | ----- | ----- |
| defense | Defense and weapons | SIPRI top arms makers |
| fossil\_fuels | Fossil fuels | Standard industry labels |
| private\_prisons | Private prisons | Federal contracts |
| tobacco | Tobacco | Standard industry labels |
| alcohol | Alcohol | Standard industry labels |
| gambling | Gambling | Standard industry labels |
| animal\_testing | Animal testing | First cause categories list |

> ### **Seed contents**

* At least 60 securities across at least 8 sectors, using real S\&P 500 tickers with their yfinance sector and industry fields. yfinance categories come straight from the yfinance output the programmer supplies, which the agent converts into the TypeScript seed. Values tags for the seven featured categories come from a pre-generation script in which Claude reads each seed company's filings or news and outputs a tag, a strength of 1 to 3, a one-line reason and a source link. The team spot-checks the output before it is saved as the seed that getTags reads. Where no source supports a tag, the tag is omitted, so there are no made-up tags on real tickers.  
* Three funds, SPY, VOO and VTI, each with 40 to 60 holdings whose weights sum to 1\.  
* "My sample portfolio": 12 holdings, \$10,000, modeled on a real interviewed customer (with their permission) so the demo can walk through a real case. The team supplies the holdings.  
* Connected sample portfolio: 25 holdings, \$48,000, mixing individual stocks and ETFs, for the simulated brokerage.  
* At least three alternatives for every flagged security, in the same sector and without tags in the selected categories.  
* Eight alerts of these types: new tag, tag removed, filing, and drift. Timestamps are stored as offsets from now.  
* Back-test prices: about five years of real prices for every seed ticker plus SPY as the benchmark, pulled by a script (yfinance, matching the existing S\&P 500 back-testing; Alpaca's free market data is an alternative) and saved as files. Nothing is randomized or tuned. getBacktest computes results from these prices, so it works the same on any custom portfolio. The team's existing Python back-test script, already verified, is the reference. It is shared separately with the implementing agent, which ports its logic to TypeScript instead of re-deriving it.

> ### **Types**

```ts
type CategoryId = string; // any yfinance sector/industry or values category; featured seven: defense, fossil_fuels, private_prisons, tobacco, alcohol, gambling, animal_testing
type BrokerId = 'schwab' | 'webull' | 'alpaca' | 'robinhood' | 'fidelity';

interface Security { ticker: string; name: string; sector: string; price: number; kind: 'stock' | 'etf'; }
interface ValuesTag { ticker: string; category: CategoryId; strength: 1 | 2 | 3; reason: string; sourceUrl: string; }
interface Holding { ticker: string; weight: number; valueUsd: number; shares: number; }
interface Portfolio { id: string; name: string; totalUsd: number; holdings: Holding[]; origin: 'fund' | 'tickers' | 'connected'; brokerId?: BrokerId; }
interface Exclusions { categories: CategoryId[]; tickers: string[]; swaps: Record<string, string>; }
interface BacktestResult { dates: string[]; original: number[]; filtered: number[]; benchmark: number[]; annualizedPct: { original: number; filtered: number; benchmark: number }; }
interface ProposedTrade { side: 'sell' | 'buy'; ticker: string; shares: number; estUsd: number; reason: string; }
interface Alert { id: string; type: 'new_tag' | 'tag_removed' | 'filing' | 'drift'; ticker: string; category: CategoryId; offsetMinutes: number; summary: string; }
```

### **Data-provider interface**

```ts
interface DataProvider {
  searchSecurities(query: string): Promise<Security[]>;
  getFund(ticker: string): Promise<Portfolio | null>;
  getSamplePortfolio(id: 'sample' | 'connected'): Promise<Portfolio>;
  getTags(tickers: string[]): Promise<ValuesTag[]>;
  getAlternatives(ticker: string, excluded: CategoryId[]): Promise<Security[]>;
  getBacktest(portfolio: Portfolio, exclusions: Exclusions): Promise<BacktestResult>;
  getAlerts(): Promise<Alert[]>;
  parseScreenshot(image: Blob): Promise<Holding[]>; // stub in v1
}
```

`SeededProvider` implements it for v1. The future real provider implements the same interface. Components, state and domain code never import seed files directly.

> ## **Architecture and build guidance**

Build on the existing Rally codebase, keep its stack, and keep the data layer swappable.

> ### **Start from what exists**

1. Inspect the team repo (github.com/Daniel-Genkin/CSEP589-Code) and the deployed app (rally-chi-amber.vercel.app) first. Keep the existing stack and extend it rather than rewriting. The current scan flow returns dummy data, which this build replaces with the seeded provider. If there is no usable stack, use React with TypeScript and Vite.  
2. Isabel's Figma file "Rallie Dashboard" is the source for the desktop look. Everything must be compatible with the Figma designs (https\://www\.figma.com/design/Rz7e0qpk8bVIEn4teghPfP/Rallie-Dashboard). Where Figma and this document disagree, or any two sources conflict, the agent flags the discrepancy and asks the user to choose; it does not pick a winner itself. Remove Outvest-era content from the UI, including the pickleball material.  
3. Brand cues from the deck: cream background, heavy condensed headlines, cobalt blue and burnt orange accents. Reuse the tokens already in the repo where they exist.  
4. The main branch is protected. Work on a branch and open pull requests in small, independently reviewable chunks, never one large PR with the whole demo. Suggested order: app shell and routing, data layer and seed loading, domain functions with tests, then one PR per screen (F1 to F4 first, then F5 to F9). Open one GitHub issue per requirement to match how the team tracks work.

> ### **Layers**

| Layer | Holds | Rules |
| ----- | ----- | ----- |
| data | `DataProvider` interface, `SeededProvider`, seed files | The only place seed files are imported. Every method is async, even when seeded. |
| domain | Pure functions: exposure, exclusion and redistribution, back-test math, trade generation | No UI, storage or network. Deterministic. Unit tested. |
| state | Plan, selected categories, active portfolio, exclusions | Persisted to localStorage. Reset clears it. |
| ui | Routes and components in Screens and requirements | Reads state and calls the provider. No business math. |

> ### **Quality bar**

* Unit tests cover the domain functions and the numeric acceptance criteria in F2 and F7, with F3 results checked against the reference back-test script.  
* One end-to-end smoke test walks the demo script in Demo script and definition of done.  
* Same input always gives the same output. No randomness anywhere, and no clock except for alert timestamps.  
* No runtime network calls beyond the app's own assets.  
* Keyboard reachable controls, visible focus, and sufficient contrast on the cream background.

> ## **Demo script and definition of done**

The build is done when this script runs start to finish on a fresh load, with no errors and no manual data fixes.

1. Open /. Leave the featured categories selected, type SPY and press Enter. A one-line result appears, such as "5 holdings conflict", with a prompt to create a free account. Create one (email only). /portfolio shows at least 30 holdings and the exposure panel, headed by a sentence such as "You have \$X in \<category\>".  
2. Open /settings and deselect two categories. Exposure on /portfolio updates without a reload.  
3. Open /whatif and exclude one category, then all categories. The chart, annualized returns and the difference in points update and match the reference back-test.  
4. Open alternatives for an excluded holding and swap one in. Exposure and the chart update; undo restores them.  
5. Click "Connect brokerage". The app routes to /upgrade. Click "Start paid plan (demo)" and land on /connect.  
6. Choose Alpaca. After about 1.5 s, /portfolio shows the connected holdings with a "Connected: Alpaca" badge.  
7. Open /trades. Review the proposed trades, check that sells equal buys within \$1, and click "Approve all". The confirmation reads "Sent to Alpaca (simulated)".  
8. Disconnect, connect Robinhood, and open /trades. The page offers "Copy list" and "Download CSV" instead of approval.  
9. Open /alerts. Eight seeded alerts show, the unread count clears on "Mark all read", and the category filter works.  
10. Click "Reset demo". The app returns to the free plan with no portfolio.

**Definition of done**

* Every requirement F1 to F9 meets its acceptance criteria.  
* All domain unit tests and the end-to-end script pass.  
* The UI reads data only through `DataProvider`.  
* Every screen shows the sample-data banner, and What-if shows the back-test disclosure.  
* Nothing in the UI mentions Outvest, interests or the pickleball content.  
* The work is on a branch as a series of small pull requests with linked issues.

> ## **Future integrations**

Each seeded piece has one swap point, the `DataProvider` method named below.

| Area | v1 | Later | Swap point |
| ----- | ----- | ----- | ----- |
| Values data | Pre-generated tags with source links, spot-checked | Free public sources: SEC filings, SIPRI, FEC, federal contracts, EPA and Labor Department records. A licensed API such as As You Know only if needed. No scraping. | `getTags` |
| Holdings | Sample connected portfolio | A connection service such as SnapTrade, or the Alpaca API | `getSamplePortfolio` |
| Back-test | Real prices, pre-generated | Scheduled price refresh | `getBacktest` |
| Search and prices | Seeded securities | Market-data source | `searchSecurities`, `getFund` |
| Alerts | Seeded events | Generated from data changes | `getAlerts` |
| Billing | Simulated plan flag | Real checkout | Outside the provider |

> ### **Aggregate data export sketch (not built in v1)**

Selling aggregate data is out of scope, but v1 stores what it would need. Nothing is recorded until the user opts in on a plain-language disclosure, and they can opt out at any time. Events then go to an in-browser IndexedDB log: portfolio\_analyzed, exclusion\_applied, upgrade\_started, trade\_approved. Each carries a random local install id, with no names, emails or account numbers, and dollar values bucketed into ranges. A "Clear data" action empties the log. A later server sink reuses the same event shape, so export needs no redesign.