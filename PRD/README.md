# README.md

## Status
- Project Status: active
- Documentation baseline: product truth in `sections/`; agent process in `instructions/`
- Next work: start from the relevant feature spec under `sections/<feature>/README.md` and edit it plus its cited `REQ`/`FLOW` in place; the decision log is retired

## Purpose
This file is the control-plane document for the PRD set.

Use it to:
- find the right file for a given task
- understand source-of-truth precedence
- navigate product content vs. agent instructions

## Read First
For implementation work, read in this order:
1. the relevant feature spec `sections/<feature>/README.md` (current-state truth)
2. the related requirement/flow section file(s)
3. `sections/decisions.md` — only to resolve a cited `DEC-ID`
4. the relevant instruction file(s)

## Source-of-Truth Precedence
1. the current-state feature specs `sections/<feature>/README.md` are read-first truth for what a feature does today
2. section files (`REQ`/`FLOW`/`NFR`, screen layout, system map) define current product scope
3. `sections/decisions.md` is a demoted historical index — resolves a cited `DEC-ID`, never an override
4. instruction files define how the agent should process and generate content
5. `README.md` is the navigation layer only (not a backlog or roadmap)

## Section Inventory

| File | Status | Description |
|---|---|---|
| `sections/overview.md` | complete | High-level summary of the product and current product status |
| `sections/problem-statement.md` | complete | Problem being solved and why it matters |
| `sections/goals-and-non-goals.md` | complete | Goals, success metrics, scope boundaries, and out-of-scope items |
| `sections/personas.md` | complete | Primary user and pain points |
| `sections/user-flows.md` | complete | End-to-end user journeys and edge flows |
| `sections/functional-requirements.md` | complete | Product requirements and acceptance criteria |
| `sections/non-functional-requirements.md` | complete | Performance, security, maintainability, and system quality constraints |
| `sections/integrations-and-data.md` | complete | API contracts, stack ordering, integrations, data notes, and dependencies |
| `sections/open-questions.md` | needs review | Unresolved items that need human decisions |
| `sections/decisions.md` | retired | Demoted historical index (precedence #2): resolves a cited `DEC-ID` to a one-line summary; the feature specs are the current truth |
| `sections/decisions/deployment.md` | active | The only surviving decision bodies — the two deployment decisions DEC-084 / DEC-169 |
| `sections/system-map.md` | active | Feature/subsystem catalog: shipped-vs-planned status, behavior summary, and coarse location per subsystem |
| `sections/screen-layout.md` | active | Screen layout catalog: purpose, hybrid % size bands, fit/containment per major screen for agent-directed UI (DEC-149) |
| `sections/life-tracker/` | active | Current-state feature spec for the Player Life Tracker, consolidating its decision/requirement/flow sources into one view (DEC-168) |
| `sections/user-feedback/` | active | Current-state feature spec for the Feedback & Bug Report feature, consolidating its decision/requirement/flow sources into one view (DEC-168) |
| `sections/trade-balancer/` | active | Current-state feature spec for the Trade Balancer, consolidating its decision/requirement/flow sources into one view; its price corpus is documented in the directory's `data/cardPrintingPrices.md` (DEC-168) |
| `sections/scan/` | active | Current-state feature spec for Card Scanning — the cross-cutting camera input path shared by In-Depth, Quick Question, and Trade Balancer — consolidating its decision/requirement/flow sources into one view; its two committed Magic-data corpora are documented in the directory's `data/cardhashes.md` and `data/cardScanMap.md` (DEC-168) |
| `sections/quick-lookup/` | active | Current-state feature spec for Quick Lookup — the short-ask Ask AI destination — consolidating its decision/requirement/flow sources into one view, including the full backend path (validation, branching prompt assembly, retrieval, provider boundary) (DEC-168) |
| `sections/in-depth/` | active | Current-state feature spec for In-Depth Question — the primary MTG Assistant loop (staged game-context capture plus the `mode: "game"` Ask AI backend and post-decrypt conversation) — consolidating its decision/requirement/flow sources into one view, including the full backend path (validation, game-mode prompt assembly, rules and combo enrichment, provider boundary) (DEC-168) |
| `sections/shared-chrome/` | active | Current-state feature spec for shared chrome — the frame every destination mounts into (suite shell, Menu rail/tray, mock-mode banner, routing/load fallback, the shared answered-conversation workspace, history drawer, View Context overlay, suite-wide card-detail popup) plus the shared layout language — consolidating its decision/requirement/flow sources into one view (DEC-168) |

## Instruction Inventory

| File | Status | Description |
|---|---|---|
| `instructions/agent-working-rules.md` | active | Behavioral rules for any agent editing or generating content in this PRD set |
| `instructions/doc-lifecycle.md` | active | When to create, promote, and delete ephemeral planning docs |
| `instructions/writing-rules.md` | complete | Rules for writing and editing these documents |
| `instructions/requirement-format.md` | complete | Required formatting templates for requirements, flows, questions, and slices (the decision log is retired — no DEC template) |
| `instructions/technical-design-rules.md` | complete | Constraints for architecture and implementation proposals |
| `instructions/secrets-handling.md` | active | Guardrails for storing secrets in `.secrets/`, never committing them, and validating secret decisions with the user |
| `instructions/test-naming.md` | active | Hierarchical Vitest title convention (`Layer - Feature` outer describe, nested area + behavior) |
| `instructions/workflow-reference.md` | active | Lean ten-skill PRD workflow reference: interactive and autonomous paths, handoff prefix rule, work-folder lifecycle, status vocabulary |
| `instructions/preparation-contract.md` | active | Autonomous one-package preparation, assumption, blocker, and PR-publication contract |
| `instructions/graph-workflow-contract.md` | active | Autonomous graph-run contract: node table, per-node model map, run ledger schema, human-gate parking, and boundaries |
| `instructions/skill-testing.md` | active | Skill-fixture format, storage, and re-run triggers for verifying `thejudge-*` skill edits |
| `instructions/skill-fixtures/` | active | Per-skill regression scenarios: prompt, grading key, and measured runs |

## Which Files to Read for Which Task

### If the task is product understanding
Read in this order:
1. `sections/overview.md`
2. the relevant feature spec `sections/<feature>/README.md`
3. `sections/goals-and-non-goals.md`
4. `sections/problem-statement.md`

### If the task is feature implementation
Read in this order:
1. the relevant feature spec `sections/<feature>/README.md`
2. `sections/functional-requirements.md`
3. `sections/user-flows.md`
4. `sections/integrations-and-data.md`
5. `sections/non-functional-requirements.md`
6. `instructions/technical-design-rules.md` (if architecture or code structure is involved)
7. `instructions/secrets-handling.md` (if credentials, env vars, or provider keys are involved)

### If the task is UI layout, containment, density, or visual polish of screens
Read in this order:
1. `sections/screen-layout.md`
2. the relevant feature spec `sections/<feature>/README.md`
3. `sections/decisions.md` — only to resolve a cited `DEC-ID`
4. `sections/functional-requirements.md` (layout-related REQs)
5. `instructions/technical-design-rules.md`

### If the task is slice planning or map-out
Read in this order:
1. the relevant feature spec `sections/<feature>/README.md`
2. `sections/functional-requirements.md`
3. `sections/user-flows.md`
4. `instructions/workflow-reference.md`
5. `instructions/requirement-format.md`

### If the task is writing or renaming tests
Read in this order:
1. `instructions/test-naming.md`
2. `instructions/technical-design-rules.md` (if architecture or shared helpers are involved)

### If the task is document editing or extension
Read in this order:
1. `instructions/agent-working-rules.md`
2. `instructions/doc-lifecycle.md` (if creating or closing non-section PRD markdown)
3. `instructions/writing-rules.md`
4. the relevant feature spec `sections/<feature>/README.md` (open `sections/decisions.md` to resolve a cited `DEC-ID`)
5. the relevant target section file

## Working Rules Summary
- Keep product truth in section files.
- Keep workflow and generation guidance in instruction files.
- Ephemeral slice plans live only in `PRD/work/<slug>/` and must be deleted when the slice ships (see `instructions/doc-lifecycle.md`).
- Do not guess when the source is ambiguous.
- Put unresolved ambiguity in `sections/open-questions.md`.
- Record product truth by editing the current-state feature spec `sections/<feature>/README.md` and its cited `REQ`/`FLOW` in place; the decision log is retired, so do not author a new `DEC-###`.
- Prefer narrow edits to one file at a time.
- Preserve stable IDs once assigned.
- Agent workflow skills: edit `.claude/skills/thejudge-*` (canonical), run `npm run skills:ai-sync` to mirror into `.agents/skills/`; see `AGENT-SKILLS.md`.
- Autonomous graph runs: start a fresh run with one command — `/graph-run "<request>"` — which dispatches `graph-preflight` itself as its first step; resume a parked run with `/graph-run PRD/work/<slug>/`. On a define-gate park, answer `GATE-QUESTIONS.md` then `/graph-gate-review PRD/work/<slug>/` applies the verdicts before you resume. Contract in `instructions/graph-workflow-contract.md`, permission profile in `.claude/graph-profile.json` — which binds only in a session launched with `claude --settings .claude/graph-profile.json` and is inert without that flag. Owner-facing task recipes: `OPERATOR.md`.

## Work packages

Work packages: see [work/STATUS.md](./work/STATUS.md) (skill-maintained board + per-package `STATUS.*` markers).

## Current Editorial Notes
- Current product status: TheJudge is an MTG assistant suite (`DEC-094`); the primary MTG Assistant loop is validated (past MVP) and deployed on AWS with the live OpenAI provider; local development remains mock-default (`DEC-020`, `DEC-084`).
- Duplicate-card blocking is temporary and should not be treated as long-term product truth.
- Stack ordering is critical and must remain consistent across UI, API payloads, and prompt-building logic.
- Default local provider mode is mock (`ASK_AI_PROVIDER=mock`); live OpenAI path is documented in `DEC-020`, `sections/integrations-and-data.md`, and `apps/backend/src/providers/README.md`.
- Local OpenAI onboarding should keep non-secrets in `apps/backend/.env` and real secrets in `.secrets/openai-dev.env`.
- Provider modularity remains a hard rule: route handlers stay contract-focused and only consume the provider interface selected in bootstrap/factory composition.

## Implementation Snapshot
- Runtime code is split across `apps/frontend` and `apps/backend`, with a single product-facing backend route (`POST /api/ask-ai`) plus health endpoint.
- Current frontend flow supports staged context + stack interaction patterns; canonical behavior is tracked in `sections/user-flows.md`.
- Prompt/input contract includes structured context beyond stack/question (see `sections/integrations-and-data.md` and the `sections/in-depth/README.md` feature spec).
- Metadata pipeline remains static-file based (`npm run data:build` / `npm run data:refresh`) with runtime loading from `/data/cardMetadata.json`.
- Context/prompt regression coverage lives in tests and `apps/backend/src/eval/fixtures/README.md`.
- Automated tests and type checks are part of the active workflow; root dev run remains `npm run dev`.
