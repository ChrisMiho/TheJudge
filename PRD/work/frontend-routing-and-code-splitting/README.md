status: active

# frontend-routing-and-code-splitting

Make the four registered feature-portal destinations addressable at flat
top-level URLs with lazy-loaded code boundaries, so a URL identifies a feature,
browser back/forward works, and initial payload scales with what a user opens
rather than with the whole suite.

Captured by `thejudge-kickoff` from the SPA scaling analysis done during
`ci-quality-check-runtime` slice E, then prepared by `thejudge-prepare`. See
`IDEA.md` for the measured evidence and `DESIGN-BRIEF.md` for the design record.

## Autonomous metadata

- Autonomous base: origin/feature/routing

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/frontend-routing-and-code-splitting/DESIGN-BRIEF.md`
- Findings: none

## Slices

| Slice | Status | Objective | Depends on |
| --- | --- | --- | --- |
| [A](slice-a-router-foundation.md) | done | Router foundation; URL as source of truth for the active destination | — |
| [B](slice-b-lazy-boundaries.md) | planned | Per-destination `React.lazy` boundaries and the load-fallback surface | A |
| [C](slice-c-chunking.md) | planned | Explicit `manualChunks` and measured payload verification | B |
| [D](slice-d-test-alignment.md) | planned | Test alignment, CI shard headroom, PRD promotion, ship gates | C |

Sequential, not parallel. Each slice operates on structure the previous one
creates: B's lazy boundaries live in the registry A restructures, C's chunking
is meaningless until B's boundaries exist, and D's test alignment depends on the
final shape of A–C.

## Implementation map

| Area | Files |
| --- | --- |
| App root / router provider | `apps/frontend/src/App.tsx` |
| Active-destination resolution | `apps/frontend/src/hooks/useActiveDestination.ts`, `apps/frontend/src/lib/portal/activeDestinationPrefs.ts` (reused unchanged) |
| Registry and paths | `apps/frontend/src/components/portal/destinationRegistry.tsx`, `apps/frontend/src/lib/portal/types.ts` |
| Mounting policy and fallback | `apps/frontend/src/components/portal/DestinationOutlet.tsx` |
| Chunking | `apps/frontend/vite.config.ts` |
| Tests | `apps/frontend/src/App.*.test.tsx`, `apps/frontend/src/test/` |
| CI shard matrix | `.github/workflows/quality-check.yml` (only if the count crosses ~1330) |

## Durable truth added

DEC-157 (`decisions/navigation.md` + router index line), REQ-140, NFR-014,
`screen-layout.md` **Destination load fallback** row, `system-map.md`
feature-portal Routing line, and amendment notes on REQ-090 and DEC-111.

## The constraint that governs every slice

`DestinationOutlet` keeps every visited destination **mounted and hidden**
rather than unmounting it, because DEC-095/REQ-067 guarantee in-session data
survives destination switching. `react-router`'s `<Routes>` unmounts
non-matching routes, so destinations must **not** be wired into `<Routes>`
elements. The router supplies location and history only.

## Next step

After the preparation PR merges: `$thejudge-implement-all PRD/work/frontend-routing-and-code-splitting/`
