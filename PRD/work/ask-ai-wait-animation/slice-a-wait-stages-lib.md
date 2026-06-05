# Slice A — Wait stages lib

## Status: done

## Goal

Create the pure threshold-config module and stage-selector function that the rest of the feature depends on.

## Requirements

1. Export `WAIT_STAGES: readonly WaitStage[]` with all six approved threshold entries from the DESIGN-BRIEF.
2. Export `WaitStage` type: `{ threshold: number; message: string; variant: "calm" | "curious" | "absurd" }`.
3. Export `selectStage(elapsedSeconds: number, stages: readonly WaitStage[]): WaitStage` — returns the highest stage whose threshold ≤ elapsed.
4. Export `formatElapsed(seconds: number): string` — formats elapsed time as `m:ss` when ≥ 60s, `0:ss` otherwise (e.g. `0:04`, `1:03`).
5. No React imports; pure TypeScript.

## Stage config

| Threshold | Message | Variant |
|-----------|---------|---------|
| 0s | Consulting the stack… | calm |
| 3s | Priority is passing to the LLM. | calm |
| 8s | The judge is reading every layer. Twice. | curious |
| 15s | Still waiting? The servers are scrying 1. | curious |
| 25s | At this point we're basically in a MUD subgame. | absurd |
| 40s | If this were F6, we'd have resolved by now. | absurd |

## Files touched

- `apps/frontend/src/lib/askAiWaitStages.ts` (create)
- `apps/frontend/src/lib/askAiWaitStages.test.ts` (create)

## Tests

- `selectStage(0, WAIT_STAGES)` → stage with threshold 0
- `selectStage(2, WAIT_STAGES)` → stage with threshold 0
- `selectStage(3, WAIT_STAGES)` → stage with threshold 3
- `selectStage(8, WAIT_STAGES)` → stage with threshold 8
- `selectStage(40, WAIT_STAGES)` → stage with threshold 40
- `selectStage(999, WAIT_STAGES)` → stage with threshold 40
- `formatElapsed(0)` → `"0:00"`
- `formatElapsed(4)` → `"0:04"`
- `formatElapsed(59)` → `"0:59"`
- `formatElapsed(60)` → `"1:00"`
- `formatElapsed(63)` → `"1:03"`

## Acceptance criteria

- [ ] `WAIT_STAGES` has exactly 6 entries matching the approved copy above
- [ ] `selectStage` never returns undefined for any non-negative input
- [ ] `formatElapsed` pads seconds to 2 digits always
- [ ] All unit tests pass: `npm --workspace apps/frontend run test -- askAiWaitStages`

## Verification

```bash
npm --workspace apps/frontend run test -- askAiWaitStages
npm --workspace apps/frontend run typecheck
```
