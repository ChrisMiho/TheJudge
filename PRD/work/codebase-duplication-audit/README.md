status: active

# codebase-duplication-audit

Read-only audit: find places where the same need is served by two or more
separate implementations across `apps/frontend`, `apps/backend`, and
`scripts`, and write up what should be consolidated. Changes no product code.
See `IDEA.md` for problem, outcome, non-goals, and open questions.

## Package contents

- `IDEA.md` — captured idea, scope, and open questions for refinement
- `DESIGN-BRIEF.md` — refined scope, deliverable shape, method, assumptions
- `intake/intake-codebase-health.md` — owner-staged intake, copied verbatim
- `GAMEPLAN.md` — slice shape, ordering, surface-to-slice map
- `slice-a-frontend-components-hooks.md` + `slice-a.criteria.json`
- `slice-b-frontend-lib-types-styles.md` + `slice-b.criteria.json`
- `slice-c-backend.md` + `slice-c.criteria.json`
- `slice-d-scripts.md` + `slice-d.criteria.json`
- `slice-e-cross-boundary-and-assembly.md` + `slice-e.criteria.json`
- `audit-notes/` — per-surface working notes written by slices A–D, read by
  slice E; not the deliverable
- `STATUS.active` — current lifecycle marker

## Slice table

| Slice | Scope | Depends on | Status |
| --- | --- | --- | --- |
| A | Frontend components and hooks (`apps/frontend/src/components/**`, `apps/frontend/src/hooks/**`) | none | done |
| B | Frontend lib, types, styles (`apps/frontend/src/lib/**`, `apps/frontend/src/types/**`, top-level `apps/frontend/src/*`, `apps/frontend/src/test/**`, CSS) | none | done |
| C | Backend (`apps/backend/src/**`) | none | planned |
| D | Scripts (`scripts/**` plus the three `package.json` script blocks) | none | planned |
| E | Cross-boundary pass, plus final assembly of `DUPLICATION-AUDIT.md` | A, B, C, D | planned |

## Implementation map

`GAMEPLAN.md` has the full ordering rationale, the surface-to-slice path map,
and the cross-boundary starting points slice E must confirm or dismiss. Slices
A–D write working notes into `audit-notes/`; slice E is the only slice that
writes the deliverable, `DUPLICATION-AUDIT.md`, and it also runs the
package-level verification (coverage reconciliation, read-only proof,
`npm run quality:check`).

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/codebase-duplication-audit

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/codebase-duplication-audit/DESIGN-BRIEF.md`
- Findings: none
