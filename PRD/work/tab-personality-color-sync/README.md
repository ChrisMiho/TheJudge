status: refined

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

- Quality-check: (pending re-grade after this correction pass)
- Checked artifact: `PRD/work/tab-personality-color-sync/DESIGN-BRIEF.md`
- Findings: superseded — prior PASS was against the wrong (Menu-tray) surface.
  Re-run gate-qc against the corrected browser-tab brief.
