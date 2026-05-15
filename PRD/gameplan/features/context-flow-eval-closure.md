# Feature Gameplan: Context Flow Eval Closure

## Metadata

- feature_slug: context-flow-eval-closure
- status: active
- owner: unassigned
- last_updated: 2026-05-14

## Objective

Close the remaining context-flow eval backlog so the assembly -> enrichment -> review -> submit path has reliable automated coverage, documented QA checks, and debug milestones aligned with MVP2 reliability goals.

## Source Traceability

- REQ: `REQ-006`, `REQ-012`, `REQ-013`, `REQ-014`, `REQ-015`, `REQ-016`, `REQ-017`
- FLOW: `FLOW-001`, `FLOW-003`
- NFR: `NFR-002`, `NFR-005`, `NFR-007`
- DEC: `DEC-002`, `DEC-004`, `DEC-009`, `DEC-014`, `DEC-019`
- Q: none currently blocking in this slice
- STORY: `STORY-069` to `STORY-078` (focus on currently open items)

## Scope In

- Complete open context-flow eval stories currently tracked in `PRD/README.md`.
- Preserve and verify stack ordering and deterministic request/prompt context behavior.
- Add/finish coverage for cross-list targeting integrity, review-submit parity, gating/picker behavior, submit-retry regression, and navigation-state preservation.
- Wire frontend debug milestone logging after navigation/state foundations are complete.
- Keep QA checklist and eval strategy docs synchronized with implemented coverage.

## Scope Out

- No deterministic rules-engine behavior, legality validation, or board-state simulation.
- No new product-facing endpoints or architecture expansion beyond current backend seam.
- No unrelated UI polish or animation-heavy work.
- No promotion of deferred `D-09` LLM-judge scope into active implementation.

## Execution Waves

### Wave 0

- goal: Reconfirm baseline and sequence remaining open work against current roadmap/checklists.
- tasks:
  - Align open stories from `PRD/README.md` with `PRD/analysis/EVAL-STRATEGY-context-flow-rework.md`.
  - Validate that completed dependencies (`STORY-070`, `STORY-072`) remain green and usable as prerequisites.
  - Finalize execution ownership and order for open stories before code changes.
- dependencies:
  - Existing story status and dependency notes in PRD docs.
- exit criteria:
  - Open story set and order are explicit and consistent across PRD trackers.

### Wave 1

- goal: Land integrity and parity coverage that gates later logging and state-path validation.
- tasks:
  - Complete `STORY-071` cross-list target integrity tests.
  - Complete `STORY-073` review vs submit parity tests after target integrity and stack-order baseline checks.
  - Complete `STORY-074` gating and picker RTL tests.
  - Complete `STORY-077` submit and retry regression tests.
- dependencies:
  - `STORY-070` (stack serialization baseline) and `STORY-072` (backend eval fixtures) completed.
  - Shared request-builder test hotspots coordinated to avoid conflicting assertions.
- exit criteria:
  - Wave 1 tests are passing and validate the full review/submit contract with stable ordering semantics.

### Wave 2

- goal: Lock navigation/state resilience and unlock debug milestone instrumentation.
- tasks:
  - Complete `STORY-075` navigation and state preservation tests.
  - Verify previous-wave tests continue passing after navigation-state assertions.
- dependencies:
  - `STORY-070` ordering baseline.
  - Wave 1 parity/regression coverage in place.
- exit criteria:
  - Navigation and state preservation behaviors are covered and non-flaky.

### Wave 3

- goal: Add traceable frontend debug milestones on top of stable behavior coverage.
- tasks:
  - Complete `STORY-076` `logFrontendDebug` milestone wiring.
  - Validate logs align to documented context-flow checkpoints and do not alter user-facing contract behavior.
- dependencies:
  - `STORY-075` completed.
- exit criteria:
  - Debug milestone logs are emitted at expected checkpoints with tests/docs updated.

### Wave 4

- goal: Finalize documentation closure and defer optional scope explicitly.
- tasks:
  - Complete `STORY-078` deferred documentation for optional `D-09` LLM-judge eval.
  - Update QA checklist and roadmap trackers to reflect completed/remaining work.
- dependencies:
  - Previous waves complete so deferral documentation reflects final implemented state.
- exit criteria:
  - Deferred scope is explicit, and active context-flow eval backlog is marked complete where appropriate.

## Risks and Mitigations

- Shared test harness hotspots can cause flaky or conflicting assertions.
  - Mitigation: isolate fixtures/helpers, keep assertions scoped per behavior, and run focused suites before full quality checks.
- Sequence drift between PRD trackers can create false completion signals.
  - Mitigation: treat PRD tracker updates as acceptance criteria for each completed story slice.
- Debug milestone logging may accidentally mutate runtime behavior.
  - Mitigation: verify logging is side-effect free and guarded by existing debug pathways.

## Validation Plan

- tests:
  - Run targeted suites for each open story wave as they land.
  - Run `npm run quality:check` from repo root before marking closure.
  - Re-run backend eval harness coverage where fixtures/contracts are touched.
- manual checks:
  - Exercise end-to-end context flow for assembly -> enrichment -> review -> submit -> failure/retry.
  - Confirm stack order remains bottom-to-top across UI payload display and backend prompt/debug output.
- docs to update:
  - `PRD/README.md` checklist statuses for `STORY-071`, `STORY-073`, `STORY-074`, `STORY-075`, `STORY-076`, `STORY-077`, `STORY-078`
  - `PRD/analysis/EVAL-STRATEGY-context-flow-rework.md`
  - `docs/qa/context-flow-f3-checklist.md`

## Rollout and Fallback

- Roll out in wave order, merging only when each wave’s tests and tracker criteria are satisfied.
- If regressions appear, pause progression to later waves and revert to the last passing wave baseline.
- Keep provider/contract behavior stable; this feature plan strengthens verification and observability rather than changing product semantics.

## Next Actions

1. Confirm owner and immediate start story (`STORY-071` recommended).
2. Execute Wave 1 and update PRD trackers as each story closes.
3. Continue wave-by-wave until closure, then run a sync pass for `PRD/gameplan/`.
