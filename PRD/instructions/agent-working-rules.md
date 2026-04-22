# agent-working-rules.md

## Purpose
These rules define how an agent should behave when reading, editing, or extending this PRD set.

## Read Order
For most product tasks, read:
1. `sections/decisions.md`
2. the relevant target section file
3. any related flow/requirement files
4. the relevant instruction file

## General Rules
- Treat `sections/decisions.md` as the override layer.
- Do not assume older wording is correct if a decision conflicts with it.
- Keep edits narrow and local.
- Preserve stable IDs.
- Do not duplicate the same truth across too many files.
- Keep product content in section files.
- Keep process guidance in instruction files.

## Ambiguity Handling
- If something is unclear, add it to `sections/open-questions.md`.
- Do not silently guess.
- Do not upgrade optional ideas into committed scope.

## Scope Discipline
- MVP1 is narrow on purpose.
- Do not pull future-phase ideas into current scope.
- Do not optimize for long-term architecture at the cost of MVP1 simplicity.
- Preserve the flow-validation framing.

## Retrieval Discipline
- Read only the files needed for the task.
- Do not load the full PRD set when a smaller subset is enough.
- Prefer `decisions.md` plus one or two section files for focused tasks.

## Change Management Rules
- If a confirmed decision changes behavior, update `sections/decisions.md` first.
- Then update any affected section files.
- If a rule changes how agents should behave, update an instruction file, not a section file.
- If new uncertainty is introduced, add a `Q-###` entry.

## Prohibited Behaviors
- inventing scope
- implementing heavy rules logic without explicit product approval
- changing stack ordering semantics
- removing constraints because they seem inconvenient
- treating duplicate blocking as permanent long-term truth
