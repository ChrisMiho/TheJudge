# Slice B — Snapshot builder + seam contract

## Status: planned

## Goal

Build the pure app-state snapshot builder and the shell-level decoupling seam
(`FeedbackContextProvider` + `registerFeedbackContributor` + `getFeedbackContext()`) as a
self-contained module, so the modal (Slice D) and integration (Slice E) can consume disclosed app
state without the modal ever reaching into flow internals (DEC-105, REQ-088).

## Requirements

1. `apps/frontend/src/lib/feedback/types.ts` — define `FeedbackFlowSnapshot` (the shape a flow
   contributor returns: screen/step, game context + typed question, zones/cards/enrichment,
   conversation history — all optional/absent when nothing is in progress),
   `FeedbackContextContributor = () => FeedbackFlowSnapshot | null`, and `FeedbackContext` (the full
   disclosed snapshot: flow fields + `providerMode`, `activeDestinationId`, and `environment`).
2. `apps/frontend/src/lib/feedback/environment.ts` — `readEnvironmentSnapshot()`: an isolated, thin,
   impure function reading `navigator.userAgent`, viewport dimensions, current route, `Date.now()`
   timestamp, and build/version — kept separate so the builder itself stays pure and easy to test.
3. `apps/frontend/src/lib/feedback/buildFeedbackContext.ts` — `buildFeedbackContext(input):
   FeedbackContext` is a **pure** function taking an explicit `{ flowSnapshot: FeedbackFlowSnapshot |
   null; providerMode; activeDestinationId; environment }` and returning the merged `FeedbackContext`.
   Identical inputs produce a deep-equal output every call. When `flowSnapshot` is `null` (no
   contributor registered), it still returns a valid snapshot built from shell + environment fields
   only.
4. `apps/frontend/src/lib/feedback/FeedbackContextProvider.tsx` — a React context provider taking
   `activeDestinationId` and `providerMode` as props. Exposes two hooks:
   - `useRegisterFeedbackContributor(contributor: FeedbackContextContributor)` — effect-based; the
     last-registered contributor wins (v1 has exactly one live flow, MTG Assistant); unmounting the
     registering component clears the registration via effect cleanup.
   - `useFeedbackContextReader(): () => FeedbackContext` — returns a stable `getFeedbackContext`
     callback that calls the registered contributor (or `null`), reads the environment, and delegates
     to `buildFeedbackContext`. Never throws when no contributor is registered.

## Acceptance criteria

- [ ] `buildFeedbackContext()` is pure: same input object (deep-equal, not same reference) produces a
      deep-equal output across repeated calls
- [ ] With `flowSnapshot: null`, `buildFeedbackContext()` still returns a valid `FeedbackContext`
      containing only shell + environment fields, never throws
- [ ] With a populated `flowSnapshot`, the returned `FeedbackContext` carries screen/step, game
      context + typed question, zones/cards/enrichment, and conversation history through unchanged
- [ ] `FeedbackContextProvider`'s `getFeedbackContext()` never mutates app state — a test asserts the
      flow snapshot fixture object passed in is unchanged after the call, and each call returns a
      fresh object (not a cached reference)
- [ ] Registering a contributor then unmounting clears it: a subsequent `getFeedbackContext()` call
      falls back to the `flowSnapshot: null` path
- [ ] `npm --workspace apps/frontend run typecheck` passes

## Verification

```bash
npm --workspace apps/frontend run test -- feedback
npm --workspace apps/frontend run typecheck
```

## Files touched

- `apps/frontend/src/lib/feedback/types.ts`
- `apps/frontend/src/lib/feedback/environment.ts`
- `apps/frontend/src/lib/feedback/buildFeedbackContext.ts`
- `apps/frontend/src/lib/feedback/buildFeedbackContext.test.ts`
- `apps/frontend/src/lib/feedback/FeedbackContextProvider.tsx`
- `apps/frontend/src/lib/feedback/FeedbackContextProvider.test.tsx`
