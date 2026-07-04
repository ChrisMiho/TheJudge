# Receipt — feature-portal

- Date: 2026-07-04
- Slug: feature-portal
- Status: shipped

## Actions taken

- [x] Verified Slice A (registry, `MtgAssistantApp` extraction, `DestinationOutlet`) and Slice B (`FeaturePortalMenu`, three post-ship revisions) acceptance criteria are all satisfied.
- [x] Ran ship gate `npm run quality:check` — typecheck, lint, format:check, full frontend/backend test suites, and coverage checks all green.
- [x] Confirmed public contract unchanged: no edits to `AskAiRequest`, `GameContext`, `POST /api/ask-ai`, prompt assembly, or the provider boundary.
- [x] Confirmed DEC-095, DEC-089, REQ-067, FLOW-010 bodies already match shipped reality (no `Status:` edits — that signal lives only in the system-map catalog).
- [x] Applied the system-map promotion gate: flipped **Feature portal (app navigation)** from `planned` to `shipped`, updated **Lives in** to the real paths.
- [x] Noted the swap point in the **Trade balancer** system-map entry: `destinationRegistry.tsx`'s `trade-balancer` entry `render`, currently `() => <TradeBalancerPlaceholder />`.
- [x] Reviewed the working-tree diff (`git diff --check`) for whitespace errors and secrets; none found.
- [x] Deleted `PRD/work/feature-portal/`.

## Files created

- `PRD/instructions/receipts/feature-portal-2026-07-04.md`

## Files updated

- `PRD/sections/system-map.md` (Feature portal entry flipped to `shipped` with real file paths; Trade balancer entry notes the portal mount slot + swap point)
- `apps/frontend/src/components/portal/FeaturePortalMenu.tsx` (post-ship revision 3: card-anchored tab in normal flow, `portal-slot-tab` class, dropdown wrapper bumped to `z-20`)
- `apps/frontend/src/components/portal/FeaturePortalMenu.test.tsx` (updated inline-header assertion for `portal-slot-tab`)
- `apps/frontend/src/components/portal/PortalSlot.tsx` (`self-start` so the vertical lift measures from the row's true top, not the centered grid position)
- `apps/frontend/src/index.css` (`.portal-slot-tab` negative-margin lift per breakpoint/density)

## Files deleted

- `PRD/work/feature-portal/README.md`
- `PRD/work/feature-portal/GAMEPLAN.md`
- `PRD/work/feature-portal/IDEA.md`
- `PRD/work/feature-portal/DESIGN-BRIEF.md`
- `PRD/work/feature-portal/slice-a-registry-and-switch.md`
- `PRD/work/feature-portal/slice-b-portal-menu.md`
- `PRD/work/feature-portal/Screenshot 2026-07-04 at 11.23.43 AM.png`
- `PRD/work/feature-portal/.DS_Store`

## Verification results

- `npm run quality:check` — passed: typecheck, lint, format:check clean.
- Frontend tests: 69 files, 611 tests passed.
- Backend tests: 22 files, 223 tests passed.
- `git diff --check` — clean.
- Manual/visual verification (performed during implementation, per slice B's post-ship revision notes): Playwright screenshots at 390px and 1280px viewports (closed, open-with-dropdown, Trade fallback states) and 390px slim density; bounding-rect measurements confirmed button-top to card-border alignment within 1px in all density/breakpoint combinations.
