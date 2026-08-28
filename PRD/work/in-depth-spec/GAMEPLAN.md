# GAMEPLAN — in-depth-spec

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

## What ships

Nothing new. This package's deliverables are already written, on disk, and
committed at the define gate (owner-reviewed, 11→11-section acceptance, 0
edits, 0 rejects — see the package README's define-gate record):
`PRD/sections/in-depth/README.md` (514 lines, DEC-168 template plus the
full-backend-path section — the behavior spec) and one `PRD/README.md`
Section Inventory row. Both are already committed (`5d24a72`, `d479fe4`) —
unlike the five prior Phase A spec packages, there is nothing left to
commit at this package's cleanup beyond the bookkeeping this map-out and its
implementation slices add.

This is the same shape as Phase A #2–#6 (user-feedback, trade-balancer,
scan, shared-chrome, quick-lookup): refinement wrote the whole spec at
`define` because DEC-168 already existed, so there is nothing left to
author. In-Depth is explicitly the gameplan's **largest and most entangled**
destination (DESIGN-BRIEF's own framing) — it is both a full-backend-path
spec like Quick Lookup (Phase A #5, `mode: "game"` instead of `mode:
"lookup"`) and a large multi-step UI spec like Life Tracker, with four
staged-flow steps rather than one screen. All four slices below are
verify-only: confirm the already-written content is correct and complete
against its cited sources, the DEC-168 template, and — for the backend-path
section specifically — the actual `apps/backend/src/` files it names; close
any confirmed, sourced gap with a bounded additive correction only.

## Architecture / data flow

Not applicable — no runtime component, no code path change, no data flow
change. This is a documentation-verification task over already-written
`PRD/sections/in-depth/README.md` content, including direct reads of the
actual backend source files the spec's backend-path section describes
(`apps/backend/src/validation/askAiRequest.ts`, `apps/backend/src/prompt/*.ts`,
`apps/backend/src/{cardRulings,gameRules,gameRulesTopicSelection,gameRulesRetrieval}.ts`,
`apps/backend/src/commanderSpellbook/*`, `apps/backend/src/providers/*.ts`) —
never a code change, never a test run against those files beyond
`grep`/reading them.

## Slices

| Slice | Scope | Dependency |
| --- | --- | --- |
| A | Verify **What it is**, "The staged flow, end to end", and Steps 1–4 (game context, zone confirmation, zone collection, enrichment) against the cited `DEC`/`REQ`/`FLOW` sources, `system-map.md`, `screen-layout.md`, and the DEC-168 template shape. Independently confirm (or correct) the DEC-018 / DEC-122 header-citation gap (below). | none |
| B | Verify "Submit — Decrypt Stack", "The wait, the answer, and the conversation", **Measured bounds**, **Rejected alternatives and deferred scope**, and the frontend-facing portion of **Where it lives**. | none |
| C | Verify **The full backend path (`mode: "game"`)** section against the actual `apps/backend/src/` files it names — request validation, prompt assembly, retrieval enrichment, combo enrichment, provider boundary and diagnostics — and the backend portion of **Where it lives**. Independently confirm (or correct) the DEC-047 / REQ-033 header-citation gap (below). | none |
| D | Verify the `PRD/README.md` Section Inventory row for `sections/in-depth/`, reconcile the header's `Backed by:` / "Consumed but owned elsewhere" lines against every ID slices A–C actually confirmed cited in the body, and prove the whole package's diff since its fork point touched nothing outside the licensed documentation set. | A, B, C (reads their corrections before the final reconciliation pass; does not block their own independent verification work) |

Parallel-ready for A, B, C: each checks a distinct, non-overlapping part of
the one spec file (or, for the backend-path check, distinct real source
files) and none reads or depends on another's output while doing its own
verification. D is sequenced last because its header-reconciliation pass
needs to see whatever bounded corrections A and C applied — it is not
independent, unlike the diff-proof-only final slice the five simpler Phase A
packages used.

## Known candidate finding: header `Backed by:` under-citation (verify independently, do not trust this)

Map-out time found a real, sourced traceability gap: four IDs are cited
inline in the spec's body with no "via `<other-spec>`" cross-boundary
qualifier, are not on the DESIGN-BRIEF's explicit cross-boundary list, and
are absent from the header's `Backed by:` line. Confirmed by comparing every
`(?:DEC|REQ|FLOW|NFR)-\d+` token in the header against every such token in
the body (script-checked at map-out time, re-derive independently — do not
trust this pre-scout):

- **DEC-018** (`PRD/sections/decisions/capture-and-stack.md`, confirmed
  status) — cited in Step 3's stack-details bullet ("thumbnails-when-
  available"), line ~145. Frontend-owned, in slice A's scope.
- **DEC-122** (`PRD/sections/decisions/navigation.md`, confirmed status) —
  cited in "The staged flow, end to end" bullet on the step-name eyebrow,
  line ~68, and the body text itself already says "owned by shared chrome."
  This one is a shared-chrome cross-boundary citation the DESIGN-BRIEF's
  explicit list happens to omit (it lists DEC-095/135/145/124/149, not
  DEC-122) — the bounded correction is to add it to the "Consumed but owned
  elsewhere" prose (which already names shared-chrome for the Menu rail /
  conversation frame), not to `Backed by:`, mirroring how DEC-124 and
  DEC-145 are already handled elsewhere in the same file. In slice A's scope
  to confirm and, if it holds, correct.
- **DEC-047** (`PRD/sections/decisions/rules-retrieval.md`, confirmed
  status) — cited in "Retrieval enrichment"'s `OFFICIAL RULINGS` bullet on
  eval-harness relevance verification, line ~315. Backend-owned, in slice
  C's scope.
- **REQ-033** (`PRD/sections/functional-requirements.md`, live response-size
  diagnostic logs) — cited in "Provider boundary and diagnostics", line
  ~355. Backend-owned, in slice C's scope.

If independent re-check confirms each (re-read the cited DEC/REQ body and
the spec's inline citation directly — do not trust this pre-scout), the
bounded, sourced correction is: add DEC-018 and DEC-047 and REQ-033 to the
header's `Backed by:` line (alphanumeric position, no reordering of existing
entries beyond insertion), and add a DEC-122 mention to the "Consumed but
owned elsewhere" paragraph's shared-chrome sentence. This is additive only —
no existing bullet is rewritten, no body claim changes, and the correction
states only that a citation the body already relies on is now traceable from
the header. Slice D re-confirms the header is internally consistent after
slices A and C have had the chance to apply their piece.

Two IDs cited in the body without "via" wording resolved as **not** gaps —
confirm this holds, do not re-litigate it: **FLOW-010** (line ~59,
`PRD/sections/user-flows.md`, confirmed present) is on the DESIGN-BRIEF's
explicit cross-boundary list (feature portal) already, so it correctly stays
out of `Backed by:`. **DEC-070** (line ~164, `scanning.md`) sits in the same
parenthetical as DEC-050, which the body already marks "via scan spec" —
DEC-070 is understood to carry the same cross-boundary framing by
proximity, also matching the DESIGN-BRIEF's explicit list; slice A's check
should confirm this reading holds rather than treat DEC-070 as an
undisclosed gap.

## Runtime / browser risk

None. This package is documentation-only — no UI surface change, nothing
browser-observable. No Playwright verification is required
(`PRD/instructions/runtime-process-hygiene.md`).

## Verification checklist (package-level, restated from DESIGN-BRIEF)

- The spec's header carries a `Status:` line stating draft/derived/non-
  authoritative with the cited `DEC`/`REQ`/`FLOW`/`NFR` winning any conflict
  and `PRD/sections/decisions.md` as precedence #1, and a `Backed by:` line
  whose ID set — after any slice A/C correction — matches every non-cross-
  boundary ID token actually cited in the body.
- The spec's six top-level sections are present, in order: What it is, How
  it works, The full backend path (`mode: "game"`), Measured bounds,
  Rejected alternatives and deferred scope, Where it lives.
- Every **How it works** bullet (staged flow, all four steps, submit, wait/
  conversation) traces to its cited source's actual text.
- Every bullet in **The full backend path** traces to the actual behavior of
  the named `apps/backend/src/` file, read directly — not to the requirement
  summary alone.
- Every stable ID token present in the spec resolves to a real, pre-existing
  ID in its home file — no minted ID.
- **Where it lives** names every file `system-map.md` and the actual
  repository tree confirm belongs to the feature.
- `git diff` since the package's fork point shows no change under `apps/`,
  and no change to any existing `DEC`/`REQ`/`FLOW`/`NFR` body,
  `system-map.md`, `screen-layout.md`, `open-questions.md`, or
  `goals-and-non-goals.md`.
- `PRD/README.md` has exactly one Section Inventory row for
  `sections/in-depth/`.

## Corpus checks this repo already runs

No `apps/` test suite applies. Verification uses `grep` / `git diff --stat`
/ `git diff` structural checks against the PRD markdown files and the
backend source files the spec cites, read directly — never a build, a
backend test run, or any network refresh. This matches how life-tracker-
spec, user-feedback-spec, trade-balancer-spec, scan-spec, shared-chrome-spec,
and quick-lookup-spec before it were verified.

## Fork-point reference

This branch forked from `origin/main` at `3045e60` (Merge PR #119, the
shared-chrome-spec close). Confirmed at map-out time: `git merge-base HEAD
origin/main` resolves to `3045e60`, and the diff from that point touches
exactly `PRD/README.md` (+1 line), `PRD/sections/in-depth/README.md` (new,
514 lines), `PRD/work/STATUS.md` (+1 line), and
`PRD/work/in-depth-spec/` bookkeeping — nothing under `apps/`, nothing in
any existing `DEC`/`REQ`/`FLOW`/`NFR` body, `system-map.md`,
`screen-layout.md`, `open-questions.md`, or `goals-and-non-goals.md`. Both
`PRD/README.md` and `PRD/sections/in-depth/README.md` are already committed
(`5d24a72`), so — unlike quick-lookup-spec — there is no publish-before-
build commit step pending for the spec deliverables themselves; only this
map-out's own new files (`GAMEPLAN.md`, slice docs, criteria/evidence files)
and each slice's status updates are uncommitted at slice start.

## Next step

`/thejudge-implement PRD/work/in-depth-spec/ slice A` (Claude Code) or
`$thejudge-implement PRD/work/in-depth-spec/ slice A` (Codex). Slices B and C
have no ordering dependency on A or on each other; slice D reads their
results and runs last.

Orchestrated mode: this package returns to `graph-run` for independent
review, fresh verification, and publication — not published directly by
this skill.
