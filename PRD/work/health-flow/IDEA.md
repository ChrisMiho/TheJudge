# health-flow

## Request (owner, verbatim)

> I want to build a self healing loop, the codehealth loop has proven to me that it can find small incremental improvements, without clobbering the code, id like to figure out how i can create a second loop, that will evaulate the finding, and then implement and merge it in to main, so one loop works on identifying issues, and another loop manages implementing it, and somewhere along the way, we need some guard rails to ensure nothing crazy happens, no massive document re-writes, and that the PRD which defines functionality and spec is used as the source of truth since this would be fully autonomous

> an idea i had last night, was it possible to have an agent identify fixes in the form of an issue, then a reviewer can decide whether or not an issue should be acted on, then another agents picks up on the approved issues and implements, and then a final reviewer goes over the code fix, its a bit more in depth, but im hoping the multiple reviews would help with quality?

## What it means for a player

Small fixes that keep the code healthy reach the live site without waiting for the owner. Nothing a player sees or does changes. Any fix that would change what a player sees still waits for the owner.

## Problem, outcome, non-goals

Problem: the `codehealth` loop finds and builds good small fixes, but every PR still waits for the owner to merge it. On the 2026-10-18 night, eight PRs (#329–#336) sat open waiting. The owner is the bottleneck for work that never changes behavior.

Outcome: a pipeline with four agent steps, each its own fresh agent, and a hard gate behind them:

1. **Finder** opens a GitHub issue describing one finding: what is wrong, where, the evidence, and the proposed fix. It writes no code.
2. **Triage reviewer** decides whether the fix should happen. Is it behavior-preserving? Does it agree with `PRD/sections/`? Is it worth doing? It approves, rejects with a reason, or marks the issue for the owner. It sees only the issue and the PRD, not the finder's reasoning.
3. **Builder** picks up approved issues only, and builds exactly what the issue says.
4. **Code reviewer** checks whether the fix was done right: the diff matches the approved issue, no tests were edited, and the scope held. It does not re-argue whether the fix was worth doing.
5. **Merge gate (CI, not an agent)** merges a PR only when hard rules hold: size caps, off-limits paths, tests untouched, and all checks green. The gate merges, not an agent.

Non-goals: no change to game behavior through this lane. No agent ever edits `PRD/sections/`. No change to the `graph-kickoff`/`graph-implement` feature lifecycle. No automatic merge of the owner's own PRs or of graph PRs.

## Context from the driver (not owner decisions)

These facts were checked in-session on 2026-10-20:

- **Track record.** About 27 `codehealth/` PRs to date (#166–#179, #323–#336). The largest was 4 files and 121 lines. Every one the owner reviewed merged clean. Eight are still open (#329–#336), and seven of those are comment or doc fixes.
- **Merge means deploy.** `.github/workflows/quality-check.yml` deploys on a push to `main` (path-gated). An automatic merge is an automatic release to players.
- **No server-side guard today.** `main` has no GitHub branch protection (API returns 404, "Branch not protected"). The only thing stopping an agent merge is the local boundary hook. `scripts/lib/boundary-rules.mjs` rule `pr-merge-or-close` denies `gh pr merge` while a graph run holds the lock, and `.claude/graph-profile.json` denies it statically for `codehealth`.
- **Standing rule this reverses.** Owner policy to date: merge to `main` is always human (`codehealth` SKILL.md hard rules; the graph contract says `land` is never automated). This package would deliberately carve out one narrow lane. The owner must confirm that reversal explicitly.
- **The repo is public.** Issues are public too (`gh repo view` → `PUBLIC`, issues enabled). A finding shaped like a security weakness ("this route does not check its input") must not be written to a public issue.
- **Finder yield is dropping.** The 2026-10-18b night fell back to doc drift because the remaining code targets sit in files reserved by the five graph briefs in `PRD/work/probe-codebase-health-pass/`.

Driver recommendations made in conversation, for refinement to confirm or change:

- Use GitHub issues and labels as the queue between steps, for example: `health:proposed` → `health:approved` / `health:rejected` / `health:needs-owner` → PR open → `autoland`. The finder skips anything already filed or closed, which removes `codehealth`'s duplicate-target problem. The owner can file an issue for the builder or close one to veto it.
- Run one loop session that hands each step to a fresh subagent, rather than four separate sessions. Labels make it restartable without new lock machinery.
- Put the merge decision in a CI job that runs from `main`'s copy of its own rules, so a PR cannot edit the gate that judges it. Add branch protection that requires the gate, so nothing bypasses it. The gate passes trivially for PRs outside the lane.
- Starting caps, calibrated on the track record: at most 5 files and 150 changed lines per PR, at most 20 changed lines in any one `.md` file, one merge at a time, waiting for the deploy to finish before the next, and a daily cap.
- Off-limits paths for the lane: `PRD/`, `.claude/`, `CLAUDE.md`, `AGENT-SKILLS.md`, `.github/`, `package.json` and lockfiles, committed data artifacts, the gate script, and `scripts/lib/boundary-rules.mjs`.
- Required green checks include the built-server smoke test (#339) and the browser smoke suite (#340).
- If the code and the PRD disagree, or a fix would change behavior, the issue goes to `health:needs-owner`. Optionally it becomes a `graph-kickoff` proposal PR, which still waits for the owner's answer.
- After a merge, if the deploy or a live check fails, the loop writes the kill-switch file `.worktrees/.graph-stop`, stops, and opens a revert PR for the owner.
- Run the code review on a different model, for example Codex, so it does not share the builder's blind spots.
- Shadow week first: the pipeline labels "would merge" or "would reject" while the owner still merges by hand. Compare its calls with the owner's before turning on automatic merging.
- Log tokens per fix in the ledger. Four agents per fix will cost roughly three to four times a single `codehealth` tick.

## Open questions for refinement

- Does the owner confirm the reversal of "merge is always human" for this lane only?
- Does `health-flow` replace `codehealth`, or does `codehealth` become the finder step?
- Which finding classes may take the automatic lane? All five `codehealth` classes, or a narrower start such as dead code and doc drift only?
- Where do security-shaped findings go, given that issues are public? A private ledger only?
- Exact size caps, daily cap, and the full off-limits path list.
- Does the triage reviewer also gate issues the owner files, or are owner issues approved by default?
- Which model runs each step? Is the code reviewer a different model (Codex)?
- How long is the shadow period, and what agreement rate with the owner turns automatic merging on?
- Does a revert after a failed deploy merge automatically, or wait for the owner?
- Does the gate need `pull_request_target` or a base-branch checkout so a PR cannot change the gate's rules? What are the security trade-offs of that on a public repo?
- Can the pipeline touch files that the five graph briefs in `PRD/work/probe-codebase-health-pass/` reserve?
- Which `PRD/sections/` product truth does this need? Likely an NFR or REQ for the lane and amendments to the graph contract's "land is never automated" wording.

## Prior run

- PRD/instructions/receipts/standalone-codehealth-workflow-2026-09-01.md
- PRD/instructions/receipts/graph-shipping-mode-phase1-2026-09-01.md
- PRD/instructions/receipts/graph-shipping-mode-phase2-2026-09-01.md
- PRD/instructions/receipts/graph-workflow-land-2026-09-06.md
- PRD/instructions/receipts/graph-run-boundary-enforcement-2026-08-20.md
- PRD/instructions/receipts/ci-built-server-smoke-2026-10-19.md
- PRD/instructions/receipts/browser-smoke-suite-2026-10-19.md

## Related work (citations only)

- `.claude/skills/codehealth/SKILL.md` and `reference.md`: today's finder and builder
- `PRD/work/probe-codebase-health-pass/HEALTH-REPORT.md`: the seeded health queue
- `PRD/instructions/graph-workflow-contract.md`: the "land is never automated" boundary
