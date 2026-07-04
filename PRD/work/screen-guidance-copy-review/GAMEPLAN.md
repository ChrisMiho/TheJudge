# GAMEPLAN: Screen Guidance & Copy Review

Copy-only enhancement of two existing on-screen helper lines so a first-time
user understands the control and its behavior from one concise line. No net-new
guidance text, no chrome, no behavior change. Scope authority: DEC-092, REQ-070.

## Architecture / data flow

Presentation-only. Two static strings are swapped in two React components. No
props, state, types, schemas, prompts, routes, or flow logic change. Both helper
lines are hard-coded JSX text nodes:

- Game-context "Players in game" helper — `apps/frontend/src/App.tsx:356`
  (`<p className="text-xs text-zinc-400">` under the "Players in game" label).
- Zone-confirmation helper — `apps/frontend/src/components/ZoneConfirmStep.tsx:27`
  (`<p className="text-sm text-zinc-400">` under `StagedStepHeader`).

The two changes touch disjoint files and disjoint tests → fully independent,
parallel-ready. No shared state, no ordering dependency.

## Exact string changes (byte-for-byte — REQ-070 acceptance)

| # | File:line | Before | After |
|---|---|---|---|
| 1 | `App.tsx:356` | `2 players start at 20 life. 3+ players default to 40 life.` | `Tap ▾ to set names and life totals — 2 players start at 20, 3+ at 40.` |
| 2 | `ZoneConfirmStep.tsx:27` | `Select the zones relevant to your question. Defaults are pre-checked based on the turn phase.` | `Select each zone at the top of the screen to add cards to it.` |

Note the em dash (`—`, U+2014) and `▾` (U+25BE) in string 1. Copy exactly.

## Guardrails (must NOT change)

- The `▾`/`▸` expander control's `aria-label` / `aria-expanded` / toggle behavior
  (REQ-069) — copy-only, no markup change.
- "Add cards to zones" helper, context-enrichment screen, answered/follow-up
  view, scan on-open state, stack-order note, tuned scan cause-hints
  (DEC-062/DEC-072), fallback-question note — byte-for-byte unchanged.
- Themed labels/buttons (`Decrypt Stack`, `Begin stackening!`, `Context
  enrichment`, `Consulting the stack…`) — unchanged.
- No new intro lines, tooltips, popovers, coachmarks, modals, onboarding.
- No change to `AskAiRequest`, Zod schemas, `GameContext`, prompts, provider
  selection, backend routes, card metadata, scan/stabilizer logic, stack
  ordering, step names/order, flow logic, data pipeline.

## Slices

| Slice | Objective | Depends on | Parallel |
|---|---|---|---|
| A | Enhance game-context "Players in game" helper (string 1) + test | — | yes |
| B | Enhance zone-confirmation helper (string 2) + test; package ship gates | — | yes |

Both slices are independent. Slice B carries the package-level ship gates and
PRD-promotion checklist (executed at cleanup); run the ship gates after both A
and B are merged.

## Verification checklist

- [ ] `App.tsx` renders exactly `Tap ▾ to set names and life totals — 2 players start at 20, 3+ at 40.`; old string absent.
- [ ] `ZoneConfirmStep.tsx` renders exactly `Select each zone at the top of the screen to add cards to it.`; old string absent.
- [ ] New/updated tests assert both enhanced strings render and both replaced strings no longer appear.
- [ ] No other helper/guidance text changed (grep guardrail below).
- [ ] `npm --workspace apps/frontend run test` green.
- [ ] `npm --workspace apps/frontend run typecheck` green.

### Guardrail grep (should return nothing)

```bash
grep -rn "2 players start at 20 life\|Select the zones relevant to your question" apps/frontend/src/
```
