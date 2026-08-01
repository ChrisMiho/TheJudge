# Slice D — Quick Lookup entry and optional single-card input

## Status: done

## Goal

Register Quick Lookup as a feature-portal destination with optional single-card
input (typed search or camera scan), card presentation, a question field, and
the local core-topics empty-state fallback (REQ-073 / REQ-079 UI half).

## Requirements

1. New `QuickLookupApp` component (suggest
   `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`)
   registered in `PORTAL_DESTINATIONS`
   (`apps/frontend/src/components/portal/destinationRegistry.tsx`) as `{ id:
   "quick-lookup", label: "Quick Lookup", render: () => <QuickLookupApp /> }`.
   Opens as a frontend-only view switch via the existing `DestinationOutlet`; no
   navigation menu of its own.
2. Single-card input, both required (either resolves to one `CardMetadataItem`):
   - Typed search: drive `useAutocompleteSuggestions`
     (`apps/frontend/src/hooks/useAutocompleteSuggestions.ts`) +
     `getSuggestions` / `NO_MATCH_COPY` (`apps/frontend/src/lib/search.ts`)
     directly, mirroring the state-wiring pattern `ZoneCollectionStep.tsx` uses
     (`searchInput`, `selectedCard`, suggestion visibility/keyboard nav) — do
     **not** reuse `ZoneCardPicker` wholesale, since it is zone/add-semantics
     shaped (owner selection, add-to-zone button, stack position). Render
     suggestions and selection with `CardSelectionPreview`.
   - Scan: drive `ScanCameraSurface` + `useScanCapture` +
     `resolveScanCandidates` (`apps/frontend/src/lib/scan/resolveScanCandidates.ts`,
     FLOW-006 engine) the same way `ZoneCollectionStep` does, resolving to one
     card rather than an add-to-zone action. Inherits FLOW-006's permission
     fallback to manual search; scanned-printing art stays presentation-only
     (DEC-053) — never pushed into the request/prompt.
3. Card input is optional: the user may submit a question with no card
   attached. Only one card is active at a time; no zones, stack, phase,
   multi-card setup, or per-card enrichment-editing controls.
4. When a card is resolved, show its name, image (when available), and full
   oracle text/metadata via `CardPresentation` / `CardSelectionPreview` before
   the user asks; the user can remove or replace it before submitting.
5. Freeform question field: same 300-char cap as the main flow question
   (REQ-011); submit disabled/blocked when the trimmed question is empty.
6. Empty state (no card attached, no question submitted yet): fetch
   `/data/gameRulesCoreTopics.json` at runtime (same base-path pattern
   `/data/cardMetadata.json` uses via `apps/frontend/src/lib/env.ts`), render a
   short list of topics (title + excerpt), and an "ask about this" affordance
   per topic that pre-fills the question field without calling the model.
   Attaching a card or typing a question both replace the empty state.
7. This slice builds and ships the **input surface only** — submitting the
   question, receiving an answer, and the conversation thread are Slice E's
   scope. Stub the submit action (e.g. a disabled/no-op button or a
   `onSubmit` prop the parent will wire) so this slice is independently
   testable against Slice A's types without waiting on Slice B/E.

## Acceptance criteria

- [ ] Quick Lookup appears in the portal dropdown and opens as a view switch
      with no reload.
- [ ] Typing 3+ characters of a card name shows autocomplete suggestions
      (REQ-001/002 behavior); no match shows `NO_MATCH_COPY`; selecting a
      suggestion resolves one `CardMetadataItem` and shows its presentation.
- [ ] Scanning a card (mocked capture in tests) resolves one `CardMetadataItem`
      via the same `resolveScanCandidates` path FLOW-006 uses.
- [ ] A resolved card can be removed/replaced before submitting.
- [ ] The question field accepts up to 300 chars; submit is blocked when the
      trimmed question is empty, with or without a card attached.
- [ ] With no card and no question, the core-topics list renders from the
      fetched `/data/gameRulesCoreTopics.json`; "ask about this" pre-fills the
      question field and does not trigger any network call to `/api/ask-ai`.
- [ ] Attaching a card or typing a non-empty question hides the core-topics
      empty state.

## Verification

```bash
npm --workspace apps/frontend run test -- QuickLookupApp
npm --workspace apps/frontend run typecheck
```

## Files touched

- `apps/frontend/src/components/portal/destinationRegistry.tsx`
- `apps/frontend/src/components/portal/destinationRegistry.test.tsx`
- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx` (new)
- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.test.tsx` (new)

## Notes

- Depends on Slice A for the `card` reference shape (field set to resolve into)
  and Slice C for the core-topics artifact it fetches at runtime; can be
  built/unit-tested against A's types and a fixture core-topics JSON before C's
  real build output lands.
- Slice E wires this shell's submit path into
  `useAskAiSubmitOrchestration` and the conversation thread — do not build a
  second submit/answer flow here.
