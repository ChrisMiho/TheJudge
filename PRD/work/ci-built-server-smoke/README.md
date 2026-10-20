status: refined

# ci-built-server-smoke

Add a CI check that starts the built backend and calls `/api/health` plus one card lookup, so every PR proves the build boots.

- `IDEA.md` — the owner's request, verbatim.
- `DESIGN-BRIEF.md` — the design: a `built-server` CI job and `npm run smoke:built-server` command that builds the backend, starts it, and requires the health check and a Sol Ring lookup to answer.
- `GATE-QUESTIONS.md` — proposed product truth: NFR-020 (new), REQ-166 and NFR-012 (amended). No blocker questions.
- `evidence/measurements.md` — live build, boot and route measurements (2026-10-18).

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/ci-built-server-smoke/DESIGN-BRIEF.md`
- Findings: none blocking. Advisory: (1) add a per-request timeout and a job `timeout-minutes` so a hung request cannot stall the `built-server` job; (2) fix the proposed 30 s ready deadline as a constant in the script and its unit tests; (3) only card data is asserted — a missing rulings, prices or rules file would still pass, within the brief's scope; (4) ruleset 15384308 re-read with `gh`: no required status checks, the brief's claim holds. Full report: `QUALITY-CHECK.md`.
