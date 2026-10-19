# Slice D — Reopening a saved question keeps its players

## Status: done

## Goal

Reopening a saved In-Depth question, or resuming its Draft, from Life Tracker
does not copy the tracker's players into In-Depth.

## Requirements

1. `App.tsx` gets a resume path that sets the destination directly, without
   the Life Tracker to In-Depth roster-seed check (`:62-73`).
2. `FeaturePortalMenu.tsx`'s two resume handlers (history entry near
   `:103-106`, game Draft near `:134-138`) use it. Layout and sheets unchanged.
3. The Ask a Question "Add in-depth details" carry seed (`App.tsx:81-92`) and
   the Menu-pick seed are unchanged; deep link and Back still do not seed.
4. Apply the finalized REQ-085 diff in `GATE-QUESTIONS.md` (`## REQ-085`,
   verdict accept) to `PRD/sections/functional-requirements.md` and
   `PRD/sections/life-tracker/README.md`, by intent against current truth.
   Each added line appears exactly once.

## Acceptance criteria

- [ ] Reopening an In-Depth history entry from Life Tracker leaves the roster untouched (test in `App.player-life-tracker-seed.test.tsx`)
- [ ] Resuming the In-Depth Draft from Life Tracker leaves the roster untouched (test)
- [ ] The existing seed tests pass: Menu pick and the carry gesture seed; deep link and Back do not
- [ ] The REQ-085 diff is applied to `functional-requirements.md` and `life-tracker/README.md`, each new line exactly once, no other line changed
- [ ] `FeaturePortalMenu.tsx` has no layout or style change
- [ ] Typecheck and lint pass

## Verification

```bash
npm --workspace apps/frontend run test -- App.player-life-tracker-seed App.player-life-tracker-flow FeaturePortalMenu
grep -n "is not a seed trigger\|does not seed" PRD/sections/functional-requirements.md PRD/sections/life-tracker/README.md
npm run typecheck
npm run lint
```

## Files touched

- `apps/frontend/src/App.tsx`
- `apps/frontend/src/components/portal/FeaturePortalMenu.tsx`
- `apps/frontend/src/App.player-life-tracker-seed.test.tsx`
- `PRD/sections/functional-requirements.md` (REQ-085 diff)
- `PRD/sections/life-tracker/README.md` (REQ-085 diff)
