# Gameplan — overnight-run-tuning

Package 2 of the docs-refactor. Design record: `DESIGN-BRIEF.md`. This is an
interactive package (not a graph run, not a sweep): it edits `graph-*` skills,
the graph contract, and `scripts/`, which an automated run may not patch on
itself.

## Architecture — what changes and where

Two tested scripts and one coupled prose rewrite, plus a docs closeout.

```
Run one (night)                          Owner (async)            Run two (later)
preflight ─ shape ─ define ─ gate-qc     answers                  /graph-run …
   │                  │          │        GATE-QUESTIONS.md         │
   │                  │          └─ PASS ─► park (owner-action)     ├─ graph-gate-review
   │                  │                     • open base→main PR      │   applies answers
   │                  └─ writes GATE-QUESTIONS.md (non-empty diff)   ├─ re-enter gate-qc
   └─ guard: refuse if a prior base→main PR is still open           └─ plan…build…land…close
```

- **Branch/PR topology (unchanged shape).** `preflight` creates base
  `thejudge-auto/<slug>`. Run one opens the **base→main** PR (docs-only). Run
  two's `build` opens `-work` → base; the owner merges that at `land`; `close`
  pushes the receipt to base. The owner merges the base→main PR last. The
  preflight guard makes that final merge un-skippable for the *next* package.
- **The async gate** replaces the live `graph-gate-review` walk: the define diff
  is written into `GATE-QUESTIONS.md` with one accept/edit/reject slot per stable
  ID; the owner fills it in; `graph-gate-review` becomes the reader that applies
  it in run two.
- **The digest** (`npm run graph:digest`) is a read-only morning summary across
  every package's ledger plus open base→main PRs.

## Data flow / interfaces

- `classifyPendingBaseToMain(openPRs, newBranch)` — pure. Input: the parsed
  `gh pr list --base main --state open --json headRefName,url` array and the
  branch preflight is about to create. Output: `{ block: boolean, reason }`.
  Blocks when any entry's head matches `thejudge-auto/*` and is not `newBranch`.
  A `gh` failure is treated as `block` (fail-closed).
- `graph-digest` — pure formatter over parsed `PRD/work/*/GRAPH-RUN.md`,
  `PRD/instructions/receipts/*.md`, and the open-PR list. No writes, no network
  mutation.
- `GATE-QUESTIONS.md` — one `## <STABLE-ID>` block: plain-product restatement,
  the complete diff, then `- Verdict: <accept | edit | reject>` and
  `- Reason:`. A trailing `## Blocker questions` section for genuine blockers.

## Slices

| Slice | Objective | Depends on |
| --- | --- | --- |
| A | base→main preflight guard (`classifyPendingBaseToMain` + test + skill step) | — |
| B | morning digest script (`graph-digest.mjs` + test + `graph:digest`) | — |
| C | async two-run workflow (contract + `graph-run` + `graph-gate-review`) | A |
| D | loose ends + mirror sync + ship gates | A, B, C |

Sequential: A → B → C → D. A and B are independent tested scripts; C is the
coupled prose rewrite that references the guard; D closes out after every skill
edit so one `skills:ai-sync` captures the mirror.

## Verification checklist

- `npm run test:scripts` green (A, B pure functions).
- `npm run quality:check` green (whole package).
- Node table, per-node models, caps, and the deny list are byte-unchanged
  (grep-assert in C).
- `.agents/skills/` matches `.claude/skills/` after `skills:ai-sync` (D).
- `npm run graph:digest` runs read-only and reports pending base→main PRs (B).

## Non-goals (from the brief)

No node-table / model / cap / boundary change. No collapse to direct-to-`main`.
No `PostToolUse` evidence model. No new `REQ`/`FLOW`/`DEC` IDs — process truth
lives in the brief and the contract.
