# Slice E — deploy default

## Status: planned

## Goal

Make `EMBEDDING_PROVIDER=local` the deployed backend's explicit default, now
that Slices A–C make it safe: the hybrid blend clears its gates, the semantic
eval checks hard-gate `test:eval`, and the vectors fit the Lambda data budget.

## Requirements

1. Depends on Slices A, B, and C: REQ-184 explicitly "does not land before
   REQ-182's gates pass and REQ-032's semantic checks gate `npm run
   test:eval`," and `integrations-and-data.md`'s accepted diff cites both
   REQ-183's encoding change and REQ-184's default in one edit. Do not start
   this slice's code or doc changes until Slices A, B, and C are all `done`.
2. **REQ-184 — deployed default.** In `scripts/aws-deploy.sh` and
   `scripts/aws-bootstrap.sh`, add `EMBEDDING_PROVIDER=local` to the Lambda
   `--environment "Variables={...}"` string, the same way `ASK_AI_PROVIDER=openai`
   is already set there (three call sites: `aws-deploy.sh` and two in
   `aws-bootstrap.sh`). The *unset* default stays `mock`
   (`apps/backend/src/config/index.ts`'s `DEFAULT_EMBEDDING_PROVIDER_MODE`,
   already covered by `apps/backend/src/config/index.test.ts` — no code change
   needed there; this slice does not touch it).
3. Add a test asserting `scripts/package-lambda.sh` already refuses to build
   the package when the packaged model cache file
   (`apps/backend/data/models/Xenova/all-MiniLM-L6-v2/onnx/model_quantized.onnx`)
   is absent, so that refusal is proven rather than assumed.
4. Apply the REQ-184 (new), `quick-lookup/README.md`, and
   `integrations-and-data.md` documentation blocks to `PRD/sections/`, by
   intent, together with the code above.

## Acceptance criteria

- [ ] E1 — Slices A, B, and C are all `done` before this slice's code and doc
      changes land
- [ ] E2 — the deployed Lambda's environment sets `EMBEDDING_PROVIDER=local`
      explicitly, recorded in the same places `ASK_AI_PROVIDER` is set
      (`scripts/aws-deploy.sh`, `scripts/aws-bootstrap.sh`)
- [ ] E3 — `EMBEDDING_PROVIDER` unset still resolves to `mock` and never
      auto-switches on `NODE_ENV` or deploy target (existing coverage:
      `apps/backend/src/config/index.test.ts`)
- [ ] E4 — a test asserts the deploy fails, rather than silently degrading,
      when the packaged model cache is absent
- [ ] E5 — a local `npm run dev` with no warmed model cache and no network
      still answers, using lexical retrieval, with the single diagnostic
      warning REQ-181 requires (existing coverage; confirmed, not re-built)
- [ ] E6 — the REQ-184 (new), `quick-lookup/README.md`, and
      `integrations-and-data.md` documentation blocks are applied by intent,
      matching the finalized `GATE-QUESTIONS.md` diff
- [ ] E7 — Ship gates below are satisfied and the durable `PRD/sections/`
      outcome for this package is fully applied (no leftover proposal text)

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/hybrid-rule-retrieval/` ready to
      delete

## PRD promotion checklist (execution happens in cleanup)

All 15 `GATE-QUESTIONS.md` proposal blocks are applied to `PRD/sections/` by
Slices A–E (see `GAMEPLAN.md`'s block-assignment table) — by the time this
slice is `done`, no orphaned proposal text remains. `thejudge-cleanup`
confirms the already-applied truth is present (it never re-writes it), then:

- writes the receipt under `PRD/instructions/receipts/hybrid-rule-retrieval-<date>.md`,
  folding `GRAPH-RUN.md`'s `## Node ledger` and `## Instruction ledger`
  verbatim into a `## Graph run` section
- flips the relevant `PRD/sections/system-map.md` entry/entries from `planned`
  to `shipped`
- removes the `hybrid-rule-retrieval` slug from `PRD/work/STATUS.md`
- deletes `PRD/work/hybrid-rule-retrieval/`

## Verification

```bash
npm --workspace apps/backend run typecheck
npm run test:scripts
npm --workspace apps/backend run test:eval
npm run lint
npm run format:check
npm run coverage:check
```

## Files touched

- `scripts/aws-deploy.sh`
- `scripts/aws-bootstrap.sh`
- `scripts/package-lambda.test.mjs` (new)
- `PRD/sections/functional-requirements.md`
- `PRD/sections/quick-lookup/README.md`
- `PRD/sections/integrations-and-data.md`
