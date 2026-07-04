# Slice A — GameContext per-player counter contract

## Status: planned

## Goal

Add the additive, optional per-player counter fields to the GameContext contract
(FE types, BE Zod, prompt assembly, eval goldens) so tracker state can inform
Ask-AI prompts without breaking existing clients (REQ-083 / DEC-102).

## Requirements

1. `GamePlayerContext` gains optional `poison`, `experience`, `energy`,
   `commanderDamage` (a list of `{ from: PlayerLabel, amount }`), and `counters`
   (a list of `{ name: string, amount: number }`) on both the frontend
   (`apps/frontend/src/types.ts`) and backend (`gamePlayerSchema` in
   `apps/backend/src/validation/askAiRequest.ts`; its inferred type flows into
   `PromptContext.gameContext.players`).
2. Zod bounds mirror existing guardrails: non-negative integers for all counts
   (`poison`/`experience`/`energy`, `commanderDamage[].amount`,
   `counters[].amount`), `commanderDamage[].from` is a `playerLabelSchema`, and
   `counters[].name` uses the `boundedText` control-character + length guard
   (cap 40, matching `displayName`). Arrays are bounded (`commanderDamage` ≤ 7,
   `counters` ≤ 20).
3. Every field is optional and omitted when unset or zero, so existing
   `{ label, lifeTotal, displayName? }` payloads remain valid and unchanged.
4. `buildPromptContext` (`prompt/context.ts`) passes the counter fields through
   `normalizedGameContext.players`, dropping zero/empty entries during
   normalization.
5. `formatGameContext` (`prompt/promptFormatting.ts`) emits a single per-player
   counter line only for players with at least one populated counter; players
   with no counters produce no extra line. Bottom-to-top stack ordering and all
   existing lines are unchanged.
6. `POST /api/ask-ai` success `{ answer }` and error shapes are unchanged; no new
   endpoint.

## Acceptance criteria

- [ ] FE `GamePlayerContext` and BE `gamePlayerSchema` both carry the five
      optional fields; `npm run typecheck` is clean.
- [ ] A payload with no counter fields validates and normalizes identically to
      today (regression test in `askAiRequest` + prompt suites).
- [ ] A payload with `poison: 3`, `commanderDamage: [{ from: "Player 2", amount: 5 }]`,
      and `counters: [{ name: "Monarch", amount: 1 }]` validates and produces one
      extra counter line for that player in the assembled prompt.
- [ ] Zero/empty counters (`poison: 0`, `counters: []`) are omitted from the
      normalized prompt context and emit no counter line.
- [ ] `counters[].name` with a control character or over 40 chars is rejected by
      Zod; a negative amount is rejected.
- [ ] Eval goldens updated only where the intentional counter line appears; no
      other prompt drift.

## Verification

```bash
npm run typecheck
npm --workspace apps/backend run test -- src/validation
npm --workspace apps/backend run test -- src/prompt
npm --workspace apps/backend run test:eval
npm --workspace apps/frontend run test -- src/types 2>/dev/null || npm --workspace apps/frontend run typecheck
```

## Files touched

- `apps/frontend/src/types.ts`
- `apps/backend/src/validation/askAiRequest.ts`
- `apps/backend/src/prompt/context.ts`
- `apps/backend/src/prompt/promptFormatting.ts`
- `apps/backend/src/prompt/promptFormatting.test.ts`, `context.test.ts`,
  `promptAssembly.test.ts` (add counter cases)
- `apps/backend/src/validation/*.test.ts` (add counter validation cases)
- `apps/backend/src/eval/fixtures/*.golden.json` (only the intentional counter-line change)

## Notes

- Additive amendment to DEC-021 / DEC-027, following the DEC-037 (`combatStep`)
  and DEC-043 (`gameStateNotes`) pattern. `technical-design-rules.md` requires
  the confirmed decision (DEC-102) that already exists.
- Captured numbers only — no legality/board-state/rules simulation (DEC-013).
- Land this before or with Slice E; the seed rides these fields.
