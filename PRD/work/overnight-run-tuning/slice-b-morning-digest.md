# Slice B — morning digest script

## Status: done

## Goal

Give the owner one read-only command that summarizes what the night's run(s) did
and which base→main PRs are still pending.

## Requirements

1. Add `scripts/graph-digest.mjs`. It is **read-only**: it makes no writes and no
   network *mutation* (a read-only `gh pr list` query is allowed).
2. Structure it like the other graph scripts: a pure formatter
   `formatDigest({ ledgers, receipts, openBaseToMainPRs })` that returns the
   printed string, plus a thin I/O shell that gathers the inputs and prints it.
3. Inputs the shell gathers: every `PRD/work/*/GRAPH-RUN.md` (parse
   `Current node`, the terminal/`## Open gate` state, and the open-gate resume
   command / questions-file path), `PRD/instructions/receipts/*.md` (recent
   receipts), and `gh pr list --base main --state open --json headRefName,url`
   filtered to `thejudge-auto/*` heads.
4. Output per package: terminal/park state, current node, the `GATE-QUESTIONS.md`
   path if it is parked at an async gate, and — as its own section — every
   pending base→main PR with its url. Missing inputs degrade gracefully (a
   package with no ledger is skipped, not an error).
5. Wire `graph:digest` into `package.json` (`"graph:digest": "node
   scripts/graph-digest.mjs"`).
6. Cover `formatDigest` in `scripts/graph-digest.test.mjs`: a parked package with
   a questions file, a completed package, a pending base→main PR, and the
   empty/no-input case.

## Acceptance criteria

- [x] B1 — `npm run test:scripts` passes with the new `formatDigest` cases. (420 pass)
- [x] B2 — `formatDigest` is pure (deterministic string from its args, no I/O).
- [x] B3 — `npm run graph:digest` runs without writing any file and prints a
  per-package summary plus a pending base→main PR section. (see `slice-b.evidence.md`)
- [x] B4 — `graph:digest` is registered in `package.json`.

## Verification

```bash
npm run test:scripts
node --test scripts/graph-digest.test.mjs
git stash list >/dev/null; before=$(git status --porcelain); npm run graph:digest; after=$(git status --porcelain); [ "$before" = "$after" ] && echo "read-only OK"
```

## Files touched

- `scripts/graph-digest.mjs`
- `scripts/graph-digest.test.mjs`
- `package.json`
