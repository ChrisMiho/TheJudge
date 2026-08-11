# agent-working-rules.md

## Purpose

Baseline behavior for any agent reading, editing, or extending this PRD set.

## Read Order

1. `sections/decisions.md`
2. the relevant target section file
3. related flow and requirement files
4. the relevant instruction file

Also read `instructions/doc-lifecycle.md` when creating or closing any markdown
under `PRD/` that is not a section file.

## General Rules

- Product truth goes in `sections/`. Process guidance goes in `instructions/`.
  Never mix them.
- Prefer narrow edits to one file at a time.
- Do not duplicate truth across files. Reference the ID instead.
- Preserve stable IDs once assigned. Never renumber.
- Match the existing voice and structure of the file being edited.

## Ambiguity Handling

When the source is ambiguous, do not guess. Write a `Q-###` in
`sections/open-questions.md` with options and a recommended next step, then
proceed with the recommendation if it is safe to do so.

## Scope Discipline

- Implement what the requirement says, not what it implies.
- A capability that is not backed by a `REQ` or `DEC` is out of scope.
- If the right change requires new scope, propose the decision first.

## Change Management Rules

Apply changes in this order:

1. The decision body in `sections/decisions/<domain>.md`
2. The index row in `sections/decisions.md`
3. The affected section files
4. Ephemeral work-package documents

## Commit Message Convention

- `docs(prd):` — documentation, PRD, or planning-only changes with no product
  behavior change
- `feat:` / `fix:` — changes to product behavior under `<code-roots>`

This makes "did this change behavior?" answerable from `git log` alone.

## Prohibited Behaviors

- inventing scope
- implementing significant new subsystems without an explicit decision
- changing public contracts or data ordering semantics without a decision
- removing constraints because they are inconvenient
- renumbering or deleting IDs
- committing, printing, or documenting real secrets in tracked files

<!-- Add to this list every time you catch an agent doing something you have to
     undo. Blunt imperatives work better here than nuance. -->
