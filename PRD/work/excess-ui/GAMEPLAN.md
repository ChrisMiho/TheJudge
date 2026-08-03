status: active

# Excess Player UI — GAMEPLAN

Frontend-only presentation work for In-Depth Question's existing player roster. Keep the outer
**Players in game** disclosure and all current player/counter data owners, but split each open
player card into an always-visible name/life baseline and synchronized secondary details that
default and reset collapsed.

Sources of truth: DEC-120 (`sections/decisions/ui-presentation.md`), REQ-100
(`sections/functional-requirements.md`), FLOW-001 and FLOW-010 (`sections/user-flows.md`), plus
DEC-091/092/095/117, REQ-015/069/070/096, and NFR-001.

The approved visual reference is `mock-a-nested-player-accordion.png`. It is directional layout
evidence only; generated text in the image is not product copy.

## Architecture

### Current shape

- `PlayerRosterEditor.tsx` is a controlled shared roster surface. It owns no player values: callers
  pass active players, outer disclosure state, player-count actions, name/life callbacks, and an
  optional `renderPlayerExtras` function.
- The editor currently renders the outer count/add/remove row and, when open, one player card whose
  name, life, and `renderPlayerExtras` output are all visible together.
- `MtgAssistantApp.tsx` owns the outer `playersDetailsExpanded` boolean, active player count,
  display names, life totals, scalar counters, Commander damage, and named counters. Its extras
  renderer owns the existing counter input markup.
- `DestinationOutlet.tsx` lazily mounts destinations and then retains inactive ones under a
  `hidden` wrapper. The destination render contract currently receives no active/inactive signal,
  so `MtgAssistantApp` cannot distinguish a destination round trip from an ordinary rerender.
- The Life Tracker seed effect intentionally opens the outer roster and copies tracker values into
  the Assistant's existing state. Existing integration tests assume all copied counter inputs are
  immediately visible because no nested disclosure exists yet.

### Target shape

1. **Controlled synchronized card disclosure (Slice A).** Extend `PlayerRosterEditor` with one
   controlled secondary-details boolean and one toggle callback. Every rendered player card keeps
   name/life visible and, when extras exist, renders its own ≥44×44px arrow. All arrows read the
   same boolean, expose the same `aria-expanded` value/all-player accessible intent, and toggle the
   same callback. Extras mount for every active card only when that shared boolean is true.

2. **In-Depth state orchestration (Slice B).** Add exactly one secondary-details boolean beside
   `playersDetailsExpanded` in `MtgAssistantApp`. Pass it through the controlled editor contract,
   reset it when the outer roster closes, and leave it untouched on add/remove. Keep every player
   value in its existing state object and preserve the current helper copy, life defaults,
   validation, counter normalization, and payload assembly.

3. **Destination lifecycle and closure (Slice C).** Evolve the internal `PortalDestination.render`
   callback to receive `isActive`, with `DestinationOutlet` passing the current value on every
   render. Forward that signal only where needed to `MtgAssistantApp`, defaulting its prop to active
   for focused component tests. An effect resets only the secondary boolean when the Assistant
   becomes inactive. App-level coverage proves the outer disclosure, staged step, and player data
   survive a destination round trip while secondary inputs return collapsed.

## State and data flow

```text
MtgAssistantApp player values (unchanged owners)
  ├─ active count / names / life ───────────────▶ PlayerRosterEditor compact baseline
  └─ scalar / Commander / named counters ──────▶ renderPlayerExtras callback
                                                       │
MtgAssistantApp one secondary boolean ────────────────┼─▶ every card arrow aria-expanded
  ▲                                                    └─▶ all extras mounted or absent together
  │
  ├─ any card arrow toggles the same boolean
  ├─ outer roster close sets false
  └─ PortalDestination isActive: true → false sets false

player add/remove, viewport changes, ordinary rerenders, and value edits
  └─ do not create or reset secondary state
```

- The outer roster boolean remains separate and retains its current default and portal-round-trip
  preservation behavior.
- Closing the outer disclosure resets secondary details immediately; reopening therefore renders
  compact player cards.
- Resetting on the destination's active → inactive transition works with the existing retained
  mount. Selecting the already-active destination does not change `isActive` and is a no-op.
- A new player is derived from the active roster and therefore reads the same shared secondary
  boolean; removing a player cannot leave a hidden per-player state behind because none exists.
- Hiding/unmounting extras must never normalize, clear, or reconstruct counter values. Submission
  continues to read `displayNamesByPlayer`, `lifeTotalsByPlayer`, and `countersByPlayer` directly.

## Accessibility and presentation contract

- Keep the existing outer arrow, count, add/remove ordering, 2–8 bounds, and exact helper copy:
  `Tap ▾ to set names and life totals — 2 players start at 20, 3+ at 40.`
- Render one secondary arrow in every active card only when secondary content is supplied. Its
  accessible name must say that it shows/hides secondary details for all players, not imply an
  independent per-player accordion.
- Every secondary arrow uses the same controlled `aria-expanded` value and is at least 44×44px.
  Associate disclosure controls and regions with stable ids/semantic disclosure attributes without
  using array position as mutable state.
- Preserve the existing mobile-first single component tree, accent/motion utilities, input labels,
  `text-sm`/`text-xs` floor, and responsive counter grid. Add no dependency or persisted setting.

## Contract and scope guardrails

- No change to `RosterPlayer`, player labels, validation, default life totals, active-player logic,
  counter inventory, counter parsing/omission, `GameContext`, `AskAiRequest`, Zod schemas, prompt
  assembly, provider/backend behavior, scanner behavior, or data artifacts.
- No Player Life Tracker UI or persistence change. Its one-way seed continues to copy the same
  values and open the outer roster; only the new secondary presentation starts collapsed.
- Do not create independent per-player expansion state, a global bar detached from cards, new
  guidance copy, a second roster component, a viewport-specific component tree, or a new store.
- The three mock images and source screenshot remain planning evidence under this ephemeral work
  folder and are deleted by cleanup; they are not product assets.

## Slice dependency map

| Slice | Depends on | Sequential blocker |
| --- | --- | --- |
| A — Synchronized player-card disclosure contract | — | — |
| B — In-Depth roster orchestration and preservation | A | Consumes Slice A's controlled props and rendered disclosure semantics. |
| C — Destination reset, integration proof, and ship closure | A, B | Exercises the integrated secondary state through a portal activity contract and complete user journey. |

This package is intentionally sequential. Slice B cannot wire or preserve the final interaction
until Slice A fixes the shared editor contract; Slice C cannot prove the narrow DEC-095 exception
until the real In-Depth state from Slice B exists.

## Verification checklist

- [ ] Opening the outer roster shows all active name/life inputs while every counter input is absent.
- [ ] Each active card has a ≥44×44px arrow; all arrows report one shared `aria-expanded` state and
      an accessible all-player action.
- [ ] Activating Player 1's arrow expands all cards; activating another player's arrow collapses all
      cards, with no mixed state possible.
- [ ] Adding a player while expanded shows that player's secondary details; removing a player keeps
      the shared state for remaining cards and preserves the 2–8 bounds.
- [ ] Closing/reopening the outer roster returns all cards compact without changing any values.
- [ ] A destination round trip resets only secondary presentation while preserving the outer roster,
      player count, names, life, all counters, and current staged-flow step.
- [ ] Re-expanding after either reset reveals the original values, and unchanged inputs produce the
      same `gameContext.players` submission payload.
- [ ] Life Tracker → In-Depth seeding still copies count/name/life/counters without modifying tracker
      persistence; copied secondary values begin hidden and appear unchanged after expansion.
- [ ] Exact helper copy, outer control behavior, responsive layout, semantic labels, and touch target
      floors are covered by focused tests/manual review.
- [ ] `npm run quality:check` and `git diff --check` pass in the final slice.
