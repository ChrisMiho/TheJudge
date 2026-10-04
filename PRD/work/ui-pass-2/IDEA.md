# ui-pass-2

Four owner findings from the latest UI refactoring, to be fixed as one polish pass. Problem: (1) Trade Balancer's gold piles (`apps/frontend/src/components/trade/TradePile.tsx`, REQ-215) use different art than the direction-1 mockup (`docs/design/ui-reimagining/direction-1/trade-balancer.html`); (2) the card search that opens from "Add card" on a Trade Balancer side (`TradeSide.tsx`) has a different shape than the Ask a Question composer box; (3) the per-row Delete button in Question History on mobile (`ConversationHistoryDrawer.tsx`, `.history-item-delete`) looks broken; (4) the mobile delete-confirm sheet (`history-delete-confirm`) clips some of its text. Outcome: each of the four matches the mockup or the existing pattern it should mirror, on phone and desktop, with no behavior change. Non-goals: new features, other screens, data or backend changes, redesigning the confirm sheet beyond fixing the clipped text.

Intake: `intake/observations.md` (owner's words, verbatim).

## Prior run

- `PRD/instructions/receipts/ui-look-translation-2026-10-02.md` — built the mockup look-matching pass incl. Trade Balancer (REQ-215) and shared sheets; items 1 and 2 come from its output.
- `PRD/instructions/receipts/ui-reimagining-build-2026-10-02.md` — built Trade Balancer piles (slice G) and Question History (slice I).
- `PRD/instructions/receipts/ui-reimagining-2026-09-24.md` — produced the direction-1 mockup these findings are measured against.
- `PRD/instructions/receipts/green-mobile-branch-declutter-2026-10-04.md` — latest mobile-width UI change (phone path < 768), relevant to items 3 and 4.
- `PRD/instructions/receipts/chrome-tray-conversation-history-ux-2026-08-05.md` — earlier Question History drawer UX (delete control behavior).
