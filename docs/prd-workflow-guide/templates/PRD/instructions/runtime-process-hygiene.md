# runtime-process-hygiene.md

> Only needed if agents start browsers, dev servers, or other long-lived
> processes. Delete this file if they do not.

## Purpose

Two things: when browser verification is actually required, and who owns and
cleans up every process an agent starts.

## Browser verification policy

Browser verification is required when either holds:

1. The user explicitly asks for it.
2. The change carries browser-observable risk — responsive geometry,
   containment or overflow, overlays and stacking, hit areas, focus or keyboard
   behavior, scrolling, navigation or persistence, browser APIs, or behavior
   that differs across viewport classes.

It is **not** automatically required for documentation, backend-only changes,
pure logic or data changes, or simple copy changes already covered by component
tests.

Requiring it everywhere is as bad as never requiring it: runs get slow, agents
start skipping the step, and the signal is lost.

## Runtime ownership record

For any slice that starts a runtime, record in the slice's verification
evidence:

- the owning agent or tool session handle
- the worktree it ran in
- the ports used
- for each process: started-by-agent, or attached-to-existing
- the result of browser close, owned-process stop, and port release
- the capture path, or `none`

## Cleanup order

Before the owning invocation ends, in this order:

1. Close the browser session.
2. Stop servers using the exact owning session or process handle.
3. Wait for the owned process tree to exit.
4. Verify the owned ports are released.
5. Record the results in the slice's verification evidence.

## Prohibited

- `nohup`, or untracked background `&`
- broad `pkill` / `killall`
- stopping a server the user started
- leaving a browser session open across unrelated tasks

## Capture output location

- Inside an active work package: `PRD/work/<slug>/.playwright-mcp/`
- Inside an agent worktree: the same path within that worktree
- With no package in scope: a git-ignored root-level `.tmp/`
- **Never** the repository root

## Worktree and tooling isolation

- Agent worktrees live under a single predictable root, e.g. `.worktrees/`.
- Exclude that root in your lint and format ignore files. A worktree contains a
  full copy of the repository; without the exclusion every check runs twice and
  reports duplicated findings.
- Add capture directories to `.gitignore`.
