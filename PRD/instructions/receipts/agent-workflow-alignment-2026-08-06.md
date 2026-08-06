# Receipt — agent-workflow-alignment

- Date: 2026-08-06
- Slug: `agent-workflow-alignment`
- Status: shipped

## Actions taken

- [x] Verified Slice A: `.cursor/skills/thejudge-map-out-parallel/` and `.cursor/skills/thejudge-implement-parallel/` (and their `.agents`/`.claude` mirrors) are deleted; `AGENT-SKILLS.md`, `PRD/instructions/requirement-format.md`, and `PRD/instructions/workflow-reference.md` no longer mention either skill outside the durable historical receipt; `npm run skills:ai-sync` run and mirrors byte-identical.
- [x] Verified Slice B: `thejudge-prepare/SKILL.md` and `reference.md` require an explicit `--base` argument, never default to `main`, and record `## Autonomous metadata` / `Autonomous base: origin/<branch>` in the package README per `preparation-contract.md`'s new sections (`## Autonomous base`, worktree retention).
- [x] Verified Slice C: `thejudge-implement-all` inherits the package's recorded autonomous base instead of `origin/main` for preflight, worktree base, and PR base; its preflight verifies and removes a merged/clean `.worktrees/prepare-<slug>`; `thejudge-implement-fanout` requires a common recorded base across dispatched packages and assigns explicit, preflighted, unique port pairs.
- [x] Verified Slice D: `thejudge-cleanup/SKILL.md` states the four-condition "Autonomous merge-proof gate" (branch equals recorded base, PR merged into that base via `gh pr view`, implementation worktree clean and fully merged, runtime-cleanup evidence passing), refuses cleanup naming the exact unmet condition, never deletes a remote branch, and exempts collaborative packages with no `## Autonomous metadata` section — confirmed via this run, which is itself a collaborative package with no such section and therefore only the ordinary status gate applied.
- [x] Verified Slice E: `.cursor/skills/thejudge-defer/SKILL.md` exists (synced to `.agents/`/`.claude/`), defines both toggle directions and both refusal conditions (`ship-ready`, `active` with an `in-progress` slice); `workflow-reference.md` has a `deferred` status-table row and a `thejudge-defer` skill-duties row; `AGENT-SKILLS.md` lists the final ten-skill catalog.
- [x] Verified Slice F: `PRD/instructions/runtime-process-hygiene.md` exists with all four sections (Playwright verification policy, runtime ownership/cleanup contract, capture output location, worktree location/tooling isolation); `AGENTS.md`, `workflow-reference.md`, `thejudge-map-out`, `thejudge-implement`, and `thejudge-implement-all` are wired to it; `thejudge-cleanup`'s Slice D citation resolves.
- [x] Verified Slice G: `scripts/process-manager.mjs` implements direct spawns, exact owned-tree signaling (POSIX process-group / Windows `taskkill /T`), awaited graceful shutdown, bounded escalation, and idempotent stop; `scripts/dev.mjs` uses it, accepts `PORT`/`FRONTEND_PORT` overrides, and exits with a propagated code instead of a fixed 150ms timer; `apps/frontend/vite.config.ts` reads `FRONTEND_PORT` and sets `server.strictPort: true`; `scripts/process-manager.test.mjs` covers all six required scenarios (`node --test scripts/*.test.mjs`: 7/7 pass); `test:scripts` is wired into both `test` and `quality:check` in `package.json`.
- [x] Re-ran `node --test scripts/*.test.mjs` (7/7 pass) and `npm run quality:check` (exit 0, includes lint, typecheck, format:check, coverage:check, and `test:scripts`) at cleanup time.
- [x] Confirmed `diff -rq .cursor/skills .agents/skills` and `diff -rq .cursor/skills .claude/skills` produce no output (canonical skill trees remain byte-identical).
- [x] Confirmed `grep -rn "map-out-parallel\|implement-parallel"` across the repo returns only the durable historical receipt (`skill-output-token-tuning-2026-06-25.md`) and this package's own now-deleted work docs — no live documentation references the removed skills.
- [x] Confirmed `DEC-154` (`PRD/sections/decisions/doc-process.md`) already records the full approved design verbatim and required no edit at cleanup; confirmed its own Notes state no `system-map.md` entry is added because this is repository workflow/agent tooling, not a product/code subsystem — no system-map promotion performed, per that explicit exemption.
- [x] Confirmed the package has no `## Autonomous metadata` section (implemented in the current checkout on `feature/agent-flow`, per the design's collaborative-path default and the package's own bootstrap note) — the autonomous merge-proof gate did not apply; only the ordinary `ship-ready` status gate governed this cleanup.
- [x] Reviewed the implementation and work-package files for secret-like patterns (`API_KEY`/`SECRET`/`TOKEN`/`PASSWORD`); none found.
- [x] Removed the `agent-workflow-alignment` row from `PRD/work/STATUS.md`.
- [x] Deleted `PRD/work/agent-workflow-alignment/` after durable promotion (none required beyond this receipt) and receipt creation.

## Files created

- `PRD/instructions/receipts/agent-workflow-alignment-2026-08-06.md`
- `.cursor/skills/thejudge-defer/SKILL.md` (+ `.agents/`, `.claude/` mirrors)
- `PRD/instructions/runtime-process-hygiene.md`
- `scripts/process-manager.mjs`
- `scripts/process-manager.test.mjs`

## Files deleted

- `.cursor/skills/thejudge-map-out-parallel/` (`SKILL.md`, `reference.md`) + `.agents/`, `.claude/` mirrors
- `.cursor/skills/thejudge-implement-parallel/` (`SKILL.md`, `reference.md`) + `.agents/`, `.claude/` mirrors
- `PRD/work/agent-workflow-alignment/` (entire work folder, this cleanup)

## Files updated

- `AGENT-SKILLS.md`
- `AGENTS.md`
- `PRD/instructions/requirement-format.md`
- `PRD/instructions/workflow-reference.md`
- `PRD/instructions/preparation-contract.md`
- `PRD/work/STATUS.md` (row removed)
- `.cursor/skills/thejudge-prepare/SKILL.md`, `reference.md` (+ mirrors)
- `.cursor/skills/thejudge-implement-all/SKILL.md`, `reference.md` (+ mirrors)
- `.cursor/skills/thejudge-implement-fanout/SKILL.md` (+ mirrors)
- `.cursor/skills/thejudge-implement/SKILL.md` (+ mirrors)
- `.cursor/skills/thejudge-cleanup/SKILL.md` (+ mirrors)
- `.cursor/skills/thejudge-map-out/SKILL.md`, `reference.md` (+ mirrors)
- `.cursor/skills/thejudge-kickoff/reference.md` (+ mirrors)
- `.cursor/skills/thejudge-quality-check/SKILL.md` (+ mirrors)
- `scripts/dev.mjs`
- `apps/frontend/vite.config.ts`
- `package.json`

## Verification

- `node --test scripts/*.test.mjs` — 7/7 pass
- `npm run quality:check` — exit 0 (typecheck, lint, format:check, coverage:check, test:scripts all green)
- `diff -rq .cursor/skills .agents/skills` / `diff -rq .cursor/skills .claude/skills` — no output
- `grep -rn "map-out-parallel\|implement-parallel"` — only the durable historical receipt remains
- `grep -n "Autonomous metadata" PRD/work/agent-workflow-alignment/README.md` — no match (collaborative package; autonomous merge-proof gate not applicable)
- `grep -n "origin/main\|targeting main"` across `thejudge-prepare`, `thejudge-implement-all`, `preparation-contract.md` — no match

## PRD promotion

No `sections/*.md` edits were required: `DEC-154` (`PRD/sections/decisions/doc-process.md`) already records the full approved design verbatim (written during refinement), and its own Notes state no `system-map.md` entry is added because this package is repository workflow/agent tooling rather than a product/code subsystem.
