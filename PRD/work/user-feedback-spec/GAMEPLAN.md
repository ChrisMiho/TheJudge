# GAMEPLAN — user-feedback-spec

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

## What ships

Nothing new. This package's deliverable is already written and committed on
the autonomous base at `562d1c6`: `PRD/sections/user-feedback/README.md` (144
lines, DEC-168 template) and the one `PRD/README.md` Section Inventory row for
`sections/user-feedback/`. The define gate already walked and the owner
already accepted both, 9 behavior-surface units, 2026-08-25.

This diverges from Phase A #1 (life-tracker): there, map-out planned an
authoring slice (write the spec) and a nav-row-plus-proof slice, because
refinement there minted a new decision (DEC-168 itself) and left the spec
file to `build`. Here DEC-168 already existed, so refinement wrote the whole
spec at `define` and there is nothing left to author. Both slices below are
verify-only: confirm the committed content is correct and complete against
its sources, and prove the package's diff never left its licensed scope.

## Architecture / data flow

Not applicable — no runtime component, no code path, no data flow. This is a
documentation-verification task over already-committed `PRD/sections/`
content.

## Slices

| Slice | Scope | Dependency |
| --- | --- | --- |
| A | Verify `PRD/sections/user-feedback/README.md` against its cited sources (DEC-104, DEC-105, REQ-086/087/088, FLOW-014, NFR-001/006) and the DEC-168 template. Close any confirmed, sourced gap with a bounded additive correction only — never invent content, never touch a DEC/REQ/FLOW/NFR body. | none |
| B | Verify the `PRD/README.md` Section Inventory row, then prove the whole package's diff since its fork point touched nothing outside the licensed set (no `apps/`, no existing DEC/REQ/FLOW/NFR body). | none |

Parallel-ready: A checks the spec's content against its sources; B checks the
diff's shape and the nav row. Neither reads or depends on the other's output.

## Known candidate finding for slice A

Cross-checking `system-map.md`'s `## Feedback & bug report` entry (line 565)
against the spec's committed **Where it lives** paragraph and the actual
repository tree at map-out time found one gap:
`apps/frontend/src/hooks/useFeedbackForm.ts` is named in `system-map.md`'s
`Lives in:` list and exists in the tree (`find apps/frontend/src -iname
"*Feedback*"` lists it, alongside `useFeedbackForm.test.ts`), but the spec's
**Where it lives** paragraph does not name it. Slice A must confirm this
independently and, if confirmed, close it with one additive file-path
addition — sourced from `system-map.md` and the tree, no new behavior claim,
no cited-ID change. This is consistent with `DESIGN-BRIEF.md`'s stated rule:
"the spec is corrected against its sources, never the reverse." It is not a
product decision (no behavior, contract, or scope change), so it does not
require reopening the define gate.

## Verification checklist (package-level, restated from DESIGN-BRIEF)

- `PRD/sections/user-feedback/README.md`'s `Backed by:` line names exactly
  DEC-104, DEC-105, REQ-086, REQ-087, REQ-088, FLOW-014, NFR-001, NFR-006 —
  no new ID.
- Every **How it works** bullet traces to its cited source's actual text.
- **Where it lives** names every file `system-map.md` and the tree confirm
  belongs to the feature (see known candidate finding above).
- **Measured bounds** states plainly that no pixel bounds exist and lists the
  capture-set / delivery-shape constraints.
- `git diff` since the package's fork point shows no change under `apps/`,
  and no change to any existing `DEC`, `REQ`, `FLOW`, or `NFR` body.
- `PRD/README.md` has exactly one Section Inventory row for
  `sections/user-feedback/`.

## Runtime / browser risk

None. This package is documentation-only — no UI surface changes, nothing
browser-observable. No Playwright verification is required
(`PRD/instructions/runtime-process-hygiene.md`).

## Corpus checks this repo already runs

No `apps/` test suite applies. Verification uses `grep` / `git diff --stat` /
`git diff` structural checks against the PRD markdown files and the source
files the spec cites, matching how the life-tracker-spec package (the closest
precedent) and `prd-doc-traceability` before it were verified.

## Fork-point reference

This branch (`thejudge-auto/user-feedback-spec`) forked from
`thejudge-auto/life-tracker-spec`, which had already merged into
`origin/main` via PR #106 before this branch was cut. The package-wide
diff-scope proof in slice B therefore scopes against
`$(git merge-base HEAD origin/main)`, not against the immediate parent
branch name — confirmed at map-out time: that merge-base is `7fd4956`, and
`git diff --stat` from it touches exactly `PRD/README.md` (+1 line),
`PRD/sections/user-feedback/README.md` (new, 144 lines), and
`PRD/work/user-feedback-spec/` bookkeeping — nothing under `apps/`, nothing
in any existing `DEC`/`REQ`/`FLOW`/`NFR` body.

## Next step

`/thejudge-implement PRD/work/user-feedback-spec/ slice A` (Claude Code) or
`$thejudge-implement PRD/work/user-feedback-spec/ slice A` (Codex). Slice B
may run before, after, or alongside A — no ordering dependency.

Orchestrated mode: this package returns to `graph-run` for independent
review, fresh verification, and publication — not published directly by this
skill.
