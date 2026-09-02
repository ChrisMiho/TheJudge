# graph-gate-review reference

## Where this sits in the run

```
define (node 3)
   |
   |  PRD/sections/ diff empty  ->  gate-qc (node 4), no interruption
   |
   |  PRD/sections/ diff non-empty
   v
PARKED — STATUS.owner-action, complete diff under ## Open gate
   |
   |  /graph-gate-review PRD/work/<slug>/
   v
gate resolved, ## Gate verdicts written, STATUS.refined restored
   |
   |  /graph-implement PRD/work/<slug>/
   v
gate-qc (node 4) — the run continues
```

No new resume path is invented. `graph-implement`'s entry-point table already says
a package at `STATUS.owner-action` parks again **unless** the recorded
`## Open gate` is resolved. This skill resolves it and restores the marker; the
existing table does the rest.

## Why the whole diff gates

The 2026-08-17 leak wrote DEC-161 and DEC-162 **and** REQ-146..151, NFR-015, and
FLOW-019. Gating only on new `DEC-###` would have let six requirements and a
flow through untouched. Six requirements are product behavior as surely as two
decisions are.

A `define` node that writes only `DESIGN-BRIEF.md` never trips this. The gate is
scoped to durable product truth, not to refinement activity.

## The one place autonomy is traded for control

Every other boundary in this workflow is mechanical, because the judgment was
already settled and only compliance was in doubt. This one is human, because no
check can stand in for the judgment: a script can detect that `PRD/sections/`
changed, but only the owner can say whether the product truth written there is
the product they want.

Everything below the product layer stays unattended — branching, stashing,
slicing, commits, PR plumbing. The trade is deliberate and narrow.

## Restating in product terms first

An owner handed a unified diff is reading syntax. Restate what the item means
for a player — what they see, what they can do, what changes — and only then
show the diff. The order matters: a diff shown first frames the review as
"does this text look right" rather than "is this the product I want".

## Verdict application is immediate

Apply each verdict before showing the next item. Batching them to the end loses
the correspondence between a verdict and the change it was about, and an owner
who revises an earlier call mid-walk has no clean way to say so.

## A rejected number is burned

Removing `REQ-153` from `PRD/sections/` does not free `153`. The next refinement
allocates `154`. Reissuing a consumed ID breaks every reference that already
pointed at it — receipts, work packages, prior decisions — which is the whole
reason stable IDs are stable. Record the rejection so the gap is explicable
later rather than looking like an accounting error.

## Gates this skill refuses

| Open gate | Owned by |
| --- | --- |
| a fourth `gate-qc` FAIL | the owner, via `thejudge-refinement` on the brief |
| a Critical or unresolved Important review finding | the owner, via `thejudge-implement` on the slice |
| `PROMPTED` — a denied or unlisted command | the owner: run it, or add the rule to `.claude/graph-profile.json` |
| `BLOCKED` — an external condition | the owner: fix auth, network, or access, then retry the run |
| no `## Open gate`, or one already resolved | nothing — the package is not parked |

Marking any of these resolved would record that a gate was addressed when it was
not, and the run would advance past a decision nobody made.
