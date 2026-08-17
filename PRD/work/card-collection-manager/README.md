---
status: owner-action
---

# card-collection-manager

Local card collection manager: batch scan into folder/deck/box lists, printing correction, overview pie + total value, and master backup import/export.

See `IDEA.md` for the original idea and `DESIGN-BRIEF.md` for the refined design.

## Autonomous metadata

- Autonomous base: **MISSING** — the stated base `origin/feature/collection-manager` does not exist. A human must designate and push the base branch, then replace this line with `- Autonomous base: origin/<branch>`.

## Open gate

Parked at `owner-action` by run `graph-20260817-110500` (node 3 `define`) on **Q-060 — what is this package's autonomous base?**

Refinement itself is **complete and unblocked**: `DESIGN-BRIEF.md` plus DEC-161/DEC-162, REQ-146..REQ-151, FLOW-019/FLOW-020, NFR-015, and the aligned `PRD/sections/` updates are written. They are **uncommitted**, because there is no valid branch to commit them to. Full evidence and the resume command: `GRAPH-RUN.md`.

Once the base branch exists and is recorded above, this package returns to `refined` and the next node is quality-check.
