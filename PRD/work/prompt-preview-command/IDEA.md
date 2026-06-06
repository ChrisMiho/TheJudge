# IDEA — prompt preview command

## Problem

Enrichment is growing fast: normalized context, curated CR baseline, supplemental retrieval, card rulings, budget caps. Reviewing the **actual LLM prompt** and **why rules were picked** today requires starting the app and reading the mock answer in the UI, or relying on eval golden files that don't exercise the full production path (eval harness skips rulings index).

We need a one-shot local workflow to materialize prompts across representative scenarios while context collection evolves — including future multiple prompt "flavors."

## Goal

- Root npm command similar in spirit to `dev:mock`
- Hit **`POST /api/ask-ai`** with fixture payloads (same path as Decrypt Stack)
- Write multiple review files per scenario without committing them
- Surface rules enrichment debug (query, scores, runner-ups) not visible in diagnostics today

## Non-goals

- New HTTP routes or debug endpoints
- Starting the frontend / Vite
- Replacing eval golden CI workflow
- Live OpenAI calls
- Committing generated output to the repo
- Multiple prompt flavors in v1 (extension point only)

## Default scenarios (curated subset)

Fixtures from [`apps/backend/src/eval/fixtures/`](../../../apps/backend/src/eval/fixtures/):

| Fixture | Why |
|---------|-----|
| `full-context` | Multi-zone, stack, targets, notes |
| `cascade-keyword` | Supplemental CR retrieval (keywords) |
| `state-based-actions` | Supplemental CR retrieval (SBA) |
| `near-cap-stack` | Prompt budget pressure |

## Drift prevention

Fixtures flow through `askAiRequestSchema` → `preparePromptInput` → mock provider. Any enrichment change appears on the next `npm run prompt:preview` run without maintaining a parallel prompt builder.

Eval goldens (`npm --workspace apps/backend run test:eval`) remain the CI regression gate; prompt preview is for **human review**.

## Success looks like

```bash
npm run prompt:preview
ls output/prompt-preview/cascade-keyword/
# production.prompt.txt  context.json  diagnostics.json  enrichment.json
```

Open `enrichment.json` and see supplemental rule scores + runner-ups for a keyword-heavy question.
