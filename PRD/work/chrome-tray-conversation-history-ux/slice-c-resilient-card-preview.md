# Slice C — Resilient resumed card context preview

## Status: planned

## Goal

Opening View Context for a frozen/resumed lookup card must never crash when card metadata arrays
or optional preview fields are missing; render safe fallbacks instead (DEC-144 / REQ-119).

## Requirements

1. `CardSelectionPreview` must tolerate missing/undefined `colors`, `supertypes`, `subtypes` (and
   similarly optional preview fields it already N/A-handles) without throwing.
2. Available fields still display; missing lists show an N/A-style fallback consistent with
   existing empty handling (`formatMetaList` today returns `"N/A"` for empty arrays — extend that
   to non-arrays).
3. Freshly submitted card-bearing Quick Question conversations that reach history must still
   restore a previewable card when full metadata was available at submit — prefer storing the full
   `CardMetadataItem` shape on save/restore when present (orchestration already freezes
   `payload.card`; verify the history write path does not strip arrays).
4. In-Depth game-context View Context path must not regress.
5. Frontend-only — no Scryfall re-fetch at resume; no Ask AI contract change.

## Acceptance criteria

- [ ] Rendering `CardSelectionPreview` with a card missing `colors` / `supertypes` / `subtypes`
      does not throw
- [ ] View Context for such a resumed lookup entry opens without white-screening the app
- [ ] Missing lists show N/A-style fallbacks; present fields still render
- [ ] A full card saved at submit still restores a complete preview after history resume
- [ ] Frozen game-context View Context (In-Depth) still works

## Verification

```bash
npm --workspace apps/frontend run test -- CardSelectionPreview
npm --workspace apps/frontend run test -- QuickLookupApp
npm --workspace apps/frontend run test -- AdaptiveContextDialog
npm --workspace apps/frontend run test -- FrozenGameContextDetails
npm run quality:check
```

Add a focused unit test for incomplete metadata (create `CardSelectionPreview.test.tsx` if none
exists). Prefer a regression that would have caught `formatMetaList` calling `.length` on
`undefined`.

## Files touched

- `apps/frontend/src/components/CardSelectionPreview.tsx`
- `apps/frontend/src/components/CardSelectionPreview.test.tsx` (new or extended)
- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx` only if the save/restore
  path strips card metadata (verify first; change only if needed)
- Related Quick Lookup / history restore tests only if save-path completeness needs coverage

## Notes

Parallel-ready with slices A, B, and D — disjoint files unless a save-path fix is required.
