# Slice G — Built-prompt checks, goldens, PRD sweep, ship

## Status: planned

## Goal

The finished change is proven end to end on free local checks, every accepted gate slot is in product truth, and the PR body hands the owner the exact steps.

## Requirements

1. Committed built-prompt check (target 4), runs in `quality:check` and reads no suite data: every committed corpus case built as a Quick Lookup prompt, and as an In-Depth prompt when it has a game state. Asserts: 0 lead-ins without their list and the overflow line fires on 0; 100% of excerpts in rule order; 0 doubled rule ids; 0 references to sections absent from that mode; the step summary present in Quick Lookup whenever the question names a step; every case whose deciding 613.x or 510.x rule reached the prompt before the change still has it after (record the before set from `origin/main` code).
2. Standing gates (target 6): `npm run quality:check`; `npm run test:eval` with every golden change reviewed; the 12 labelled checks; benchmark floors 0.8526 and 0.8333. A miss is a stop condition: park the build for the owner.
3. Size (target 11): report rule characters per prompt (expect about 4.9k against 7.5k for search excerpts; curated lists add about 3.7k); the model folder about 23.0 MB; NFR-017's budget test passes.
4. Privacy (target 12) final pass: `scripts/privacy-scan.mjs` over all tracked files reports 0; `git ls-files` lists no weights; the no-weights test passes; training pairs, checkpoints and per-question results are git-ignored.
5. Slot sweep: run one line-level grep over `PRD/sections/` for every one of the 39 slot ids and the old wording `evidence/amendment-grep.md` lists as hit; produce a table in the evidence log with one row per slot (applied in slice, or applied here). Re-derive any leftover by intent against current text; never blind-replay a diff. No `DEC-###` is added. The `build` rows of the amendment grep are verified applied.
6. Draft the PR body to a committed docs location outside `PRD/work/` only if the repo has one; otherwise the evidence log carries it. It lists: the exact S3 upload commands for `models/<model-id>/` (profile `thejudge-admin`) and the `scripts/aws-bootstrap.sh` note; the rules-gate lost-hit list; the after-merge steps (live check with CloudWatch tail, latency timing with the 30 s answer budget and 40 s Lambda, the one paid owner-launched batch with `--max-cost-usd` <= 15 and the bars from the brief). The build does none of these.
7. Confirm no committed deliverable lives under `PRD/work/`, and `git diff --stat origin/main HEAD` outside the package folder shows only intended files.
8. Final PRD promotion checklist (executed in cleanup, only leftovers): every REQ/NFR/FLOW touched is live in `PRD/sections/`; `PRD/work/right-rules-in-order/` is ready to delete.

## Acceptance criteria

- [ ] The built-prompt check test is committed, runs inside `npm run quality:check` and passes all six assertions
- [ ] `npm run test:eval` passes and every golden change is listed in the evidence log
- [ ] The 12 labelled checks and the benchmark floors pass (miss parks the build)
- [ ] Rule characters per prompt, model folder size and the NFR-017 budget test are recorded and pass
- [ ] `scripts/privacy-scan.mjs` reports 0, no weights are tracked, the no-weights test passes
- [ ] The slot table covers all 39 slots with a row each, every one applied in `PRD/sections/`
- [ ] No `DEC-###` was added (grep of `PRD/sections/` shows none new)
- [ ] The PR-body draft carries the upload commands, the lost-hit list and the owner's after-merge steps
- [ ] No deliverable file outside `PRD/work/` is missing from the tree and nothing needed is under `PRD/work/`
- [ ] A dated evidence-log line confirms no S3 upload, AWS bootstrap, deploy, paid call or data refresh ran

## Verification

```bash
npm run quality:check
npm run test:eval
node scripts/privacy-scan.mjs
node scripts/rag-retrieval-benchmark.mjs
git ls-files | grep -E '\.(onnx|safetensors)$' || echo none
```

## Files touched

- `apps/backend/src/prompt/builtPromptChecks.test.ts` (or equivalent) and any shared test helper
- `PRD/sections/` leftover edits per the slot table
- `docs/` PR-body or upload note if used

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/right-rules-in-order/` ready to delete
