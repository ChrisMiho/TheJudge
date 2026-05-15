---
name: prd-to-parallel-stories
description: Breaks a feature PRD from generate-feature-prd into thin, dependency-aware stories with execution modes and parallel agent briefs. Use when the user has a feature PRD file or paste and wants backlog slices, parallel-ready groupings, or agent-ready work packages.
disable-model-invocation: true
---

# PRD to Parallel Stories

## Scope

Convert a **feature PRD** produced by `generate-feature-prd` into:

1. A **wave plan** (what can run in parallel vs what must serialize)
2. **Story specifications** aligned with `PRD/instructions/story-generation.md`
3. **Parallel agent briefs** so different agents can execute slices independently

## Input Contract

Required (one of):

- Path to `PRD/features/<feature-id>/prd.md`, or
- Pasted full PRD including the `## Story decomposition handoff` section

If the handoff YAML is missing, derive the same fields from the PRD body before writing stories, then echo the derived YAML at the top of the output for traceability.

## Repo Reads (TheJudge)

1. Read `../_shared/reference-corpus.md`
2. Read `PRD/sections/decisions.md` (resolve conflicts; feature PRD cannot override confirmed decisions)
3. Read `PRD/instructions/story-generation.md`
4. Read `PRD/instructions/requirement-format.md` for field vocabulary

If a feature requirement conflicts with a confirmed decision, mark the story as **blocked on product** and cite both `F-REQ-*` and `DEC-*` with the conflict in plain language.

## ID and Tracker Rules

- Story IDs: if the user did not supply the next global `STORY-###` number, use placeholders `STORY-TBD-001` incrementing within the output until the user assigns real IDs.
- Dependency references: cite `F-REQ-*`, `F-FLOW-*`, `F-NFR-*`, `F-DEC-*`, and global `DEC-*` / `REQ-*` from section files when relevant.
- **Tracker acceptance criterion:** when work stays inside the feature bundle, require updating `PRD/features/<feature-id>/prd.md` (add a `## Implementation progress` checklist if absent). When the user confirms promotion to the main backlog, use tracker paths from `story-generation.md` (`PRD/README.md`, active roadmap analysis file, or `PRD/stories/STORY-###`).

## Workflow

1. Parse Metadata and Story decomposition handoff from the PRD.
2. Build a **dependency graph**:
   - Data or contract dependencies between requirements
   - Shared files or seams likely touched (high level only unless user provided paths)
3. Assign **waves**:
   - **Wave 0:** prerequisites only (sequential chain roots)
   - **Wave N:** stories that depend only on completed prior waves
4. For each story, choose `parallel-ready` vs `sequential` using the same semantics as `stories-from-analysis`.
5. Emit **parallel agent briefs** after the story list.

## Required Story Block Format

Each story must use this schema (consistent with `stories-from-analysis`):

```markdown
## Story: <short title>
- story_id: STORY-TBD-### | STORY-###
- title: ...
- implementation area: (`frontend` | `backend` | `full-stack`)
- user value: ...
- scope:
  - ...
- acceptance criteria:
  - ...
  - Tracker: <concrete file path(s) from tracker rules>
- execution mode: (`parallel-ready` | `sequential`)
- dependencies:
  - references: `F-REQ-###`, `F-FLOW-###`, `F-NFR-###`, `DEC-###` (as applicable)
  - blocker: `STORY-...` or `STORY-TBD-...` — <one-line reason> (required when sequential)
  - parallel-after: ... (required when sequential)
- exclusions:
  - ...
- wave: <integer>
```

Formatting rules:

- Do not fabricate global `REQ-###` / `FLOW-###` IDs; use feature IDs from the PRD unless the PRD explicitly maps to promoted global IDs.
- No vague dependency lines such as "other stories" or "TBD integration".
- Do not commit scope hidden inside `F-Q-*` items; stories reference questions, they do not pretend they are resolved.

## Parallel Agent Manifest

After all stories, emit:

```markdown
## Parallel agent manifest

| story_id | wave | execution mode | agent brief | primary inputs |
|----------|------|------------------|-------------|----------------|
| ... | ... | ... | One sentence objective | prd sections + key F-* IDs |
```

Group manifest rows by wave. Within a wave, all `parallel-ready` rows are safe to assign to different agents concurrently **assuming** no shared draft file edits beyond what dependencies allow; call out shared hotspots explicitly in a **Concurrency cautions** subsection.

## Quality Gate Checklist

- [ ] Each story has one primary objective
- [ ] Each story has justified execution mode
- [ ] Sequential chains are minimal; parallelization is maximized without hiding real blockers
- [ ] Every `F-REQ-*` from the PRD maps to at least one story or is explicitly deferred with rationale
- [ ] Open questions (`F-Q-*`) never silently become in-scope work
- [ ] Tracker criterion names a real path

## Non-Goals

- Do not re-author the PRD; fix gaps by listing **blocking questions** for the user instead of guessing.
- Do not produce unrelated refactor stories unless the PRD explicitly requires them.

## Optional File Writes

If the user asks to materialize files:

- Stories under `PRD/stories/STORY-###.md` following the story template in `PRD/instructions/requirement-format.md`
- A companion file `PRD/features/<feature-id>/waves.md` summarizing waves and manifest

Only create files when explicitly requested.
