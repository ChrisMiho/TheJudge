# Gameplan — lambda-s3-deploy

## What ships

Deploy-pipeline hardening on three independent fronts, per `DESIGN-BRIEF.md`.
Nothing changes in the app itself — every slice below touches deploy plumbing,
CI workflow config, or a data-build constant, never product code or the
`/api/ask-ai` contract.

1. **Slice A** — S3-staged Lambda deploy (axis 1, REQ-165, DEC-169, NFR-017).
   Raises the deploy ceiling from ~50 MB (direct `--zip-file` upload) to the
   250 MB unzipped quota (S3-staged upload).
2. **Slice B** — skip the production deploy on non-code merges (axis 2,
   REQ-166). Docs-only merges to `main` stop firing a pointless full deploy.
3. **Slice C** — remove the combo size restriction (axis 3, REQ-093,
   NFR-017), plus final PRD-backing housekeeping and ship gates.

## Why this order

Axes 1 and 3 are the same story from both ends: A raises the ceiling, C
spends it. B is an independent reliability/cost fix on the same workflow file
family. Sequencing A → B → C follows the design brief's own axis numbering
and keeps the "ceiling, then spend" narrative readable in the PR history; it
is not a technical dependency — no slice edits a file another slice edits.

## Architecture / data flow (touched only)

```
GitHub push to main
  -> .github/workflows/quality-check.yml
     static / backend / frontend / coverage-merge   (unconditional — Slice B keeps these unconditional)
     deploy job (needs: static, backend, coverage-merge)
       [Slice B] change-detection step: code-set paths touched? -> deploy : skip
                 (workflow_dispatch always deploys; undetectable diff fails safe to deploy)
       -> scripts/aws-deploy.sh
          -> scripts/package-lambda.sh   (unchanged — still builds dist/lambda.zip)
          [Slice A] aws s3 cp dist/lambda.zip s3://<app>-lambda-artifacts-<account>/lambda/lambda.zip
          [Slice A] aws lambda update-function-code --s3-bucket ... --s3-key ...   (no --zip-file)
          -> frontend build + s3 sync + CloudFront invalidation   (unchanged)

Pre-merge gate (npm run quality:check -> test:scripts):
  [Slice A] scripts/lambda-package-budget.test.mjs
            measures unzipped on-disk package footprint vs the 250 MB quota
            (replaces the base64/request-limit math that only described
            direct upload)

Data build (owner-run, network-gated, outside this graph run):
  [Slice C] scripts/build-commander-spellbook-combos.mjs
            MIN_VARIANT_POPULARITY 2 -> 0 (emergency valve, not standing trim)
            actual full-corpus commit requires an owner-run `npm run data:refresh`
            — see Slice C's residual-step note
```

## Slice table

| Slice | Title | Requirements | Dependencies | Status |
| --- | --- | --- | --- | --- |
| A | S3-staged Lambda deploy | REQ-165, DEC-169, NFR-017 | parallel-ready | planned |
| B | Skip prod deploy on non-code merges | REQ-166 | parallel-ready | planned |
| C | Remove combo size restriction + PRD backing | REQ-093, NFR-017 | parallel-ready | planned |

No slice edits a file another slice edits (A: `scripts/aws-deploy.sh`,
`scripts/aws-bootstrap.sh`, `scripts/lambda-package-budget.test.mjs`,
`docs/aws/deployment.md`; B: `.github/workflows/quality-check.yml`; C:
`scripts/build-commander-spellbook-combos.mjs`, `PRD/sections/system-map.md`).
All three are parallel-ready; `thejudge-implement-all` runs them sequentially
A → B → C in one shared worktree regardless, per the order above.

## A structural constraint this plan respects

`PRD/instructions/graph-workflow-contract.md`'s Boundaries list forbids a
graph run from running `npm run data:refresh` or any live Scryfall/Commander
Spellbook network refresh. REQ-093's full-corpus acceptance criterion
("the full reviewed `OK` corpus is committed with no popularity floor
applied") therefore cannot be fully satisfied by an autonomous build node in
this run: regenerating the actual committed
`commanderSpellbookCombos.json.gz` / `commanderSpellbookComboIndex.json.gz`
artifacts needs a live, human-approved refresh (DEC-162's explicit-approval
gate), which is both a network call and an owner action this graph run's own
boundary list excludes.

Slice C therefore ships the **code-level** floor change
(`MIN_VARIANT_POPULARITY = 0`, comment updated) and documents the residual
step as a manual, dated acceptance criterion rather than silently treating
the corpus as regenerated. The committed combo artifacts stay at their
current (trimmed) size until an owner runs `npm run data:refresh` locally and
commits the regenerated artifacts as a follow-up. This does not block Slice A
or B: the S3-staged deploy path and the guardrail rewrite both work correctly
regardless of which corpus size is currently committed — they are what makes
the eventual full-corpus commit deployable, not a data change in themselves.

## Verification checklist (whole package)

- [ ] `npm run test:scripts` passes (covers the rewritten guardrail test and
      the untouched `build-commander-spellbook-combos.test.mjs` suite)
- [ ] `bash -n scripts/aws-deploy.sh` and `bash -n scripts/aws-bootstrap.sh`
      both pass (no AWS credentials available in this environment for a real
      deploy dry-run; syntax + code review is the available proof here)
- [ ] `npm run format:check` passes for the edited workflow YAML
- [ ] `npm run quality:check` green for touched areas (Slice C's ship gates)
- [ ] Real deploy behavior (S3-staged upload succeeding against Lambda's
      actual 250 MB quota; the change-detection step's real skip/deploy
      verdict on a live push) is proven when this PR's branch reaches `main`
      and GitHub Actions runs the `deploy` job under the OIDC role — recorded
      as a manual, dated observation post-merge, not claimed here

## Non-goals (carried from DESIGN-BRIEF.md)

No second Lambda, no runtime memory change, no S3-side rollback history, no
`paths-ignore` at the workflow trigger, no combo build-logic change beyond the
floor, no IaC migration, no custom domain.
