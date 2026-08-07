# GAMEPLAN: frontend-routing-and-code-splitting

Authoritative design: `DESIGN-BRIEF.md`. Durable truth: DEC-157, REQ-140,
NFR-014, plus the `screen-layout.md` **Destination load fallback** row.

## Architecture

Two structural changes to `apps/frontend`, layered so each is independently
verifiable.

### 1. The URL becomes the source of truth for the active destination

Today the chain is:

```
useActiveDestination (useState, seeded from sessionStorage)
  → App.tsx PortalShell holds activeDestinationId
  → FeaturePortalMenu (menu) + DestinationOutlet (rendering)
```

After this package:

```
<BrowserRouter>
  → useActiveDestination (derives id from useLocation, navigates on set)
    → App.tsx PortalShell — unchanged call sites, same two-field hook result
      → FeaturePortalMenu + DestinationOutlet — unchanged
```

`useActiveDestination` keeps its exact public shape
(`{ activeDestinationId, setActiveDestinationId }`), so `App.tsx:26-28` and
`handleDestinationSelect` need no restructuring. Only the hook's internals move
from `useState` to `useLocation`/`useNavigate`.

Resolution order for the active id:

1. The URL path matches a registry `path` → that destination.
2. The path is `/` → `loadActiveDestinationId(validIds)` (the existing guarded
   `sessionStorage` helper, reused not reimplemented) → replace-navigate to its
   path.
3. The path matches nothing → redirect to `/`, then rule 2.

`saveActiveDestinationId` still runs on every navigation, so rule 2 keeps
DEC-111's refresh-restore behavior alive for non-deep-link entry.

### 2. Destinations gain lazy code boundaries

`destinationRegistry.tsx` imports all four destination components eagerly today,
which is why every visitor downloads every feature. Each `render` moves behind
`React.lazy(() => import(...))`, with one shared `Suspense` boundary inside
`DestinationOutlet` wrapping each mounted destination's subtree.

The boundary goes **inside** the outlet's per-destination `<div hidden>`, not
around the outlet as a whole. Wrapping the whole outlet would suspend — and
therefore blank — already-loaded sibling destinations whenever a new one loads,
which is exactly the state loss DEC-095 forbids.

Chunking is then made explicit in `vite.config.ts`:

- `scan` — the scan surface reachable from more than one destination. This is
  **wider than `src/lib/scan/**`**: `hooks/useScanCapture.ts` is imported by
  Quick Question, In-Depth, and the trade destination, and
  `components/ScanCameraSurface.tsx` by Quick Question and trade. Membership is
  determined by measuring the import graph, not by directory name. Without an
  explicit group this code is either duplicated per destination chunk or hoisted
  into the entry chunk.
- `vendor` — `react`, `react-dom`, `react/jsx-runtime`, `react-router`.

`manualChunks` must use the **function form** (`(id) => ...`); the object form
maps chunk names to explicit module ids and rejects path patterns.

## The constraint that governs every slice

`DestinationOutlet` keeps every visited destination **mounted and hidden**
rather than unmounting it. This is not incidental — DEC-095/REQ-067 guarantee
in-session data survives destination switching, and DEC-157 preserves it
explicitly.

`react-router`'s `<Routes>` unmounts non-matching routes. **Do not** wire
destinations into `<Routes>` elements. The router supplies location and history
only; `DestinationOutlet` remains the sole owner of mounting policy. Every slice
carries a regression check for this.

## Data flow unchanged

No change to `POST /api/ask-ai`, `AskAiRequest`, Zod schemas, `GameContext`,
prompt assembly, stack ordering, the provider boundary, card metadata, scan
behavior, or the data pipeline. No backend file is touched by any slice.

## Slice sequence

Sequential, not parallel. Stated blocker: B, C, and D each operate on structure
the previous slice creates — B's lazy boundaries live in the registry A
restructures, C's chunking is meaningless until B's boundaries exist, and D's
test alignment depends on the final shape of A–C.

| Slice | Objective |
| --- | --- |
| A | Router foundation; URL as source of truth for the active destination |
| B | Per-destination `React.lazy` boundaries and the load-fallback surface |
| C | Explicit `manualChunks` and measured payload verification |
| D | Test alignment, CI shard headroom, PRD promotion, ship gates |

## Verification checklist

- [ ] `npm run quality:check` green at the end of every slice
- [ ] Deep link to each of the four paths in a fresh context mounts that destination
- [ ] Browser Back/Forward moves between destinations
- [ ] Switching away from and back to a destination preserves its in-session state (no remount)
- [ ] Feedback modal opens without changing the URL, active destination, or history
- [ ] `/` honors `sessionStorage`, then registry order; unknown paths redirect to `/`
- [ ] Life Tracker → In-Depth seed runs on menu selection and **not** on deep link
- [ ] `npm run build` emits separate destination chunks plus `scan` and `vendor` chunks
- [ ] Entry chunk does not contain destination-only or scan code
- [ ] Frontend case count checked against NFR-012's 3-shard ceiling; matrix bumped if crossed
