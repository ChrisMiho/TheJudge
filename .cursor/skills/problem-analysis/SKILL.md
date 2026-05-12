---
name: problem-analysis
description: Produces structured technical analysis for a user-defined TheJudge product or implementation problem, aligned with project precedence, decisions, and instruction guardrails. Use when the user asks for technical analysis, impact assessment, solution direction, or pre-story problem framing.
disable-model-invocation: true
---

# Problem Analysis

## Scope

Use this skill to transform a user-defined problem into a precise technical analysis artifact that can be consumed by story creation.

Always apply the governance in `../_shared/reference-corpus.md` before producing output.

## Input Contract

Collect these inputs from the request and context:

- Problem statement in the user's words.
- Success condition (what outcome the user wants).
- Constraints, exclusions, or sequencing preferences provided by the user.
- Any referenced repo files or existing artifacts.

If one critical input is missing, ask one concise clarification instead of guessing.

## Workflow

1. Restate the problem and success criteria in neutral terms.
2. Apply constraints from `../_shared/reference-corpus.md`:
   - source-of-truth precedence
   - decision themes
   - allowed direction and forbidden drift
3. Ground analysis in existing IDs where possible (`REQ-###`, `DEC-###`, `FLOW-###`, `NFR-###`).
4. If grounding is uncertain, mark as an open question candidate (`Q-###`) instead of inventing scope.
5. Propose the smallest viable direction that satisfies the problem.
6. Call out implementation surfaces (`frontend`, `backend`, `full-stack`, `docs`) and key risks.

## Required Output Format

Produce exactly these sections in order:

```markdown
## Problem
- ...

## Success Criteria
- ...

## Current State and Gap
- ...

## Constraints and Guardrails Applied
- ...

## Proposed Technical Direction
- ...

## Affected Surfaces
- frontend:
- backend:
- full-stack:
- docs:

## ID Alignment
- REQ:
- DEC:
- FLOW:
- NFR:

## Risks and Edge Cases
- ...

## Open Questions
- Q-candidate: ...

## Recommended Next Step
- ...
```

Formatting rules:

- Keep sections concise and actionable.
- Do not include empty bullet placeholders; use `none` where needed.
- Never fabricate IDs.
- Keep proposal scope within active phase constraints.

## Non-Goals

- Do not propose deterministic judge/rules-engine behavior unless decisions change.
- Do not introduce forbidden architecture or endpoint sprawl.
- Do not turn open questions into committed implementation scope.
- Do not rewrite product truth in new files when existing sections already define it.

## Handoff Contract to Story Skill

End with a short handoff block the next skill can consume:

```markdown
## Story Seed
- objective:
- boundaries:
- likely execution mode:
- likely dependencies:
- exclusions:
```
