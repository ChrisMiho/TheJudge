# agent-working-rules.md

## Purpose

These rules define how an agent should behave when reading, editing, or extending this PRD set.

## Read Order

For most product tasks, read:

1. the relevant feature spec `sections/<feature>/README.md` (current-state truth)
2. the related requirement/flow files (`sections/functional-requirements.md`,
   `sections/user-flows.md`, `sections/non-functional-requirements.md`)
3. `sections/decisions.md` only to resolve a cited `DEC-ID` to its one-line
   summary — the decision log is retired and is no longer read-first
4. the relevant instruction file

When creating or closing non-section markdown under `PRD/`, also read `instructions/doc-lifecycle.md`.

## General Rules

- Read-first truth is the feature specs under `sections/<feature>/README.md`; `sections/decisions.md` is a demoted historical index that only resolves a cited `DEC-ID`. Do not treat a decision as an override on a spec.
- Do not assume older wording is correct if a decision conflicts with it.
- Keep edits narrow and local.
- Preserve stable IDs.
- Do not duplicate the same truth across too many files.
- Keep product content in section files.
- Keep process guidance in instruction files.
- Follow `instructions/secrets-handling.md` for any work touching credentials, secret files, AWS auth, or secret-related env vars.
- Anything you hand the owner — an in-session summary, a subagent's report back, a skill handoff, a generated gate question, PR body, or receipt — follows `instructions/plain-language-standard.md`: lead with the ask, inline the substance of any `DEC`/`REQ` you cite, and put product terms before technical ones. This binds subagent output, not just the main chat.

## Ambiguity Handling

- If something is unclear, add it to `sections/open-questions.md`.
- Do not silently guess.
- Do not upgrade optional ideas into committed scope.
- For UI layout, containment, density, or “fill/stretch” feedback: read `sections/screen-layout.md` (DEC-149) before proposing sizes; do not invent full-bleed or edge-to-edge layouts that contradict the catalog.

## Scope Discipline

- The product remains an MTG assistant suite (an assistant with player-help features, not an official judge or rules engine) unless decisions explicitly expand scope.
- Do not pull historical or future roadmap ideas into current work unless promoted into the relevant feature spec and its cited `REQ`/`FLOW` entries.
- Do not optimize for long-term architecture at the cost of shipping the current slice.
- Preserve stack ordering, contract stability, and “assistant not judge” framing.
- Active execution context: `PRD/README.md` plus the relevant `sections/` files for the task.

## Retrieval Discipline

- Read only the files needed for the task.
- Do not load the full PRD set when a smaller subset is enough.
- Prefer the relevant feature spec and one or two requirement/flow section files for focused tasks; open the `decisions.md` index only to resolve a cited `DEC-ID`.

## Change Management Rules

- When behavior changes, update the relevant feature spec and its cited `REQ`/`FLOW` entries in place first — an ID names a place in the product, not a moment in time. No new decision is written.
- Then update any other affected section files.
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
