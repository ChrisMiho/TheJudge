---
name: stories-from-analysis
description: Converts a TheJudge technical analysis artifact into backlog-ready story drafts with explicit execution mode, dependency reasoning, and auditable tracker acceptance criteria. Use when the user asks to create or refine stories from prior analysis and follow-up constraints.
disable-model-invocation: true
---

# Stories From Analysis

## Scope

Use this skill to convert a prior analysis artifact into actionable stories aligned with TheJudge PRD guardrails and story formatting rules.

Always read `../_shared/reference-corpus.md` first.

Assume the analysis already applied governance; if conflicts appear, prefer live `PRD/sections/decisions.md` and ask the user.

## Input Contract

Required:

- Analysis artifact from `problem-analysis` (pasted content or file path).

Optional:

- User priorities (order, urgency, business value).
- Sequencing constraints or exclusions.
- Scope tightening requests.

If analysis input is missing, ask for it before generating stories.

## Workflow

1. Parse the analysis objective, boundaries, risks, and story seed.
2. Keep scope tied to confirmed requirements/decisions only.
3. Slice into thin stories with one primary objective each.
4. Assign implementation area:
   - `frontend` for UI/client-only
   - `backend` for API/server-only
   - `full-stack` when both are required
5. Determine execution mode:
   - `parallel-ready` when no blocking story prerequisites exist
   - `sequential` when blocker story IDs are required
6. Write concrete dependency lines:
   - references (`REQ/DEC/NFR/FLOW`) where relevant
   - blocker story ID and one-line reason when sequential
   - what becomes parallelizable after blocker lands
7. Add at least one auditable tracker acceptance criterion naming concrete file updates.

## Required Output Format

Generate one or more story blocks using this schema:

```markdown
## Story: <short title>
- title: ...
- implementation area: (`frontend` | `backend` | `full-stack`)
- user value: ...
- scope:
  - ...
- acceptance criteria:
  - ...
  - Tracker: update `PRD/analysis/MVP2-bedrock-integration-roadmap.md` and/or `PRD/README.md` and/or this story file to reflect completion.
- execution mode: (`parallel-ready` | `sequential`)
- dependencies:
  - references: `REQ-###`, `DEC-###`, `FLOW-###`, `NFR-###`
  - blocker: `STORY-### - <one-line reason>` (required when sequential)
  - parallel-after: ... (required when sequential)
- exclusions:
  - ...
```

Formatting rules:

- Do not fabricate IDs.
- Do not use vague dependency text like "other stories" or "future work".
- If ordering is optional, do not mark sequential.
- Keep exclusions explicit to prevent scope creep.

## Quality Gate Checklist

Before final output, verify each story:

- has one clear objective
- has correct implementation area
- has verifiable acceptance criteria
- includes tracker criterion with concrete file path(s)
- has dependency section that clearly distinguishes references vs blockers
- has execution mode justified by constraints

## Non-Goals

- Do not convert open questions into committed backlog scope.
- Do not introduce forbidden architecture or rules-engine behavior.
- Do not merge unrelated preventive/process and remediation work when they can be split.
