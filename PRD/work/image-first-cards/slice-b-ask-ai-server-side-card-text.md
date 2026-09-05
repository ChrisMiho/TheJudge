# Slice B — Ask-ai resolves card text server-side; client stops sending it

## Status: done

**Implementation note (deviation from Requirement 3 as written):** `colors` is
*not* dropped from `ZoneCardItem` the way `oracleText`/`manaCost`/`manaValue`/
`typeLine`/`supertypes`/`subtypes` are. `EnrichmentStep.tsx`, `ZoneCardPicker.tsx`,
and `ScanReviewBubble.tsx` all read `card.colors` directly off the `ZoneCardItem`
for the identity ring (REQ-058, DEC-078) — dropping it broke that ring (2
failing tests: `App.interaction-flows.presentation.test.tsx`'s wizard-mode and
empty-image-fallback ring-color assertions, both falling back to the
colorless silver-gray). `zoneCards.ts`'s `buildZoneCardFromMetadata` keeps
copying `colors` for local rendering; `contextFlow/flow.ts`'s
`buildAskAiRequest` strips it from the wire card the same way it already
strips `instanceId`, so REQ-176's "the descriptive block is no longer part of
the request" still holds for what is actually sent. Recorded in REQ-176's
Notes and `integrations-and-data.md`'s `ZoneCardItem` section.

## Goal

Asking the AI a question about a card gets the exact same answer it gets
today. The backend now looks up each submitted card's oracle text, type
line, mana cost/value, colors, and sub/supertypes itself, by the card's
oracle id, from the backend artifact Slice A built — instead of trusting
whatever the browser attached to the request. Once that is proven
byte-identical, the browser stops sending those fields at all; it sends only
a card's identity and the game-state a player actually typed.

## Requirements

1. `apps/backend/src/prompt/context.ts` (and anywhere else in
   `apps/backend/src/prompt/` that currently reads `card.oracleText`,
   `card.manaCost`, `card.manaValue`, `card.typeLine`, `card.colors`,
   `card.supertypes`, `card.subtypes` off the request payload) resolves
   those fields by `cardId` from `apps/backend/data/cardDetailByOracleId.json`
   (the artifact Slice A committed) instead. An empty/absent oracle still
   emits `(none) — no oracle text recorded for this card`. This applies to
   both game-mode zone cards and lookup-mode cards.
2. An equivalence test proves the assembled prompt/context is byte-identical
   before and after this change, for both game and lookup modes, using
   `apps/backend/src/eval/contextEvaluationHarness.ts` /
   `npm run test:eval` against `apps/backend/src/eval/fixtures/`. Run and
   pass this test with the resolver wired in **before** removing the fields
   from the client-sent payload, per REQ-176's own gate.
3. Only after the equivalence test passes, the client stops attaching the
   descriptive block:
   - `apps/frontend/src/lib/zoneCards.ts` stops copying `oracleText`,
     `manaCost`, `manaValue`, `typeLine`, `colors`, `supertypes`,
     `subtypes` onto the `ZoneCardItem` it builds.
   - `apps/frontend/src/lib/contextFlow/flow.ts` (`buildLookupAskAiRequest`)
     stops attaching those same fields to the lookup-mode wire card.
   - `apps/frontend/src/types.ts` — `ZoneCardItem`'s descriptive fields
     become unnecessary on the wire shape (frontend-local state that still
     needs them, e.g. for the popup fetch's oracle id, is unaffected — only
     the descriptive block moves).
4. `apps/backend/src/validation/askAiRequest.ts` — `zoneCardItemSchema` and
   `lookupCardReferenceSchema` (via `cardReferenceShape`) stop requiring the
   descriptive fields on the wire; the schema still validates `cardId` and
   `name`, and the identity/user-entered fields already present
   (`caster`, `owner`, `targets`, `contextNotes`, `manaSpent`).
5. `caster`, `targets`, `contextNotes`, and `manaSpent` stay client-sent —
   they are game-state a player enters, not card-intrinsic data.
6. `imageUrl` stays client-side only where it already was (rendering); it
   was never sent to the LLM-facing payload and needs no change here.
7. Apply this slice's `PRD/sections/` share (re-derive each diff against
   current file content at build time):
   - New: `REQ-176` (functional-requirements.md)
   - Amend: `REQ-167` (functional-requirements.md — request-shape
     acceptance criterion + Dependencies)
   - Amend: `integrations-and-data.md` — `### ZoneCardItem`, the `Request`
     example (zones cards drop descriptive fields), the prompt-build line
     (~line 347)
   - Amend: `quick-lookup/README.md` — the lookup-mode `cards` request shape
     (identity-only, descriptive block resolved server-side)

## Acceptance criteria

- [x] B1 — `npm run test:eval` passes with the server-side resolver wired
      in, proving the assembled prompt/context is byte-identical to before
      the change, for both game and lookup modes
- [x] B2 — the backend resolves `oracleText`, `typeLine`, `manaCost`,
      `manaValue`, `colors`, `supertypes`, `subtypes` server-side by
      `cardId`; an empty/absent oracle still emits
      `(none) — no oracle text recorded for this card`
- [x] B3 — the client-sent `ZoneCardItem` (game mode) and lookup-mode card
      carry only identity and user-entered fields; a backend schema test
      proves the descriptive block is no longer required and a request
      omitting it is accepted
- [x] B4 — mock-default local dev (`ASK_AI_PROVIDER=mock`) works unchanged;
      the resolution reads the committed artifact with no runtime network
      call
- [x] B5 — the provider/route boundary stays intact
      (`apps/backend/src/providers/README.md` unchanged);
      `POST /api/ask-ai` response shape is unchanged
- [x] B6 — `apps/frontend/src/lib/zoneCards.ts` and
      `apps/frontend/src/lib/contextFlow/flow.ts` no longer copy the
      descriptive block onto the wire payload; existing tests for both
      files (and `useAskAiSubmitOrchestration`) pass with the trimmed shape
- [x] B7 — `npm run typecheck && npm run lint && npm run test` is green for
      touched frontend and backend packages
- [x] B8 — this slice's `PRD/sections/` share (listed in Requirements #7) is
      applied, re-derived against current file content, in the same change
      as the code

## Verification

```bash
npm --workspace apps/backend run test:eval
npm --workspace apps/backend run test -- src/prompt src/validation
npm --workspace apps/frontend run test -- zoneCards contextFlow useAskAiSubmitOrchestration
npm run typecheck
npm run lint
```

No browser-observable risk: the assembled prompt and `POST /api/ask-ai`
response shape are unchanged by definition (gated by the equivalence test),
and no UI surface renders the request payload directly — Playwright
verification is not required for this slice per
`PRD/instructions/runtime-process-hygiene.md`.

## Verification evidence (attempt 2)

- 2026-09-04 B4 — started this worktree's own dev server, owned ports
  `PORT=3811`/`FRONTEND_PORT=5811`, `ASK_AI_PROVIDER=mock`. `curl`'d
  `POST /api/ask-ai` with a stack card carrying only `cardId`/`name`/`targets`
  (no descriptive block at all). The mock answer's debug trace showed the
  correct `manaCost: {3}{G}`, `manaValue: 4`, `typeLine: Legendary Creature —
  Elf Druid`, and full `oracleText` ("Landfall — Whenever a land you control
  enters, you get {E}{E}...") resolved server-side from the committed
  artifact by that `cardId`, matching the artifact's own record for that
  oracle id exactly — confirming the resolver works end to end under
  `ASK_AI_PROVIDER=mock` with zero client-sent descriptive data and no
  runtime network call. Server stopped via its owning task handle afterward;
  no listener remained on 3811/5811.

## Files touched

- `apps/backend/src/prompt/context.ts` / `.test.ts`
- `apps/backend/src/prompt/promptAssembly.ts` (if it also reads request
  card fields directly)
- `apps/backend/src/eval/contextEvaluationHarness.test.ts`
- `apps/backend/src/validation/askAiRequest.ts` / `.test.ts`
- `apps/frontend/src/lib/zoneCards.ts` (+ its test file, if present)
- `apps/frontend/src/lib/contextFlow/flow.ts` / `.test.ts` (if present)
- `apps/frontend/src/types.ts`
- `PRD/sections/functional-requirements.md` (REQ-176 new; REQ-167 amended)
- `PRD/sections/integrations-and-data.md`
- `PRD/sections/quick-lookup/README.md`
