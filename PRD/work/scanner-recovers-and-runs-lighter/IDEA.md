# Idea: Scanner recovers and runs lighter

Request, verbatim: "Scanner recovers from a failed download, builds its data once, and shares one panel across tools"

## What it means for a player

- After a failed scan-data download (a weak game-store connection), card scanning works again on the next try. Today it stays broken in every tool until the page is reloaded. The player sees plain wording, not raw text like `Could not load card hash DB: 503`.
- The first scan downloads less.
- Phones do less work per scanned frame and hold less memory.
- The three scanners (In-Depth, Quick Question, Trade Balancer) share one panel. The exit ✕ sits in the same place in all three and never covers the caution triangle.

Measured detail, file references and the converged design direction live in `intake/GRAPH-BRIEF-scanner.md`. It is evidence for refinement, not scope.

## Non-goals

- No change to when scan data downloads (it stays out of the background preload).
- No change to what a scan identifies; output must stay identical.

## Open questions for refinement

1. Where the scanner's exit ✕ sits on all three tools.
2. The player-facing wording when scan data fails to load.
3. Whether scan images may drop Scryfall's cache-buster suffix, which the smallest scan map shape requires.

## Constraint

The card-search cluster ("one card search box") edits the same three files as this idea (`QuickLookupApp.tsx`, `ZoneCardPicker.tsx`, `TradeSide.tsx`). The two must not run at the same time.

## Prior run

- PRD/instructions/receipts/scan-ux-responsiveness-2026-06-23.md
- PRD/instructions/receipts/scan-spec-2026-08-26.md
- PRD/instructions/receipts/remove-dead-card-back-detector-2026-09-02.md
- PRD/instructions/receipts/theme-customization-expansion-2026-06-24.md
- PRD/instructions/receipts/scan-robustness-tuning-2026-06-25.md
- PRD/instructions/receipts/card-scan-lockin-fix-2026-06-22.md
- PRD/instructions/receipts/green-mobile-branch-declutter-2026-10-04.md
- PRD/instructions/receipts/frontend-routing-and-code-splitting-2026-08-11.md
- PRD/instructions/receipts/codebase-duplication-audit-2026-08-23.md
- PRD/instructions/receipts/scan-lock-on-outline-2026-06-30.md
- PRD/instructions/receipts/scan-lock-acquisition-tuning-2026-06-26.md
- PRD/instructions/receipts/anchor-ask-composer-2026-10-05.md
- PRD/instructions/receipts/scan-debug-icon-overlap-2026-06-24.md
- PRD/instructions/receipts/scan-fingerprint-incremental-build-2026-06-19.md
- PRD/instructions/receipts/resolution-recipe-eval-2026-10-10.md
- PRD/instructions/receipts/palette-color-customization-expansion-2026-06-25.md
- PRD/instructions/receipts/scan-duplicate-card-identity-2026-06-30.md
- PRD/instructions/receipts/theme-color-customization-2026-06-24.md
- PRD/instructions/receipts/ui-flare-chat-motion-2026-08-03.md
- PRD/instructions/receipts/scan-camera-desktop-sizing-regression-2026-07-04.md
- PRD/instructions/receipts/blue-ambient-personality-2026-10-05.md
- PRD/instructions/receipts/color-profile-accent-theming-2026-06-30.md
- PRD/instructions/receipts/ui-pass-2-2026-10-04.md
- PRD/instructions/receipts/scan-capture-quality-2026-06-26.md
- PRD/instructions/receipts/scan-detector-foil-robustness-2026-06-25.md
- PRD/instructions/receipts/test-suite-hygiene-2026-07-01.md
- PRD/instructions/receipts/ui-look-translation-2026-10-02.md
- PRD/instructions/receipts/scan-audio-confirmation-2026-06-23.md
- PRD/instructions/receipts/ui-reimagining-build-2026-10-02.md
- PRD/instructions/receipts/ui-polish-subtle-effects-2026-06-29.md
- PRD/instructions/receipts/card-scan-robustness-2026-06-24.md
- PRD/instructions/receipts/scanner-caution-always-visible-2026-10-04.md
- PRD/instructions/receipts/scan-printing-fidelity-2026-06-25.md
- PRD/instructions/receipts/mobile-scan-layout-2026-07-03.md
