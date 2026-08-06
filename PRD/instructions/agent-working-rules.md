# agent-working-rules.md

## Purpose

These rules define how an agent should behave when reading, editing, or extending this PRD set.

## Read Order

For most product tasks, read:

1. `sections/decisions.md`
2. the relevant target section file
3. any related flow/requirement files
4. the relevant instruction file

When creating or closing non-section markdown under `PRD/`, also read `instructions/doc-lifecycle.md`.

## General Rules

- Treat `sections/decisions.md` as the read-first override layer and router to domain decision files.
- Do not assume older wording is correct if a decision conflicts with it.
- Keep edits narrow and local.
- Preserve stable IDs.
- Do not duplicate the same truth across too many files.
- Keep product content in section files.
- Keep process guidance in instruction files.
- Follow `instructions/secrets-handling.md` for any work touching credentials, secret files, AWS auth, or secret-related env vars.

## Ambiguity Handling

- If something is unclear, add it to `sections/open-questions.md`.
- Do not silently guess.
- Do not upgrade optional ideas into committed scope.
- For UI layout, containment, density, or “fill/stretch” feedback: read `sections/screen-layout.md` (DEC-149) before proposing sizes; do not invent full-bleed or edge-to-edge layouts that contradict the catalog.

## Scope Discipline

- The product remains an MTG assistant suite (an assistant with player-help features, not an official judge or rules engine) unless decisions explicitly expand scope.
- Do not pull historical or future roadmap ideas into current work unless promoted via the relevant `sections/decisions/<domain>.md` file and router index line in `sections/decisions.md`.
- Do not optimize for long-term architecture at the cost of shipping the current slice.
- Preserve stack ordering, contract stability, and “assistant not judge” framing.
- Active execution context: `PRD/README.md` plus the relevant `sections/` files for the task.

## Retrieval Discipline

- Read only the files needed for the task.
- Do not load the full PRD set when a smaller subset is enough.
- Prefer the `decisions.md` router, the relevant `decisions/<domain>.md` file, and one or two section files for focused tasks.

## Change Management Rules

- If a confirmed decision changes behavior, update the relevant `sections/decisions/<domain>.md` body and router index line in `sections/decisions.md` first.
- Then update any affected section files.
- If a rule changes how agents should behave, update an instruction file, not a section file.
- If new uncertainty is introduced, add a `Q-###` entry.

## Commit Message Convention

Conventional-commits-lite — a prefix convention only, not a validated commit-lint pipeline:

- `docs(prd):` — PRD/doc/plan-only changes with no product behavior change, including edits under `PRD/` (truth-layer sections, instructions) and `PRD/work/` planning.
- `feat:` / `fix:` — changes that ship or fix product behavior (code under `apps/`, `scripts/`, or runtime data artifacts).

Lite by intent: no full conventional-commits enforcement and no tooling.

## Prohibited Behaviors

- inventing scope
- implementing heavy rules logic without explicit product approval
- changing stack ordering semantics
- removing constraints because they seem inconvenient
- treating duplicate blocking as permanent long-term truth
- committing, printing, or documenting real secrets in tracked files
