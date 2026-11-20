#!/usr/bin/env python3
"""Write PLACEHOLDER values tags for the seed (src/data/seed/generated/tags.json).

This stands in for scripts/data/tag_values.py, the Claude tagging script, which needs an API
key and a human spot-check and has not been run. It only writes tags a plain rule or a public
page supports, so there are no made-up tags on real tickers:

  * "Standard industry labels" categories (fossil fuels, tobacco, alcohol, gambling) come from
    the yfinance industry in securities.json, with the Yahoo Finance quote page as the source.
  * Defense comes from the SIPRI Top 100 arms-producing companies.
  * Private prisons and animal testing are a short hand-checked list with a company page each.

Where no source was checked, the tag is left out (several drug makers have no animal-testing
tag here for that reason). Replace this file's output with the tagging script's once it is run.

    python scripts/data/placeholder_tags.py
"""
from __future__ import annotations

import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
SEED = HERE.parent.parent / "src" / "data" / "seed" / "generated"

SIPRI = "https://www.sipri.org/publications/2024/sipri-fact-sheets/sipri-top-100-arms-producing-and-military-services-companies-2023"

# yfinance industry -> (category, strength, reason)
INDUSTRY_RULES = {
    "Oil & Gas Integrated": ("fossil_fuels", 3, "Explores for, produces and refines oil and natural gas."),
    "Oil & Gas E&P": ("fossil_fuels", 3, "Explores for and produces oil and natural gas."),
    "Oil & Gas Equipment & Services": ("fossil_fuels", 2, "Sells equipment and services to oil and gas producers."),
    "Oil & Gas Midstream": ("fossil_fuels", 2, "Transports and stores oil and natural gas."),
    "Oil & Gas Refining & Marketing": ("fossil_fuels", 3, "Refines and sells oil products."),
    "Thermal Coal": ("fossil_fuels", 3, "Mines coal burned for power."),
    "Tobacco": ("tobacco", 3, "Makes and sells tobacco and nicotine products."),
    "Beverages - Brewers": ("alcohol", 3, "Brews and sells beer and other alcoholic drinks."),
    "Beverages - Wineries & Distilleries": ("alcohol", 3, "Makes and sells wine and spirits."),
    "Resorts & Casinos": ("gambling", 3, "Owns and operates casinos."),
    "Gambling": ("gambling", 3, "Runs betting and gaming businesses."),
}

# ticker -> (category, strength, reason, source)
CURATED = [
    ("LMT", "defense", 3, "Among the world's largest arms producers in the SIPRI Top 100.", SIPRI),
    ("RTX", "defense", 3, "Among the world's largest arms producers in the SIPRI Top 100.", SIPRI),
    ("NOC", "defense", 3, "Among the world's largest arms producers in the SIPRI Top 100.", SIPRI),
    ("GD", "defense", 3, "Among the world's largest arms producers in the SIPRI Top 100.", SIPRI),
    ("BA", "defense", 2, "Listed in the SIPRI Top 100 for its defense business, alongside commercial aircraft.", SIPRI),
    ("GEO", "private_prisons", 3, "Owns and operates private prisons and immigration detention centers.", "https://www.geogroup.com/"),
    ("CXW", "private_prisons", 3, "Owns and operates private prisons and detention centers.", "https://www.corecivic.com/"),
    (
        "PFE",
        "animal_testing",
        2,
        "Uses animals in research where regulators require it, under its published policy.",
        "https://www.pfizer.com/science/clinical-trials/integrity-and-transparency/animals-used-in-research",
    ),
    (
        "JNJ",
        "animal_testing",
        2,
        "Uses animals in research where regulators require it, under its published position.",
        "https://www.jnj.com/about-jnj/policies-and-positions/our-position-on-the-humane-care-and-use-of-animals",
    ),
]


def main() -> None:
    securities = json.loads((SEED / "securities.json").read_text())["securities"]
    known = {s["ticker"] for s in securities}
    tags = []
    for sec in securities:
        rule = INDUSTRY_RULES.get(sec["industry"])
        if rule:
            category, strength, reason = rule
            tags.append(
                {
                    "ticker": sec["ticker"],
                    "category": category,
                    "strength": strength,
                    "reason": f"{reason} Yahoo Finance industry: {sec['industry']}.",
                    "sourceUrl": f"https://finance.yahoo.com/quote/{sec['ticker']}/",
                }
            )
    for ticker, category, strength, reason, source in CURATED:
        if ticker not in known:
            raise SystemExit(f"{ticker} is not in securities.json")
        tags.append({"ticker": ticker, "category": category, "strength": strength, "reason": reason, "sourceUrl": source})
    tags.sort(key=lambda t: (t["category"], t["ticker"]))
    out = {
        "meta": {
            "status": "PLACEHOLDER: rule-based and hand-checked. Not the output of the Claude tagging script, and not yet spot-checked by the team.",
            "generatedBy": "scripts/data/placeholder_tags.py",
        },
        "tags": tags,
    }
    (SEED / "tags.json").write_text(json.dumps(out, indent=1) + "\n")
    by_category: dict[str, int] = {}
    for tag in tags:
        by_category[tag["category"]] = by_category.get(tag["category"], 0) + 1
    print(f"{len(tags)} tags: {by_category}")


if __name__ == "__main__":
    main()
