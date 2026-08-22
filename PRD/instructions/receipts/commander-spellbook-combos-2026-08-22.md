# Receipt — commander-spellbook-combos

- Date: 2026-08-22
- Slug: `commander-spellbook-combos`
- Status: shipped

Commander Spellbook combo enrichment: a static, backend-only community combo
corpus keyed by Scryfall `oracle_id`, with deterministic intent/context gates
and no runtime upstream dependency. In-Depth Question receives automatic combo
context only for complete quantity-aware identity + compatible-zone matches;
narrow explicit combo questions may receive up to five labeled partial
candidates; Quick Question requires explicit combo intent plus an attached
card. No candidate is ever rendered as "complete".

## Merge proof

- Autonomous base: `origin/feature/enhancement-bangers` (recorded in the
  package README's `## Autonomous metadata`).
- Implementation PR: **#89** `[THEJUDGE-AUTO][READY] Commander Spellbook combo
  enrichment (commander-spellbook-combos)`, head
  `thejudge-auto/commander-spellbook-combos` → base
  `feature/enhancement-bangers`, **MERGED 2026-08-22T23:16:12Z** as squash
  commit `f70df79`. Confirmed through the GitHub API (`gh pr view 89`), which
  was reachable — no local-proof fallback was used.
- Cleanup ran from `feature/enhancement-bangers` at `f70df79`, the recorded
  base, per the merge-proof gate.
- `.worktrees/implement-commander-spellbook-combos`
  (`thejudge-impl/commander-spellbook-combos-20260811-1`, tip `893bef2`) had a
  clean working tree. Because PR #89 landed as a **squash**, that branch's 18
  commits are not literal ancestors of the base; content equivalence was
  verified instead — `git diff --name-only 893bef2 f70df79` returned only four
  files, none belonging to this package's implementation (`.gitignore`,
  `PRD/work/commander-spellbook-combos/RECONCILE-HANDOFF.md`, and two
  `PRD/work/graph-workflow/` docs, all arriving from unrelated base commits).
- No remote branch was deleted.

## Verification

- `npm run quality:check` — **green**, run on `feature/enhancement-bangers` at
  `f70df79` before any cleanup edit. 72/72 script tests pass, exit code 0.
- Slice acceptance criteria: A–F (original plan) and G–J (post-DEC-162
  re-map) all recorded `done`. J7's machine-readable
  `slice-j.criteria.json` still carried `"value": false` while the slice doc's
  checklist recorded J7 as `[x]` complete with its verdict; commit `893bef2`
  ("record J7 verdict") confirms the doc is correct and the JSON was simply
  never flipped. Recorded here rather than silently reconciled.
- No runtime-cleanup acceptance criteria applied: slices G–J contain no
  browser, port, or process-hygiene criteria — slice J's A/B is a Node script,
  not a driven app.
- Reviewed implementation and package files for secret-like patterns
  (`API_KEY`/`SECRET`/`TOKEN`/`PASSWORD`); none found. The answer-quality
  script reaches the provider only behind `--confirm-live-calls` and writes to
  gitignored `output/combo-answer-quality/`.
- Public contract unchanged: no `AskAiRequest`, Zod schema, response shape,
  route, endpoint, provider-selection, or frontend change.

## Owner-action checkpoints — both completed before ship

- **J6 — production corpus refresh (done 2026-08-22).** The live bulk-export
  download ran for the first time: 106,182 real reviewed variants, 27 MB
  gzipped raw input (~634 MB decompressed), 135 templates resolved and 32
  genuinely unresolved via Scryfall. The run surfaced two defects no
  smaller-scale test could reach — the decompressed document exceeds V8's
  ~536 MB maximum string length so `JSON.parse` over the whole document throws
  (fixed with `scripts/lib/stream-json-array.mjs` in both the refresh and the
  build), and a single Scryfall template-expansion query returning 404 used to
  abort the entire refresh (now left unresolved, like a template with no
  query).
- **J7 — live provider A/B (done 2026-08-22).** 6 scenarios, 12 provider
  calls, human-reviewed per DEC-161. **Verdict: enrichment helps.** Decisive
  wins on both combo-intent scenarios — on `lookup-attached-intent` the
  disabled leg refuses the question outright ("the rules do not formally
  define 'combo'") while the enriched leg answers it. The over-claiming check
  came out opposite to what the slice anticipated: on `unresolved-template`
  the *enriched* leg held the line while the *disabled* leg invented a
  speculative three-card combo from creatures absent from the board —
  enrichment made the model more conservative, not less. Control scenario
  `lookup-unrelated` produced no combo section on either leg. An earlier run
  the same day was discarded unreviewed because its scenario fixtures carried
  hand-authored oracle text misdescribing all five cards; production was never
  affected (the backend trusts the submitted payload, and the real app copies
  these fields from `cardMetadata.json`), and a guard test now keeps fixture
  cards matching `cardMetadata.json`.

## Corrections promoted to durable truth

The design brief recorded a measured outcome that contradicted figures already
promoted into `PRD/sections/`. Since the brief is deleted by this cleanup,
those corrections were folded into durable truth first:

- **Artifact size.** DEC-162, `functional-requirements.md`,
  `integrations-and-data.md`, `system-map.md`, and the `decisions.md` router
  all recorded the corpus as **11.3 MB** (9.6 MB detail + 1.7 MB index),
  extrapolated from a 6,000-variant sample. The real committed artifacts
  measure **76.9 MB detail + 4.8 MB index**. The cause is the storage format,
  not a defect: gzipping each variant individually — required so a lookup
  never decompresses more than the one record it asked for — forfeits the
  cross-record compression a single shared gzip stream gets almost free across
  ~106k records. **Owner decision 2026-08-22: commit as measured.** The
  memory-safety goal (bounded per-request fetch instead of ~868 MB resident)
  is what the format buys; the repository footprint is an accepted cost, not
  deferred work. The revisit lever, if repository size ever becomes a real
  problem, is batching several variants per gzip member — recorded in DEC-162.
- **Variant count.** `105,447`/`105,448` replaced with the measured 106,182 of
  the committed 2026-08-22 snapshot, noting that the export regenerates daily
  so the exact count drifts.
- **Streaming requirement.** The ~634 MB / V8 string-length constraint and the
  404-tolerant template expansion are now recorded in DEC-162,
  `functional-requirements.md`, and `system-map.md` — previously they existed
  only in the package's design brief.

## Files created

- `PRD/instructions/receipts/commander-spellbook-combos-2026-08-22.md`
- `scripts/refresh-commander-spellbook-data.mjs` (+ `.test.mjs`)
- `scripts/build-commander-spellbook-combos.mjs` (+ `.test.mjs`)
- `scripts/compare-combo-answer-quality.mjs` (+ `.test.mjs`)
- `scripts/lib/stream-json-array.mjs` (+ `.test.mjs`)
- `scripts/fixtures/combo-answer-quality-scenarios.json`
- `apps/backend/data/commanderSpellbookCombos.json.gz` (76.9 MB)
- `apps/backend/data/commanderSpellbookComboIndex.json.gz` (4.8 MB)
- `apps/backend/src/commanderSpellbook/catalog.ts` (+ test)
- `apps/backend/src/commanderSpellbook/intent.ts` (+ test)
- `apps/backend/src/commanderSpellbook/matcher.ts` (+ test)
- `apps/backend/src/commanderSpellbook/zones.ts` (+ test)
- `apps/backend/src/commanderSpellbook/formatting.ts` (+ test)
- `apps/backend/src/commanderSpellbook/__fixtures__/` — `README.md` plus
  `raw-real-excerpt/`, `raw-sample/`, `raw-malformed-page/`, and
  `raw-unrecognized-status/`, derived from real upstream bytes
- `apps/backend/src/prompt/comboPromptIntegration.test.ts`
- `apps/backend/src/runtime/createConfiguredApp.test.ts`
- `apps/backend/src/eval/fixtures/commander-spellbook-*` — eval catalog plus
  fixture/context-golden/prompt-golden triples for `complete-no-intent`,
  `degraded`, `lookup-attached-intent`, `lookup-unrelated`,
  `partial-explicit-intent`, `unresolved-template`, and `wrong-zone`

## Files updated

- `PRD/sections/decisions.md` (DEC-162 router summary — measured size and
  variant count corrected)
- `PRD/sections/decisions/combo-retrieval.md` (DEC-116, DEC-161, DEC-162;
  DEC-162's measured size, variant count, format rationale, owner decision,
  revisit lever, and the two real-refresh discoveries)
- `PRD/sections/functional-requirements.md` (REQ-093 artifact size, variant
  count, streaming requirement; REQ-094, REQ-095, REQ-146 confirmed)
- `PRD/sections/integrations-and-data.md` (Commander Spellbook data strategy:
  dropped `planned`, corrected size, recorded the byte-offset lazy-read
  contract)
- `PRD/sections/system-map.md` (both Commander Spellbook entries flipped
  `planned` → `shipped`, `(planned)` dropped from their `Lives in` paths,
  DEC-162 added to both `Backed by` lines, size and streaming facts corrected)
- `PRD/sections/user-flows.md` (FLOW-015 confirmed, not re-edited)
- `PRD/work/STATUS.md` (slug removed from every section)
- `apps/backend/src/prompt/preparation.ts`, `promptAssembly.ts`,
  `promptDiagnostics.ts`
- `apps/backend/src/runtime/createConfiguredApp.ts`,
  `apps/backend/src/app/createApp.ts`, `apps/backend/src/routes/askAi.ts`
- `apps/backend/src/config/index.ts` (+ test) — `COMBO_ENRICHMENT_ENABLED`
- `apps/backend/src/logging.ts`
- `apps/backend/src/eval/contextEvaluationHarness.ts` (+ test),
  `apps/backend/src/eval/fixtures/README.md`, `checklist-report.golden.txt`
- `apps/backend/src/providers/createAskAiProvider.test.ts`
- `scripts/refresh-scryfall-data.mjs` (combo download joins the `data:refresh`
  chain), `package.json`
- `.gitignore`

No `DEC`/`REQ` `Status:` field was edited to convey shipped-vs-planned; that
signal lives only in `system-map.md`.

## Files deleted

- `PRD/work/commander-spellbook-combos/` — `IDEA.md`, `DESIGN-BRIEF.md`,
  `GAMEPLAN.md`, `README.md`, `RECONCILE-HANDOFF.md`, `STATUS.ship-ready`,
  slice docs A–J, and the `slice-{g,h,i,j}.criteria.json` files, removed with
  `git rm -r` after this receipt was written.

The deleted `RECONCILE-HANDOFF.md` (written 2026-08-14) described this package
existing in four divergent branch versions. That divergence is resolved: PR #89
merged, `feature/enhancement-bangers` carries the only surviving version, and
`main`'s superseded A–E plan is overwritten by this branch. No rescue branch
content remains unaccounted for.

## Follow-ups carried forward

- The owner flagged revisiting combo enrichment guidance through
  `thejudge-refinement`: the A/B surfaced prompt-shaping questions worth
  sharpening. None blocked this package's ship.

No `## Graph run` section: this package predates `graph-run` and holds no
`GRAPH-RUN.md`. No `## Intake` section: it holds no `intake/` folder.
