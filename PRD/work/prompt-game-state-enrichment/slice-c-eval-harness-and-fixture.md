# Slice C — Eval harness checks and game-state-notes fixture

## Status: planned

## Goal

Add two eval check IDs to the harness for the new `ADDITIONAL GAME STATE` section, and add a new fixture that submits `gameStateNotes` so the section is exercised end-to-end.

## Dependencies

- Slice B must be complete (section is emitted from `buildPromptText`)

## Requirements

- REQ-031: eval fixtures assert `ADDITIONAL GAME STATE` section presence when set, and confirm omission when absent
- DEC-043: section is positioned after `GENERAL GAME CONTEXT` and before `PHASE GUIDANCE`

## Files touched

- `apps/backend/src/eval/contextEvaluationHarness.ts`
- `apps/backend/src/eval/contextEvaluationHarness.test.ts`
- `apps/backend/src/eval/fixtures/game-state-notes.fixture.json` (new)
- `apps/backend/src/eval/fixtures/game-state-notes.prompt.golden.txt` (new, generated)

## Changes

### `eval/contextEvaluationHarness.ts`

Add two new check IDs to `EvaluationCheckId`:

```ts
| "game-state-notes-section-present"
| "game-state-notes-omitted-when-absent"
```

Add check functions:

```ts
function checkGameStateNotesSectionPresent(fixture: EvaluationFixture, promptText: string): EvaluationCheckResult {
  const hasNotes = Boolean(fixture.request.gameContext.gameStateNotes?.trim());
  const sectionPresent = promptText.includes("ADDITIONAL GAME STATE");
  const passed = !hasNotes || sectionPresent;
  return {
    id: "game-state-notes-section-present",
    passed,
    details: passed
      ? hasNotes
        ? "ADDITIONAL GAME STATE section is present when gameStateNotes is set."
        : "No gameStateNotes in fixture; section correctly omitted."
      : "gameStateNotes is set but ADDITIONAL GAME STATE section is missing from prompt."
  };
}

function checkGameStateNotesOmittedWhenAbsent(fixture: EvaluationFixture, promptText: string): EvaluationCheckResult {
  const hasNotes = Boolean(fixture.request.gameContext.gameStateNotes?.trim());
  const sectionPresent = promptText.includes("ADDITIONAL GAME STATE");
  const passed = hasNotes || !sectionPresent;
  return {
    id: "game-state-notes-omitted-when-absent",
    passed,
    details: passed
      ? !sectionPresent
        ? "No gameStateNotes; ADDITIONAL GAME STATE section correctly absent."
        : "gameStateNotes is present; section-present check governs instead."
      : "ADDITIONAL GAME STATE section appears in prompt but gameStateNotes is absent/blank."
  };
}
```

Add a section-order check for `ADDITIONAL GAME STATE` (between `GENERAL GAME CONTEXT` and `PHASE GUIDANCE`) when section is present.

Wire new checks into `runEvaluationChecks()`.

### New fixture: `game-state-notes.fixture.json`

A 2-player game with one stack card and a non-empty `gameStateNotes` value that covers multiple feedback categories. Use an existing well-known card (e.g. Counterspell) from the committed metadata. Example shape:

```json
{
  "id": "game-state-notes",
  "description": "Stack with gameStateNotes set — ADDITIONAL GAME STATE section should appear before PHASE GUIDANCE",
  "request": {
    "question": "Does Counterspell resolve?",
    "gameContext": {
      "playerCount": 2,
      "players": [
        { "label": "Player 1", "lifeTotal": 20 },
        { "label": "Player 2", "lifeTotal": 18 }
      ],
      "turnPhase": "main_1",
      "activePlayer": "Player 1",
      "selectedZones": ["stack"],
      "zones": {
        "stack": [
          {
            "cardId": "<counterspell-oracle-id>",
            "name": "Counterspell",
            "oracleText": "Counter target spell.",
            "manaCost": "{U}{U}",
            "manaValue": 2,
            "typeLine": "Instant",
            "colors": ["U"],
            "supertypes": [],
            "subtypes": [],
            "caster": "Player 2",
            "targets": [{ "kind": "none" }]
          }
        ]
      },
      "gameStateNotes": "Player 1 has Leyline of Sanctity in play — they have hexproof. Priority is currently with Player 2."
    }
  }
}
```

The `cardId` must match a real oracle ID from the committed metadata. Use the ID from an existing fixture (e.g. `full-context.fixture.json`) or look it up in `cardMetadata.json`.

### Golden file

Generate `game-state-notes.prompt.golden.txt` by running `npm run prompt:preview` after adding the fixture. Commit the output.

## Acceptance criteria

- [ ] `checkGameStateNotesSectionPresent` passes for the new fixture (section present)
- [ ] `checkGameStateNotesOmittedWhenAbsent` passes for all existing fixtures (none have `gameStateNotes`)
- [ ] `ADDITIONAL GAME STATE` appears between `GENERAL GAME CONTEXT` and `PHASE GUIDANCE` in the new fixture's golden
- [ ] Eval harness test suite passes for all fixtures: `npm run quality:check`

## Verification

```bash
cd apps/backend && npm run quality:check
npm run prompt:preview
```

Inspect `output/prompt-preview/game-state-notes/production.prompt.txt` to confirm section position.
