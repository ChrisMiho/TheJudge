# GAMEPLAN — agent workflow alignment

## Architecture

This package edits repository workflow tooling only: `thejudge-*` skill
contracts (canonical `.cursor/skills/`, synced to `.agents/skills/` and
`.claude/skills/` via `npm run skills:ai-sync`), `PRD/instructions/*.md`
process docs, `AGENT-SKILLS.md`/`AGENTS.md` operator docs, and
`scripts/dev.mjs` plus new focused process-manager tests. No `apps/frontend`
or `apps/backend` product code, API contract, prompt assembly, or data
handling changes. `DESIGN-BRIEF.md` and `DEC-154`
(`PRD/sections/decisions/doc-process.md`) are the approved-design source of
truth; slices implement that decision's Impact list verbatim.

## Data flow

Slices are strictly sequential — each depends on the previous slice's file
state, all in one package, one agent, no wave grouping:

1. **Slice A** prunes `thejudge-map-out-parallel` / `thejudge-implement-parallel`
   from the canonical tree and republishes the catalog map for the remaining
   skills.
2. **Slice B** rewrites `thejudge-prepare` + `preparation-contract.md` so
   preparation requires an explicit remote base and records it as durable
   package metadata.
3. **Slice C** rewrites `thejudge-implement-all` + `thejudge-implement-fanout`
   to inherit the recorded base instead of defaulting to `main`, and to
   assign preflighted per-package port pairs in fanout.
4. **Slice D** rewrites `thejudge-cleanup` to require the current branch to
   equal the recorded autonomous base and to prove the implementation PR
   merged into it before deleting an autonomous package.
5. **Slice E** adds the new `thejudge-defer` skill and its board/status
   plumbing, then republishes the catalog map at its final ten-skill state.
6. **Slice F** creates `PRD/instructions/runtime-process-hygiene.md` (Playwright
   policy + browser/dev-server ownership and cleanup contract) and wires the
   affected skills (`thejudge-map-out`, `thejudge-implement`,
   `thejudge-implement-all`, `thejudge-cleanup`, `AGENTS.md`,
   `workflow-reference.md`) to it.
7. **Slice G** hardens `scripts/dev.mjs` against the runtime contract, adds
   focused Node process-manager tests, and wires them into the quality gate.
   Carries the PRD promotion checklist and Ship gates block.

Every canonical skill edit (A, B, C, D, E, F) ends with `npm run
skills:ai-sync` and a byte-identical mirror check — that is a per-slice
acceptance criterion, not deferred to the end.

## Verification checklist

- [ ] `diff -rq .cursor/skills .agents/skills` and `diff -rq .cursor/skills .claude/skills` produce no output after every canonical skill edit
- [ ] `grep -rn "map-out-parallel\|implement-parallel"` across `.cursor/skills`, `.agents/skills`, `.claude/skills`, `AGENT-SKILLS.md`, `PRD/instructions/` returns nothing after Slice A (excluding historical receipts, which are durable and not edited)
- [ ] `grep -rn "origin/main\|targeting main" .cursor/skills/thejudge-prepare .cursor/skills/thejudge-implement-all PRD/instructions/preparation-contract.md` returns nothing after Slices B–C except explicit fallback-removal language
- [ ] `node --test scripts/*.test.mjs` is green and included in `npm run quality:check`
- [ ] `npm run quality:check` is green at the end of Slice G
- [ ] Final slice's PRD promotion checklist items are all satisfied before cleanup

## Non-goals (restated)

Product UI/API/prompt/data behavior, automatic PR merge/close/approval, moving
collaborative work into worktrees, slice-level parallel implementation, a
persistent process-manager daemon, a new Playwright CI harness, killing
processes the current agent does not own, and cleaning unrelated stale
worktrees.
