# Slice B — Skip the production deploy on non-code merges

## Status: done

## Goal

Gate the `deploy` job in `.github/workflows/quality-check.yml` with a
change-detection step so a merge to `main` that touches only non-code paths
(docs, `PRD/**`, `.claude/**`, …) stops firing a full frontend + Lambda
deploy, while quality-check jobs keep running on every merge.

## Requirements

1. Add a change-detection step (or job) that inspects the changed paths on
   the triggering push and evaluates them against the **code set**:
   `apps/**`, `scripts/**`, `.github/workflows/**`, `package.json`,
   `package-lock.json`, `tsconfig*.json`. (REQ-166)
2. The `deploy` job runs only when that step reports at least one changed
   path in the code set, or the trigger is `workflow_dispatch`. A push whose
   changed paths are entirely outside the code set skips `deploy`. (REQ-166)
3. `static`, `backend`, `frontend`, and `coverage-merge` keep their existing
   `push`-to-`main` trigger conditions unchanged, so `main` keeps a green CI
   signal on a docs-only merge. No `paths`/`paths-ignore` is added at the
   workflow `on:` block — that would drop those jobs too, not just `deploy`.
   (REQ-166)
4. Add a `workflow_dispatch:` trigger to the workflow so a full deploy can be
   forced from the Actions tab with no code change. (REQ-166)
5. The change-detection step logs the changed paths it evaluated and its
   deploy/skip verdict, so a skip is visible in the run log rather than
   silent. (REQ-166)
6. When the changed-file set cannot be determined (first push to the
   workflow, an all-zeros base SHA, or any other case where a base
   comparison is unavailable), the verdict is **deploy**, not skip — the
   fail-safe favors deploying. (REQ-166)
7. Deploy stays push-to-`main`-only plus the new manual dispatch;
   pull-request events never deploy, so DEC-084's OIDC credential scoping is
   unchanged.

## Acceptance criteria

- [ ] B1 — `.github/workflows/quality-check.yml` has a `workflow_dispatch:`
      trigger in addition to the existing `push`/`pull_request` triggers.
- [ ] B2 — the `deploy` job's precondition additionally requires the
      change-detection step's code-set verdict (or `workflow_dispatch`); a
      push whose changed paths are all outside the code set does not run
      `deploy`.
- [ ] B3 — `static`, `backend`, `frontend`, and `coverage-merge` keep their
      current trigger conditions; no `paths`/`paths-ignore` key is added at
      the workflow's top-level `on:` block.
- [ ] B4 — the change-detection step's logic defaults to "deploy" when the
      changed-file set can't be determined (first push / all-zeros base SHA).
- [ ] B5 — the change-detection step writes the paths it evaluated and its
      deploy/skip decision to the job log (e.g. via `echo`/`$GITHUB_STEP_SUMMARY`
      or an explicit log line), not just a silent job-level `if:`.
- [ ] B6 — `npm run format:check` passes (the edited workflow YAML parses and
      is formatted).
- [ ] B7 — a dated manual observation records a line-by-line read of the
      final `deploy:` job block confirming: the code-set path list matches
      REQ-166 exactly, the `if:` condition composes the change-detection
      output with the existing `needs:`/branch/event guards without loosening
      them, and no path in the code set was dropped from the denylist logic
      (this workflow change cannot be exercised by a real push from this
      sandbox).

## Manual observation (B7)

2026-08-29 B7 — line-by-line read of the final `deploy:` job block in
`.github/workflows/quality-check.yml`, confirmed:

- Code-set path list: `apps/`, `scripts/`, `.github/workflows/`,
  `package.json`, `package-lock.json`, `tsconfig*.json` — matches REQ-166's
  list exactly (`code_pattern` regex in the `changes` job's "Detect code
  changes" step).
- `deploy:`'s `if:` composes
  `needs.changes.outputs.deploy == 'true' && ((github.event_name == 'push' &&
  github.ref == 'refs/heads/main') || github.event_name == 'workflow_dispatch')`
  — the original `push`-to-`main` guard is still present unchanged (now one
  branch of an `||` with `workflow_dispatch`), `needs:` still lists
  `static`, `backend`, `coverage-merge` unchanged (plus the new `changes`
  job), and nothing was loosened — the new clause only adds a further
  requirement (the change-detection verdict) or an explicit manual-override
  path, it never drops the branch/event guard.
- No code-set path was dropped from the `changes` job's regex: `apps/**` and
  `scripts/**` are directory prefixes so nested files match, `.github/workflows/**`
  likewise, and the three literal filenames (`package.json`,
  `package-lock.json`, `tsconfig*.json`) are anchored with `$`/`.*` so they
  match at any depth git reports them (relative to repo root, which is where
  `package.json` and `package-lock.json` live; `tsconfig*.json` matches both
  the root config and any `apps/*/tsconfig.json`, the latter already covered
  twice over by the `apps/` prefix).

This workflow change cannot be exercised by a real push from this sandbox
(no live GitHub Actions run available here). Real skip/deploy verdicts on a
live push are proven when this branch reaches `main`.

## Verification

```bash
npm run format:check
```

## Files touched

- `.github/workflows/quality-check.yml`
