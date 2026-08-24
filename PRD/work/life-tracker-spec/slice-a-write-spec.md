# Slice A — Write the life-tracker feature spec

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

## Status: done

## Goal

Write `PRD/sections/life-tracker/README.md`, the DEC-168 current-state feature
spec for the Player Life Tracker, consolidating the full source inventory into
one derived, non-authoritative view on the fixed template.

## Requirements

1. Read the full source inventory before writing a line: `DEC-101`, `DEC-103`,
   `DEC-132`, `DEC-136`, `DEC-139` in
   `PRD/sections/decisions/player-life-tracker.md`; `DEC-102` in
   `PRD/sections/decisions/game-context-model.md`; `REQ-081`–`REQ-085`,
   `REQ-111`, `REQ-112` in `PRD/sections/functional-requirements.md`;
   `FLOW-013` in `PRD/sections/user-flows.md`; the `## Player Life Tracker`
   entry in `PRD/sections/system-map.md`; the `#### Player Life Tracker` row in
   `PRD/sections/screen-layout.md`; and `NFR-001`, `NFR-006` in
   `PRD/sections/non-functional-requirements.md`. (`intake/` in this package is
   evidence, never authority — do not open the documents it cites.)
2. Write the file on the DEC-168 template
   (`PRD/sections/decisions/doc-process.md` §DEC-168): `Status:` draft marker
   plus the precedence sentence naming the cited `DEC`/`REQ`/`FLOW` as the
   winner on conflict; `Backed by:` line naming every consolidated ID; **What
   it is**; **How it works**; **Measured bounds**; **Rejected alternatives and
   deferred scope**; **Where it lives**.
3. Cover all seven surfaces in **How it works**, each behavior carrying a
   `Built:` marker: life table; counter panel and commander-damage matrix;
   day/night header control; Game Setup; reset/New Game; persistence; the
   one-way MTG Assistant seed.
4. Apply the supersession rule: a behavior enters the spec only in its current
   form. Where a replaced approach is load-bearing, record it under
   **Rejected alternatives and deferred scope** as a closed door — never
   narrated in **How it works**.
5. Apply the measured-bound rule using the worked example in the
   DESIGN-BRIEF: the commander-damage `−`/`+` bands (≈53px, REQ-112) survive
   in **Measured bounds**; the life-adjustment edge bands (≈67px, REQ-112) are
   dropped from **Measured bounds** and recorded only as a closed door (DEC-136
   replaced them with half-card zones); one-screen fit at every player count
   with no per-row/per-card minimum (DEC-136, `screen-layout.md`) survives;
   counter-panel full-height with no dead scrim at any player count (DEC-139)
   survives; player count 2–8, starting life 20/25/30/40 + Custom default 60,
   count defaults 2→20, 3+→40 (DEC-101, REQ-081) survives.
6. **Where it lives** names a coarse code location and defers depth to
   `system-map.md` — no duplicate deep code detail.
7. Touch no other file. No `apps/` change. No edit to any existing `DEC`,
   `REQ`, `FLOW`, or `NFR` body — the six source documents are read-only in
   this slice.

## Acceptance criteria

- [x] A1 — `PRD/sections/life-tracker/README.md` exists.
- [x] A2 — The file carries all seven DEC-168 template fields: `Status:`,
      `Backed by:`, **What it is**, **How it works**, **Measured bounds**,
      **Rejected alternatives and deferred scope**, **Where it lives**.
- [x] A3 — The `Status:` field states the file is a draft/derived,
      non-authoritative view and that a cited `DEC`/`REQ`/`FLOW` wins any
      conflict.
- [x] A4 — The `Backed by:` line names every consolidated ID: DEC-101,
      DEC-102, DEC-103, DEC-132, DEC-136, DEC-139, REQ-081, REQ-082, REQ-083,
      REQ-084, REQ-085, REQ-111, REQ-112, FLOW-013, NFR-001, NFR-006.
- [x] A5 — **How it works** covers all seven surfaces (life table; counter
      panel and commander-damage matrix; day/night header control; Game
      Setup; reset/New Game; persistence; one-way MTG Assistant seed), each
      with a `Built:` marker.
- [x] A6 — **Measured bounds** contains every surviving bound: commander-damage
      `−`/`+` bands ≈53px; one-screen fit at every player count with no
      per-row/per-card minimum; counter panel full-height with no dead scrim
      at any player count; player count 2–8, starting life 20/25/30/40 +
      Custom default 60, count defaults 2→20, 3+→40.
- [x] A7 — The ≈67px life-adjustment edge band appears only under **Rejected
      alternatives and deferred scope** as a closed door — not under
      **Measured bounds** and not narrated in **How it works**.
- [x] A8 — **Where it lives** names a coarse location and defers to
      `system-map.md` rather than duplicating deep code detail.
- [x] A9 — The slice's diff touches only `PRD/sections/life-tracker/README.md`
      (new file) — no `apps/` change, no edit to any existing `DEC`, `REQ`,
      `FLOW`, or `NFR` body.

## Verification

```bash
test -f PRD/sections/life-tracker/README.md
grep -E "Status:|Backed by:|What it is|How it works|Measured bounds|Rejected alternatives|Where it lives" PRD/sections/life-tracker/README.md
grep -E "DEC-101|DEC-102|DEC-103|DEC-132|DEC-136|DEC-139|REQ-081|REQ-082|REQ-083|REQ-084|REQ-085|REQ-111|REQ-112|FLOW-013|NFR-001|NFR-006" PRD/sections/life-tracker/README.md
grep -c "Built:" PRD/sections/life-tracker/README.md
git status --porcelain PRD/sections/ apps/
```

## Files touched

- `PRD/sections/life-tracker/README.md` (new)
