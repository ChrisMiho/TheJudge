# Slice C — Backend prompt enrichment

## Status: complete

## Goal

Load the committed rulings map at server start and append the **OFFICIAL RULINGS (WotC reference)** section during `preparePromptInput` — no new HTTP route, no frontend changes.

## Depends on

- [slice-b-trim-artifact.md](slice-b-trim-artifact.md) — `apps/backend/data/cardRulingsByOracleId.json` committed.

## Requirements

### Module: `apps/backend/src/cardRulings.ts` (name may vary)

Export at minimum:

- `loadCardRulingsIndex(filePath: string): Map<string, RulingEntry[]>` — parse JSON once; empty map if file missing (log warning once).
- `collectCardsForRulings(context: PromptContext): Array<{ cardId: string; name: string }>` — unique `cardId`s in **submission order**:
  - Stack: `orderedStack` bottom → top (`stackIndex` ascending).
  - Non-stack: `populatedZones` in canonical zone order; items in zone order.
  - Skip entries with empty `cardId`.
- `resolveRulingsForPrompt(cards, index, limits): ResolvedRulings` — apply per-card and section caps.

`RulingEntry`: `{ publishedAt: string; comment: string }`.

### Wire into app bootstrap

- [`apps/backend/src/index.ts`](../../../apps/backend/src/index.ts) or [`createApp`](../../../apps/backend/src/app.ts): load index from default path `apps/backend/data/cardRulingsByOracleId.json` (resolve relative to repo / `import.meta` / `process.cwd()` consistently with project conventions).
- Pass index into `preparePromptInput` via `AppOptions` (same pattern as `askAiProvider`; allow test injection).

### `preparePromptInput` ([`promptPreparation.ts`](../../../apps/backend/src/promptPreparation.ts))

1. `buildPromptContext(request)` — unchanged.
2. Resolve rulings for context.
3. `buildPromptText(context, { rulings: resolved })` — extend signature as needed.

### `buildPromptText` ([`promptNormalization.ts`](../../../apps/backend/src/promptNormalization.ts))

- Add `formatOfficialRulingsSection(cards, resolved): string`.
- Insert after zone sections, before `SCOPE` / `QUESTION`.
- Full format: see [GAMEPLAN.md § Prompt format spec](GAMEPLAN.md#prompt-format-spec).

### Cap constants (export for tests)

| Constant | Suggested value |
| --- | --- |
| `MAX_RULINGS_PER_CARD` | 3 |
| `MAX_RULING_COMMENT_CHARS` | 480 (or lower if budget tight) |
| `MAX_RULINGS_SECTION_CHARS` | tune against eval fixtures |

Use existing truncation helper / `...(truncated)` suffix.

### Diagnostics (optional)

Extend `PromptDiagnostics` with `rulingsSectionChars`, `rulingsCardCount` if useful for logging in [`app.ts`](../../../apps/backend/src/app.ts).

### Degraded behavior

- Missing rulings file: server starts; no rulings section; warn once at load.
- Unknown `cardId`: omit that card’s block.
- No cards with rulings: omit entire section.

## Tests

- Unit: `collectCardsForRulings` order and dedup (multi-zone fixture).
- Unit: caps truncate comments and limit count per card.
- Unit: `formatOfficialRulingsSection` golden string for small fixture index.
- Update [`promptNormalization.test.ts`](../../../apps/backend/src/promptNormalization.test.ts) near-cap cases if needed.
- Eval harness: update `*.golden.txt` only where fixture cards have WotC entries in committed artifact.

## Acceptance criteria

- [x] `POST /api/ask-ai` unchanged request/response contract
- [x] Prompt contains rulings section when data exists for submitted cards
- [x] Prompt omits section when no rulings match
- [ ] `npm run quality:check` passes
- [x] No frontend file changes required for this slice

## Files

- `apps/backend/src/cardRulings.ts` (new)
- `apps/backend/src/cardRulings.test.ts` (new)
- [`apps/backend/src/promptPreparation.ts`](../../../apps/backend/src/promptPreparation.ts)
- [`apps/backend/src/promptNormalization.ts`](../../../apps/backend/src/promptNormalization.ts)
- [`apps/backend/src/app.ts`](../../../apps/backend/src/app.ts)
- [`apps/backend/src/index.ts`](../../../apps/backend/src/index.ts)
- [`apps/backend/src/eval/fixtures/`](../../../apps/backend/src/eval/fixtures/) (goldens as needed)

## Next slice

[slice-d-prd-and-closeout.md](slice-d-prd-and-closeout.md)
