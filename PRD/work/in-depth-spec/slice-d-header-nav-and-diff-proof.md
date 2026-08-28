# Slice D — Reconcile the header, verify the nav row, and prove the package diff stayed in scope

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

## Status: done

## Goal

Confirm the `PRD/README.md` Section Inventory row for `sections/in-depth/`
(already written, already committed) is correct; reconcile
`PRD/sections/in-depth/README.md`'s header `Backed by:` and "Consumed but
owned elsewhere" lines against whatever bounded corrections slices A and C
applied, confirming the header is now internally consistent; and prove the
whole package's diff since its fork point touched nothing outside the
licensed documentation set: no `apps/` change, no edit to any existing
`DEC`/`REQ`/`FLOW`/`NFR` body, no edit to `system-map.md`,
`screen-layout.md`, `open-questions.md`, or `goals-and-non-goals.md`. Run
this slice after slices A, B, and C have finished (or are confirmed to have
found nothing to correct) — its header-reconciliation requirement needs to
see their result, unlike the diff-proof-only final slice the simpler Phase A
packages used.

## Requirements

1. Confirm exactly one Section Inventory row exists for `sections/in-depth/`,
   describing it as a derived, non-authoritative current-state feature spec
   citing DEC-168, naming In-Depth as the primary MTG Assistant loop /
   `mode: "game"` Ask AI destination, and noting it covers the full backend
   path — matching the `sections/life-tracker/`, `sections/user-feedback/`,
   `sections/trade-balancer/`, `sections/scan/`, `sections/shared-chrome/`,
   and `sections/quick-lookup/` rows' pattern in the same table (all six
   already present in `PRD/README.md`).
2. Confirm no other Section Inventory or Instruction Inventory row was
   added, removed, or reordered.
3. Re-read the current state of `PRD/sections/in-depth/README.md`'s header
   (`Backed by:` line and "Consumed but owned elsewhere" paragraph) after
   slices A and C have run. Confirm: if slice A's DEC-018 correction landed,
   DEC-018 is present in `Backed by:`; if slice A's DEC-122 correction
   landed, DEC-122 is mentioned in "Consumed but owned elsewhere"; if slice
   C's DEC-047/REQ-033 corrections landed, both are present in `Backed by:`.
   If any slice found its candidate gap did not actually hold on independent
   re-check, confirm the header was correctly left unchanged for that ID —
   do not add an ID that slice A or C determined was not a real gap.
   Finally, re-run the full header-vs-body ID reconciliation script (the
   verification block's `python3` step) fresh against the file's current
   state, and confirm zero non-cross-boundary IDs remain missing from
   `Backed by:` — where "cross-boundary" means explicitly marked "via
   scan spec"/"via shared chrome" in the body, or on this package's
   DESIGN-BRIEF's explicit cross-boundary list (FLOW-006, FLOW-010,
   REQ-097, REQ-098, DEC-095, DEC-135, DEC-145, DEC-124, DEC-149, DEC-050,
   DEC-070, DEC-012).
4. This branch forked from `origin/main` at `3045e60` (Merge PR #119, the
   shared-chrome-spec close). Scope the diff-proof against the fork point,
   `$(git merge-base HEAD origin/main)` — confirmed at map-out time to
   resolve to `3045e60`. Confirm the diff from that point touches only:
   `PRD/sections/in-depth/README.md` (514 lines plus slices A/C's bounded
   header corrections if any), `PRD/README.md` (one row added),
   `PRD/work/STATUS.md` (one row), and `PRD/work/in-depth-spec/` bookkeeping
   (`README.md`, `DESIGN-BRIEF.md`, `GRAPH-RUN.md`, `IDEA.md`, `STATUS.*`,
   `intake/`, `GAMEPLAN.md`, slice docs, criteria/evidence files) — no
   `apps/` change, no edit to any existing `DEC`/`REQ`/`FLOW`/`NFR` body
   (`decisions/*`, `functional-requirements.md`, `user-flows.md`,
   `non-functional-requirements.md`), no edit to `system-map.md`,
   `screen-layout.md`, `goals-and-non-goals.md`, or `open-questions.md`.
5. Confirm no new stable ID token (`DEC-`, `REQ-`, `FLOW-`, `NFR-`, `Q-` +
   digits) appears anywhere in the diff's added lines that did not already
   exist pre-change — except DEC-018, DEC-122, DEC-047, REQ-033, which are
   pre-existing IDs cited (not minted) by slices A/C's licensed corrections,
   if they ran and applied them.
6. This package writes its durable deliverable directly to
   `PRD/sections/in-depth/README.md` and `PRD/README.md`. Confirm there is
   no further durable-truth promotion for `thejudge-cleanup` to perform
   beyond what slices A, B, and C have already verified (and, where needed,
   bounded-corrected).

## Acceptance criteria

- [ ] D1 — `PRD/README.md` has exactly one Section Inventory row for
      `sections/in-depth/`.
- [ ] D2 — That row's description states the spec is a derived, non-
      authoritative current-state view citing DEC-168, names In-Depth as
      the primary MTG Assistant loop / `mode: "game"` destination, and notes
      it covers the full backend path.
- [ ] D3 — No other Section Inventory or Instruction Inventory row was
      added, removed, or reordered.
- [ ] D4 — The header's `Backed by:` line and "Consumed but owned
      elsewhere" paragraph are confirmed internally consistent with
      whatever slices A and C actually did (correction applied only where
      their independent re-check confirmed the gap), and a fresh
      header-vs-body ID reconciliation shows zero non-cross-boundary IDs
      missing from `Backed by:`.
- [ ] D5 — The full package diff (from `$(git merge-base HEAD origin/main)`)
      shows no change under `apps/`, and no change to any existing
      `DEC`/`REQ`/`FLOW`/`NFR` body, `system-map.md`, `screen-layout.md`,
      `open-questions.md`, or `goals-and-non-goals.md`.
- [ ] D6 — A human confirmed the package needs no further durable-truth
      promotion at cleanup beyond `PRD/sections/in-depth/README.md` and the
      `PRD/README.md` row.

## Verification

```bash
git diff $(git merge-base HEAD origin/main) -- PRD/README.md
grep -c "sections/in-depth" PRD/README.md
git diff --stat $(git merge-base HEAD origin/main) -- apps/
git diff --stat $(git merge-base HEAD origin/main) -- PRD/sections/
git diff $(git merge-base HEAD origin/main) -- PRD/sections/decisions PRD/sections/functional-requirements.md PRD/sections/user-flows.md PRD/sections/non-functional-requirements.md PRD/sections/system-map.md PRD/sections/screen-layout.md PRD/sections/goals-and-non-goals.md PRD/sections/open-questions.md
git status --porcelain
python3 - <<'EOF'
import re
text = open("PRD/sections/in-depth/README.md").read()
header_end = text.index("## What it is")
header = text[:header_end]
body = text[header_end:]
header_ids = set(re.findall(r'(?:DEC|REQ|FLOW|NFR)-\d+', header))
body_ids = set(re.findall(r'(?:DEC|REQ|FLOW|NFR)-\d+', body))
cross_boundary = {"FLOW-006", "FLOW-010", "REQ-097", "REQ-098", "DEC-095",
                   "DEC-135", "DEC-145", "DEC-124", "DEC-149", "DEC-050",
                   "DEC-070", "DEC-012"}
missing = sorted((body_ids - header_ids) - cross_boundary)
print("Body IDs not in header Backed-by and not cross-boundary:", missing)
EOF
```

## Files touched

- `PRD/README.md` (verify only, already written)
- `PRD/sections/in-depth/README.md` (verify only in this slice — any
  correction to the header lands via slice A or slice C, not here)

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/in-depth-spec/` ready to delete
