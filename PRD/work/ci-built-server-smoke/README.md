status: refined

# ci-built-server-smoke

Add a CI check that starts the built backend and calls `/api/health` plus one card lookup, so every PR proves the build boots.

- `IDEA.md` — the owner's request, verbatim.
- `DESIGN-BRIEF.md` — the design: a `built-server` CI job and `npm run smoke:built-server` command that builds the backend, starts it, and requires the health check and a Sol Ring lookup to answer.
- `GATE-QUESTIONS.md` — proposed product truth: NFR-020 (new), REQ-166 and NFR-012 (amended). No blocker questions.
- `evidence/measurements.md` — live build, boot and route measurements (2026-10-18).

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/ci-built-server-smoke
