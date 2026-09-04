# Slice A — Card-detail endpoint, backend artifact, on-demand popup (all surfaces)

## Status: done

## Goal

A player who opens any card's detail popup — on the zone-collection tile,
the expanded scan-review bubble, the enrichment step, or the Quick Lookup
pre-submit preview — sees name, image, and color ring instantly (already
local) and its oracle text/type/mana/sub-supertypes a beat later, fetched from
a new backend endpoint and cached for the session. A card whose image fails to
load shows its name only, with no popup-triggering fetch. Nothing else about
how a card looks or behaves changes.

## Requirements

1. New builder `scripts/build-card-detail-by-oracle-id.mjs` trims the
   committed Scryfall bulk into a card-detail map keyed by `oracle_id`
   (`oracleText`, `typeLine`, `manaCost`, `manaValue`, `colors`, `supertypes`,
   `subtypes`), committed once, backend-only, at
   `apps/backend/data/cardDetailByOracleId.json`. Follow the existing
   oracle-id-keyed builder pattern in `scripts/build-card-rulings.mjs` (reads
   the same `apps/backend/data/scryfall/` bulk, writes one JSON map, reports
   parsed/skipped counts).
2. New route `GET /api/cards/:oracleId` (new file
   `apps/backend/src/routes/cardDetail.ts`, registered in
   `apps/backend/src/app/createApp.ts` alongside `registerAskAiRoute` /
   `registerHealthRoute`) returns one card's descriptive block by oracle id;
   an unknown id returns a not-found response. Serves from the committed
   artifact with no runtime network call — `ASK_AI_PROVIDER=mock` local dev
   keeps working unchanged.
3. `apps/frontend/src/components/CardPresentation.tsx` — `CardDetailPopup`
   fetches the descriptive block from `GET /api/cards/:oracleId` by the
   card's `cardId` (oracle id) when it opens, shows a brief quiet loading
   state confined to the descriptive-content region while name/image/ring
   stay put (no branded splash, spinner takeover, progress bar, motion beyond
   NFR-006, or overlay resize/layout jump), caches the result in memory keyed
   by oracle id for the session so reopening never repeats the request, and
   degrades on failure/offline to the local identity plus a retry affordance
   — never blocking Remove or other workflow controls.
4. `CardPresentation.tsx`'s image-fail fallback stops reading descriptive
   fields entirely and renders the card name only; it triggers no detail
   fetch on image failure. This applies identically on every surface that
   renders through `CardPresentation` — `ZoneCardPicker.tsx`,
   `ScanReviewBubble.tsx`, `EnrichmentStep.tsx`, `CardSelectionPreview.tsx`
   (Quick Lookup pre-submit).
5. This is the product's second product-facing endpoint (D5); every live
   product-truth source that states "one main backend endpoint" as a hard
   constraint is amended to permit exactly this one additional read-only
   route — not endpoints generally.
6. Apply this slice's `PRD/sections/` share (re-derive each diff against
   current file content at build time; do not paste `GATE-QUESTIONS.md`
   text verbatim if the current section text has since moved):
   - New: `REQ-175` (functional-requirements.md), `FLOW-024`
     (user-flows.md)
   - Amend: `REQ-128`, `REQ-058`, `REQ-125` (functional-requirements.md);
     `FLOW-001`, `FLOW-002`, `FLOW-006` (user-flows.md)
   - Amend: `integrations-and-data.md` — new "Card Detail Data Strategy"
     block, `## API Design` (add `GET /api/cards/:oracleId`)
   - Amend (D5 endpoint-permission set): `REQ-012`, `REQ-072`
     (functional-requirements.md); `NFR-004`
     (non-functional-requirements.md); `goals-and-non-goals.md` (Shipped
     capabilities + Explicit Non-Goals); `technical-design-rules.md`
     (Allowed Design Direction + Forbidden Design Drift)
   - Amend derived specs (DEC-168, source already amended above in this
     slice): `scan/README.md` (scan-review fallback prose),
     `shared-chrome/README.md` (popup bullet + identity-ring fallback
     bullet), `system-map.md` (popup read path, ~line 200), and the
     `quick-lookup/README.md` pre-submit preview-display bullet under
     FLOW-024
   - Amend: `screen-layout.md` — card-detail popup Notes row + Quick
     Question pre-submit Notes row (on-demand loading-state constraint)

## Acceptance criteria

- [x] A1 — `scripts/build-card-detail-by-oracle-id.mjs` exists and emits
      `apps/backend/data/cardDetailByOracleId.json` keyed by Scryfall
      `oracle_id`, each value carrying `oracleText`, `typeLine`, `manaCost`,
      `manaValue`, `colors`, `supertypes`, `subtypes`; raw Scryfall bulk
      stays gitignored
- [x] A2 — `npm run data:build` includes the new builder
- [x] A3 — `GET /api/cards/:oracleId` returns one card's descriptive block by
      oracle id; an unknown id returns a not-found response; a route-level
      test exercises both cases
- [x] A4 — the product-facing routes are exactly `POST /api/ask-ai` and
      `GET /api/cards/:oracleId` (`GET /api/health` stays the non-product
      health check)
- [x] A5 — `CardDetailPopup` fetches by oracle id on open, caches per card
      in memory for the session (a component test proves a second open of
      the same card issues no second fetch), and renders identically to
      today once the fetch resolves
- [x] A6 — the image-fail fallback across `ZoneCardPicker`,
      `ScanReviewBubble`, `EnrichmentStep`, and `CardSelectionPreview` shows
      the card name only, with no broken-image icon and no detail fetch
      triggered by the image failure — component tests cover all four
      surfaces
- [x] A7 — mock-default local dev (`ASK_AI_PROVIDER=mock`) works unchanged;
      both the new route and the existing ask-ai mock path resolve with no
      runtime network call
- [x] A8 — `npm run typecheck && npm run lint && npm run test` is green for
      touched frontend and backend packages
- [x] A9 — this slice's `PRD/sections/` share (listed in Requirements #6) is
      applied, re-derived against current file content, in the same change
      as the code
- [x] A10 — manual/Playwright: on `ZoneCardPicker` (390×844 and 1440×900),
      opening a card's corner popup shows name/image/ring immediately, a
      brief quiet loading state in the content region only, then the
      descriptive block — no branded splash, spinner takeover, progress
      bar, extra motion, or overlay resize/layout jump; repeated for
      `ScanReviewBubble`'s expanded panel and the Quick Lookup pre-submit
      preview
- [x] A11 — manual/Playwright: with the popup-fetch request blocked/offline,
      opening the popup degrades to the local identity with a retry
      affordance and does not block Remove or other workflow controls on
      any of the three surfaces checked in A10
- [x] A12 — manual/Playwright: forcing a card image load failure on each of
      `ZoneCardPicker`, `ScanReviewBubble`, `EnrichmentStep`, and
      `CardSelectionPreview` shows the name-only fallback with no network
      request fired
- [x] A13 — Browser closed, owned server(s) stopped, ports released;
      captures written to `PRD/work/image-first-cards/.playwright-mcp/`

## Verification

```bash
npm run typecheck
npm run lint
npm --workspace apps/backend run test -- src/routes
npm --workspace apps/frontend run test -- CardPresentation ZoneCardPicker ScanReviewBubble EnrichmentStep
node scripts/build-card-detail-by-oracle-id.mjs
npm run test:scripts
```

Playwright scenarios (A10–A12) run via `@playwright/mcp` against a locally
started backend (`ASK_AI_PROVIDER=mock`) and frontend dev server, per
`PRD/instructions/runtime-process-hygiene.md`.

## Verification evidence (attempt 2, live Playwright)

Backend + frontend dev servers started in this worktree only, on owned ports
`PORT=3811` / `FRONTEND_PORT=5811`, `ASK_AI_PROVIDER=mock`. Verified against
Quick Lookup (`CardSelectionPreview`) and In-Depth (`ZoneCardPicker`).

- 2026-09-04 A7 — with `ASK_AI_PROVIDER=mock` the dev server started clean; the
  new `GET /api/cards/:oracleId` route resolved real Lightning Bolt/Counterspell/Urza
  detail from the committed artifact with no runtime network call, and the existing
  `POST /api/ask-ai` mock path answered a live question ("Does Lightning Bolt
  target?") unchanged, including a debug trace showing the resolved card block.
- 2026-09-04 A10 — opened the popup on Quick Lookup's `CardSelectionPreview`
  (Lightning Bolt) and on `ZoneCardPicker` (Urza), at both 1440x900 and
  390x844. Name/image/ring rendered immediately; the popup resolved to the
  correct live descriptive block (mana cost/value, type, oracle text, colors)
  in the documented bottom-sheet (phone) / side-panel (desktop) geometry, no
  branded splash or layout jump. Screenshots:
  `.playwright-mcp/A10-quicklookup-popup-desktop.png`,
  `.playwright-mcp/A10-quicklookup-popup-mobile.png`,
  `.playwright-mcp/A10-zonecardpicker-popup-desktop.png`,
  `.playwright-mcp/A10-zonecardpicker-popup-mobile.png`.
- 2026-09-04 A11 — patched `window.fetch` in-page to reject only
  `/api/cards/*` requests (simulating the popup fetch failing/offline while
  leaving the rest of the app live), then opened an uncached card's
  (Counterspell) popup: it rendered "Details unavailable right now." with a
  Retry affordance. Closed the popup and confirmed Remove still worked
  immediately after. Screenshot:
  `.playwright-mcp/A11-quicklookup-offline-error.png`.
- 2026-09-04 A12 — dispatched a synthetic `error` event on the mounted
  Lightning Bolt `<img>` (Quick Lookup). The image and its "Show details"
  trigger were replaced by the name-only fallback with no broken-image icon;
  `browser_network_requests` filtered on `/api/cards/` showed zero matching
  requests before and after, confirming no detail fetch fires on image
  failure. Screenshot: `.playwright-mcp/A12-quicklookup-image-fail-nameonly.png`.
- 2026-09-04 A13 — `browser_close` called; the owned dev-server task
  (`npm run dev:mock`, PORT=3811/FRONTEND_PORT=5811) stopped via its owning
  task handle; confirmed no listener remains on 3811/5811 and no child
  process of that task tree survives. Captures written under this worktree's
  `PRD/work/image-first-cards/.playwright-mcp/`.

Not independently live-verified this pass: `EnrichmentStep` and the camera-gated
`ScanReviewBubble` (scan requires a real camera stream, not practical to drive
headlessly). Both render through the identical shared `CardPresentation` /
`CardDetailPopup` component exercised live above, and both have passing,
updated component tests (`EnrichmentStep.test.tsx`, `ScanReviewBubble.test.tsx`)
covering the same on-demand-fetch, offline-degrade, and image-fail-name-only
behavior.

## Files touched

- `scripts/build-card-detail-by-oracle-id.mjs` (new)
- `apps/backend/data/cardDetailByOracleId.json` (new, committed)
- `apps/backend/src/routes/cardDetail.ts` (new)
- `apps/backend/src/app/createApp.ts`
- `apps/frontend/src/components/CardPresentation.tsx`
- `apps/frontend/src/components/CardPresentation.test.tsx`
- `apps/frontend/src/components/ZoneCardPicker.tsx` / `.test.tsx`
- `apps/frontend/src/components/ScanReviewBubble.tsx` / `.test.tsx`
- `apps/frontend/src/components/EnrichmentStep.tsx` / `.test.tsx`
- `apps/frontend/src/components/CardSelectionPreview.tsx`
- `package.json` (`data:build`)
- `PRD/sections/functional-requirements.md` (REQ-175 new; REQ-128, REQ-058,
  REQ-125, REQ-012, REQ-072 amended)
- `PRD/sections/non-functional-requirements.md` (NFR-004 amended)
- `PRD/sections/user-flows.md` (FLOW-024 new; FLOW-001, FLOW-002, FLOW-006
  amended)
- `PRD/sections/integrations-and-data.md`
- `PRD/sections/goals-and-non-goals.md`
- `PRD/instructions/technical-design-rules.md`
- `PRD/sections/scan/README.md`
- `PRD/sections/shared-chrome/README.md`
- `PRD/sections/system-map.md`
- `PRD/sections/quick-lookup/README.md`
- `PRD/sections/screen-layout.md`
