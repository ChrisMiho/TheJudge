status: refined

# resolution-recipe-eval

Measure whether a layer-and-timing resolution recipe (eval-only arm R, amending REQ-230) helps GPT-6 Luna judge hard interactions better than the production prompt, in Quick Lookup and In-Depth. Measurement only.

- Idea: `IDEA.md`
- Intake (verbatim, evidence only): `intake/GRAPH-BRIEF.md`
- Design brief: `DESIGN-BRIEF.md`
- Proposal and owner questions: `GATE-QUESTIONS.md` (REQ-230, REQ-228, REQ-187, REQ-224, REQ-185; blockers G1, G2, G3-01 to G3-16, G4; G5 = the REQ-187 slot)
- Evidence (re-runnable, offline; build deletes it with the package): `evidence/` — cost dry runs and recorded Luna figures (`cost-anchor-dry-runs.txt`, `luna-token-stats.mjs`), G3 card oracle ids (`g3-card-ids.txt`, `resolve-g3-cards.mjs`)
- Next: owner answers `GATE-QUESTIONS.md` in the docs PR and merges it; `/graph-implement` builds it
- Graph run ledger: `GRAPH-RUN.md`

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/resolution-recipe-eval/DESIGN-BRIEF.md`
- Findings: none (build-half re-grade, commit `831c0ee7`, after the owner's 24/24 accept; spec-forming attempt 1 FAIL, attempt 2 PASS). Report: `QUALITY-CHECK.md`.

## Autonomous metadata

- Autonomous base: origin/main
