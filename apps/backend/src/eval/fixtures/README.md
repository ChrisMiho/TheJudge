# Context Evaluation Fixtures

This folder stores fixture-driven golden cases for context and prompt evaluation.

## File naming

- `<scenario-id>.fixture.json`: input fixture with `id`, `description`, and `request`.
- `<scenario-id>.context.golden.json`: expected `buildPromptContext()` output.
- `<scenario-id>.prompt.golden.txt`: expected `buildPromptText()` output.
- `checklist-report.golden.txt`: expected scenario-level score/checklist report.

## Fixture structure

```json
{
  "id": "simple-interaction",
  "description": "Human-readable scenario intent",
  "request": {
    "question": "What happens here?",
    "gameContext": {
      "playerCount": 2,
      "players": [
        { "label": "Player 1", "lifeTotal": 20 },
        { "label": "Player 2", "lifeTotal": 20 }
      ]
    },
    "battlefieldContext": [],
    "stack": [
      {
        "cardId": "opt",
        "name": "Opt",
        "oracleText": "Scry 1, then draw a card.",
        "imageUrl": "",
        "manaSpent": 1,
        "caster": "Player 1",
        "targets": []
      }
    ]
  }
}
```

## Adding or updating scenarios

1. Add a new `<scenario-id>.fixture.json` file in this folder.
2. Regenerate golden files:
   - `UPDATE_CONTEXT_EVAL_FIXTURES=1 npm --workspace apps/backend run test -- src/eval/contextEvaluationHarness.test.ts`
3. Run the harness normally to verify deterministic output:
   - `npm --workspace apps/backend run test -- src/eval/contextEvaluationHarness.test.ts`
4. Review all generated `.golden.*` diffs in your PR.
