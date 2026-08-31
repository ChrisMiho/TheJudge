status: ship-ready

# prompt-context-refinement

Fresh gameplan for the rules-question prompt/context pipeline, driven by the
owner's five current observations in `IDEA.md` and `intake/`. Prior
`promptRefinement*.md` docs are cited background only, not authority.

See `IDEA.md` for the problem, the five observations, and prior-run receipts.

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/prompt-context-refinement-v2

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/prompt-context-refinement/DESIGN-BRIEF.md`
- Findings: none. Run-two history: the owner's gate edits (REQ-167 cap 5 +
  partial-combo explanation; REQ-168 phrase glossary) were applied by
  gate-review; the first re-grade FAILed because the lookup partial-combo
  behavior was under-specified; define loop 2 specified it (grounded in
  REQ-094's combo machinery and REQ-095's present/missing rendering, no new
  stable ID); the second re-grade PASSed. Design is agent-ready for map-out.

## Slices

See `GAMEPLAN.md` for architecture and dependencies.

| Slice | Scope | REQ/FLOW | Depends on | Status |
| --- | --- | --- | --- | --- |
| [A](./slice-a-multi-card-backend.md) | Multi-card lookup — backend contract, prompt assembly, retrieval, combo matching | REQ-167 (backend), REQ-094 (amended), REQ-095 (verified) | none | done |
| [B](./slice-b-multi-card-frontend.md) | Multi-card lookup — pre-submit UI, follow-up wiring, screen-layout re-measurement | REQ-167 (UI), FLOW-023 | A | done |
| [C](./slice-c-guardrail-phrasing.md) | Guardrail wording + phrasing glossary | REQ-168 | none (sequence after A to avoid a same-file merge) | done |
| [D](./slice-d-prompt-layout-spec.md) | Readable prompt-layout spec doc | REQ-169 | A, C | done |
| [E](./slice-e-worked-solutions-eval.md) | Worked-solutions evaluation set | NFR-018 | none | done |

Implementation order for a single sequential agent: A, B, C, D, E. All five
slices are `done` (2026-08-30) on `thejudge-auto/prompt-context-refinement-v2-work`.
`npm run quality:check` is green. Package is `ship-ready`, pending PR merge and
`thejudge-cleanup`.

## Implementation map

- Multi-card lookup: `apps/backend/src/validation/askAiRequest.ts`,
  `apps/backend/src/types/index.ts`, `apps/backend/src/prompt/{context,preparation}.ts`,
  `apps/backend/src/commanderSpellbook/{matcher,formatting}.ts` (slice A);
  `apps/frontend/src/components/portal/quick-lookup/QuickLookupApp.tsx`,
  `apps/frontend/src/lib/contextFlow/flow.ts`,
  `apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts`,
  `PRD/sections/screen-layout.md`, `PRD/sections/quick-lookup/README.md`
  (slice B)
- Guardrail wording: `apps/backend/src/prompt/promptAssembly.ts`,
  `PRD/sections/system-map/lookup-phrasing-glossary.md` (slice C)
- Prompt-layout spec: `PRD/sections/system-map/prompt-layout-spec.md`,
  cross-linked from `system-map/prompt-assembly.md`,
  `quick-lookup/README.md`, `in-depth/README.md` (slice D)
- Worked-solutions eval: `apps/backend/src/eval/` (slice E)
