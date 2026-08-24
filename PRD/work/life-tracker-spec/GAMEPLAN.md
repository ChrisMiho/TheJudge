# GAMEPLAN — life-tracker-spec

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

## What ships

One new file, `PRD/sections/life-tracker/README.md` — the DEC-168 current-state
feature spec for the Player Life Tracker — plus one navigation row in
`PRD/README.md`. Nothing under `apps/` changes. No existing `DEC`, `REQ`,
`FLOW`, or `NFR` body changes.

DEC-168 and its router row already landed during refinement
(`PRD/sections/decisions/doc-process.md` §DEC-168; `PRD/sections/decisions.md`
row). This package's remaining work is the two items DEC-168's Impact block
authorizes and nothing else: write the spec file on its template, add the one
Section Inventory row.

## Architecture / data flow

Not applicable — no runtime component, no code path, no data flow. This is a
documentation-authoring task: consolidate existing `PRD/sections/` product
truth into one derived, non-authoritative view, per the template DEC-168
defines.

## Slices

| Slice | Scope | Dependency |
| --- | --- | --- |
| A | Write `PRD/sections/life-tracker/README.md` on the DEC-168 template, consolidating the full source inventory (DEC-101, DEC-102, DEC-103, DEC-132, DEC-136, DEC-139; REQ-081–085, REQ-111, REQ-112; FLOW-013; NFR-001, NFR-006) into current-state form across all seven surfaces, with the measured-bounds supersession rule applied. | none |
| B | Add the one `PRD/README.md` Section Inventory row for `sections/life-tracker/`; run final corpus-diff verification; ship gates. | sequential on A — the nav row's description must describe the spec's actual shipped content, not an unwritten file. |

Two slices, not one: A is a source-verification-heavy authoring task against
six existing documents; B is a one-line navigation edit plus the whole
package's diff-scope proof. Splitting keeps each slice's acceptance criteria
checking one thing.

## Verification checklist (package-level, restated from DESIGN-BRIEF)

- `PRD/sections/life-tracker/README.md` exists and carries all seven DEC-168
  template fields.
- Its `Backed by:` line names every ID in the source inventory.
- Every surviving bound in the DESIGN-BRIEF measured-bounds table appears
  attached to its behavior; the ≈67px edge band appears only as a closed door
  under **Rejected alternatives and deferred scope**.
- `git diff` shows no change under `apps/`, and no change to any existing
  `DEC`, `REQ`, `FLOW`, or `NFR` body.
- `PRD/README.md` has exactly one new Section Inventory row.

## Runtime / browser risk

None. This package is documentation-only — no UI surface changes, nothing
browser-observable. No Playwright verification is required
(`PRD/instructions/runtime-process-hygiene.md`).

## Corpus checks this repo already runs

No `apps/` test suite applies. Verification instead uses `git diff --stat` /
`git diff` scoped diff checks and `grep`/`sed` structural checks against the
PRD markdown files touched, matching how prior docs-only packages in this repo
(e.g. `prd-doc-traceability`) were verified.

## Next step

`/thejudge-implement PRD/work/life-tracker-spec/ slice A` (Claude Code) or
`$thejudge-implement PRD/work/life-tracker-spec/ slice A` (Codex).

Orchestrated mode: this package returns to `graph-run` for independent
review, fresh verification, and publication — not published directly by this
skill.
