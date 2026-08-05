# Receipt — center-menu-tab-prominence

- Date: 2026-08-04
- Slug: `center-menu-tab-prominence`
- Status: shipped

## Actions taken

- [x] Verified Slice A: `StagedStepHeader` no longer accepts/renders `stepName`; brand block + subtitle center in the header; shared `StepEyebrow` renders above each step's content on Zone Confirm, Zone Collection, Enrichment, Trade Balancer, and game-context; Life Tracker / conversation view remain without an eyebrow.
- [x] Verified Slice B: Menu trigger is a top-left radial-gradient corner rail (no border/pill-on-glow); open state is a partial-height left-edge sliding drawer (`translateX`); docked inline via `PortalSlot` with top-left fixed fallback; `prefers-reduced-motion` snaps the drawer; tests assert top-left geometry and unchanged open/close/Theme/action behavior.
- [x] Confirmed DEC-122 (`decisions/navigation.md`) and amended REQ-045 / REQ-067 / REQ-089 match shipped behavior; DEC-121 / REQ-101 remain superseded tombstones. No `DEC`/`REQ` `Status:` field was edited to convey shipped-vs-planned.
- [x] Confirmed public contract unchanged (frontend chrome only).
- [x] Reviewed for secret-like patterns; none found.
- [x] Promoted `system-map.md` **Feature portal** summary/lives-in/backed-by to corner-rail + eyebrow reality; refreshed shipped capabilities in `goals-and-non-goals.md`.
- [x] Updated ideation follow-up package pointer away from the deleted work folder.
- [x] Deleted `PRD/work/center-menu-tab-prominence/` after receipt creation; removed slug from `PRD/work/STATUS.md`.

## Files created

- `PRD/instructions/receipts/center-menu-tab-prominence-2026-08-04.md`
- `apps/frontend/src/components/StepEyebrow.tsx` (+ test)

## Files updated

- `PRD/sections/decisions.md` (DEC-122 router; DEC-121 supersession note — already present from refinement)
- `PRD/sections/decisions/navigation.md` (DEC-122; DEC-121 tombstone note — already present)
- `PRD/sections/functional-requirements.md` (REQ-045, REQ-067, REQ-089 amendments; REQ-101 supersession — already present)
- `PRD/sections/system-map.md` (Feature portal)
- `PRD/sections/goals-and-non-goals.md` (shipped corner-rail capability)
- `PRD/work/STATUS.md` (slug removed)
- `PRD/work/center-menu-tab-prominence-followup/README.md` (pointer → receipt)
- `apps/frontend/src/components/{StagedStepHeader,BrandMark,ZoneConfirmStep,ZoneCollectionStep,EnrichmentStep}.tsx` (+ tests as applicable)
- `apps/frontend/src/components/trade/TradeBalancer.tsx`
- `apps/frontend/src/components/portal/{FeaturePortalMenu,PortalSlot,MtgAssistantApp}.tsx` (+ tests)
- `apps/frontend/src/index.css` (`.portal-menu-rail`, drawer, `.step-eyebrow`)

## Files deleted

- `PRD/work/center-menu-tab-prominence/` (entire folder, after promotion)

## Verification results

- Package marker `STATUS.ship-ready` + board row confirmed before cleanup.
- Targeted Vitest: `StepEyebrow`, `FeaturePortalMenu`, and related header suites — passed.
- `npm run quality:check` — green after ambient-accent assertion update co-shipped with `assistant-chat-shell` cleanup (same session).
- Public `AskAiRequest` / Zod / backend contract unchanged.
