# Slice B — cap-and-run-command

## Status: planned

## Goal

Make the System 3 excerpt cap a named, reusable parameter, and scaffold the
on-demand `npm run eval:answer-quality` command: dry run, confirmation gate,
model lineup, model-access check, and per-call latency capture — with no
production behavior change and no live provider call in any test.

## Requirements

1. The four hard-coded `5` literals in `apps/backend/src/prompt/preparation.ts`
   (today at lines 228, 272, 317, 355) become one named, exported constant.
   Every production call site keeps passing no override and therefore still
   gets exactly 5 — this is a behavior-preserving refactor, not a cap change.
2. `preparePromptInput` gains an optional excerpt-cap override on
   `PreparePromptInputOptions` (default: the named constant), threaded to the
   same `retrieveRulesForQueryWithDebug` / `retrieveSupplementalRulesWithDebug`
   `max` parameter that already returns `runnerUp` (ranks 6–15) from the
   identical scored list — no change to query construction, scoring, corpus,
   or embeddings.
3. `scripts/eval-answer-quality.mjs` (new) parses `--confirm-live-calls`,
   `--excerpt-cap` (repeatable, default `[5, 10]`), `--model` (repeatable,
   default the four-model lineup), `--output-dir`. It never reads
   `OPENAI_MODEL`.
4. With no `--confirm-live-calls`, it prints the run plan and a cost estimate
   and makes no network call.
5. With `--confirm-live-calls` but without `ASK_AI_PROVIDER=openai` and
   `OPENAI_API_KEY`, it fails with an actionable message naming what is
   missing — the same guard shape `scripts/compare-combo-answer-quality.mjs`
   already uses.
6. Before any paid call, it checks model access (a models-list request, never
   a completion) for every lineup model and for the judge model, and fails
   naming any model that is not available. The dry run performs the same
   check when a key is present and skips it when none is.
7. Provider calls are sequential, never concurrent. Wall-clock latency in
   milliseconds is recorded per call.
8. `npm run eval:answer-quality` is added to `package.json` and never added to
   `quality:check`, `test`, `test:eval`, `coverage:check`, or `test:scripts`.
9. Apply `GATE-QUESTIONS.md`'s **REQ-188** and **REQ-190** blocks to
   `PRD/sections/functional-requirements.md` by intent, together with this
   slice's code.

## Acceptance criteria

- [ ] B1. `preparation.ts` has exactly one named, exported constant for the
      excerpt cap, used at all four call sites; `grep -c` for the literal `5`
      at those call sites finds none (the constant replaces it), proven by a
      test that imports the constant and asserts its value is `5`.
- [ ] B2. A test asserts that with no cap override, the assembled prompt for
      each of the six baseline gold cases is byte-identical to the prompt
      produced before this slice (the M4 baseline: 9,438 / 9,980 / 10,577 /
      10,712 / 11,186 / 12,628 characters at cap 5).
- [ ] B3. A test asserts that with a cap-10 override, the assembled prompt for
      each of the six baseline gold cases adds excerpts drawn from the same
      ranking (the `runnerUp` slice), never changing the top-5 selection.
- [ ] B4. `scripts/eval-answer-quality.test.mjs` asserts that with no
      confirmation flag, running the script makes no network call and exits
      0, printing a plan.
- [ ] B5. The same test file asserts that with `--confirm-live-calls` and no
      `OPENAI_API_KEY`, the script fails with an actionable message (not a
      stack trace) and exits non-zero, without ever having made a network
      call.
- [ ] B6. The same test file asserts the model-access check is a models-list
      request (never a completion) via an injected fake client, and that it
      is skipped when no key is present.
- [ ] B7. The same test file asserts `parseArgs` ignores `OPENAI_MODEL` and
      never reads it for the lineup.
- [ ] B8. `npm run test:scripts` passes.
- [ ] B9. `PRD/sections/functional-requirements.md` carries `### REQ-188` and
      `### REQ-190` entries matching the finalized `GATE-QUESTIONS.md` blocks,
      re-derived against current truth.

## Verification

```bash
npm run test:scripts
npm run eval:answer-quality
```

## Files touched

- `apps/backend/src/prompt/preparation.ts`
- `apps/backend/src/prompt/preparation.test.ts` (or existing test file covering it)
- `scripts/eval-answer-quality.mjs` (new)
- `scripts/eval-answer-quality.test.mjs` (new)
- `package.json` (`eval:answer-quality` script)
- `PRD/sections/functional-requirements.md` (REQ-188, REQ-190, new entries)
