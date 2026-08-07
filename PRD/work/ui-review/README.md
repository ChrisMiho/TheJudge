status: active

# ui-review

## Autonomous metadata

- Autonomous base: origin/feature/routing

Concrete UI polish/bug-fix pass over the card-context flow and player/game panels (see `braindump.md`, `IDEA.md`).

Absorbs `ui-screen-layout-truth`'s problem framing — that package's durable deliverable (`PRD/sections/screen-layout.md`, DEC-149, REQ-126) already shipped outside `PRD/work/`, so its work-package folder was retired rather than merged file-for-file. Refinement here should use that catalog as the layout guardrail, not re-derive it.

## Slices

| Slice | Status | Objective | Depends on |
| --- | --- | --- | --- |
| [A](slice-a-overlay-foundation.md) | done | Shared themed close control and one outside-dismiss contract across the overlay family | — |
| [B](slice-b-card-detail-overlay.md) | done | Portal-hosted card detail bottom sheet / side panel on all six card surfaces | A — consumes the shared close and dismiss primitives |
| [C](slice-c-card-composition.md) | done | Container-relative card sizing, staged-card consolidation, and zone selected-card composition | B — consolidation cannot target the image-bound popup |
| [D](slice-d-question-counter.md) | planned | Raw-editable-text counter and submit-gate integrity in Quick Question | — |
| [E](slice-e-player-details.md) | planned | In-Depth player disclosure, grouped counter rows, and bounded scalar selects | — |
| [F](slice-f-rail-footprint.md) | planned | Real in-flow corner-rail footprint and answered-workspace gap removal | — |
| [G](slice-g-price-freshness.md) | planned | Human-readable Trade Balancer price freshness | — |
| [H](slice-h-integration-and-ship-gates.md) | planned | Integrated browser regression, full quality gate, and cleanup handoff | A–G |

Known live-verification limit carried forward from slice B: the Scan review card
surface cannot be reached in Playwright because the client-side perceptual-hash
identifier never converges on Chrome's synthetic fake-camera pattern, and this MCP
server exposes no `--use-file-for-fake-video-capture` control. That surface is
covered by `ScanReviewBubble.test.tsx` plus the shared component/CSS rule measured
live on the other five surfaces. Slices C and H should re-attempt it live only if a
real-camera path becomes available, and otherwise record the same limit.

Slices A, D, E, F, and G are parallel-ready from a product/dependency standpoint.
B is sequential on A, C is sequential on B, and H is sequential on every product
slice. The blockers are structural: B adopts A's shared overlay primitives; C must
not consolidate detail into the currently image-bound popup; H verifies the final
integrated state.

## Implementation map

| Area | Primary files |
| --- | --- |
| Overlay primitives and adopters | `apps/frontend/src/components/OverlayCloseButton.tsx` (new), shared outside-dismiss helper/hook (new), `AdaptiveContextDialog.tsx`, `ConversationHistoryDrawer.tsx`, `feedback/FeedbackModal.tsx`, `portal/FeaturePortalMenu.tsx`, `portal/life-tracker/CounterPanel.tsx`, `portal/life-tracker/PlayerLifeTrackerApp.tsx` |
| Card detail and shared sizing | `apps/frontend/src/components/CardPresentation.tsx`, `CardSelectionPreview.tsx`, `ZoneCardPicker.tsx`, `EnrichmentStep.tsx`, `ScanReviewBubble.tsx`, `portal/quick-lookup/QuickLookupApp.tsx`, `index.css` |
| Quick Question counter | `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx` and counter regression tests for Quick Lookup, Enrichment, and Follow-up |
| In-Depth player details | `apps/frontend/src/components/PlayerRosterEditor.tsx`, `portal/MtgAssistantApp.tsx`, and their focused tests |
| Portal rail / answered workspace | `apps/frontend/src/components/portal/PortalSlot.tsx`, `FeaturePortalMenu.tsx`, `ConversationWorkspace.tsx`, `index.css` |
| Trade freshness | `apps/frontend/src/components/trade/TradeBalancer.tsx` and `TradeBalancer.test.tsx` |

## Cross-package coordination

`frontend-routing-and-code-splitting` is also active and touches portal/App test
surfaces. Do not run its implementation concurrently with this package. Rebase or
merge its final implementation first, then re-resolve the slice F rail ownership and
the slice H integration tests against the routed/lazy destination shell. This is an
external file-conflict blocker, not a product dependency between the packages.

## Durable truth already refined

DEC-158–160, amendments to DEC-142/151/156, REQ-011/091/125/128–130/133–145,
and the affected `screen-layout.md` rows are the implementation authority. The
final slice checks those records and corrects stale flow wording before cleanup;
it does not invent a second roadmap or promote work-package prose as durable truth.

## Next step

Start with `$thejudge-implement PRD/work/ui-review/ slice A`, or complete the
package unattended with `$thejudge-implement-all PRD/work/ui-review/` after the
cross-package coordination note above is satisfied.
