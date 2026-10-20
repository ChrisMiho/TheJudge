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
- `STATUS.refined` — the package status marker

Next: gate answered 2026-10-19 (3 accept); the run resumes at `gate-qc`.

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/browser-smoke-suite/DESIGN-BRIEF.md`
- Findings: none blocking (build-half re-grade after the owner's verdicts, run `graph-20261019-190721`, commit `fd508e9b`; full record in `QUALITY-CHECK.md`). Advisories for map-out: (1) a relative `--outDir` resolves against `apps/frontend/`, so use one absolute path for build, preview and the CI artifact; (2) the runner's preinstalled Chrome is unverified, so fail with a clear message if `channel: "chrome"` cannot launch; (3) the one-minute CI time is an estimate; (4) the fake-camera flags are untested live, so keep the not-`Camera unavailable` assertion droppable; (5) brief and gate-file sentences saying #326's text is unwritten, NFR-020 only reserved, and `built-server` not yet in the workflow are superseded by merged #339 — the diffs match live text and the park-if-#326-missing rule does not trigger; (6) the merged `scripts/smoke-built-server.mjs` has helpers the design re-creates, but accepted NFR-021 says the two checks share no command, script or job, so the browser smoke is its own script and neither imports the other nor a module extracted from it; (7) `quality:check` builds the backend twice (about 1 s, harmless)
