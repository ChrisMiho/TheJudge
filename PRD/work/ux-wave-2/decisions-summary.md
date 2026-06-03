# UX Wave 2 — locked decisions

status: active

Use this file when implementing any slice. If a slice doc conflicts with this file, **this file wins** until promoted to `PRD/sections/decisions.md`.

## Product flow (5 steps)

1. **Game setup** — player count, life totals, active player (recommended), turn phase
2. **Zone confirmation** — checklist; defaults from [phase-zone-assumptions.md](./phase-zone-assumptions.md)
3. **Per-zone collection** — cards only (identity); stack zone uses bottom-to-top (**DEC-004**)
4. **Enrichment** — single ordered list of all cards across zones
5. **Submit** — question + **Decrypt Stack**

## Turn phases (v1 enum)

Non-combat granular: `untap`, `upkeep`, `draw`, `main_1`, `main_2`, `end_step`, `cleanup`

Combined: `combat` (combat sub-steps go in the **question**, not structured fields)

Separate: `stack_resolving`

## Payload shape

```ts
type AskAiRequest = {
  question: string;
  gameContext: GameContext;
};
```

- **No** top-level `stack` or `battlefieldContext`.
- `gameContext.zones` includes **only non-empty** zone arrays (omit keys, no `[]`).
- `gameContext.selectedZones` — UI checklist (for scope sentence).
- **Zero cards** allowed in every zone and at submit.
- **Stack not required** globally.

## Targets

`ContextTarget` replaces `StackTarget`:

| kind | shape |
|------|--------|
| `player` | `{ kind: "player", targetPlayer }` |
| `card` | `{ kind: "card", zone, cardId, cardName }` |
| `none` | `{ kind: "none" }` |
| `other` | `{ kind: "other", targetDescription }` |

## Navigation

- **Back / Continue** on every step.
- Phase change **never wipes** cards or enrichment.
- Phase change **adds** newly assumed zones to checklist (additive merge).

## Prompt

- Static [MTG reference block](./mtg-prompt-reference.md) on every request.
- One **merged scope sentence** for unselected + selected-but-empty zones (see [slice-02](./slice-02-prompt-and-eval.md)).

## HTTP

- Route unchanged: `POST /api/ask-ai`
- Breaking change is **request body shape only** — document as DEC-021+ on closeout.
