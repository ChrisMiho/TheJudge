# Slice A — Verify the staged-flow content: What it is, and Steps 1–4

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

## Status: done

## Goal

Confirm `PRD/sections/in-depth/README.md` (already written, 514 lines,
already committed) is complete and correct — for **What it is**, "The staged
flow, end to end", **Step 1 — Game context**, **Step 2 — Zone confirmation**,
**Step 3 — Zone collection**, and **Step 4 — Enrichment** — against the cited
sources and the DEC-168 template. This slice does not touch "Submit — Decrypt
Stack", "The wait, the answer, and the conversation", **Measured bounds**,
**Rejected alternatives and deferred scope**, **The full backend path**
section, or the `PRD/README.md` row / diff-scope proof (slices B, C, D own
those). This slice verifies; it does not author. Close any confirmed, sourced
gap with a bounded additive correction only.

## Requirements

1. Read the cited sources before checking a line: `PRD/sections/decisions/framing.md`
   (DEC-002, DEC-013, DEC-094); `PRD/sections/decisions/capture-and-stack.md`
   (DEC-004, DEC-005, DEC-006, DEC-007, DEC-008, DEC-009, DEC-015, DEC-018,
   DEC-028, DEC-082); `PRD/sections/decisions/game-context-model.md`
   (DEC-003, DEC-019, DEC-021, DEC-022, DEC-023, DEC-024, DEC-026, DEC-027,
   DEC-034, DEC-035, DEC-037, DEC-043, DEC-102); `PRD/sections/decisions/personalization.md`
   (DEC-067, DEC-076, DEC-078, DEC-091); `PRD/sections/decisions/ui-presentation.md`
   (DEC-092, DEC-120, DEC-128, DEC-151, DEC-156, DEC-160);
   `PRD/sections/decisions/scanning.md` (DEC-050, DEC-070, background only —
   the camera-scan bullet is scan-owned per FLOW-006, confirm it is framed as
   consumed, not re-specified); `PRD/sections/decisions/navigation.md`
   (DEC-095, DEC-122, background only for DEC-095's portal-registration
   citation; DEC-122 is this slice's known-candidate-finding target, see
   requirement 8). Confirm each home file at read time rather than trusting
   this list — it is a map-out pre-scout, not ground truth.
2. Read `PRD/sections/functional-requirements.md` for REQ-001, REQ-002,
   REQ-004 through REQ-010, REQ-015, REQ-016, REQ-017, REQ-018, REQ-020,
   REQ-021, REQ-045, REQ-056, REQ-058, REQ-061, REQ-069, REQ-070, REQ-100,
   REQ-130, REQ-137, REQ-138, REQ-139, REQ-144. Read `PRD/sections/user-flows.md`
   FLOW-001, FLOW-002, FLOW-004 in full. Read `PRD/sections/system-map.md`'s
   `## Frontend staged context flow` block. Read `PRD/sections/screen-layout.md`'s
   `#### In-Depth — Game context`, `#### In-Depth — Zone confirmation`,
   `#### In-Depth — Zone collection`, and `#### In-Depth — Enrichment` rows.
3. Confirm the header carries the DEC-168 shape: a `Status:` line stating
   the file is a draft, derived, non-authoritative view naming the cited
   `DEC`/`REQ`/`FLOW`/`NFR` as the winner on conflict and
   `PRD/sections/decisions.md` as precedence #1; confirm every ID currently
   in the `Backed by:` line resolves to a real, pre-existing ID in its home
   file (spot-check the IDs this slice's sources cover; slices C and D cover
   the rest).
4. Confirm the six top-level sections are present, in order: **What it is**,
   **How it works**, **The full backend path...** (heading only — slice C
   owns its content), **Measured bounds** (heading only — slice B owns its
   content), **Rejected alternatives and deferred scope** (heading only —
   slice B owns its content), **Where it lives** (heading only — slice B/C
   own the frontend/backend halves).
5. Confirm **What it is** accurately summarizes the staged-wizard shape, the
   `mode: "game"` backend, and the "not a rules engine" scope line against
   DEC-002, DEC-013, DEC-094 — no invented capability, no omitted scope line.
6. Confirm "The staged flow, end to end" and each of Steps 1–4 against its
   cited sources, with no invented capability and no omission of a stated
   behavior:
   - **The staged flow, end to end** — DEC-094/FLOW-001 (four-step wizard,
     feature-portal destination), DEC-067/REQ-045 (eyebrow label / brand
     block header shape; DEC-122 superseding the step-name placement — see
     requirement 8), REQ-020/FLOW-001 (Back/Continue preservation rules).
   - **Step 1 — Game context** — REQ-015/DEC-023/DEC-027 (player labels,
     display names, life, turn phase), DEC-022/DEC-034/DEC-037 (turn-phase
     enum, combat sub-step selector), DEC-120/REQ-100 (synchronized
     secondary-details disclosure), DEC-102/REQ-015 (counter fields),
     DEC-043/REQ-031 (`ADDITIONAL GAME STATE` freeform notes — note REQ-031
     is not in this slice's requirement-1 list but is cited here; confirm it
     resolves in `functional-requirements.md`), DEC-091/REQ-069 (ergonomic
     controls), DEC-092/REQ-070 (helper copy).
   - **Step 2 — Zone confirmation** — REQ-016/DEC-024/DEC-035 (zone
     checklist, phase defaults), DEC-092/REQ-070 (helper copy).
   - **Step 3 — Zone collection** — REQ-001/REQ-002/REQ-018/FLOW-001 (card
     search/add), DEC-004 through DEC-009/DEC-018/REQ-004 through
     REQ-010/FLOW-002/FLOW-004 (stack capture rules — confirm DEC-018 per
     requirement 8), DEC-151/DEC-160/REQ-130/REQ-058/FLOW-002 (zone strip
     rendering), DEC-082/REQ-061 (`instanceId` model), the camera-scanner
     bullet (confirm it is framed as scan-owned/consumed, FLOW-006, not
     re-specified — DEC-070 sits in this bullet's citation without a "via"
     qualifier; confirm it reads as legitimately cross-boundary by proximity
     to DEC-050's explicit "via scan spec" marker, per GAMEPLAN's finding).
   - **Step 4 — Enrichment** — REQ-017/DEC-028/FLOW-001 (card-by-card
     wizard), DEC-026/REQ-021/REQ-061 (`ContextTarget` model), REQ-017
     (mana-spent determinism), DEC-156/REQ-139/REQ-138/REQ-144 (counter row
     UI patterns).
7. Confirm the frontend-facing portion of **Where it lives** that this
   slice's content depends on — `apps/frontend/src/lib/contextFlow/`
   (`flow.ts`, `steps.ts`, `phaseZoneDefaults.ts`) and
   `apps/frontend/src/components/` (`ZoneConfirmStep.tsx`,
   `ZoneCollectionStep.tsx`, `ZoneCardPicker.tsx`, `EnrichmentStep.tsx`) —
   against `system-map.md`'s `## Frontend staged context flow` block and the
   actual repository tree (`find`/`ls`). Full Where-it-lives sign-off
   (including the destination-registry check) is slice B's scope; this
   requirement only spot-confirms the files this slice's content cites
   exist.
8. Independently re-verify the two known-candidate header-citation findings
   in this slice's scope, recorded in `GAMEPLAN.md`'s "Known candidate
   finding" section — do not trust that pre-scout, re-derive it from source:
   - Read `PRD/sections/decisions/capture-and-stack.md` DEC-018 in full.
     Confirm it is `Status: confirmed` and its subject (opportunistic
     thumbnail rendering) matches Step 3's stack-details bullet's inline
     `(..., DEC-018, ...)` citation. Confirm DEC-018 is absent from the
     spec's header `Backed by:` line (`grep`). If both hold, add DEC-018 to
     `Backed by:` (insertion only, no reordering of existing entries).
   - Read `PRD/sections/decisions/navigation.md` DEC-122 in full. Confirm it
     is `Status: confirmed`, is the Menu-rail/eyebrow-label placement
     decision, and that "The staged flow, end to end" bullet's parenthetical
     already reads "...superseded to the eyebrow by DEC-122, owned by
     shared chrome." Confirm DEC-122 is absent from both the `Backed by:`
     line and the "Consumed but owned elsewhere" paragraph. If both hold,
     add a DEC-122 mention to the "Consumed but owned elsewhere" paragraph's
     existing shared-chrome sentence (the one already naming the Menu rail)
     — do not add DEC-122 to `Backed by:`.
9. Confirm no new stable ID token (a `DEC-`, `REQ-`, `FLOW-`, `NFR-`, or
   `Q-` token followed by digits) appears anywhere in the sections this
   slice owns, outside the licensed DEC-018/DEC-122 additions, that does not
   already resolve to a real, pre-existing ID in its home file.
10. Touch only `PRD/sections/in-depth/README.md`, and only for a bounded
    additive correction confined to the sections this slice owns (header's
    `Backed by:` line, the "Consumed but owned elsewhere" paragraph, What it
    is, the staged-flow bullet, Steps 1–4) — no edit to Submit/wait/
    conversation, Measured bounds, Rejected alternatives, The full backend
    path, or the backend half of Where it lives, no other file, no DEC/REQ/
    FLOW/NFR body edit, no `system-map.md`/`screen-layout.md`/
    `open-questions.md`/`goals-and-non-goals.md` edit, no `apps/` change, no
    new decision.

## Acceptance criteria

- [ ] A1 — The header's `Status:` line names the file draft, derived,
      non-authoritative, with the cited `DEC`/`REQ`/`FLOW`/`NFR` winning any
      conflict and `PRD/sections/decisions.md` as precedence #1; every ID in
      the sources this slice covers (framing.md, capture-and-stack.md,
      game-context-model.md, personalization.md, the ui-presentation.md IDs
      this slice cites) resolves to a real, pre-existing ID in its home file.
- [ ] A2 — The six top-level sections are present in order (headings only):
      What it is, How it works, The full backend path, Measured bounds,
      Rejected alternatives and deferred scope, Where it lives.
- [ ] A3 — **What it is** is confirmed accurate against DEC-002, DEC-013,
      DEC-094 — no invented capability, no omitted scope line.
- [ ] A4 — "The staged flow, end to end" and each of Steps 1–4 are confirmed
      traceable to their cited sources' actual text (requirement 6's
      per-subsection list) — no invented capability, no dropped behavior.
- [ ] A5 — The frontend files this slice's content cites
      (`apps/frontend/src/lib/contextFlow/*`, `ZoneConfirmStep.tsx`,
      `ZoneCollectionStep.tsx`, `ZoneCardPicker.tsx`, `EnrichmentStep.tsx`)
      are confirmed present in the repository tree.
- [ ] A6 — The DEC-018 header-citation gap is independently re-verified; if
      confirmed, DEC-018 is added to the `Backed by:` line.
- [ ] A7 — The DEC-122 header-citation gap is independently re-verified; if
      confirmed, a DEC-122 mention is added to the "Consumed but owned
      elsewhere" paragraph (not to `Backed by:`).
- [ ] A8 — No new (minted) stable ID token appears in the sections this
      slice owns outside the licensed DEC-018/DEC-122 additions — and this
      slice's diff touches only `PRD/sections/in-depth/README.md`, confined
      to the sections this slice owns, and only for bounded additive
      correction where genuinely needed — no `apps/` change, no edit to any
      existing DEC/REQ/FLOW/NFR body, no `system-map.md`/`screen-layout.md`/
      `open-questions.md`/`goals-and-non-goals.md` edit.

## Verification

```bash
grep -nE "^- Status:|Backed by:|Consumed but owned|^## " PRD/sections/in-depth/README.md
grep -n "^### DEC-002\b\|^### DEC-013\b\|^### DEC-094\b" PRD/sections/decisions/framing.md
grep -n "^### DEC-004\b\|^### DEC-005\b\|^### DEC-006\b\|^### DEC-007\b\|^### DEC-008\b\|^### DEC-009\b\|^### DEC-015\b\|^### DEC-018\b\|^### DEC-028\b\|^### DEC-082\b" PRD/sections/decisions/capture-and-stack.md
grep -n "^### DEC-003\b\|^### DEC-019\b\|^### DEC-021\b\|^### DEC-022\b\|^### DEC-023\b\|^### DEC-024\b\|^### DEC-026\b\|^### DEC-027\b\|^### DEC-034\b\|^### DEC-035\b\|^### DEC-037\b\|^### DEC-043\b\|^### DEC-102\b" PRD/sections/decisions/game-context-model.md
grep -n "^### DEC-067\b\|^### DEC-076\b\|^### DEC-078\b\|^### DEC-091\b" PRD/sections/decisions/personalization.md
grep -n "^### DEC-092\b\|^### DEC-120\b\|^### DEC-128\b\|^### DEC-151\b\|^### DEC-156\b\|^### DEC-160\b" PRD/sections/decisions/ui-presentation.md
grep -n "^### DEC-122\b" -A 20 PRD/sections/decisions/navigation.md
grep -n "^### REQ-001\b\|^### REQ-002\b\|^### REQ-004\b\|^### REQ-005\b\|^### REQ-006\b\|^### REQ-007\b\|^### REQ-008\b\|^### REQ-009\b\|^### REQ-010\b\|^### REQ-015\b\|^### REQ-016\b\|^### REQ-017\b\|^### REQ-018\b\|^### REQ-020\b\|^### REQ-021\b\|^### REQ-045\b\|^### REQ-056\b\|^### REQ-058\b\|^### REQ-061\b\|^### REQ-069\b\|^### REQ-070\b\|^### REQ-100\b\|^### REQ-130\b\|^### REQ-137\b\|^### REQ-138\b\|^### REQ-139\b\|^### REQ-144\b" PRD/sections/functional-requirements.md
grep -n "^### FLOW-001\b\|^### FLOW-002\b\|^### FLOW-004\b" PRD/sections/user-flows.md
grep -n "^## Frontend staged context flow" -A 5 PRD/sections/system-map.md
grep -n "In-Depth" PRD/sections/screen-layout.md
find apps/frontend/src/lib/contextFlow -maxdepth 1 -type f
find apps/frontend/src/components -maxdepth 1 -iname "ZoneConfirmStep.tsx" -o -iname "ZoneCollectionStep.tsx" -o -iname "ZoneCardPicker.tsx" -o -iname "EnrichmentStep.tsx"
grep -oE "(DEC|REQ|FLOW|NFR|Q)-[0-9]+" PRD/sections/in-depth/README.md | sort -u
git status --porcelain PRD/sections/ apps/
```

## Files touched

- `PRD/sections/in-depth/README.md` (verify; bounded additive correction
  only if genuinely needed, confined to the sections this slice owns)
