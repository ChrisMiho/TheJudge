# Idea: player-visible bugs from the cleanup follow-ups

Owner request, verbatim: `Fix the player-visible bugs in section a, Trade scanned-printing bug first`

Intake (evidence, not authority): `intake/IDEA.md`, section a. Written at the end of the codebase-cleanup pass.

## What it means in player terms

Seven things a player can run into today. The owner ordered the first one first.

1. Trade scanned-printing bug: in Trade Balancer, a scanned card's price can come from a different printing than the one in your hand.
2. In-Depth scanner: scanning a second copy of a card already on the Stack is refused, and nothing says why.
3. Feedback: feedback sent from any tool can carry the hidden In-Depth flow once In-Depth was visited.
4. Life Tracker: resuming an In-Depth history entry or draft while on Life Tracker queues a roster seed.
5. Retry: with no game context, Decrypt shows a message but Retry does nothing and says nothing.
6. In-Depth Stack: Stack cards with empty names are sent to the AI; empty-named zone cards are not.
7. Look and feel: several small appearance changes found while cleaning styles (ground colour, viewport height, fonts, tap sizes, short-phone breakpoint, button grouping).

## Problem, outcome, non-goals

Problem: the cleanup pass found player-visible defects and deliberately left them unbuilt. Outcome: the owner decides each one, and the approved ones are fixed, Trade scanned-printing first. Non-goals: the section b item (Q-11), the section c and d follow-ups, and any cleanup that changes nothing a player sees.

## Open questions for refinement (owner calls, not answered here)

- Bug 2: where does the blocked-duplicate message appear, and what does it say? Confirm the missing message in the browser first.
- Bug 3: which flow value should feedback carry for each tool?
- Bug 4: is a roster seed wanted when resuming a history entry or draft on Life Tracker?
- Bug 5: what message should Retry show when there is no game context, and should it match Decrypt?
- Bug 6: should empty-named Stack cards be dropped from what the AI receives, like zone cards?
- Bug 7: which of the five appearance changes does the owner want, each after a look and, where Life Tracker is touched, the REQ-202 screenshot pair?
- Collision: card-search owns `QuickLookupApp`, `ZoneCardPicker`, `TradeBalancer.scan.test.tsx` and the card-list effect in `MtgAssistantApp.tsx`. Land before it, or fold in?

## Prior run

- Prior run: PRD/instructions/receipts/codebase-cleanup-pass-2026-10-18.md
- Prior run: PRD/instructions/receipts/ui-reimagining-build-2026-10-02.md
- Prior run: PRD/instructions/receipts/scan-printing-fidelity-2026-06-25.md
- Prior run: PRD/instructions/receipts/scan-duplicate-card-identity-2026-06-30.md
- Prior run: PRD/instructions/receipts/card-trade-balancer-2026-08-03.md
- Prior run: PRD/instructions/receipts/trade-balancer-spec-2026-08-26.md
- Prior run: PRD/instructions/receipts/scan-spec-2026-08-26.md
- Prior run: PRD/instructions/receipts/scanner-recovers-and-runs-lighter-2026-10-18.md
- Prior run: PRD/instructions/receipts/feedback-bug-report-2026-08-03.md
- Prior run: PRD/instructions/receipts/user-feedback-spec-2026-08-25.md
- Prior run: PRD/instructions/receipts/empty-stack-fallback-fix-2026-06-05.md
