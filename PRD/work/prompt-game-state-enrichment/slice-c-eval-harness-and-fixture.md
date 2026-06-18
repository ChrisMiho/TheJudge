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
| "game-state-notes-section"
| "game-state-notes-section-order"
```

Add check functions. Use **one biconditional presence check** (`notes set ⇔ section
present`) rather than a present/absent pair — the two-inverse pattern is a tautology
(one always trivially passes while the other governs) and overstates coverage:

```ts
function checkGameStateNotesSection(fixture: EvaluationFixture, promptText: string): EvaluationCheckResult {
  const hasNotes = Boolean(fixture.request.gameContext.gameStateNotes?.trim());
  const sectionPresent = promptText.includes("ADDITIONAL GAME STATE");
  const passed = hasNotes === sectionPresent;
  return {
    id: "game-state-notes-section",
    passed,
    details: passed
      ? hasNotes
        ? "ADDITIONAL GAME STATE present when gameStateNotes is set."
        : "ADDITIONAL GAME STATE correctly absent when gameStateNotes is unset."
      : hasNotes
        ? "gameStateNotes is set but ADDITIONAL GAME STATE section is missing."
        : "ADDITIONAL GAME STATE section present but gameStateNotes is absent/blank."
  };
}
```

Add the section-order check as a first-class, registered check (no-op pass when the
section is absent, so existing fixtures don't regress):

```ts
function checkGameStateNotesSectionOrder(promptText: string): EvaluationCheckResult {
  const sectionIndex = promptText.indexOf("ADDITIONAL GAME STATE");
  if (sectionIndex === -1) {
    return {
      id: "game-state-notes-section-order",
      passed: true,
      details: "Section absent; order check not applicable."
    };
  }
  const gameContextIndex = promptText.indexOf("GENERAL GAME CONTEXT");
  const phaseGuidanceIndex = promptText.indexOf("PHASE GUIDANCE");
  const passed =
    gameContextIndex !== -1 &&
    phaseGuidanceIndex !== -1 &&
    gameContextIndex < sectionIndex &&
    sectionIndex < phaseGuidanceIndex;
  return {
    id: "game-state-notes-section-order",
    passed,
    details: passed
      ? "ADDITIONAL GAME STATE appears between GENERAL GAME CONTEXT and PHASE GUIDANCE."
      : "ADDITIONAL GAME STATE is not positioned between GENERAL GAME CONTEXT and PHASE GUIDANCE."
  };
}
```

Wire both new checks into the checks array inside `evaluateScenario()`
(`contextEvaluationHarness.ts:306`) — the same array that already lists
`checkPromptSectionOrder(promptText)` (~line 319). There is no `runEvaluationChecks`
function; `evaluateScenario` is the single registration point. `checkGameStateNotesSection`
takes `(fixture, promptText)`; `checkGameStateNotesSectionOrder` takes `(promptText)`.

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

- [ ] `checkGameStateNotesSection` passes for the new fixture (notes set ⇔ section present)
- [ ] `checkGameStateNotesSection` passes for all existing fixtures (no `gameStateNotes` ⇔ section absent)
- [ ] `checkGameStateNotesSectionOrder` passes for the new fixture (section between `GENERAL GAME CONTEXT` and `PHASE GUIDANCE`) and is a no-op pass for fixtures without the section
- [ ] `ADDITIONAL GAME STATE` appears between `GENERAL GAME CONTEXT` and `PHASE GUIDANCE` in the new fixture's golden
- [ ] Eval harness test suite passes for all fixtures: `npm run quality:check`

## Verification

```bash
cd apps/backend && npm run quality:check
npm run prompt:preview
```

Inspect `output/prompt-preview/game-state-notes/production.prompt.txt` to confirm section position.
