#!/usr/bin/env python3
"""Pull the price and profile data behind the Rally v1 seed (run by a programmer, never at runtime).

    pip install yfinance pandas
    python scripts/data/pull_prices.py            # writes src/data/seed/generated/*.json

Reads scripts/data/universe.json and writes three files the SeededProvider reads:

  securities.json  name, yfinance sector and industry, last close and market cap per ticker
  funds.json       SPY / VOO / VTI sample holdings, weighted by market cap, each summing to 1
  prices.json      about five years of daily adjusted closes for every ticker plus the benchmark

Nothing is randomized or tuned. The date window is fixed in universe.json. A re-run is close to
but not exactly the same: Yahoo restates adjusted closes after every later dividend and split, and
market caps and names come from the current profile. Commit the generated files; they are the seed.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
from pathlib import Path

import pandas as pd
import yfinance as yf

HERE = Path(__file__).resolve().parent
DEFAULT_OUT = HERE.parent.parent / "src" / "data" / "seed" / "generated"


def resolve_funds(spec: dict) -> dict[str, list[str]]:
    """A fund is a list of tickers, the name of another fund (same holdings), or {base, remove, add}."""
    funds: dict[str, list[str]] = {symbol: list(value) for symbol, value in spec.items() if isinstance(value, list)}
    pending = {symbol: value for symbol, value in spec.items() if not isinstance(value, list)}
    while pending:
        ready = [symbol for symbol, value in pending.items() if (value if isinstance(value, str) else value["base"]) in funds]
        if not ready:
            raise SystemExit(f"universe.json: cannot resolve funds {sorted(pending)} (unknown or circular base)")
        for symbol in ready:
            value = pending.pop(symbol)
            if isinstance(value, str):
                funds[symbol] = list(funds[value])
                continue
            base = funds[value["base"]]
            missing = [t for t in value.get("remove", []) if t not in base]
            if missing:
                raise SystemExit(f"universe.json: {symbol} removes {missing}, which {value['base']} does not hold")
            funds[symbol] = [t for t in base if t not in value.get("remove", [])] + list(value.get("add", []))
    return funds


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--universe", type=Path, default=HERE / "universe.json")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()

    universe = json.loads(args.universe.read_text())
    etfs: dict[str, str] = universe["etfs"]
    stocks: list[str] = universe["stocks"]
    funds = resolve_funds(universe["funds"])
    tickers = stocks + list(etfs)
    if len(set(tickers)) != len(tickers):
        raise SystemExit("universe.json lists a ticker twice")
    for fund, members in funds.items():
        unknown = [t for t in members if t not in stocks]
        if unknown:
            raise SystemExit(f"{fund} holds tickers missing from 'stocks': {unknown}")

    # --- prices -----------------------------------------------------------------------------
    start, end = universe["start"], universe["end"]
    raw = yf.download(tickers, start=start, end=end, auto_adjust=False, progress=False, group_by="column", threads=True)
    adj = raw["Adj Close"][tickers]
    close = raw["Close"][tickers]
    first_day = adj.index[0]
    late = [t for t in tickers if pd.isna(adj[t].loc[first_day])]
    if late:
        raise SystemExit(f"No price on {first_day.date()} for {late}: pick tickers listed for the whole window")
    gaps = int(adj.isna().sum().sum())
    adj = adj.ffill()
    close = close.ffill()
    dates = [d.strftime("%Y-%m-%d") for d in adj.index]

    # --- profiles ---------------------------------------------------------------------------
    securities = []
    for ticker in tickers:
        info = yf.Ticker(ticker).info
        is_etf = ticker in etfs
        name = etfs[ticker] if is_etf else (info.get("longName") or info.get("shortName") or ticker)
        sector = "Fund" if is_etf else info.get("sector")
        industry = "Exchange-traded fund" if is_etf else info.get("industry")
        market_cap = None if is_etf else info.get("marketCap")
        if not is_etf and (not sector or not industry or not market_cap):
            raise SystemExit(f"yfinance returned no sector, industry or market cap for {ticker}")
        securities.append(
            {
                "ticker": ticker,
                "name": name,
                "sector": sector,
                "industry": industry,
                "price": round(float(close[ticker].iloc[-1]), 2),
                "kind": "etf" if is_etf else "stock",
                "marketCap": market_cap,
            }
        )
        print(f"{ticker:6} {sector:24} {industry}", file=sys.stderr)
    cap = {s["ticker"]: s["marketCap"] for s in securities}

    # --- fund weights: proportional to market cap, rounded, residual on the largest holding -----
    fund_rows = {}
    for fund, members in funds.items():
        total = sum(cap[t] for t in members)
        weights = {t: round(cap[t] / total, 6) for t in members}
        largest = max(members, key=lambda t: cap[t])
        weights[largest] = round(weights[largest] + (1 - sum(weights.values())), 6)
        ordered = sorted(members, key=lambda t: -weights[t])
        fund_rows[fund] = {"name": etfs[fund], "holdings": [{"ticker": t, "weight": weights[t]} for t in ordered]}

    meta = {
        "source": "Yahoo Finance via yfinance " + yf.__version__,
        "pulledAt": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "start": dates[0],
        "end": dates[-1],
        "benchmark": universe["benchmark"],
    }
    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / "securities.json").write_text(json.dumps({"meta": meta, "securities": securities}, indent=1) + "\n")
    (args.out / "funds.json").write_text(
        json.dumps({"meta": {**meta, "note": "Sample cut of each fund, weighted by market cap. Not the funds' real holdings."}, "funds": fund_rows}, indent=1)
        + "\n"
    )
    prices = {t: [round(float(v), 4) for v in adj[t]] for t in tickers}
    (args.out / "prices.json").write_text(
        json.dumps({"meta": {**meta, "field": "adjusted close", "filledGaps": gaps}, "dates": dates, "closes": prices}, separators=(",", ":")) + "\n"
    )
    print(f"{len(tickers)} tickers, {len(dates)} trading days {dates[0]} to {dates[-1]}, {gaps} gaps forward-filled -> {args.out}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
