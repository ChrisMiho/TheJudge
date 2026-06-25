# TheJudge Output Guidance

Use this shared guidance for `thejudge-*` workflow skill responses. It changes only how much the agent writes back to the user; it does not change the work each skill performs.

## Profile Selection

- `standard` is the default profile. It should be shorter than the pre-guidance baseline: concise status, key decisions, files or IDs touched, verification, and the required handoff.
- `lean` is for routine execution. Use terse status and include only decisions, blockers, verification, files changed, and the required `Next step`.
- `detailed` is for explicit user requests for fuller context. Include reasoning, tradeoffs, or relevant excerpts only when they help the user review the work.

Plain-language per-session overrides are allowed, such as "use lean output" or "detailed output is OK". Apply the override for the current session unless the user changes it again.

## Mandatory Output

Profile choice never changes required reads, writes, approval gates, PASS/FAIL calls, blockers, verification, files changed, status updates, or required `Next step` handoff blocks.

Every profile must still report:

- approval requests and selected options or tradeoffs when required
- PASS/FAIL outcomes
- blocker details
- verification commands and results
- files changed
- required `Next step` handoff blocks

## Avoid

- full document dumps unless the user asks or a blocker requires exact context
- repeated background already established in the session
- long command output when a concise result is enough
- broad summaries unrelated to the current workflow step
- persistent settings, config files, CLI flags, workflow routers, token-budget automation, or product code changes
