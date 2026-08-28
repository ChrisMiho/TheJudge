# doc-lifecycle.md

## Purpose

These rules govern ephemeral planning markdown under `PRD/` so feature work does not recreate permanent duplicate doc trees.

## Durable vs ephemeral

**Durable (keep and maintain):**
- `sections/` — product truth
- `instructions/` — agent process and formatting rules
- `PRD/README.md` — navigation only
- `PRD/instructions/receipts/` — ship receipts (never deleted with work folders)
- Code-adjacent READMEs (for example `apps/backend/src/providers/README.md`, eval fixture READMEs)

**Ephemeral (delete when the package ships via cleanup):**
- `PRD/work/<kebab-slug>/` — scratch notes, spike conclusions, temporary checklists for one work package
- Per-package `STATUS.<status>` markers and package-local README status lines (deleted with the folder)
- Package rows in `PRD/work/STATUS.md` (board is durable as a file; individual slug rows are removed on cleanup)

## During work

- Create at most one folder per package: `PRD/work/<kebab-slug>/` (stable slug — never rename the folder to encode status)
- Include `PRD/work/<kebab-slug>/README.md` with `status: <value>` matching the package status vocabulary
- Keep exactly one empty marker: `PRD/work/<kebab-slug>/STATUS.<value>`
- Keep the slug listed under the matching heading in `PRD/work/STATUS.md`
- Full vocabulary and transition rules: `instructions/workflow-reference.md`
- Do not maintain a multi-row work-package table in `PRD/README.md` — one pointer to `work/STATUS.md` only
- Do not recreate removed patterns: `PRD/analysis/`, `PRD/gameplan/`, `PRD/stories/`, feature queues, or story checklists in `PRD/README.md`

## Status before delete

A package reaches `ship-ready` when every implementation slice is `done`. Cleanup
promotes durable truth and deletes only (or primarily) packages in `ship-ready`.
User may explicitly force cleanup of a non-`ship-ready` package.

## On package completion (cleanup)

1. Promote durable outcomes into the relevant feature spec `sections/<feature>/README.md` and its cited `REQ`/`FLOW` entries, plus any other affected `sections/*.md`
2. Write the receipt under `PRD/instructions/receipts/` **before** deleting the work folder
3. Delete `PRD/work/<kebab-slug>/` entirely
4. Remove the slug from `PRD/work/STATUS.md`
5. Update `PRD/README.md` only if navigation or read-order guidance changed (not to re-list packages)

## Decision lifecycle (retired)

- The decision log is **retired**. No new `DEC-###` entry is written. When a decision changes what a feature does, edit the current-state feature spec `sections/<feature>/README.md` and its cited `REQ`/`FLOW` entries in place — an ID names a place in the product, not a moment in time.
- `sections/decisions.md` is a demoted historical index (precedence #2, no longer read-first): a `DEC-ID → status → one-line summary` table that keeps every DEC-ID resolvable so cross-references never dangle. No ID is renumbered and nothing is appended.
- Decision bodies are deleted. The only two that still carry a body are the deployment survivors DEC-084 / DEC-169 in `sections/decisions/deployment.md`, kept until their content lands in a durable deployment doc, after which they retire too.
- Deep "how the code behaves" detail belongs in `sections/system-map.md` or related system-map detail files (DEC-044 / DEC-048), not in a feature spec.
- Backed by: DEC-063, DEC-168

## System-map promotion gate

A `sections/system-map.md` entry reflects shipped reality, not intent. It flips to `shipped` only when both conditions hold:

- product code exists and is wired in (under `apps/`, `scripts/`, or runtime data artifacts), **and**
- a cleanup receipt has been written at `PRD/instructions/receipts/<slug>-<YYYY-MM-DD>.md`.

Until both hold, the entry stays `planned` (decided/docs-only) or `partial` (some features shipped, others planned). The gate is enforced at cleanup time (`thejudge-cleanup`): on ship, flip the relevant entry/entries to `shipped`.

The shipped-vs-planned signal lives in the catalog only. Never edit a `DEC`/`REQ` `Status:` field to express it — those track decision lifecycle (`confirmed`/`superseded`) and are unchanged by this gate.

## On abandoned work

- Delete the `PRD/work/<kebab-slug>/` folder without promoting
- Remove the slug from `PRD/work/STATUS.md`
- Add a `Q-###` entry in `sections/open-questions.md` only if ambiguity remains for humans

## Prohibited patterns

- Duplicate execution roadmaps outside `sections/`
- Backlog or story checklists in `PRD/README.md` (use `PRD/work/STATUS.md`)
- Renaming `PRD/work/<slug>/` to encode status
- `PRD/stories/` or other permanent story backlogs under `PRD/`
- References to out-of-repo agent skills as if they were repo source of truth
