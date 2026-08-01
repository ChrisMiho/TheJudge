# Receipt — quick-lookup

- Date: 2026-08-01
- Slug: `quick-lookup`
- Status: shipped

## Actions taken

- [x] Verified Slice A: the additive `"game" | "lookup"` request union, optional oracle-level card reference, strict cross-mode rejection, shared question/history validation, and unchanged response/provider boundary are implemented and covered.
- [x] Verified Slice B: lookup prompt assembly, question/card-scored System 3 retrieval, optional metadata/rulings enrichment, game-state-section omission, mock prompt exposure, and the prompt-only off-domain guardrail are implemented and covered without game-mode golden drift.
- [x] Verified Slice C: the six-topic frontend browse artifact is generated in fixed order from the curated rules source, preserves source fields exactly, handles missing topics with a warning, and has policy coverage.
- [x] Verified Slice D: Quick Lookup is registered in the portal; optional search/scan card input, card removal, 300-character question handling, and the collapsed local core-topics disclosure are implemented and covered.
- [x] Verified Slice E: shared submit orchestration, assistant-first conversations, frozen optional card context, follow-ups, retry behavior, shared limits, and start-over restoration are implemented and covered.
- [x] Promoted durable product truth in decisions, requirements, flows, open questions, the decisions router, and suite build order; normalized the remaining implementation-era wording in DEC-106 and DEC-108.
- [x] Confirmed the public contract change was explicitly scoped and additive: legacy mode-absent game requests remain valid; endpoint, success/error shapes, and provider boundary are unchanged.
- [x] Scanned the branch diff for credential-like filenames and common private-key/token patterns; no secrets found.
- [x] Applied the system-map promotion gate by adding the code-and-receipt-backed Quick Lookup subsystem as `shipped`.
- [x] Deleted `PRD/work/quick-lookup/` after durable promotion and receipt creation.
- [x] Re-ran the full `npm run quality:check` ship gate after cleanup edits.

## Files created

- `PRD/instructions/receipts/quick-lookup-2026-08-01.md`
- `apps/backend/src/eval/fixtures/quick-lookup-card.context.golden.json`
- `apps/backend/src/eval/fixtures/quick-lookup-card.fixture.json`
- `apps/backend/src/eval/fixtures/quick-lookup-card.prompt.golden.txt`
- `apps/backend/src/eval/fixtures/quick-lookup-no-card.context.golden.json`
- `apps/backend/src/eval/fixtures/quick-lookup-no-card.fixture.json`
- `apps/backend/src/eval/fixtures/quick-lookup-no-card.prompt.golden.txt`
- `apps/backend/src/eval/fixtures/quick-lookup-off-domain.context.golden.json`
- `apps/backend/src/eval/fixtures/quick-lookup-off-domain.fixture.json`
- `apps/backend/src/eval/fixtures/quick-lookup-off-domain.prompt.golden.txt`
- `apps/backend/src/prompt/preparation.test.ts`
- `apps/frontend/public/data/gameRulesCoreTopics.json`
- `apps/frontend/src/components/FollowUpComposer.tsx`
- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.test.tsx`
- `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`

## Files updated

- `PRD/sections/decisions.md`
- `PRD/sections/decisions/lookup-suite.md`
- `PRD/sections/decisions/providers-and-contract.md`
- `PRD/sections/decisions/rules-retrieval.md`
- `PRD/sections/functional-requirements.md`
- `PRD/sections/open-questions.md`
- `PRD/sections/system-map.md`
- `PRD/sections/user-flows.md`
- `PRD/work/commander-spellbook-combos/README.md`
- `PRD/work/suite-build-order/README.md`
- `apps/backend/src/app.behavior.test.ts`
- `apps/backend/src/app.contract.test.ts`
- `apps/backend/src/eval/contextEvaluationHarness.test.ts`
- `apps/backend/src/eval/contextEvaluationHarness.ts`
- `apps/backend/src/eval/fixtures/checklist-report.golden.txt`
- `apps/backend/src/gameRulesRetrieval.test.ts`
- `apps/backend/src/gameRulesRetrieval.ts`
- `apps/backend/src/prompt/context.test.ts`
- `apps/backend/src/prompt/context.ts`
- `apps/backend/src/prompt/preparation.ts`
- `apps/backend/src/prompt/promptAssembly.test.ts`
- `apps/backend/src/prompt/promptAssembly.ts`
- `apps/backend/src/routes/askAi.ts`
- `apps/backend/src/test-utils/requestBuilders.ts`
- `apps/backend/src/types/index.ts`
- `apps/backend/src/validation/askAiRequest.test.ts`
- `apps/backend/src/validation/askAiRequest.ts`
- `apps/frontend/src/components/EnrichmentStep.tsx`
- `apps/frontend/src/components/portal/destinationRegistry.test.tsx`
- `apps/frontend/src/components/portal/destinationRegistry.tsx`
- `apps/frontend/src/hooks/useAskAiSubmitOrchestration.test.ts`
- `apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts`
- `apps/frontend/src/lib/contextFlow/flow.test.ts`
- `apps/frontend/src/lib/contextFlow/flow.ts`
- `apps/frontend/src/lib/contextFlow/index.ts`
- `apps/frontend/src/lib/gameRulesBuildPolicy.test.ts`
- `scripts/build-game-rules.mjs`

## Files deleted

- `PRD/work/quick-lookup/DESIGN-BRIEF.md`
- `PRD/work/quick-lookup/GAMEPLAN.md`
- `PRD/work/quick-lookup/IDEA.md`
- `PRD/work/quick-lookup/README.md`
- `PRD/work/quick-lookup/slice-a-mode-contract.md`
- `PRD/work/quick-lookup/slice-b-lookup-prompt-assembly.md`
- `PRD/work/quick-lookup/slice-c-core-topics-artifact.md`
- `PRD/work/quick-lookup/slice-d-quick-lookup-view.md`
- `PRD/work/quick-lookup/slice-e-conversation-thread.md`
- `PRD/work/quick-lookup/prior/card-lookup-qa/DESIGN-BRIEF.md`
- `PRD/work/quick-lookup/prior/card-lookup-qa/GAMEPLAN.md`
- `PRD/work/quick-lookup/prior/card-lookup-qa/IDEA.md`
- `PRD/work/quick-lookup/prior/card-lookup-qa/README.md`
- `PRD/work/quick-lookup/prior/card-lookup-qa/slice-a-mode-contract.md`
- `PRD/work/quick-lookup/prior/card-lookup-qa/slice-b-card-prompt.md`
- `PRD/work/quick-lookup/prior/card-lookup-qa/slice-c-lookup-view.md`
- `PRD/work/quick-lookup/prior/rules-lookup/DESIGN-BRIEF.md`
- `PRD/work/quick-lookup/prior/rules-lookup/GAMEPLAN.md`
- `PRD/work/quick-lookup/prior/rules-lookup/IDEA.md`
- `PRD/work/quick-lookup/prior/rules-lookup/README.md`
- `PRD/work/quick-lookup/prior/rules-lookup/slice-a-rules-mode-contract.md`
- `PRD/work/quick-lookup/prior/rules-lookup/slice-b-rules-prompt-assembly.md`
- `PRD/work/quick-lookup/prior/rules-lookup/slice-c-answer-seeded-second-pass.md`
- `PRD/work/quick-lookup/prior/rules-lookup/slice-d-core-topics-artifact.md`
- `PRD/work/quick-lookup/prior/rules-lookup/slice-e-rules-lookup-view.md`

## Verification results

- Targeted backend contract/prompt/retrieval suite: 5 files, 122 tests passed.
- Backend context-evaluation harness: 1 file, 2 tests passed; Quick Lookup card, no-card, and off-domain fixtures all pass with no game-mode golden drift.
- Targeted frontend portal/orchestration/build-policy suite: 5 files, 65 tests passed.
- Core-topics source-fidelity check: 6 entries in the signed-off fixed order; `title`, `ruleNumbers`, and `excerpt` exactly match `gameRulesByTopic.json`.
- Secret scan: passed.
- `npm run quality:check`: passed — typecheck, lint, and format checks clean; frontend 70 files / 624 tests passed; backend 23 files / 251 tests passed; coverage gates passed.
