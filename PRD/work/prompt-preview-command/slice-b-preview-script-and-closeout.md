# Slice B — Preview script and closeout

## Status: planned

## Goal

Add `npm run prompt:preview` orchestrator that spins up mock backend, POSTs curated fixtures through `POST /api/ask-ai`, writes separated review artifacts per fixture, and shuts down. Includes npm scripts, gitignore entry, and fixture README note.

## Depends on

[Slice A](./slice-a-mock-sidecars-and-enrichment-debug.md) — mock sidecar fields must be present on HTTP 200 responses.

## Requirements

1. **Orchestrator script** — Create `scripts/prompt-preview.mjs`:
   - Spawn `ASK_AI_PROVIDER=mock PORT=<port> npm run dev --workspace apps/backend` (backend only; no frontend)
   - Poll `GET http://127.0.0.1:<port>/api/health` with ~15s timeout
   - Load fixtures from `apps/backend/src/eval/fixtures/*.fixture.json`
   - `POST /api/ask-ai` with each fixture's `request` body
   - Write per-fixture output directory under `output/prompt-preview/<fixture-id>/`
   - Continue remaining fixtures when one returns `api_error` or `failed`; do not stop early
   - Write run-level `manifest.json`
   - `SIGTERM` backend on completion; handle `SIGINT`/`SIGTERM` on script (follow spawn/shutdown patterns from `scripts/dev.mjs`)
2. **CLI flags** — `--fixture <id>`, `--all-fixtures`, `--output-dir` (default `output/prompt-preview`), `--port` (default `3099`)
3. **Default fixture set** — `full-context`, `cascade-keyword`, `state-based-actions`, `near-cap-stack`
4. **All-fixtures mode** — Every `*.fixture.json` under eval fixtures, including error-path fixtures (e.g. `zero-cards`)
5. **Success artifact layout** (HTTP 200, all sidecars present → `result: ok`):

   | File | Source |
   |------|--------|
   | `request.json` | fixture `request` |
   | `meta.json` | `{ id, description, httpStatus, result }` |
   | `production.prompt.txt` | parsed from `answer` after `FULL PROMPT (SENT TO PROVIDER)\n\n` |
   | `context.json` | response `context` sidecar |
   | `diagnostics.json` | response `diagnostics` sidecar |
   | `enrichment.json` | response `enrichmentDebug` sidecar |

6. **Error artifact layout** (HTTP non-2xx → `result: api_error`):

   | File | Source |
   |------|--------|
   | `request.json` | fixture `request` |
   | `meta.json` | `{ id, description, httpStatus, result: "api_error" }` |
   | `api-error.json` | exact response body (`askAiErrorSchema`) |
   | `response-headers.json` | at minimum `x-correlation-id` |

7. **Failure detection** (`result: failed`) — missing sidecars on 200, prompt parse error, network error, filesystem write failure
8. **Exit codes** — `0` when every fixture reaches `ok` or `api_error` with artifacts written; `1` on health timeout or any `failed` fixture
9. **npm scripts** — Add to root `package.json`:
   - `"prompt:preview": "node scripts/prompt-preview.mjs"`
   - `"prompt:preview:all": "node scripts/prompt-preview.mjs --all-fixtures"`
10. **Gitignore** — Add `output/prompt-preview/` to `.gitignore`
11. **Fixture README** — One-line note in `apps/backend/src/eval/fixtures/README.md` pointing to `npm run prompt:preview`

## Acceptance criteria

- [ ] `npm run prompt:preview` completes exit 0 and writes 4 fixture directories + `manifest.json`
- [ ] `npm run prompt:preview:all` includes `zero-cards` with `result: api_error` and still exits 0
- [ ] `production.prompt.txt` contains `QUESTION` and prompt section headers (not raw JSON)
- [ ] `enrichment.json` for `cascade-keyword` has supplemental scores
- [ ] `context.json` for `full-context` has `orderedStack` bottom-to-top
- [ ] `manifest.json` lists fixture ids, results, httpStatus, and relative file paths — not response body dumps
- [ ] `--fixture cascade-keyword` runs only that fixture
- [ ] `--output-dir /tmp/preview-test` writes to custom directory
- [ ] Backend process is terminated after run (no orphan on normal exit)
- [ ] `npm run quality:check` passes

## Verification

```bash
npm run prompt:preview
ls output/prompt-preview/manifest.json
ls output/prompt-preview/cascade-keyword/production.prompt.txt
ls output/prompt-preview/cascade-keyword/enrichment.json

npm run prompt:preview:all
cat output/prompt-preview/zero-cards/meta.json
# expect: "result": "api_error"

npm run quality:check
```

Manual review:

- `output/prompt-preview/cascade-keyword/enrichment.json` — supplemental `selected` includes cascade-related rules with scores
- `output/prompt-preview/full-context/production.prompt.txt` — stack + battlefield + GAME RULES sections
- `output/prompt-preview/near-cap-stack/diagnostics.json` — high utilization / `nearLimit: true`
- `output/prompt-preview/zero-cards/api-error.json` — validation error code and message

## Files touched

- `scripts/prompt-preview.mjs` (new)
- `package.json`
- `.gitignore`
- `apps/backend/src/eval/fixtures/README.md`

## Tests

No dedicated script unit test required if orchestrator logic is kept in `.mjs`. Verification is integration via commands above. Extract pure helpers (prompt section parser, manifest builder) to testable modules only if complexity warrants it — keep scope minimal.

Backend tests from Slice A must remain green.

## PRD promotion checklist

Execute during `thejudge-cleanup` (not in this slice):

- [ ] Confirm `PRD/sections/decisions.md` DEC-033 matches shipped behavior
- [ ] Confirm `PRD/sections/integrations-and-data.md` mock sidecar docs match response shape
- [ ] Confirm `PRD/sections/non-functional-requirements.md` NFR-009 matches CLI flags and artifact layout
- [ ] No further PRD edits needed unless implementation diverged from brief
- [ ] Write receipt to `PRD/instructions/receipts/prompt-preview-command-YYYY-MM-DD.md`
- [ ] Delete `PRD/work/prompt-preview-command/` per [doc-lifecycle.md](../../instructions/doc-lifecycle.md)

## Ship gates

- [ ] Slice A acceptance criteria satisfied and verified
- [ ] Slice B acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged except DEC-033 optional mock-only fields
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/prompt-preview-command/` ready to delete
