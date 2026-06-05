# Slice C — PRD updates and test sweep

## Status: planned

## Depends on

Slices A, B

## Goal

Promote durable product truth, align stale REQ-015 language, and confirm full verification.

## PRD updates

### `PRD/sections/decisions.md` — DEC-025 (new)

Record:

- Per-player **display names** are optional UI/prompt-facing labels on top of fixed `PlayerLabel` identity
- API fields (`caster`, `owner`, `targetPlayer`, `activePlayer`, `label`) remain `PlayerLabel` strings
- Prompt builder resolves display names on roster refs, `activePlayer`, and all card-level player fields using format `Player N (Name)` when set

### `PRD/sections/functional-requirements.md` — REQ-015

- Revise constraint **“fixed player labels only (no custom names)”** to: fixed `PlayerLabel` identity; optional **display names** for UI labels and prompt text
- Add acceptance criterion: player selects show display names when set; API values remain labels

### `PRD/sections/user-flows.md` — FLOW-001

- Step 1: active player and downstream player selects reflect display names when set
- Edge case: empty or whitespace-only display name treated as unset (same as today in `buildPlayers()`)

### `PRD/sections/integrations-and-data.md`

- Extend `GameContext.players` array item to document optional `displayName?: string` (if not already documented in the players shape)
- Note prompt resolves player refs through display names; `activePlayer` included in GENERAL GAME CONTEXT when provided

### `PRD/work/user-flow-refinements/slice-01-game-context-compact.md`

- Add note: display name propagation completed by `player-display-names` slices A–B (active player + prompt card lines)

## Tests

Run from repo root:

- `npm run quality:check`

Spot-check:

- `apps/frontend` — `playerLabels.test.ts`, `App.test.tsx`
- `apps/backend` — `promptNormalization.test.ts`, `promptContext.test.ts`, eval harness if fixtures changed

## Closeout

- Mark slices A–C **complete** in their files and [README.md](README.md) table
- Set README `status: complete` with date
- Remove `PRD/work/player-display-names/` after promotion (per doc-lifecycle)
- Remove or archive Cursor plan copy if present

## Acceptance

- [ ] DEC-025 and section updates match implemented behavior
- [ ] [GAMEPLAN.md verification checklist](GAMEPLAN.md#verification-checklist) items checked
- [ ] `npm run quality:check` green
- [ ] Ephemeral folder deleted after promotion
