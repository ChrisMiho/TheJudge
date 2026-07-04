# DESIGN-BRIEF: Screen Guidance & Copy Review

## Problem

Post-AWS-release feedback from friends: first-time users struggle to figure out
how to use each screen. The per-screen statements meant to explain usage are not
landing.

## Scope (approved)

A **copy-only** pass that **enhances existing on-screen guidance text** so a
first-time user understands the control and its behavior from one concise line.
Deliberately surgical: only the helper lines that under-explain are touched; no
net-new guidance text is added and self-explanatory screens are left alone.

Two existing helper lines are enhanced:

| Screen | Before | After |
|---|---|---|
| Game context — "Players in game" helper | `2 players start at 20 life. 3+ players default to 40 life.` | `Tap ▾ to set names and life totals — 2 players start at 20, 3+ at 40.` |
| Zone confirmation helper | `Select the zones relevant to your question. Defaults are pre-checked based on the turn phase.` | `Select each zone at the top of the screen to add cards to it.` |

- Game-context change adds the missing signal that the `▾` expander opens the
  name/life editing panel, while keeping the 20/40 defaults behavior in one line.
- Zone-confirmation change is a direct, action-oriented line; the turn-phase
  defaults clause is intentionally dropped.

## Decisions

- **Voice:** keep the playful themed labels/buttons (`Decrypt Stack`,
  `Begin stackening!`, `Context enrichment`, `Consulting the stack…`) unchanged;
  the plain helper lines do the orienting.
- **No net-new text:** no new intro/orientation lines, tooltips, popovers,
  coachmarks, modals, or onboarding flow — clearer existing words, not more words.
- **Single concise line** per enhanced helper.

## Non-goals

- Adding guidance text to screens that lack it today (context enrichment,
  answered/follow-up view, scan on-open) — intentionally left as-is.
- Changing the "Add cards to zones" helper, the stack-order note, the
  fallback-question note, or any other existing statement not listed above.
- Rewording the tuned scan condition-aware cause-hints (DEC-062/DEC-072).
- Renaming themed labels or flow steps; any flow/interaction redesign; new
  features/screens; visual/layout overhaul.
- Any behavior, contract, prompt, scan-engine, or data-pipeline change.

## PRD references

- **DEC-092** (`decisions/ui-presentation.md`) — enhance-existing-copy-only
  principle, approved strings, guardrails, non-goals.
- **REQ-070** (`functional-requirements.md`) — the two exact enhanced strings as
  verifiable acceptance criteria, plus the no-net-new-text and byte-for-byte
  unchanged constraints.
- Related: REQ-069 (players disclosure control ergonomics — the `▾` expander this
  copy references), DEC-079 (UI presentation baseline), FLOW-001/FLOW-002,
  NFR-001.

## Where it lives (for implementation)

- Game-context players helper: `apps/frontend/src/App.tsx` (game-context branch,
  the `text-xs text-zinc-400` line under "Players in game").
- Zone-confirmation helper: `apps/frontend/src/components/ZoneConfirmStep.tsx`
  (the `text-sm text-zinc-400` line under the header).
- Tests: `apps/frontend/src/App.*.test.tsx`,
  `apps/frontend/src/components/ZoneConfirmStep.test.tsx`.
