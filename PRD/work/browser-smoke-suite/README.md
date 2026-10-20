status: refined

# browser-smoke-suite

A pull request check that builds the site, opens it in a headless browser, and confirms each tool loads and does its most basic action. It goes on top of the built-backend check accepted in docs PR #326.

## Package files

- `IDEA.md` — the owner's request, verbatim, and the open questions
- `DESIGN-BRIEF.md` — the design, what a real browser catches, per-tool coverage, the #326 relationship, answers to the open questions, and the amendment-set disposition table
- `GATE-QUESTIONS.md` — the proposed product truth: NFR-021 (new), REQ-166 and NFR-012 (amended), each applied after #326's accepted change; no blocker questions
- `evidence/measurements.md` — the live build and browser run (2026-10-18)
- `QUALITY-CHECK.md` — the quality-check result (PASS, four advisories)
- `GRAPH-RUN.md` — the graph run ledger
- `STATUS.owner-action` — the package status marker

Next: gate answered 2026-10-19 (3 accept); the run resumes at `gate-qc`.

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/browser-smoke-suite/DESIGN-BRIEF.md`
- Findings: none blocking. Advisories: (1) a relative `--outDir .tmp/browser-smoke/dist` resolves against `apps/frontend/`, not the repo root, so the build should pass one absolute path computed by the script (the same holds for `vite preview --outDir`); (2) Chrome 155 preinstalled on the CI runner comes from the runner-images readme and was not checked offline, so the build should fail with a clear message if `channel: "chrome"` cannot launch; (3) the about-one-minute CI time is an estimate, not measured on the runner; (4) the fake-camera flags were not tried live, and the conditional not-`Camera unavailable` assertion covers it
