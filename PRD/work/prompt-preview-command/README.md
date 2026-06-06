# prompt-preview-command

status: active

## Summary

Add `npm run prompt:preview` — a developer command that briefly starts the backend in mock mode, POSTs curated eval fixtures through the real `/api/ask-ai` route, and writes reviewable prompt artifacts locally (prompt text, normalized context, diagnostics, rules enrichment trace).

Same enrichment pipeline as the UI; no separate debug routes or in-process shortcuts.

## Docs in this folder

| File | Purpose |
|------|---------|
| [IDEA.md](./IDEA.md) | Problem, goals, non-goals |
| [DESIGN-BRIEF.md](./DESIGN-BRIEF.md) | Mock response shape, sidecars, enrichment debug detail |
| [GAMEPLAN.md](./GAMEPLAN.md) | Architecture, data flow, verification checklist |
| [slice-a-mock-sidecars-and-enrichment-debug.md](./slice-a-mock-sidecars-and-enrichment-debug.md) | Backend mock response + enrichment trace |
| [slice-b-preview-script-and-closeout.md](./slice-b-preview-script-and-closeout.md) | Orchestrator script, npm, gitignore, closeout |

## Slices

Execute in order. Slice B depends on Slice A sidecars being present on mock `/api/ask-ai` responses.

| Slice | Objective | Depends on | Parallel-ready |
|-------|-----------|------------|----------------|
| [A](./slice-a-mock-sidecars-and-enrichment-debug.md) | Mock sidecar fields + `EnrichmentDebug` collector | — | No (blocks B) |
| [B](./slice-b-preview-script-and-closeout.md) | Orchestrator script, npm scripts, gitignore, fixture README | A | No |

## Implementation map

| Area | Primary files |
|------|---------------|
| Response schema | `apps/backend/src/validation/askAiRequest.ts` |
| Enrichment debug types | `apps/backend/src/prompt/enrichmentDebug.ts` (new) |
| Supplemental retrieval debug | `apps/backend/src/gameRulesRetrieval.ts` |
| Rulings debug | `apps/backend/src/cardRulings.ts` |
| Prompt assembly | `apps/backend/src/prompt/preparation.ts` |
| Mock answer + sidecars | `apps/backend/src/mockAskAi.ts`, `apps/backend/src/providers/mockAskAiProvider.ts` |
| Orchestrator | `scripts/prompt-preview.mjs` (new) |
| npm scripts | root `package.json` |
| Fixtures | `apps/backend/src/eval/fixtures/*.fixture.json` |
| Output (gitignored) | `output/prompt-preview/` |

## Key commands (after ship)

```bash
npm run prompt:preview
npm run prompt:preview:all
```

Output: gitignored `output/prompt-preview/` (not committed).

## Session openers

```
Attach thejudge-implement for PRD/work/prompt-preview-command/ slice A.
Attach thejudge-implement for PRD/work/prompt-preview-command/ slice B.
Attach thejudge-cleanup for PRD/work/prompt-preview-command/.
```
