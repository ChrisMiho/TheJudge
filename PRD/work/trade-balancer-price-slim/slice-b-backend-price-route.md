# Slice B — Backend price route

## Status: done

## Goal

Serve one card's printings and prices by oracle id from a new read-only
sibling route, mirroring the existing card-detail load-and-serve pattern with
no runtime network call, and record the route's product truth (REQ-175,
NFR-004) including the required echo-home sweep.

## Requirements

1. Add `apps/backend/src/cardPrices.ts` (or extend `cardDetail.ts`) exporting
   `loadCardPrintingPricesIndex(filePath): Map<string, CardPrintingPricesEntry>`
   that mirrors `loadCardDetailIndex`'s startup-load, no-throw,
   empty-map-plus-one-time-warn behavior on a missing/unparseable file, so
   mock-default dev boots clean with no committed file.
2. Add `apps/backend/src/routes/cardPrices.ts` exporting
   `registerCardPricesRoute(app, deps: { cardPrintingPricesIndex })`
   registering `GET /api/cards/:oracleId/prices`. Success: `200 { oracleId,
   snapshotDate, printings: [...] }`. Unknown oracle id: `404 { error:
   "card_not_found" }` — matching the REQ-175 diff's contract exactly.
3. Wire the loader into `apps/backend/src/runtime/createConfiguredApp.ts`
   (resolve `apps/backend/data/cardPrintingPricesByOracleId.json`) and
   register the route in `apps/backend/src/app/createApp.ts` immediately
   after the existing card-detail route registration, before
   `registerAskAiRoute`. `POST /api/ask-ai` and its internal
   `cardDetailIndex` read stay byte-for-byte untouched.
4. Add `apps/backend/src/routes/cardPrices.test.ts` mirroring
   `cardDetail.test.ts`'s three cases: known oracle id returns
   printings+prices+snapshotDate; unknown oracle id returns 404; no index
   configured still boots and serves 404 with no runtime network call.
5. Apply the REQ-175 and NFR-004 diffs from `GATE-QUESTIONS.md` to
   `PRD/sections/functional-requirements.md` and
   `PRD/sections/non-functional-requirements.md` verbatim. For NFR-004, grep
   the full echo-home list its own canonical block names (REQ-012, REQ-072,
   REQ-094, `goals-and-non-goals.md`, `overview.md`,
   `instructions/technical-design-rules.md`, `quick-lookup/README.md`,
   `in-depth/README.md`, `integrations-and-data.md`, `PRD/README.md`) and
   update every live hit still stating "one main endpoint plus one read-only
   route" to name the third read-only price route.
6. Update the `CardPrintingPrice` shape / API-and-endpoint section in
   `sections/integrations-and-data.md` (derived, non-authoritative) to
   describe the new `/prices` route and its response shape.

## Acceptance criteria

- [x] B1: `apps/backend/src/routes/cardPrices.test.ts` passes: known oracle id
      returns printings+prices+snapshotDate; unknown oracle id returns `404 {
      error: "card_not_found" }`; no index configured still boots and returns
      404 with no runtime network call.
- [x] B2: `GET /api/cards/:oracleId/prices` is registered in `createApp.ts`
      after the card-detail route and before the ask-ai route; the existing
      ask-ai route test suite is unchanged and still green.
- [x] B3: `loadCardPrintingPricesIndex` never throws on a missing/unparseable
      committed file — it logs once and returns an empty map, matching
      `loadCardDetailIndex`'s pattern.
- [x] B4: The backend test suite (`npm test` in `apps/backend`) passes in
      full.
- [x] B5: `PRD/sections/functional-requirements.md`'s REQ-175 block matches
      the `GATE-QUESTIONS.md` diff's `+` lines byte-for-byte.
- [x] B6: `PRD/sections/non-functional-requirements.md`'s NFR-004 canonical
      block matches the `GATE-QUESTIONS.md` diff's `+` lines byte-for-byte,
      and every live NFR-004 echo home found by grep is updated to name three
      product-facing routes, not two. Swept: REQ-012, REQ-072, REQ-094,
      REQ-175 (via its own diff), `goals-and-non-goals.md`, `overview.md`
      (unchanged — "single main backend endpoint" already excludes the
      read-only routes by design), `instructions/technical-design-rules.md`
      (two spots), `quick-lookup/README.md`, `in-depth/README.md`,
      `integrations-and-data.md` (new endpoint section, B7), `PRD/README.md`.
- [x] B7: `PRD/sections/integrations-and-data.md`'s API/endpoint section
      documents `GET /api/cards/:oracleId/prices` and its response shape.

## Verification

```bash
npm test --workspace apps/backend
grep -rn "NFR-004" PRD/sections PRD/instructions PRD/README.md
```

## Files touched

- `apps/backend/src/cardPrices.ts` (new)
- `apps/backend/src/cardPrices.test.ts` (new — loader-level coverage: missing file, unparseable file, well-formed load, null-price passthrough)
- `apps/backend/src/routes/cardPrices.ts` (new)
- `apps/backend/src/routes/cardPrices.test.ts` (new)
- `apps/backend/src/runtime/createConfiguredApp.ts`
- `apps/backend/src/app/createApp.ts`
- `apps/backend/src/index.ts` (startup log: `cardPrintingPricesCardCount`)
- `PRD/sections/functional-requirements.md` (REQ-175, plus REQ-012/REQ-072/REQ-094 NFR-004 echoes)
- `PRD/sections/non-functional-requirements.md` (NFR-004)
- `PRD/sections/integrations-and-data.md`
- `PRD/sections/goals-and-non-goals.md` (NFR-004 echo)
- `PRD/instructions/technical-design-rules.md` (NFR-004 echo, two spots)
- `PRD/sections/quick-lookup/README.md` (NFR-004 echo)
- `PRD/sections/in-depth/README.md` (NFR-004 echo)
- `PRD/README.md` (NFR-004 echo)
