# Slice C — Slim the up-front card list

## Status: done

### Resolution (2026-09-04, attempt 3)

NFR-019's 80%-gzipped-reduction floor was structurally unreachable: the
removed descriptive text compresses well under gzip while the kept
`cardId`/`imageUrl` barely do, so raw size dropped ~87% but gzipped only
~48.1% (4,246,522 → 2,204,907 bytes) against the live 33,399-card corpus.
Recorded as a blocker on PR #185
(https://github.com/ChrisMiho/TheJudge/pull/185#issuecomment-5546866433) with
four resolution options; the owner recalibrated the floor to **>= 40%
gzipped reduction** (relative gate kept — robust to corpus growth — floor
lowered below the measured ~48% with headroom for data-refresh drift).
Applied together, in this commit:
`MIN_GZIPPED_REDUCTION` in `scripts/build-card-metadata.mjs` (0.8 → 0.4,
doc comment updated with the recalibration rationale), and NFR-019's
`PRD/sections/non-functional-requirements.md` text (>= 40%, with the
owner-recalibration provenance note). `node scripts/build-card-metadata.mjs`
now passes: 48.1% >= 40%.

Also fixed as a forced supporting change: `scripts/compare-combo-answer-quality.test.mjs`'s
"every scenario card matches the committed card corpus field for field" test
compared every fixture field against `cardMetadata.json`, which broke once
this slice removed the descriptive block from that file. It now checks
identity/tile fields (`cardId`, `name`, `colors`) against `cardMetadata.json`
and descriptive fields (`oracleText`, `typeLine`, `manaCost`, `manaValue`,
`supertypes`, `subtypes`) against `apps/backend/data/cardDetailByOracleId.json`
— the backend artifact that now carries them (REQ-175).

C1–C10 evidence (all green, committed):
- `npm run typecheck` — clean (0 errors) with the trimmed `CardMetadataItem`
- `npm run test -- --run` — 1315/1315 frontend, 398/398 backend passing,
  including the slimmed `CardMetadataItem` fixtures across all touched
  consumers (`ZoneCardPicker`, `ZoneCollectionStep`, `useAutocompleteSuggestions`,
  `useScanCapture`, `search`, `resolveScanCandidates`, `zoneCards`,
  `contextFlow/flow`, `QuickLookupApp`, `useTradeScan`, plus the shared
  `appTestHelpers`/`interactionFlowsHarness` fixture split into
  `CardFixture` (test-only, carries the descriptive block for the
  `/api/cards/:oracleId` mock) vs. the real slim `CardMetadataItem`
  (served from `/data/cardMetadata.json`))
- No card surface renders a descriptive field from the up-front list; the
  identity ring renders from `colors` alone (unchanged by this slice — it
  was already carried up front and stays so)

## Goal

Opening MTG Assistant or Quick Lookup downloads a much smaller file than
today's 16.4 MB — just the fields a card tile actually draws: oracle id,
name, image URL, colors. Autocomplete, card selection, the image, and the
color identity ring all behave exactly as they do today off the slimmer
list. This is safe now because the popup already fetches its own detail on
demand (Slice A) and ask-ai already resolves card text server-side instead
of needing it forwarded (Slice B) — nothing left depends on the up-front
list carrying descriptive fields.

## Requirements

1. `scripts/build-card-metadata.mjs` emits
   `apps/frontend/public/data/cardMetadata.json` records containing only
   `cardId`, `name`, `imageUrl`, `colors` — no `oracleText`, `typeLine`,
   `manaCost`, `manaValue`, `supertypes`, or `subtypes`.
2. `apps/frontend/src/types.ts` — `CardMetadataItem` carries only `cardId`,
   `name`, `imageUrl`, `colors`.
3. Every consumer of `CardMetadataItem` that referenced the now-removed
   fields is updated (typecheck will surface these; expected touch points
   are the ones already grepped in this package: `ZoneCardPicker.tsx`,
   `CardSelectionPreview.tsx`, `ZoneCollectionStep.tsx`,
   `portal/MtgAssistantApp.tsx`, `portal/quick-lookup/QuickLookupApp.tsx`,
   `hooks/useAutocompleteSuggestions.ts`, `hooks/useScanCapture.ts`,
   `lib/search.ts`, `lib/zoneCards.ts`, `lib/contextFlow/flow.ts`,
   `lib/scan/resolveScanCandidates.ts`,
   `lib/conversationHistory/persistence.ts`,
   `components/trade/useTradeScan.ts`). Autocomplete, selection, image
   rendering, and the color identity ring (including the silver-gray
   colorless/missing-color fallback) render unchanged off the slimmed
   objects at both 390×844 and 1440×900.
4. The build records before/after gzipped sizes for `cardMetadata.json` and
   asserts the trimmed artifact is at least 40% smaller (gzipped) than the
   prior combined 16.4 MB artifact — a firm pass/fail gate, not an estimate
   (NFR-019; owner-recalibrated 2026-09-04 from the structurally unreachable
   80% — measured 48.1%).
5. Apply this slice's `PRD/sections/` share (re-derive each diff against
   current file content at build time):
   - New: `REQ-174`, `NFR-019` (functional-requirements.md /
     non-functional-requirements.md)
   - Amend: `integrations-and-data.md` → `## Metadata Strategy`
   - Amend: `system-map.md` → "Card search & metadata" summary
     (~line 256)
6. As the final slice, complete the PRD promotion checklist and Ship gates
   below (execution happens at cleanup, per
   `PRD/instructions/doc-lifecycle.md`, but this slice is what makes the
   package eligible: every durable outcome for all three slices — A, B, and
   C — must already be present in `PRD/sections/` by the time this slice is
   `done`).

## Acceptance criteria

- [x] C1 — `scripts/build-card-metadata.mjs` emits records with only
      `cardId`, `name`, `imageUrl`, `colors`
- [x] C2 — `apps/frontend/src/types.ts` — `CardMetadataItem` no longer
      declares the descriptive fields
- [x] C3 — the build records before/after gzipped `cardMetadata.json` size
      and asserts at least 40% reduction (owner-recalibrated 2026-09-04 from
      the structurally unreachable 80%) versus the prior combined 16.4 MB
      artifact; the assertion fails the build if not met — measured 48.1%
- [x] C4 — `npm run typecheck` is clean with the trimmed
      `CardMetadataItem` — every listed consumer (Requirements #3) compiles
      with no remaining reference to the removed fields
- [x] C5 — no card surface renders a descriptive field (oracle text, type
      line, mana cost/value, sub/supertypes) directly from the up-front
      list; those fields render only via Slice A's on-demand popup fetch —
      component tests for the surfaces touched in Requirements #3 confirm
      this
- [x] C6 — the color identity ring (including silver-gray for
      colorless/missing colors) renders from the up-front `colors` field
      with no detail fetch, on every surface that draws it
- [x] C7 — `npm run test` and `npm run quality:check` are green
- [x] C8 — this slice's `PRD/sections/` share (listed in Requirements #5) is
      applied, re-derived against current file content, in the same change
      as the code
- [x] C9 — manual/Playwright: MTG Assistant and Quick Lookup, at 390×844
      and 1440×900, show autocomplete suggestions, card selection, the
      image, and each tile's color identity ring rendering identically to
      pre-slice behavior off the slimmed data — including a colorless card
      showing the silver-gray ring
- [x] C10 — Browser closed, owned server(s) stopped, ports released;
      captures written to `PRD/work/image-first-cards/.playwright-mcp/`

## Verification

```bash
npm run typecheck
npm run lint
npm run test
node scripts/build-card-metadata.mjs
npm run quality:check
```

Playwright scenario (C9) runs via `@playwright/mcp` against a locally
started frontend dev server, per
`PRD/instructions/runtime-process-hygiene.md`.

## Files touched

- `scripts/build-card-metadata.mjs` / `.test.mjs`
- `apps/frontend/public/data/cardMetadata.json` (regenerated, committed)
- `apps/frontend/src/types.ts`
- `apps/frontend/src/components/ZoneCardPicker.tsx`
- `apps/frontend/src/components/CardSelectionPreview.tsx`
- `apps/frontend/src/components/ZoneCollectionStep.tsx`
- `apps/frontend/src/components/portal/MtgAssistantApp.tsx`
- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`
- `apps/frontend/src/hooks/useAutocompleteSuggestions.ts`
- `apps/frontend/src/hooks/useScanCapture.ts`
- `apps/frontend/src/lib/search.ts`
- `apps/frontend/src/lib/zoneCards.ts`
- `apps/frontend/src/lib/contextFlow/flow.ts`
- `apps/frontend/src/lib/scan/resolveScanCandidates.ts`
- `apps/frontend/src/lib/conversationHistory/persistence.ts`
- `apps/frontend/src/components/trade/useTradeScan.ts`
- `PRD/sections/functional-requirements.md` (REQ-174 new)
- `PRD/sections/non-functional-requirements.md` (NFR-019 new)
- `PRD/sections/integrations-and-data.md`
- `PRD/sections/system-map.md`

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change (this slice
      adds `GET /api/cards/:oracleId` from Slice A as the product's
      documented second product-facing endpoint — intentional, not drift)
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/image-first-cards/` ready to
      delete
