# Graph tooling fixes — design brief & receipt

Prerequisite package before docs-refactor Package 2. Interactive session, not a
graph run: it patches the enforcer and preflight a run loads, and a run may not
patch the machinery it runs on.

## Headline: the brief's premise was stale

The kickoff scoped "five live defects." On inspection, **four were already
fixed, merged to `main`, and under test** before this session began:

| Defect | Code fix | Regression test |
| --- | --- | --- |
| 1 — nothing writes the lock | `takeLock()` in preflight `main()` (#101) | ✅ `takeLock writes the lock the run depends on` |
| 2 — liveness blind to tier 2 | `nohup true` graph canary + `classifyGraphCanary()` (#101) | ✅ `the graph canary proves the tier the universal canary cannot see` |
| 4 — lock can't be released | `.graph-run-release.json` + `releasesOwnLock()` (#99, #104) | ✅ `run-lock-removal` release-sequence tests |
| 5 — heredoc false-positive | `matchHeredocStart()` skips heredoc bodies (#101) | ✅ **added here** — code shipped without a test |
| **3 — a step earns its own homework** | **added here** — `EVIDENCE_EARNING_NODE` gate | ✅ **added here** (3 tests) |

The brief required "each defect backed by a test." Four fixes had already landed
in prior PRs; on audit, **defect 5's fix had shipped in code with no test** — the
exact gap the shakedown warned about, since an unguarded fix does not survive a
reversion. This package closes defect 3 and backfills the missing defect-5 guard,
so all five now have committed code **and** a regression test.

The retry-after-block hardening the brief scoped *out* as a node mistake had also
already landed as the `denied-command-retry` rule + denial log.

**Defect 4 / Q5:** the shipped resolution landed on one design path — release gets
a permitted, adjustable route (`.graph-run-release.json`) rather than the rule
being dropped. Confirmed by the owner to stand; not reopened.

## The one live defect, and the decision

Defect 3 bundled two problems (shakedown Q4 and Q3):

- **Q4 — per-run vs per-step filing.** Evidence was keyed by run id alone, so the
  `plan` node's file listings satisfied 7 of 21 criteria before `build` started.
- **Q3 — proves it ran, not that it passed.** A `PreToolUse` hook fires *before*
  the command runs, so "exits 0" is satisfied by issuing the command, never by it
  succeeding. Structural — real outcome-capture would need a `PostToolUse` hook.

**Owner's call (2026-08-28): filing fix + honest limit.** Fix Q4 in code; state
the Q3 limit truthfully for all checks. No new hook — outcome-capture is deferred
to its own package if ever wanted.

**Defect 4 / Q5 lean:** the shipped resolution (release gets a permitted path)
stands; not reopened.

## What shipped

- `scripts/lib/boundary-rules.mjs` — new `EVIDENCE_EARNING_NODE = "build"`.
- `scripts/graph-boundary-hook.mjs` — `decide()` earns evidence only while the
  run is on the `build` node. The flip guard (a criterion set `true` without
  logged evidence) still fires in **every** node, so gating earning cannot let a
  non-build node forge a pass.
- `scripts/graph-boundary-hook.test.mjs` — three tests, written failing-first:
  a non-build node earns nothing; the build node still earns normally; the flip
  guard still fires outside build.
- `PRD/instructions/graph-workflow-contract.md` — records the per-step earning
  gate, and broadens the "proves it ran, not that it passed" limit from
  `manual`-only to every check.

Verified: `npm run test:scripts` → 405 pass, 0 fail.

## Out of scope (named, not fixed)

- **Q3 outcome-capture** — a `PostToolUse` evidence model; separate package.
- **Node mistake: retry-after-block** — the 2026-08-23 block came from Claude
  Code's own permission classifier, above the hook (shakedown Q6, upstream report).
- **Node mistake: branch-shape / PR-diff slip** — Package 2's merge-safe-ordering
  work (shakedown Q7).
