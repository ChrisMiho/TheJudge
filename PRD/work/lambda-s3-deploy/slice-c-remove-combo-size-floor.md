# Slice C — Remove the combo size restriction

## Status: planned

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

## Verification

```bash
npm run test:scripts
npm run quality:check
```

## Files touched

- `scripts/build-commander-spellbook-combos.mjs`
- `PRD/sections/system-map.md`

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/<slug>/` ready to delete
