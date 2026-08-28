# Sweep finding — lookup-suite

- Corpus file: /Users/chrismiho/Coding/Projects/TheJudge/PRD/sections/decisions/lookup-suite.md
- Scored against: 7 current-state specs under PRD/sections/<feature>/README.md
- Items: 5

## DEC-107 — absorbed
Quick Lookup as one feature-portal destination with optional single-card input, one branching (not forked) `mode: "lookup"` prompt-assembly path, and DEC-100's second-pass deferred to Q-004 are all spelled out in `PRD/sections/quick-lookup/README.md` ("What it is", "Entry and pre-submit layout", "Branching prompt assembly", "Rejected alternatives").

## DEC-108 — absorbed
The "confused rules lookup" off-domain persona, applied identically with or without an attached card and enforced as prompt-copy only with no new backend detection, is captured verbatim in quick-lookup/README.md's "Off-domain guardrail" section, including the no-classifier/no-debug-signal constraint.

## DEC-112 — absorbed
The renamed "General rules topics" disclosure, its always-visible collapsed summary, the accordion topic rows, the locked non-editable pill (swap/remove/smooth-scroll behavior), the silent card-name fallback, and the later-amended raw-textarea cap/counter measurement are all present in quick-lookup/README.md's "General rules topics browse", "Composing and submitting the question", and "Measured bounds" sections.

## DEC-113 — absorbed
The inline em-dash guidance copy on the "Optional card" label (replacing the standalone paragraph) is stated exactly in quick-lookup/README.md's "Entry and pre-submit layout" bullet on the card-attach control label.

## DEC-114 — absorbed
Hiding the Question form during the initial in-flight wait and rendering `AskAiWaitingPanel` in its place, with the Optional card section and General rules topics disclosure staying visible/interactive, is captured in quick-lookup/README.md's "Initial submit wait" section, including the error/success resolution behavior.
