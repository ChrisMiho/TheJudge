# Slice C — Enrichment ownership vs targets

## Status: complete

## Depends on

Slice B

## Goal

Separate **ownership** from **targets** in enrichment so command zone (and other non-stack zones) are clear: owner is one control; zone-card targets reference cards on other zones.

## Requirements

In `EnrichmentStep.renderCardRow`:

| Section | Zones | Controls |
| --- | --- | --- |
| **Ownership** | All non-stack: `battlefield`, `hand`, `graveyard`, `exile`, `library`, `command` | Player select → `card.owner` (default active player or existing owner) |
| **Caster / mana** | `stack` only | Unchanged |
| **Targets** (rename from “Target / context”) | All zones with cards | Player, Zone card, None, Other — labels clarify “points at”, not ownership |

- Keep `contextIndex` from all populated zones for “Zone card” targets (command → battlefield, etc.).
- Collection-time owner in `ZoneCardPicker` remains; enrichment edits same `card.owner` field.
- Consider shared `NON_STACK_ZONES_WITH_OWNER` constant in `contextFlow` if zone list is duplicated.

## Files

- `apps/frontend/src/components/EnrichmentStep.tsx`
- `apps/frontend/src/lib/contextFlow/` (optional shared zone list)
- `apps/frontend/src/App.test.tsx` or component tests

## Backend

No contract change. `owner` optional on `zoneCardItemSchema`; prompt already emits owner for non-stack.

## Acceptance

- [x] Command-zone card in enrichment shows Ownership select separate from Targets.
- [x] Zone-card target can reference a card on another zone.
- [x] Submit payload includes updated `owner` when changed in enrichment.
