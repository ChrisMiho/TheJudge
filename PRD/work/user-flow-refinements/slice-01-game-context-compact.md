# Slice 01 — Game context compact UI

## Status: complete

## Goal

Reduce vertical stretch on the game context screen.

## Requirements

- Single row: player count display + add/remove buttons (2–8 players)
- Expand chevron reveals per-player rows: editable display name + life total
- Turn phase: `<select>` dropdown; user-flow-gap-fixes slice A removed the optional "None" value and defaults to **Stack Resolving**
- Active player: unchanged
- `GamePlayerContext.displayName?: string` — included in AI prompt when set and differs from label

## Files

- `apps/frontend/src/App.tsx`
- `apps/frontend/src/types.ts`
- `apps/backend/src/promptNormalization.ts` (player line)
