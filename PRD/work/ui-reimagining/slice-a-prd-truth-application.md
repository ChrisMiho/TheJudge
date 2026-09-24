# Slice A — prd-truth-application

## Status: planned

## Goal

Every block in `GATE-QUESTIONS.md` is already finalized by the owner's gate
verdicts (15 accept, 2 edit already folded into the diffs shown — see the
README's `## Refinement outputs`). This slice writes that approved product
truth into `PRD/sections/` by intent, exactly once: six new requirements
(`REQ-200`-`REQ-205`) and eleven in-place amendments. No app code changes and
no feature `README.md` `Built:` line changes, because no code ships in this
package (`DESIGN-BRIEF.md` D2).

## Requirements

1. Read every `## <STABLE-ID>` block in `GATE-QUESTIONS.md` in order. Each
   block's diff is the *starting point*, not a blind patch — apply it by
   intent against the current content of the named `PRD/sections/` file (line
   numbers in the diffs may have shifted since the diff was authored; match by
   surrounding text, not by line number).
2. Add, in numeric order after `REQ-199` in
   `PRD/sections/functional-requirements.md`: `REQ-200` (theme built around
   the chosen colour), `REQ-201` (original per-colour motif kit), `REQ-202`
   (Life Tracker inherits shared chrome, reviewed by a screenshot pair),
   `REQ-203` (suite-wide brand-mark Easter egg), `REQ-204` (Trade Balancer
   phone side tabs), `REQ-205` (touch-floor conformance on the re-imagined
   screens) — each using the full title/priority/description/criteria/
   constraints/dependencies/notes block from its `GATE-QUESTIONS.md` diff.
3. Amend in place, in `PRD/sections/functional-requirements.md`: `REQ-044`,
   `REQ-046`, `REQ-056`, `REQ-060`, `REQ-099`, `REQ-124`, `REQ-129`,
   `REQ-130`, `REQ-167` — each per its own `GATE-QUESTIONS.md` diff block.
4. Amend in place: `NFR-011` in
   `PRD/sections/non-functional-requirements.md`; `FLOW-007` (plus the
   `FLOW-001` step-1 cat-wizard wording and the `REQ-045` note referenced in
   the `REQ-203` block) in `PRD/sections/user-flows.md`; the two bullets named
   in the `REQ-200` block in `PRD/sections/goals-and-non-goals.md`; the
   `### Theme settings` summary in `PRD/sections/system-map.md`.
5. Do **not** touch any line `GATE-QUESTIONS.md`'s amendment-set grep tables
   (Grep A-D) dispose as "Unchanged" or "Unchanged now, superseded at the code
   package" — the latter rows are `Built:` lines in
   `sections/scan/README.md:196`, `sections/shared-chrome/README.md:211,277`,
   and `sections/in-depth/README.md:67,448-449`, which stay accurate until a
   later code package ships and updates them.
6. Add no new `DEC-###` entry anywhere in `PRD/sections/` — the decision log
   is retired (`PRD/instructions/requirement-format.md`).

## Acceptance criteria

- [ ] A1 — `PRD/sections/functional-requirements.md` contains `REQ-200`
      through `REQ-205`, in numeric order after `REQ-199`, each matching its
      `GATE-QUESTIONS.md` diff's title, priority, description, acceptance
      criteria, constraints, dependencies, and notes by intent.
- [ ] A2 — `REQ-044`, `REQ-046`, `REQ-056`, `REQ-060`, `REQ-099`, `REQ-124`,
      `REQ-129`, `REQ-130`, and `REQ-167` in
      `PRD/sections/functional-requirements.md` each carry their amendment
      from `GATE-QUESTIONS.md` (the superseded-language edits, new
      Dependencies rows, and amended Notes).
- [ ] A3 — `NFR-011` in `PRD/sections/non-functional-requirements.md` carries
      its amendment: the measured contrast floors replace the generic 4.5:1
      bar, the "rather than adding token roles" clause is superseded, and the
      new Life Tracker constraint clause and `REQ-200`/`REQ-202`/`REQ-205`
      dependencies are present.
- [ ] A4 — `FLOW-007` in `PRD/sections/user-flows.md` carries its amendment
      (step 4 and the Notes list); the `FLOW-001` Main Flow step-1 sentence
      and the `REQ-045` note in `functional-requirements.md` both point at
      `REQ-203`'s session-wide, cross-screen tap count instead of the
      game-context-only wording.
- [ ] A5 — `PRD/sections/goals-and-non-goals.md` line ~41 and line ~80 read
      the amended text from the `REQ-200` block (palette drives the whole
      surface; light theme no longer excluded outright).
- [ ] A6 — `PRD/sections/system-map.md`'s `### Theme settings` summary reads
      the amended text from the `REQ-200` block (palette reach extends to a
      restrained theme; static chrome reads `REQ-200` roles).
- [ ] A7 — no feature `README.md` under `PRD/sections/` gained or lost a
      `Built:` line; `git diff` for `sections/scan/README.md`,
      `sections/shared-chrome/README.md`, and `sections/in-depth/README.md`
      shows no change from this slice.
- [ ] A8 — no new `DEC-###` entry exists anywhere in `PRD/sections/`
      (`grep -c '^### DEC-' PRD/sections/decisions.md` unchanged from before
      this slice).
- [ ] A9 (manual) — every "Amend" row in `GATE-QUESTIONS.md`'s four grep
      tables (Grep A-D: A1-A24, B1/B3/B4/B5, C1/C11, D1/D12/D16) is reflected
      in the applied edits, read side by side with the resulting diff.
- [ ] A10 — `npm run quality:check` passes.

## Verification

```bash
npm run quality:check
git diff --stat PRD/sections/
```

## Files touched

- `PRD/sections/functional-requirements.md` (edit — 6 new entries, 9 amended)
- `PRD/sections/non-functional-requirements.md` (edit — `NFR-011` amended)
- `PRD/sections/user-flows.md` (edit — `FLOW-007`, `FLOW-001` step 1 amended)
- `PRD/sections/goals-and-non-goals.md` (edit — two bullets amended)
- `PRD/sections/system-map.md` (edit — Theme settings summary amended)
