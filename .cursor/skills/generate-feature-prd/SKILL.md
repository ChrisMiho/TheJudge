---
name: generate-feature-prd
description: Authors a complete feature-scoped PRD with stable IDs, flows, requirements, risks, and a handoff block for downstream story breakdown. Use when the user wants a new feature specified end-to-end, a feature brief turned into requirements, or a PRD artifact to feed parallel agent planning.
disable-model-invocation: true
---

# Generate Feature PRD

## Scope

Produce one self-contained feature PRD that downstream tooling (and the companion skill `prd-to-parallel-stories`) can consume without guesswork.

## Discovery (Minimal)

If the user has not already supplied answers, ask only what is missing:

1. Feature name and one-line intent
2. Primary user or actor
3. Must-ship vs explicit non-goals
4. Hard constraints (time, compliance, stack, compatibility with existing product decisions)
5. Whether this feature will live only under `PRD/features/` or will merge into `PRD/sections/` later

If the user provided verbatim wording for any section, preserve it **verbatim** in the PRD body.

## Repo Alignment (TheJudge)

Before writing or editing files under `PRD/`:

1. Read `PRD/instructions/agent-working-rules.md`
2. Read `PRD/instructions/writing-rules.md`
3. Read `PRD/sections/decisions.md` for conflicts with the proposed feature
4. Read `../_shared/reference-corpus.md` for distilled guardrails

Do not invent global canonical IDs (`REQ-###`, `FLOW-###`, `DEC-###`, `Q-###`, `NFR-###`) that already exist in `PRD/sections/*`. For net-new feature drafting, use **feature-scoped IDs** as defined below until the feature is promoted into section files.

## Output Location

Default path:

`PRD/features/<feature-id>/prd.md`

Where `<feature-id>` is lowercase kebab-case (example: `openai-fallback-banner`).

Create the directory if missing. Do not add unrelated files.

## Feature-Scoped ID Convention

Use prefixes so IDs stay unique before promotion:

| Kind | Pattern | Example |
|------|---------|---------|
| Feature requirement | `F-REQ-###` | `F-REQ-001` |
| User flow | `F-FLOW-###` | `F-FLOW-001` |
| Non-functional | `F-NFR-###` | `F-NFR-001` |
| Open question | `F-Q-###` | `F-Q-001` |
| Confirmed decision (only if truly confirmed) | `F-DEC-###` | `F-DEC-001` |

Number per feature doc starting at `001`. Do not reuse numbers once assigned.

## Required Document Structure

Use this exact top-level heading order so the follow-up skill can parse reliably:

```markdown
# Feature PRD: <Human title>

## Metadata
- feature_id: <kebab-case slug>
- status: draft | in_review | approved
- owner: <unknown | name>
- last_updated: <YYYY-MM-DD>

## Executive summary

## Problem statement

## Goals
## Non-goals

## Actors and personas

## User flows
### F-FLOW-001
- Name:
- Trigger:
- Preconditions:
- Main flow:
  1. ...
- Edge cases:
  - ...
- Requirements covered: `F-REQ-...`
- Notes:

(repeat per flow)

## Functional requirements
### F-REQ-001
- Title:
- Priority: (P0 | P1 | P2)
- Description:
- Acceptance criteria:
  - ...
- Constraints:
  - ...
- Dependencies:
  - ...
- Flow coverage: `F-FLOW-...`
- Notes:

(repeat per requirement)

## Non-functional requirements
### F-NFR-001
- Title:
- Description:
- Constraints:
  - ...
- Dependencies:
  - ...
- Notes:

## Integrations and data

## UX and copy notes

## Observability and analytics

## Risks and mitigations

## Open questions
### F-Q-001
- Question:
- Context:
- Why it matters:
- Options under consideration:
  - ...
- Recommended next step:

## Decisions
### F-DEC-001
- Decision:
- Status: proposed | confirmed
- Context:
- Impact:
- Related requirements:
- Notes:

## Out of scope

## Success metrics

## Testing, rollout, and flags

## Traceability matrix
| ID | Type | Summary | Flows | Notes |
|----|------|---------|-------|-------|

## Story decomposition handoff
> **Machine contract:** This section is the primary input for `prd-to-parallel-stories`.

Include:

```yaml
feature_id: <kebab-case slug>
prd_path: PRD/features/<feature-id>/prd.md
requirements:
  - id: F-REQ-001
    summary: <short>
flows:
  - id: F-FLOW-001
    summary: <short>
non_functional:
  - id: F-NFR-001
    summary: <short>
open_questions:
  - id: F-Q-001
decisions_confirmed:
  - id: F-DEC-001
suggested_story_themes:
  - <theme or slice name>
parallelization_notes: >
  <1-3 sentences on what can run in parallel vs what must serialize>
```

Follow the YAML with a short bullet list of **slice candidates** (candidate story titles only, no full story write-up here).

## Quality Gate

Before saving:

- [ ] Every `F-REQ-*` has testable acceptance criteria
- [ ] Every `F-FLOW-*` maps to at least one requirement or explicit gap called out in open questions
- [ ] Non-goals and out of scope prevent agent scope creep
- [ ] Open questions are not smuggled in as fake requirements
- [ ] Story decomposition handoff YAML lists every `F-REQ-*` and `F-FLOW-*` from the doc body

## Non-Goals

- Do not write full implementation stories in this skill; that belongs to `prd-to-parallel-stories`.
- Do not silently resolve product ambiguity; capture it as `F-Q-*`.
- Do not contradict `PRD/sections/decisions.md` without an explicit `F-DEC-*` proposal and user visibility.

## Next Step

When the PRD is ready, run the companion skill **`prd-to-parallel-stories`** on `prd_path`.
