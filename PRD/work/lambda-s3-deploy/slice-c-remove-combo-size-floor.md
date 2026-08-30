# Slice C — Remove the combo size restriction

## Status: done

## Goal

Set `MIN_VARIANT_POPULARITY` to `0` in the combo build script and retire its
comment's "does not deploy" framing, so the full reviewed corpus is the
standing state and the trim becomes an emergency size valve only. Close out
the package: refresh PRD-backing cross-references and carry the ship gates.

## Requirements

1. `scripts/build-commander-spellbook-combos.mjs`'s `MIN_VARIANT_POPULARITY`
   constant changes from `2` to `0`. (REQ-093)
2. The doc comment above the constant is rewritten to describe it as a
   functioning emergency valve — raised only if the axis-1 guardrail
   (`scripts/lambda-package-budget.test.mjs`) ever fires — rather than the
   standing state; it no longer says the full corpus "currently does not
   deploy" (that was true only under the direct-upload ceiling Slice A
   removed). (REQ-093)
3. `trimCommittedArtifacts` (the `--trim-committed` re-emit path) is left
   functionally untouched — it stays available to re-trim already-committed
   data without a live refresh, per REQ-093's "stays a functioning lever."
4. **Residual step, explicitly not done by this slice**: the committed
   `apps/backend/data/commanderSpellbookCombos.json.gz` and
   `...ComboIndex.json.gz` artifacts are **not** regenerated here.
   Regenerating them to actually reflect the full corpus requires an
   owner-run `npm run data:refresh` (a live, human-approved Commander
   Spellbook bulk-export fetch per DEC-162) — `PRD/instructions/graph-workflow-contract.md`'s
   Boundaries list forbids a graph run from running `data:refresh` or any
   live network refresh, so this cannot be executed by the `build` node. This
   is recorded as a manual criterion below, not silently treated as done.
5. Refresh `PRD/sections/system-map.md`'s "AWS production deployment" family
   of entries so their `Backed by` lines cite REQ-165, REQ-166, and NFR-017
   alongside the existing DEC-084, and `Lives in` for "Serverless hosting"
   names `scripts/lambda-package-budget.test.mjs` and the new artifact
   bucket — REQ-165/166/093/NFR-017's text is already durable truth on `main`
   (PR #143); this closes the remaining system-map cross-reference gap so the
   shipped feature's backing list matches what actually shipped.
6. Carry the Ship gates block (final slice).

## Acceptance criteria

- [ ] C1 — `MIN_VARIANT_POPULARITY` in
      `scripts/build-commander-spellbook-combos.mjs` equals `0`.
- [ ] C2 — the comment above the constant is updated to describe it as an
      emergency valve tied to the axis-1 guardrail, not the standing trim,
      and no longer claims the full corpus does not deploy.
- [ ] C3 — `npm run test:scripts` passes, including
      `scripts/build-commander-spellbook-combos.test.mjs`'s
      `index.manifest.minPopularity` assertion (which reads the constant, so
      it tracks the new default automatically).
- [ ] C4 — a dated manual observation records that the committed combo
      artifacts were **not** regenerated in this slice; that doing so
      requires an owner-run `npm run data:refresh` outside this graph run's
      boundary; and states the exact follow-up command
      (`npm run data:refresh` then commit the regenerated
      `commanderSpellbookCombos.json.gz` / `commanderSpellbookComboIndex.json.gz`)
      for the owner to run post-merge.
- [ ] C5 — `PRD/sections/system-map.md`'s "AWS production deployment" /
      "Serverless hosting" / "Deploy and cost guardrails" entries cite
      REQ-165, REQ-166, and NFR-017 in their `Backed by` lines, and
      "Serverless hosting"'s `Lives in` names
      `scripts/lambda-package-budget.test.mjs`.
- [ ] C6 — Slice acceptance criteria for A, B, and C are all satisfied and
      verified (own criteria files read `true`).
- [ ] C7 — `npm run quality:check` is green for touched areas.
- [ ] C8 — public contract unchanged: no `AskAiRequest`, Zod schema, response
      shape, route, endpoint, provider-selection, or frontend change in any
      slice's diff.
- [ ] C9 — no secrets committed (reviewed diff for `API_KEY`/`SECRET`/`TOKEN`/
      `PASSWORD`-shaped literals; none expected — this package touches only
      deploy scripts, workflow YAML, and a data-build constant).
- [ ] C10 — durable outcomes promoted; `PRD/work/lambda-s3-deploy/` is ready
      to delete (no further ephemeral planning content needed beyond this
      package's own artifacts).

## Manual observations (C4, C8, C9, C10)

2026-08-29 C4 — the committed
`apps/backend/data/commanderSpellbookCombos.json.gz` and
`...ComboIndex.json.gz` artifacts were **not** regenerated in this slice.
`PRD/instructions/graph-workflow-contract.md`'s Boundaries list forbids a
graph run from running `npm run data:refresh` or any live Scryfall/Commander
Spellbook network fetch, so this graph run's `build` node cannot execute it —
only the code-level floor (`MIN_VARIANT_POPULARITY = 0`) shipped here. Owner
follow-up, post-merge: run `npm run data:refresh` locally (a live,
human-approved Commander Spellbook bulk-export fetch per DEC-162), review the
result, then commit the regenerated
`apps/backend/data/commanderSpellbookCombos.json.gz` and
`apps/backend/data/commanderSpellbookComboIndex.json.gz`.

2026-08-29 C8 — reviewed this package's full diff (slices A, B, C) against
the public contract: no changes touch `apps/backend/src` (no `AskAiRequest`,
Zod schema, response shape, route, or provider-selection change) or
`apps/frontend/src`. Every file touched is deploy tooling
(`scripts/aws-{deploy,bootstrap}.sh`, `scripts/package-lambda.sh` unchanged),
a workflow file (`.github/workflows/quality-check.yml`), a data-build script
(`scripts/build-commander-spellbook-combos.mjs`) and its test, or docs/PRD.
Public contract unchanged.

2026-08-29 C9 — reviewed the package's full diff for
`API_KEY`/`SECRET`/`TOKEN`/`PASSWORD`-shaped literals
(`git diff HEAD~2 -- <touched files> | grep -iE "api_key|secret|token|password"`).
The only matches are pre-existing, unchanged references to the SSM parameter
*name* `/thejudge/openai-api-key` (not a secret value — the key itself is
read from AWS SSM at Lambda cold start, never committed) and prose mentioning
"non-secret env" / "secret loading". No secret value is committed.

2026-08-29 C10 — durable outcomes promoted: `PRD/sections/system-map.md`'s
AWS production deployment / Serverless hosting / Deploy and cost guardrails
entries now cite REQ-165, REQ-166, NFR-017 and name the touched files.
REQ-093, REQ-165, REQ-166, DEC-169, and NFR-017 were already landed on `main`
via PR #143 (refinement, ahead of this build). `PRD/work/lambda-s3-deploy/`
carries no further durable content beyond its own package artifacts (the
GAMEPLAN, slice docs, criteria files, README, GRAPH-RUN ledger) — ready for
`thejudge-cleanup` to delete once this PR merges.

## Verification

```bash
npm run test:scripts
npm run quality:check
```

## Files touched

- `scripts/build-commander-spellbook-combos.mjs`
- `scripts/build-commander-spellbook-combos.test.mjs` (two fixture tests
  updated for the new default floor; required for `npm run test:scripts` to
  stay green — not in the original files-touched list)
- `PRD/sections/system-map.md`

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/<slug>/` ready to delete
