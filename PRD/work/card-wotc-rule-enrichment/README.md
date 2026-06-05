## Status

- status: **active**
- parent phase: UX Wave 2 — prompt grounding (WotC rulings)
- canonical plan: [GAMEPLAN.md](GAMEPLAN.md)
- source sections: `PRD/sections/integrations-and-data.md`, `PRD/sections/goals-and-non-goals.md`, `PRD/sections/decisions.md`

## Purpose

Inject **Wizards (WotC) official rulings** from Scryfall into the backend LLM prompt for cards present in a submitted `AskAiRequest`. No new API endpoint, no frontend rulings fetch, no rulings UI.

**Implementing agents:** treat this folder as the single source of truth. Do not rely on Cursor-only plan files under `.cursor/plans/`.

## Agent read order

1. This README
2. [GAMEPLAN.md](GAMEPLAN.md) (overview, prompt format, verification)
3. The slice doc for the slice you are implementing (**A → B → C → D** unless told otherwise)
4. `PRD/sections/decisions.md` (add **DEC-###** in slice D)
5. `PRD/sections/integrations-and-data.md` (AI Prompt Context Rules)
6. `PRD/instructions/technical-design-rules.md` (prompt / endpoint constraints)
7. `PRD/instructions/doc-lifecycle.md` (promote and delete this folder when done)

## Slices

| Slice | File | Status | Depends on |
| --- | --- | --- | --- |
| A | [slice-a-scryfall-download.md](slice-a-scryfall-download.md) | complete | — |
| B | [slice-b-trim-artifact.md](slice-b-trim-artifact.md) | complete | A (or pre-existing raw `rulings.json`) |
| C | [slice-c-backend-prompt.md](slice-c-backend-prompt.md) | complete | B |
| D | [slice-d-prd-and-closeout.md](slice-d-prd-and-closeout.md) | planned | A, B, C |

## Implementation map

| Slice | Primary code / assets |
| --- | --- |
| A | `scripts/refresh-scryfall-data.mjs`, `.gitignore`, `apps/backend/data/scryfall/rulings.json` (gitignored raw) |
| B | `scripts/build-card-rulings.mjs`, `package.json` scripts, `apps/backend/data/cardRulingsByOracleId.json` (committed) |
| C | `apps/backend/src/cardRulings.ts`, `promptPreparation.ts`, `promptNormalization.ts`, `app.ts`, `index.ts`, tests |
| D | `PRD/sections/decisions.md`, `PRD/sections/integrations-and-data.md`, eval goldens, root `README.md` |

## Product decisions (locked)

| Topic | Decision |
| --- | --- |
| HTTP API | **No new endpoint** — enrichment inside existing `POST /api/ask-ai` → `preparePromptInput` |
| UI | **Prompt-only** — users do not see rulings in the app |
| Data source | Scryfall bulk type `rulings` ([bulk-data API](https://scryfall.com/docs/api/bulk-data)) |
| Ruling filter | `source === "wotc"` only (exclude Scryfall notes) |
| Trim | Intersect `oracle_id` with `cardId` values in `apps/frontend/public/data/cardMetadata.json` |
| Committed artifact | `apps/backend/data/cardRulingsByOracleId.json` |
| Scryfall download | **Human approval required** before slice A commands (see slice A) |
| Lookup key | Request `cardId` === Scryfall `oracle_id` (same as metadata pipeline) |
| Runtime | Static file at server boot — **no** per-request Scryfall API calls |

## Rulings vs cardMetadata

Every Scryfall ruling belongs to **one card** via `oracle_id`. Intersecting with `cardMetadata` only omits rulings for oracle IDs **not** in the autocomplete set (unselectable cards). It does not remove “generic” rulings — there are none in the bulk file.

## When done

- Mark each slice **Status** at top of its file: `planned` → `in progress` → `complete`
- Update this README slice table
- Run verification in [GAMEPLAN.md § Verification checklist](GAMEPLAN.md#verification-checklist)
- Slice D: promote into `sections/`, then **delete** this entire folder per `doc-lifecycle.md`
