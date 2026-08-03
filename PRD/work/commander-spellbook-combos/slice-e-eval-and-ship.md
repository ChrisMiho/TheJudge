# Slice E — Eval coverage and ship closure

## Status: planned

## Dependencies

- Slice D — eval goldens and ship checks must capture the final runtime injection, matching output, prompt ordering, diagnostics, and fail-open behavior.

## Goal

Prove the complete Commander Spellbook enrichment flow with deterministic eval fixtures, full regression gates, and an auditable PRD cleanup handoff.

## Requirements

1. Add a small stable eval-owned catalog fixture at `apps/backend/src/eval/fixtures/commander-spellbook.catalog.json`. It mirrors the normalized Slice A schema with representative exact, template, quantity, popularity-tie, wrong-zone, and unresolved-template variants, but is not a second production corpus and is never loaded by runtime.
2. Extend `EvaluationFixture` with optional test-only `commanderSpellbookCatalog: "fixture" | "empty"` metadata and `expected.expectedCommanderSpellbookVariantIds`. Existing fixtures default to empty combo catalog, so upstream refreshes cannot change legacy goldens.
3. Extend the harness with a `commander-spellbook-selection` check that compares selected variant ids in rank order and a `commander-spellbook-section-order` check that enforces placement after official enrichment and before `SCOPE`/conversation history/`QUESTION` when expected. Absence is an explicit passing expectation for empty/no-match scenarios.
4. Update the eval test to normalize the fixture catalog once through Slice B's public seam and pass the selected fixture/empty catalog into the same `preparePromptInput` production path for both game and lookup requests. Do not create a test-only matcher or formatter.
5. Add these seven scenarios, each with request, context golden, prompt golden, and expected variant ids:
   - `commander-spellbook-game-complete-no-intent` — complete automatic match and relevance instruction;
   - `commander-spellbook-game-partial-explicit` — explicit partial with required anchor and missing pieces;
   - `commander-spellbook-lookup-attached-explicit` — attached exact/template eligibility and missing pieces;
   - `commander-spellbook-lookup-unrelated-card` — explicit question with unrelated attached card omits combo context;
   - `commander-spellbook-unresolved-template` — explicit partial labels unresolved template and cannot be complete;
   - `commander-spellbook-incompatible-zone` — identity present in the wrong zone is labeled and incomplete;
   - `commander-spellbook-no-artifact` — empty catalog omits the section while the normal provider-ready prompt remains intact.
6. Update the fixture README with the two combo-specific metadata fields, the stable-catalog rule, and the exact golden regeneration/review commands. Regenerate all new goldens and `checklist-report.golden.txt` only with `UPDATE_CONTEXT_EVAL_FIXTURES=1`, then review every diff before running the normal gate.
7. Run the targeted/backend/full quality gates. Use `prompt:preview` for the complete and explicit-partial scenarios against the committed production catalog and manually verify heading, source references, missing/wrong-zone labels, authority language, and section order.
8. Confirm no visible Known Combos UI, browser, portal entry, endpoint, request field, runtime upstream call, legality simulation, or deterministic prerequisite/mana/commander validation entered the implementation.
9. Carry the PRD promotion checklist below for `thejudge-cleanup`; this slice does not mark planned system-map entries shipped or delete the work folder itself.

## Acceptance criteria

- [ ] `npm --workspace apps/backend run test:eval` passes all legacy fixtures plus the seven new Commander Spellbook scenarios with deterministic expected variant-id order.
- [ ] Re-running the eval gate without regeneration produces byte-identical context/prompt/checklist goldens.
- [ ] The game-complete golden contains an automatic complete section; the game-partial, unresolved-template, and incompatible-zone goldens contain the required labels; the unrelated-card and no-artifact goldens contain no combo heading.
- [ ] The lookup-attached golden contains card/rules/rulings enrichment before combo context and the current question after it, with no game-only sections.
- [ ] `npm run prompt:preview -- --fixture commander-spellbook-game-complete-no-intent` and the explicit-partial preview both complete; a manual inspection records the expected heading, authority disclaimer, source URL, annotations, and order in the slice status notes or implementation handoff.
- [ ] `npm --workspace apps/backend run test`, `npm --workspace apps/backend run typecheck`, and `npm run quality:check` pass from a fresh final run.
- [ ] `git diff --check` passes and `git status --short` contains no raw Commander Spellbook snapshot files, temp/backup artifacts, prompt-preview output, or secrets.
- [ ] A final diff review confirms `POST /api/ask-ai`, `AskAiRequest`, Zod schemas, live `{ answer }`, provider selection, frontend destinations, and bottom-to-top stack semantics are unchanged.
- [ ] The cleanup handoff explicitly records the durable truth review, dated receipt, system-map promotion gate, and deletion of this work folder.

## Verification

```bash
npm --workspace apps/backend run test:eval
npm --workspace apps/backend run test
npm --workspace apps/backend run typecheck
npm run prompt:preview -- --fixture commander-spellbook-game-complete-no-intent
npm run prompt:preview -- --fixture commander-spellbook-game-partial-explicit
npm run quality:check
git diff --check
git status --short
```

## Files touched

- `apps/backend/src/eval/contextEvaluationHarness.ts`
- `apps/backend/src/eval/contextEvaluationHarness.test.ts`
- `apps/backend/src/eval/fixtures/README.md`
- `apps/backend/src/eval/fixtures/checklist-report.golden.txt`
- `apps/backend/src/eval/fixtures/commander-spellbook.catalog.json` (new)
- `apps/backend/src/eval/fixtures/commander-spellbook-game-complete-no-intent.fixture.json` (new)
- `apps/backend/src/eval/fixtures/commander-spellbook-game-complete-no-intent.context.golden.json` (new)
- `apps/backend/src/eval/fixtures/commander-spellbook-game-complete-no-intent.prompt.golden.txt` (new)
- `apps/backend/src/eval/fixtures/commander-spellbook-game-partial-explicit.fixture.json` (new)
- `apps/backend/src/eval/fixtures/commander-spellbook-game-partial-explicit.context.golden.json` (new)
- `apps/backend/src/eval/fixtures/commander-spellbook-game-partial-explicit.prompt.golden.txt` (new)
- `apps/backend/src/eval/fixtures/commander-spellbook-lookup-attached-explicit.fixture.json` (new)
- `apps/backend/src/eval/fixtures/commander-spellbook-lookup-attached-explicit.context.golden.json` (new)
- `apps/backend/src/eval/fixtures/commander-spellbook-lookup-attached-explicit.prompt.golden.txt` (new)
- `apps/backend/src/eval/fixtures/commander-spellbook-lookup-unrelated-card.fixture.json` (new)
- `apps/backend/src/eval/fixtures/commander-spellbook-lookup-unrelated-card.context.golden.json` (new)
- `apps/backend/src/eval/fixtures/commander-spellbook-lookup-unrelated-card.prompt.golden.txt` (new)
- `apps/backend/src/eval/fixtures/commander-spellbook-unresolved-template.fixture.json` (new)
- `apps/backend/src/eval/fixtures/commander-spellbook-unresolved-template.context.golden.json` (new)
- `apps/backend/src/eval/fixtures/commander-spellbook-unresolved-template.prompt.golden.txt` (new)
- `apps/backend/src/eval/fixtures/commander-spellbook-incompatible-zone.fixture.json` (new)
- `apps/backend/src/eval/fixtures/commander-spellbook-incompatible-zone.context.golden.json` (new)
- `apps/backend/src/eval/fixtures/commander-spellbook-incompatible-zone.prompt.golden.txt` (new)
- `apps/backend/src/eval/fixtures/commander-spellbook-no-artifact.fixture.json` (new)
- `apps/backend/src/eval/fixtures/commander-spellbook-no-artifact.context.golden.json` (new)
- `apps/backend/src/eval/fixtures/commander-spellbook-no-artifact.prompt.golden.txt` (new)

## PRD promotion checklist (executed by `thejudge-cleanup`, not this slice)

- [ ] Confirm DEC-116 in `sections/decisions/combo-retrieval.md` and its router entry in `sections/decisions.md` match the shipped artifact, matching, and prompt boundaries; edit only if shipped behavior differs.
- [ ] Confirm REQ-093–REQ-095 in `sections/functional-requirements.md`, FLOW-015 in `sections/user-flows.md`, and the Commander Spellbook strategy in `sections/integrations-and-data.md` match verified behavior.
- [ ] Flip **Commander Spellbook combo artifact build** and **Commander Spellbook combo retrieval** in `sections/system-map.md` from `planned` to `shipped` only after product code/artifacts are wired and the cleanup receipt exists.
- [ ] Review `sections/overview.md` and `sections/goals-and-non-goals.md` for current-tense wording; preserve the non-goals and authority guardrails.
- [ ] Write a dated receipt under `PRD/instructions/receipts/` named for `commander-spellbook-combos`, including artifact counts/snapshot id and the final verification commands.
- [ ] Delete `PRD/work/commander-spellbook-combos/` entirely after durable promotion and receipt creation.
- [ ] Leave `PRD/README.md` unchanged unless navigation/read-order guidance genuinely changed.

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/commander-spellbook-combos/` ready to delete
