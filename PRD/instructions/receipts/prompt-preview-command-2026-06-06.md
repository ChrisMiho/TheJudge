# Receipt — prompt-preview-command

- Date: 2026-06-06
- Slug: prompt-preview-command
- Status: shipped

## Summary

Added `npm run prompt:preview` developer workflow: spawns mock backend, POSTs curated eval fixtures through `POST /api/ask-ai`, writes per-fixture reviewable artifacts (prompt text, normalized context, diagnostics, enrichment trace), then shuts down. Same enrichment pipeline as production UI; no separate debug routes.

## Actions taken

- [x] Slice A acceptance criteria verified (sidecars present, tests green)
- [x] Slice B acceptance criteria verified (prompt:preview exits 0, all-fixtures mode, --fixture and --output-dir flags, manifest.json)
- [x] `npm run quality:check` passes (316 tests, typecheck, lint, format, coverage)
- [x] Public contract unchanged: OpenAI provider and frontend remain `{ answer }` only (DEC-033 preserved)
- [x] No secrets committed
- [x] NFR-009 stale note updated (removed reference to deleted work folder)
- [x] Receipt written
- [x] `PRD/work/prompt-preview-command/` deleted
- [x] `PRD/README.md` — no update needed (work folder was never linked)

## Verification results

```
npm run prompt:preview
→ cascade-keyword: ok, full-context: ok, near-cap-stack: ok, state-based-actions: api_error (400)
→ exit 0

npm run prompt:preview:all
→ 9 ok + 2 api_error (state-based-actions, zero-cards)
→ exit 0

node scripts/prompt-preview.mjs --fixture cascade-keyword --output-dir /tmp/preview-test
→ 1 fixture, exit 0

cascade-keyword enrichment.json: 5 supplemental rules, first score 41, 10 runnerUp ✓
near-cap-stack diagnostics.json: utilizationPercent 88.4 ✓
full-context production.prompt.txt: contains QUESTION and GAME RULES sections ✓
zero-cards meta.json: "result": "api_error" ✓

npm run quality:check → green
```

## Files created

- `scripts/prompt-preview.mjs`
- `PRD/instructions/receipts/prompt-preview-command-2026-06-06.md` (this file)

## Files updated

- `package.json` — added `prompt:preview` and `prompt:preview:all` scripts
- `.gitignore` — added `output/prompt-preview/`
- `apps/backend/src/eval/fixtures/README.md` — added prompt preview section
- `README.md` — added `prompt:preview` and `prompt:preview:all` to Useful Commands
- `PRD/sections/non-functional-requirements.md` — NFR-009 notes: removed stale reference to deleted work folder doc

## Files deleted

- `PRD/work/prompt-preview-command/` (entire directory: README.md, GAMEPLAN.md, IDEA.md, DESIGN-BRIEF.md, slice-a-mock-sidecars-and-enrichment-debug.md, slice-b-preview-script-and-closeout.md)

## PRD sections confirmed accurate (no edits needed)

- `sections/decisions.md` DEC-033 — matches shipped behavior ✓
- `sections/integrations-and-data.md` — mock sidecar shape and prompt preview workflow documented ✓
- `sections/non-functional-requirements.md` NFR-009 — CLI flags and artifact layout match shipped behavior ✓
