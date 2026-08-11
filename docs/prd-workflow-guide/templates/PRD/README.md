# README.md

## Status
- Project Status: <active | early | maintenance>
- Documentation baseline: product truth in `sections/`; agent process in `instructions/`
- Next work: <one line, or a pointer to the highest-priority decision to make>

## Purpose
This file is the control-plane document for the PRD set.

Use it to:
- find the right file for a given task
- understand source-of-truth precedence
- navigate product content vs. agent instructions

This file is navigation only. It is not a backlog, a roadmap, or a changelog.

## Read First
For implementation work, read in this order:
1. `sections/decisions.md`
2. the relevant target section file(s)
3. the relevant instruction file(s)

## Source-of-Truth Precedence
1. `sections/decisions.md` (and the domain files it routes to) overrides older conflicting language anywhere
2. section files define current product scope
3. instruction files define how the agent should process and generate content
4. `README.md` is the navigation layer only

## Section Inventory

| File | Status | Description |
|---|---|---|
| `sections/overview.md` | <complete/draft> | High-level summary of the product and current status |
| `sections/problem-statement.md` | <complete/draft> | Problem being solved and why it matters |
| `sections/goals-and-non-goals.md` | <complete/draft> | Goals, success metrics, scope boundaries, out-of-scope items |
| `sections/personas.md` | <complete/draft> | Primary users and their pain points |
| `sections/user-flows.md` | <complete/draft> | End-to-end user journeys and edge flows |
| `sections/functional-requirements.md` | <complete/draft> | Product requirements and acceptance criteria |
| `sections/non-functional-requirements.md` | <complete/draft> | Performance, security, maintainability constraints |
| `sections/integrations-and-data.md` | <complete/draft> | Stack, API contracts, data models, dependencies |
| `sections/open-questions.md` | <complete/draft> | Unresolved items needing human decisions |
| `sections/decisions.md` | active | Read-first router for confirmed decisions |
| `sections/decisions/` | active | Domain decision files holding confirmed DEC bodies |
| `sections/system-map.md` | active | Subsystem catalog: shipped-vs-planned, behavior, location |

## Instruction Inventory

| File | Status | Description |
|---|---|---|
| `instructions/agent-working-rules.md` | active | Behavioral rules for any agent editing this PRD set |
| `instructions/doc-lifecycle.md` | active | When to create, promote, and delete ephemeral planning docs |
| `instructions/writing-rules.md` | active | Rules for writing and editing these documents |
| `instructions/requirement-format.md` | active | Required templates for requirements, flows, decisions, questions, slices |
| `instructions/technical-design-rules.md` | active | Constraints for architecture and implementation proposals |
| `instructions/secrets-handling.md` | active | Guardrails for credential material |
| `instructions/test-naming.md` | active | Test title convention |
| `instructions/workflow-reference.md` | active | Skill workflow, status vocabulary, work-folder lifecycle |
| `instructions/runtime-process-hygiene.md` | active | Browser/dev-server ownership and cleanup contract |

## Which Files to Read for Which Task

### If the task is product understanding
1. `sections/overview.md`
2. `sections/decisions.md`
3. `sections/goals-and-non-goals.md`
4. `sections/problem-statement.md`

### If the task is feature implementation
1. `sections/decisions.md`
2. `sections/functional-requirements.md`
3. `sections/user-flows.md`
4. `sections/integrations-and-data.md`
5. `sections/non-functional-requirements.md`
6. `instructions/technical-design-rules.md` (if architecture or code structure is involved)
7. `instructions/secrets-handling.md` (if credentials or env vars are involved)

### If the task is slice planning or map-out
1. `sections/decisions.md`
2. `sections/functional-requirements.md`
3. `sections/user-flows.md`
4. `instructions/workflow-reference.md`
5. `instructions/requirement-format.md`

### If the task is writing or renaming tests
1. `instructions/test-naming.md`
2. `instructions/technical-design-rules.md` (if shared helpers are involved)

### If the task is document editing or extension
1. `instructions/agent-working-rules.md`
2. `instructions/doc-lifecycle.md` (if creating or closing non-section PRD markdown)
3. `instructions/writing-rules.md`
4. `sections/decisions.md`
5. the relevant target section file

<!-- Add a task-specific read list whenever you notice agents reading too much
     or the wrong things for a recurring kind of work. -->

## Working Rules Summary
- Keep product truth in section files.
- Keep workflow and generation guidance in instruction files.
- Ephemeral planning lives only in `work/<slug>/` and is deleted when the work ships.
- Do not guess when the source is ambiguous.
- Put unresolved ambiguity in `sections/open-questions.md` as a `Q-###`.
- Record confirmed decision bodies in `sections/decisions/<domain>.md` and keep the router index line in `sections/decisions.md` current.
- Prefer narrow edits to one file at a time.
- Preserve stable IDs once assigned. Never renumber.

## Work packages

See [work/STATUS.md](./work/STATUS.md) — the skill-maintained board and the only
package list. Do not duplicate it here.
