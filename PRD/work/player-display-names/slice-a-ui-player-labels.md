# Slice A — UI player labels

## Status: planned

## Goal

Show user-entered display names in every player `<select>` and in enrichment target summaries, without changing API values (`PlayerLabel`).

## Requirements

### Shared helper

Create `apps/frontend/src/lib/playerLabels.ts`:

- `formatPlayerDisplayLabel(label: PlayerLabel, displayName?: string): string`
  - Returns `Player N (Name)` when `displayName` is non-empty after trim **and** differs from `label`
  - Otherwise returns `label` unchanged
- `buildPlayerDisplayNameMap(players: GamePlayerContext[]): Record<PlayerLabel, string | undefined>` — optional convenience from confirmed `gameContext.players`
- Mirror test style in `zoneLabels.test.ts` / `playerLabels.test.ts`

### Game setup (`App.tsx`)

- Active player `<select>`: option **text** uses `formatPlayerDisplayLabel(player, displayNamesByPlayer[player])`; **value** stays `player`
- Player detail expand panel may keep `{player} name` field label as-is (fixed slot label) or optionally show display name in the field placeholder — not required for acceptance

### Zone collection

- Pass display name lookup into [`ZoneCollectionStep.tsx`](../../../apps/frontend/src/components/ZoneCollectionStep.tsx) → [`ZoneCardPicker.tsx`](../../../apps/frontend/src/components/ZoneCardPicker.tsx)
- Owner `<select>` options use formatted labels
- Prefer sourcing names from `gameContext.players` after confirm (when on later steps) **or** thread `displayNamesByPlayer` from `App.tsx` for consistency before/after confirm

### Enrichment

- [`EnrichmentStep.tsx`](../../../apps/frontend/src/components/EnrichmentStep.tsx):
  - Caster and player-target `<select>` options use formatted labels from `gameContext?.players`
  - Update `formatContextTarget` for `kind: "player"` to use formatted label (read from `gameContext.players`)

### Legacy / optional

- [`BattlefieldStep.tsx`](../../../apps/frontend/src/components/BattlefieldStep.tsx) if still referenced — same option label pattern

## Files

- `apps/frontend/src/lib/playerLabels.ts` (new)
- `apps/frontend/src/lib/playerLabels.test.ts` (new)
- `apps/frontend/src/App.tsx`
- `apps/frontend/src/components/ZoneCollectionStep.tsx`
- `apps/frontend/src/components/ZoneCardPicker.tsx`
- `apps/frontend/src/components/EnrichmentStep.tsx`
- `apps/frontend/src/App.test.tsx`

## Tests

- Unit: `formatPlayerDisplayLabel` — unset name, same-as-label, custom name
- Integration in `App.test.tsx`:
  - Expand player details, type display name, assert active player `<option>` text includes parenthetical name
  - Assert option `value` attributes remain `Player 1`, etc.

## Out of scope

- Backend prompt changes (slice B)
- Changing `PlayerLabel` type or validation

## Acceptance

- [ ] Active player dropdown reflects display names after edit
- [ ] Owner, caster, and player-target selects show formatted labels on collection and enrichment steps
- [ ] Submitted payload still uses raw `PlayerLabel` values (verify via existing request builder tests or manual network tab)
- [ ] Frontend tests pass
