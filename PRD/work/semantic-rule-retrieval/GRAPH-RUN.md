# Graph run — semantic-rule-retrieval

- Run ID: `graph-20260901-044411`
- Profile: `unverified`
- Canary: `pending`
- Autonomous base: `pending`
- Staging: `.worktrees/.graph-intake/graph-20260901-044411/`
- Current node: `preflight`
- Next action: `/graph-run PRD/work/semantic-rule-retrieval/`

Entry: resume of an existing `STATUS.ideation` package with no ledger and no
`## Autonomous metadata`. Per the entry-point table, run `preflight` first to
mint and record the autonomous base, then enter at `define`. The package,
intake, findings, and the reused RAG/combo harness are committed on
`explore/semantic-rule-retrieval` (5 commits ahead of `origin/main`) and exist
nowhere else, so the base branches from the current checkout — the only base
that carries the evidence and tooling the run reads.

## Node ledger

| # | Node | Model | Outcome | Heartbeat | Evidence | Date |
| --- | --- | --- | --- | --- | --- | --- |

## Open gate

- None

## Dispatch prompts

### preflight

graph-run is controlling.

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Run graph-preflight for an autonomous graph run.

- Slug: semantic-rule-retrieval
- Run ID: graph-20260901-044411
- Branch to create: thejudge-auto/semantic-rule-retrieval
- Base: default to the current branch (explore/semantic-rule-retrieval) — the
  package, intake, findings, and the reused harness are committed there and on
  no other branch, so the autonomous base must branch from it.

Follow the graph-preflight skill exactly:
1. Refuse if `.worktrees/.graph-stop` exists.
2. Take the concurrency lock via the script; report classifyLock() state.
3. Run `npm run graph:preflight -- --branch thejudge-auto/semantic-rule-retrieval --run-id graph-20260901-044411 --dry-run` and report the classification, resolved base, planned commands, and both `profile sentinel:` / `Profile:` lines verbatim.
4. If not blocked, re-run identical without `--dry-run`, same `--run-id`.
5. Issue CANARY_COMMAND as a real Bash tool call, require a deny, classify with classifyCanary(), report ledgerLine.
6. After the lock is held, issue GRAPH_CANARY_COMMAND as a real Bash tool call, require a deny, classify with classifyGraphCanary(), report ledgerLine.
7. Confirm `git status --porcelain` empty and `git branch --show-current` is thejudge-auto/semantic-rule-retrieval.

Report: branch created + pushed, resolved base, both canary ledger lines, the profile sentinel line, the lock state, and `.worktrees/.graph-node-calls.json` contents if present. Do not dispatch any further node — return to the driver.

## Instruction ledger

| Instruction | Class | Node | Rule |
| --- | --- | --- | --- |
