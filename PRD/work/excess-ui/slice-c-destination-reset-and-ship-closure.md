# Slice C — Destination reset, integration proof, and ship closure

## Status: done

## Goal

Reset only In-Depth Question's secondary player presentation across destination round trips and prove
the completed interaction satisfies DEC-120/REQ-100 end to end.

## Requirements

1. Extend the internal `PortalDestination.render` contract to receive whether that destination is
   currently active, and have `DestinationOutlet` pass the boolean while preserving lazy mount,
   retained inactive mounts, and `hidden` wrapper behavior.
2. Update the destination registry so only the In-Depth entry consumes that boolean and forwards it
   to `MtgAssistantApp`. Existing destination render callbacks may ignore it; registration order,
   ids, labels, and selection behavior stay unchanged.
3. Give `MtgAssistantApp` an activity prop with an active default for focused component tests. On an
   active → inactive transition, reset only the secondary-details boolean. Do not close the outer
   roster, change player values/count, move the staged flow, consume/queue a seed, or reset any other
   Assistant state.
4. Selecting In-Depth Question while it is already active remains a no-op because activity never
   changes. Starting the app on another persisted destination must not eagerly mount or mutate the
   Assistant.
5. Add App-level coverage for: compact initial state; synchronized expansion/collapse from different
   cards; outer reset; destination round-trip reset; outer disclosure, player count, name/life/all
   counter preservation; staged-step preservation; and unchanged submission values after re-expand.
6. Update the real Life Tracker → In-Depth journey so copied counters start hidden, appear after an
   explicit nested expansion, reset hidden on a later destination round trip, and reappear unchanged.
   Tracker persistence and one-way ownership remain untouched.
7. Run focused and full verification, perform a mobile/desktop manual check against approved Mock A,
   and carry the PRD promotion checklist below for cleanup. Do not promote shipped state, write the
   receipt, delete the work folder, or ship the reference images from this slice.

## Tests

- `DestinationOutlet.test.tsx`: each retained render callback receives accurate active/inactive
  values while lazy mounting, state preservation, hidden wrappers, and current-destination no-op
  semantics remain green.
- `destinationRegistry.test.tsx`: registered entries still return valid nodes when invoked with an
  activity value; order/labels are unchanged.
- New `App.excess-player-ui.test.tsx`: real portal/menu round trip, shared arrows, outer reset, value
  and staged-step preservation, accessible state/touch targets, and unchanged eventual player
  payload through the real components.
- `App.player-life-tracker-flow.test.tsx`: one-way seeded name/life/counters, compact secondary
  default, re-expansion after destination reset, submission, and tracker non-mutation.
- Full frontend suite and repository quality gate for regression/coverage thresholds.

## Acceptance criteria

- [ ] `npm --workspace apps/frontend run test -- DestinationOutlet destinationRegistry App.excess-player-ui App.player-life-tracker-flow`
      proves the portal supplies activity without unmounting or resetting unrelated destination state.
- [ ] App-level assertions show a destination round trip preserves the open outer roster, player
      count, name/life, all representative counters, and current staged step while every nested arrow
      returns to `aria-expanded="false"` and counter inputs are absent.
- [ ] Re-expanding after return reveals the exact pre-navigation values, and the unchanged submission
      payload matches the expected `gameContext.players` data.
- [ ] Selecting the already-active destination leaves expanded/collapsed presentation and all data
      unchanged; only a real active → inactive transition invokes the reset.
- [ ] Life Tracker handoff coverage proves seed semantics and tracker persistence are unchanged while
      the Assistant's secondary presentation follows the new compact/reset rules.
- [ ] Manual review at representative narrow and wide widths confirms Mock A's nested card hierarchy,
      always-visible name/life baseline, readable counter grids, ≥44×44px arrows, exact helper copy,
      and no overlap/clipping.
- [ ] `npm --workspace apps/frontend run test`, `npm --workspace apps/frontend run typecheck`,
      `npm run quality:check`, and `git diff --check` pass from the final worktree state.
- [ ] Final diff/status review finds no backend/schema/prompt/data/scanner change, new dependency,
      persisted disclosure preference, product copy drift, reference-image import, artifact, or secret.
- [ ] The cleanup handoff below covers durable truth, system-map promotion, receipt, and deletion of
      this ephemeral work folder.

## Verification

```bash
npm --workspace apps/frontend run test -- DestinationOutlet destinationRegistry App.excess-player-ui App.player-life-tracker-flow
npm --workspace apps/frontend run test
npm --workspace apps/frontend run typecheck
npm run quality:check
git diff --check
git status --short
```

Manual check:

1. Run `npm run dev:mock` and open In-Depth Question at a narrow phone width and a wide desktop width.
2. Open **Players in game**; confirm every active card shows only name/life plus its nested arrow and
   matches the hierarchy of `mock-a-nested-player-accordion.png` without adopting its generated copy.
3. Expand from one player's arrow, add/remove a player, and collapse from another player's arrow;
   confirm every card stays synchronized and every target remains comfortably tappable.
4. Enter representative values, close/reopen the outer roster, then expand and confirm the values.
5. Expand again, switch to Quick Question and back, confirm only secondary details reset, then
   re-expand and confirm the outer roster, values, and staged flow remain intact.

## Files touched

- `apps/frontend/src/lib/portal/types.ts`
- `apps/frontend/src/components/portal/DestinationOutlet.tsx`
- `apps/frontend/src/components/portal/DestinationOutlet.test.tsx`
- `apps/frontend/src/components/portal/destinationRegistry.tsx`
- `apps/frontend/src/components/portal/destinationRegistry.test.tsx`
- `apps/frontend/src/components/portal/MtgAssistantApp.tsx`
- `apps/frontend/src/App.excess-player-ui.test.tsx` (new)
- `apps/frontend/src/App.player-life-tracker-flow.test.tsx`
- `apps/frontend/src/test/appTestHelpers.tsx`

## PRD promotion checklist (executed by `thejudge-cleanup`, not this slice)

- [ ] Confirm DEC-120 in `sections/decisions/ui-presentation.md` and its router entry in
      `sections/decisions.md` match the shipped synchronized disclosure, reset boundaries, and narrow
      DEC-095/DEC-104 preservation exception.
- [ ] Confirm REQ-100 in `sections/functional-requirements.md` and FLOW-001/FLOW-010 in
      `sections/user-flows.md` match verified compact, add/remove, accessibility, reset, and
      value-preservation behavior.
- [ ] Confirm `sections/goals-and-non-goals.md`, `sections/non-functional-requirements.md`, and the
      relevant navigation/personalization decisions still express the unchanged mobile-first,
      responsive, state-preserving, and no-new-preference boundaries.
- [ ] Update the appropriate shipped frontend catalog entries in `sections/system-map.md` (including
      Feature portal and Player Life Tracker handoff where relevant) to record the compact In-Depth
      roster and presentation-only destination reset. Apply the receipt/code system-map gate; do not
      use DEC/REQ status fields as shipped-state flags.
- [ ] Write the cleanup receipt at
      `PRD/instructions/receipts/excess-ui-<YYYY-MM-DD>.md`, including focused/full verification and
      the narrow/wide manual review result.
- [ ] Delete `PRD/work/excess-ui/` entirely after durable promotion and receipt creation, including
      the source screenshot and all three planning-only mock images.
- [ ] Leave `PRD/README.md` unchanged unless navigation or read-order guidance genuinely changed.

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/excess-ui/` ready to delete
