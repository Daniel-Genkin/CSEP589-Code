# Rally v1 build task

You are building the Rally desktop demo described in docs/PRD.md. Work autonomously to the end; I may not be watching. Do not stop to ask questions.

## Context
- Repo: Daniel-Genkin/CSEP589-Code. Rally lives on branch rally-restyle (NOT main, which is an old app).
- Figma (source of truth for the look): https://www.figma.com/design/0TV8YD5J0HeUampygg1DqE/Rallie-Dashboard--Copy-?node-id=81-210
  Frames: Landing 97:210, Dashboard 81:211, Receipts 93:212, First visit 81:1007, Scanning 81:1124,
  Zero conflicts 81:1254, Data unavailable 81:1520, Mobile dashboard 81:1629 (ignore mobile for v1).
  PNG exports of every frame are in design/.
- Placeholder inputs are fine for now: yfinance output, the team's Python back-test script,
  the sample portfolio holdings, and Claude-generated values tags.

## Rules
- Branches and PRs: you start on rally-v1/01-redesign, which branches from rally-restyle. Stack PRs:
  each new branch starts from the previous one, and its PR's base is that branch (PR 1's base is
  rally-restyle). Title them "[n/N] ...". Never merge. Never push to main or rally-restyle.
- Keep docs/PROGRESS.md updated after every PR: what's done, what's next, open conflicts, placeholders.
  If your context resets or is compacted, read docs/PROGRESS.md and docs/STYLE.md first.
- Conflicts between Figma, the PRD and the existing code: do not stop to ask. Use Figma for the look and
  the PRD for behavior, log the conflict in PROGRESS.md and the PR description, and continue.
- Screens with no Figma frame: build them from docs/STYLE.md so they look like part of the same
  design, and list them in PROGRESS.md for design review.
- Before each PR: npm run build passes, unit tests pass, run /code-review on the diff and fix real issues,
  and take Playwright screenshots of changed screens at 1440 px and compare them to Figma.
- Never commit secrets or API keys. Do not deploy to Vercel. The app makes no runtime network calls.
- Data scripts: you may write and run a yfinance price-pull script. Write the Claude tagging script but
  don't run it (it needs a key and human spot-checking); leave that as an issue.

## Phase 1: Redesign
Read the PRD. For each Figma frame, use the Figma MCP to get its design context (generated code),
its variables (colors, type, spacing) and a screenshot. If the Figma MCP fails or hits a limit,
use the PNGs in design/ instead. Treat the generated code as a reference for exact values, not
code to paste: translate it into the existing Vue components and the repo's CSS tokens.
Write a short style guide in docs/STYLE.md (tokens, type scale, spacing, component patterns)
learned from the frames, and use it for every screen, including screens with no Figma frame.
Write in PROGRESS.md how each frame maps to the PRD's routes. Restyle the existing app to match
Figma, then open PR 1. Commit docs/PRD.md, docs/AGENT_TASK.md, docs/STYLE.md and design/ in this PR.

## Phase 2: PRD requirements
Follow the PRD's suggested order: app shell and routing, data layer and seed loading (DataProvider,
SeededProvider), domain functions with unit tests, then one PR per screen (F1 to F4, then F5 to F9).
Finish each requirement to its acceptance criteria where possible. Where something needs a human
(real data, the reference back-test script, API keys, design decisions), build as far as you can,
use a clearly marked placeholder, and note what's left. Finish by running the PRD's demo script
end to end and recording which steps pass.

## Phase 3: GitHub issues
Create issues with gh for everything that needs human work: incomplete requirements, placeholders
to replace, things to verify, design review of screens without frames. Group them into about 6 to 7
issues, each a sensible chunk for one engineer (fewer if that's all there is; don't pad).
Each issue: title, PRD requirement(s) it relates to, labels (F1-F9, P0/P1, needs-human; create the
labels if missing), a checklist of acceptance criteria, and links to the relevant PRs.

## Final report
Post a summary in this session: every PR link in order, every issue link, demo-script results
by step, and the open conflicts and placeholders.
