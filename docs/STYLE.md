# Rally style guide

The current look is **Rally V7** (Figma file `Rz7e0qpk8bVIEn4teghPfP`, page "Rally V7"): fun, Gen Z, and still something you'd trust with money. Tokens live in `src/styles/main.css` (the v1 tokens, then a "Rally V7" block that adds `--surf`, `--raise`, `--dim`, `--mute`, `--white`, `--paper`, `--green` and the font stacks). Components are in `src/components/v7/`.

Use this for every screen. If a screen needs something that is not here, compose it from these parts before inventing a new one, and add it to this file.

## Principles

- **Ink ground, raised surfaces.** The page is ink with one warm glow at the top of app screens (green when nothing crosses your lines, grey when data is missing). Content sits on `--surf` cards with a 20px radius. No borders or shadows on cards, and no glow on boxes.
- **Three voices.** Anton shouts (headlines and the one big number), Work Sans talks (everything you read), IBM Plex Mono labels (eyebrows, tags, tickers, figures in tables).
- **One sun button per screen.** The primary action is the sun-yellow pill (`.btn-primary`). Everything else is the grey pill (`.btn-secondary`) or a blue text link (`.btn-link`). Button labels use title case ("See What’s Inside").
- **Colour means a line (a values category) or a state.** Accents are never decoration inside the app. Flare is "crosses your lines" and errors; green is only "passes / no conflicts".
- **Say what is sample.** Prices, fund holdings and the back-test are live; which companies cross which line is sample data. The footer on every app screen says so ("Live market data · Sample values tags"), and screens that show tags say it again near them.
- **The receipt is the brand object.** Cream paper, mono type, dashed rules, zigzag top and bottom edges, tilted 2 to 3 degrees, floating with no box around it.
- **Things arrive as you scroll.** On the landing page, sections stay hidden until they scroll into view (`v-reveal`, `v-stagger`), and some are pinned and driven by scroll position (`src/v7/scroll.js`). Everything shows at once with reduced motion.

## Colour tokens

| Token | Hex | Use |
| --- | --- | --- |
| `--ink` | `#17161d` | Page background; text on cream, sun and bubblegum |
| `--surface` | `#211f29` | Cards, nav bar, tables, step pills |
| `--surface-2` | `#35323f` | Chips, ticker tiles, quiet buttons, selected rows |
| `--track` | `#2f2c39` | Bar tracks, empty dots, callout panel inside a card, unselected ticker tile |
| `--hairline` | `#35323f` | 1px dividers (on ink and on cards) |
| `--border` | `#4a4656` | 1px outline on pills, buttons, dashed boxes; "passes" bars and dots |
| `--text` | `#ffffff` | Body and titles on dark |
| `--text-muted` | `#a9a4b3` | Secondary text and all mono labels on dark |
| `--cream` | `#fff4d6` | Anton display type on dark; receipt paper; selected fund chip |
| `--muted-ink` | `#5b5764` | Secondary text on cream or white |
| `--signal` | `#354bf4` | Active nav tab |
| `--brand-400` | `#5a6bf6` | Selected-row border (1.5px), progress bar, radio, default tag dot |
| `--brand-300` | `#8692f8` | Links on dark ("Mark read", source links), active step marker |
| `--sun` | `#f7c54e` | Primary button, unread badge, "done" step marker |
| `--flare` | `#e85a2a` | Share that crosses your lines (figures, bars, dots), error labels |
| `--bubblegum` | `#f07ab6` | Avatar, accent line colour, the tilted headline word on the landing page |
| `--violet` | `#8a6cf2` | Accent line colour |
| `--pass` / `--pass-bg` | `#4ade80` / `#16331f` | Zero conflicts only: the 0%, passing dots, the "No conflicts found" tag |
| `--paper-shade` | `#b9b097` | The receipt behind the front one |
| `--paper-ghost` | `#e3d7b8` | Skeleton bars on a receipt that has not printed |
| `--bar-muted` | `#8c8797` | Benchmark / comparison bar |

Category colours (the dot before a category's name), in the seed's order: defense flare, fossil fuels sun, private prisons violet, tobacco signal, alcohol bubblegum, gambling brand-300, animal testing cream. Sector categories all use bar-muted so the featured seven stand out. On the cream ground, selected chips are ink with cream text instead of using the category colour.

Contrast (WCAG): muted text is 7.4:1 on ink, 6.7:1 on surface and 5.2:1 on surface-2; brand-300 links are 5.8:1 on surface; muted-ink on cream is 6.4:1. Flare is only 3.9:1 on the track colour and 3.2:1 on cream, so use flare for large figures and short uppercase labels, never for body text.

V7 adds these names for the same palette: `--surf` `#211f29` (cards), `--raise` `#2c2a35` (chips, menus), `--dim` `#a9a4b3` (secondary text), `--mute` `#8a8594` (meta), `--white`, `--paper` `#fff4d6` (receipt), `--green` `#4bd67e` (all clear only) and `--pink` `#f07ab6`. Each of the nine lines has its own colour, set in `src/data/lines.ts`.

## Type

Fonts are bundled with the app through `@fontsource` (no font CDN).

| Style | Font | Size / line-height | Use |
| --- | --- | --- | --- |
| Display (`.display`) | Anton 400, uppercase, 0.92 | 88 app and flow headlines; 112 receipt headline; 150 to 190 the one big percent; larger on the landing page | One headline per screen and the one figure it is about |
| Points | Anton, not uppercased | 96 | The What-if difference in points |
| Lead | Work Sans 500, white | 24 to 28 / 1.25 | The sentence next to the big number |
| Body | Work Sans 400, `--dim` | 15 to 17 / 1.45 | Paragraphs under headlines |
| Section title (`.section-head h3`) | Work Sans 600, white | 20 | Above lists and cards |
| Row title | Work Sans 600, white | 16 | `Row` titles, toggles |
| Small | Work Sans 400, `--dim` | 13 | Row sub-lines, captions (`.caption`) |
| Label (`.label`) | Plex Mono 500, uppercase, +0.08em, `--dim` | 11 | Crumbs ("VOO · What-if · live market data"), card meta |
| Figure | Plex Mono 500 | 12 to 26 | Tickers, percentages and dollars |

Weights stop at 600. Headlines are sentences with a full stop ("Who crosses your lines", "The data didn’t come through.").

## Spacing and layout

- Designed at 1440. App column is 1280 (`--app-w`), the landing column 1200 (`--site-w`). Usable down to 1024.
- **App screens** (`AppShell`): the nav pill, then an optional back row, an Anton headline (88px) with a 17px lead, then a two-column grid of an 800px main column and a 456px side column.
- **Flow screens** (`FlowShell`): the step bar (logo, step dots, close or back), then the headline and body on the left (up to 696px) and a 520px column of lists and buttons on the right.
- Cards and lists: 20px radius, 16 to 22px padding, rows at least 62px tall with a 1px `--line` hairline between them.
- Spacing scale in use: 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 32, 40, 64.

## Components

All in `src/components/v7/`.

| Component | Notes |
| --- | --- |
| `AppShell` | App screens: warm glow, `AppNav`, optional back row and headline, the page, `AppFooter`. |
| `AppNav` | Pill nav: wordmark, tabs Home / What-if / Basket / Receipts / Lines / Explore (unread count on Receipts), the plan or connected-broker tag, avatar to Account. |
| `AppFooter` | The sample-data note and "Reset demo". |
| `FlowShell`, `StepBar` | Step-by-step flows: check, connect, basket, sign-in, plans. |
| `Row` | The list row: optional ticker tile, title, sub-line with a line dot, right value with a sub-value, and a check / close / pending / chevron icon. Links when given `to`. |
| `Receipt` | The paper receipt. Rows are lines with the biggest company under each; total in flare (ink when zero). `mode="per100"` shows dollars per $100. |
| `Stamp`, `LinePill` | The tilted percent stamp and line stickers around a receipt. |
| `DotGrid` | "1 dot = $1": 100 dots coloured by line. |
| `Toggle` | 51 × 31 switch, sun when on; `disabled` for a company already off through its line. |
| `Modal` | Centred dialog; Escape or the scrim closes it. Dialogs are routes (`?dialog=share`, `?company=XOM`) so Back closes them. |
| `Field` | Labelled input on ink with a sun focus border. |
| `BasketCompare` | Fund today next to your basket: share crossing your lines, companies, back-tested return against the S&P 500. |
| `ShareCard` | The shareable receipt card: per $100, holdings and lines only, never balances. |
| `AddLineModal` | Add a line of your own (kept for the visit; not checked yet). |
| `BrowserWindow`, `HowSteps`, `LiveCheck`, `StatCount`, `UpdateCard`, `previews/` | Landing page only. The previews render sample screens, so the landing page makes no network calls. |

Shared classes in `main.css`: `.btn` + `-primary` / `-secondary` / `-sm` / `-block`, `.btn-link`, `.card`, `.card-pad`, `.list`, `.section-head`, `.chip`, `.tag`, `.label`, `.caption`, `.dot`, `.rule`.

## Charts

One chart: growth of $10,000 on What-if, drawn as SVG in `WhatIfView.vue` (no chart library).

- **One y-axis.** Two measures on different scales get two charts, never a second axis.
- **Line colours** come from `src/config/chart.ts`: as it is `#e85a2a` (flare, dashed), with your exclusions `#b98a1e` (gold), S&P 500 `#5a6bf6` (brand blue). They were checked with a palette validator against the card surface. Do not add a fourth line colour without re-running the check.
- **Text never wears the line colour.** The readout and legend use text tokens next to a short stroke of the colour.
- **Hover and keyboard both work:** a crosshair follows the pointer, and a range slider under the chart moves it from the keyboard. The readout beside the chart lists every series at that date. The chart's accessible name states the end values.
- When two lines coincide (an S&P 500 fund against the S&P 500), say so in the caption.

## States every data screen needs

Build all of them: **nothing yet** (say what to do first, one button), **loading** (shimmer blocks where the figures will be; the check flow prints the receipt while it works), **result**, **all clear** (green 0%, say which lines were checked and that it isn’t an endorsement), **unavailable** (say missing data isn’t 0%, keep the user’s lines, offer Try Again and a way out). `/home?state=unavailable` pins the last one for review.

## Voice

Plain and natural, like a friend who knows money. Short sentences with a full stop. No puns, no jargon, and say a disclaimer once rather than on every card. Rally shows; it does not advise: never "you should", always "options". State what did not happen ("Nothing was bought or sold.", "No account connected.").
