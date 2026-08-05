# DESIGN-BRIEF: ui-screen-layout-truth

## Status

refined (quality-check **PASS** 2026-08-05)

## Quality-check FAIL fixes (2026-08-05)

Aligned catalog + DEC-149 + DEC-145 router index with current DEC-145 body:
- desktop shell **width** `min(48rem, 92vw)` only
- pre-submit staged steps **content-sized vertically** (no absorb/fill of lower dead space)
- vertical fill only where other DECs require it (answered workspace, Life Tracker, scan)

## Problem

Agents refining UI from short feedback overcalibrate layout (e.g. “stretch to fill” → edge-to-edge across unused viewport) because the PRD lacked a scan-friendly per-screen size/containment inventory.

## Outcome

Durable product truth + agent wiring so future UI work follows shared direction without guessing. Orthogonal to `responsive-containment-and-density` (that package finishes measured fixes alone).

## Decisions

| ID | Summary |
|---|---|
| DEC-149 | `sections/screen-layout.md` is authoritative for layout direction; hybrid % model; new screens require a catalog row; mechanism stays DEC-117 |
| REQ-126 | Catalog exists with major-screen rows + template; README/skills/instructions wired |

## Scope delivered in this package

- [x] `PRD/sections/screen-layout.md` — shared language + screen catalog + new-screen template
- [x] DEC-149 in `decisions/ui-presentation.md` + router index
- [x] REQ-126 in `functional-requirements.md`
- [x] `PRD/README.md` inventory + UI layout read order
- [x] Optional `system-map.md` pointers (Automatic responsive presentation, Feature portal)
- [x] Skill + instruction one-liners (`kickoff` reference, refinement, implement family, quality-check, `technical-design-rules`, `agent-working-rules`) + `skills:ai-sync`

## Non-goals

- Full design system / tokens / Figma
- Rewriting product UI in this package
- Absorbing `responsive-containment-and-density`
- Strict no-nested-scroll everywhere
- UA sniffing / JS viewport modes / second density preference

## Layout language (approved)

- Hybrid %: outer shell % of **viewport**; inner panels % of **shell**
- Bands: phone `<768`, tablet `768–1023`, desktop `≥1024` (structural `768px` preserved)
- Default fit: **no document/page scroll** for primary UI; region scroll OK
- Anti-overcalibration: fill shell/region ≠ stretch past catalog measure
- Starting desktop shell width aligns with DEC-145 / REQ-124 (`min(48rem, 92vw)`); staged pre-submit height stays content-sized; tune via catalog/REQ updates

## Relationship to other packages

- Does not block or merge with `responsive-containment-and-density`
- Future feature refinements that add UI must add a `screen-layout.md` row

## Implementation note

This package is **docs + agent-wiring**. Map-out/implement slices (if any) should only cover remaining skill/instruction sync verification — not frontend layout rewrites. Prefer quality-check → map-out only if executable slices remain after sync; otherwise cleanup can promote as docs-only ship.
