---
status: active
---

# mobile-player-details-overflow

Fix mobile horizontal overflow when expanding In-Depth Question per-player secondary details; verify with Playwright MCP.

See `IDEA.md`, `DESIGN-BRIEF.md`, and `GAMEPLAN.md`.

## Product truth

| ID | Role |
| --- | --- |
| DEC-128 | Mobile containment for expanded secondary player details |
| REQ-106 | Acceptance criteria + Playwright MCP verification path |
| FLOW-001 | Edge/notes for mobile containment |

## Preparation gate

- Quality-check: **PASS** (2026-08-04) — brief aligns with DEC-117/DEC-120; DEC-128/REQ-106 scoped; Playwright MCP mandated; no open questions; no stack/API drift.

## Slice table

| Slice | Status | Objective | Depends on |
| --- | --- | --- | --- |
| [A](./slice-a-playwright-repro.md) | planned | Reproduce overflow with Playwright MCP | — |
| [B](./slice-b-mobile-containment-fix.md) | planned | Mobile containment CSS/layout fix | A |
| [C](./slice-c-playwright-verify.md) | planned | Playwright MCP verify + ship gates | B |

## Implementation map

| Area | Path |
| --- | --- |
| In-Depth extras | `apps/frontend/src/components/portal/MtgAssistantApp.tsx` |
| Shared roster chrome | `apps/frontend/src/components/PlayerRosterEditor.tsx` |
| Evidence | `PRD/work/mobile-player-details-overflow/evidence/` |

## Next

`/thejudge-implement PRD/work/mobile-player-details-overflow/ slice A`
