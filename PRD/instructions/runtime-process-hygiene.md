# Runtime Process Hygiene

Authority for when browser verification is required, and for the ownership and
cleanup contract covering every browser session and dev server an agent starts
or attaches to.

## Playwright verification policy

Playwright MCP verification is **required** when either holds:

1. The user explicitly requests browser or Playwright verification — even if
   automated tests might otherwise suffice.
2. The change carries browser-observable risk that component tests cannot
   establish: responsive geometry, containment, overlays and stacking, hit
   areas, focus and keyboard behavior, scrolling, navigation or persistence,
   browser APIs, or integrated multi-screen behavior.

It is **not** automatically required for documentation, backend-only work, pure
logic or data changes, or simple UI copy already covered by component tests —
unless the user requests it.

`thejudge-map-out` encodes the exact browser scenarios, viewports,
observations and measurements, and cleanup checks directly in the affected
slices' acceptance criteria. Unit and component tests remain required where
appropriate; Playwright does not replace them. This policy introduces no new
`@playwright/test` CI harness.

## Runtime ownership and cleanup contract

Every browser or dev-server session records:

- the owning agent/tool session handle
- the worktree it belongs to
- the frontend and backend ports
- whether each server was **started by the agent** or **attached to**
- the `browser_close`, owned-process-stop, and port-release results
- the screenshot/capture output path, or `none` when nothing was captured

Autonomous agents always start isolated servers on their assigned ports.
Collaborative agents may attach to a verified server for the current checkout,
but must never stop an attached or otherwise user-owned process.

Before any owning invocation ends — including failure and blocker paths — it
must, in order:

1. Call `browser_close` after the last browser interaction.
2. Stop servers through the exact owning session/process handle.
3. Wait for the exact owned process tree to exit.
4. Verify the owned ports are released.
5. Record the result in slice verification evidence and the terminal report.

An ownership or cleanup failure prevents the slice from becoming `done` and the
package from becoming `ship-ready`; the agent reports the exact remaining
handle, process, or port as a blocker.

**Prohibited:** `nohup`, untracked background `&`, broad `pkill`/`killall`, and
stopping pre-existing user-owned servers.
**Allowed:** exact owned-tree escalation after a bounded graceful-shutdown
window.

Runtime cleanup happens at the end of every owning task, not only at final
package cleanup. Final package cleanup (`thejudge-cleanup`) additionally
verifies this recorded evidence before removing Git worktrees.

## Capture output location

Screenshots and other browser captures go to
`PRD/work/<slug>/.playwright-mcp/` (create it if absent), resolved against
**the current checkout root**:

- autonomous runs — `.worktrees/implement-<slug>/PRD/work/<slug>/.playwright-mcp/`
- collaborative and interactive runs — the main checkout

Never the repo root. `.gitignore`'s `/*.png` hides root captures rather than
preventing them, so a root drop is invisible clutter rather than a visible
diff.

Fallback when no package folder is in scope (a one-off check outside the
lifecycle): the root-level `.tmp/` or `.playwright-mcp/` ignored folder. When
several packages are active, use the package the current task belongs to; if
the task belongs to none, use the fallback.

Captures are disposable. `thejudge-cleanup` deletes the package folder — and,
for autonomous packages, the worktree — removing them with no separate
retention policy. Do not copy captures out of the package folder to preserve
them; record the observation or measurement as text in slice verification
evidence instead.

No `.gitignore` change is needed: `.playwright-mcp/` and `.tmp/` are unanchored
patterns that already match at any depth. Captures therefore never appear in
`git status --porcelain`, which is what makes `thejudge-cleanup`'s
clean-worktree proof safe.

## Worktree location and tooling isolation

Agent-created worktrees live only under the repo-local `.worktrees/` root:
`prepare-<slug>` and `implement-<slug>`. The `thejudge-prepare` and
`thejudge-implement-all` preflights refuse any other path, including sibling
`../<repo>-worktrees/` directories and temp/scratchpad paths.

One exception is not repo-controllable: the Claude Code harness creates
`**/.claude/worktrees/agent-*` for subagent isolation, and no repo or
`.claude/settings.json` option relocates it. That path is tolerated rather than
refused.

Because both roots are full repo checkouts whose files sit under no workspace
tsconfig, **every ignore-consuming tool config must exclude both**. The current
carriers are `eslint.config.mjs` (`ignores`) and `.prettierignore`, fixed in
`336d1e8` after `npm run lint` produced 905 `tsconfigRootDir` parsing errors
and `format:check` flagged 42 files, all sourced from two
`.claude/worktrees/agent-*` checkouts. Adding a new ignore-consuming config
without these entries is a regression.

Enforcement of worktree location happens **at creation time** in the
`thejudge-prepare` and `thejudge-implement-all` preflights — never as a
quality-gate check over pre-existing worktrees.
