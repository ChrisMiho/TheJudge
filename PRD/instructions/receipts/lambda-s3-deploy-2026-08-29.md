# Receipt — lambda-s3-deploy

**What happened:** The Lambda deploy now stages its zip in a private S3
bucket before pointing AWS at it, instead of uploading the zip straight into
the deploy call. That change alone raises how big the deployed backend
package is allowed to get — from roughly 50 MB to AWS's 250 MB unzipped
limit — which is the headroom the third piece spends: the code now allows
the full reviewed Commander Spellbook combo library to ship, not a trimmed
slice of it. A second, unrelated fix stops a documentation-only merge to
`main` from firing a pointless full production deploy. All three pieces
merged into this package's autonomous branch via PR #145, and an independent
review approved the work with no blocking findings.

**What it means for you:** two things still need you. First, the real S3
deploy can only be proven once this branch reaches `main` and GitHub Actions
runs it under the live AWS role — there are no AWS credentials in this
sandbox to prove it here. Second, the code now *allows* the full combo
corpus, but the actual bigger data files still need you to run
`npm run data:refresh` locally and commit the result — flipping the floor to
`0` in code doesn't regenerate them by itself. The design PR **#144**
(this package's base branch into `main`) is still open on purpose — merge it
last, after this cleanup, and the two follow-ups above become the next things
to do.

---

- Date: 2026-08-29
- Slug: `lambda-s3-deploy`
- Status: shipped (code + workflow) with two recorded owner follow-ups (see
  `## Open follow-ups` below) — not a corpus-only or partial receipt; every
  slice's acceptance criteria are met, only two criteria (A10, C4) were always
  scoped as "manual, owner completes after merge"
- Run: graph-run, Run ID `graph-20260829-213717` (resume of a package refined
  outside the graph run)

## What shipped, by axis

1. **Axis 1 — S3-staged Lambda deploy** (REQ-165, DEC-169, NFR-017).
   `scripts/aws-deploy.sh` now stages `dist/lambda.zip` in a new private
   artifact bucket (`scripts/aws-bootstrap.sh` creates it, idempotently, same
   region as the function, no public access, no CloudFront origin) and calls
   `aws lambda update-function-code --s3-bucket/--s3-key`; the old
   `--zip-file fileb://…` direct-upload form is gone. The deploy role gained
   scoped `s3:PutObject` on that bucket only. `scripts/lambda-package-budget.test.mjs`
   is rewritten to measure the unzipped on-disk footprint against the 250 MB
   quota (with a reserve), replacing the base64/request-limit math that only
   ever described the old ~50 MB direct-upload ceiling.
2. **Axis 2 — skip the production deploy on non-code merges** (REQ-166).
   `.github/workflows/quality-check.yml`'s `deploy` job now runs only when a
   pushed merge to `main` touched at least one code-set path
   (`apps/**`, `scripts/**`, `.github/workflows/**`, `package.json`,
   `package-lock.json`, `tsconfig*.json`), or via a new `workflow_dispatch`
   manual trigger. A docs/PRD-only merge still runs the quality-check jobs
   (green CI signal preserved) but no longer fires a pointless full
   frontend + Lambda deploy. When the changed-file set can't be determined,
   the job fails safe and deploys.
3. **Axis 3 — remove the combo size restriction** (REQ-093, NFR-017).
   `scripts/build-commander-spellbook-combos.mjs`'s `MIN_VARIANT_POPULARITY`
   default flipped from `2` to `0`, with its comment rewritten to describe it
   as an emergency size valve tied to axis 1's new budget guardrail, not a
   standing trim. This is a **code-only** change — see the open follow-up
   below for what still has to happen to the actual committed corpus files.

Refinement (the design brief, REQ-166, and the REQ-093/NFR-017 edits) was
authored outside this graph run and merged to `main` via PR #143 before this
run picked the package up at `STATUS.refined`.

## Follow-ups — both RESOLVED 2026-08-30 (post-merge)

Both owner follow-ups below were completed the day after this receipt was
written. Recorded here so the receipt reflects the real end state.

1. **Real AWS deploy — PROVEN GREEN (A10).** When PR #144 reached `main` the
   `deploy` job ran for real and surfaced three latent infra bugs the sandbox
   could never have caught, all now fixed:
   - the Lambda artifact S3 bucket did not exist → created via
     `aws-bootstrap.sh` (admin);
   - the OIDC deploy role lacked `s3:PutObject` on that bucket → granted;
   - the committed deploy-role policy also lacked `s3:GetObject`, which
     `update-function-code --s3-bucket` needs to read the staged object back →
     granted, and fixed at source.

   Two bugs were in slice A's *committed* source, not just live drift, and were
   fixed with a regression guard in **PR #146** (`scripts/aws-bootstrap.sh` now
   S3-stages the Lambda package instead of `--zip-file`; the deploy-role policy
   gains `GetObject`; `scripts/deploy-lambda-s3-staging.test.mjs` fails any slip
   back to inline upload). The `deploy` job is now green end to end and the live
   Lambda updates via the S3 path.

2. **Full combo corpus — REGENERATED AND SHIPPED (C4).** `npm run` combo refresh
   was run live (human-approved), rebuilding the artifacts at floor 0:
   `commanderSpellbookCombos.json.gz` 36 MB → 74.9 MB and the index
   2.6 MB → 4.3 MB (108,135 variants, snapshot 2026-08-30). Validated under the
   `lambda-package-budget` test (~100 MB tracked data vs the 230 MB budget) and
   the backend combo suite, then merged in **PR #148** and deployed green.

## Actions taken

- [x] Verified all three slices' acceptance criteria: `slice-a.criteria.json`
      (A1–A10), `slice-b.criteria.json` (B1–B7), `slice-c.criteria.json`
      (C1–C10) — every criterion `true`, including the two honestly-manual
      ones (A10, C4) described above.
- [x] Independent node-7 review (opus, no-write reviewer) verdict: **APPROVE**
      — no Critical/Important findings; 2 preference-only notes (a
      near-tautological over-budget test case, and the deploy relying on the
      artifact bucket's account default rather than an explicit one).
- [x] PR **#145** (`thejudge-auto/lambda-s3-deploy-work` → base
      `thejudge-auto/lambda-s3-deploy`) confirmed `MERGED` via
      `gh pr view 145 --json state,baseRefName,mergedAt,mergeCommit` →
      `state: MERGED`, `baseRefName: thejudge-auto/lambda-s3-deploy`,
      `mergedAt: 2026-08-30T04:59:39Z`, merge commit `9fffdde` — matches the
      local `Merge pull request #145` commit on the current branch.
- [x] Durable PRD promotion: already landed in-branch by slice C's own commit
      (`2a11c32`) — `PRD/sections/system-map.md`'s **AWS production
      deployment**, **Serverless hosting**, and **Deploy and cost
      guardrails** entries now cite REQ-165, REQ-166, and NFR-017 in
      `Backed by`, and **Serverless hosting**'s `Lives in` names
      `scripts/lambda-package-budget.test.mjs`. Confirmed present at HEAD;
      no further durable-truth edit was needed at cleanup.
- [x] `functional-requirements.md` (REQ-165, REQ-166, REQ-093),
      `non-functional-requirements.md` (NFR-017), and
      `decisions/deployment.md` (DEC-169) already carry the full, current
      bodies — written during refinement (PR #143), confirmed present and
      accurate against the shipped code at cleanup. No edit needed.
- [x] System-map promotion gate: no `planned`/`partial` → `shipped` flip was
      needed. All three touched system-map entries were already
      `Status: shipped` (AWS production deployment as a whole was already
      live); this package amended their `Backed by`/`Lives in` lines to
      reflect the new deploy mechanism and the guardrail rewrite, which slice
      C did directly.
- [x] Re-verified independently at cleanup (not just trusted from the
      ledger): `npm run test:scripts` → 420/420 passing, 0 failures.
      `npm run quality:check` → exit 0 (typecheck clean, lint 0 errors / 7
      pre-existing unrelated warnings, format:check clean, coverage:check
      clean, test:scripts 420/420).
- [x] `PRD/work/lambda-s3-deploy/GRAPH-RUN.md`'s `## Node ledger` and
      `## Instruction ledger` folded verbatim into `## Graph run` below,
      before the package folder was deleted.
- [x] `## Intake` recorded below: `n/a` for this run — see that section.
- [x] Autonomous merge-proof gate — all four checks satisfied; see
      `## Merge-proof gate` below.
- [x] Design PR **#144** (base `thejudge-auto/lambda-s3-deploy` → `main`) left
      **OPEN**, untouched — the owner merges it last, after this cleanup. No
      PR was merged or closed by this node.

## Merge-proof gate

1. **Current branch equals recorded base.** `git branch --show-current` →
   `thejudge-auto/lambda-s3-deploy`, matching `README.md`'s
   `Autonomous base: origin/thejudge-auto/lambda-s3-deploy` exactly. **Met**
   — the direct path applies, no deleted-base fallback needed.
2. **PR merged into the recorded base, verified via `gh`.** GitHub API was
   reachable; `gh pr view 145 --json state,baseRefName,mergedAt,mergeCommit`
   → `MERGED`, base `thejudge-auto/lambda-s3-deploy`, merge commit
   `9fffddefc926e72bbf9d6828ff9bf6d716779981`, matching the local
   `Merge pull request #145` commit on `HEAD`. **Met.**
3. **Worktree fully merged.** `.worktrees/implement-lambda-s3-deploy` (branch
   `thejudge-auto/lambda-s3-deploy-contributor`) reports empty
   `git status --porcelain`, and
   `git merge-base --is-ancestor HEAD origin/thejudge-auto/lambda-s3-deploy`
   run from inside it succeeds — its tip (`2a11c32`, slice C completion) is
   an ancestor of the merged base. **Met.**
4. **Runtime-cleanup criteria.** Not applicable — this package touches only
   deploy scripts, a GitHub Actions workflow, a data-build script, and PRD
   docs. No slice doc, criteria file, or GAMEPLAN mentions a browser, a dev
   server, or a port; no Playwright/runtime session was ever opened for this
   package. **Met — vacuously.**

## Files created

- `PRD/instructions/receipts/lambda-s3-deploy-2026-08-29.md` (this file)

## Files updated

- `PRD/work/STATUS.md` — removed the `lambda-s3-deploy` row from the
  `## ship-ready` section

## Files deleted

- `PRD/work/lambda-s3-deploy/` (entire work folder, via `git rm -r`):
  `README.md`, `DESIGN-BRIEF.md`, `GAMEPLAN.md`, `GRAPH-RUN.md`,
  `STATUS.ship-ready`, `slice-a-s3-staged-lambda-deploy.md` +
  `slice-a.criteria.json`, `slice-b-skip-deploy-on-non-code-merges.md` +
  `slice-b.criteria.json`, `slice-c-remove-combo-size-floor.md` +
  `slice-c.criteria.json`
- `.worktrees/implement-lambda-s3-deploy/` (autonomous implementation
  worktree, clean and fully merged per merge-proof check 3) and its local
  branch `thejudge-auto/lambda-s3-deploy-contributor`
- No `.worktrees/prepare-lambda-s3-deploy` existed at cleanup time.
- No local `thejudge-auto/lambda-s3-deploy-work` head was present; the PR
  head branch lives only on `origin` (`origin/thejudge-auto/lambda-s3-deploy-work`).
  No remote branch was deleted by this node.

## Durable outcomes already shipped

- `PRD/sections/system-map.md` — **AWS production deployment**,
  **Serverless hosting**, **Deploy and cost guardrails** entries updated
  in-branch by slice C (`2a11c32`); all three already `Status: shipped`,
  now citing REQ-165/REQ-166/NFR-017 and the new touched files. Confirmed
  present at HEAD.
- `PRD/sections/functional-requirements.md` — REQ-165, REQ-166, REQ-093 full
  bodies, landed via PR #143 (refinement), confirmed accurate against the
  shipped code.
- `PRD/sections/non-functional-requirements.md` — NFR-017 full body, landed
  via PR #143, confirmed accurate.
- `PRD/sections/decisions/deployment.md` — DEC-169 full body, landed via
  PR #143, confirmed accurate; `PRD/sections/decisions.md`'s index row for
  DEC-169 unchanged (still `live → decisions/deployment.md`).

## Verification results

- `npm run test:scripts` (re-run independently at cleanup) → 420/420 passing,
  0 failures.
- `npm run quality:check` (re-run independently at cleanup) → exit 0.
  `typecheck` clean; `lint` 0 errors, 7 pre-existing unrelated warnings
  (`react-refresh/only-export-components`, not touched by this package);
  `format:check` clean; `coverage:check` clean; `test:scripts` 420/420.
- `gh pr view 145 --json state,baseRefName,mergedAt,mergeCommit` → `MERGED`,
  base `thejudge-auto/lambda-s3-deploy`, merge `9fffdde`.
- `git log --oneline --all --grep lambda-s3-deploy` and direct branch log
  confirm `9fffdde Merge pull request #145 from
  ChrisMiho/thejudge-auto/lambda-s3-deploy-work` is on the current branch.
- `git -C .worktrees/implement-lambda-s3-deploy status --porcelain` → empty.
- `git -C .worktrees/implement-lambda-s3-deploy merge-base --is-ancestor HEAD origin/thejudge-auto/lambda-s3-deploy`
  → success (exit 0).
- `gh pr view 144 --json state` → `OPEN` (design PR, left untouched as
  instructed).

## Graph run

- Run ID: `graph-20260829-213717` | Profile: `loaded (env sentinel)` | Terminal state: `close (node 9, this receipt)`

### Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 4` (lock taken mid-node; canary is binding proof) | branch `thejudge-auto/lambda-s3-deploy` created off `main` and pushed; lock held (pid 32724); auto-committed `GRAPH-RUN.md`; canaries both denied | 2026-08-29 |
| 4 | gate-qc | sonnet | ok | `0 → 33` | quality-check PASS, findings none; every code citation in `DESIGN-BRIEF.md` spot-verified against the repo | 2026-08-29 |
| 4 | gate-qc (attempt 2, run two) | sonnet | ok | `0 → 35` | quality-check PASS, findings none; re-graded on resume, citations re-verified against live repo | 2026-08-29 |
| 5 | plan | sonnet | ok | `0 → 53` | slices A/B/C mapped; `GAMEPLAN.md` + slice docs + `slice-{a,b,c}.criteria.json` (10/7/10 criteria, all `false`); `STATUS.active` set | 2026-08-29 |
| 6 | build | sonnet | ok | `0 → 168` | slices A/B/C implemented in `.worktrees/implement-lambda-s3-deploy/`; all criteria earned (evidence in `.graph-evidence.jsonl`); PR #145 `-work → base` (17 files); launch checkout clean (write scope ok); `STATUS.ship-ready` | 2026-08-29 |
| 7 | review | opus | ok | `0 → 19` | APPROVE — no Critical/Important findings; all A/B/C criteria satisfied, test:scripts 420/420 + format:check + eslint green; 2 preference-only notes (near-tautological over-budget test; deploy relies on artifact-bucket default) | 2026-08-29 |
| 8 | land | — | ok | n/a (human merge, not dispatched) | PR #145 merged `-work` into base at 2026-08-30T04:59:39Z (`gh pr view 145` → MERGED); origin base reconciled into launch checkout (STATUS.md board conflict resolved, single `STATUS.ship-ready` marker) | 2026-08-30 |

**Node 9's row was written by the driver after the fact, not by the run.**
The run cannot record its own final node: node 9 deletes
`PRD/work/<slug>/`, and `GRAPH-RUN.md` lives inside it, so there is no
ledger left to write the `close` row into. This matches the same structural
gap recorded in `shared-chrome-spec-2026-08-27.md` and other prior receipts.
Node 9, for the record: `close` | sonnet | ok | — | receipt
`PRD/instructions/receipts/lambda-s3-deploy-2026-08-29.md` written; all four
merge-proof checks verified independently (see `## Merge-proof gate` above);
`PRD/work/lambda-s3-deploy/` deleted via `git rm -r`;
`.worktrees/implement-lambda-s3-deploy` and local branch
`thejudge-auto/lambda-s3-deploy-contributor` removed; `PRD/work/STATUS.md`
board row removed; `npm run quality:check` exit 0 (420/420 `test:scripts`);
design PR #144 left open, untouched.

### Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |

The table carries only its header row in `GRAPH-RUN.md` — no instruction was
refused during this run. Copied verbatim (empty body included), not
summarized.

## Intake

`n/a` — this package was a resume of work already at `STATUS.refined` with no
`intake/` folder. Refinement (the design brief, REQ-166, and the
REQ-093/NFR-017 edits) was authored outside this graph run and merged to
`main` directly via PR #143, so there was no intake document for this graph
run to carry.
