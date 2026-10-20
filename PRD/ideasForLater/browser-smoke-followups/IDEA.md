# Browser smoke check follow-ups

Written 2026-10-20 after the `browser-smoke-suite` build shipped (code PR #340, merged and deployed 2026-10-20). Self-contained: a fresh agent needs nothing else to start either fix. Status: unregistered idea, no `STATUS.*` marker.

## What this is

- **Ask:** Nothing (FYI). Pick either item up when there is room. They are independent and can ship in either order.
- **In plain terms:** Two fixes surfaced while the browser check was built. The first is something players hit: on a phone, tapping the middle of Player 1's minus button in Life Tracker can miss. The second is behind the scenes: the automated build workflow can lock itself out of its own run after one step runs out of budget.
- **What it means for you:** Nothing here is built. Each section says what is wrong, where it lives, the suggested fix, and the proof it needs.

The full record of the run, including seven smaller follow-ups to the browser check itself, is in `PRD/instructions/receipts/browser-smoke-suite-2026-10-19.md`.

## 1. Life Tracker: Player 1's minus button misses taps on a phone

**What a player sees.** On a phone, a player taps the middle of Player 1's "−" (Decrease life) button and the tap can land on the counters control instead, so life does not go down. Tapping near the button's edge works.

**How it was found.** The browser check (`scripts/smoke-browser.mjs`, the Life Tracker step around `:383-393`) clicked the centre of the button `Decrease life for Player 1` at 390x844 and the counters control received the click. The check now taps 14 px in from the button's near edge, like a player's thumb would, so the check passes while the app is unchanged.

**What should happen.** The whole visible "−" button takes the tap. REQ-217 places "−" and "+" at each seat's near edge, and REQ-205 asks for 44 px tap targets on touch.

**Before fixing.** Confirm it live in the browser at phone width (390x844) and note which counters element sits over the button and how much of the button it covers. Check the other seats too: the check only taps Player 1.

**Suggested fix.** Stop the counters control overlapping the "−" button's hit area (layout or stacking order), without moving either control's visible position more than needed.

**Proof needed.** A test that fails today: at 390x844, the element at the centre of Player 1's "−" button (`document.elementFromPoint`) is that button. Then change the browser check's Life Tracker step back to a plain centre click. Take the REQ-202 Life Tracker screenshot pair, because this changes what the Life Tracker looks like or how it responds to touch.

**Size and route.** Small, player-visible bug fix, its own PR. Keep it to the tap target (bug scope matches the symptom); offer any other Life Tracker layout tidy-ups separately.

## 2. Workflow hook: one budget overrun locks the run out of its own state file

**What happens.** When a step in an automated build run uses up its tool-call budget (the `tool-call-cap` rule), the hook denies further writes, including the run's own state file `.worktrees/.graph-run-state.json`. That is correct for that step. But the denial is remembered for the whole run, and the retry guard (`denied-command-retry`) keys a file write on tool and path only (`denialKey()`, `scripts/lib/boundary-rules.mjs` around `:754-770`). So when the driver later tries to move the run to the next attempt (for example `define` attempt 2), the same write is refused as a "retry", even though the new attempt has a fresh budget. The only way out is to rotate the run id by hand.

**Observed.** 2026-10-19 on `browser-smoke-suite`: `define` attempt 1 hit its cap, then the driver's write of `{ "runId": "graph-20261018-233939", "node": "define", "attempt": 2 }` was denied with `This exact call was already denied during this run (tool-call-cap)`. The run parked and resumed only after the owner approved a new run id (`graph-20261019-174628`). The same trap hit on 2026-10-13 with a different rule (`build-write-outside-worktree`).

**Suggested fix.** Add `tool-call-cap` to `REMEDIABLE_RULES` (`scripts/lib/boundary-rules.mjs` around `:189`). Its outcome depends on the current node and attempt, which is the shape that constant exists for: on a retry the guard steps aside and `tool-call-cap` re-evaluates against the run state as it now stands. A new attempt starts with a fresh count, so the write is allowed; a call still inside the exhausted attempt is denied again by the cap itself. Consider adding `build-write-outside-worktree` at the same time, since its outcome also depends on the current node.

The alternative, scoping each recorded denial to the node and attempt it happened in, is broader: it changes `denialKey()` for every rule. Prefer the narrow fix unless a test shows it is not enough.

**Proof needed.** A test in the boundary-rules tests that fails today: record a `tool-call-cap` denial for a run-state `Write` during `define` attempt 1 at the cap, then evaluate the same `Write` with run state `define` attempt 2 and a fresh call count, and expect it allowed. A second test keeps the guard honest: the same call while still in attempt 1 past the cap is still denied. Run `npm run test:scripts`.

**Size and route.** Small, its own PR. Players never see it. `scripts/lib/boundary-rules.mjs` is not one of the files agents are barred from editing, but it is the hook every graph run depends on, so review it with care.
