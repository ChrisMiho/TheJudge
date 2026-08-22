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

## Commander Spellbook combo fixtures

Scenarios named `commander-spellbook-*` cover the combo-enrichment branches. They
read a **dedicated eval corpus**, `commander-spellbook-eval-catalog.json`, not the
production artifact at `apps/backend/data/commanderSpellbookCombos.json`. That
separation is the point: an owner-approved production corpus refresh must never
churn a prompt golden. The harness derives oracle membership from the fixture's
`variants` array, so the catalog cannot drift out of sync with itself.

| Fixture | Branch covered |
| --- | --- |
| `commander-spellbook-complete-no-intent` | game mode, every ingredient present in a compatible zone, no combo intent — section supplied automatically |
| `commander-spellbook-partial-explicit-intent` | game mode, missing ingredient, explicit intent — partial candidate names the gap |
| `commander-spellbook-wrong-zone` | ingredient present but incompatibly zoned |
| `commander-spellbook-unresolved-template` | template with no authoritative card list — never fully assigned |
| `commander-spellbook-lookup-attached-intent` | lookup mode, attached card plus explicit intent |
| `commander-spellbook-lookup-unrelated` | lookup mode, attached card but no combo intent — no retrieval |
| `commander-spellbook-degraded` | no catalog loaded at all — no section, request still answered |

The degraded scenario uses the optional top-level `disableComboEnrichment: true`
field (sibling of `request`), which evaluates that fixture with no catalog — the
same state the runtime reaches with a missing artifact or
`COMBO_ENRICHMENT_ENABLED=false`.

Card names in the eval corpus are invented and every `oracle_id` is synthetic;
they correspond to no real Scryfall identity.

## Prompt preview

Run `npm run prompt:preview` from the repo root to POST fixtures through the mock backend and write reviewable artifacts to `output/prompt-preview/`. See `scripts/prompt-preview.mjs` for details.

## Regression gates

From repo root:

- `npm test` — default gate when frontend or shared logic changes
- `npm --workspace apps/backend run test:eval` — backend prompt/context goldens

Do not change `AskAiRequest` shape or prompt assembly without a confirmed decision in the relevant `PRD/sections/decisions/<domain>.md` file and a router index line in `PRD/sections/decisions.md`.

## Adding or updating scenarios

1. Add a new `<scenario-id>.fixture.json` file in this folder.
2. Regenerate golden files:
   - `UPDATE_CONTEXT_EVAL_FIXTURES=1 npm --workspace apps/backend run test -- src/eval/contextEvaluationHarness.test.ts`
3. Run the harness normally to verify deterministic output:
   - `npm --workspace apps/backend run test -- src/eval/contextEvaluationHarness.test.ts`
4. Review all generated `.golden.*` diffs in your PR.
