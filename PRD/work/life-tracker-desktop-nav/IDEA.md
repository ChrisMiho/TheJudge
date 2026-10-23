# Idea: life-tracker-desktop-nav

Owner request, verbatim:

> the desktop life tracker has a different navigation bar then the rest of the app, id like to align it for desktop like the rest of the app, the mobile verion is its own unique thing

Problem: on a desktop screen, a player who opens the Life Tracker sees a different top navigation bar than on every other tool, so the app feels inconsistent when switching tools.

Outcome: on desktop, the Life Tracker's top navigation looks and behaves like the navigation bar on the other tools. The phone layout of the Life Tracker stays exactly as it is.

Non-goals: no change to the phone Life Tracker layout or its seat-oriented controls; no change to the other tools' navigation; no change to life-tracking gameplay (life totals, counters, seats).

## Open questions for refinement

- Which desktop width counts as "desktop" for this change, and does it match the app's existing phone/desktop breakpoint?
- Which parts of the shared bar must appear on the Life Tracker (tool switcher, tabs, menu, exit), and which of today's Life Tracker bar controls must survive somewhere?
- Does the Life Tracker's full-screen table view still need its own controls on desktop, and where do they live once the shared bar is present?
- Which durable requirements in `PRD/sections/` currently describe the Life Tracker bar and the shared bar, and do they need amending?

## Prior run

- Prior run: PRD/instructions/receipts/shared-chrome-spec-2026-08-27.md
- Prior run: PRD/instructions/receipts/player-life-tracker-2026-08-03.md
- Prior run: PRD/instructions/receipts/player-life-tracker-refinement-2026-08-05.md
- Prior run: PRD/instructions/receipts/life-tracker-spec-2026-08-25.md
- Prior run: PRD/instructions/receipts/life-tracker-seat-map-2026-09-03.md
- Prior run: PRD/instructions/receipts/life-tracker-seat-oriented-default-2026-10-04.md
- Prior run: PRD/instructions/receipts/center-menu-tab-prominence-2026-08-04.md
- Prior run: PRD/instructions/receipts/center-menu-tab-prominence-followup-2026-08-05.md
- Prior run: PRD/instructions/receipts/ui-reimagining-2026-09-24.md
- Prior run: PRD/instructions/receipts/in-depth-spec-2026-08-28.md
