status: active

# Excess Player UI

Reduce visual overload in the in-depth flow by making player details collapsible and defaulting the view to its compact state.

Reference: `Screenshot 2026-08-03 at 3.01.33 PM.png`

Approved direction: nested per-player arrows with one synchronized all-player secondary-details state, defaulting and resetting to collapsed while preserving player values.

Approved visual reference: `mock-a-nested-player-accordion.png` (directional layout evidence; generated text is non-normative).

## Product truth

- DEC-120
- REQ-100
- FLOW-001
- FLOW-010
- NFR-001

See `DESIGN-BRIEF.md` for the approved interaction, reset boundaries, unchanged data contracts, and
rejected alternatives. See `GAMEPLAN.md` for the implementation architecture and verification map.

## Slice table

| Slice | Name | Depends on | Status |
| --- | --- | --- | --- |
| A | Synchronized player-card disclosure contract | — | done |
| B | In-Depth roster orchestration and preservation | A | done |
| C | Destination reset, integration proof, and ship closure | A, B | planned |

The package is sequential: B consumes A's controlled shared-editor contract, and C can verify the
narrow destination-state reset only after the integrated In-Depth state exists.

## Implementation map

| Slice | New files | Files edited |
| --- | --- | --- |
| A | — | `components/PlayerRosterEditor.tsx` + test |
| B | — | `components/portal/MtgAssistantApp.tsx` + player-counter test, responsive App test, shared test helper |
| C | `App.excess-player-ui.test.tsx` | portal types/outlet/registry + tests, `MtgAssistantApp.tsx`, Life Tracker handoff test, shared test helper |

All implementation paths are relative to `apps/frontend/src/`.

## Next step

Implement Slice C next.

**Cursor**

```text
/thejudge-implement PRD/work/excess-ui/ slice C
```

**Codex**

```text
$thejudge-implement PRD/work/excess-ui/ slice C
```

**Claude Code**

```text
/thejudge-implement PRD/work/excess-ui/ slice C
```
