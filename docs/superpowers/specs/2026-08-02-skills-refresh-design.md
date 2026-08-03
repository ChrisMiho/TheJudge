# TheJudge Skills Refresh — Design

**Date:** 2026-08-02
**Status:** approved for planning
**Scope:** `.cursor/skills/` (canonical) + synced trees, `AGENT-SKILLS.md`, `scripts/sync-agent-skills.sh`, one narrow edit to `PRD/instructions/workflow-reference.md`, and stale global config cleanup.

## Motivation

The `thejudge-*` skills were authored between 2026-05-21 and 2026-07-04. They work, and the workflow they encode is sound. What has aged is the *calibration*: they were written for models that needed exhaustive read lists, numbered procedure narration, anti-rationalization tables, and response-length coaching.

The workflow stays. The scaffolding around it gets rewritten from a blank page.

This is a recalibration, not a redesign. The pipeline, the skill names, the three-runtime sync, and the PRD contract are all preserved.

## Decisions

| Decision | Choice |
|---|---|
| Approach | Contract-first rewrite, blank-page per skill |
| Invocation | Manual attach only — no model self-selection |
| Runtimes | All three: Cursor, Codex, Claude Code |
| Skill count | 8 |
| `thejudge-implement-codex` | Deleted, replaced by platform-neutral `thejudge-implement-parallel` |
| `thejudge-map-out-parallel` | Rewritten platform-neutral (was Codex-oriented) |
| Parallel skills | Stay separate from base skills — explicit choice at call site |
| `thejudge-output-guidance.md` | Deleted, along with its boilerplate reference in every skill |
| `PRD/` | Untouched except `workflow-reference.md`; receipts never edited |

## Target skill set

```
kickoff → refinement → quality-check → map-out ──────────→ implement ──────────→ cleanup
                                     └ map-out-parallel ─→ implement-parallel ──┘
```

1. `thejudge-kickoff`
2. `thejudge-refinement`
3. `thejudge-quality-check`
4. `thejudge-map-out`
5. `thejudge-map-out-parallel` — rewritten
6. `thejudge-implement`
7. `thejudge-implement-parallel` — new, replaces `thejudge-implement-codex`
8. `thejudge-cleanup`

## Skill structure

Every skill follows the same shape. Sections are omitted when empty rather than filled with filler.

```markdown
---
name: thejudge-<stage>
description: <one sentence: what it does + when to attach it>
disable-model-invocation: true
---

# <Title>

## Goal
<one or two sentences>

## Inputs
<what the user supplies>

## Reads
<paths, with the reason each is needed>

## Writes
<exact paths, ID conventions, status transitions>

## Gates
<the things that must not be violated; approval points; PASS/FAIL>

## Next step
<the literal command to run next>
```

What is deliberately **absent** compared to the current skills:

- The shared output-guidance paragraph (all 8 copies)
- Numbered "Process" narration where the model can sequence itself
- The `Rationalization | Reality` table
- Three-platform handoff blocks per skill
- Rule lists restated verbatim across sibling skills

What is deliberately **denser**:

- Exact write paths and ID conventions
- Approval gates and PASS/FAIL semantics
- Status vocabulary
- The single Next step command

## Invocation model

All 8 skills carry `disable-model-invocation: true`. The agent never self-selects a workflow skill; the operator attaches one per session.

This resolves a standing contradiction: `AGENT-SKILLS.md` has always said "attach the matching skill manually," while the flag was stripped from the skills three separate times in git history (`a957abd`, `36a24e1`, `bc5b77b`). The docs were right; the frontmatter was wrong.

**Open item for implementation:** confirm the exact opt-out mechanism for Cursor and Codex. `disable-model-invocation` is the Claude Code frontmatter key. If the other runtimes use a different key or none, document the actual behavior per runtime in `AGENT-SKILLS.md` rather than assuming parity.

## The two parallel skills

Both are rewritten to describe a *contract*, never a specific CLI.

### `thejudge-map-out-parallel`

Same output as `thejudge-map-out`, plus a wave grouping. Wave N contains every slice whose dependencies all live in waves `< N`.

Binding rules:

- Same-wave slices must have **disjoint `Files touched`**. Overlap means merge the slices or push one to a later wave.
- A single-slice wave is fine. Not everything parallelizes.
- Any slice that cannot be parallelized states why (shared file, shared migration, ordering constraint).
- Never split a cohesive change across same-wave slices just to manufacture parallelism.

Writes a wave table into `GAMEPLAN.md` and mirrors it in the work-package `README.md` slice table with wave and depends-on columns.

### `thejudge-implement-parallel`

Consumes a wave and dispatches one agent per slice using **whatever parallel-agent mechanism the host runtime provides**. Claude Code, Cursor, and Codex each have one; the skill names none of them.

Binding rules:

- The orchestrator reads the wave plan, GAMEPLAN, and each slice doc **itself** before dispatching. Orientation is not delegable — you cannot verify what you never understood.
- Every slice's dependencies must be `done` before its wave dispatches.
- Slices with overlapping `Files touched` run sequentially regardless of wave assignment.
- **Verification is non-delegable.** The orchestrator re-runs each slice's verification commands in its own session and reads the output. A subagent's success claim never promotes a slice to `done`.
- Each dispatched agent receives: the slice doc path, the GAMEPLAN path, its `Files touched`, its verification commands, the binding implementation constraints, and an explicit instruction not to touch other slices' files.

The `Rationalization | Reality` table is dropped. The rule it defended — verification is non-delegable — survives as a gate.

## `workflow-reference.md`

Currently 366 lines. 259 of them are duplication or mechanical expansion.

| Section | Lines | Disposition |
|---|---|---|
| Purpose | 4 | Keep |
| Skill Sequence mermaid | 10 | Delete — duplicate of `AGENT-SKILLS.md` |
| Platform paths + sync | 11 | Delete — duplicate of `AGENT-SKILLS.md` |
| Session Openers ×3 | 41 | Collapse to the prefix rule |
| Handoff blocks | 218 | Collapse to the prefix rule |
| Slice Doc Template | 41 | Move into `thejudge-map-out` |
| Quality-Check Checklist | 8 | Move into `thejudge-quality-check` (already duplicated there) |
| Terminology table | 8 | Move into `thejudge-cleanup` |
| Work Folder Lifecycle | 6 | Keep — shared vocabulary |
| Receipt Convention | 7 | Move into `thejudge-cleanup` (already duplicated there) |

The 218-line handoff section encodes exactly one fact:

> End with **Next step**: one sentence plus the command. Prefix is `/` in Cursor and Claude Code, `$` in Codex.

Target: ~50 lines covering purpose, the handoff prefix rule, work-folder lifecycle and status vocabulary, and a pointer to `AGENT-SKILLS.md` for paths and sync.

This is the **only** file in `PRD/` that gets edited. Receipts under `PRD/instructions/receipts/` are historical records and are never modified, even where they reference deleted skills — they correctly describe what was true when written.

## `thejudge-kickoff/reference.md`

The one sub-file in the skill tree. Survives, rewritten. It holds genuine content the skill body should not carry: source-of-truth precedence, the task → read-order table, and out-of-scope paths.

Two fixes required: its "Workflow skills (manual attach)" table lists only 6 skills and must cover all 8, and its sync note points at `AGENT-SKILLS.md` for a contract that is itself being rewritten.

## `scripts/sync-agent-skills.sh`

`CODEX_RUNTIME_EXCLUDES` exists solely to keep `thejudge-implement-codex` out of the Codex runtime. With that skill gone and its replacement platform-neutral, the exclude list is dead.

The script becomes a plain three-way mirror: `.cursor/skills/` → `.agents/skills/` + `.claude/skills/`, both identical.

## `AGENT-SKILLS.md`

Rewritten to match. Removes the orchestrator-only section, the exclude-list explanation, and the asymmetric `diff -rq` verification note. Verification simplifies to: both synced trees are byte-identical to canonical.

Keeps the sync contract (edit `.cursor/skills/` only, run `npm run skills:ai-sync`, commit all three trees), the flow diagram, and the per-skill catalog.

## Global config cleanup

Outside the repo. All three are stale or empty:

- `~/.cursor/skills/kickoff/` — **delete.** A pre-`thejudge-` copy of kickoff dated 2026-06-03. Describes the product as "a flow-validation assistant for MTG stack questions; MVP1 is closed" — framing removed by commit `2d66f20`. Points at `PRD/gameplan/`, `PRD/stories/`, `PRD/features/`, none of which exist. Being global, it loads into every Cursor session and injects obsolete product truth.
- `~/.codex/skills/kickoff/` — **delete.** Empty directory.
- `~/.agents/skills/` — **delete.** Empty directory.

Not touched: `~/.cursor/skills-cursor/` and `~/.codex/skills/.system/` are vendor-bundled. `~/.codex/rules/default.rules` has stale hardcoded `git add` allowlists from the finished `user-flow-gap-fixes` package, but it is a permission file, not agent context — out of scope.

`~/.claude/` is already clean: empty `skills/`, no global `CLAUDE.md`, no `agents/`, no `commands/`.

## Preserved specifics

These are load-bearing details earned through use. The rewrite must carry every one forward, in whichever skill owns it. This list is the guard against a blank-page rewrite silently dropping hard-won knowledge.

**PRD contract**

1. `PRD/sections/decisions.md` is a read-first **router**; `DEC` bodies live in `PRD/sections/decisions/<domain>.md`. New decisions need both a body and a router index line.
2. Stable IDs are preserved. Add new `REQ-###` / `FLOW-###` / `DEC-###` / `Q-###`; never renumber.
3. `Q-###` open questions are for genuine product ambiguity only. No scope enters from an open question without user confirmation.
4. The shipped-vs-planned signal lives **only** in `PRD/sections/system-map.md`. Never edit a `DEC` or `REQ` `Status:` field to convey it.
5. System-map promotion gate: flip an entry to `shipped` only after both code and receipt exist.

**Work package lifecycle**

6. Statuses: `ideation` → `refined` → `active` → deleted.
7. Slice statuses: `planned` / `in-progress` / `done` / `blocked`, as a single status line near the top of the slice doc. If a slice already uses another format, preserve the format and change only the value.
8. The receipt is written **before** the work folder is deleted. Receipts live at `PRD/instructions/receipts/<slug>-<YYYY-MM-DD>.md` and are durable — never deleted with the work folder.
9. Final slice carries the PRD promotion checklist and Ship gates; execution happens in cleanup.
10. Never persist plans to tool-specific plan folders. `PRD/work/` is the only work-package location.

**Implementation constraints**

11. No deterministic rules-engine, legality validation, or board-state simulation.
12. No API request/response shape changes without a cited confirmed decision.
13. No new product-facing endpoints without a cited confirmed decision.
14. Stack ordering semantics are preserved across UI, API, prompt, and tests.
15. Any Scryfall download or network refresh requires explicit human approval, and that approval is never delegated to a subagent.
16. Never commit unless the user explicitly asks.

**Process gates**

17. Refinement batches up to 3 clarifying questions per round, then presents a design summary and **waits for user approval** before writing PRD artifacts.
18. Quality-check emits PASS or FAIL. Trivial fixes only with in-session user approval.
19. Kickoff reads only `README.md` and `PRD/README.md`. It does not preload `sections/` or `instructions/`.
20. Cleanup requires `npm run quality:check` green for touched areas and no secrets committed.

**Parallel execution**

21. Same-wave slices must have disjoint `Files touched`.
22. Verification is non-delegable — the orchestrator re-runs it and reads the output before any `done`.
23. Dependencies must be `done` before a wave dispatches.

## Verification

- `npm run skills:ai-sync` runs clean.
- `diff -rq .cursor/skills .claude/skills` → no output.
- `diff -rq .cursor/skills .agents/skills` → no output (previously had an expected exclusion).
- All 8 skills present in all three trees; `thejudge-implement-codex` and `thejudge-output-guidance.md` absent from all three.
- `grep -rn "implement-codex\|output-guidance" --include="*.md" --include="*.sh" .` returns hits only under `PRD/instructions/receipts/`.
- Every skill's Next step names a command that resolves to an existing skill.
- Each of the 23 preserved specifics is locatable in the new skill set.
- `~/.cursor/skills/kickoff`, `~/.codex/skills/kickoff`, `~/.agents/skills` no longer exist.

## Non-goals

- No change to `PRD/sections/` product truth.
- No change to `PRD/instructions/` beyond `workflow-reference.md`.
- No edits to existing receipts.
- No change to the workflow's stages or their order.
- No merging of parallel skills into base skills.
- No changes to `~/.codex/rules/default.rules` or vendor-bundled skill trees.
