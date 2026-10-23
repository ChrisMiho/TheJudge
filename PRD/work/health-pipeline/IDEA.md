# health-pipeline

Split out of `health-flow` during its refinement on 2026-10-20. `health-flow` builds the frozen
Playwright flow test suite (Part 1). This package is Part 2: the pipeline that finds, approves,
builds, reviews, and merges small code-health fixes, which relies on that suite. It starts only
after `health-flow` has merged.

## Request (owner, verbatim)

> I want to build a self healing loop, the codehealth loop has proven to me that it can find small incremental improvements, without clobbering the code, id like to figure out how i can create a second loop, that will evaulate the finding, and then implement and merge it in to main, so one loop works on identifying issues, and another loop manages implementing it, and somewhere along the way, we need some guard rails to ensure nothing crazy happens, no massive document re-writes, and that the PRD which defines functionality and spec is used as the source of truth since this would be fully autonomous

> an idea i had last night, was it possible to have an agent identify fixes in the form of an issue, then a reviewer can decide whether or not an issue should be acted on, then another agents picks up on the approved issues and implements, and then a final reviewer goes over the code fix, its a bit more in depth, but im hoping the multiple reviews would help with quality?

> for part 2, lets capture the current idea but id like to refine more of what this gameplan should look like

## What it means for a player

Small fixes that keep the code healthy reach the live site without waiting for the owner. Nothing a
player sees or does changes. The sign that something broke is a flow test failing, and a failing
flow test blocks the merge.

## Owner answers so far (health-flow refinement, 2026-10-20)

- **Trust comes from the flow tests.** The owner asked how to trust the project's tests. Answer:
  Playwright tests that walk each PRD user flow (built by `health-flow`) are the frozen layer.
  Unit and component tests (about 280 files) may change as code is rewritten; the flow tests may
  not. "Coverage first, then auto": nothing merges on its own until every player flow has a test.
- **No fixes until the tests exist.** The pipeline does not find or build code fixes until
  `health-flow` has merged.
- **Codehealth is a proof of concept.** The owner is happy to rebuild it completely.
- **Queue: public GitHub issues.** Every ordinary finding is a public issue. Security-shaped
  findings go to a **private draft GitHub security advisory** instead, and are never built
  automatically.
- **Grow tests without bloat.** The owner wants test gaps filled but not endlessly: a coverage map
  names the test guarding each flow, gaps are filed only where none is named, triage rejects a test
  aimed at an already-guarded flow, and every new test must be shown to fail against a deliberately
  broken version of what it guards. Once the map is full, no more test issues are filed.

## Draft design (driver defaults, not yet owner-refined)

1. **Finder** (rebuilt from `codehealth`) files one GitHub issue per finding: what, where,
   evidence, proposed fix. Also files "this flow has no test" issues when the coverage map has a
   gap (for example after a feature run adds a FLOW).
2. **Triage reviewer** sees only the issue and `PRD/sections/`. Approves, rejects with a reason, or
   labels it for the owner. An owner-filed issue labelled approved skips triage; closing an issue
   vetoes it.
3. **Builder** builds approved issues only, exactly as written.
4. **Code reviewer** checks the diff against the issue and justifies any unit-test edit. Runs on a
   different model (Codex) from the builder.
5. **Merge gate** (a CI job, not an agent) merges only when: the flow suite is untouched and green,
   all checks are green, the coverage map has no gap, at most 5 files / 150 changed lines / 20 lines
   in any one doc, and no off-limits path is touched (`PRD/`, `.claude/`, `CLAUDE.md`,
   `AGENT-SKILLS.md`, `.github/`, `package.json` and lockfiles, committed data artifacts, the gate
   script, `scripts/lib/boundary-rules.mjs`, the flow test folder). One merge at a time, waiting for
   the deploy; at most 5 a day. The gate reads `main`'s copy of its rules; branch protection on
   `main` requires it.
6. **Shadow start:** the first 10 pipeline PRs are labelled "would merge" / "would reject" and the
   owner merges by hand; auto-merge turns on once the owner agreed with all 10.
7. **Failure:** a failed deploy or live check writes `.worktrees/.graph-stop`, stops the loop, and
   opens a revert PR that waits for the owner.
8. Files reserved by an open graph brief are skipped. Tokens are logged per fix.

Product truth this would need (IDs not yet reserved — `health-flow` takes REQ-250): a pipeline +
merge-gate REQ, an owner-steering FLOW (file, approve, veto, stop), and a carve-out in the two
"`land` is never automated" lines (`PRD/sections/functional-requirements.md`, the `graph-implement`
REQ and the graph boundary REQ).

## Context from the driver (checked 2026-10-20)

- About 27 `codehealth/` PRs to date (#166–#179, #323–#336); largest 4 files / 121 lines; every
  reviewed one merged clean. #329–#336 sat open waiting for the owner.
- Merge means deploy: `.github/workflows/quality-check.yml` deploys on push to `main`.
- `main` has no branch protection today. Only the local boundary hook (`pr-merge-or-close`) and the
  codehealth profile stop an agent merge.
- A merge made with the workflow's default `GITHUB_TOKEN` does not trigger other workflows, so a
  gate that merges that way would not fire the deploy. The gate needs a GitHub App token or the
  native auto-merge path. Check during refinement.
- The repo is public; issues are public.
- Finder yield was dropping: the 2026-10-18b night fell back to doc drift because code targets sit
  in files reserved by the briefs in `PRD/work/probe-codebase-health-pass/`.

## Open questions for refinement

- Gameplan shape: the owner wants to refine what the build looks like. Which parts land first
  (gate and branch protection, issue queue, the four agents), and can any part run usefully before
  the others?
- One loop session dispatching each step to a fresh subagent, or separate loops per step?
- Which finding classes may take the automatic lane at first?
- Exact caps, daily cap, shadow length, and agreement rate.
- Which model runs each step?
- Does a revert after a failed deploy merge automatically or wait for the owner?
- `pull_request_target` versus a base-branch checkout for the gate, and the security trade-offs on
  a public repo.
- Token cost per fix: four agents run roughly three to four times one `codehealth` tick.

## Prior run

- PRD/instructions/receipts/standalone-codehealth-workflow-2026-09-01.md
- PRD/instructions/receipts/graph-shipping-mode-phase1-2026-09-01.md
- PRD/instructions/receipts/graph-shipping-mode-phase2-2026-09-01.md
- PRD/instructions/receipts/graph-workflow-land-2026-09-06.md
- PRD/instructions/receipts/graph-run-boundary-enforcement-2026-08-20.md

## Related work (citations only)

- `PRD/work/health-flow/` — Part 1, the flow test suite this depends on
- `.claude/skills/codehealth/SKILL.md` and `reference.md`
- `PRD/work/probe-codebase-health-pass/HEALTH-REPORT.md`
- `PRD/instructions/graph-workflow-contract.md`
