# Slice A — manual evidence log

2026-08-25 A5 — read every "How it works" bullet in `PRD/sections/scan/README.md`
against the full text of its cited source (DEC-050 through DEC-093, DEC-068,
DEC-076, DEC-078 in `personalization.md`; DEC-082 in `capture-and-stack.md`;
DEC-151/158/160 in `ui-presentation.md`; the REQ-034-071 subset and REQ-125/128/129
in `functional-requirements.md`). Each bullet's stated behavior (shared camera
surface, identification engine/oracle bridging, detector/card-back descoping,
locking/hands-free auto-add, confirmation/review/removal, real-world robustness,
debug overlay/diagnostics, scan-screen layout/theming) matches its cited
decision/requirement text with no invented capability found.

2026-08-25 A11 — read the spec's "Rejected alternatives and deferred scope"
section against the Context/Notes prose of its eight cited DECs (DEC-056/058,
DEC-057, DEC-076, DEC-055, DEC-062/072/074, DEC-069, DEC-088). Found one
confirmed defect: the "Card-back ... and the ~67px/strict edge cues — closed
door" bullet's "~67px" figure does not appear anywhere in DEC-055 (its cited
source) or any scanning decision — it is the Player Life Tracker's
"life-adjustment edge band" figure (`PRD/sections/decisions/doc-process.md:359`,
REQ-112, DEC-136), unrelated to card-back detection. Removed the erroneous
clause from the bullet heading (bounded correction, scoped to
`PRD/sections/scan/README.md`). Every other rejected-alternative bullet
(one-tap Accept/Rescan, top-3 candidate list, in-scan escalation prompt,
lock-gate-loosening, all-cards bulk switch, cardScanMap pricing overload,
recipe/bin-format escalation, and the four deferred-not-cut items) traces
cleanly to its cited DEC with nothing invented and nothing omitted.
