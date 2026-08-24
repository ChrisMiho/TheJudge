# Gameplan — codebase duplication audit

## What ships

One document: `PRD/work/codebase-duplication-audit/DUPLICATION-AUDIT.md`. No
product code changes. See `DESIGN-BRIEF.md` for the full deliverable shape,
scope, exclusions, method, and verification rules — this plan does not repeat
them, it sequences the work against them.

## Shape of the work

Five surface passes, matching the brief's `### Surfaces` list, each landing as
its own slice. Four surface passes (components/hooks, lib/types/styles,
backend, scripts) are read passes that write **working notes** into
`PRD/work/codebase-duplication-audit/audit-notes/` — one file per surface,
carrying that surface's inventory, findings (in the brief's per-finding
field shape), and a draft coverage-table row. Nothing in `audit-notes/` is the
deliverable; it is scratch that final assembly reads and that cleanup deletes
with the rest of the package.

The fifth slice, cross-boundary, is sequential after the other four: the brief
states this surface "reads the other four's inventories rather than a new
file set." It also does final assembly — the brief specifies one deliverable
file, and something has to merge five surfaces' findings into one ranked list,
one coverage table, and one Healthy reuse section. Splitting assembly into a
sixth slice would just move that ordering dependency, not remove it, so the
slice that already has to wait on the other four also produces the file.

```
Slice A (components/hooks)  ─┐
Slice B (lib/types/styles)  ─┼─▶ Slice E (cross-boundary + assemble DUPLICATION-AUDIT.md)
Slice C (backend)           ─┤
Slice D (scripts)           ─┘
```

A–D are parallel-ready: disjoint file sets, no ordering requirement between
them. E is sequential on all four, stated blocker: it needs their inventories
as input and it is the only slice that writes the shared deliverable file, so
it must run after every note file it reads exists.

## Per-slice method

Every surface slice (A–D) follows the brief's `## Method`: a read pass over
the surface's file inventory, seeded by — not replaced by — searches for
repeated literal class strings and magic numbers, repeated exported symbol
names, near-identical function signatures, and parallel handler names (open,
close, dismiss, retry). A finding must clear the floor: at least two
independent implementations a future change to the same need would have to
touch together. Below that floor, nothing is written down.

Each surface slice records, per finding, exactly the brief's fields: Need,
Locations (`path:line-range` plus symbol, two minimum), Verdict, Consolidation,
Size, Complexity removed. It also records the surface's file inventory (the
`git ls-files` count for its paths) so slice E can reconcile the coverage
table without re-deriving it.

## Surface-to-slice map

| Slice | Surface (brief `### Surfaces`) | Paths |
| --- | --- | --- |
| A | 1. Frontend components and hooks | `apps/frontend/src/components/**`, `apps/frontend/src/hooks/**` |
| B | 2. Frontend lib, types, and styles | `apps/frontend/src/lib/**`, `apps/frontend/src/types/**`, top-level `apps/frontend/src/*` (non-recursive: `App.tsx` and its co-located `App.*.test.tsx` files, `main.tsx`, `types.ts`, `index.css`), `apps/frontend/src/test/**` |
| C | 3. Backend | `apps/backend/src/**` |
| D | 4. Scripts | `scripts/**` (including `scripts/lib/**`, `scripts/fixtures/**` — hand-authored, in scope per the brief's fixtures carve-out) plus the `scripts` block of the root `package.json`, `apps/frontend/package.json`, and `apps/backend/package.json` |
| E | 5. Cross-boundary, plus final assembly | Reads A–D's `audit-notes/*.md`; new analysis limited to the three named starting points (perceptual-hash recipe, `PlayerLabel`/`PLAYER_LABELS`, `*Policy.test.ts` vs `scripts/*.mjs`) plus whatever else the FE/BE/scripts boundary surfaces once A–D's inventories are in hand |

Directory-to-slice assignment is a disjoint partition of the brief's in-scope
trees: every path named in one surface belongs to exactly one of A–D, so
nothing is double-counted or dropped between slices, and the final coverage
table (built in slice E) is the union of the five rows.

## Cross-boundary starting points (slice E)

The brief names three, each to confirm or dismiss on the code, not accept:

1. Perceptual-hash recipe — `PRD/sections/functional-requirements.md:629`
   requires one authoritative definition shared by scanner and builder.
2. Player-label list — `PlayerLabel` union in `apps/frontend/src/types.ts`
   versus `PLAYER_LABELS` in `apps/backend/src/constants.ts`.
3. Frontend `*Policy.test.ts` files asserting behavior implemented in
   `scripts/*.mjs`.

## Verification (whole package, run in slice E)

Per the brief's `## Verification`:

```bash
git ls-files apps scripts   # minus the exclusion list; reconcile against the coverage table
git status --porcelain      # changes only under PRD/work/codebase-duplication-audit/ and PRD/work/STATUS.md
npm run quality:check       # exits 0, matching the pre-audit baseline
```

Plus: every location cited in every finding resolves — the path exists and
the named symbol is present at the given lines.

## Non-goals (repeated from the brief, binding on every slice)

No product-code or product-test edit. No lint/style pass. No refactor. No
`PRD/sections/` edit, no `system-map.md` entry, no consolidation backlog
outside the package.

## Ordering rule

A–D: parallel-ready, no prerequisite. E: sequential, blocked on A, B, C, D
(reads their notes; writes the one shared deliverable file).
