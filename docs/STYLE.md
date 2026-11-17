# Rally style guide

Learned from the Figma file "Rallie Dashboard (Copy)" (frames Landing, Dashboard, Receipts, First visit, Scanning, Zero conflicts, Data unavailable). PNG exports are in `design/`. Tokens live in `src/styles/main.css`; shared components in `src/components/rally/`.

Use this for every screen, including the ones with no Figma frame. If a screen needs something that is not here, compose it from these parts before inventing a new one, and add it to this file.

## Principles

- **Ink ground, raised surfaces.** The page is ink. Content sits on slightly lighter cards with a 28px radius. No borders on cards, no drop shadows on cards, no gradients.
- **Three voices.** Anton shouts (headlines and the one big number), Work Sans talks (everything you read), IBM Plex Mono labels (eyebrows, tags, tickers, figures in tables).
- **One sun button per screen.** The primary action is the sun-yellow pill. Everything else is an outlined pill.
- **Colour means a line (a values category) or a state.** Accents are never decoration inside the app. Flare is "crosses your lines" and errors; green is only "passes / no conflicts".
- **Say it is sample data.** Every screen carries a mono label or tag saying so, plus the footer note.
- **The receipt is the brand object.** Cream paper, mono type, dashed rules, torn bottom edge, tilted 1.5 degrees in the app.

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

## Type

Fonts are bundled with the app through `@fontsource` (no font CDN).

| Style | Font | Size / line-height | Use |
| --- | --- | --- | --- |
| Hero display | Anton 400, uppercase | 176 / 0.98 | Landing headline only |
| Page headline | Anton 400, uppercase, cream | 96 to 132 / 1 (`.page-title` defaults to 112; drop to 96 for long lines) | One per screen, two lines |
| Section display | Anton | 92 / 1.04 | Landing section headline |
| Big number | Anton, cream (`.stat-xl`) | 160 / 1 | The one figure the screen is about |
| Stat | Anton (`.stat-lg`, `.stat-md`) | 120 / 1.05, 72 / 1 | Supporting figures |
| Receipt total | Anton, flare or ink | 56 to 60 / 1 | Receipt only |
| Wordmark | Anton, cream, +0.02em | 28 nav, 24 footer, 44 to 48 receipt | "RALLY" |
| Claim | Work Sans 500 | 32 / 1.25 | Sentence next to the big number |
| Landing title | Work Sans 600 (`.title-xl`) | 40 | Landing section titles |
| Card headline | Work Sans 600 (`.title-lg`) | 28 | Status card title, option title |
| Section title | Work Sans 600 (`.title-section`) | 26 | Sections on the page ground, side-block titles |
| Card title | Work Sans 600 (`.title-card`) | 22 | Card headers |
| Small title | Work Sans 600 (`.title-sm`) | 20 | Secondary card headers |
| Row name | Work Sans 600 | 18 to 19 | Holding, fund and step names |
| Lead | Work Sans 400, muted (`.lead`) | 20 / 1.5 | Line under the page headline |
| Body | Work Sans 400 | 15 to 16 / 1.5 | Paragraphs; muted unless it is the main message |
| Small | Work Sans 400, muted (`.small`) | 13 / 1.5 | Notes, disclaimers |
| Tab, button | Work Sans 500 / 600 | 15 (13 for small buttons) | |
| Eyebrow | Plex Mono 500, uppercase, +0.08em (`.eyebrow`) | 13 | First line of every page: "Your Rally · Screen · state" |
| Label | Plex Mono 500, uppercase, +0.06em (`.label-mono`) | 12 | Card meta, statuses, tags |
| Figure | Plex Mono 500 (`.num-mono`) | 18 to 22 | Percentages and dollars in rows |
| Source link | Plex Mono 400, brand-300 (`.source-link`) | 12 to 13 | Ends with ↗ |

Weights stop at 600. Headlines are sentences with a full stop ("Who crosses your lines", "The data didn’t come through.").

## Spacing and layout

- Designed at 1440. Content column is 1280 (`--container`), centred. Usable down to 1024.
- App frame: 24px top, 40px bottom; 40px between nav, content and footer.
- Two columns: main (flex) + side column 440px, 40px gap (`.page-cols`, `.col-main`, `.col-side`). Main column stacks at 28px; side column at 24px. A side column that opens with a receipt hangs 16px lower (`.has-receipt`).
- Page head (eyebrow, headline, lead): 18px gap.
- Cards: 24px padding (28px for list cards, 36px for the roomy account card), 28px radius, 20 to 22px between blocks inside. Rows inside cards are separated by a 1px hairline with 18px vertical padding.
- Full-width card rows: two cards, 24px gap.
- Spacing scale in use: 4, 8, 10, 12, 14, 16, 18, 20, 24, 28, 40.
- Radii: pill 999 (nav, buttons, chips, tags, bars), 28 cards, 20 inner panels and selectable rows, 14 to 16 ticker tiles and inputs, 6 receipt top corners.

## Components

| Component | Where | Notes |
| --- | --- | --- |
| Nav pill | `NavPill.vue` | Surface pill, wordmark left, tabs centre (active tab on signal), actions right. App shows a "Demo mode" tag and the avatar. |
| Footer | `SiteFooter.vue` | Hairline, wordmark, disclaimer (13px muted), tagline. |
| Card | `.card`, `.card-pad` | Surface, 28px radius, no border. |
| Inset panel | `.inset` | Track-coloured panel inside a card (radius 20, padding 24) for the message that must not be missed. |
| Button | `.btn` + `.btn-primary` / `.btn-outline` / `.btn-quiet` | Pill. Sizes: default 15/26 padding, `.btn-md` 13/22, `.btn-sm` 10/16 with 13px text. Quiet (surface-2 with sun text) is an undoable state: "Excluded · Undo". |
| Tag | `.tag` | Outlined mono pill with an 8px dot. Dot colour carries the state (sun demo, brand-400 neutral, flare problem). `.tag-pass` is the green filled variant. |
| Chip | `.chip`, `.chip-add` | A selected line: surface-2 pill, 10px colour dot, name. Dashed chip (`+ Label`) is one you can add. |
| Category chips | `CategoryChips.vue` | Every category as an on/off chip (`aria-pressed`). Use when the set is small and all of it should be visible (Home). |
| Category picker | `CategoryPicker.vue` | Selected categories as removable chips (×) plus "+ Add a line", which opens the rest (Figma "Your lines" card). Use inside cards. |
| Input pill | see `HomeView.vue` `.finder` | The one place the user types: surface pill, 1.5px brand-400 border (flare when invalid), mono text, fields divided by a hairline, the sun button at the right end. Suggestions drop down as a bordered surface card. |
| Result card | `ConflictTeaser.vue` | One Anton line (96px) stating the result, a 20px muted sentence, then a hairline and the ask with its form. A tilted skeleton receipt on the right. Green line when the count is zero. |
| Table | see `HoldingsTable.vue` | Inside a card. Mono 12px uppercase headers (sortable ones are buttons with an arrow), hairline between rows, 12px cell padding, tickers in cream mono, numbers right-aligned in mono. A group row (a fund) sits on surface-inset with a round +/− toggle; the rows inside it are indented. Filters are chips above the table: the active one is cream with ink text. |
| Tag chip | `TagChip.vue` | A small chip (13px, surface-2, colour dot) on a holding. Clicking opens a 340px bordered card: mono label, the reason, three strength pips (flare) with words, the source link. Closes on Escape or a click outside. |
| Tooltip | `InfoTip.vue` | A muted "?" button; on hover or focus, an ink bubble with a border and 13px text. For one-sentence explanations only; anything the user must read is also written on the page. |
| Inline number field | see `HoldingsTable.vue` `.weight` | 84px wide, 34px tall, ink fill, 1px border, mono, right-aligned, unit after the field. Brand-400 border and ring on focus. |
| View switch | `.tabs` inside an ink pill | Two or three small tabs for switching how the same data is listed. The active tab is signal, as in the nav. |
| Switch | `UiToggle.vue` | Label (15/600) with a 13px muted description under it, and a 46 × 28 track on the right: border grey off, brand-400 on, cream thumb. In a list, one per row with a hairline between rows and the category dot or a 44px ticker tile before the label. |
| Result block | see `WhatIfView.vue` `.results` | The one figure in Anton (`.stat-md`) with its unit and a one-sentence reading beside it, then a row of two or three stat columns separated from it by a hairline. |
| Before / after bars | see `WhatIfView.vue` `.compare` | Two labelled 10px bars on tracks: "before" in bar-muted, "after" in sun, widths on the same scale, value and share right-aligned in mono. |
| Option card | see `AlternativesPanel.vue` `.option` | A choice the user can take, never one Rally recommends: 1px hairline border, radius 20, a 44px ticker tile with the name, facts as mono label over mono value, a muted reason, and an outlined "Swap in". Taken: surface-2 with a 1.5px brand-400 border and the quiet "Swapped in · Undo" button. Option cards sit three across. The section carries an "Options, not recommendations" tag. |
| Plan card | see `UpgradeView.vue` `.plan` | Two cards side by side, 36px padding: mono label, a 28px title, the price in Anton (`.stat-md`) with a muted qualifier beside it, then a list with hairlines between rows. The card that carries the action has a 1.5px brand-400 border and the sun button; the other has neither. |
| Dialog | `UiModal.vue` | A surface card (radius 28, 1px border) centred on a dark scrim. Opens with focus inside and gives it back on close; Escape or a click on the scrim closes it. A tag, a 28px title, one muted sentence, then the progress bar or the buttons. |
| State badge | `.tag.tag-pass`, `ConnectedBadge.vue` | The green filled tag for a good standing state: "Connected: Alpaca", "No conflicts found", "Sent to Alpaca (simulated)". |
| Chooser row | see `ConnectView.vue` `.broker` | A list row with a 60px tile, a name (19/600), a capability line with a state dot, a small note, and one outlined button at the right. Dot colours: green can act, sun case by case, brand-400 list only. |
| Side pill | see `TradesView.vue` `.side` | Mono 12px capitals in a pill: Sell on surface-2 with white text, Buy on cream with ink text. The two sides differ by fill, not by red and green. |
| Feed card | see `AlertsView.vue` `.alert` | From the Receipts frame: a card with 24px padding; a mono label row with a 10px category dot at the left and one quiet action at the right; a 24/500 sentence; a mono 13px meta line with the ticker in the link colour. Read cards mute the sentence. |
| Locked preview | see `AlertsView.vue` `.lock` | A card with a 1.5px brand-400 border: a sun-dot tag "Locked · paid plan", a title, one sentence, and the sun button to the upgrade screen. The nav tab carries a 13px lock in sun. |
| Empty state | dashed box, centred | Mono label, a 20px semibold sentence saying what is missing, and the one button that fixes it. |
| Notice line | see `WhatIfView.vue` `.tax` | A single muted sentence with a sun dot, on the page ground, for things the user should know but not act on here (the tax note). |
| Badge | `.badge`, `.badge-sun` | Small filled pill for counts ("2 unread"). |
| Ticker tile | `.ticker-tile` (52px), `.ticker-tile-lg` (60px) | Surface-2 square, mono symbol in cream. |
| Dot grid | `DotGrid.vue` | "1 dot = $1": 100 dots of 26px, 10px gap, coloured by segment. |
| Bar | `.bar` | 10px pill track with a sun (or muted) fill. |
| Receipt | `ReceiptPaper.vue` | 448px on the landing page, 416px (`compact`) in the app. Variants: full, `skeleton` (not printed yet), `behind`. Zero-conflict total is ink, not flare. |
| Legend / stat column | see `PortfolioResult.vue` | Label (15/600), mono value (22), muted detail (13). |
| Selectable row | see `PortfolioFirstVisit.vue` | 1px hairline border; selected gets surface-2 and a 1.5px brand-400 border, plus a filled radio. |
| Step list | see `PortfolioScanning.vue` | 44px numbered marker: sun filled (done), brand-300 outline (now), border outline (waiting); mono status on the right. |
| Status list | see `PortfolioUnavailable.vue` | 10px dot, title + detail, mono status right, hairline under each row. |

## Charts

One chart so far: growth of $10,000 on What-if (`GrowthChart.vue`). Hand-drawn SVG, no chart library.

- **One y-axis.** Two measures on different scales get two charts, never a second axis.
- **Lines are 2px with round joins.** Grid lines are 1px solid hairlines; axis text is 12px mono in muted.
- **Line colours** come from `src/config/chart.ts`: portfolio as it is `#e85a2a` (flare), what-if `#b98a1e` (gold), S&P 500 `#5a6bf6` (brand blue). They were checked with a palette validator against the card surface: same lightness band, separable for colour-blind readers, 3:1 or better against the card. Brand sun is too light to sit in that band, hence the deeper gold. Do not add a fourth line colour without re-running the check.
- **Text never wears the line colour.** Legends, end labels, tooltip rows and tables use text tokens next to a short stroke of the colour.
- **Identity is never colour alone:** a legend above the plot and a direct label (name and final value) at the end of each line.
- **Hover is on by default:** a crosshair that snaps to the nearest date and one tooltip listing every series, value first. The same works from the keyboard (focus the chart; arrow keys, Home, End).
- **A table view** sits under every chart ("View as a table") with the start, each year-end and the end.
- When two lines coincide (an S&P 500 fund against the S&P 500), say so in the caption.

## States every data screen needs

Each has a frame, so build all of them: **first visit** (nothing chosen; explain the steps, skeleton receipt), **loading** (headline says what is happening, progress bar, step list, cancel), **result**, **zero result** (green, "for now", say what was checked), **unavailable** (say it is not zero, keep the user's choices, offer retry and a way out).

## Voice

Plain and direct. Short sentences with a full stop. "Your lines. Your call." Rally shows; it does not advise: never "you should", always "options". State what did not happen ("Nothing moves automatically.", "No account connected.").
