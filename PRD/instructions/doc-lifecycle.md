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
- Do not recreate removed patterns: `PRD/analysis/`, `PRD/gameplan/`, `PRD/stories/`, feature queues, or story checklists in `PRD/README.md`

## On slice completion

1. Promote durable outcomes into the relevant `sections/decisions/<domain>.md` file, the router index line in `sections/decisions.md`, and affected `sections/*.md`
2. Delete `PRD/work/<kebab-slug>/` entirely
3. Update `PRD/README.md` only if navigation or read-order guidance changed

## Decision lifecycle

- New decisions land in their relevant `sections/decisions/<domain>.md` file and get a router index line in `sections/decisions.md`.
- A fully superseded decision body trims to a one-line tombstone with the original ID and `superseded by DEC-XXX`, kept in its domain file so the ID stays resolvable.
- Deep "how the code behaves" detail belongs in `sections/system-map.md` or related system-map detail files (DEC-044 / DEC-048), not in decision `Impact:` blocks.

## System-map promotion gate

A `sections/system-map.md` entry reflects shipped reality, not intent. It flips to `shipped` only when both conditions hold:

- product code exists and is wired in (under `apps/`, `scripts/`, or runtime data artifacts), **and**
- a cleanup receipt has been written at `PRD/instructions/receipts/<slug>-<YYYY-MM-DD>.md`.

Until both hold, the entry stays `planned` (decided/docs-only) or `partial` (some features shipped, others planned). The gate is enforced at cleanup time (`thejudge-cleanup`): on ship, flip the relevant entry/entries to `shipped`.

The shipped-vs-planned signal lives in the catalog only. Never edit a `DEC`/`REQ` `Status:` field to express it — those track decision lifecycle (`confirmed`/`superseded`) and are unchanged by this gate.

## On abandoned work

- Delete the `PRD/work/<kebab-slug>/` folder without promoting
- Add a `Q-###` entry in `sections/open-questions.md` only if ambiguity remains for humans

## Prohibited patterns

- Duplicate execution roadmaps outside `sections/`
- Backlog or story checklists in `PRD/README.md`
- `PRD/stories/` or other permanent story backlogs under `PRD/`
- References to out-of-repo Cursor skills as if they were repo source of truth
