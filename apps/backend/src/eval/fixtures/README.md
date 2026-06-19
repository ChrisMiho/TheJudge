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

## Labeled relevance (`expected` block)

Fixtures may add an optional top-level `expected` block (sibling of `request`) to
assert System 2 topic selection and System 3 supplemental retrieval (DEC-047,
REQ-032). Every field is independent and optional — a check runs only when its
field is present, so legacy fixtures without `expected` keep their original
structural-only score.

```json
{
  "id": "counterspell-stack",
  "description": "…",
  "request": { "…": "…" },
  "expected": {
    "expectedSystem2TopicIds": ["stack-and-priority", "targets-basics"],
    "expectedSupplementalRuleIds": ["608.2c"],
    "forbiddenSupplementalRuleIds": ["100.1"]
  }
}
```

| Check id | Field | Pass condition |
| --- | --- | --- |
| `system2-conditional-selection` | `expectedSystem2TopicIds` | `selectGameRulesTopics` output equals this id set exactly (no missing, no extra) |
| `system3-expected-recall` | `expectedSupplementalRuleIds` | every id appears in the System 3 supplemental top-5 |
| `system3-noise-excluded` | `forbiddenSupplementalRuleIds` | no id appears in the System 3 supplemental top-5 |

Label rule ids by **human judgment** of relevance, then confirm they are reachable
(recall ids must be retrieved and outside the curated System 2 set, since curated
rule ids are excluded from System 3). A fixture with all three fields adds 3 to its
`maxScore`.

## Prompt preview

Run `npm run prompt:preview` from the repo root to POST fixtures through the mock backend and write reviewable artifacts to `output/prompt-preview/`. See `scripts/prompt-preview.mjs` for details.

## Regression gates

From repo root:

- `npm test` — default gate when frontend or shared logic changes
- `npm --workspace apps/backend run test:eval` — backend prompt/context goldens

Do not change `AskAiRequest` shape or prompt assembly without a confirmed decision in `PRD/sections/decisions.md`.

## Adding or updating scenarios

1. Add a new `<scenario-id>.fixture.json` file in this folder.
2. Regenerate golden files:
   - `UPDATE_CONTEXT_EVAL_FIXTURES=1 npm --workspace apps/backend run test -- src/eval/contextEvaluationHarness.test.ts`
3. Run the harness normally to verify deterministic output:
   - `npm --workspace apps/backend run test -- src/eval/contextEvaluationHarness.test.ts`
4. Review all generated `.golden.*` diffs in your PR.
