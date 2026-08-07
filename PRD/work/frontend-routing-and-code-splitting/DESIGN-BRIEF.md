# DESIGN BRIEF: frontend-routing-and-code-splitting

## Summary

Give the four registered feature-portal destinations addressable top-level URLs
and per-destination lazy code boundaries, so a URL identifies a feature, browser
back/forward works, and initial payload scales with what a user opens rather
than with the whole suite. The registry stays the single source of destination
truth and grows a `path`; the URL replaces `sessionStorage` as the source of
truth for which destination is active; `DestinationOutlet`'s keep-alive mounting
is preserved unchanged.

Explicit user steer for this package: **structure it for future growth**. That
resolves several otherwise-balanced calls toward the extensible option — a real
router library rather than a hand-rolled history wrapper, a `path` field on the
registry rather than id-to-URL string munging at call sites, and an explicit
chunking strategy rather than incidental bundling.

## Scope correction from IDEA.md

`IDEA.md` framed this as "six function areas." The registry
(`apps/frontend/src/components/portal/destinationRegistry.tsx`) has **four**
destinations:

| Destination id | Label | Component |
| --- | --- | --- |
| `quick-lookup` | Quick Question | `QuickLookupApp` |
| `mtg-assistant` | In-Depth Question | `MtgAssistantApp` |
| `player-life-tracker` | Life Tracker | `PlayerLifeTrackerApp` |
| `trade-balancer` | Trade Balancer | `TradeBalancer` |

`portal` is the shell itself. `feedback` is an **action entry**, not a
destination — DEC-104 requires selecting it to leave `activeDestinationId`
untouched, so it must not become a route. `scan` and `conversationHistory` are
cross-cutting libraries nested inside destinations, not top-level areas. The
routable surface is the four destinations above.

`IDEA.md` also said 17 `App.*.test.tsx` files; the actual count is **19**.

## Decisions

### D1 — Supersede REQ-090/DEC-111's "no URL-based routing" constraint

REQ-090 constraints state `no URL-based routing / react-router`, and DEC-111's
Impact states `no URL-based routing is introduced`. Read in context these are
scope fences on that decision's own work — DEC-111's Notes say "non-goals of
**this decision itself**: URL-based routing" — not a standing product
prohibition. They are nonetheless active PRD truth (precedence #1) and cannot be
silently contradicted.

**Resolution (user-approved during refinement):** supersede them with a new
decision. `DEC-157` amends DEC-111/REQ-090 so the URL becomes the source of
truth for the active destination, and `sessionStorage` is demoted to the
fallback consulted only when the URL carries no destination.

Behavior change this forces, stated explicitly: REQ-090's criterion "a brand-new
browser tab/window with no prior activity in that tab still opens on the first
registered destination" now holds **only for a bare `/`**. A deep link to
`/trade-balancer` in a brand-new tab lands on Trade Balancer. That is the point
of the feature, and it is recorded as an intentional amendment rather than a
regression.

### D2 — `react-router` as the routing mechanism

User-approved during refinement. Weighed against a minimal hash/history wrapper
and `@tanstack/react-router`.

- The app has four runtime dependencies (`react`, `react-dom`, `react-markdown`,
  `remark-gfm`) and that leanness has real value, so this is a genuine cost.
- The "future growth" steer is decisive against a hand-rolled wrapper: nested
  routes, params, and search-param handling are exactly what a wrapper would
  accrete badly, and re-implementing them later is more expensive than the
  dependency.
- `@tanstack/react-router` is rejected as heavier than the need — its
  type-safe-route generation and loader model buy nothing for four flat routes,
  and it is the larger reversal if the choice proves wrong.

### D3 — Keep-alive mounting is preserved; the router supplies location only

This is the sharpest constraint in the package. `DestinationOutlet` deliberately
keeps every visited destination **mounted and hidden** rather than unmounting
it, so switching destinations preserves in-session state — a guarantee held by
DEC-095/REQ-067 and restated across DEC-111, DEC-122, and DEC-133.

`react-router`'s `<Routes>` unmounts non-matching routes. Wiring destinations
into `<Routes>` elements would therefore be a **product-behavior regression**,
not a refactor.

**Resolution:** `react-router` provides `<BrowserRouter>` and location reading
(`useLocation` / `useNavigate` / route matching) only. `DestinationOutlet` keeps
rendering every mounted destination with `hidden` exactly as it does today; the
router decides *which id is active*, not *what stays mounted*. `useActiveDestination`
is rewritten to derive `activeDestinationId` from the URL and to navigate on set,
keeping its existing two-field public shape so call sites in `App.tsx` are
unchanged.

### D4 — Flat top-level routes only

User-approved during refinement. One path segment per destination:

| Path | Destination |
| --- | --- |
| `/quick-lookup` | `quick-lookup` |
| `/in-depth` | `mtg-assistant` |
| `/life-tracker` | `player-life-tracker` |
| `/trade-balancer` | `trade-balancer` |

Paths are **declared literally per registry entry**, not derived from ids or
labels — the table above is the whole mapping. There is no derivation rule to
apply, because neither ids nor labels produce all four cleanly: `quick-lookup`'s
id already reads well as a path, while `mtg-assistant` and `player-life-tracker`
do not, and the DEC-135 labels ("Quick Question", "In-Depth Question") are prose
rather than slugs. Paths are chosen for readability and URL stability, and
`path` lives on the registry entry so the id↔path mapping has exactly one home.
Adding a destination means adding its `path` alongside its `id` and `label`.

`/` resolves by consulting `sessionStorage` (REQ-090's existing guarded
load/validate/fallback helper), then the first registered destination — this is
how DEC-111's refresh-restore behavior survives the change. Unknown paths
redirect to `/`.

### D5 — Routes are the split boundary, plus one shared `scan` chunk

Each registry entry's `render` is wrapped in `React.lazy`, with a `Suspense`
boundary **per destination** inside the outlet's per-destination wrapper — not
one boundary around the outlet, which would suspend and blank already-loaded
siblings.

One evidence-backed exception: the scan surface is reachable from three of the
four destinations, so without an explicit group it is either duplicated across
destination chunks or hoisted into the common chunk every visitor downloads.
That surface is **wider than `src/lib/scan/**`**:

- `src/hooks/useScanCapture.ts` — imported by `QuickLookupApp.tsx`,
  `ZoneCollectionStep.tsx` (In-Depth), and `components/trade/useTradeScan.ts`
- `src/components/ScanCameraSurface.tsx` — imported by `QuickLookupApp.tsx` and
  `components/trade/TradeSide.tsx`
- `src/lib/scan/**` itself, via `useTradeScan.ts:5`'s runtime `loadScanMap`
  import (its `resolveScanCandidates` import on line 6 is `import type` and is
  erased at build time, so it carries no bundling weight)

`manualChunks` therefore uses the **function form** — the object form maps chunk
names to explicit module ids and rejects path patterns — with a `scan` group
scoped by measured import-graph reachability and a `vendor` group covering
`react`, `react-dom`, `react/jsx-runtime`, and `react-router`.

This is a **code**-splitting change only. The existing **data**-artifact lazy
loads (`cardhashes.bin` on first scan per NFR-010, `cardPrintingPrices.json` on
first Trade Balancer open per NFR-013) already exist and are untouched.

### D6 — In-flow state stays ephemeral; URLs address destinations only

Routes address function areas. Staged `contextFlow` state, conversation state,
and follow-up state are **not** serialized into the URL. REQ-090 already
requires each destination's staged/conversation/follow-up state to reset fresh
on reload, and deep-linkable in-flow state would be a new product behavior with
its own privacy surface (game context in a shareable URL). Out of scope, stated
as a non-goal rather than left implicit.

### D7 — Test regrouping is follow-up, not scope

The user declined to settle this in refinement, so it resolves by the assumption
ladder's smallest-reversible-scope rule. Tests change **only** where routing
forces them:

- `App.persist-active-destination.test.tsx` asserts the superseded
  sessionStorage-only behavior and must be rewritten against D1.
- `src/test/setup.ts` must reset `window.history`/`location` in `afterEach`. It
  clears only `localStorage` today (`setup.ts:5-8`), and jsdom's history is
  file-global, so under `<BrowserRouter>` a destination-switching test leaves
  the URL dirty for the next case in the same file. No test needs its own router
  provider — `<BrowserRouter>` lives inside `App`.

A wholesale regroup of all 19 `App.*.test.tsx` files along route boundaries is a
separate NFR-012 hygiene package and is explicitly not attempted here.

## Material assumptions

| Assumption | Authoritative evidence |
| --- | --- |
| Deep links resolve in production with no infra change | `scripts/aws-bootstrap.sh:289-305` already configures CloudFront `CustomErrorResponses` mapping 403 and 404 to `/index.html` with `ResponseCode: "200"`, and `DefaultRootObject: index.html` (line 256). SPA fallback is already in place. |
| Feedback stays a non-route action entry | DEC-104: an action entry "invokes a handler ... instead of switching the active view; it does not mount a destination view or alter mode state." |
| Keep-alive mounting must survive | `DestinationOutlet.tsx` tracks `mountedDestinationIds` and renders inactive destinations with `hidden`; DEC-095/REQ-067 require in-session data preservation across switching. |
| Registry order still supplies the default | DEC-135: "Registry order remains both the menu's rendered order (DEC-104) and the source of the no-stored-preference default." Only the `/` case now consults it. |
| Router dependency is acceptable despite the four-dependency baseline | User's explicit "structured for future growth" steer plus the approved `react-router` answer during refinement. |
| The `player-life-tracker → mtg-assistant` seed handoff survives routing | `App.tsx:31-40` runs the seed in `handleDestinationSelect`; that handler is preserved and simply calls the navigating setter. Seeding is not moved into a route effect, so a direct deep link to `/in-depth` correctly does **not** seed. |

## Non-goals

- No change to `POST /api/ask-ai`, Zod schemas, `GameContext`, prompt assembly,
  the provider boundary, or any backend route
- No visual redesign; screen layout truth stays with `screen-layout.md`
  (DEC-149 / REQ-126)
- No server rendering or framework migration; the app stays React + Vite
- No state-management rewrite; `contextFlow` and existing hooks stay as-is
- No nested or parameterized routes, no search-param state
- No regroup of the 19 `App.*.test.tsx` files (D7)
- No change to the feature-portal's visual chrome — corner rail, tray, Theme
  section, and action entries are untouched (DEC-122 / DEC-133 / DEC-150)

## PRD alignment

New durable truth this package adds:

- **DEC-157** in `PRD/sections/decisions/navigation.md` plus a router index line
  in `PRD/sections/decisions.md` — URL-based routing supersedes DEC-111/REQ-090's
  no-routing constraint; URL is the source of truth, `sessionStorage` is the
  bare-`/` fallback.
- **REQ-140** in `PRD/sections/functional-requirements.md` — addressable
  destination routes with deep-link, back/forward, and unknown-path behavior.
- **NFR-014** in `PRD/sections/non-functional-requirements.md` — route-level
  code splitting and initial-payload posture, and the NFR-012 shard-headroom
  interaction.
- Amendment notes on **REQ-090** and **DEC-111** pointing at DEC-157.
- `PRD/sections/system-map.md` feature-portal entry updated to describe URL
  addressing and lazy boundaries.
- `PRD/sections/screen-layout.md` gains a **Destination load fallback** row
  under Shared chrome — the `Suspense` boundary is a new user-visible surface,
  so DEC-149 / REQ-126 require a catalog row rather than invented geometry.

Existing truth relied on and unchanged: DEC-095, DEC-104, DEC-135 (registry,
action entries, order/default), DEC-122/DEC-133/DEC-150 (portal chrome),
NFR-010/NFR-013 (data-artifact lazy loads), DEC-155/NFR-012 (CI sharding).

## Risks

| Risk | Mitigation |
| --- | --- |
| Naive `<Routes>` adoption silently unmounts destinations and breaks DEC-095 state preservation | D3 makes keep-alive an explicit acceptance criterion with a regression test that switches away and back and asserts preserved in-session state |
| New route tests push frontend cases past NFR-012's ~1330 three-shard ceiling | Slice D measures case count and bumps the CI shard matrix to 4 if the count crosses the threshold — a sanctioned one-line matrix change per NFR-012's notes |
| `sessionStorage`/URL double source of truth drifts | `sessionStorage` is written on navigation but read only for bare `/`; precedence is stated in DEC-157 and asserted in tests |
| Suspense fallback flashes on every destination switch | Keep-alive means a destination suspends only on first visit; the fallback is asserted to appear once per destination, not per switch |
| `manualChunks` written in object form with a glob, which Rollup rejects | Slice C requires the function form explicitly and states why the object form cannot express this |
| `scan` chunk scoped to `src/lib/scan/**`, letting slice C pass while the heavier shared scan UI/hook layer stays duplicated | Chunk membership is defined by measured import-graph reachability, and slice C's acceptance criteria grep for `useScanCapture` and `ScanCameraSurface` markers specifically |
| jsdom history bleeding between test cases, misdiagnosed as a sessionStorage-fallback bug | Slice D makes the global `afterEach` history reset a requirement with its own acceptance criterion, and names the exact misdiagnosis |
