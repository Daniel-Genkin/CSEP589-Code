# Seed data scripts

The app makes no network calls. Everything it shows is generated here, ahead of time, and saved under `src/data/seed/generated/`. The app reads those files only through `SeededProvider` (`src/data/seeded.ts`).

| Script | Run? | Writes | What it does |
| --- | --- | --- | --- |
| `pull_prices.py` | Yes, run on 2026-11-16 | `securities.json`, `funds.json`, `prices.json` | Pulls names, Yahoo Finance sector and industry, market cap, last close and about five years of daily adjusted closes for every ticker in `universe.json`. Fund holdings are weighted by market cap. |
| `placeholder_tags.py` | Yes | `tags.json` | Placeholder values tags: industry-label rules plus a short hand-checked list. Stands in for the script below. |
| `tag_values.py` | **No** | `out/tags.candidate.json`, then `tags.json` with `--promote` | The real tagging step: Claude searches the web for each company and proposes tags with a strength, a reason and a source link. Needs an Anthropic credential and a human review of every tag before `--promote`, which replaces the tags of the researched companies and leaves the rest of `tags.json` alone. |

```bash
python3 -m venv .venv && . .venv/bin/activate
pip install yfinance pandas          # for pull_prices.py
python scripts/data/pull_prices.py
python scripts/data/placeholder_tags.py

pip install anthropic                # for tag_values.py, when the team is ready to run it
python scripts/data/tag_values.py --only XOM LMT    # try two companies first
```

After changing any generated file, run `npm test`: `src/data/seeded.test.ts` checks the seed against the PRD's contract (counts, weights summing to 1, three alternatives for every flagged company, sources on every tag, five years of prices).

## What is real and what is a sample

- **Real:** tickers, company names, Yahoo Finance sector and industry labels, prices (window fixed in `universe.json`, 2021-11-01 to 2026-10-30).
- **Sample:** which companies each fund holds and at what weight. `funds.json` is a 60-company cut of the largest names, weighted by market cap, not the funds' actual holdings. SPY and VOO track the same index, so they share one list.
- **Placeholder:** values tags (see above), the two sample portfolios in `src/data/seed/portfolios.ts`, and the eight alerts in `src/data/seed/alerts.ts`.

## Choices worth knowing about

- GEO and CXW (private prisons) and CCJ, UEC, LEU (uranium) are not in the S&P 500. They are in the universe because the PRD needs a private-prisons category and three same-sector alternatives for every flagged company, and almost every S&P 500 energy company is an oil and gas company.
- A re-run is close to but not exactly the same as the committed files: market caps and names come from Yahoo's current profile, and Yahoo restates adjusted closes after each later dividend or split. The committed files are the seed; regenerate them on purpose, not as part of a build.
- Several drug makers have no animal-testing tag in the placeholder because no source page was checked for them. The tagging script is expected to fill that in.
