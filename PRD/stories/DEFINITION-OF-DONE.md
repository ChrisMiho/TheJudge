# Definition of Done (Active Stories)

This Definition of Done applies to active story execution in `PRD/stories/` (MVP2+).

For historical MVP1 completion criteria and snapshots, use `PRD/archive/mvp1/stories/DEFINITION-OF-DONE.md`.

## Required Completion Gates

- Scope completed exactly as written in the story file; any scope changes are explicitly documented.
- Acceptance criteria are fully satisfied and testable.
- Existing behavior outside story scope is preserved (no unplanned regressions).
- Changes follow current product/source-of-truth precedence in `PRD/README.md`.

## Engineering Quality

- Relevant automated tests are added or updated for the changed behavior.
- Existing tests remain green for impacted areas.
- Types/linting/build checks pass for touched runtime areas.
- Logging and error behavior remain deterministic where applicable.

## Contract and Safety

- Public contract behavior remains stable unless the story explicitly scopes a contract change.
- Feature flags and environment settings are documented for any behavior gating.
- No secrets or credential material are committed (local secret handling rules still apply).
- Backend-only secret boundaries remain intact for provider integrations.

## Documentation and Tracking

- Story file reflects final implementation scope and any finalized dependency notes.
- Required tracker docs are updated when milestones are reached:
  - `PRD/analysis/MVP2-bedrock-integration-roadmap.md`
  - `PRD/README.md` (if control-plane guidance changes)
- Historical references use archive paths when citing MVP1 story work.

## Verification Evidence

- At least one explicit verification artifact is recorded (tests run, manual checks, or both).
- Any known follow-up work is clearly called out and tracked as separate backlog scope.