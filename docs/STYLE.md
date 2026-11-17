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

Line colours (dot before a line's name, in this order when lines are listed): flare, sun, violet, signal, bubblegum, then brand-300 and cream.

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
| Chip | `.chip`, `.chip-add`, `LineChips.vue` | A selected line: surface-2 pill, 10px colour dot, name, ×. Dashed chip adds one. |
| Badge | `.badge`, `.badge-sun` | Small filled pill for counts ("2 unread"). |
| Ticker tile | `.ticker-tile` (52px), `.ticker-tile-lg` (60px) | Surface-2 square, mono symbol in cream. |
| Dot grid | `DotGrid.vue` | "1 dot = $1": 100 dots of 26px, 10px gap, coloured by segment. |
| Bar | `.bar` | 10px pill track with a sun (or muted) fill. |
| Receipt | `ReceiptPaper.vue` | 448px on the landing page, 416px (`compact`) in the app. Variants: full, `skeleton` (not printed yet), `behind`. Zero-conflict total is ink, not flare. |
| Legend / stat column | see `DashboardResult.vue` | Label (15/600), mono value (22), muted detail (13). |
| Selectable row | see `DashboardFirstVisit.vue` | 1px hairline border; selected gets surface-2 and a 1.5px brand-400 border, plus a filled radio. |
| Step list | see `DashboardScanning.vue` | 44px numbered marker: sun filled (done), brand-300 outline (now), border outline (waiting); mono status on the right. |
| Status list | see `DashboardUnavailable.vue` | 10px dot, title + detail, mono status right, hairline under each row. |
| Empty box | dashed 1px border, radius 20 | "Nothing here yet" areas. Never a filled card. |

## States every data screen needs

Each has a frame, so build all of them: **first visit** (nothing chosen; explain the steps, skeleton receipt), **loading** (headline says what is happening, progress bar, step list, cancel), **result**, **zero result** (green, "for now", say what was checked), **unavailable** (say it is not zero, keep the user's choices, offer retry and a way out).

## Voice

Plain and direct. Short sentences with a full stop. "Your lines. Your call." Rally shows; it does not advise: never "you should", always "options". State what did not happen ("Nothing moves automatically.", "No account connected.").
