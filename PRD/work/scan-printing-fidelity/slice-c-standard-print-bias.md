# Slice C — Standard-print bias in representative-printing selection

## Status: planned

## Goal

Bias `choosePreferredCard` toward a standard paper printing and demote special
treatments when picking the single representative printing per oracle id for
typed search — applied after the metadata-quality score and **before** the
`released_at` recency tiebreak, keeping "most recent among standard prints".
(DEC-071 / REQ-049.) Independent of Slices A/B.

## Requirements

1. Add a build-time `isStandardPrinting(card)` predicate over Scryfall signals:
   demote when `set_type` is a Secret Lair / `funny` / promo class, when promo
   flags are set, or when special `frame_effects` / `border_color` indicate
   borderless / extended / showcase treatments. Standard otherwise. Classification
   is a build-time detail validated by outcome (representative images look
   standard), not a product open question.
2. Insert the preference into `choosePreferredCard`'s tiebreak chain: equal
   metadata-quality score → **standard beats special** → existing `released_at`
   recency → existing deterministic key. Ties within the same standard/special
   class fall through unchanged, so behavior stays "most recent among standard
   prints".
3. Fallback: a special printing is chosen only when no standard printing exists
   for that oracle id (cards that exist solely as special treatments still resolve).
4. Regenerate `apps/frontend/public/data/cardMetadata.json` via `npm run data:build`.
   The metadata file format and runtime load are unchanged — only which printing
   represents some cards changes.

## Acceptance criteria

- [ ] `isStandardPrinting` returns false for Secret Lair (`set_type: "funny"`/SLD), promo-flagged, and borderless/extended/showcase printings; true for a normal-frame, normal-border, non-promo printing (new unit tests).
- [ ] `choosePreferredCard` prefers a standard printing over a same-quality special printing even when the special one is newer; among two standard printings the newer still wins; with two special printings the newer still wins (extends `metadataTransformPolicy.test.ts`).
- [ ] No-standard fallback: when both candidates are special, selection falls through to recency/key and still returns a card.
- [ ] Regenerated `cardMetadata.json` is valid, same format, and a known affected card (e.g. one whose newest printing is a Secret Lair) now shows a standard representative image.
- [ ] Typed-search-only scope: no change to `AskAiRequest`, metadata file format/runtime load, the provider boundary, or any endpoint; scan path unaffected.

## Verification

```bash
npm --workspace apps/frontend run test -- metadataTransformPolicy
npm --workspace apps/frontend run typecheck

# Regenerate metadata and sanity-check format/affected card
npm run data:build
node -e "const m=require('./apps/frontend/public/data/cardMetadata.json');console.log('items',m.length);console.log('sample keys',Object.keys(m[0]))"
```

## Files touched

- `scripts/build-card-metadata.mjs` — `isStandardPrinting` predicate + tiebreak insertion in `choosePreferredCard`
- `apps/frontend/src/lib/metadataTransformPolicy.test.ts` — standard-print preference + fallback tests
- `apps/frontend/public/data/cardMetadata.json` — regenerated (data artifact)

## PRD promotion checklist (executed at cleanup — `thejudge-cleanup`)

This is the final lettered slice; cleanup promotes the whole package:

- [ ] Flip `sections/system-map.md` entries for scan art fidelity (DEC-070/REQ-048) and standard-print bias (DEC-071/REQ-049) to `shipped` — gated on product code wired in **and** a written receipt
- [ ] Confirm DEC-070 / DEC-071 bodies and router index lines in `sections/decisions.md` match shipped reality; REQ-048 / REQ-049 acceptance criteria satisfied
- [ ] Confirm FLOW-006 edge-case/notes lines (displayed art matches scanned printing, oracle fallback) reflect shipped behavior in `sections/user-flows.md`
- [ ] Write receipt at `PRD/instructions/receipts/scan-printing-fidelity-<YYYY-MM-DD>.md`
- [ ] Delete `PRD/work/scan-printing-fidelity/`

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified (Slices A, B, C)
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged (frontend-only at scan time; build-time only for Lever 2); scan-engine + REQ-034/DEC-051 parity gates untouched
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/scan-printing-fidelity/` ready to delete
