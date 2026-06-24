# Agent Workflow Skills

TheJudge uses six core project skills to drive PRD-based feature work, plus two optional flavors (`thejudge-map-out-parallel` and `thejudge-implement-codex`) for parallel, Codex-delegated execution. Attach the matching skill manually at the start of each agent session.

## Single source + sync

Skills are **not** maintained in three separate copies. Edit only:

`.cursor/skills/thejudge-*/`

Codex and Claude Code load skills from their own conventional paths. This repo copies the canonical tree into those paths with:

```bash
npm run skills:ai-sync
```

| Platform | Discovery path | Role |
| --- | --- | --- |
| Cursor | `.cursor/skills/` | **Canonical** — edit here |
| Codex | `.agents/skills/` | Synced copy |
| Claude Code | `.claude/skills/` | Synced copy |

Run `npm run skills:ai-sync` after any skill change, then commit `.cursor/skills/`, `.agents/skills/`, and `.claude/skills/` together.

**Orchestrator-only skills:** `thejudge-implement-codex` drives the `codex` CLI, so the sync script deliberately excludes it from `.agents/skills/` (the Codex runtime). It exists only under `.cursor/skills/` and `.claude/skills/`. The exclude list lives in `scripts/sync-agent-skills.sh` (`CODEX_RUNTIME_EXCLUDES`).

## Workflow sequence

```mermaid
flowchart LR
  kickoff[thejudge-kickoff] --> refinement[thejudge-refinement]
  refinement --> qc[thejudge-quality-check]
  qc --> mapout[thejudge-map-out]
  mapout --> implement[thejudge-implement]
  implement --> cleanup[thejudge-cleanup]
```

## Skill catalog

### thejudge-kickoff

**When:** New session or new feature idea.

**Synopsis:** Loads minimal onboarding (`README.md`, `PRD/README.md`). Optionally captures `PRD/work/<slug>/IDEA.md`.

**Inputs:** Optional idea description.

**Writes:** `IDEA.md`, `README.md` (status `ideation`) when capturing an idea.

**Next:** `thejudge-refinement` (if idea captured).

### thejudge-refinement

**When:** An idea needs product definition.

**Synopsis:** Shapes the feature and writes `DESIGN-BRIEF.md` plus aligned `PRD/sections/` updates after user approval.

**Inputs:** Work slug.

**Writes:** `DESIGN-BRIEF.md`, section updates, `README.md` → `status: refined`.

**Next:** `thejudge-quality-check`.

### thejudge-quality-check

**When:** After refinement, before slicing.

**Synopsis:** Gates map-out with a PASS/FAIL report against PRD alignment and implementability.

**Inputs:** Work slug.

**Writes:** Report only (trivial fixes only with approval).

**Next:** `thejudge-map-out` (PASS) or `thejudge-refinement` (FAIL).

### thejudge-map-out

**When:** After quality-check passes.

**Synopsis:** Creates `GAMEPLAN.md` and lettered slice docs for agent implementation.

**Inputs:** Work slug.

**Writes:** `GAMEPLAN.md`, `slice-*.md`, `README.md` → `status: active`.

**Next:** `thejudge-implement` (first slice).

### thejudge-map-out-parallel (flavor)

**When:** After quality-check passes and the work has independent slices worth running concurrently.

**Synopsis:** Like `thejudge-map-out`, but groups slices into numbered dependency **waves** (same-wave slices are independent and touch disjoint files).

**Inputs:** Work slug.

**Writes:** `GAMEPLAN.md` (with wave plan), `slice-*.md`, `README.md` slice table with wave/depends-on columns → `status: active`.

**Next:** `thejudge-implement-codex` (Cursor/Claude) or `thejudge-implement` (Codex).

### thejudge-implement

**When:** Executing a planned slice (usually in Codex or Claude).

**Synopsis:** Implements one slice end to end — code, tests, verification, slice status updates.

**Inputs:** Work slug; optional slice letter.

**Writes:** Product code and tests per slice scope.

**Next:** `thejudge-implement` (next slice) or `thejudge-cleanup` (all done).

### thejudge-implement-codex (flavor, orchestrator-only)

**When:** From Cursor or Claude Code, executing planned slices while conserving orchestrator tokens.

**Synopsis:** Delegates heavy coding to the Codex CLI (`codex exec`); the orchestrator dispatches a wave's independent slices concurrently and **re-verifies every result inline** before marking anything `done`.

**Inputs:** Work slug; optional wave number or slice letter.

**Writes:** Product code and tests per slice scope (written by Codex, verified by the orchestrator).

**Next:** `thejudge-implement-codex` (next wave) or `thejudge-cleanup` (all done).

> Not synced into the Codex runtime (`.agents/skills/`) — it drives the `codex` CLI, so it is meaningless inside Codex. In Codex, use `thejudge-implement`.

### thejudge-cleanup

**When:** Feature shipped or corpus hygiene.

**Synopsis:** Promotes durable PRD truth, writes receipt, deletes `PRD/work/<slug>/`.

**Inputs:** Work slug.

**Writes:** Receipt under `PRD/instructions/receipts/`, section promotions.

**Next:** Optional `thejudge-kickoff` for new work.

## Session handoffs

Every skill that hands off ends with a **Next step** section containing copy-paste blocks for **Cursor**, **Codex**, and **Claude Code**. Full templates: `PRD/instructions/workflow-reference.md` (Handoff blocks).

## Adding or updating a skill

1. Create or edit under `.cursor/skills/<skill-name>/`.
2. Run `npm run skills:ai-sync`.
3. Verify: `diff -rq .cursor/skills .claude/skills` (no output = identical). For `.agents/skills`, the only expected difference is `Only in .cursor/skills: thejudge-implement-codex` (orchestrator-only — see above); anything else means re-sync.
4. Commit all three skill trees.

## Related docs

- `PRD/instructions/workflow-reference.md` — handoff templates, slice format, checklists
- `PRD/README.md` — product control plane
- `.cursor/skills/thejudge-kickoff/reference.md` — PRD quick map
