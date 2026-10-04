# Idea: anchor-ask-composer

Request: "Anchor the Quick + In-depth question box so typing a long question grows it in place instead of scrolling the card stage off-screen"

Problem: typing a long question in Quick lookup or In-depth lengthens the page. The browser scrolls to the caret, the card stage leaves the screen, and the send controls drop below the fold.
Outcome: the Ask screen sits in a screen-height frame. The card stage flexes in the middle, and the question box stays pinned at the bottom and grows upward in place. The In-depth chip and mic|send pill stay visible. Same on desktop and mobile.
Non-goals: no change to ComposerPill structure, no new fit pattern (reuse the Trade Balancer `page-shell-fit` frame), no backend or mock-default change.

## Intake

- PRD/work/anchor-ask-composer/intake/GRAPH-BRIEF.md (copied from .worktrees/.graph-intake/graph-20261003-205515/GRAPH-BRIEF.md)

Documents the intake cites, not opened here (evidence only, decided at the define gate):
- PRD/work/probe-composer-growth-space/ (FINDINGS-repro.md, .playwright-mcp/)
- PRD/sections/quick-lookup/README.md
- PRD/sections/in-depth/README.md
- PRD/sections/screen-layout.md

## Prior run

- PRD/instructions/receipts/quick-lookup-2026-08-01.md
- PRD/instructions/receipts/quick-lookup-spec-2026-08-27.md
- PRD/instructions/receipts/quick-question-ui-refinement-2026-08-02.md
- PRD/instructions/receipts/in-depth-spec-2026-08-28.md
- PRD/instructions/receipts/post-question-chat-layout-2026-06-18.md
- PRD/instructions/receipts/ui-compact-layout-refinement-2026-06-26.md
- PRD/instructions/receipts/mobile-scan-layout-2026-07-03.md
