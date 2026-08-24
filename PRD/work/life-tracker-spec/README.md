---
status: active
---

# life-tracker-spec

Write the current-state feature spec for the Player Life Tracker at
`PRD/sections/life-tracker/` — the first package in Phase A of the
documentation-refactor gameplan.

See `IDEA.md` for the problem, outcome, and non-goals, and the matched prior
receipts. `DESIGN-BRIEF.md` holds the approved scope, the spec template, the
resolved assumptions, and the verification list.

Product truth landed by refinement: `DEC-168` in
`PRD/sections/decisions/doc-process.md`, with its router index row in
`PRD/sections/decisions.md`.

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/life-tracker-spec

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/life-tracker-spec/DESIGN-BRIEF.md`
- Findings: none

## Slices

| Slice | Scope | Dependency | Status |
| --- | --- | --- | --- |
| [A](./slice-a-write-spec.md) | Write `PRD/sections/life-tracker/README.md` on the DEC-168 template, consolidating the full source inventory into current-state form across all seven surfaces. | none | done |
| [B](./slice-b-nav-row.md) | Add the one `PRD/README.md` Section Inventory row; final package-diff scope proof; ship gates. | sequential on A | planned |

GAMEPLAN: `PRD/work/life-tracker-spec/GAMEPLAN.md`.

## Implementation map

- `PRD/sections/life-tracker/README.md` — new file, slice A.
- `PRD/README.md` — one Section Inventory row, slice B.
