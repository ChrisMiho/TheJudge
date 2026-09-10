# Slice E — Warm-up ping on mount, remaining PRD-truth sweep, ship gates

## Status: done

### E3 note (code-review-level, no runtime assertion for an absence)

`TradeBalancer.tsx`'s mount effect is:

```ts
useEffect(() => {
  fetch(`${apiBaseUrl}/api/health`).catch(() => undefined);
}, []);
```

No `.then()` reads the response; no state setter is called from this effect.
The warm-up call's result never reaches component state — confirmed by
reading the diff (E3 is a code-review check, not a runtime assertion, since
you cannot assert the absence of a state write at runtime).

### E12 completeness grep — result and disposition

The narrowed grep matched only the substring `on add`/`on-add`; every other
pattern (`first printing`, `printings[0]`, `first result`, `returns first`,
`defaults? (is|to) non-foil`, `non-foil by default`, `only when ... card is
added`) had zero hits. Of the `on add` hits: the large majority are
incidental substrings inside unrelated words (e.g. "integrat**ion add**s",
"select**ion add**s", "**butt**on **add**itionally", "collect**ion add**-
action/ed", "sessi**on add**s", "isolati**on add**s", "instrumentati**on
add**s") — none of these describe the Trade Balancer's fetch timing. The
remaining handful are this slice's own new text describing the *scan* path's
unchanged "fetch prices on add" behavior (`user-flows.md:556`,
`system-map.md:556`, `functional-requirements.md:1494`,
`trade-balancer/README.md:117/179/201`) — correct, current text, not stale
wording. No remaining pre-change phrasing was found.

### Deviation carried from Slice C

`TradeBalancer.test.tsx`'s manual-search flow needed a picker-pick step
(Slice C's product behavior) and `TradeBalancer.scan.test.tsx`'s one
manual-search fallback assertion needed the same — both already applied and
noted in Slice C's status; `useTradeScan.ts` and every scan-input test
remain untouched (A11). No further deviation in this slice.

## Goal

The first card of every session prices fast: the balancer wakes the backend
the moment the screen opens, so the cold start overlaps the card-list
download and the player's typing instead of landing on the first add. This
slice also lands the eight `GATE-QUESTIONS.md` blocks whose text only becomes
fully accurate once every behaviour in Slices A–D exists (GAMEPLAN's
sequencing table).

## Requirements

1. When `TradeBalancer` mounts, issue one fire-and-forget `GET
   <apiBaseUrl>/api/health` (the origin `lib/env.ts` already exports) next to
   the existing `cardMetadata` fetch. Result discarded, errors swallowed, no
   UI, no state. It never blocks or fails search — mock-default local dev
   with no backend running is unaffected (A8).
2. No scheduled keep-warm ping and no lazy per-route backend init (non-goals,
   unchanged).
3. Apply the following eight `GATE-QUESTIONS.md` blocks, each re-derived
   against the live `PRD/sections/` text in this worktree — never a blind
   replay of the finalized diff, since prior slices may have shifted
   surrounding lines:
   - `REQ-064` → `functional-requirements.md` (the warm-up acceptance
     criterion, the AI-answer-path constraint widened, REQ-175's route
     inventory clause on `GET /api/health`).
   - `FLOW-009` → `user-flows.md` (step 1 gains the warm-up ping; the manual
     branch's pick-before-add wording; the foil-only-opens-correct-mode and
     failed-pre-add-fetch edge cases).
   - `FLOW-025` → `user-flows.md` (trigger widens to the suggestion tap; the
     loading-state location; the foil/newest-first/count-header/scroll-box
     success wording; the pre-add failure edge case; the warm-up note).
   - `PRD/sections/trade-balancer/README.md` (the whole current-state
     description: the opening paragraph, the warm-up bullet, the manual
     search and printing-picker bullets, the foil-toggle bullet, the retry
     bullet, the freshness bullet, the contract-posture bullet, the measured
     bounds, the data-footprint line, the retired-alternative note).
   - `PRD/sections/system-map.md` (the printing-price artifact build
     summary gains the order note; the Trade balancer summary is rewritten
     to describe all five shipped behaviours).
   - `PRD/sections/integrations-and-data.md` (the price endpoint's Purpose
     bullet, the printings-order bullet, the health-check Purpose list, the
     Data Strategy paragraph and its bullets).
   - `PRD/sections/overview.md` (the one-sentence Trade Balancer paragraph).
   - `PRD/sections/non-functional-requirements.md` (NFR-013's three
     constraint/notes sentences).

## Acceptance criteria

- [x] E1: `TradeBalancer` issues exactly one `GET <apiBaseUrl>/api/health`
      call on mount, alongside the `cardMetadata` fetch — unit/component
      test asserting the fetch call, not asserting on its response.
- [x] E2: A rejected/failed warm-up call produces no UI change, no thrown
      error, and no effect on search/scan availability — unit/component
      test.
- [x] E3: The warm-up call's result is never read into component state (no
      new state variable backs it) — code-review-level check, confirmed by
      reading the diff; no runtime assertion is possible for an absence.
- [x] E4: `functional-requirements.md`'s `REQ-064` and its REQ-175
      route-inventory clause are amended per the `GATE-QUESTIONS.md` block,
      re-derived against live text.
- [x] E5: `user-flows.md`'s `FLOW-009` is amended per the `GATE-QUESTIONS.md`
      block, re-derived against live text.
- [x] E6: `user-flows.md`'s `FLOW-025` is amended per the `GATE-QUESTIONS.md`
      block, re-derived against live text.
- [x] E7: `PRD/sections/trade-balancer/README.md` is amended per the
      `GATE-QUESTIONS.md` block, re-derived against live text.
- [x] E8: `PRD/sections/system-map.md` is amended per the `GATE-QUESTIONS.md`
      block, re-derived against live text.
- [x] E9: `PRD/sections/integrations-and-data.md` is amended per the
      `GATE-QUESTIONS.md` block, re-derived against live text.
- [x] E10: `PRD/sections/overview.md` is amended per the `GATE-QUESTIONS.md`
      block, re-derived against live text.
- [x] E11: `PRD/sections/non-functional-requirements.md` is amended per the
      `GATE-QUESTIONS.md` block, re-derived against live text.
- [x] E12: All twelve `GATE-QUESTIONS.md` blocks are now applied across
      Slices A, C, D, and E (per GAMEPLAN's sequencing table) — a re-run of
      the design brief's completeness grep against `PRD/sections/` finds no
      remaining pre-change wording (`grep -rniE 'on add|on-add|only when (a|that) card is added|when (a|that) card is added|first printing|printings\[0\]|first result|returns first|defaults? (is|to) non-foil|non-foil by default' PRD/sections/` — the narrower grep, excluding `printing picker`/`change printing`/`health`, which still legitimately match unrelated or now-correct text).
- [x] E13: `npm test` is green in `apps/frontend`, including
      `TradeBalancer.scan.test.tsx`.
- [x] E14: `npm run quality:check` is green.

## Verification

```bash
cd apps/frontend && npx vitest run
npm run quality:check
grep -rniE 'on add|on-add|only when (a|that) card is added|when (a|that) card is added|first printing|printings\[0\]|first result|returns first|defaults? (is|to) non-foil|non-foil by default' PRD/sections/
```

## Files touched

- `apps/frontend/src/components/trade/TradeBalancer.tsx`
- `apps/frontend/src/components/trade/TradeBalancer.test.tsx`
- `PRD/sections/functional-requirements.md` (`REQ-064`, REQ-175 route inventory)
- `PRD/sections/user-flows.md` (`FLOW-009`, `FLOW-025`)
- `PRD/sections/trade-balancer/README.md`
- `PRD/sections/system-map.md`
- `PRD/sections/integrations-and-data.md`
- `PRD/sections/overview.md`
- `PRD/sections/non-functional-requirements.md`

## Ship gates

- [x] Slice acceptance criteria satisfied and verified
- [x] Tests updated; `npm run quality:check` green for touched areas
- [x] Public contract unchanged unless slice scoped a change
- [x] No secrets committed
- [x] Durable outcomes promoted; `PRD/work/trade-balancer-first-card-ux/` ready to delete
