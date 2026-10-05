status: owner-action

# tab-personality-color-sync

See IDEA.md. The feature is the **browser tab** (Chrome/Firefox) — its favicon,
its document title, and the mobile `theme-color` browser-bar tint — given
personality and synced to the active colour profile. NOT the in-app hamburger
Menu.

Correction pass (2026-10-04): the first pass shaped the wrong surface (the ☰
Menu tray rows). The owner clarified, verbatim: *"i think theres been a
misunderstanding, im talking about the chrome or mozilla tab, not the hamburger
menu."* DESIGN-BRIEF.md and GATE-QUESTIONS.md are rewritten for the browser tab.

Proposal at the gate: REQ-219 (reused stable id, content fully replaced) +
amend `shared-chrome/README.md`. **No blocker** — the single-page app lives in
one browser tab, so it follows the one active profile; the earlier A/B fork
(Q-219) is dropped. Next node: gate-qc (quality-check).

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/tab-personality-color-sync

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/tab-personality-color-sync/DESIGN-BRIEF.md`
- Findings: none. Re-graded fresh (graph run `graph-20261004-212625`, node 4) against the corrected browser-tab brief. Cited authorities REQ-126, REQ-200, REQ-201, REQ-207, REQ-216, REQ-099 verified live in `PRD/sections/functional-requirements.md`; no retired id (DEC-149 is retired and is not cited) is claimed. REQ-219 is free in `PRD/sections` (REQ-217 is the last used id; REQ-218 is reserved by `anchor-ask-composer`). Current-state premises confirmed from code: `apps/frontend/index.html` has no favicon link, a static `<title>TheJudge</title>`, no theme-color meta; no manifest and no favicon file under `apps/frontend/public/`; no `document.title =` assignment in `apps/frontend/src`. Every REQ-219 acceptance criterion is measurable. Non-blocking note for map-out: the exact branded title string is only an example in the brief (`TheJudge · MTG Assistant`); pin it in the slice so the exact-string test has one value.
