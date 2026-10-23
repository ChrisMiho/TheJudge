# Copy of PR #341, item 1 (Life Tracker tap) — for fix 10

Copied 2026-10-22 so this package reads alone. Source:
`PRD/ideasForLater/browser-smoke-followups/IDEA.md` on branch
`origin/docs/browser-smoke-followups` (commit `562d3219`, open docs PR #341,
not on `main`). Read with `git show`; the branch was not checked out or merged.

The file's header and item 1 are copied verbatim below. Item 2 (a graph
workflow-hook retry trap in `scripts/lib/boundary-rules.mjs`) is unrelated to
player flows and stays parked in PR #341; it is not copied.

The diagnosis of this item, and why it waits on blocker question Q-015, is in
`bug-diagnosis.md`, bug 10.

---

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
