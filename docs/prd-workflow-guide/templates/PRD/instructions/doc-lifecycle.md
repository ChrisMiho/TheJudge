# doc-lifecycle.md

## Purpose

Governs ephemeral planning markdown under `PRD/` so that feature work never
grows a permanent duplicate documentation tree.

## Durable vs ephemeral

**Durable — never deleted by feature work:**

- `sections/` — product truth
- `instructions/` — agent process
- `PRD/README.md` — navigation only
- `PRD/instructions/receipts/` — ship receipts
- code-adjacent READMEs

**Ephemeral — deleted when the work ships:**

- `PRD/work/<slug>/` and everything inside it
- `STATUS.<value>` markers
- the package row in `PRD/work/STATUS.md`

## During work

- At most one folder per feature: `PRD/work/<kebab-slug>/`.
- The slug is stable. Never rename the folder to encode status.
- The folder contains `README.md` with a `status: <value>` field.
- Exactly one empty marker file, `STATUS.<value>`. Never two.
- The slug is listed once in `PRD/work/STATUS.md`.
- Do not maintain a package table in `PRD/README.md`. One line pointing at the
  board is the maximum.

Status vocabulary and transition rules: `workflow-reference.md`.

## Status before delete

A package may only be deleted from the `ship-ready` status, or on an explicit
human force-override. Deleting a package whose work is not merged loses the
plan for unmerged work.

## On package completion

In this order:

1. Promote durable outcomes into `sections/decisions/<domain>.md`, the router
   index in `sections/decisions.md`, and the affected `sections/*.md` files.
2. Flip any `system-map.md` entries whose code now exists to `shipped`.
3. Write the receipt to `instructions/receipts/<slug>-<YYYY-MM-DD>.md`.
   **Before** the delete, always.
4. Delete `PRD/work/<slug>/` entirely.
5. Remove the slug from `PRD/work/STATUS.md`.
6. Update `PRD/README.md` **only** if navigation or read order changed.

Step 6 is a real rule. If every ship edits the navigation file, it becomes a
changelog and stops being navigable.

## Decision lifecycle

A superseded decision keeps its ID. Replace its body with a one-line tombstone
naming the superseding ID, and update the router index summary to match.

## System-map promotion gate

An entry flips to `shipped` only when both code exists and is wired in, and a
cleanup receipt exists. Until then it is `planned` or `partial`. Never express
shipped-vs-planned by editing a `DEC` or `REQ` `Status:` field.

## On abandoned work

- Produced nothing durable: delete the folder and the board row. No receipt.
- Produced a real conclusion, including "we decided not to do this because X":
  write the `DEC-###`, write a receipt with `Status: partial`, then delete.

Do not leave abandoned packages sitting at `ideation` indefinitely. Use
`deferred` for real-but-not-now; delete for dead.

## Prohibited patterns

- `PRD/analysis/`, `PRD/plans/`, `PRD/gameplan/`, `PRD/stories/`, or any other
  parallel planning tree
- feature queues, backlogs, or story checklists in `PRD/README.md`
- renaming `PRD/work/<slug>/` to encode status
- treating a shipped package's design brief as durable truth — it was promoted
  and deleted; cite the `DEC`/`REQ` instead

<!-- Every entry above is a directory or habit a well-meaning agent will
     propose. Add to the list by name whenever you catch a new one. -->
