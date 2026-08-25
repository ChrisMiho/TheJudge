# Slice A — Verify the committed feedback spec against its sources

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

## Status: done

## Goal

Confirm `PRD/sections/user-feedback/README.md` (already committed at
`562d1c6`, 144 lines) is complete and correct against its cited sources and
the DEC-168 template. Close any confirmed, sourced gap with a bounded
additive correction only — this slice verifies; it does not author.

## Requirements

1. Read the cited sources before checking a line: `DEC-104`, `DEC-105` in
   `PRD/sections/decisions/feedback.md`; `REQ-086`, `REQ-087`, `REQ-088` in
   `PRD/sections/functional-requirements.md`; `FLOW-014` in
   `PRD/sections/user-flows.md`; `NFR-001`, `NFR-006` in
   `PRD/sections/non-functional-requirements.md`; the
   `## Feedback & bug report` entry in `PRD/sections/system-map.md`; the
   `## Feedback Delivery Strategy` section in
   `PRD/sections/integrations-and-data.md`. (`intake/` in this package is
   evidence, never authority — do not open the documents it cites.)
2. Confirm the header carries the DEC-168 shape: a `Status:` line stating the
   file is a draft, derived, non-authoritative view, naming the cited
   `DEC`/`REQ`/`FLOW` as the winner on conflict; a `Backed by:` line citing
   exactly `DEC-104`, `DEC-105`, `REQ-086`, `REQ-087`, `REQ-088`, `FLOW-014`,
   `NFR-001`, `NFR-006` — no more, no fewer, no new ID.
3. Confirm all five `##` template sections are present in DEC-168 order:
   **What it is**, **How it works**, **Measured bounds**, **Rejected
   alternatives and deferred scope**, **Where it lives** — no other top-level
   section.
4. Confirm every **How it works** bullet's stated behavior is traceable to
   its cited source's actual text: entry point (DEC-104, REQ-086), modal
   fields/validation/accessibility/motion (DEC-105, REQ-087, NFR-001,
   NFR-006), snapshot content/disclosure/pure-builder (DEC-105, REQ-088),
   delivery endpoint/payload/lifecycle (DEC-105, REQ-087, REQ-088), graceful
   no-op when unconfigured (DEC-105, REQ-088) — no capability invented beyond
   what those IDs state.
5. Confirm **Where it lives** names every file that both `system-map.md`'s
   `Lives in:` line and the actual repository tree confirm belongs to this
   feature. Known candidate gap found at map-out time:
   `apps/frontend/src/hooks/useFeedbackForm.ts` is named in `system-map.md`
   and present in the tree, but absent from the spec's committed **Where it
   lives** paragraph. Verify this independently. If confirmed, close it with
   one additive file-path addition, sourced from `system-map.md` and the
   tree — no new behavior claim, no `Backed by:` change, no DEC/REQ/FLOW/NFR
   body edit.
6. Confirm **Rejected alternatives and deferred scope**'s closed doors and
   deferred-scope line match DEC-104's and DEC-105's Context and non-goals
   language — nothing invented, nothing omitted that those decisions name as
   closed or deferred.
7. Confirm **Measured bounds** states plainly that the feature carries no
   pixel-measured bounds and lists the capture-set and delivery-shape
   constraints consistent with DEC-105/REQ-087/REQ-088, including the
   2026-08-05 live-delivery confirmation (form id `xdenozlb`) that also
   appears in `system-map.md`.
8. Confirm no new stable ID (a `DEC-`, `REQ-`, `FLOW-`, `NFR-`, or `Q-` token
   followed by digits) appears anywhere in the spec beyond the 8 cited IDs.
9. Touch no file besides `PRD/sections/user-feedback/README.md`, and only for
   the bounded correction in requirement 5 if genuinely confirmed — no other
   edit, no DEC/REQ/FLOW/NFR body edit, no `apps/` change.

## Acceptance criteria

- [x] A1 — The header carries a `Status:` line naming the file draft,
      derived, non-authoritative, with the cited `DEC`/`REQ`/`FLOW` winning
      any conflict, and a `Backed by:` line citing exactly DEC-104, DEC-105,
      REQ-086, REQ-087, REQ-088, FLOW-014, NFR-001, NFR-006.
- [x] A2 — All five DEC-168 template sections are present, in order: What it
      is, How it works, Measured bounds, Rejected alternatives and deferred
      scope, Where it lives.
- [x] A3 — Every cited ID (DEC-104, DEC-105, REQ-086, REQ-087, REQ-088,
      FLOW-014, NFR-001, NFR-006) actually exists in its named home file.
- [x] A4 — Every **How it works** bullet's stated behavior is confirmed
      traceable to its cited source's text — no invented capability.
- [x] A5 — **Where it lives** names every file `system-map.md` and the
      repository tree confirm belongs to the feature; the known candidate
      gap (`apps/frontend/src/hooks/useFeedbackForm.ts`) is confirmed and, if
      real, closed by an additive correction.
- [x] A6 — **Rejected alternatives and deferred scope** matches DEC-104's and
      DEC-105's Context and non-goals language, with nothing invented or
      omitted.
- [x] A7 — **Measured bounds** states plainly that no pixel bounds exist and
      lists the capture-set/delivery-shape constraints and the 2026-08-05
      live-delivery confirmation.
- [x] A8 — No new stable ID token appears in the spec beyond the 8 cited IDs.
- [x] A9 — The slice's diff touches only
      `PRD/sections/user-feedback/README.md`, and only for the bounded
      correction in A5 if genuinely needed — no `apps/` change, no edit to
      any existing `DEC`/`REQ`/`FLOW`/`NFR` body.

## Verification

```bash
grep -nE "Status:|Backed by:|^## " PRD/sections/user-feedback/README.md
grep -nE "DEC-104|DEC-105" PRD/sections/decisions/feedback.md
grep -nE "REQ-086|REQ-087|REQ-088" PRD/sections/functional-requirements.md
grep -n "FLOW-014" PRD/sections/user-flows.md
grep -nE "NFR-001|NFR-006" PRD/sections/non-functional-requirements.md
grep -n "useFeedbackForm" PRD/sections/system-map.md PRD/sections/user-feedback/README.md
find apps/frontend/src -iname "*Feedback*"
grep -oE "(DEC|REQ|FLOW|NFR|Q)-[0-9]+" PRD/sections/user-feedback/README.md | sort -u
git status --porcelain PRD/sections/ apps/
```

## Files touched

- `PRD/sections/user-feedback/README.md` (verify; bounded additive
  correction only if A5's candidate gap is confirmed)
