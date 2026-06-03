# Slice 02 — Prompt and eval

status: pending

**Prerequisites:** [slice-01-backend-contract.md](./slice-01-backend-contract.md)  
**Next slice:** [slice-03-flow-foundation.md](./slice-03-flow-foundation.md)

## Goal

Build prompt from new `gameContext`, add MTG reference block and scope sentence, restore **eval golden parity**.

## Scope

### MTG reference (`apps/backend/src/promptMtgReference.ts`)

- Implement text from [mtg-prompt-reference.md](./mtg-prompt-reference.md)
- Unit test: character count under cap
- Export stable string for `promptContext`

### Scope sentence

- Function: `buildZoneScopeSentence(selectedZones, populatedZoneIds)` 
- Merges unselected + selected-but-empty zones
- Deterministic ordering (canonical zone order)
- Template from [mtg-prompt-reference.md](./mtg-prompt-reference.md)

### Prompt builder (`apps/backend/src/promptContext.ts`)

- Input: new `GameContext` only
- Sections: MTG reference → turn/players → populated zones (canonical order) → scope sentence → question
- Stack zone: preserve bottom-to-top language and stack roles
- `ContextTarget` serialization in card enrichment

### Eval fixtures

- Update all files under `apps/backend/src/eval/fixtures/` to new request shape
- Regenerate `.golden.txt` / `.golden.json` intentionally
- Add fixture: **zero cards**, all zones in scope sentence
- Add fixture: multi-zone with hand + graveyard

## Tasks

- [ ] `promptMtgReference.ts` + length test
- [ ] Scope sentence builder + unit tests
- [ ] Refactor `promptContext.ts`
- [ ] Update `promptContext.test.ts`
- [ ] Migrate eval fixtures and goldens
- [ ] Remove legacy `battlefieldContext` / top-level `stack` from prompt path

## Validation gate

```bash
npm --workspace apps/backend run test
npm --workspace apps/backend run test:eval
npm run quality:check
```

Manual:

- [ ] Inspect one golden prompt file — contains MTG reference, scope sentence, zone cards
- [ ] Zero-card fixture prompt still includes turn phase + scope sentence + question

## Done when

- All backend tests and eval harness green
- Prompt contract stable enough for frontend to target in slices 04–06

## Out of scope

- Frontend UI
- PRD promotion
