---
name: thejudge-implement-codex
description: >-
  Implements TheJudge work-package slices by delegating the heavy coding to the
  Codex CLI (codex exec) while the orchestrator plans, dispatches waves
  concurrently, and verifies every result inline. Use from Claude Code or Cursor
  when a work folder has a GAMEPLAN and slices and you want to conserve
  orchestrator tokens. Not for the Codex runtime itself.
---

# TheJudge Implement (Codex-delegated)

## Goal

Execute existing implementation slices from `PRD/work/<slug>/` by delegating the
heavy code reading/writing to the Codex CLI, while this agent stays the
orchestrator: plan, dispatch, **independently verify**, and update status.

This is the Codex-delegation flavor of `thejudge-implement`. It is
orchestrator-only — it drives the `codex` CLI, so it does **not** run inside the
Codex runtime. In Codex, use plain `thejudge-implement`.

## Inputs

User provides a work slug or `PRD/work/<slug>/`.

Optional: a specific slice letter, slice doc path, or wave number. If omitted,
select the earliest wave (or earliest slice) whose status is not `done`.

## Required reads (orchestrator reads these itself)

1. `PRD/work/<slug>/README.md` (slice table + wave plan)
2. `PRD/work/<slug>/GAMEPLAN.md`
3. The selected wave's `PRD/work/<slug>/slice-*.md` docs
4. `Files touched` for each selected slice
5. Relevant existing tests and local code patterns

Read other PRD files only when a selected slice references them or a decision
check is needed. Do not delegate this orientation read — the orchestrator must
know what "done" means before dispatching.

## Process

1. Identify the target wave (or single slice) and confirm every slice's
   dependencies are already `done`.
2. Confirm same-wave slices have disjoint `Files touched`. **If two slices in
   the wave touch the same file, run them sequentially, not in parallel.**
3. Mark each selected slice `Status: in-progress`.
4. For each slice, build a Codex prompt (see below) and dispatch a `codex exec`
   run. Independent slices in a wave → dispatch as concurrent background runs.
5. When a run returns, **the orchestrator re-runs that slice's verification
   commands itself.** Codex's own success claim does not count.
6. Mark a slice `Status: done` only after the orchestrator's own verification is
   green. Otherwise keep `in-progress`, or `blocked` if unresolvable in-session.
7. Update `PRD/work/<slug>/README.md` slice table / wave status.
8. Report, per slice: changed files, the verification command this agent ran and
   its result, and the next wave/slice.

## Delegating to Codex

Use the `codex` CLI from the repo root. Capture the final message with `-o`.

**Always redirect stdin from `/dev/null` (`</dev/null`).** The prompt is passed as
an argument, so Codex needs nothing from stdin — but if stdin is an open pipe
(which it is when dispatched as a background run), `codex exec` treats it as
piped input and blocks forever on "Reading additional input from stdin...",
never starting the task and never exiting. `</dev/null` gives it immediate EOF.

- **Exploration / code investigation** (read-only sandbox):

  ```bash
  codex exec -C "$REPO_ROOT" -s read-only \
    -o "$SCRATCH/explore-<topic>.txt" "<question or investigation task>" </dev/null
  ```

- **Slice implementation** (workspace-write sandbox):

  ```bash
  codex exec -C "$REPO_ROOT" -s workspace-write \
    -o "$SCRATCH/slice-<letter>.txt" "<slice implementation prompt>" </dev/null
  ```

- **Concurrent wave**: launch one background `codex exec` per independent slice,
  then collect each `-o` output as it finishes.

### What the Codex prompt must contain

- The exact slice doc path and the GAMEPLAN path; tell Codex to read them.
- "Implement ONLY slice `<letter>`; do not touch other slices' files."
- The slice's `Files touched` and its verification command(s).
- The binding constraints from this skill's Implementation rules (paste the
  relevant ones — Codex does not load TheJudge skills).
- An instruction to run the slice verification and report the command + result.

## Implementation rules (apply to the orchestrator AND every Codex prompt)

- Follow `GAMEPLAN.md` and the selected slice doc; do not regenerate them.
- Keep edits limited to the selected slice unless a dependency forces a small supporting change.
- Preserve active product decisions and `PRD/instructions/technical-design-rules.md`.
- Preserve stack ordering semantics across UI, API, prompt, and tests.
- Do not change API request/response shapes unless the slice cites a confirmed decision requiring it.
- Do not add product-facing endpoints unless the slice cites a confirmed decision requiring it.
- Do not implement deterministic rules-engine, legality validation, or board-state simulation behavior.
- Any Scryfall download or network refresh requires explicit human approval before running — **never delegate that approval to Codex.**
- Do not commit changes unless the user explicitly asks for a commit.

## Verification is non-delegable

The orchestrator owns the truth. Re-run the slice's verification commands in this
session and read the output before claiming anything.

| Rationalization | Reality |
| --- | --- |
| "Codex said tests pass" | Codex ran in its own sandbox; re-run them here and read the output. |
| "Codex reported done, so mark it done" | `done` requires the orchestrator's own green verification. |
| "Re-running wastes the tokens I saved" | Verification is cheap; shipping unverified Codex output is the expensive failure. |
| "The diff looks right" | Looking ≠ running. Run the command. |
| "All wave runs returned, so the wave is done" | Verify each slice independently before any `done`. |

## Status conventions

Slice docs use `planned` / `in-progress` / `done` / `blocked`. Prefer a single
status line near the top:

```markdown
## Status: in-progress
```

If a slice uses another existing status format, preserve it and update only the value.

## Do not

- Run `thejudge-map-out` or `thejudge-map-out-parallel`
- Rewrite `GAMEPLAN.md` or slice docs except for status/progress notes
- Dispatch slices in parallel when their `Files touched` overlap
- Mark a slice `done` on Codex's word alone
- Run cleanup or delete `PRD/work/<slug>/`
- Promote durable PRD truth; leave that for `thejudge-cleanup`

## Handoff

When the selected slices are done, end with **Next step** — all three platforms,
in order: Cursor, Codex, Claude Code. Substitute `<slug>` and slice/wave from
this session. Templates: `PRD/instructions/workflow-reference.md` (Handoff blocks).

- More waves/slices remain → next skill: `thejudge-implement-codex` (Cursor/Claude) or `thejudge-implement` (Codex) with the next wave/slice
- All slices done → next skill: `thejudge-cleanup`
