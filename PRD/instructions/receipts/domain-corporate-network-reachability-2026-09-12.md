# domain-corporate-network-reachability — 2026-09-12

**What happened:** `mtgjudge.gg` now tells a browser, and the security
appliances corporate networks run in front of one, that it is a finished,
well-run site — not a brand-new, unconfigured one. The CloudFront
distribution attaches the standard security headers (HSTS, no-sniff,
same-origin framing, a referrer policy, and a camera-preserving permissions
policy), and `robots.txt` / `security.txt` now serve as real files instead
of the app shell. The owner also gets a runbook that separates what the repo
can ship, what only the owner can do by hand (look up the domain's category
on each filter vendor's public page and ask for recategorization, or ask
their IT to allowlist it), and what only time resolves (the domain is six
days old). None of this is a promise: no code change here guarantees the
site opens on a corporate network — that depends on domain category,
reputation, and age, which sit outside the repository.

**What it means for you:** merge PR #234. After merging, run
`scripts/aws-bootstrap.sh` once to attach the new response headers policy to
the live distribution (the build only proves the script and the transform,
not the live CloudFront config), then work through
`docs/aws/domain-reachability.md`'s checklist — starting with capturing the
company's block page or asking IT which gateway they run. REQ-197, REQ-198,
and REQ-199 were written into `PRD/sections/` at `build`, together with the
code; this receipt confirms they're there and adds nothing new. The work
package is gone from `PRD/work/`; this receipt and the shipped
`PRD/sections/` entries are what's left.

- Date: 2026-09-12
- Slug: `domain-corporate-network-reachability`
- Status: shipped
- PR: https://github.com/ChrisMiho/TheJudge/pull/234

## Actions taken

1. Ran the four PR-ready checks (below) — all satisfied.
2. Confirmed durable `PRD/sections/` truth applied at `build` is present:
   REQ-197, REQ-198, REQ-199 in `functional-requirements.md`; DEC-084
   amended in place in `decisions/deployment.md` (no new `DEC-###`); the
   `## AWS production deployment` and `### Serverless hosting` entries in
   `system-map.md` carry the three new REQ ids, updated summaries, and
   updated `Lives in` lists. Nothing needed promoting.
3. Checked the `system-map.md` shipped-vs-planned signal: both AWS
   deployment entries already read `Status: shipped` from the original
   deployment work — no `planned`/`partial` marker to flip.
4. Wrote this receipt, folding `GRAPH-RUN.md`'s `## Node ledger`,
   `## Gate verdicts`, and `## Instruction ledger` in verbatim, plus an
   `## Intake` section.
5. Ran `npm run quality:check` on the branch: exit 0.
6. Deleted `PRD/work/domain-corporate-network-reachability/` (`git rm -r`,
   16 tracked files).
7. Removed the package's row from `PRD/work/STATUS.md`'s `## ship-ready`
   table (the section header stays, now empty of rows).
8. Left `PRD/README.md` unchanged — navigation did not change.

## Files created / updated / deleted

- Created: `PRD/instructions/receipts/domain-corporate-network-reachability-2026-09-12.md`
  (this file)
- Updated: `PRD/work/STATUS.md` (package row removed from `## ship-ready`)
- Deleted: `PRD/work/domain-corporate-network-reachability/DESIGN-BRIEF.md`
- Deleted: `PRD/work/domain-corporate-network-reachability/GAMEPLAN.md`
- Deleted: `PRD/work/domain-corporate-network-reachability/GATE-QUESTIONS.md`
- Deleted: `PRD/work/domain-corporate-network-reachability/GRAPH-RUN.md`
- Deleted: `PRD/work/domain-corporate-network-reachability/IDEA.md`
- Deleted: `PRD/work/domain-corporate-network-reachability/README.md`
- Deleted: `PRD/work/domain-corporate-network-reachability/STATUS.ship-ready`
- Deleted: `PRD/work/domain-corporate-network-reachability/intake/request.md`
- Deleted: `PRD/work/domain-corporate-network-reachability/slice-a-response-headers-policy.md`
- Deleted: `PRD/work/domain-corporate-network-reachability/slice-a.criteria.json`
- Deleted: `PRD/work/domain-corporate-network-reachability/slice-b-static-files.md`
- Deleted: `PRD/work/domain-corporate-network-reachability/slice-b.criteria.json`
- Deleted: `PRD/work/domain-corporate-network-reachability/slice-c-domain-reachability-runbook.md`
- Deleted: `PRD/work/domain-corporate-network-reachability/slice-c.criteria.json`
- Deleted: `PRD/work/domain-corporate-network-reachability/slice-d-prd-truth-apply.md`
- Deleted: `PRD/work/domain-corporate-network-reachability/slice-d.criteria.json`

(All code, tests, and the `PRD/sections/` requirement text itself — the
response headers transform, `robots.txt` / `security.txt`, the runbook, and
the REQ-197/198/199 + DEC-084 + `system-map.md` truth — were already
written and committed at `build`, on this same branch, before this node ran;
this receipt does not re-list them.)

## Verification

### PR-ready path — four pre-merge checks

1. **Checkout and branch.** `git branch --show-current` =
   `thejudge-auto/domain-corporate-network-reachability-work`, checked out
   at
   `/Users/chrismiho/Coding/Projects/TheJudge/.worktrees/implement-domain-corporate-network-reachability`.
   After `git fetch origin`, local `HEAD` (`4ca00c1`) equaled
   `origin/thejudge-auto/domain-corporate-network-reachability-work`
   (`4ca00c1`) before this node's own commit — nothing unpushed, nothing
   unfetched. Pass.
2. **PR state.** `gh pr view 234 --json state,baseRefName,headRefName` →
   `state: OPEN`, `headRefName: thejudge-auto/domain-corporate-network-reachability-work`,
   `baseRefName: main`. Head matches this branch, base matches the recorded
   autonomous base `origin/main` → `main`. Pass.
3. **Ship-ready, 25/25 criteria.** Read all four `slice-*.criteria.json`
   files directly: A 7/7, B 5/5, C 8/8, D 5/5 — 25/25 `true`, no `false`
   value anywhere in any file. `README.md` carried `status: ship-ready` and
   `STATUS.ship-ready` was the package's only marker. Pass.
4. **Runtime-cleanup criteria.** None exist — no slice used a browser or a
   dev server (confirmed at `plan`, in the GAMEPLAN, and unchanged through
   `build`). Vacuously satisfied.

### Durable-truth presence (per id/file)

| Id / file | Target file | Result |
| --- | --- | --- |
| REQ-197 | `functional-requirements.md` | present (`### REQ-197`, line 4727) |
| REQ-198 | `functional-requirements.md` | present (`### REQ-198`, line 4756 — `Contact: https://mtgjudge.gg/` per the owner's edit, no email address) |
| REQ-199 | `functional-requirements.md` | present (`### REQ-199`, line 4780) |
| DEC-084 | `decisions/deployment.md` | amended in place (response headers policy and static-file hygiene folded into the decision text and its notes; no new `DEC-###`) |
| `PRD/sections/system-map.md` — `## AWS production deployment` | system-map | present (line 507-509, `Backed by` carries REQ-197/198/199) |
| `PRD/sections/system-map.md` — `### Serverless hosting` | system-map | present (line 514-516, `Summary` and `Lives in` describe the headers policy and the two static files) |

Every id/file was already applied at `build`. Nothing needed promoting.

### Test re-run counts (from review, node 7, re-verified in this branch's history)

- `npm run test:scripts`: 589 pass
- `npm run quality:check`: exit 0
- `node --test scripts/frontend-public-static-files.test.mjs`: 3 pass,
  running a real `vite build`
- `bash -n scripts/aws-bootstrap.sh`: exit 0

### Follow-ups from review (Minor, none Critical or Important — owner's option, not required)

- `scripts/aws-bootstrap.sh:593-597` lists response headers policies
  unpaginated; fine at current account scale, would need pagination if the
  account accumulates many policies.
- The bootstrap issues `update-response-headers-policy` on every re-run even
  when the policy is unchanged, unlike the guarded `update-distribution`
  call beside it — harmless idempotency noise, not a correctness bug.
- REQ-198's acceptance criteria name `apps/frontend/dist/...` build-output
  paths rather than only the `public/` source paths — accurate but couples
  the requirement text to a build artifact.

### Deferred, from the brief (owner's or time's, not this package's)

- A Content-Security-Policy header needs a staging environment to enumerate
  every script/style/connect source safely; not attempted here.
- HSTS `preload` was deliberately not submitted — submission is one-way and
  outside a young domain's evaluation window.
- Vendor recategorization submissions and the domain's age are the owner's
  manual follow-through and elapsed time, not code.

## Graph run

- Run ID: `graph-20260911-160859` | Profile: `.claude/graph-profile.json (loaded — env sentinel THEJUDGE_GRAPH_PROFILE observed by graph-preflight and by the driver)` | Terminal state: COMPLETE — land: the owner's merge of https://github.com/ChrisMiho/TheJudge/pull/234

### Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 8` | branch `thejudge-auto/domain-corporate-network-reachability` pushed from `.worktrees/kickoff-domain-corporate-network-reachability` (`git ls-remote --heads origin thejudge-auto/domain-corporate-network-reachability` → `1f79dc1`); launch checkout untouched on `main`; lock `.worktrees/.graph-run.lock` slug/runId/pid 5591 | 2026-09-11 |
| 2 | shape | sonnet | ok | `0 → 36` | commit `fbf51a2` on `thejudge-auto/domain-corporate-network-reachability`: `PRD/work/domain-corporate-network-reachability/{IDEA.md,README.md,STATUS.ideation,intake/request.md}` + board row; staging folder emptied; one `## Prior run` match (`receipts/aws-deployment-onboarding-2026-07-03.md`); launch checkout `git status --porcelain` empty | 2026-09-11 |
| 3 | define | opus | ok | `0 → 34` | commit `5ef4bb9`: `DESIGN-BRIEF.md`, `GATE-QUESTIONS.md` (REQ-197, REQ-198, REQ-199, DEC-084 in-place, system-map entry; no blocker questions), `STATUS.refined`, board row under `## refined`; `git diff HEAD~1 HEAD -- PRD/sections` empty; launch checkout clean → questions file present, gate continues to `gate-qc` | 2026-09-11 |
| 4 | gate-qc | sonnet | ok (PASS) | `0 → 23` | verdict PASS, no findings; no commit made (`git status --short` clean at `c7864fa`); live re-measure of `curl -sI https://mtgjudge.gg` and `/robots.txt` matched the brief; REQ-196 confirmed highest existing id (`functional-requirements.md:4678`); package stays `STATUS.refined` until the driver parks | 2026-09-11 |
| — | claim (build half) | driver | ok | `n/a (driver, no node)` | docs PR #232 merged at `758f2af`; kickoff worktree `.worktrees/kickoff-domain-corporate-network-reachability` clean (`git status --porcelain` empty) → `git worktree remove`; `git worktree add .worktrees/implement-domain-corporate-network-reachability -b thejudge-auto/domain-corporate-network-reachability-work origin/main` at `758f2af`; claim commit `4ea3269` (README `- Autonomous base: origin/main`, ledger `Autonomous base`/`Worktree` lines) pushed (`git push -u origin thejudge-auto/domain-corporate-network-reachability-work` → new branch); lock retaken via `npm run graph:preflight -- --take-lock --slug domain-corporate-network-reachability --run-id graph-20260911-160859 --pid 14377`; graph canary `nohup true` → denied (`nohup` is denied while a graph run holds the lock); launch checkout still `main`, porcelain empty | 2026-09-12 |
| — | gate-review | sonnet | ok | `0 → 33` | commit `f40edb5` on `thejudge-auto/domain-corporate-network-reachability-work`: five IDs, 4 accept / 1 edit (REQ-198 → `Contact: https://mtgjudge.gg/` + Send-feedback comment, no email); `GATE-QUESTIONS.md:120` and `DESIGN-BRIEF.md:182` (A6) reconciled, grep re-run zero contradicting hits, no README supersession note needed; `## Gate verdicts` written, `## Open gate` resolved; marker `STATUS.refined`, board row under `## refined`; worktree porcelain empty; launch checkout porcelain empty | 2026-09-12 |
| 4 | gate-qc (attempt 2) | sonnet | ok (PASS) | `0 → 18` | verdict PASS, no findings; no commit (`git status --porcelain` empty at `3b6de33`); REQ-198 contact rule consistent at `GATE-QUESTIONS.md:120`/`:140` and `DESIGN-BRIEF.md:182-189`; `grep -n 'REQ-197\|REQ-198\|REQ-199' PRD/sections/functional-requirements.md` empty (REQ-196 highest at line 4678); live `curl -sI https://mtgjudge.gg` and `/robots.txt` still match the brief's pre-state; README `## Preparation gate` already reads PASS / none and stands as the latest result | 2026-09-12 |
| 5 | plan | sonnet | ok | `0 → 63` | commit `e5d2ded` on `thejudge-auto/domain-corporate-network-reachability-work`: `GAMEPLAN.md`, `slice-a-response-headers-policy.md` (7 criteria), `slice-b-static-files.md` (5), `slice-c-domain-reachability-runbook.md` (8), `slice-d-prd-truth-apply.md` (5, carries the PRD apply + Ship gates), four `slice-*.criteria.json` all `false`; README `status: active` + slice table; marker `STATUS.active` (only marker); board row under `## active`; no browser or dev server in any slice; worktree porcelain empty; launch checkout porcelain empty | 2026-09-12 |
| 6 | build | sonnet | ok | `0 → 156` | four milestone commits on `thejudge-auto/domain-corporate-network-reachability-work`: A `feafb27` (`scripts/lib/cloudfront-response-headers.mjs` + test, `scripts/aws-bootstrap.sh` step 6, `docs/aws/deployment.md`), B `851e308` (`apps/frontend/public/robots.txt`, `apps/frontend/public/.well-known/security.txt`, `scripts/frontend-public-static-files.test.mjs` running a real `vite build`), C `e8ef801` (`docs/aws/domain-reachability.md`), D `f44c142` (REQ-197/198/199 in `PRD/sections/functional-requirements.md`, DEC-084 in place, `system-map.md` entries); `git diff --stat a2ea1a2..f44c142` → 22 files, +854/−82; PR https://github.com/ChrisMiho/TheJudge/pull/234 (`main` ← work branch, OPEN, MERGEABLE, title `[THEJUDGE-AUTO][READY] …`); marker `STATUS.ship-ready`, board row under `## ship-ready`; criteria 25/25 `true` — self-reported (builder cites `npm run test:scripts` 589/589 and `npm run quality:check` exit 0 per slice; `.worktrees/.graph-evidence.jsonl` holds 0 entries for this run, the known build-half evidence gap, so `review` re-verifies); return-side: launch checkout `git status --porcelain` empty before and after, `classifyBuildWrites` over every reported path → `ok` (all inside `.worktrees/implement-domain-corporate-network-reachability/`); remote tip equals local `f44c142`; worktree porcelain empty | 2026-09-12 |
| 7 | review | opus | ok (APPROVE) | `0 → 33` | no-write reviewer (Plan-type subagent, no Write/Edit) over `git diff a2ea1a2..f44c142`: 25/25 criteria met with per-id evidence; independently re-ran `npm run test:scripts` (exit 0, 589/589), `npm run quality:check` (exit 0), `node --test scripts/frontend-public-static-files.test.mjs` (3/3, real `vite build`), `bash -n scripts/aws-bootstrap.sh` (exit 0); headers block sits inside the `frontend_domain` guard (`aws-bootstrap.sh:388-641`), no `### DEC-` added under `PRD/sections/`, REQ-197..199 appear only in the new entries, PR #234 body carries the no-promise headline; findings: three Minor (unpaginated `list-response-headers-policies` at `aws-bootstrap.sh:593-597`; `update-response-headers-policy` issued on every re-run though `update-distribution` is guarded; REQ-198 criteria name `dist/` build outputs) — none Critical/Important, no loop to build; nothing written, no mutating command | 2026-09-12 |
| 8 | close | sonnet | ok | `0 → 30` | `thejudge-cleanup` on the PR-ready path in `.worktrees/implement-domain-corporate-network-reachability`: four pre-merge checks passed (HEAD = `origin/thejudge-auto/domain-corporate-network-reachability-work` at `4ca00c1`; `gh pr view 234` OPEN, head work branch, base `main`; 25/25 criteria `true`; no runtime-cleanup criteria); durable truth confirmed present, nothing promoted, no system-map flip needed; receipt `PRD/instructions/receipts/domain-corporate-network-reachability-2026-09-12.md` with `## Graph run` (node, instruction, gate-verdict tables verbatim) and `## Intake`; `git rm -r PRD/work/domain-corporate-network-reachability/`; board row stripped; `npm run quality:check` exit 0; commit `0308ef6` pushed (`4ca00c1..0308ef6`, no force); PR https://github.com/ChrisMiho/TheJudge/pull/234 left open for the owner's merge (`land`); worktree and launch checkout porcelain empty; this row appended by the driver | 2026-09-12 |

### Gate verdicts

| Stable ID | Verdict | Reason |
| --- | --- | --- |
| `REQ-197` | accept | owner approved 2026-09-12 in session, taking the driver's recommendation |
| `REQ-198` | edit | the security contact is the app's own Send feedback feature, not an email address; `security.txt` publishes `Contact: https://mtgjudge.gg/` (RFC 9116 requires a URI) with a comment line directing reporters to the Send feedback action in the app's shared action menu, no email address published |
| `REQ-199` | accept | owner approved 2026-09-12 in session, taking the driver's recommendation |
| `DEC-084` | accept | owner approved 2026-09-12 in session; the bare apex stays the only address, no second demo address is built |
| `system-map` | accept | owner approved 2026-09-12 in session, taking the driver's recommendation |

### Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
| "I just discovered mtgjudge.gg is blocked by my companys vpn … are there certain aspects of this new domain that are yet ot be setup, that would enable me to share my domain with coworkers and even demo at work?" | answered-once | shape | — |

## Intake

- `intake/request.md` — pasted in the launch request.
