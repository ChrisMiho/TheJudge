# Slice B — Prompt player resolution

## Status: planned

## Depends on

Slice A (display names confirmed in UI; same format rules)

## Goal

Resolve every player reference in the LLM prompt through `gameContext.players[].displayName`, using the locked format `Player N (Name)` when a custom name exists.

## Requirements

### Prompt context

- Extend [`PromptContext`](../../../apps/backend/src/types.ts) `gameContext` with optional `activePlayer?: PlayerLabel`
- In [`promptContext.ts`](../../../apps/backend/src/promptContext.ts), pass through `gameCtx.activePlayer` when present

### Normalization helper

In [`promptNormalization.ts`](../../../apps/backend/src/promptNormalization.ts):

- Build lookup from `context.gameContext.players` (`label` → `displayName`)
- Add `formatPlayerRef(label: PlayerLabel | undefined, lookup): string`
  - Same rules as frontend `formatPlayerDisplayLabel`
  - Undefined / missing label → `(none)` or existing fallback behavior for optional fields

### Apply resolution

| Prompt location | Today | After |
| --- | --- | --- |
| `formatGameContext` roster | `Player 1: lifeTotal=40 displayName=Alice` | Unchanged |
| `formatGameContext` | (missing) | Add `activePlayer: …` when set, using `formatPlayerRef` |
| Stack `caster:` | raw label | `formatPlayerRef` |
| Non-stack `owner:` | raw label | `formatPlayerRef` (keep `(none)` when absent) |
| `formatTargets` `player:` | raw label | `formatPlayerRef` |

Do **not** change API request/response JSON — only prompt text assembly.

### Eval / goldens

- Prefer **one new eval fixture** with display names on players + caster/owner/target refs over mass-updating all existing goldens
- If an existing fixture already sets `displayName`, update its `.prompt.golden.txt` only
- Document new fixture in `apps/backend/src/eval/fixtures/README.md` if added

## Files

- `apps/backend/src/types.ts`
- `apps/backend/src/promptContext.ts`
- `apps/backend/src/promptContext.test.ts`
- `apps/backend/src/promptNormalization.ts`
- `apps/backend/src/promptNormalization.test.ts`
- Optional: `apps/backend/src/eval/fixtures/*` + golden prompt

## Tests

- `promptNormalization.test.ts`:
  - Context with `displayName` on players; stack card with `caster: Player 2`, target `Player 1` → prompt contains `Player 2 (Bob)` and `player:Player 1 (Alice)`
  - Zone item with `owner: Player 1` → resolved in non-stack section
  - `activePlayer: Player 1` → `activePlayer: Player 1 (Alice)` in GENERAL GAME CONTEXT
  - Players without display names → unchanged `Player N` only
- `promptContext.test.ts`: `activePlayer` preserved on `PromptContext`

## Out of scope

- Changing `playerLabelSchema` or request validation
- Replacing roster `displayName=` field (keep both for model clarity)

## Acceptance

- [ ] Prompt text uses resolved names for `activePlayer`, `caster`, `owner`, and `player:` targets when display names exist
- [ ] Prompt unchanged for requests with no custom display names
- [ ] Backend unit tests pass
- [ ] Eval harness green if goldens touched
