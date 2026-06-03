# Slice 01 — Backend contract

status: pending

**Prerequisites:** [slice-00-repo-housekeeping.md](./slice-00-repo-housekeeping.md)  
**Next slice:** [slice-02-prompt-and-eval.md](./slice-02-prompt-and-eval.md)

## Goal

Define and validate the new **request contract** in backend (and shared types) without changing prompt output or frontend UI yet. Old fixtures may temporarily break — fixed in slice 02.

## Scope

### Types (`apps/backend/src/types.ts`, mirror in `apps/frontend/src/types.ts`)

- `TurnPhase`, `ZoneId`, `ContextTarget`, `ZoneCardItem`, expanded `GameContext`
- `AskAiRequest = { question, gameContext }` only

See [decisions-summary.md](./decisions-summary.md) for shapes.

### Validation (`apps/backend/src/validation.ts`)

- Zod schemas for new model
- `zones` object: only present keys with **non-empty** arrays
- `selectedZones` required; must be subset of known zone IDs
- Zero cards globally allowed
- Stack zone items: preserve ordering validation if applicable

### Test utilities

- Update `apps/backend/src/test-utils/requestBuilders.ts` for new shape
- Add unit tests for validation edge cases (empty zones omitted, invalid phase, etc.)

### Contract tests

- Update `apps/backend/src/app.contract.test.ts` to send new payload shape
- Provider may still return mock/JSON debug answer — **prompt content not asserted yet**

## Tasks

- [ ] Add types and Zod schemas
- [ ] Migration helper (optional): `legacyAskAiToGameContext()` for dev only — delete before ship if unused
- [ ] Update request builders and contract tests
- [ ] Document breaking change note in slice PR description (DEC-021 draft)

## Validation gate

```bash
npm run typecheck
npm --workspace apps/backend run test
```

Manual:

- [ ] Sample valid payload passes Zod
- [ ] Payload with empty `zones` object (no keys) validates when `selectedZones` set and question present
- [ ] Payload with `stack: []` key **fails** validation (empty arrays omitted)

## Done when

- Backend accepts new `AskAiRequest` shape on `POST /api/ask-ai`
- Frontend types updated but UI may still send old shape until slice 06 (acceptable interim — or feature-flag dual validation briefly; prefer single cutover in slice 06)

## Out of scope

- `promptContext` / prompt text changes
- Frontend UI
- Eval golden files (slice 02)
- PRD promotion to `sections/`

## Notes

If contract tests fail because route still expects old prompt path, stub minimal handler compatibility: validate new body, return mock answer with serialized body for debugging until slice 02.
