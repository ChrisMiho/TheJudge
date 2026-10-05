# Probe — in-depth chip collapse (anchor-ask-composer)

Question: Should anchor-ask-composer collapse the In-depth chip from
"◈ In-depth" to "◈" to free horizontal room for the question text, as part
of smoothing the Ask composer? If so, what triggers the collapse?

Mode: answer (a refinement to the in-flight anchor-ask-composer package, which
is parked at owner-action with docs PR #249; not fresh graph-kickoff work).

What ran (read-only; dev server could not be launched — permission denied, so
no live measurement this session):
- Read ComposerPill.tsx (the chip markup + grown-state measurement).
- Read shipped flow.css (chip + grown-state + label-hide rules).
- Read the REQ-206 source mockup docs/design/ui-reimagining/direction-1/
  (flow.css + quick-question.html) — the truth REQ-206 cites.
- Read REQ-206 (functional-requirements.md:5240) and the anchor-ask-composer
  DESIGN-BRIEF + GATE-QUESTIONS.

Evidence: FINDINGS.md.
