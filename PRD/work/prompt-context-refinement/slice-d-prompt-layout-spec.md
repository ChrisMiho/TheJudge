# Slice D — Readable prompt-layout spec

## Status: done

## Goal

One maintained doc lists every backend prompt section in assembly order with
a plain one-line description, and a presence matrix shows which sections
appear on which path (game / lookup with card(s) / lookup no card /
follow-up) — so the owner can read the prompt's shape without wading through
raw JSON. Docs only; no runtime change. Written after slices A and C so the
matrix reflects the shipped multi-card sections and reworded guardrail rather
than the pre-change prompt.

## Requirements

REQ-169.

1. New doc `PRD/sections/system-map/prompt-layout-spec.md`: every named
   section `buildPromptText` (`promptAssembly.ts`) assembles, in its actual
   assembly order, with a one-line plain description each.
2. A presence matrix: rows are sections, columns are the four paths (game
   mode; lookup with card(s); lookup with no card; follow-up), each cell
   marked present / absent / conditional with the condition named.
3. The matrix is verified against the assembly code and real
   `npm run prompt:preview` output for representative fixtures on each path
   (including a multi-card lookup fixture from slice A) — not authored from
   memory.
4. The doc names `npm run prompt:preview` as the tool to inspect a real
   prompt and states what it emits (prompt text plus context/diagnostics/
   enrichment sidecars).
5. Cross-linked from `system-map/prompt-assembly.md`,
   `quick-lookup/README.md`, and `in-depth/README.md`.

## Acceptance criteria

- [x] D1 — `PRD/sections/system-map/prompt-layout-spec.md` exists, lists every
  prompt section in actual assembly order, and gives each a plain one-line
  description.
- [x] D2 — The doc carries a presence matrix (sections × the four paths) with
  each cell marked present/absent/conditional and the condition named.
- [x] D3 — **Manual:** the matrix was checked against `promptAssembly.ts` and
  against `npm run prompt:preview` output for at least one fixture per path
  (game, lookup-with-cards, lookup-no-card, follow-up) — not authored from
  memory. See `slice-d.evidence.md` (2026-08-30).
- [x] D4 — The doc names `npm run prompt:preview`, states what it emits, and
  points to it as the way to see a live example.
- [x] D5 — The doc is cross-linked from `system-map/prompt-assembly.md`,
  `quick-lookup/README.md`, and `in-depth/README.md`.

## Verification

```bash
npm run prompt:preview:all
npm run quality:check
```

## Files touched

- `PRD/sections/system-map/prompt-layout-spec.md` (new)
- `PRD/sections/system-map/prompt-assembly.md` (cross-link)
- `PRD/sections/quick-lookup/README.md` (cross-link)
- `PRD/sections/in-depth/README.md` (cross-link)
