# Empty Stack Fallback Fix Receipt

- Date: 2026-06-05
- Slug: `empty-stack-fallback-fix`
- Status: shipped

## Actions taken

- [x] Replaced unconditional blank-question stack fallback with zone-aware fallback in frontend request building.
- [x] Mirrored zone-aware fallback in backend prompt context building.
- [x] Added enrichment pre-decrypt summary with populated zone counts, selected-empty stack note, and dynamic fallback hint.
- [x] Added non-blocking zone collection nudge when stack is selected but empty and another selected zone has cards.
- [x] Added frontend, backend, and endpoint regression coverage for battlefield-only blank-question submissions.
- [x] Promoted durable product truth into `PRD/sections/`.
- [x] Deleted ephemeral work package after verification.

## Files updated

- `PRD/sections/decisions.md`
- `PRD/sections/functional-requirements.md`
- `PRD/sections/user-flows.md`
- `apps/backend/src/app.contract.test.ts`
- `apps/backend/src/prompt/context.test.ts`
- `apps/backend/src/prompt/context.ts`
- `apps/frontend/src/App.test.tsx`
- `apps/frontend/src/components/EnrichmentStep.tsx`
- `apps/frontend/src/components/ZoneCollectionStep.tsx`
- `apps/frontend/src/lib/contextFlow/flow.test.ts`
- `apps/frontend/src/lib/contextFlow/flow.ts`
- `apps/frontend/src/lib/contextFlow/index.ts`

## Files deleted

- `PRD/work/empty-stack-fallback-fix/GAMEPLAN.md`
- `PRD/work/empty-stack-fallback-fix/README.md`
- `PRD/work/empty-stack-fallback-fix/slice-a-context-aware-fallback.md`
- `PRD/work/empty-stack-fallback-fix/slice-b-enrichment-summary.md`
- `PRD/work/empty-stack-fallback-fix/slice-c-zone-collection-nudge.md`
- `PRD/work/empty-stack-fallback-fix/slice-d-prd-and-closeout.md`

## Verification

- `npm --workspace apps/frontend run test -- flow.test.ts App.test.tsx` passed: 88 tests.
- `npm --workspace apps/backend run test -- context.test.ts app.contract.test.ts` passed: 20 tests.
- `npm run quality:check` passed: typecheck, lint, format check, frontend/backend tests, and coverage checks.

## Notes

- API request shape remains `AskAiRequest = { question, gameContext }`.
- Stack-card blank submissions still fall back to **Resolve the stack**.
- Battlefield-only or other non-stack blank submissions now fall back to **Explain the interaction with the provided game state**.
