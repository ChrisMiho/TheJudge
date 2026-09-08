# Slice C — Shared `cardMetadata` index

## Status: planned

## Goal

Make `cardMetadata.json` the single per-unique-card identity index for both
the question flow and the Trade Balancer, storing a representative-printing
id instead of a full image URL, with the image derived from that id at load
time — verified for single- and double-faced printings.

## Requirements

1. In `scripts/build-card-metadata.mjs`, change `toSlimCard` to store a
   representative-printing id (e.g. `imageId`) instead of the literal
   Scryfall `imageUrl` string; `cardId`, `name`, and `colors` are unchanged.
2. Grep for an existing Scryfall-image-URL-from-id helper before adding a new
   one. Add or reuse a single shared frontend module (e.g.
   `apps/frontend/src/lib/cardImage.ts`) that builds
   `https://cards.scryfall.io/normal/front/<id[0]>/<id[1]>/<id>.jpg` from a
   printing id, so both `cardMetadata` consumers and the balancer's printing
   picker (Slice D) import the same function.
3. Update `apps/frontend/src/types.ts`'s `CardMetadataItem` type and its
   consumers (`apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`,
   `MtgAssistantApp.tsx` — confirm its exact path via `grep -r
   "MtgAssistantApp" apps/frontend/src`, `CardPresentation.tsx`,
   `CardSelectionPreview.tsx`) to derive the image URL from the stored id via
   the shared helper instead of reading a literal `imageUrl` field.
4. Verify the derived URL resolves for both a single-faced and a
   double-faced representative printing (Scryfall composes a double-faced
   card's front-face URL from the printing id with the same `front` path
   segment as a single-faced card) — add or extend a test asserting this
   against a real double-faced printing id present in the committed source
   data.
5. Re-run the NFR-019 gzip gate in `scripts/build-card-metadata.mjs`'s
   `main()` (`assertGzippedReduction`, `MIN_GZIPPED_REDUCTION = 0.4`) against
   the new slim shape — it should still pass, since dropping the full URL
   string only improves the ratio. Update the recorded measured figure in
   `PRD/sections/non-functional-requirements.md` NFR-019 (Constraints and
   Notes bullets) and the code comment above `MIN_GZIPPED_REDUCTION` to the
   newly measured percentage.
6. Extend `apps/frontend/src/lib/metadataTransformPolicy.test.ts` (the
   existing indirect test for this build script) to cover the new
   `imageId`-based slim shape.
7. Regenerate `apps/frontend/public/data/cardMetadata.json` via `npm run
   data:build` and commit it.
8. Apply the REQ-174 diff from `GATE-QUESTIONS.md` to
   `PRD/sections/functional-requirements.md` verbatim.

## Acceptance criteria

- [ ] C1: `scripts/build-card-metadata.mjs`'s slim output stores a
      representative-printing id (not a full `imageUrl` string) per card,
      alongside `cardId`, `name`, `colors`.
- [ ] C2: A single shared frontend helper derives the Scryfall image URL from
      a printing id via the documented template; `QuickLookupApp.tsx`,
      `MtgAssistantApp.tsx`, `CardPresentation.tsx`, and
      `CardSelectionPreview.tsx` all import it rather than reading a literal
      `imageUrl` field off `cardMetadata`.
- [ ] C3: A test asserts the derived URL resolves correctly for a real
      single-faced representative printing id and a real double-faced
      representative printing id from the committed Scryfall source.
- [ ] C4: `scripts/build-card-metadata.mjs` still passes its internal NFR-019
      gzip-reduction assertion (`MIN_GZIPPED_REDUCTION = 0.4`) against the new
      slim shape.
- [ ] C5: `PRD/sections/non-functional-requirements.md` NFR-019's recorded
      measured gzip figure matches the newly measured build output.
- [ ] C6: `apps/frontend/src/lib/metadataTransformPolicy.test.ts` passes with
      coverage for the new `imageId`-based shape.
- [ ] C7: The frontend test suite (`npm test` in `apps/frontend`) passes for
      the touched files.
- [ ] C8: `PRD/sections/functional-requirements.md`'s REQ-174 block matches
      the `GATE-QUESTIONS.md` diff's `+` lines byte-for-byte.

## Verification

```bash
npm run data:build
npm test --workspace apps/frontend -- metadataTransformPolicy
```

## Files touched

- `scripts/build-card-metadata.mjs`
- `apps/frontend/src/lib/cardImage.ts` (new, or a reused existing helper)
- `apps/frontend/src/types.ts`
- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`
- `MtgAssistantApp.tsx` (path confirmed via grep)
- `apps/frontend/src/components/CardPresentation.tsx`
- `apps/frontend/src/components/CardSelectionPreview.tsx`
- `apps/frontend/src/lib/metadataTransformPolicy.test.ts`
- `apps/frontend/public/data/cardMetadata.json`
- `PRD/sections/functional-requirements.md` (REQ-174)
- `PRD/sections/non-functional-requirements.md` (NFR-019 measured figure)
