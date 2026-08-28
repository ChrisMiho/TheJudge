# Sweep finding — doc-process

- Corpus file: /Users/chrismiho/Coding/Projects/TheJudge/PRD/sections/decisions/doc-process.md
- Scored against: 7 current-state specs under PRD/sections/<feature>/README.md
- Items: 13

## DEC-044 — not-absorbed
Adopts `sections/system-map.md` as a shipped/planned catalog with its own `Status` field; this is PRD-tooling structure, not player-facing behavior, and DEC-044's own Impact says no `system-map.md` entry tracks doc-process work — none of the 7 feature specs mention the catalog, its `shipped/planned/partial` states, or the promotion gate.

## DEC-048 — not-absorbed
Adds per-subsystem `system-map/*.md` detail files (fixed template: Backed by / How it works / Data flow / Where it lives / Worked example / Invariants); this governs a different durable artifact (the system-map detail layer) than the current-state feature specs, and none of the 7 specs reference or reuse that detail-file template or its `Details:` pointer mechanism.

## DEC-063 — not-absorbed
Splits `decisions.md` into a router plus nine topic files under `sections/decisions/` (framing, capture-and-stack, game-context-model, prompt-assembly, rules-retrieval, providers-and-contract, conversation-ux, scanning, doc-process); this is decisions-corpus file structure, not product substance, and is invisible in the 7 feature specs (each spec's `Backed by:` line cites individual DEC/REQ IDs directly, never the domain-file taxonomy).

## DEC-086 — not-absorbed
Collapses `quality:check` to a single Vitest coverage pass and reorganizes test files (split `App.test.tsx`, extract EnrichmentStep fixtures, group scan suites); this is CI/test-tooling only, explicitly carries no `system-map.md` entry per its own Notes, and has no player-facing substance for a feature spec to capture.

## DEC-115 — not-absorbed
Makes `thejudge-*` skill responses terse-by-construction and retires the shared output-guidance profile file; this is agent-workflow response-discipline, not product behavior, and none of the 7 specs (which describe player-facing feature behavior) reference skill output style.

## DEC-154 — not-absorbed
Defines the contract-centered agent-workflow lifecycle (worktree ownership, autonomous prep/implement/cleanup rules, Playwright verification gates, process cleanup); explicitly documentation/agent-workflow/developer-tooling only with no product UI/API/prompt change, and its own Impact says no `system-map.md` entry is added — none of it appears in the 7 feature specs.

## DEC-155 — not-absorbed
Restructures GitHub Actions into parallel/sharded jobs and gates `Deploy AWS` on the quality gate; CI/tooling only, no product behavior change, explicitly no `system-map.md` entry — absent from all 7 feature specs.

## DEC-163 — not-absorbed
Adds the autonomous `graph-run`/`graph-preflight` workflow over the `thejudge-*` lifecycle with a resumable ledger and permission profile; agent-workflow/developer-tooling only, explicitly no `system-map.md` entry — absent from the 7 feature specs, which describe product behavior, not the authoring workflow that produced them.

## DEC-164 — not-absorbed
Converts the graph workflow's boundaries from prose to enforced scripts/hooks (ledger check, fixture rig, protected-path guard, permission-profile reconciliation); agent-workflow/tooling only, explicitly no `system-map.md` entry — no trace in any of the 7 feature specs.

## DEC-165 — not-absorbed
Deletes `.cursor/`, makes `.claude/skills/` canonical with `.agents/skills/` its mirror; repository agent-runtime tooling only, explicitly no `system-map.md` entry — not the kind of content a player-facing feature spec captures, and absent from all 7.

## DEC-166 — not-absorbed
Moves graph-workflow safety boundaries into a committed `PreToolUse` hook with a kill switch, tool-call caps, and default-FAIL slice criteria; agent-workflow/repository-configuration only, no product UI/API/prompt change — absent from the 7 feature specs.

## DEC-167 — not-absorbed
Makes `graph-run` the single intake door (optional `--branch`, intake staging, prior-run linking, widened `BLOCKED`) and retires `thejudge-prepare` as an entry point; agent-workflow/intake tooling only — no product substance for a feature spec to carry, and absent from all 7.

## DEC-168 — absorbed
Defines the current-state feature-spec layer itself (fixed template: `Status` draft/precedence marker, `Backed by:`, **What it is**, **How it works** with `Built:` markers, **Measured bounds**, **Rejected alternatives and deferred scope**, **Where it lives**) and mandates landing exactly one instance (life-tracker); all 7 current-state specs — including `life-tracker/README.md` — reproduce this exact template verbatim, so the decision's substance is fully realized (and exceeded, since 6 more features adopted the optional template beyond the one DEC-168 required).
