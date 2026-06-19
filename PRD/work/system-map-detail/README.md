status: active

# system-map-detail

Deep per-subsystem behavior prose that the shallow `sections/system-map.md` catalog links to — how major subsystems actually work, in one read, without re-deriving from code. Split out of `prd-doc-traceability`.

## Source

- `IDEA.md` — problem, desired outcome, non-goals, dependencies, open questions
- `DESIGN-BRIEF.md` — approved scope, decisions, content anchors, non-goals (`DEC-048`)
- `GAMEPLAN.md` — architecture, template, verification checklist
- `slice-a-prompt-assembly-detail.md`, `slice-b-game-rules-retrieval-detail.md`

## Slices

| Slice | Objective | Depends on | Parallel-ready |
| --- | --- | --- | --- |
| A | `system-map/prompt-assembly.md` detail file + catalog `Details:` pointer | — | yes |
| B | `system-map/game-rules-retrieval.md` detail file + catalog `Details:` pointer; package ship gates | — | yes |

Both slices are documentation-only and independent (different new files; `Details:` lines under different `##` headings). Slice B carries the PRD promotion checklist and ship gates for the package.

## Implementation map

| Writes | Backs catalog subsystem |
| --- | --- |
| `PRD/sections/system-map/prompt-assembly.md` | `## Prompt assembly` |
| `PRD/sections/system-map/game-rules-retrieval.md` | `## Game rules retrieval` |
| `PRD/sections/system-map.md` (two `Details:` lines) | both above |

## Relationship to other work

- **`prd-doc-traceability` (`DEC-044`)** builds the shallow catalog (status + one-liner + location + backing IDs). This package is the depth layer that catalog links to.
- **`prompt-context-retrieval-tuning`** rewrites prompt assembly + System 2 / System 3. This package must come **after** it lands, so the volatile retrieval detail is written once.

## Priority coverage

Prompt assembly, System 2 (curated baseline), System 3 (supplemental retrieval), card rulings (System 1).

## Next

Active (`DEC-048`). GAMEPLAN and slices written. Implement via `thejudge-implement`, starting slice A.
