# Design brief — agent workflow alignment

## Status

Approved on 2026-08-05.

## Summary

Align TheJudge's agent workflows around one predictable boundary:

- collaborative phase and implementation skills work in the current checkout and current local branch, with no automatic worktree, branch, push, or pull request
- explicitly invoked autonomous skills use an operator-named remote base, deterministic repo-local worktrees, one branch and pull request per package, and auditable ownership through merge and cleanup
- implementation is sequential within one package; concurrency exists only across packages
- browser and dev-server ownership is recorded and cleaned before a slice, task, or feature can be called complete
- packages can be deferred and restored without destroying their artifacts or Git state

This is repository workflow and tooling scope only. It does not change TheJudge product behavior, UI, API contracts, prompt assembly, or data handling.

## Problem and evidence

- `AGENT-SKILLS.md`, `workflow-reference.md`, the autonomous skills, and their references describe overlapping lifecycle rules that have drifted.
- `thejudge-prepare` and `thejudge-implement-all` currently default autonomous work to `origin/main` / PR base `main`, which can target the wrong integration branch.
- The parallel map-out and implementation pair adds slice-level agent fleets even though the desired autonomous model is one sequential agent per package.
- Cleanup treats `ship-ready` as sufficient without proving that an autonomous implementation PR reached its recorded base.
- Current `scripts/dev.mjs` launches services through shell wrappers, signals only the immediate children, and exits after a fixed 150 ms instead of awaiting the exact descendant trees.
- Playwright MCP is available, but the workflow does not consistently say when browser verification is required or make browser/server cleanup a completion gate.
- The merge/reset incident during refinement temporarily moved the launch checkout between branches. Git retained a WIP snapshot, but the incident confirms the need for explicit branch/worktree ownership and non-destructive recovery rules.

## Approved design

### 1. Skill catalog and collaborative path

The target catalog has ten skills:

1. `thejudge-kickoff`
2. `thejudge-refinement`
3. `thejudge-quality-check`
4. `thejudge-map-out`
5. `thejudge-implement`
6. `thejudge-implement-all`
7. `thejudge-implement-fanout`
8. `thejudge-defer`
9. `thejudge-cleanup`
10. `thejudge-prepare`

Delete `thejudge-map-out-parallel` and `thejudge-implement-parallel` from the canonical and synchronized skill trees and remove their contracts from operator documentation.

The collaborative path remains kickoff → refinement → quality-check → map-out → implementation → cleanup. It stays in the current checkout and current local branch. Collaborative skills do not automatically create a worktree or branch, commit, push, open a PR, or merge.

`thejudge-map-out` is the only mapping skill. It creates dependency-ordered sequential slices. `thejudge-implement` executes one slice per invocation.

### 2. Autonomous base and preparation ownership

`thejudge-prepare` is an explicit opt-in and requires a remote base argument such as `--base feature/example`. It never defaults to `main` or infers the current branch.

The package README records `Autonomous base: origin/<branch>` as durable metadata. Downstream autonomous skills inherit it and block if it is missing, unavailable, or contradicted by a supplied branch or PR.

Preparation uses:

- worktree: `.worktrees/prepare-<slug>`
- branch: `thejudge-prep/<slug>` unless a compatible preparation branch/PR is supplied
- PR base: the recorded autonomous base

The preparation PR contains the mapped `active` package. A human must review and merge it before implementation starts. The preparation worktree and local branch remain until implementation preflight proves the PR merged into the recorded base and the worktree is clean; only then are they removed.

Every autonomous terminal report identifies the recorded base, worktree, local branch, remote branch, PR URL, and PR base.

### 3. Autonomous implementation and fanout

`thejudge-implement-all` runs one mapped package in one agent and completes every remaining slice sequentially. It uses:

- worktree: `.worktrees/implement-<slug>`
- branch: `thejudge-auto/<slug>` unless a compatible implementation branch/PR is supplied
- PR base: the package's recorded autonomous base

It never uses implementation subagents, wave plans, or nested slice fleets.

`thejudge-implement-fanout` selects eligible rows from the `## active` section of `PRD/work/STATUS.md`, subject to an optional include/ignore list. All selected packages must record the same autonomous base. It dispatches one `thejudge-implement-all` agent, worktree, branch, and PR per package.

The existing cross-package file-overlap check remains. Packages with overlapping planned files are serialized rather than concurrently dispatched. The orchestrator assigns each dispatched package an explicit, unique, preflighted frontend/backend port pair.

### 4. Cleanup and merge proof

`ship-ready` means every implementation slice passed; it does not prove deployment or merge.

Cleanup stays local and creates no automatic worktree, branch, commit, push, or PR. For an autonomous package it must:

1. Require the current branch to equal the recorded autonomous base.
2. Prove the implementation PR merged into that base.
3. Prove the implementation worktree is clean and fully merged.
4. Prove every runtime-cleanup acceptance criterion is recorded as passing.
5. Promote durable PRD truth, write the receipt, update the system map when applicable, remove the board row, and delete the package folder.
6. Remove the clean merged implementation worktree and local branch.

Cleanup refuses dirty or unmerged worktrees and does not delete remote branches. Collaborative packages without autonomous metadata retain the local cleanup path and do not acquire autonomous Git requirements.

### 5. Reversible deferral

Add `thejudge-defer` as a lifecycle toggle.

On first invocation it records the previous status and a short reason in the package README, replaces the marker with `STATUS.deferred`, and moves the board row. Invoking it on a deferred package restores the recorded prior status and clears the active deferral record.

Deferral preserves all package artifacts, worktrees, branches, and PRs. It refuses `ship-ready` packages and refuses an `active` package while any slice is `in-progress`. Fanout naturally ignores deferred packages because it reads only `## active`.

### 6. Playwright verification policy

Playwright MCP is required when either condition holds:

- the user explicitly requests browser or Playwright verification, even if automated tests might otherwise suffice
- the change has browser-observable risk that component tests cannot establish, including responsive geometry, containment, overlays/stacking, hit areas, focus/keyboard behavior, scrolling, navigation/persistence, browser APIs, or integrated multi-screen behavior

Playwright is not automatically required for documentation, backend-only work, pure logic/data changes, or simple UI copy already established by component tests unless the user requests it.

Map-out encodes exact browser scenarios, viewports, observations or measurements, and cleanup checks in affected slice acceptance criteria. Unit/component tests remain required where appropriate; Playwright does not replace them. No new `@playwright/test` CI harness is introduced.

### 7. Runtime ownership and cleanup contract

Create `PRD/instructions/runtime-process-hygiene.md` as the focused authority. `AGENTS.md`, `workflow-reference.md`, and affected skills link to it and retain only concise local reminders.

Every browser/dev-server session records in the agent's working state and verification evidence:

- owning agent or tool session handle
- worktree
- frontend and backend ports
- whether each server was started by the agent or attached to
- browser-close, owned-process-stop, and port-release results

Autonomous agents always start isolated servers on their assigned ports. Collaborative agents may attach to a verified server for the current checkout, but must not stop an attached or otherwise user-owned process.

Before any owning invocation ends, including failure or blocker paths, it must:

1. Call `browser_close` after the last browser interaction.
2. Stop servers through the exact owning session or process handle.
3. Wait for the exact owned process tree to exit.
4. Verify owned ports are released.
5. Record the result in slice verification evidence and the terminal report.

An ownership or cleanup failure prevents the slice from becoming `done` and prevents the package from becoming `ship-ready`. The agent reports the exact remaining handle, process, or port as a blocker. `nohup`, untracked background `&`, broad `pkill` / `killall`, and stopping pre-existing user-owned servers are prohibited. Exact owned-tree escalation after a bounded graceful-shutdown window is allowed.

Runtime cleanup happens at the end of every owning task rather than waiting for final package cleanup. Final cleanup additionally verifies the recorded evidence before removing Git worktrees.

### 8. Root dev launcher hardening

Harden `scripts/dev.mjs` so its behavior satisfies the runtime contract:

- spawn service commands directly rather than through shell wrappers
- preserve current default ports while accepting explicit frontend/backend overrides
- pass backend `PORT` and `FRONTEND_ORIGIN`, frontend `VITE_API_URL`, and Vite strict-port configuration consistently
- give each service an exact owned process group/tree
- make shutdown idempotent
- on signal or child failure, gracefully signal the exact owned trees and await exit
- after a bounded grace period, force only the same exact owned trees and await settlement
- propagate a meaningful exit code and never rely on a fixed 150 ms `process.exit` timer

Use platform-specific exact-tree termination where necessary; do not add a broad process-kill dependency or process-name matching.

## Error handling

- Missing/mixed autonomous bases block before worktree creation or fanout.
- An unmerged preparation PR blocks implementation; an unmerged implementation PR blocks cleanup.
- Port collisions fail preflight or strict binding; agents do not silently migrate to an unrecorded port.
- Required Playwright verification that cannot run leaves the slice incomplete with the exact blocker.
- Browser close, owned process shutdown, or port-release failure leaves the slice incomplete and reports the exact owned resource.
- Dirty or unmerged worktrees are preserved for human recovery.
- Publication failures preserve safe local work and report what exists and what does not; no force-push, auto-merge, or destructive reset is permitted.

## Verification strategy

- Establish failing baseline scenarios before each canonical skill change, then revise the skill and re-run the scenarios.
- Run `npm run skills:ai-sync`; require `.cursor/skills`, `.agents/skills`, and `.claude/skills` to remain byte-identical.
- Add focused Node process-manager tests covering clean shutdown, child failure, repeated signals, bounded escalation, exact-tree targeting, port propagation, and collision behavior; include them in the repository quality gate without duplicating the Vitest suite.
- Verify documentation has no stale references to removed parallel skills or hard-coded autonomous `main` bases.
- Exercise prepare, implement-all, fanout, defer, and cleanup contract scenarios against disposable fixtures or test repositories.
- For browser-risk implementation slices, run the mapped Playwright MCP scenarios and record `browser_close`, server-stop, and port-release evidence.
- Run fresh relevant checks and `npm run quality:check` before completion claims.

## Scope

- `AGENT-SKILLS.md` operator map and skill catalog
- `AGENTS.md` concise Playwright/process reminder
- PRD workflow, preparation, runtime-hygiene, navigation, and decision documentation
- canonical `.cursor/skills/thejudge-*/` contracts and synchronized `.agents/` / `.claude/` mirrors
- addition of `thejudge-defer`; removal of the two parallel skills
- `scripts/dev.mjs`, focused process tests, and quality-gate wiring

## Non-goals

- product UI, API, prompt, provider, or data behavior changes
- automatic PR merge, close, approval, or remote-branch deletion
- moving the collaborative workflow into worktrees
- slice-level parallel implementation or nested agent fleets
- persistent process-manager daemon or service
- new Playwright CI harness
- killing processes that the current agent did not start and does not own
- cleaning unrelated stale worktrees as part of implementation

## PRD alignment

- `DEC-115`: workflow responses remain terse and high-signal; this design changes lifecycle contracts, not response verbosity.
- `DEC-154`: records the approved workflow, ownership, deferral, Playwright, and runtime-cleanup model.
- No new `REQ`, `FLOW`, `NFR`, or screen-layout entry is needed because this is repository workflow/tooling rather than product behavior.

## Material assumptions

- `origin` remains the supported remote for autonomous PR publication; evidence: current autonomous contracts and GitHub workflows already use it.
- `.worktrees/` remains the only allowed repo-local autonomous worktree root; evidence: it is already gitignored and the handoff records prior lint/format pollution from tool-owned worktree directories.
- Browser verification uses the configured Playwright MCP; evidence: the tool is available in the resumed Codex session and `AGENTS.md` already names its cleanup contract.
- Exact runtime ownership can remain task-scoped and recorded in slice evidence; a persistent daemon or registry is unnecessary because no server may survive the owning invocation.

