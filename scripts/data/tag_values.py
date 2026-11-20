#!/usr/bin/env python3
"""Generate values tags for the seed with Claude (run by a programmer, never at runtime).

NOT RUN YET. It needs an Anthropic credential and a human spot-check of the output, so the seed
currently ships the rule-based placeholder from placeholder_tags.py instead.

For each company in src/data/seed/generated/securities.json and each of the seven featured
categories, Claude searches the web (filings, the company's own pages, SIPRI, federal contract
records, news) and decides whether the company belongs in the category. Each tag carries a
strength of 1 to 3, a one-line reason and a source link. Where no source supports a tag there is
no tag. Each candidate records whether its link was among the pages the search returned
("sourceSeenInSearch"); treat a false there as a link that may be invented and check it first.

Two requests per company:
  1. research  - web search on, free-text findings with the pages they came from
  2. extract   - no tools, structured output, turns the findings into tag rows

Usage:
    pip install anthropic
    export ANTHROPIC_API_KEY=...          # or `ant auth login`
    python scripts/data/tag_values.py                 # tag every company (resumable)
    python scripts/data/tag_values.py --only XOM LMT  # tag a few
    python scripts/data/tag_values.py --promote       # after review: write approved tags to tags.json

The run writes scripts/data/out/tags.candidate.json, one entry per company, and can be stopped
and restarted: finished companies are skipped. Review that file by hand, set "approved": true on
every tag you accept (check the link says what the reason says), then run --promote.

--promote replaces the tags of the companies in the candidate file with their approved tags and
leaves every other company's tags in tags.json as they are, so a partial run is safe to promote.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from urllib.parse import urlsplit

import anthropic

HERE = Path(__file__).resolve().parent
SEED = HERE.parent.parent / "src" / "data" / "seed" / "generated"
CANDIDATES = HERE / "out" / "tags.candidate.json"

MODEL = "claude-opus-5-5"
# On a policy decline the API re-runs the request on a fallback model inside the same call.
FALLBACK_BETA = "server-side-fallback-2026-07-01"
MAX_SEARCHES = 8
MAX_CONTINUATIONS = 6

CATEGORIES = {
    "defense": "Defense and weapons: makes weapons or weapons systems, or is a major military contractor (for example, listed in the SIPRI Top 100 arms producers).",
    "fossil_fuels": "Fossil fuels: explores for, produces, refines, transports or sells oil, gas or coal, or sells services to companies that do.",
    "private_prisons": "Private prisons: owns or operates prisons, jails or immigration detention centers under government contract.",
    "tobacco": "Tobacco: makes or sells tobacco or nicotine products as a line of business.",
    "alcohol": "Alcohol: makes or sells beer, wine or spirits as a line of business.",
    "gambling": "Gambling: owns or operates casinos, betting or gaming businesses.",
    "animal_testing": "Animal testing: tests products or ingredients on animals, or uses animals in research, as described by the company or a regulator.",
}

RESEARCH_SYSTEM = f"""You research one publicly traded company for a tool that shows investors which of their holdings fall into values categories they care about. Your findings are shown to users next to a source link, so they must be accurate and checkable.

The categories:
{chr(10).join(f"- {key}: {text}" for key, text in CATEGORIES.items())}

For the company you are given, search the web and decide, category by category, whether it belongs. Prefer primary sources: the company's annual report (10-K) or its own website, regulator and government records, SIPRI for arms producers. Use reputable news only when no primary source covers it.

A company belongs in a category only when a page you actually retrieved supports it. Most companies belong in none of the seven, and saying so is a correct and useful answer. Do not stretch a category to fit: a bank that lends to oil companies is not a fossil-fuel company, and a retailer that sells beer is not an alcohol company unless selling alcohol is a business it reports.

Strength reflects how central the activity is to the company:
- 3: a core business, or most of its revenue
- 2: a significant segment or a material, ongoing activity
- 1: a minor or indirect involvement that a careful investor would still want to know about

Write your findings as plain text. For each category the company belongs in, give the strength, one sentence saying what the company does that puts it there, and the exact URL of the one page that best supports it. Then list the categories you checked and found no support for."""

EXTRACT_SYSTEM = """You turn research notes about one company into tag rows. Include a row only for categories the notes say the company belongs in, with a source URL copied exactly from the notes. If the notes are unsure about a category or give no URL for it, leave that category out. The reason is one plain sentence, under 140 characters, stating what the company does, with no hedging words and no mention of the research process."""

TAG_SCHEMA = {
    "type": "object",
    "properties": {
        "tags": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "category": {"type": "string", "enum": list(CATEGORIES)},
                    "strength": {"type": "integer", "enum": [1, 2, 3]},
                    "reason": {"type": "string"},
                    "sourceUrl": {"type": "string"},
                },
                "required": ["category", "strength", "reason", "sourceUrl"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["tags"],
    "additionalProperties": False,
}


def url_key(url: str) -> str:
    """A URL reduced to host and path, so http/https, "www.", a trailing slash, a query string or a fragment do not make two links differ."""
    parts = urlsplit(url.strip())
    host = parts.netloc.lower().removeprefix("www.")
    return f"{host}{parts.path.rstrip('/')}"


def research(client: anthropic.Anthropic, security: dict) -> tuple[str, set[str]]:
    """Search the web about one company. Returns the findings and every URL the search returned or cited."""
    messages = [
        {
            "role": "user",
            "content": (
                f"Company: {security['name']} (ticker {security['ticker']}). "
                f"Yahoo Finance lists it under sector \"{security['sector']}\", industry \"{security['industry']}\"."
            ),
        }
    ]
    seen_urls: set[str] = set()
    findings: list[str] = []
    for _ in range(MAX_CONTINUATIONS):
        response = client.beta.messages.create(
            model=MODEL,
            max_tokens=16000,
            betas=[FALLBACK_BETA],
            fallbacks="default",
            output_config={"effort": "high"},
            system=RESEARCH_SYSTEM,
            tools=[{"type": "web_search_20260209", "name": "web_search", "max_uses": MAX_SEARCHES}],
            messages=messages,
        )
        for block in response.content:
            # A successful search result is a list of pages; an error is a single object.
            if block.type == "web_search_tool_result" and isinstance(block.content, list):
                seen_urls.update(url_key(result.url) for result in block.content)
            elif block.type == "text":
                # Text can arrive before a pause as well as after it; keep all of it.
                findings.append(block.text)
                for citation in block.citations or []:
                    if getattr(citation, "url", None):
                        seen_urls.add(url_key(citation.url))
        if response.stop_reason == "pause_turn":
            # A long search turn paused; send it back so the server continues it.
            messages.append({"role": "assistant", "content": response.content})
            continue
        if response.stop_reason == "refusal":
            raise RuntimeError(f"Request declined for {security['ticker']}")
        if response.stop_reason == "max_tokens":
            raise RuntimeError(f"Research for {security['ticker']} ran out of output tokens")
        return "\n".join(findings).strip(), seen_urls
    raise RuntimeError(f"Research for {security['ticker']} did not finish after {MAX_CONTINUATIONS} continuations")


def extract(client: anthropic.Anthropic, security: dict, findings: str) -> list[dict]:
    """Turn findings into tag rows with a guaranteed shape."""
    response = client.beta.messages.create(
        model=MODEL,
        max_tokens=16000,  # thinking counts against this, so leave room well beyond the JSON itself
        betas=[FALLBACK_BETA],
        fallbacks="default",
        output_config={"effort": "low", "format": {"type": "json_schema", "schema": TAG_SCHEMA}},
        system=EXTRACT_SYSTEM,
        messages=[{"role": "user", "content": f"Research notes for {security['name']} ({security['ticker']}):\n\n{findings}"}],
    )
    if response.stop_reason != "end_turn":
        raise RuntimeError(f"Extraction for {security['ticker']} stopped with {response.stop_reason}")
    try:
        text = next(block.text for block in response.content if block.type == "text")
        return json.loads(text)["tags"]
    except (StopIteration, json.JSONDecodeError, KeyError) as error:
        raise RuntimeError(f"Extraction for {security['ticker']} returned no usable JSON ({type(error).__name__})") from error


def tag_company(client: anthropic.Anthropic, security: dict) -> dict:
    findings, seen_urls = research(client, security)
    tags = [
        # A link the search never returned may be invented: say so, and let the reviewer decide.
        {"ticker": security["ticker"], **tag, "sourceSeenInSearch": url_key(tag["sourceUrl"]) in seen_urls, "approved": False}
        for tag in extract(client, security, findings)
    ]
    return {"ticker": security["ticker"], "name": security["name"], "tags": tags, "findings": findings}


def load_candidates() -> dict:
    return json.loads(CANDIDATES.read_text()) if CANDIDATES.exists() else {}


def promote() -> int:
    candidates = load_candidates()
    if not candidates:
        print(f"Nothing to promote: {CANDIDATES} does not exist yet.", file=sys.stderr)
        return 1
    approved = [
        {key: tag[key] for key in ("ticker", "category", "strength", "reason", "sourceUrl")}
        for entry in candidates.values()
        for tag in entry["tags"]
        if tag.get("approved")
    ]
    waiting = sum(1 for entry in candidates.values() for tag in entry["tags"] if not tag.get("approved"))
    if not approved:
        print(f'No tag in {CANDIDATES} is marked "approved": true, so tags.json was left alone.', file=sys.stderr)
        return 1
    # Companies that were not researched keep the tags they have (the placeholder ones, at first).
    seed_path = SEED / "tags.json"
    existing = json.loads(seed_path.read_text())["tags"] if seed_path.exists() else []
    untouched = [tag for tag in existing if tag["ticker"] not in candidates]
    tags = sorted(untouched + approved, key=lambda tag: (tag["category"], tag["ticker"]))
    reviewed = f"{len(candidates)} companies tagged by Claude ({MODEL}) with web search and approved by a human reviewer."
    out = {
        "meta": {
            "status": reviewed if not untouched else f"MIXED: {reviewed} {len(untouched)} tags on other companies are still placeholders.",
            "generatedBy": "scripts/data/tag_values.py",
        },
        "tags": tags,
    }
    seed_path.write_text(json.dumps(out, indent=1) + "\n")
    print(f"Wrote {len(approved)} approved tags and kept {len(untouched)} existing ones in {seed_path}. {waiting} candidate tags are unapproved and were left out.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--only", nargs="+", metavar="TICKER", help="tag only these tickers")
    parser.add_argument("--redo", action="store_true", help="tag again even if a company is already in the candidate file")
    parser.add_argument("--promote", action="store_true", help="write approved candidate tags to the seed's tags.json")
    args = parser.parse_args()
    if args.promote:
        return promote()

    securities = [s for s in json.loads((SEED / "securities.json").read_text())["securities"] if s["kind"] == "stock"]
    if args.only:
        wanted = {ticker.upper() for ticker in args.only}
        securities = [s for s in securities if s["ticker"] in wanted]

    client = anthropic.Anthropic()  # credentials come from the environment or `ant auth login`
    candidates = load_candidates()
    CANDIDATES.parent.mkdir(parents=True, exist_ok=True)
    failures = 0
    for index, security in enumerate(securities, start=1):
        ticker = security["ticker"]
        if ticker in candidates and not args.redo:
            continue
        try:
            candidates[ticker] = tag_company(client, security)
        except anthropic.RateLimitError:
            print("Rate limited. Run the script again later; finished companies are kept.", file=sys.stderr)
            return 1
        except (anthropic.APIStatusError, anthropic.APIConnectionError, RuntimeError) as error:
            failures += 1
            print(f"[{index}/{len(securities)}] {ticker}: failed, will retry on the next run ({error})", file=sys.stderr)
            continue
        # Save after every company so a stopped run loses nothing.
        CANDIDATES.write_text(json.dumps(candidates, indent=1) + "\n")
        entry = candidates[ticker]
        found = ", ".join(tag["category"] for tag in entry["tags"]) or "no categories"
        unseen = sum(1 for tag in entry["tags"] if not tag["sourceSeenInSearch"])
        print(f"[{index}/{len(securities)}] {ticker}: {found}" + (f" ({unseen} with a link the search did not return: check first)" if unseen else ""))
    print(f"Candidates are in {CANDIDATES}. Review them, mark accepted tags approved, then run with --promote.")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
