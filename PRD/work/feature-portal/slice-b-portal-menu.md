# Slice B — Top-middle portal button + dropdown (ship)

## Status: done

## Goal

Add the top-middle portal menu button and its destination dropdown, wired to Slice A's registry and switch, with three non-overlapping header regions, current-mode indication, accessibility, and CSS-only reduced-motion-aware open/close motion. Final slice — carries PRD promotion checklist and ship gates.

## Depends on

Slice A (renders `PORTAL_DESTINATIONS` and calls `setActiveDestination`). **Blocker:** the button is inert without Slice A's switch, so B follows A.

## Requirements

1. `FeaturePortalMenu` renders a compact **top-middle** button on every screen (`fixed left-1/2 top-3 -translate-x-1/2 z-30`), visually distinct from the brand block and `ThemeControl`; touch-friendly (≥44px target, NFR-001).
2. Opening the button shows a dropdown listing `PORTAL_DESTINATIONS` by `label`, with the current mode indicated (`aria-current` + a check/marker); selecting an entry calls `setActiveDestination(id)` and closes the menu; the same menu is the path back (FLOW-010).
3. The brand block (left, in the page-card header), the portal button (center), and `ThemeControl` with its opened menu (right, `fixed right-3 top-3`) occupy **non-overlapping** visual bounds and pointer hit areas at mobile and desktop sizes (DEC-065 precedent). The centered button stays compact enough not to collide with the right-corner control at a 375px width.
4. Accessibility + dismissal: `aria-haspopup`, `aria-expanded`, labelled button; close on outside click and `Escape`; menu items are focusable/activatable by keyboard (mirror the `ThemeControl` interaction pattern).
5. Open/close motion is CSS-only and honors `prefers-reduced-motion` (NFR-006), reusing existing motion tokens / the `prefers-reduced-motion` block in `index.css`; no animation library. The fixed button matches `ThemeControl`'s z-index/offset treatment relative to the mock-mode banner (DEC-085) so it is never obscured.
6. Wire `FeaturePortalMenu` into the `App` shell (pass `PORTAL_DESTINATIONS`, `activeDestinationId`, `setActiveDestination`). No change to `AskAiRequest`, `GameContext`, prompt assembly, providers, or `POST /api/ask-ai`.

## Acceptance criteria

- [x] Portal button is present in the top-middle on the game-context, zone, enrichment, and answered/conversation screens; it is a distinct element from the brand block and `ThemeControl`. (Mounted at the `App` shell level, so it renders above every destination/screen; not screen-specific.)
- [x] Opening the menu lists **MTG Assistant** and **Trade Balancer** with the active one marked (`aria-current="true"`); a test asserts both items and the marker.
- [x] Selecting the non-active destination switches the visible view (Trade Balancer placeholder appears); selecting the active one is a no-op that leaves in-progress state intact (extends Slice A's preservation test through the real button).
- [x] Menu closes on item select, outside click, and `Escape`; button exposes `aria-haspopup` and `aria-expanded` reflecting open state.
- [x] Structural non-overlap test: brand block, portal button, and `ThemeControl` render as three distinct elements with their expected positioning classes (`left-1/2`/`-translate-x-1/2` center, `right-3` right). **Manual pixel non-overlap check at 375px/desktop not performed this session** — no browser automation tooling (Playwright/Puppeteer/chromium-cli) available in this environment; recommend a manual pass before/at ship.
- [x] Open/close animation present with motion enabled and reduced/disabled under `prefers-reduced-motion: reduce` (assert the reduced-motion rule covers the new animation class).
- [x] Existing `App.*.test.tsx` suite stays green.

## Verification

```bash
npm --workspace apps/frontend run typecheck
npm --workspace apps/frontend run test
npm run lint
npm run format:check
```

## Files touched

- `apps/frontend/src/components/portal/FeaturePortalMenu.tsx` (new) — button + dropdown
- `apps/frontend/src/components/portal/FeaturePortalMenu.test.tsx` (new) — list, current-mode marker, switch, dismissal, a11y
- `apps/frontend/src/App.tsx` (edit) — mount `FeaturePortalMenu` in the shell
- `apps/frontend/src/index.css` (edit) — CSS-only dropdown open/close motion + reduced-motion coverage

## Post-ship revision (2026-07-04)

User feedback on the shipped look prompted a redesign of the button itself (destination list, dismissal, a11y, and motion are unchanged):

- Button is now a flush "docked tab" — `fixed left-1/2 top-0 -translate-x-1/2`, rounded on the bottom corners only, no top border, so it reads as attached to the true top edge rather than a floating pill.
- Border color is `border-accent/55` (the same `--accent` token `ThemeControl` drives), so the outline follows the player's selected palette.
- `FeaturePortalMenu` now takes a `children` prop and renders `<div className="pt-14">{children}</div>` itself, reserving the tab's own clearance in the same component that renders the tab — `App.tsx` wraps `DestinationOutlet` as its child instead of a sibling. This was a direct response to feedback that spacing and the element needing that spacing shouldn't live in different components (previously the plan was to add clearance via `.page-shell`, which only screens using `PageShell` would have benefited from).
- Fixed a real bug surfaced while verifying in-browser: the dropdown and the tab shared one `absolute ... -translate-x-1/2` element with `.portal-menu-motion`; the `motion-enter` keyframe sets `transform` directly (`animation ... both`), which silently discarded the Tailwind translate-x and left the dropdown uncentered, hanging off the right edge on a 390px viewport. Fixed by splitting the dropdown into a positioning wrapper (`absolute left-1/2 top-11 w-56 -translate-x-1/2`) and an inner box that only carries the animation class.
- "Trade Balancer" destination label renamed to "Trade" (`destinationRegistry.tsx`, `TradeBalancerPlaceholder.tsx`); id `trade-balancer` unchanged.

Verified: typecheck, full test suite (610 tests), lint, format:check all green; visually confirmed via Playwright screenshots at 390px and 1280px viewports (closed, open, and Trade-selected states) — no overlap with the page-card header, dropdown centered under the tab, no console errors.

## Post-ship revision 2 (2026-07-04): inline header slot

Follow-up feedback: the flush fixed tab needed to sit inline between "TheJudge" and the step name (e.g. "Game context"), not float above the whole viewport. Since the button is deliberately app-shell-level chrome (renders on every destination, independent of what's active — see GAMEPLAN's "features register as destinations rather than shipping their own menu"), aligning it with one destination's header specifically required a real mechanism, not just a repositioned constant:

- `lib/portal/slotContext.tsx` (new) — a context holding `{ slotNode, registerSlot }`, defaulting to a no-op so a header can render `<PortalSlot />` and still be tested in isolation.
- `components/portal/PortalSlot.tsx` (new) — a destination header renders this where the button should sit; it registers its DOM node on mount, deregisters on unmount.
- `FeaturePortalMenu` now portals its trigger (`ReactDOM.createPortal`) into the registered slot when one is visible; otherwise it falls back to the original fixed floating tab (with the `pt-14` clearance), so a destination with no header never loses navigation.
- `StagedStepHeader` renders `<PortalSlot />` between the brand block and the step name, in a `grid-cols-[1fr_auto_1fr]` header (not flex) so the slot sits at the row's true horizontal center regardless of how wide the brand or step name are. All four staged-flow screens (game-context, zone-confirm, zone-collection, enrichment) share this header, so all four get the inline treatment; the answered/conversation view uses a separate plain header and falls back to the fixed tab.
- Real bug caught mid-verification: `DestinationOutlet` keeps inactive destinations mounted and hides them via the `hidden` attribute (for state preservation), not unmount — so a registered slot doesn't unmount when its destination becomes inactive, and the portaled button was silently disappearing (hidden along with its ancestor) instead of falling back. Fixed with an effect that re-checks `slotNode.closest("[hidden]")` whenever `activeDestinationId` or `slotNode` changes, treating a slot inside a hidden ancestor as absent.
- Second bug caught mid-verification: the initial grid used `min-w-0` on both the brand block and the step name to stop the step name from overflowing the card at 390px — but `min-w-0` on the brand let its single unbreakable word ("TheJudge") get clipped instead. Fixed by keeping `min-w-0` only on the step name (which can wrap across its two words); the brand keeps its default min-content floor.

Verified: typecheck, full test suite (611 tests), lint, format:check all green. Visually confirmed via Playwright at 390px and 1280px: button sits inline between brand and step name on game-context and zone-confirm (no overflow, no clipping), falls back to the fixed tab on Trade (nav preserved), and resumes inline when switching back to MTG Assistant with in-progress zone selections still intact.

## PRD promotion checklist (executed in thejudge-cleanup)

- [ ] Flip the **Feature portal (app navigation)** entry in `sections/system-map.md` from `planned` to `shipped`, updating **Lives in** to the real paths (`components/portal/*`, `lib/portal/types.ts`, `App.tsx`, `index.css`).
- [ ] Note in `card-trade-balancer` (system-map **Trade balancer** entry / that package) that the portal mount slot now exists and the `trade-balancer` registry `render` is the swap point.
- [ ] Confirm DEC-095 / DEC-089 / REQ-067 / FLOW-010 bodies still match shipped reality (they are the source of truth; no `Status:` edits for shipped-vs-planned — that signal lives only in the catalog).
- [ ] Write the cleanup receipt at `PRD/instructions/receipts/feature-portal-<YYYY-MM-DD>.md`, then delete `PRD/work/feature-portal/`.

## Ship gates

- [ ] Slice A and B acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged (`AskAiRequest`, `GameContext`, `POST /api/ask-ai`, prompt assembly, provider boundary all untouched)
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/feature-portal/` ready to delete
