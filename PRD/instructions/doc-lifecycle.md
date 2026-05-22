# doc-lifecycle.md

## Purpose

These rules govern ephemeral planning markdown under `PRD/` so feature work does not recreate permanent duplicate doc trees.

## Durable vs ephemeral

**Durable (keep and maintain):**
- `sections/` — product truth
- `instructions/` — agent process and formatting rules
- `PRD/README.md` — navigation only
- Code-adjacent READMEs (for example `apps/backend/src/providers/README.md`, eval fixture READMEs)

**Ephemeral (delete when the slice ships):**
- `PRD/work/<kebab-slug>/` — scratch notes, spike conclusions, temporary checklists for one slice

## During active work

- Create at most one folder per slice: `PRD/work/<kebab-slug>/`
- Include `PRD/work/<kebab-slug>/README.md` with `status: active` at the top
- Do not link scratch folders from root `README.md` or `PRD/README.md` until content is promoted
- Do not recreate removed patterns: `PRD/analysis/`, `PRD/gameplan/`, feature queues, or story checklists in `PRD/README.md`

## On slice completion

1. Promote durable outcomes into `sections/decisions.md` and affected `sections/*.md`
2. Delete `PRD/work/<kebab-slug>/` entirely
3. Update `PRD/README.md` only if navigation or read-order guidance changed

## On abandoned work

- Delete the `PRD/work/<kebab-slug>/` folder without promoting
- Add a `Q-###` entry in `sections/open-questions.md` only if ambiguity remains for humans

## Prohibited patterns

- Duplicate execution roadmaps outside `sections/`
- Backlog or story checklists in `PRD/README.md`
- References to out-of-repo Cursor skills as if they were repo source of truth
