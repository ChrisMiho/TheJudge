status: active

# answer-quality-investigation

Reproducible before/after answer evaluation for PR #273, isolation of retrieval versus prompt-organization failures, and a GPT-4.1 versus GPT-6 Luna comparison, before any product fix is chosen.

- Idea: `IDEA.md`
- Design brief: `DESIGN-BRIEF.md` (comparison tooling, the free offline Phase 0 run at build, and the runbook for owner-capped paid Phases 1–5)
- Proposed product truth: `GATE-QUESTIONS.md` (new REQ-226 to REQ-230; amends REQ-185 to REQ-189 and NFR-018; REQ-220/221 stay reserved by draft PR #266)
- Intake (evidence, not authority): `intake/GRAPH-BRIEF.md`, cites `PRD/work/probe-answer-quality/FINDINGS-{integration,retrieval,evaluation}.md` in the launch checkout (not read here)
- Graph ledger: `GRAPH-RUN.md`

## Slices

| Slice | Title | Status | Depends on | Criteria |
| --- | --- | --- | --- | --- |
| A | [Experiment runs and identity record](slice-a-experiment-runs.md) | done | none | 8 (0 manual) |
| B | [Save as you go, resume, spending cap, unpriced models](slice-b-checkpoint-resume-cap.md) | done | Slice A (run folder, record key, identity record) | 9 (0 manual) |
| C | [Grader repair and runtime parity](slice-c-grader-repair-runtime-parity.md) | done | Slice A (identity record and record shape) | 9 (0 manual) |
| D | [Offline evidence trace](slice-d-evidence-trace.md) | done | none (independent of A to C; shares only the read-only rules gate inputs) | 7 (0 manual) |
| E | [Diagnostic arms and manifests](slice-e-arms-and-manifests.md) | done | Slices A (arm key), C (judge and record shape), D (trace feeds manifest selection) | 8 (0 manual) |
| F | [Paired comparison report](slice-f-compare-report.md) | done | Slices A (run folders) and C (record fields) | 9 (0 manual) |
| G | [Phase 0 run, findings, runbook, and product-truth apply](slice-g-offline-run-runbook-and-truth.md) | planned | Slices A to F | 13 (1 manual) |

Plan: [GAMEPLAN.md](GAMEPLAN.md). Build order A, B, C, D, E, F, G. Slice G applies the finalized product-truth proposal.

## Implementation map

| Area | Files |
| --- | --- |
| Experiment runs, checkpoint, cap (A, B) | `scripts/eval-answer-quality.mjs`, `scripts/lib/experiment-run.mjs` |
| Grader repair and parity (C) | `apps/backend/src/eval/answer-quality/judge.ts`, `rubric.ts`, `scripts/lib/prompt-fidelity.mjs` |
| Evidence trace (D) | `scripts/eval-evidence-trace*.mjs`, `scripts/lib/evidence-trace.mjs` |
| Arms and manifests (E) | `scripts/lib/diagnostic-arms.mjs`, `apps/backend/src/eval/answer-quality/manifests/` |
| Compare report (F) | `scripts/eval-answer-compare.mjs`, `scripts/lib/answer-compare.mjs` |
| Findings, runbook, PRD apply (G) | `docs/eval/answer-quality-investigation/`, `PRD/sections/` |

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/answer-quality-investigation/DESIGN-BRIEF.md`
- Findings: none
