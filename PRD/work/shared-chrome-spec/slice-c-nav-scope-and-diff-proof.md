# Slice C — Verify the scope-boundary bullets, the nav row, and prove the package diff stayed in scope

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

## Status: planned

## Goal

Confirm the two scope-boundary bullets at the end of **Rejected
alternatives and deferred scope** in
`PRD/sections/shared-chrome/README.md` (deferred/out-of-scope; per-feature
surfaces not owned here), confirm the `PRD/README.md` Section Inventory
row for `sections/shared-chrome/` (not yet committed — `git status` shows
`PRD/README.md` unmodified going into this slice; this slice adds the row),
and prove the whole package's diff from the map-out baseline (`ee6e33f`)
touched nothing outside the licensed set — correctly excluding
`lambda-s3-deploy`'s already-committed, owner-approved changes on the same
branch.

## Requirements

1. Read `PRD/sections/shared-chrome/README.md`'s final two bullets under
   **Rejected alternatives and deferred scope**: "Deferred / out of scope
   for this view" and "Per-feature surfaces that stay with their own
   specs — not owned here." Confirm the deferred bullet correctly lists
   deep-linkable in-flow state (DEC-157), nested/parameterized routes and
   search-param state, cross-device sync/accounts/server-side history
   storage, a multi-draft backlog, and a shared drawer-primitive/icon-button
   component extraction — as genuinely deferred, not decided here. Confirm
   the per-feature bullet correctly excludes In-Depth's roster secondary-
   details disclosure and its containment (DEC-120, DEC-128, REQ-100,
   REQ-106), its staged-step eyebrow content (REQ-045), its zone-collection
   add-action reachability (REQ-125), DEC-156 clause 3 (bounded poison/
   energy/experience dropdowns), and the Send-feedback modal (DEC-104,
   DEC-105, FLOW-014, owned by `user-feedback/`) — matching the package
   README's excluded-as-per-feature list and the DESIGN-BRIEF's exclusion
   record exactly. Confirm DEC-120, DEC-128, REQ-100, REQ-106, REQ-045,
   REQ-125, and FLOW-014 are cited only in this exclusionary context (as
   evidence of what is *not* covered), never folded into the file's
   `Backed by:` line as if they were in scope.
2. Confirm exactly one Section Inventory row exists for `sections/shared-
   chrome/`, describing it as a derived, non-authoritative current-state
   feature spec citing DEC-168, naming it as the shared frame every
   destination mounts into (suite shell, Menu rail/tray, mock-mode banner,
   routing/load fallback, conversation workspace, history drawer, View
   Context overlay, card-detail popup) plus the shared layout language —
   matching the `sections/life-tracker/`, `sections/user-feedback/`,
   `sections/trade-balancer/`, `sections/scan/`, and `sections/quick-
   lookup/` rows' pattern in the same table (all five already present in
   `PRD/README.md`).
3. Confirm no other Section Inventory or Instruction Inventory row was
   added, removed, or reordered.
4. Read the "A concurrent package shares this branch" note in
   `PRD/work/shared-chrome-spec/GAMEPLAN.md` before running any diff
   command. The map-out baseline is `ee6e33f` (the commit that resolved
   this package's define gate) — **not**
   `$(git merge-base HEAD origin/main)`, which would also capture
   `lambda-s3-deploy`'s legitimate, already-committed, owner-approved
   changes to `decisions.md`, `decisions/deployment.md`,
   `functional-requirements.md`, and `non-functional-requirements.md`
   (DEC-169, REQ-165, NFR-017). Confirm `git diff ee6e33f -- apps/` is
   empty, and `git diff ee6e33f -- PRD/sections/decisions
   PRD/sections/functional-requirements.md PRD/sections/user-flows.md
   PRD/sections/non-functional-requirements.md PRD/sections/system-map.md
   PRD/sections/screen-layout.md PRD/sections/goals-and-non-goals.md
   PRD/sections/open-questions.md` is empty — proving *this package's own
   slices* introduced no edit there, independent of what
   `lambda-s3-deploy` already committed before the baseline.
5. Confirm the diff from `ee6e33f`, including not-yet-committed
   working-tree changes, touches only: `PRD/sections/shared-chrome/
   README.md` (slices A/B's bounded corrections, if any), `PRD/README.md`
   (one row added), and `PRD/work/shared-chrome-spec/` bookkeeping
   (`GAMEPLAN.md`, slice docs, criteria/evidence files, `README.md`,
   `GRAPH-RUN.md`, `STATUS.*`) plus the `PRD/work/STATUS.md` board row — no
   file outside that set.
6. Confirm no new stable ID token (`DEC-`, `REQ-`, `FLOW-`, `NFR-`, `Q-` +
   digits) appears anywhere in the diff's added lines from the `ee6e33f`
   baseline forward that did not already exist pre-change.
7. This package writes its durable deliverable directly to
   `PRD/sections/shared-chrome/README.md` (already committed) and
   `PRD/README.md` (this slice's row). Confirm there is no further
   durable-truth promotion for `thejudge-cleanup` to perform beyond what
   slices A and B have already verified (and, where needed,
   bounded-corrected).

## Acceptance criteria

- [ ] C1 — The "Deferred / out of scope for this view" bullet correctly
      lists exactly its five deferred items (deep-linkable in-flow state,
      nested/parameterized routes, cross-device sync, multi-draft backlog,
      shared drawer-primitive extraction) with nothing invented or omitted.
- [ ] C2 — The "Per-feature surfaces that stay with their own specs" bullet
      correctly excludes DEC-120/DEC-128/REQ-100/REQ-106, REQ-045, REQ-125,
      DEC-156 clause 3, and DEC-104/DEC-105/FLOW-014, and none of those IDs
      appears in the file's `Backed by:` line.
- [ ] C3 — `PRD/README.md` has exactly one Section Inventory row for
      `sections/shared-chrome/`, matching the five shipped Phase A specs'
      row pattern and citing DEC-168.
- [ ] C4 — No other Section Inventory or Instruction Inventory row was
      added, removed, or reordered.
- [ ] C5 — From the `ee6e33f` baseline, `git diff` shows no change under
      `apps/`, and no change to any existing `DEC`/`REQ`/`FLOW`/`NFR` body,
      `system-map.md`, `screen-layout.md`, `open-questions.md`, or
      `goals-and-non-goals.md` — correctly scoped to exclude
      `lambda-s3-deploy`'s pre-baseline, owner-approved changes.
- [ ] C6 — The full package diff from `ee6e33f` (including uncommitted
      working-tree changes) touches only `PRD/sections/shared-chrome/
      README.md`, `PRD/README.md`, `PRD/work/shared-chrome-spec/`
      bookkeeping, and the `PRD/work/STATUS.md` board row.
- [ ] C7 — A human confirmed the package needs no further durable-truth
      promotion at cleanup beyond `PRD/sections/shared-chrome/README.md`
      and the `PRD/README.md` row.

## Verification

```bash
grep -nA 8 "Deferred / out of scope for this view" PRD/sections/shared-chrome/README.md
grep -nA 6 "Per-feature surfaces that stay with their own specs" PRD/sections/shared-chrome/README.md
grep -n "DEC-120\|DEC-128\|REQ-100\|REQ-106\|REQ-045\|REQ-125\|DEC-104\|DEC-105\|FLOW-014" PRD/sections/shared-chrome/README.md
git diff ee6e33f -- PRD/README.md
grep -c "sections/shared-chrome" PRD/README.md
git diff --stat ee6e33f -- apps/
git diff --stat ee6e33f -- PRD/sections/
git diff ee6e33f -- PRD/sections/decisions PRD/sections/functional-requirements.md PRD/sections/user-flows.md PRD/sections/non-functional-requirements.md PRD/sections/system-map.md PRD/sections/screen-layout.md PRD/sections/goals-and-non-goals.md PRD/sections/open-questions.md
git diff --stat ee6e33f
git status --porcelain
```

## Files touched

- `PRD/README.md` (add one Section Inventory row for
  `sections/shared-chrome/`)

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/shared-chrome-spec/` ready to
      delete
