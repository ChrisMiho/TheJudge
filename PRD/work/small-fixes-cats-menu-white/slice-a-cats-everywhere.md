# Slice A — Cats Easter egg on every in-scope screen

## Status: done

### Status notes (evidence, self-reported; hook log does not see this worktree)

- A1-A6: `npx vitest run src/App.brand-tap-egg.test.tsx` — 6 tests pass (nine/ten taps, cross-screen count, hold after switch incl. In-depth, Life Tracker none, fresh mount hidden, compareDocumentPosition placement on Ask a Question and Trade Balancer).
- A7: `npx vitest run src/App.interaction-flows.presentation` — 12 passed (incl. the three cat tests).
- A8: `grep -rnE "brandClickCount|setBrandClickCount|EMPTY_STATE_IMAGE_URL" src` finds nothing outside tests; the one picture source is `components/CatWizardPicture.tsx`, count in `lib/portal/brandTapContext.tsx`.
- A9: `npm --workspace apps/frontend run test` — Test Files 150 passed, Tests 1615 passed. Four answered-state tests now query the title as a button (REQ-203: it is a tap target there).
- A10: live (own dev server 127.0.0.1:5391): at 390x844 and 1440x900, ten taps on Ask a Question show 1 "Cat wizard" img; Trade Balancer 1; In-depth after switch 1; Life Tracker 0 imgs and 0 title buttons; reload clears. scrollHeight vs innerHeight: [844,844] and [900,900] on Ask and Trade at both widths (no page scroll). Captures `.playwright-mcp/a-{ask,trade}-{390,1440}.png`.
- A11: REQ-203 block applied to `functional-requirements.md`, `in-depth/README.md`, `shared-chrome/README.md`.
- A12: browser closed (`browser_close`), vite pid stopped with `kill`, `lsof -ti tcp:5391` returns nothing.

## Goal

Ten taps on the title, from any in-scope screen, show the cat-wizard picture
under the header, and it stays for the session.

## Requirements

1. One in-memory, session-wide tap count held above the destinations (no
   storage key); switching screens keeps it, a reload clears it.
2. The title is a tap button (existing `BrandMark` button form) on Ask a
   Question (pre-answer and answered), In-depth Game / Zones / Cards / Context
   and its answered workspace, and Trade Balancer. Life Tracker and the
   `DestinationOutlet` loading placeholder keep a plain heading.
3. After the tenth tap the 224px picture shows directly under the banner header
   (and the mock-mode strip when shown), centred, on every in-scope screen. The
   Game step's own count and picture are removed. The "Cat wizard" text
   fallback on image failure stays. Taps never navigate.
4. Build applies its share of the accepted `PRD/sections/` amendments by
   intent, together with the code, in the same PR: the REQ-203 block of
   `GATE-QUESTIONS.md` (picture placement; In-depth spec line refresh). Source
   of truth is the finalized `GATE-QUESTIONS.md`; `PRD/work/` is deleted before
   merge, so nothing ships from inside it.

## Acceptance criteria

- [ ] A1. The tap count adds up across two different screens (test).
- [ ] A2. The reveal holds after a destination switch (test).
- [ ] A3. A fresh mount (reload) starts hidden (test).
- [ ] A4. Life Tracker has no tap target and no picture (test).
- [ ] A5. Nine taps show nothing; the tenth shows the picture (test).
- [ ] A6. Placement: on Ask a Question and Trade Balancer, the "Cat wizard" img follows the banner header and precedes page content, via `compareDocumentPosition` (test).
- [ ] A7. The three existing tests in `App.interaction-flows.presentation.test.tsx` still pass.
- [ ] A8. The Game step no longer holds its own tap count or picture (grep shows one source).
- [ ] A9. Frontend test suite passes.
- [ ] A10. Live check at 390x844 and 1440x900: ten taps on Ask a Question reveal the picture, it holds on Trade Balancer and In-depth, Life Tracker shows none, no page scroll added on Ask a Question and Trade Balancer.
- [ ] A11. The REQ-203 amendments from `GATE-QUESTIONS.md` are applied to `PRD/sections/` in this PR.
- [ ] A12. Browser closed, owned server(s) stopped, ports released; captures written to `PRD/work/small-fixes-cats-menu-white/.playwright-mcp/`.

## Verification

```bash
npm --workspace apps/frontend run test -- App.interaction-flows.presentation
npm --workspace apps/frontend run test
```

## Files touched

- `apps/frontend/src/components/BrandMark.tsx`, `StagedStepHeader.tsx`
- `apps/frontend/src/components/portal/MtgAssistantApp.tsx`, `DestinationOutlet.tsx`
- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`
- `apps/frontend/src/components/ZoneCollectionStep.tsx`, `ZoneConfirmStep.tsx`, `EnrichmentStep.tsx`
- `apps/frontend/src/components/trade/TradeBalancer.tsx`
- tests for the above (new and existing)
- `PRD/sections/` (REQ-203 and its In-depth spec line)
