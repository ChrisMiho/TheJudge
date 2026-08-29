# Slice B evidence

2026-08-28 B3 — ran `npm run graph:digest`; it printed `## Runs`, `## Pending
base→main PRs` (none — main is current), and `## Recent receipts`, and
`git status --porcelain` was byte-identical before and after, confirming it
writes nothing.
