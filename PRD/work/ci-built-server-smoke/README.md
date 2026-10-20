status: active

# ci-built-server-smoke

Add a CI check that starts the built backend and calls `/api/health` plus one card lookup, so every PR proves the build boots.

## Slices

| Slice | Doc | Depends on | Status |
| --- | --- | --- | --- |
| A | `slice-a-built-server-smoke.md` | none | done |

Plan: `GAMEPLAN.md`. Criteria: `slice-a.criteria.json`.

- `IDEA.md` — the owner's request, verbatim.
- `DESIGN-BRIEF.md` — the design: a `built-server` CI job and `npm run smoke:built-server` command that builds the backend, starts it, and requires the health check and a Sol Ring lookup to answer.
- `GATE-QUESTIONS.md` — proposed product truth: NFR-020 (new), REQ-166 and NFR-012 (amended). No blocker questions.
- `evidence/measurements.md` — live build, boot and route measurements (2026-10-18).

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/ci-built-server-smoke/DESIGN-BRIEF.md`
- Findings: none blocking (re-grade after the owner's verdicts, build half run `graph-20261019-182200`, commit `c3b81218`). Advisory: (1) no per-request timeout or job `timeout-minutes` yet — map-out sets both; (2) the 30 s ready deadline is still labelled proposed — map-out fixes it as a constant in the script and its tests; (3) only card data is asserted — settled as scope by accepted NFR-020; (4) ruleset 15384308 has no required checks — settled; (5) brief line 3 still says decide three product-truth changes — harmless; (6) brief line 192 gives a weaker reason for no frontend build check than the NFR-020 Reason — same outcome, map-out adds no frontend build step. Full report: `QUALITY-CHECK.md`.
