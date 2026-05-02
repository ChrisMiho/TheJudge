# STORY-035 to STORY-040 - Agent Assignment and Merge Order

## Objective

Provide a dependency-safe execution and merge order for the autocomplete refinement story batch.

## Assignment Plan

- Agent 1: `STORY-035` (shared path foundation) - single-owner prerequisite
- Agent 2: `STORY-036` (deterministic ranking), starts after `STORY-035` merges
- Agent 3: `STORY-037` (keyboard parity), starts after `STORY-035` merges
- Agent 4: `STORY-039` (parity regression suite), starts after `STORY-035` merges
- Agent 5: `STORY-040` (performance guardrails), starts after `STORY-035` merges
- Agent 6: `STORY-038` (battlefield state cleanup), starts after `STORY-035` merges and preferably after `STORY-036`/`STORY-037` interface work stabilizes

## Merge Sequence

1. Merge `STORY-035` first.
2. Merge parallel set in any order once green: `STORY-036`, `STORY-037`, `STORY-039`, `STORY-040`.
3. Merge `STORY-038` last in this batch.

## Branching and PR Guardrails

- One story per branch.
- Rebase long-running branches against latest `hardening-the-flow` before opening PR.
- Require relevant frontend tests to pass before merge.
- Avoid introducing scope from post-MVP deferred items into these stories.
