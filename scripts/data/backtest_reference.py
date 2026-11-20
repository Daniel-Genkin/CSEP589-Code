#!/usr/bin/env python3
"""Reference back-test for the What-if screen (PLACEHOLDER for the team's verified script).

The PRD says the team's existing Python back-test script is the reference and that the app's
TypeScript (src/domain/backtest.ts) is a port of it. That script has not been shared, so this
file stands in for it: an independent pandas implementation of the same documented method,
used to check the TypeScript number for number. When the team's script arrives, replace this
file, re-run it, and look into any difference reported by src/domain/backtest.reference.test.ts
(a code bug gets fixed; a difference that comes from the data or the method gets reported).

Method
  * A position is a stock, or a fund held as one unit. A fund is back-tested on its own price
    history, so an untouched SPY position tracks the S&P 500 exactly.
  * Excluding a company that sits inside a fund turns the fund into "the fund without it":
    daily return (fund - weight x company) / (1 - weight), holding (1 - weight) of the position.
  * Each excluded holding's weight goes to its swapped-in alternative if it has one; the rest
    is spread across everything that remains, in proportion to weight.
  * Fixed target weights, rebalanced every trading day: the daily return is the weighted sum
    of the holdings' daily returns. Growth compounds from $10,000.
  * Benchmark: SPY adjusted close, scaled to $10,000.
  * Annualized return: compound annual growth rate over the calendar span of the price window.

    pip install pandas
    python scripts/data/backtest_reference.py     # writes src/domain/__fixtures__/backtest_reference.json
"""
from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
SEED = ROOT / "src" / "data" / "seed" / "generated"
OUT = ROOT / "src" / "domain" / "__fixtures__" / "backtest_reference.json"

START_USD = 10_000.0
FEATURED = ["defense", "fossil_fuels", "private_prisons", "tobacco", "alcohol", "gambling", "animal_testing"]

# The two sample portfolios, as percentages (kept in step with src/data/seed/portfolios.ts).
SAMPLE = {"AAPL": 15, "MSFT": 12, "NVDA": 10, "AMZN": 10, "GOOGL": 8, "XOM": 8, "TSLA": 7, "COST": 7, "LMT": 6, "DIS": 6, "JPM": 6, "MO": 5}
CONNECTED = {
    "VOO": 30, "VTI": 12, "AAPL": 6, "MSFT": 6, "NVDA": 5, "AMZN": 4, "GOOGL": 4, "META": 3, "TSLA": 3, "JPM": 3, "XOM": 2.5, "NEE": 2.5, "V": 2,
    "UNH": 2, "LLY": 2, "LMT": 2, "CVX": 1.5, "PM": 1.5, "DIS": 1.5, "HD": 1.5, "COST": 1.5, "RTX": 1, "STZ": 1, "LVS": 1, "GEO": 0.5,
}  # fmt: skip


def load() -> tuple[pd.DataFrame, dict[str, dict[str, float]], dict[str, set[str]], str]:
    raw = json.loads((SEED / "prices.json").read_text())
    returns = pd.DataFrame(raw["closes"], index=pd.to_datetime(raw["dates"])).pct_change().fillna(0.0)
    funds = {ticker: {h["ticker"]: h["weight"] for h in fund["holdings"]} for ticker, fund in json.loads((SEED / "funds.json").read_text())["funds"].items()}
    tagged: dict[str, set[str]] = {}
    for tag in json.loads((SEED / "tags.json").read_text())["tags"]:
        tagged.setdefault(tag["category"], set()).add(tag["ticker"])
    return returns, funds, tagged, raw["meta"]["benchmark"]


def grow(daily: pd.Series) -> pd.Series:
    return START_USD * (1.0 + daily).cumprod()


def annualized_pct(series: pd.Series) -> float:
    years = (series.index[-1] - series.index[0]).days / 365.25
    return ((series.iloc[-1] / series.iloc[0]) ** (1.0 / years) - 1.0) * 100.0


def backtest(positions: dict[str, float], exclusions: dict, returns: pd.DataFrame, funds: dict[str, dict[str, float]], tagged: dict[str, set[str]]):
    """positions: ticker -> fraction of the portfolio. Returns (original, filtered) daily return series."""
    original = sum(weight * returns[ticker] for ticker, weight in positions.items())

    blocked = set(exclusions["tickers"])
    for category in exclusions["categories"]:
        blocked |= tagged.get(category, set())

    # Break the portfolio into pieces that stay (each with a weight and a daily return series)
    # and the weight that leaves, per excluded company.
    pieces: list[tuple[float, pd.Series]] = []
    leaving: dict[str, float] = {}
    for ticker, weight in positions.items():
        if ticker in funds:
            inside = funds[ticker]
            out = {c: w for c, w in inside.items() if c in blocked}
            gone = sum(out.values())
            for company, w in out.items():
                leaving[company] = leaving.get(company, 0.0) + weight * w
            if gone < 1.0:
                ex_fund = (returns[ticker] - sum(w * returns[c] for c, w in out.items())) / (1.0 - gone)
                pieces.append((weight * (1.0 - gone), ex_fund))
        elif ticker in blocked:
            leaving[ticker] = leaving.get(ticker, 0.0) + weight
        else:
            pieces.append((weight, returns[ticker]))

    if not leaving:
        return original, original

    # A swap only counts if its holding is leaving and the alternative is not itself excluded.
    swaps = {src: dst for src, dst in exclusions["swaps"].items() if src in leaving and dst not in blocked}
    swapped = sum(leaving[src] for src in swaps)
    unswapped = sum(w for company, w in leaving.items() if company not in swaps)
    remaining = sum(w for w, _ in pieces)

    zero = pd.Series(0.0, index=returns.index)
    if remaining > 0:
        scale = (remaining + unswapped) / remaining
        filtered = sum((w * scale * series for w, series in pieces), zero) + sum((leaving[src] * returns[dst] for src, dst in swaps.items()), zero)
    elif swapped > 0:
        filtered = sum((leaving[src] / swapped * returns[dst] for src, dst in swaps.items()), zero)  # only swapped-in names are left
    else:
        filtered = zero  # everything excluded: cash
    return original, filtered


def main() -> None:
    returns, funds, tagged, benchmark = load()
    portfolios = {
        "SPY": {"SPY": 1.0},
        "sample": {t: p / 100 for t, p in SAMPLE.items()},
        "connected": {t: p / 100 for t, p in CONNECTED.items()},
    }
    none: dict = {"categories": [], "tickers": [], "swaps": {}}
    scenarios = [("SPY", f"exclude {c}", {**none, "categories": [c]}) for c in FEATURED]
    scenarios += [
        ("SPY", "exclude nothing", none),
        ("SPY", "exclude all seven", {**none, "categories": FEATURED}),
        # The demo script deselects two categories in Values, then excludes "all" in What-if: the five that are left.
        ("SPY", "exclude the five left without fossil fuels and private prisons", {**none, "categories": [c for c in FEATURED if c not in ("fossil_fuels", "private_prisons")]}),
        ("SPY", "exclude XOM by ticker", {**none, "tickers": ["XOM"]}),
        ("SPY", "exclude fossil fuels, swap XOM for CCJ", {**none, "categories": ["fossil_fuels"], "swaps": {"XOM": "CCJ"}}),
        ("sample", "exclude all seven", {**none, "categories": FEATURED}),
        ("sample", "exclude tobacco, swap MO for WMT", {**none, "categories": ["tobacco"], "swaps": {"MO": "WMT"}}),
        ("connected", "exclude all seven", {**none, "categories": FEATURED}),
        ("connected", "exclude defense and TSLA", {**none, "categories": ["defense"], "tickers": ["TSLA"]}),
        ("connected", "exclude fossil fuels, swap XOM for CCJ", {**none, "categories": ["fossil_fuels"], "swaps": {"XOM": "CCJ"}}),
    ]

    bench = grow(returns[benchmark])
    results = []
    for name, label, exclusions in scenarios:
        original, filtered = backtest(portfolios[name], exclusions, returns, funds, tagged)
        g_original, g_filtered = grow(original), grow(filtered)
        row = {
            "portfolio": name,
            "label": label,
            "exclusions": exclusions,
            "annualizedPct": {"original": annualized_pct(g_original), "filtered": annualized_pct(g_filtered), "benchmark": annualized_pct(bench)},
            "endUsd": {"original": float(g_original.iloc[-1]), "filtered": float(g_filtered.iloc[-1]), "benchmark": float(bench.iloc[-1])},
            # A few points along the way, so the whole series is checked, not only its end.
            "checkpoints": {str(i): float(g_filtered.iloc[i]) for i in (1, 250, 625, 1000)},
        }
        results.append(row)
        diff = row["annualizedPct"]["filtered"] - row["annualizedPct"]["original"]
        print(f"{name:10} {label:42} original {row['annualizedPct']['original']:6.2f}%  filtered {row['annualizedPct']['filtered']:6.2f}%  diff {diff:+.2f} pts")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps(
            {
                "meta": {
                    "status": "PLACEHOLDER reference: written for this build because the team's verified script was not available.",
                    "generatedBy": "scripts/data/backtest_reference.py",
                    "window": [str(returns.index[0].date()), str(returns.index[-1].date())],
                    "benchmark": benchmark,
                },
                "scenarios": results,
            },
            indent=1,
        )
        + "\n"
    )
    print(f"benchmark {annualized_pct(bench):.2f}% -> {OUT}")


if __name__ == "__main__":
    main()
