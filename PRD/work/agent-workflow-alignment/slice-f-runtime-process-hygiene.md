# Slice F — Playwright verification and runtime process hygiene

## Status: planned

## Goal

Create the focused `PRD/instructions/runtime-process-hygiene.md` authority
covering when Playwright MCP is required and the browser/dev-server
ownership-and-cleanup contract, then wire `AGENTS.md`,
`workflow-reference.md`, and the affected skills to it.

## Requirements

### New authority doc

1. Create `PRD/instructions/runtime-process-hygiene.md` with two sections:

   **`## Playwright verification policy`** — required when either holds:
   the user explicitly requests browser/Playwright verification (even if
   automated tests might otherwise suffice), or the change has
   browser-observable risk component tests cannot establish: responsive
   geometry, containment, overlays/stacking, hit areas, focus/keyboard
   behavior, scrolling, navigation/persistence, browser APIs, or integrated
   multi-screen behavior. Not automatically required for documentation,
   backend-only work, pure logic/data changes, or simple UI copy already
   covered by component tests, unless requested. State that `thejudge-map-out`
   encodes exact browser scenarios, viewports, observations/measurements, and
   cleanup checks directly in affected slices' acceptance criteria; unit/
   component tests remain required where appropriate and Playwright does not
   replace them; no new `@playwright/test` CI harness is introduced by this
   policy.

   **`## Runtime ownership and cleanup contract`** — every browser/dev-server
   session records: owning agent/tool session handle, worktree, frontend and
   backend ports, whether each server was started by the agent or attached
   to, browser-close/owned-process-stop/port-release results, and the
   screenshot/capture output path (or `none` when nothing was captured).
   Autonomous
   agents always start isolated servers on their assigned ports.
   Collaborative agents may attach to a verified server for the current
   checkout but must never stop an attached or otherwise user-owned process.
   Before any owning invocation ends — including failure or blocker paths —
   it must, in order: (1) call `browser_close` after the last browser
   interaction, (2) stop servers through the exact owning session/process
   handle, (3) wait for the exact owned process tree to exit, (4) verify
   owned ports are released, (5) record the result in slice verification
   evidence and the terminal report. An ownership or cleanup failure prevents
   the slice from becoming `done` and the package from becoming
   `ship-ready`; the agent reports the exact remaining handle, process, or
   port as a blocker. Prohibited: `nohup`, untracked background `&`, broad
   `pkill`/`killall`, and stopping pre-existing user-owned servers. Allowed:
   exact owned-tree escalation after a bounded graceful-shutdown window.
   Runtime cleanup happens at the end of every owning task, not only at final
   package cleanup; final package cleanup (`thejudge-cleanup`, Slice D)
   additionally verifies this recorded evidence before removing Git
   worktrees.

   **`## Capture output location`** — screenshots and other browser captures
   go to `PRD/work/<slug>/.playwright-mcp/` (create it if absent), resolved
   against **the current checkout root**: the worktree root for autonomous
   runs (`.worktrees/implement-<slug>/PRD/work/<slug>/.playwright-mcp/`), the
   main checkout for collaborative and interactive runs. Never the repo root
   — `.gitignore`'s `/*.png` hides root captures rather than preventing them,
   so a root drop is invisible clutter rather than a visible diff. Fallback
   when no package folder is in scope (a one-off check outside the
   lifecycle): the root-level `.tmp/` or `.playwright-mcp/` ignored folder.
   When several packages are active, use the package the current task belongs
   to; if the task belongs to none, use the fallback. Captures are disposable:
   `thejudge-cleanup` deletes the package folder — and for autonomous packages
   the worktree — removing them with no separate retention policy. Do not copy
   captures out of the package folder to preserve them; record the observation
   or measurement as text in slice verification evidence instead. State that
   no `.gitignore` change is needed, because `.playwright-mcp/` and `.tmp/`
   are unanchored patterns already matching at any depth, and that captures
   therefore never appear in `git status --porcelain` (see Slice D's
   clean-worktree proof).

### Wire existing docs to it

2. `AGENTS.md`: replace the current "Playwright MCP Cleanup" section body
   with a concise reminder (call `browser_close`, don't leave sessions open
   across tasks, don't `pkill` mid-session unless asked, write captures to
   `PRD/work/<slug>/.playwright-mcp/` in the current checkout with root
   `.tmp/` as the no-package fallback) plus a link to
   `PRD/instructions/runtime-process-hygiene.md` for the full contract. Do
   not delete the existing "session-end hooks handle orphaned
   `ms-playwright` trees" note — keep it, since it documents host-level
   behavior this doc doesn't own. Match the shape already written into
   `CLAUDE.md` and `.cursor/rules/playwright-mcp-cleanup.mdc` by the
   `root-playwright-screenshot-hygiene` package (concise self-sufficient
   rule + link), so all three host-config files agree. If that package has
   not landed yet, write `AGENTS.md` in this shape anyway — the rule text is
   self-sufficient and does not depend on their edit.
3. `PRD/instructions/workflow-reference.md` "Related material" section: add
   a bullet pointing to `runtime-process-hygiene.md` for the Playwright and
   runtime-ownership contract.

### Wire affected skills

4. `.cursor/skills/thejudge-map-out/SKILL.md` (this skill) "Reads": add
   `PRD/instructions/runtime-process-hygiene.md`. "Gates": add — "For any
   slice with browser-observable risk per `runtime-process-hygiene.md`,
   encode the exact scenarios, viewports, and observations/measurements to
   check as acceptance criteria, plus a cleanup-evidence acceptance criterion
   (browser closed, owned server(s) stopped, ports released, capture output
   path recorded)." Do the same
   addition to this slice's own template guidance in `reference.md`'s slice
   doc template comment, if the template needs an example acceptance-criteria
   line for browser-risk slices — add one commented example line, not a
   required field for every slice.
5. `.cursor/skills/thejudge-implement/SKILL.md` "Gates": add — "A slice with
   browser or dev-server acceptance criteria is not `done` until
   `runtime-process-hygiene.md`'s cleanup contract evidence (browser-close,
   process-stop, port-release, capture output path) is recorded, and the
   recorded capture path resolves under the active package folder or the
   documented fallback; an unresolved ownership/cleanup failure keeps the
   slice `blocked`, not `done`."
6. `.cursor/skills/thejudge-implement-all/SKILL.md` "Slice loop" step 4-5
   region: add the same cleanup-evidence requirement before a slice is
   marked `done`, and note that this skill's isolated worktree always starts
   its own dev server(s) on ports it owns (never attaches to a pre-existing
   one, since worktrees are isolated checkouts) and writes captures under its
   own worktree's `PRD/work/<slug>/.playwright-mcp/`. The terminal report
   names the capture path while the worktree still exists, since cleanup
   removes the worktree and the captures with it.
7. `.cursor/skills/thejudge-cleanup/SKILL.md`: confirm the "Autonomous
   merge-proof gate" added in Slice D correctly cites
   `PRD/instructions/runtime-process-hygiene.md` by its real path (it does,
   from Slice D's wording) — no further edit needed here beyond verifying the
   citation resolves once this slice lands.
8. Run `npm run skills:ai-sync` and verify byte-identical trees.

## Acceptance criteria

- [ ] `PRD/instructions/runtime-process-hygiene.md` exists with all three
      sections — Playwright policy, runtime ownership/cleanup contract, and
      capture output location — matching `DEC-154`'s Impact list
- [ ] The capture-location section states the per-package destination, that
      it resolves against the current checkout root (worktree for autonomous
      runs), the root `.tmp/`/`.playwright-mcp/` fallback, and that captures
      are deleted with the package folder
- [ ] `AGENTS.md` links to the new doc and keeps its concise local reminder,
      including the capture destination and fallback
- [ ] `thejudge-map-out`, `thejudge-implement`, and `thejudge-implement-all`
      each reference the cleanup-evidence requirement (including capture
      output path) or the Playwright scenario-encoding requirement as
      applicable
- [ ] `thejudge-cleanup`'s Slice D citation of
      `PRD/instructions/runtime-process-hygiene.md` resolves to a real file
- [ ] `npm run skills:ai-sync` run; all three skill trees byte-identical

## Verification

```bash
test -f PRD/instructions/runtime-process-hygiene.md
grep -n "runtime-process-hygiene.md" AGENTS.md PRD/instructions/workflow-reference.md .cursor/skills/thejudge-cleanup/SKILL.md
grep -n "Capture output location" PRD/instructions/runtime-process-hygiene.md
grep -n "browser_close\|cleanup-evidence\|owned process tree" .cursor/skills/thejudge-map-out/SKILL.md .cursor/skills/thejudge-implement/SKILL.md .cursor/skills/thejudge-implement-all/SKILL.md
grep -n "playwright-mcp" AGENTS.md .cursor/skills/thejudge-implement/SKILL.md .cursor/skills/thejudge-implement-all/SKILL.md
npm run skills:ai-sync
diff -rq .cursor/skills .agents/skills
diff -rq .cursor/skills .claude/skills
```

## Files touched

- `PRD/instructions/runtime-process-hygiene.md` (new)
- `AGENTS.md`
- `PRD/instructions/workflow-reference.md`
- `.cursor/skills/thejudge-map-out/SKILL.md`, `.cursor/skills/thejudge-map-out/reference.md`
- `.cursor/skills/thejudge-implement/SKILL.md`
- `.cursor/skills/thejudge-implement-all/SKILL.md`
- Synced mirrors under `.agents/skills/` and `.claude/skills/` for every skill above
