---
status: active
---

# Screen Guidance & Copy Review

Enhance existing on-screen guidance copy so first-time users understand each
screen's control and its behavior from one concise line. Deliberately surgical:
two existing helper lines are sharpened, no net-new guidance text is added, and
self-explanatory screens and themed labels are left unchanged. Triggered by
post-AWS-release feedback that the per-screen usage statements were not landing.

- Idea: [IDEA.md](./IDEA.md)
- Design brief: [DESIGN-BRIEF.md](./DESIGN-BRIEF.md)
- Gameplan: [GAMEPLAN.md](./GAMEPLAN.md)
- Status: active

## Slices

| Slice | Objective | Depends on | Parallel | Doc |
|---|---|---|---|---|
| A | Game-context "Players in game" helper (string 1) + test | — | yes | [slice-a](./slice-a-game-context-helper.md) |
| B | Zone-confirmation helper (string 2) + test; package ship gates | — | yes | [slice-b](./slice-b-zone-confirm-helper.md) |

Both slices touch disjoint files/tests and can run concurrently. Ship gates
(on slice B) run after both are merged.

## Implementation map

| Change | File | Test |
|---|---|---|
| String 1 — players helper | `apps/frontend/src/App.tsx:356` | `apps/frontend/src/App.game-setup-zones.test.tsx` |
| String 2 — zone helper | `apps/frontend/src/components/ZoneConfirmStep.tsx:27` | `apps/frontend/src/components/ZoneConfirmStep.test.tsx` |

## PRD authority

- DEC-092 — `PRD/sections/decisions/ui-presentation.md`
- REQ-070 — `PRD/sections/functional-requirements.md`
- Related: REQ-069, DEC-079, FLOW-001, FLOW-002, NFR-001
