# Quality check — small-fixes-cats-menu-white

Run `graph-20261014-225350`, node `gate-qc`, attempt 3, 2026-10-14. Mode: graph is controlling.

**Verdict: PASS** — no findings. `STATUS.refined` stays; map-out owns the move to active.

## Attempt 2 findings: both verified resolved in the files

A. `:root` block order. The brief now says the new White `:root` block stays first, where the combined block sits today, before `[data-profile="blue"]` and every other colour block, and explains why (equal specificity, later wins). It adds an offset order test and a live check that Blue (#0050d8) and Red (#c10230) keep their own values. Checked against `tokens.css`: line 41-42 is the combined block, profile blocks follow at 51-87, the shared `:root, [data-profile]` block at 110 defines none of the six colour values (only derives from them), and no other `:root {` text exists in the file, so the test's text lookup is unambiguous. Resolved.

B. Ambient scene Blue fallback. The brief now changes `AmbientScene.tsx` lines 550-552 to read `DEFAULT_PALETTE_ID`, adds the file to Touches, and specifies a still-frame test in `AmbientScene.test.tsx` (file exists). Lines 550-552 and the observer at 622 match the code. Resolved.

## New assumption A11 (desktop ☰ hover order): verified

`shell.css` has the `min-width: 768px` `.app-header .menu-toggle` block at 309-315 and the hover/focus rule at 317-323, so the claim holds; both are two-class specificity, so the existing block sits earlier and the hover rule wins. Putting the chip edge and fill inside that block, with a stylesheet order assertion and a live hover/focus check, is sound.

## Fresh whole-package grade

- Product truth: GATE-QUESTIONS covers REQ-203, REQ-207, REQ-099, REQ-044, FLOW-007, REQ-113 as amendments; no new ID. The brief's PRD alignment section matches the six slots. No contradiction with the current specs beyond the amended lines.
- Tray fix: `.menu-tray` has `overflow-y: auto` (line 362) and `.menu-tray::after` has `right: -1px` (line 415-421), as the brief states. Fix and test are specified.
- Default pin: `DEFAULT_PALETTE_ID = "blue"` at `palettes.ts:28`; tests, `appliedTheme.ts`, first-paint surfaces and the `index.html` placeholder exception (REQ-219/REQ-216) are all dispositioned.
- Technical-design rules: frontend and presentation only. Screen-layout catalog: no new screen or overlay (cat picture is an in-page element on existing screens), no row needed.
- Agent-readiness: files, lines, tests and live checks are named; open questions are none; assumptions A1-A11 are laddered.

## Not findings

- `PRD/sections/` unchanged: by design (refinement proposes, build applies).
- Desktop tray shape gap (full height versus floating card): recorded in non-goals as a pre-existing follow-up.
- DEC-119 row still says "fall back to Blue": retired log, left as history.
