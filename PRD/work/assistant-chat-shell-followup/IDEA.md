# assistant-chat-shell-followup

Handoff from `assistant-chat-shell` (shipped; receipt `PRD/instructions/receipts/assistant-chat-shell-2026-08-04.md`). Post-ship live feedback against the Claude/ChatGPT-like chat-shell goal. Captures live in `issues/`.

## Problem themes (from issues + owner callouts)

1. **History rail vs View Context overlap** (`issues/1.png`) — On desktop answered view, the History (clock) icon in the Menu corner rail overlaps the View Context trigger. Same collision must be checked on mobile.
2. **History unavailable after Start Over** (`issues/2.png`) — After Start Over, the user returns to the flow start but cannot open History until a new request is fully submitted. Prior conversations (and mid-flight unfinished work — see below) must remain reachable while navigating menus / re-walking the flow.
3. **Single unfinished draft slot** — A request that is mid-flight (not fully submitted) should still be preserved. If the user Start Overs again and never submits, the new unfinished draft overrides the previous unfinished one (no backlog of abandoned drafts). Completed/saved conversations remain in the history list per existing DEC-124 caps.
4. **Answered chrome height / Start Over** — On desktop with chat in view, the workspace is too tall and Start Over is pushed out of view. Mobile answered layout looks good, but Start Over should be smaller on mobile to reduce accidental taps.
5. **Pre-submit question box does not grow** (`issues/3.png`, also desktop) — Long typed text stays in a short field until the chat is initiated. The box should grow with content until Start Over (or the equivalent bottom chrome) reaches the bottom of the available space — without growing so far that the page itself scrolls. Same behavior expected on desktop (more space, still no growth today).
6. **Short content does not fill the viewport** (`issues/4.png`) — When thread content is short, the answered workspace leaves empty black below the card. Owner wants the surface filled like an active chat on mobile and desktop.
7. **Quick Question parity** (`issues/5.png`) — The same pre-submit growth / fill / history-access issues appear on Quick Question. Prefer shared-surface fixes (DEC-118 shared workspace + shared composer patterns) so one fix covers both flows where the bug is shared.

## Non-goals (current capture)

- No Ask AI contract / provider / prompt-assembly changes
- No reopening shipped markdown / history-drawer mechanics beyond what's needed for availability, draft slot, and layout polish
- No implementation in this package until design brief is approved and mapped
