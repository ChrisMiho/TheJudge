# GAMEPLAN: ui-review

Authoritative design: `DESIGN-BRIEF.md`. Durable product truth: DEC-142,
DEC-151, DEC-156, DEC-158–160; REQ-011, REQ-091, REQ-125, REQ-128–130,
REQ-133–145; and the affected rows in `PRD/sections/screen-layout.md`.

## Architecture

This package is a frontend-only correction pass with four shared seams and four
bounded leaf fixes.

### 1. One overlay foundation

The six overlay close controls converge on one theme-derived component. Every
surface that dismisses on an outside interaction consumes one authoritative
outside-dismiss helper/hook, while retaining its existing focus-trap, focus-
restore, Escape, portal, and Menu↔History behavior. Life Tracker's `CounterPanel`
is the sole intentional behavior addition: its scrim becomes dismissible.

`CardDetailPopup` then leaves the card image DOM box and joins the overlay family:
bottom sheet below `768px`, side panel at `768px+`, portal-hosted and sized to its
own content. The top-right trigger remains on the image and all popup content still
comes from the already-carried card object.

### 2. One card presentation rule, six host containers

`CardPresentation` owns one container-relative, aspect-preserving image rule. It
does not gain a size variant, a per-screen prop, or a call-site height cap. Host
containers determine the result:

- Quick Question, In-Depth Enrichment, View Context, and the zone selected-card
  preview use the large shell-column treatment.
- Zone-strip tiles remain `w-40`; their images grow inside that fixed width.
- Scan-review rows keep their existing scrolling list and give the image the row
  width that the container can safely afford.

`CardSelectionPreview` drops the duplicated metadata sidebar on the two staged
surfaces so only the smaller Remove action remains below the image. Zone
collection keeps its own Add/owner semantics, places Search and Scan on one row,
shows the selected canonical name in search, removes the duplicate title, and
keeps Add at `top <= 844px` at 390×844.

### 3. In-Depth player-detail patterns

The two synchronized disclosure buttons retain one state and their accessible
contracts, but their painted shape becomes a legible full-size triangle inside a
44px hit area. Player scalar counters become content-sized stacked selects with
explicit unset options and fixed ranges. Commander-damage and named-counter rows
reuse one grouped label/input layout pattern; their data shapes and normalization
stay unchanged.

### 4. Bounded leaf corrections

- Quick Question's visible count, `maxLength`, and submit gate all read raw
  editable text; submitted question composition remains unchanged.
- The corner rail gains a real layout footprint and the compensating
  `.adaptive-context-trigger` margin is removed.
- Trade Balancer formats the build-time snapshot date for humans without
  changing the artifact or pricing math.

## Data flow unchanged

No slice changes `AskAiRequest`, Zod schemas, `GameContext`, card metadata,
Scryfall/data refresh, scan identification/capture, prompt assembly, providers,
backend routes, pricing math, stack ordering, card identity/selection, or Life
Tracker persistence. The only question-string change is which existing frontend
value controls count/gating; the composed submitted string is unchanged.

## Slice dependency graph

```text
A overlay foundation ──> B card detail overlay ──> C card composition ──┐
D question counter -----------------------------------------------------┤
E player details -------------------------------------------------------├─> H integration + ship gates
F rail footprint -------------------------------------------------------┤
G price freshness ------------------------------------------------------┘
```

A, D, E, F, and G are parallel-ready. B depends on A because the rehosted popup
adopts the shared close/dismiss contract. C depends on B because REQ-133 forbids
moving card detail into a popup still confined to 92×128px. H depends on all
product slices so its regression evidence represents the integrated suite.

## Browser verification contract

Browser-risk slices use Playwright MCP at exactly 390×844 and 1440×900 unless a
criterion says otherwise. Each owning invocation records: agent/tool session,
checkout, frontend/backend ports, started-versus-attached ownership, observations
and measurements, capture path under
`PRD/work/ui-review/.playwright-mcp/`, `browser_close`, owned-process stop, and
port-release results. Attached or user-owned processes are never stopped.

## Verification checklist

- [ ] Focused Vitest coverage is added/updated before each implementation change and follows `PRD/instructions/test-naming.md`
- [ ] Every browser-risk slice records both viewport scenarios and runtime cleanup evidence
- [ ] All six card surfaces expose the same detail overlay and container-relative image rule
- [ ] Zone Add remains at `top <= 844px`; zone strip has no document horizontal scroll; Scan review does not displace camera chrome
- [ ] All six overlay close controls are shared/theme-derived; outside/Escape/inside-click contracts hold
- [ ] Quick Question count/gate use raw editable text while submit composition is unchanged
- [ ] In-Depth player control data shapes and unset semantics are unchanged
- [ ] Answered-workspace rail and View Context trigger do not overlap at either viewport
- [ ] Trade freshness is human-readable and one line on phone
- [ ] `npm run quality:check` is green after every slice; slice H also runs the focused full frontend suite/build needed for integration

## External coordination

`frontend-routing-and-code-splitting` is active in the same checkout and overlaps
portal/App test ownership. Its implementation must not run concurrently with this
package. Integrate it first, then implement this GAMEPLAN against the routed/lazy
shell; re-check slice F and H file lists after that integration without changing
the product objectives.
