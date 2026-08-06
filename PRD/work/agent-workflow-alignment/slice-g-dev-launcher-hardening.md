# Slice G — Root dev launcher hardening and process-manager tests

## Status: done

## Goal

Harden `scripts/dev.mjs` to satisfy the runtime-ownership contract from
Slice F (exact owned-tree targeting, idempotent awaited shutdown, bounded
escalation, explicit ports, meaningful exit codes), add focused Node
process-manager tests, and wire them into the quality gate. This is the
final slice: it also carries the PRD promotion checklist and Ship gates
block.

## Requirements

### Extract a testable process-manager module

1. Create `scripts/process-manager.mjs` exporting the owned-process-tree
   logic as plain functions/classes (no `scripts/dev.mjs`-specific service
   list inside it), so it is unit-testable in isolation:
   - Spawn a command **directly** (no `shell: true`, no string-concatenated
     command) with `stdio: "inherit"` and an explicit `env`.
   - Own an **exact process tree** per spawned service: on POSIX, spawn
     `detached: true` so the child becomes its own process group leader, and
     signal the group via `process.kill(-pid, signal)`; on Windows, use
     `taskkill /pid <pid> /T` (graceful) and `/T /F` (forced) since POSIX
     process-group signaling doesn't apply. Do not add a new npm dependency
     for this (no `tree-kill` or similar) and never match by process name.
   - Graceful shutdown: signal the exact owned tree (`SIGTERM` on POSIX,
     `taskkill /T` on Windows), then **await** that tree's exit rather than
     assuming it exited.
   - Bounded escalation: if the owned tree has not exited after a configurable
     grace period (default suitable for real dev servers; injectable/shorter
     for tests), force-kill the same exact owned tree (`SIGKILL` /
     `taskkill /T /F`) and await settlement.
   - Idempotent stop: calling stop twice (e.g. a second `SIGINT` while
     shutdown is already in progress) must not double-spawn kill signals or
     throw; it resolves once, from the first in-flight shutdown.
   - Repeated OS signals during shutdown (`SIGINT` then `SIGTERM`, or two
     `SIGINT`s) are absorbed by the same idempotency guarantee.

### Harden `scripts/dev.mjs`

2. Rewrite `scripts/dev.mjs` to use `process-manager.mjs`:
   - Replace the current `shell: true` string-concatenated spawn with a
     direct spawn of `npmExecutable` and `service.args` through the new
     owned-tree spawner.
   - Preserve current default ports (backend `3000` via `PORT`, frontend
     `5173`) while accepting explicit overrides: read `PORT` (backend) and a
     new `FRONTEND_PORT` (frontend) from `process.env`, defaulting to the
     current values when unset.
   - Pass the backend child `PORT=<backend port>` and
     `FRONTEND_ORIGIN=<process.env.FRONTEND_ORIGIN or http://localhost:<frontend port>>`.
   - Pass the frontend child `VITE_API_URL=<process.env.VITE_API_URL or
     http://localhost:<backend port>>` and the resolved frontend port so Vite
     binds to it (see `vite.config.ts` change below).
   - On `SIGINT`/`SIGTERM` or any child's unexpected exit/error: gracefully
     signal every owned tree, await exit (with the bounded-escalation
     fallback from the process manager), then call `process.exit(code)` once
     — replacing the current unconditional `setTimeout(..., 150)` blind
     exit. Propagate a non-zero code when shutdown was triggered by a child
     error or non-zero exit; `0` for a clean signal-driven shutdown.
3. `apps/frontend/vite.config.ts`: read the frontend port from
   `process.env.FRONTEND_PORT` (default `5173`) instead of the hardcoded
   `5173`, and set `server.strictPort: true` so Vite fails fast on a
   port collision instead of silently picking another port — required for
   `thejudge-implement-fanout`'s (Slice C) preflighted port assignment to be
   trustworthy.

### Tests

4. Add `scripts/process-manager.test.mjs` using Node's built-in test runner
   (`node:test` + `node:assert`) — no new test-framework dependency, and
   deliberately not the `apps/*` Vitest suites, per the design's "without
   duplicating the Vitest suite." Cover at minimum:
   - Clean shutdown: a spawned long-running owned process exits after a
     graceful signal, within the grace period, with no escalation.
   - Child failure: an owned process that exits non-zero on its own triggers
     shutdown of any sibling owned tree(s) and a non-zero propagated code.
   - Repeated signals: calling stop twice concurrently resolves once and
     does not throw or double-signal.
   - Bounded escalation: an owned process that ignores the graceful signal
     is force-killed only after the grace period elapses, and the promise
     resolves once it actually exits (use a short injected grace period so
     the test stays fast).
   - Exact-tree targeting: only the intentionally spawned owned tree is
     signaled — assert a sibling process not registered as owned is left
     untouched (e.g. spawn one owned and one deliberately unmanaged process
     in the test, stop only the owned one, assert the unmanaged one is still
     alive, then clean it up in the test itself).
   - Port propagation / collision behavior: given a port already bound by a
     test listener, spawning a service configured for `strictPort`-style
     behavior on that port surfaces a clear failure rather than silently
     migrating to a different port.
5. Add an npm script `"test:scripts": "node --test scripts/*.test.mjs"` to
   `package.json`.
6. Wire `test:scripts` into the quality gate: append `&& npm run
   test:scripts` to both the `test` script and the `quality:check` script in
   `package.json`, after the existing chain.

### Worktree ignore invariant

7. Verify — and, for any config this slice adds or edits, preserve — the
   invariant that **every ignore-consuming tool config excludes agent
   worktree roots**: both the repo-local `.worktrees/` root that Slices B
   and C mandate, and `**/.claude/worktrees/**`, which the Claude Code
   harness creates for subagent isolation and which no repo setting can
   relocate. Current carriers are `eslint.config.mjs` (`ignores`) and
   `.prettierignore`; both were fixed in `336d1e8` after `npm run lint`
   produced 905 `tsconfigRootDir` parsing errors and `format:check` flagged
   42 files, all sourced from two `.claude/worktrees/agent-*` checkouts.
   This invariant matters more once Slices B and C move autonomous worktrees
   into the repo-local `.worktrees/` root: today most historical worktrees
   sat in a sibling directory outside the repo, which is the only reason
   they never polluted the gate. State the invariant in
   `PRD/instructions/runtime-process-hygiene.md` (Slice F) so a future
   config addition does not silently regress it. Do not add a quality-gate
   check that fails on worktrees existing outside `.worktrees/` — that would
   contradict this design's non-goal about not policing unrelated stale
   worktrees; enforcement belongs at creation time in the Slice B/C
   preflights.

### Final-slice duties

8. Append the Ship gates block (from this skill's `reference.md`) to the
   bottom of this slice doc, below "Files touched".
9. Confirm the PRD promotion checklist (executed by `thejudge-cleanup`, not
   this slice): `DEC-154` in `PRD/sections/decisions/doc-process.md` already
   records the full approved design and needs no edit at cleanup; no
   `PRD/sections/system-map.md` entry is added, per `DEC-154`'s own Notes
   (repository workflow tooling, not a product/code subsystem); the receipt
   at `PRD/instructions/receipts/agent-workflow-alignment-<date>.md` must
   list every file this GAMEPLAN's slices created, edited, or deleted.

## Acceptance criteria

- [ ] `node --test scripts/*.test.mjs` passes locally, covering all six
      scenarios above
- [ ] `npm run quality:check` runs `test:scripts` as part of its chain and is
      green
- [ ] `scripts/dev.mjs` spawns services without `shell: true` and without a
      fixed-delay blind `process.exit`
- [ ] Starting `npm run dev` with `PORT=4000 FRONTEND_PORT=4173` binds the
      backend and frontend to those ports (manual check: hit
      `http://localhost:4000` and `http://localhost:4173`, then `Ctrl-C` and
      confirm both processes exit and the ports are free — `lsof -i :4000`
      and `lsof -i :4173` return nothing after shutdown)
- [ ] `apps/frontend/vite.config.ts` has `server.strictPort: true` and reads
      `FRONTEND_PORT`

## Verification

```bash
node --test scripts/*.test.mjs
npm run quality:check
grep -n "shell: true" scripts/dev.mjs; test $? -eq 1
grep -n "strictPort" apps/frontend/vite.config.ts
```

## Files touched

- `scripts/process-manager.mjs` (new)
- `scripts/process-manager.test.mjs` (new)
- `scripts/dev.mjs`
- `apps/frontend/vite.config.ts`
- `package.json`

## Ship gates

- [x] Slice acceptance criteria satisfied and verified
- [x] Tests updated; `npm run quality:check` green for touched areas
- [x] Public contract unchanged unless slice scoped a change
- [x] No secrets committed
- [x] Durable outcomes promoted; `PRD/work/agent-workflow-alignment/` ready to delete

### PRD promotion checklist (executed by `thejudge-cleanup`, not this slice)

- `DEC-154` in `PRD/sections/decisions/doc-process.md` already records the full
  approved design and needs no edit at cleanup.
- No `PRD/sections/system-map.md` entry is added, per `DEC-154`'s own Notes —
  this is repository workflow tooling, not a product/code subsystem.
- The receipt at
  `PRD/instructions/receipts/agent-workflow-alignment-<date>.md` must list
  every file this GAMEPLAN's slices created, edited, or deleted.
