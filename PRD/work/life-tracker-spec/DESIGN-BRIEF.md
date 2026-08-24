# DESIGN-BRIEF — life-tracker-spec

## What this ships

One file: `PRD/sections/life-tracker/README.md`, the current-state feature spec
for the Player Life Tracker. An owner reads it once and knows what the tracker
does today — life counters, commander damage, day/night, game setup, persistence,
and the one-way seed into MTG Assistant — without an agent replaying which
decision superseded which.

Nothing else about the tracker changes. Not the code, not the shipped behavior,
not a single existing `DEC`, `REQ`, `FLOW`, `system-map.md`, or `screen-layout.md`
entry.

## Why it is needed

Today the tracker's product truth is split across six sources:

| Source | What it holds |
| --- | --- |
| `sections/decisions/player-life-tracker.md` | DEC-101, DEC-103, DEC-132, DEC-136, DEC-139 |
| `sections/decisions/game-context-model.md` | DEC-102 (additive counter contract) |
| `sections/functional-requirements.md` | REQ-081, REQ-082, REQ-083, REQ-084, REQ-085, REQ-111, REQ-112 |
| `sections/user-flows.md` | FLOW-013 |
| `sections/system-map.md` | `## Player Life Tracker` subsystem entry |
| `sections/screen-layout.md` | `#### Player Life Tracker` screen row |

A decision records *a change*, so current truth is the sum of a supersession
chain. Two live examples, both found while writing this brief:

- DEC-101 specifies "edge `+`/`−` tap zones". DEC-136 replaced them with
  half-card zones oriented by seat rotation. REQ-081 still says "edge tap zones"
  and REQ-112 still specifies a ≈67px edge band — for a surface that no longer
  exists.
- DEC-101 and REQ-082 describe a counter panel; DEC-139 changed it from a
  content-sized bottom sheet to a full-height overlay.

An owner reading `functional-requirements.md` alone gets the tracker wrong.

## The decision this rests on

**DEC-168** (`sections/decisions/doc-process.md`, router row in
`sections/decisions.md`). It establishes the feature-spec layer and lands one
instance. In short:

- A feature spec lives at `PRD/sections/<feature>/README.md`.
- It is a **derived, non-authoritative view**. `sections/decisions.md` keeps
  precedence #1 and Read-First #1. The spec's own marker says the cited
  `DEC`/`REQ`/`FLOW` wins any conflict, so a spec that comes out wrong is
  corrected against a source that still exists.
- No source is moved, retired, reordered, renumbered, or edited to make room.
- The template is fixed so later feature specs do not each invent a shape.

## Scope

### In

1. Create `PRD/sections/life-tracker/README.md` on the DEC-168 template.
2. Add one Section Inventory row for `sections/life-tracker/` to `PRD/README.md`
   (navigation only).

### Out

- Any `apps/` change, any change to shipped tracker behavior.
- Retiring, reordering, renumbering, editing, or tombstoning any existing
  `DEC`, `REQ`, `FLOW`, or `NFR`.
- Moving the `screen-layout.md` Player Life Tracker row, or any `system-map.md`
  edit including a `Details:` pointer.
- Flipping precedence to the spec layer, or auditing decisions against specs.
- The other six feature directories named in the intake gameplan.
- `open-questions.md`.

## The spec's required content

### Template

| Field | Holds |
| --- | --- |
| `Status:` | draft marker + the precedence sentence (cited DEC/REQ/FLOW wins) |
| `Backed by:` | every consolidated ID: DEC-101, DEC-102, DEC-103, DEC-132, DEC-136, DEC-139, REQ-081–085, REQ-111, REQ-112, FLOW-013, NFR-001, NFR-006 |
| **What it is** | one paragraph, player terms |
| **How it works** | player-facing behavior grouped by surface, each behavior carrying a `Built:` marker |
| **Measured bounds** | every surviving measurement, attached to the behavior it constrains |
| **Rejected alternatives and deferred scope** | closed doors — what was tried and replaced, what was deferred, what is out of scope |
| **Where it lives** | coarse code location, deferring to `system-map.md` |

### Surfaces the "How it works" section must cover

Life table · counter panel and commander-damage matrix · day/night header
control · Game Setup · reset / New Game · persistence · the one-way MTG
Assistant seed.

### The supersession rule

A behavior enters the spec **only in its current form**. The supersession
narrative does not. Where a replaced approach is load-bearing — it tells a
future agent which door is closed — it is recorded under **Rejected
alternatives**, not narrated in **How it works**.

### The measured-bound rule

A measurement travels with its behavior **if that surface still exists**. A
measurement whose surface was replaced is dropped from **Measured bounds** and
named as a closed door instead. An ambiguous case stays and is flagged in the
spec rather than being silently resolved.

Worked example, and the specific trap in this package:

| Bound | Source | Verdict |
| --- | --- | --- |
| Commander-damage `−`/`+` bands ≈53px | REQ-112 | **survives** — the cells still exist |
| Life-adjustment edge bands ≈67px | REQ-112 | **dropped** — DEC-136 replaced edge bands with half-card zones; recorded as a closed door |
| One-screen fit at every player count, no per-row/per-card minimum | DEC-136, `screen-layout.md` | survives |
| Counter panel full-height, no dead scrim at any player count | DEC-139 | survives |
| Player count 2–8; starting life 20/25/30/40 + Custom default 60; count defaults 2→20, 3+→40 | DEC-101, REQ-081 | survives |

## Assumptions resolved

Every material assumption below was resolved by the assumption ladder in
`PRD/instructions/preparation-contract.md`. None met the three-condition genuine
blocker test.

| # | Question | Resolution | Rung | Evidence |
| --- | --- | --- | --- | --- |
| A1 | Does the spec layer supersede the decision log? | No. Spec is a draft, derived view; `decisions.md` keeps precedence #1. | 1, then 5 | `PRD/README.md` Source-of-Truth Precedence lists `sections/decisions.md` first; `doc-lifecycle.md` makes it the decision lifecycle authority. Nothing in `PRD/sections/` authorizes demoting it. Preserving current behavior is rung 5. |
| A2 | Does this need a durable decision at all, or can the shape live in the work package? | Durable decision. `PRD/work/<slug>/` is deleted at cleanup, so a shape recorded only there is lost. | 1 | `doc-lifecycle.md` — `PRD/work/` is ephemeral, `sections/` is durable. |
| A3 | Which domain file holds it? | `sections/decisions/doc-process.md`. | 3 | DEC-044, DEC-048, DEC-063 — every prior PRD-structure decision lives there. |
| A4 | Does the decision bind all seven Phase A directories? | No. Defines the shape, lands one instance, requires no other feature to adopt it. | 4 | Smallest reversible scope; the IDEA's non-goals exclude the other six. |
| A5 | What is the file layout — one file, or several? | One file, `PRD/sections/life-tracker/README.md`. Directory may grow later without a rename. | 3, then 4 | DEC-048 precedent: a `sections/<x>/` directory on a fixed lightweight template. README is the repo's entry-point convention (`PRD/README.md` is the navigation layer). |
| A6 | Does a `REQ-###` accompany the decision? | No. | 3 | DEC-048 and DEC-063 both record "(none — documentation and process decision; no functional requirement is added or changed)". |
| A7 | Do the `screen-layout.md` Player Life Tracker row and its measured bounds move into the spec? | No — cited and reproduced, not relocated. | 4, then 5 | The row is authoritative under DEC-149/REQ-126 while the spec is explicitly draft; moving it would demote a live catalog and edit a file six sibling packages also target. Reproducing loses nothing. |
| A8 | Does `system-map.md` gain a `Details:` pointer to the spec? | No. | 6, then 1 | DEC-048 defines `Details:` as pointing at subsystem detail files under `sections/system-map/`. A player-facing feature spec is a different layer; overloading the field would blur two contracts. Discoverability is handled by the `PRD/README.md` Section Inventory row instead. |
| A9 | How is a superseded behavior handled — narrated, or dropped? | Dropped from **How it works**; recorded as a closed door under **Rejected alternatives** when load-bearing. | 4 | The spec's whole job is current state; a supersession narrative rebuilds the problem. A closed door is a current-state constraint. |
| A10 | What happens to a measured bound whose surface was replaced (the ≈67px edge band)? | Dropped from **Measured bounds**, named as a closed door. Ambiguous cases stay and are flagged. | 2, then 4 | Rung 2 — existing tested behavior: DEC-136 shipped half-card zones, so no edge band exists to constrain. |
| A11 | Does refinement write the spec file itself? | No. Refinement lands DEC-168; the spec file is the implementation deliverable. | 1 | `thejudge-refinement` writes `DESIGN-BRIEF.md` plus `PRD/sections/` product truth; `thejudge-map-out` and `thejudge-implement` own the deliverable. |

## Intake handling

`PRD/work/life-tracker-spec/intake/refactor-gameplan.md` was read as evidence.
It cites `workflow.md`, `workflow-decomposition.md`, and `answers.md`; none was
opened, per the graph contract. Its Phase A ordering and its identity/ID,
bucket, and content-preservation constraints informed this brief, but every
product decision above was made against `PRD/sections/` evidence and the
assumption ladder, and is recorded in DEC-168 for the owner to accept or reject
at the `define` gate.

Where the intake and this brief differ:

- The intake's `data/` membership test and its `screen-layout.md` split rule are
  Phase A-wide rulings. This package adopts neither: the life tracker has no
  corpus, and A7 keeps the screen row where it is.
- The intake's constraint 4 (drop `Status:` in favor of a `Built:` marker)
  applies inside the spec's own template only. No existing `REQ` `Status:` field
  is touched.
- The intake's `open-questions.md` retirement plan (constraint 10) is out of
  scope entirely.

## PRD alignment

| File | Change |
| --- | --- |
| `PRD/sections/decisions/doc-process.md` | new `DEC-168` body |
| `PRD/sections/decisions.md` | new `DEC-168` router index row |

No `REQ`, `NFR`, `FLOW`, or `Q` is added, edited, or renumbered.

## Non-goals

- No product-code change and no change to shipped tracker behavior.
- No retiring, reordering, or renumbering of the decision log.
- No precedence flip; the spec is draft and derived.
- No work on the other six Phase A directories (`user-feedback`,
  `trade-balancer`, `scan`, `quick-lookup`, shared chrome, `in-depth`).

## Open questions

None. No question in this package met the three-condition genuine blocker test.

## Verification

- `PRD/sections/life-tracker/README.md` exists and carries all seven template
  fields from DEC-168.
- Its `Backed by:` line names every ID in the source inventory table above.
- Every surviving bound in the measured-bounds table above appears in the spec;
  the ≈67px edge band appears only as a closed door.
- `git diff` shows no change under `apps/`, and no change to any existing `DEC`,
  `REQ`, `FLOW`, or `NFR` body.
- `PRD/README.md` has exactly one new Section Inventory row.
