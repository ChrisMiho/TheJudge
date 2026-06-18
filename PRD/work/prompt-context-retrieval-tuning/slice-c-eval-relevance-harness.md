# Slice C — Eval harness relevance checks and labeled fixtures

## Status: planned

## Goal

Extend the context eval harness with REQ-032 labeled recall: `expected` fixture blocks, three new check ids, and scenario fixtures covering the signal taxonomy. Wire harness to Slice A topic selection and Slice B retrieval so goldens and checklist reflect shipped behavior.

## Requirements

- DEC-047, REQ-032: `system2-conditional-selection`, `system3-expected-recall`, `system3-noise-excluded`
- Scenario coverage: stack-resolution, combat-deathtouch, upkeep-trigger, extend `cascade-keyword` and `state-based-actions`
- Existing structural checks unchanged; `npm run test:eval` remains regression gate

## Dependencies

- Slice A, Slice B

## Files touched

- `apps/backend/src/eval/contextEvaluationHarness.ts`
- `apps/backend/src/eval/contextEvaluationHarness.test.ts`
- `apps/backend/src/eval/fixtures/README.md`
- `apps/backend/src/eval/fixtures/counterspell-stack.fixture.json` — **new**
- `apps/backend/src/eval/fixtures/combat-deathtouch.fixture.json` — **new**
- `apps/backend/src/eval/fixtures/upkeep-trigger.fixture.json` — **new**
- `apps/backend/src/eval/fixtures/cascade-keyword.fixture.json` — extend `expected`
- `apps/backend/src/eval/fixtures/state-based-actions.fixture.json` — extend `expected`
- All affected `*.context.golden.json`, `*.prompt.golden.txt`, `checklist-report.golden.txt`

## Changes

### Fixture type extension

```ts
export type EvaluationFixtureExpected = {
  expectedSystem2TopicIds?: string[];
  expectedSupplementalRuleIds?: string[];
  forbiddenSupplementalRuleIds?: string[];
};

export type EvaluationFixture = {
  id: string;
  description: string;
  request: AskAiRequest;
  expected?: EvaluationFixtureExpected;
};
```

### New checks (only run when fixture defines the relevant field)

| Check id | Pass condition |
| --- | --- |
| `system2-conditional-selection` | Selected topic ids (from `selectGameRulesTopics`) equal `expectedSystem2TopicIds` set exactly |
| `system3-expected-recall` | Every id in `expectedSupplementalRuleIds` appears in retrieved top-5 |
| `system3-noise-excluded` | No id in `forbiddenSupplementalRuleIds` appears in top-5 |

Checks are skipped (or auto-pass with note) when the corresponding `expected` field is absent — do not fail legacy fixtures.

### Harness test wiring

Replace static `gameRulesTopics` usage:

```ts
const allTopics = loadGameRulesTopics(gameRulesPath);
const selectedTopics = selectGameRulesTopics(context, allTopics);
const curatedRuleIds = collectCuratedRuleIds(selectedTopics);
const supplementalRules = retrieveSupplementalRules(context, ruleIndex, curatedRuleIds);
```

Pass `selectedTopics` to `buildPromptText` and `evaluateScenario`. Extend `evaluateScenario` to accept selected topics + supplemental rules for relevance checks (or compute inside harness from context).

### New fixtures (human-labeled `expected`)

**`counterspell-stack`** — Counterspell on stack, stack_resolving, question about resolution order.

- System 2: core + stack bucket topics (spell casting, resolution, etc.)
- System 3: expect rules about countering / resolution (e.g. `608.2`, `609.3` — verify against CR index during implementation)
- Forbidden: ultra-generic early rules that previously won ties (e.g. `100.1` if applicable)

**`combat-deathtouch`** — Combat damage step, deathtouch blocker, question about damage assignment.

- System 2: core + combat + damage + battlefield buckets
- System 3: deathtouch / damage assignment rules (e.g. `702.2`, `510.1` family)
- Forbidden: generic combat rules unrelated to deathtouch if they were noise before

**`upkeep-trigger`** — Upkeep phase, delayed/upkeep trigger on battlefield, empty stack.

- System 2: core + `abilities-delayed-triggers` (no stack bucket)
- System 3: upkeep / triggered ability rules as labeled

**Extend `cascade-keyword`** — add `expected` with prowess + cascade supplemental ids (`702.85`, `702.108` or human-verified equivalents) and System 2 topic set for stack+battlefield.

**Extend `state-based-actions`** — add `expected` with SBA rules (`704.5g` etc.) and forbidden noise ids.

Label rule ids by inspecting `gameRulesRuleIndex.json` and scorer output — **ground truth is human judgment**, not current scorer output.

### Golden regeneration

Behavior change is intentional:

```bash
UPDATE_CONTEXT_EVAL_FIXTURES=1 npm --workspace apps/backend run test:eval
```

Review diffs: prompts should shrink for fixtures that no longer get all 23 topics.

### Fixtures README

Document `expected` block schema and the three relevance check ids.

## Acceptance criteria

- [ ] `system2-conditional-selection` implemented and runs for fixtures with `expectedSystem2TopicIds`
- [ ] `system3-expected-recall` and `system3-noise-excluded` implemented
- [ ] Three new scenario fixtures committed with labeled `expected` blocks
- [ ] `cascade-keyword` and `state-based-actions` extended with `expected`
- [ ] `checklist-report.golden.txt` updated; all fixtures pass including new checks
- [ ] `npm --workspace apps/backend run test:eval` exits 0
- [ ] Legacy fixtures without `expected` still pass all prior structural checks

## Verification

```bash
UPDATE_CONTEXT_EVAL_FIXTURES=1 npm --workspace apps/backend run test:eval
npm --workspace apps/backend run test:eval
cd apps/backend && npm run quality:check
```

## Notes

- Do not assert full prompt golden text for relevance-only tuning unless structural sections change — prompt goldens will change due to System 2 slimming; that is expected.
- `maxScore` in `EvaluationResult` increases by up to 3 per fixture with full `expected` block.
