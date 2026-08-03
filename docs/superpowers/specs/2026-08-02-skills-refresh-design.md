# TheJudge Skills Refresh — Design

**Date:** 2026-08-02
**Status:** approved for planning
**Scope:** `.cursor/skills/` (canonical) + synced trees, `AGENT-SKILLS.md`, `scripts/sync-agent-skills.sh`, a rewrite of `PRD/instructions/workflow-reference.md`, a DEC-064 supersession in `PRD/sections/decisions/doc-process.md` + its router line, two one-line cross-reference corrections (`PRD/instructions/requirement-format.md`, `PRD/README.md`), and stale global config cleanup.

## Motivation

The `thejudge-*` skills were authored between 2026-05-21 and 2026-07-04. They work, and the workflow they encode is sound. What has aged is the *calibration*: they were written for models that needed exhaustive read lists, numbered procedure narration, anti-rationalization tables, and response-length coaching.

The workflow stays. The scaffolding around it gets rewritten from a blank page.

This is a recalibration, not a redesign. The pipeline, the skill names, the three-runtime sync, and the PRD contract are all preserved.

## Decisions

| Decision | Choice |
|---|---|
| Approach | Contract-first rewrite, blank-page per skill |
| Invocation | Model-invocable, and callable explicitly in all three runtimes |
| Runtimes | All three: Cursor, Codex, Claude Code |
| Skill count | 8 |
| `thejudge-implement-codex` | Deleted, replaced by platform-neutral `thejudge-implement-parallel` |
| `thejudge-map-out-parallel` | Rewritten platform-neutral (was Codex-oriented) |
| Parallel skills | Remain separate from their base siblings, distinguished by description |
| `thejudge-output-guidance.md` | Deleted, along with its boilerplate reference in every skill |
| Output profiles | `lean` / `standard` / `detailed` vocabulary retired; terseness is inherent to how each skill is written |
| DEC-064 | Superseded by a new DEC — the shared-artifact mechanism it mandates is what this refresh removes |
| Shared material across sibling pairs | Each skill carries its own `reference.md`; no cross-skill file references |
| Runtime dispatch recipes | None. Skills describe the contract; the human picks the runtime and starts the session |
| `PRD/` | `workflow-reference.md` rewritten; DEC-064 superseded; two one-line cross-reference fixes; one abandoned work package deleted. Receipts never edited |

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
description: <what it does + when to use it + what distinguishes it from siblings>
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
- Rule lists restated verbatim *inside* `SKILL.md` bodies (see `reference.md` below)

What is deliberately **denser**:

- Exact write paths and ID conventions
- Approval gates and PASS/FAIL semantics
- Status vocabulary
- The single Next step command

### Where shared material lives

Two sibling pairs need the same supporting material, and one skill needs a PRD map. There is no shared top-level file: a skill referencing `../other-skill/` is the fragile pattern `thejudge-output-guidance.md` proved out, and it breaks differently in each runtime.

**Each skill that needs supporting material gets its own `reference.md` inside its own directory.** Duplication between siblings is accepted deliberately — it is the price of every skill being self-contained in every runtime.

| Skill | `reference.md` holds |
|---|---|
| `thejudge-kickoff` | Source-of-truth precedence, task → read-order table, out-of-scope paths |
| `thejudge-map-out` | Slice doc template, Ship gates block |
| `thejudge-map-out-parallel` | Slice doc template, Ship gates block, wave table format |
| `thejudge-implement` | Implementation constraints (preserved specifics 11–16), status vocabulary |
| `thejudge-implement-parallel` | Implementation constraints (preserved specifics 11–16), status vocabulary |

The remaining three skills (`refinement`, `quality-check`, `cleanup`) have no `reference.md` — their material fits in the body.

When the paired files drift, canonical is whichever the base skill carries; the `-parallel` copy adds to it and never contradicts it.

## Invocation model

No skill carries `disable-model-invocation`. All 8 are model-invocable, and all 8 remain explicitly callable (`/thejudge-map-out`, `$thejudge-map-out`). The agent may select a workflow skill when context clearly matches.

This resolves a standing contradiction with the docs: `AGENT-SKILLS.md` says "attach the matching skill manually at the start of each agent session," and `workflow-reference.md` says "no router or orchestrator is part of the workflow."

Git history does **not** settle this and should not be cited as if it does. `disable-model-invocation` was added in `bfb0df9` (06-06) and `0399eae` (06-18), and removed in `36a24e1` (06-06), `a957abd` (06-09), and `bc5b77b` (06-18) — a tug-of-war, not a trend. Two of the three removals (`36a24e1`, `a957abd`) touched only `.claude/skills/`, never canonical `.cursor/skills/`, so they are sync drift rather than intent.

The decision rests on the owner's call in `f787a7b`, not on the history. Nothing in `PRD/sections/` mandates manual attachment — verified: no `DEC` anywhere asserts it. The claim lives only in `AGENT-SKILLS.md`, `workflow-reference.md`, and `thejudge-kickoff/reference.md`, and all three get corrected to describe model-invocable skills that can also be called explicitly.

### Descriptions are load-bearing

With model invocation enabled, `description` is the only thing standing between the right skill firing and the wrong one. It carries more weight than any body text.

Every description must answer three things: what the skill does, when to use it, and **what distinguishes it from its nearest sibling**.

Two pairs compete directly and must be written against each other:

| Pair | Distinguishing trigger |
|---|---|
| `map-out` vs `map-out-parallel` | Whether slices are being grouped into dependency waves for concurrent work, or sequenced |
| `implement` vs `implement-parallel` | Whether a single slice is being executed here, or a whole wave dispatched across agents |

Two more risks specific to this skill set:

- **Stage-adjacent misfire.** `refinement`, `quality-check`, and `map-out` all take a work slug and all read the design brief. Each description must name the artifact it *produces* (`DESIGN-BRIEF.md`, a PASS/FAIL report, `GAMEPLAN.md` + slices), since that is what actually separates them.
- **Destructive misfire.** `cleanup` deletes `PRD/work/<slug>/`. Its description must not fire on general tidying language. It triggers on shipping a completed work package or an explicit corpus-hygiene request — never on "clean this up." The receipt-before-delete gate in the body is the second line of defense, but the description is the first.

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

Consumes a wave and dispatches one agent per slice using **whatever parallel-agent mechanism the host runtime provides**. The skill names no CLI, no flag, and no tool.

**No dispatch recipes.** The skill describes the contract — what each dispatched agent must receive and what must be true before and after — and stops there. It does not tell the agent how to invoke anything. The human chooses which runtime to run this in and starts the session there.

**Runtime without a parallel mechanism.** Not every runtime has one; the Codex CLI in particular has no in-session subagent primitive. When the host provides no way to run slices concurrently, the skill degrades explicitly: it states that the runtime is sequential, then executes the wave's slices one at a time under the same gates. It never improvises a dispatch mechanism — no shelling out to another agent CLI, no background process juggling. Every rule below still binds in sequential mode; only the concurrency is lost.

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
| Purpose | 4 | Keep, corrected — currently asserts "humans manually attach… no router," which the model-invocable decision contradicts |
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

Receipts under `PRD/instructions/receipts/` are historical records and are never modified, even where they reference deleted skills — they correctly describe what was true when written.

## DEC-064 supersession

**This is a blocking prerequisite, not cleanup. Do it before touching the skill tree.**

`PRD/sections/decisions/doc-process.md` holds `DEC-064`, status `confirmed`, indexed in the router at `PRD/sections/decisions.md`. Its Impact block mandates the exact artifact this refresh deletes:

> add one shared canonical output-guidance artifact under `.cursor/skills/`, then sync it to `.agents/skills/` and `.claude/skills/` through the existing `npm run skills:ai-sync` workflow; individual skills reference that shared guidance instead of duplicating verbosity rules

Deleting `thejudge-output-guidance.md` while leaving DEC-064 confirmed puts the corpus in contradiction with itself, and a later `thejudge-quality-check` would correctly return FAIL against it.

Follow the decision lifecycle in `PRD/instructions/doc-lifecycle.md`:

1. Trim the `DEC-064` body in `PRD/sections/decisions/doc-process.md` to a one-line tombstone: the original ID plus `superseded by DEC-###`. The ID stays resolvable; the body does not survive.
2. Add a new `DEC-###` body in the same file (next free ID — check the router; do not renumber anything).
3. Add the router index line in `PRD/sections/decisions.md`.

What the new decision says:

- DEC-064's **outcome is retained**: workflow skill responses stay terse and high-signal — status, decisions, files/IDs touched, verification, handoff. No document dumps, no restated background, no long command output.
- DEC-064's **mechanism is retired**: the shared output-guidance artifact and its per-skill boilerplate reference are removed. Response discipline is inherent to how each skill is written rather than delegated to a referenced file.
- The `lean` / `standard` / `detailed` profile vocabulary and its per-session override are **dropped**. A plain-language instruction to be more or less verbose needs no named profile system.
- Unchanged from DEC-064 and still binding: profile or phrasing never alters required reads, writes, approval gates, PASS/FAIL calls, blocker reporting, verification, status updates, or the `Next step` handoff. Mandatory output stays mandatory.
- Unchanged: canonical editing remains `.cursor/skills/thejudge-*`; synced copies remain implementation artifacts.
- No `system-map.md` entry — the catalog tracks product subsystems, not the PRD's own tooling (consistent with DEC-044 / DEC-063 / DEC-064).

`DEC-063` (decisions router split) and `DEC-086` reference DEC-064 in their Notes as lineage. Those are historical mentions of a real decision that still resolves by ID — leave them alone.

## PRD cross-reference corrections

Two files inside `PRD/` describe `workflow-reference.md` as it exists today and go stale the moment it is rewritten. One line each.

| File | Current | Problem |
|---|---|---|
| `PRD/instructions/requirement-format.md:73` | "Slice dependency guidance lives in `instructions/workflow-reference.md` and `thejudge-map-out`." | The slice template moves out of `workflow-reference.md` into the map-out skills' `reference.md` |
| `PRD/README.md:56` | "Lean five-skill PRD workflow reference, session openers, slice template, and cleanup receipt convention" | Wrong skill count (8, not five) and the slice template is no longer there |

`PRD/README.md:82` (read-order list) and `PRD/README.md:107` (sync note) stay as they are — both remain accurate.

## Abandoned work package

`PRD/work/prompt-game-state-enrichment/` was `status: deferred` with all five slices `planned`, no code shipped and no receipt. Deleted per the abandoned-work rule in `doc-lifecycle.md` — delete without promoting; no receipt is owed for work that never shipped. No `Q-###` added; no ambiguity remained.

This removes the only work package using a status outside the documented vocabulary. The remaining seven are `ideation` or `active`.

## `thejudge-kickoff/reference.md`

The only sub-file that exists today. Survives, rewritten. It holds genuine content the skill body should not carry: source-of-truth precedence, the task → read-order table, and out-of-scope paths. Four more `reference.md` files join it — see "Where shared material lives" above.

Three fixes required: its skill table lists only 6 skills and must cover all 8, that table is headed "Workflow skills (manual attach)" which the model-invocable decision contradicts, and its sync note points at `AGENT-SKILLS.md` for a contract that is itself being rewritten.

## `scripts/sync-agent-skills.sh`

`CODEX_RUNTIME_EXCLUDES` exists solely to keep `thejudge-implement-codex` out of the Codex runtime. With that skill gone and its replacement platform-neutral, the exclude list is dead.

The script becomes a plain three-way mirror: `.cursor/skills/` → `.agents/skills/` + `.claude/skills/`, both identical.

## `AGENT-SKILLS.md`

Rewritten to match. Removes the orchestrator-only section, the exclude-list explanation, and the asymmetric `diff -rq` verification note. Verification simplifies to: both synced trees are byte-identical to canonical.

Keeps the sync contract (edit `.cursor/skills/` only, run `npm run skills:ai-sync`, commit all three trees), the flow diagram, and the per-skill catalog.

Corrects the opening claim that skills are manually attached each session — they are model-invocable and may also be called explicitly.

## Global config cleanup

Outside the repo, and **outside git — there is no revert.** Back up first:

```bash
cp -R ~/.cursor/skills/kickoff /tmp/kickoff-backup-$(date +%Y%m%d)
```

There is **one** real directory and **two symlinks pointing at it** — not three independent stale dirs:

- `~/.cursor/skills/kickoff/` — the real directory. Contains `SKILL.md`, `reference.md`, and an `agents/` subdirectory. A pre-`thejudge-` copy of kickoff dated 2026-06-03. Describes the product as "a flow-validation assistant for MTG stack questions; MVP1 is closed" — framing removed by commit `2d66f20`. Points at `PRD/gameplan/`, `PRD/stories/`, `PRD/features/`, none of which exist. Being global, it loads into every Cursor session in every repo and injects obsolete product truth.
- `~/.codex/skills/kickoff` — a **symlink** to the above.
- `~/.agents/skills/kickoff` — a **symlink** to the above.

Order matters. Unlink the symlinks first, then remove the target:

```bash
rm ~/.codex/skills/kickoff        # no trailing slash — unlinks, does not follow
rm ~/.agents/skills/kickoff       # no trailing slash
rm -rf ~/.cursor/skills/kickoff   # the real directory
rmdir ~/.agents/skills ~/.agents  # now empty
```

**Never write a trailing slash on the symlink paths.** `rm -rf ~/.codex/skills/kickoff/` resolves through the link and destroys the target's contents before the intended step runs, with behavior that varies by shell.

Leave `~/.codex/skills/.system/` in place — vendor-bundled, and removing `kickoff` does not touch it.

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

6. Work-package statuses: `ideation` → `refined` → `active` → deleted. The status line's *format* varies across live packages — some use YAML frontmatter (`---\nstatus: active\n---`), some a bare first line (`status: active`). Preserve whichever format a package already uses and change only the value, exactly as rule 7 requires for slice docs. Never normalize a live work folder's format as a side effect.
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

Automated — all must pass before handoff:

- `npm run skills:ai-sync` runs clean.
- `diff -rq .cursor/skills .claude/skills` → no output.
- `diff -rq .cursor/skills .agents/skills` → no output (previously had an expected exclusion).
- All 8 skills present in all three trees; `thejudge-implement-codex` and `thejudge-output-guidance.md` absent from all three.
- The five `reference.md` files exist in all three trees.
- Residual-reference sweep, scoped past the two files that legitimately still name the deleted artifacts — this spec (it documents the deletion) and the receipts (historical records):

  ```bash
  grep -rn "implement-codex\|output-guidance" --include="*.md" --include="*.sh" . \
    | grep -v node_modules \
    | grep -v "PRD/instructions/receipts/" \
    | grep -v "docs/superpowers/specs/"
  ```

  Do not anchor those exclusions with `^./` — macOS `grep -r .` emits paths without a `./` prefix, so anchored patterns silently match nothing and the check appears to fail forever.

  Must return **nothing**. Note the unscoped version of this command does *not* come back clean even after a correct implementation — that is why it is scoped here.
- `grep -rn "DEC-064" PRD/sections/` shows the tombstone, the router line, and the lineage mentions in DEC-063 / DEC-086 — and no surviving Impact block.
- Every skill's Next step names a command that resolves to an existing skill.
- `PRD/work/prompt-game-state-enrichment/` no longer exists.
- `~/.cursor/skills/kickoff`, `~/.codex/skills/kickoff`, `~/.agents/skills` no longer exist; `~/.codex/skills/.system/` still does.

Traceability — fill this table in, do not assert it:

| # | Preserved specific | Owning skill | Section / file |
|---|---|---|---|
| 1–5 | PRD contract | | |
| 6–10 | Work package lifecycle | | |
| 11–16 | Implementation constraints | | |
| 17–20 | Process gates | | |
| 21–23 | Parallel execution | | |

Every one of the 23 gets its own row with a concrete file and section. A specific with no home is a dropped specific — the table is the whole point of the exercise, not a formality.

Manual, post-merge — these cannot be checked from a shell and must not be claimed without doing them:

- Open a session in each of Cursor, Codex, and Claude Code; confirm all 8 skills appear in the available-skills listing and none carries `disable-model-invocation`.
- Each description names the artifact its skill produces, and each `-parallel` description states what separates it from its base sibling.
- `cleanup`'s description does not fire on generic tidying language.

## Non-goals

- No change to `PRD/sections/` product truth. The DEC-064 supersession is process/tooling only — it touches no `REQ`, no `FLOW`, no `system-map.md` entry, and no product behavior.
- No change to `PRD/instructions/` beyond the `workflow-reference.md` rewrite and the one-line cross-reference fix in `requirement-format.md`.
- No edits to existing receipts.
- No change to the workflow's stages or their order.
- No merging of parallel skills into base skills.
- No dispatch recipes, CLI invocations, or runtime-specific tooling instructions in any skill.
- No changes to `~/.codex/rules/default.rules` or vendor-bundled skill trees.
- No deletion of work packages beyond the already-removed `prompt-game-state-enrichment`. The other seven are live.
