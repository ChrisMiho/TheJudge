# Quality check — small-fixes-cats-menu-white

Run `graph-20261014-234321`, node `gate-qc`, attempt 1 of the build half (re-grade after gate resolution), 2026-10-14. Mode: graph is controlling.

**Verdict: PASS** — no findings. `STATUS.refined` stays; map-out owns the move to active.

Graded: `DESIGN-BRIEF.md`, finalized `GATE-QUESTIONS.md` (all six accepted), `evidence/measurements.md`, `IDEA.md`, `intake/`, against `PRD/sections/` on this branch (cut from today's `origin/main`).

## Owner revision of REQ-207 (after attempt 3's PASS, commit `a6ad4515`): graded

- Brief section 2, A4, A11, the REQ-207 slot and `measurements.md` all state one look: 45px bars, 2.5px thick, 7px apart, desktop only (`768px`+); ~6px glow in `--accent` mixed ~55% with white at every width; phone keeps 50px box and 1.4rem glyph and gains the glow; 54px desktop box and 68px header unchanged; no box, fill or outline. No contradiction between the four places.
- Testable: a stylesheet assertion names the desktop rule (45px bars, glow), the phone rule (50px, 1.4rem, glow), the 54px box, and rule order; live checks name box sizes, header height, six colours, hover and focus fill. Accessible name "Switch feature" and the "☰" text stay in the DOM (`FeaturePortalMenu.tsx:334-339`), which existing tests rely on (`FeaturePortalMenu.test.tsx:77`, `App.responsive-presentation.test.tsx:77`).
- Files and selectors exist: `shell.css` `.app-header .menu-toggle` at 183, 304 (50px / 1.4rem), the `min-width: 768px` block at 309-315 (54px / 1.5rem), shared `.menu-toggle, .icon-btn` at 287; `index.css` `.menu-toggle[aria-hidden="true"]` at 53 is the only other `.menu-toggle` stylesheet rule; the hover/focus rule is at 318-322 (the brief's "317-323" includes the blank line). The existing `OverlayCloseButton.test.tsx:23` regex targets only the shared 44px rule and is unaffected.
- Hover-order assumption holds for the new rules: the new look sets no border or fill, sits in the existing block before the hover rule, and the glow is on the bars only. The bars' pseudo-element rules have higher specificity than the box rule they decorate, so they do not compete with the hover fill.
- Not findings: the preview drew bars with a pseudo-element and the brief explicitly leaves the drawing method to the build within the measurements.

## Diff anchors in `GATE-QUESTIONS.md`: all still match

Checked each hunk's line and removed text against current `PRD/sections/`: `functional-requirements.md` 5228 (REQ-203 notes), 5383, 5396, 5421 (REQ-207), 2408, 2424, 2426, 2450 (REQ-099), 918, 921, 939 (REQ-044), 2796-2797, 2812 (REQ-113); `user-flows.md` 168, 176, 185; `system-map.md` 221, 228; `in-depth/README.md` 529; `shared-chrome/README.md` 109-112, 118, 187, 196, 434-437. All line numbers and `-` lines match today's text.

## Carried forward from attempt 3 (unchanged parts re-checked)

- Cats, default colour (first-paint split, order test, ambient fallback, default-pin tests) and tray scrollbar sections unchanged since the PASS; product-truth slots cover REQ-203, REQ-207, REQ-099, REQ-044, FLOW-007, REQ-113 as amendments with no new ID.
- Technical-design rules respected (frontend and presentation only); no new screen or overlay, so no screen-layout row.

## Not findings

- `PRD/sections/` unchanged: by design (build applies the approved proposal).
- Desktop tray shape gap and the retired DEC-119 "fall back to Blue" row: recorded as non-goals.
