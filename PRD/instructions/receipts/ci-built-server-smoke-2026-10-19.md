# Receipt — ci-built-server-smoke (2026-10-19)

**What happened:** Every pull request now starts the real built backend and asks it two things: is it alive (`/api/health`), and can it look up one card (Sol Ring). A build that fails to start, or starts with no card data, fails the check and cannot reach the deploy step. Players no longer get a site whose card lookups are down because of a broken build.

**What it means for you:** Merge PR #339. From then on, a broken build shows up as a red `built-server` check on the pull request, and the deploy waits for it. Nothing else changes for players.

- Date: 2026-10-19
- Slug: `ci-built-server-smoke`
- Status: shipped
- PR: https://github.com/ChrisMiho/TheJudge/pull/339 (open at close; the owner's merge lands code, truth, and this receipt together)
- Docs PR: #326 (merged; the `define` gate, NFR-020 / REQ-166 / NFR-012 all `accept`)
- Review: approve, 13/13 criteria (A1-A13), 0 Critical, 0 Important, 5 Minor

## Actions taken

- Slice A built and reviewed on `thejudge-auto/ci-built-server-smoke-work`: the smoke script, its unit tests, `smoke:built-server` in `quality:check`, the `built-server` CI job (Node 24, `timeout-minutes: 10`), and `deploy.needs` listing `built-server`.
- Durable product truth applied at `build`; confirmed present at close, nothing re-written and nothing left to promote.
- Receipt written; board row removed from `PRD/work/STATUS.md`; `PRD/work/ci-built-server-smoke/` removed with `git rm -r`.

## Durable truth confirmed present (no promotion needed)

| Item | File | Check |
| --- | --- | --- |
| NFR-020 (new) | `PRD/sections/non-functional-requirements.md` | present at line 347 (built-backend boot check; own `built-server` job, no path filter, `deploy` needs it) |
| NFR-012 (amended) | `PRD/sections/non-functional-requirements.md` | present: line 209 says 7 jobs, the seventh being `built-server` |
| REQ-166 (amended) | `PRD/sections/functional-requirements.md` | present: line 3930 job list names `built-server` |
| Health purposes list | `PRD/sections/integrations-and-data.md` | present: line 164, the CI boot check line |
| Guardrails entry | `PRD/sections/system-map.md` | present: lines 534-538, `built-server`, `scripts/smoke-built-server.mjs`, NFR-020; already `shipped`, so no status flip applies |

## Review outcome

Verdict approve, 0 Critical, 0 Important. Five Minor follow-ups (not fixed here):

1. `scripts/smoke-built-server.mjs:45-51` — the port-released check test-binds 127.0.0.1 only; on macOS it reports free while a server listens on `::`. Fix: also test-bind `::` or bind with no host.
2. `scripts/smoke-built-server.mjs:86-95` — the 30 s ready deadline can stretch to about 35 s because it is checked only after each health request (5 s request timeout).
3. `scripts/smoke-built-server.test.mjs:117-126` — the timeout test checks that a signal is attached, not that it is a timeout; no test proves every request goes through `fetchJson`.
4. `scripts/smoke-built-server.mjs:177` — server output printed during shutdown is not captured.
5. `scripts/smoke-built-server.mjs:133-134` — a child that ignored SIGKILL would hang the await; the job `timeout-minutes: 10` bounds it.

Evidence note: the hook evidence log earned 0 entries for this run. Criteria A1-A13 were set to `true` by the builder, and the no-write reviewer verified each one independently (unit tests 17/17, `npm run smoke:built-server` exit 0, port free after, `npm run test:scripts` 1085/0, typecheck/lint/format exit 0, both failure modes reproduced with throwaway child processes).

## Files

Created or changed by the code PR (excluding the work folder): `scripts/smoke-built-server.mjs` and `scripts/smoke-built-server.test.mjs` (new), parity tests, `package.json`, `.github/workflows/quality-check.yml`, and the five `PRD/sections/` files in the table above.

Created by close: this receipt. Updated by close: `PRD/work/STATUS.md`. Deleted by close: every tracked path under `PRD/work/ci-built-server-smoke/` (DESIGN-BRIEF.md, GAMEPLAN.md, GATE-QUESTIONS.md, GRAPH-RUN.md, IDEA.md, QUALITY-CHECK.md, README.md, STATUS.ship-ready, evidence/measurements.md, slice-a-built-server-smoke.md, slice-a.criteria.json).

## Verification

- Pre-merge checks: branch `thejudge-auto/ci-built-server-smoke-work`, HEAD equals origin tip `21570c8c`; PR #339 open, base `main`; all 13 criteria `true`; no runtime-cleanup gaps (port released after the smoke run).
- Build-time `npm run quality:check` exit 0; `gh pr checks 339` green (static, backend, built-server, frontend shards, coverage-merge; changes/deploy skip on PRs).

## Graph run

- Run ID: `graph-20261018-231424` (spec-forming half), `graph-20261019-182200` (build half) | Profile: `loaded (env sentinel)` | Terminal state: COMPLETE — land: the owner's merge of https://github.com/ChrisMiho/TheJudge/pull/339
- PR: https://github.com/ChrisMiho/TheJudge/pull/339

### Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | preflight | haiku | ok | `0 → 8` | in-place shape in `.worktrees/session-ci-smoke` (detached HEAD → `thejudge-auto/ci-built-server-smoke`); branch pushed (`git ls-remote` → `30149327`); porcelain empty; lock `.worktrees/.graph-run.lock` runId `graph-20261018-231424` pid 98719; universal canary and graph canary `nohup true` both denied | 2026-10-18 |
| 2 | shape | sonnet | ok | `0 → 15` | `PRD/work/ci-built-server-smoke/` (IDEA.md with 5 `## Prior run` lines and related-material citations, README.md, STATUS.ideation) and board row committed `eaad6f32`, pushed (`git ls-remote` → `eaad6f32`); porcelain empty | 2026-10-18 |
| 3 | define | opus | ok | `0 → 81` | commit `415e40db` (= origin tip): `DESIGN-BRIEF.md` (disposition table, 52 grep hits + 12 deploy-wording rows), `GATE-QUESTIONS.md` (NFR-020 new, REQ-166 and NFR-012 amended; no blocker questions), `evidence/measurements.md` (live: build 1.2 s, listen ~0.5 s, `/api/health` 200, Sol Ring `/api/cards/6ad8011d-…` 200; data folder removed → health 200 but card 404; Lambda handler in-process on Node 22/24/26); `STATUS.refined` only marker, board row moved; `git diff --stat origin/main HEAD -- PRD/sections apps scripts .github` empty; porcelain empty; port 3917 released (`lsof` empty); NFR-020 unused in `PRD/sections/` | 2026-10-18 |
| 4 | gate-qc | sonnet | ok | `0 → 17` | PASS, 0 blocking, 4 advisory (per-request + job timeout; fix 30 s deadline as a constant; only card data asserted; ruleset 15384308 has no required checks, re-read with `gh`); all five proposed diffs match `PRD/sections/` once each; `QUALITY-CHECK.md` commit `9d426a91` (= origin tip); README `## Preparation gate` PASS recorded by the driver; run stops at PASS → docs PR, `STATUS.owner-action`, board row moved to owner-action | 2026-10-18 |
| 4a | gate-review | sonnet | ok | `0 → 20` | build half run `graph-20261019-182200`: docs PR #326 merged (on `origin/main` `06698d0a`); no kickoff worktree to remove (spec-forming half ran in place in `.worktrees/session-ci-smoke`); claim commit `d22fcb58` on `thejudge-auto/ci-built-server-smoke-work` cut from `origin/main` `06698d0a`, pushed; lock taken from the launch root; graph canary `nohup true` denied; `graph-gate-review` commit `0c709531` (= origin tip): 3 accept / 0 edit / 0 reject (NFR-020, REQ-166, NFR-012); `### Brief reconciliation` none (grep for the dropped frontend-build widening found only `DESIGN-BRIEF.md:192`, already agreeing); `STATUS.refined` only marker; board row under refined; `git diff --stat origin/main HEAD -- PRD/sections apps scripts .github` empty; worktree and launch-checkout porcelain empty | 2026-10-19 |
| 4 | gate-qc (build half re-grade) | sonnet | ok | `0 → 16` | PASS, 0 blocking, 6 advisory (timeouts and 30 s constant for map-out; card-only and ruleset settled; two harmless brief wording notes); all five diffs re-read against this branch's `PRD/sections/`, each matches once; NFR-020 unused; repo claims confirmed (`deploy.needs` = static, backend, coverage-merge, changes); `QUALITY-CHECK.md` commit `c3b81218` (= origin tip); README `## Preparation gate` PASS recorded by the driver; `STATUS.refined` only marker; porcelain empty | 2026-10-19 |
| 5 | plan | sonnet | ok | `0 → 22` | commit `a0478fc7` (= origin tip): `GAMEPLAN.md`, one slice `slice-a-built-server-smoke.md` (smoke script + tests, `quality:check` entry, `built-server` CI job on Node 24 with `timeout-minutes: 10`, `deploy.needs`, product truth applied by intent), `slice-a.criteria.json` 13 criteria all `false`, none manual or post-merge; `READY_DEADLINE_MS = 30000` and `REQUEST_TIMEOUT_MS` named; no frontend build step (parity-asserted); `STATUS.active` only marker; board row under active; porcelain empty | 2026-10-19 |
| 6 | build | sonnet | ok | `0 → 56` | PR https://github.com/ChrisMiho/TheJudge/pull/339 open, head `5ebf10ce` (= origin tip; feat `0b8f9f77`, ship-ready `5ebf10ce`); 14 files: `scripts/smoke-built-server.mjs` + 17-test `scripts/smoke-built-server.test.mjs`, parity tests, `package.json` (`smoke:built-server` in `quality:check`), `built-server` job + `deploy.needs`, `PRD/sections/` NFR-020 / NFR-012 / REQ-166 / integrations-and-data / system-map applied by intent; `npm run quality:check` exit 0 (smoke: ready 534 ms, health 200, Sol Ring 200, port released); `gh pr checks 339` static, backend, built-server (26 s), frontend-shard 1-3, coverage-merge pass, changes/deploy skipping (main-only); `STATUS.ship-ready` only marker; launch-checkout porcelain identical before/after (empty); every reported path inside `.worktrees/implement-ci-built-server-smoke/` (scratch in its ignored `.tmp/`); 2 hook denials (`build-write-outside-worktree` on a heredoc commit message and a read-only `sed -n` chain — both redone with Edit); criteria A1–A13 `true` set by the builder (A1 Edit, A2–A13 one `node -e` replace) — hook evidence log has 0 entries for this run, so the criteria are self-reported and review is the gate | 2026-10-19 |
| 7 | review | opus | ok | `0 → 28` | no-write reviewer (read-only agent, fresh context); verdict approve, 0 Critical, 0 Important, 5 Minor (port-released check binds 127.0.0.1 only; deadline can stretch to ~35 s; timeout test checks signal presence only; shutdown output not captured; SIGKILL-ignoring child could hang, bounded by job timeout); A1–A13 each verified independently: `node --test scripts/smoke-built-server.test.mjs` 17/17, `npm run smoke:built-server` exit 0 (ready 540 ms, health 200, Sol Ring 200), `lsof` port free after, `npm run test:scripts` 1085/0, typecheck/lint/format exit 0; both failure modes reproduced with throwaway child processes; five `PRD/sections/` edits match accepted `GATE-QUESTIONS.md` word for word; graded head `405cd195` (= `5ebf10ce` + ledger commit) | 2026-10-19 |

### Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
