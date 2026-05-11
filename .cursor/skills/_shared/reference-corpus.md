# TheJudge Backlog Pipeline Reference Corpus

Last reviewed against repository guidance on 2026-05-11. Refresh this file when `PRD/sections/decisions.md`, MVP phase docs, or instruction rules change materially.

## Purpose

This file is the single embedded governance source for:

- `.cursor/skills/problem-analysis/SKILL.md`
- `.cursor/skills/stories-from-analysis/SKILL.md`

Use it to avoid re-reading a long chain of repo documents for routine analysis/story drafting while still staying aligned with project rules.

## Product and Phase Snapshot

- Product: TheJudge is an MVP card-stack interaction assistant for Magic gameplay questions.
- Current phase: MVP2 active (Bedrock integration and reliability hardening).
- MVP1 is historical and archived.
- Monorepo shape: `apps/frontend`, `apps/backend`, `PRD`, `scripts`.
- Main API surface remains intentionally small (`POST /api/ask-ai`, `GET /api/health`).
- Baseline quality gate command: `npm run quality:check`.

## Source-of-Truth Precedence

Apply this precedence when guidance conflicts:

1. `PRD/sections/decisions.md`
2. Active `PRD/sections/*` files
3. `PRD/instructions/*`
4. `PRD/README.md` and root `README.md` as navigation/context

Archive rule:

- `PRD/archive/*` is historical only unless promoted into active `PRD/sections/*`.

## Core Decision Themes (Distilled)

These are stable constraints to apply by default:

- The product is a flow-validation assistant, not a gameplay-accurate judge.
- The product is an assistant, not an authoritative deterministic rules engine.
- Stack ordering is bottom-to-top; `stack[0]` is bottom and the last item is top.
- Backend remains intentionally small with one main product-facing endpoint.
- MVP progression is mock-first before real Bedrock integration.
- Backend should validate request shape and construct prompt context, not implement legality/rules simulation.
- Prompt/context behavior must preserve documented ordering and approved structured fields.

When a task updates repository artifacts, do not rely only on these themes:

- Validate exact wording and IDs against live `PRD/sections/decisions.md`.
- Never invent `DEC-###`, `REQ-###`, `FLOW-###`, or `Q-###` IDs.

## Allowed Technical Direction

- Frontend: React + Vite + TypeScript.
- Styling: Tailwind CSS.
- Card search metadata: local static metadata file.
- Backend: Node.js + TypeScript, Express or Fastify.
- AI invocation: AWS Bedrock through backend only.
- Keep backend narrow and avoid endpoint sprawl.
- Keep animations basic and avoid flashy UI systems.

## Forbidden Design Drift

Do not propose as current-scope work unless product decisions explicitly change:

- deterministic rules-engine behavior
- legality validation
- board-state simulation
- full gameplay target/controller/mode simulation for MVP1 scope
- extra product-facing endpoints
- microservices
- runtime metadata refresh/sync in flow-validation scope
- MVP1 billing/auth/account systems
- duplicate-card support in MVP1

## Agent Editing and Ambiguity Discipline

- Keep edits narrow and local.
- Preserve stable IDs.
- Avoid duplicating product truth across too many files.
- Keep product truth in `PRD/sections/*`.
- Keep process/generation guidance in `PRD/instructions/*`.
- If ambiguity exists, do not silently guess; capture it as `Q-###` in `PRD/sections/open-questions.md`.
- Do not promote optional ideas into committed scope.
- Do not pull archive/future-phase content into active scope unless promoted by decisions or active roadmap.

## Writing and Formatting Rules

- Use concise markdown, clear headings, short paragraphs, and bullets.
- Prefer self-contained entries and stories.
- Preserve product meaning and naming consistency.
- Separate confirmed requirements from assumptions/open questions.
- Use labels where useful: Summary, Requirements, Constraints, Dependencies, Notes.
- Make smallest correct change rather than broad rewrites.

ID guidance:

- `REQ-###`, `FLOW-###`, `DEC-###`, `Q-###`, `NFR-###`
- Preserve IDs once created; renumber only with strong editorial reason.

## Story Generation Rules (Distilled)

Generate from confirmed requirements and decisions only:

- Treat decisions as override rules.
- Do not convert open questions into committed backlog scope.
- If ambiguous, reference relevant `Q-###`.
- Default to thin, independent, parallelizable stories.
- If sequential, explicitly mark blockers and why ordering is required.

Execution modes:

- `parallel-ready`: no blocking story prerequisite IDs; dependencies are references (REQ/DEC/NFR/etc.).
- `sequential`: include blocking story ID(s), one-line reason, and what becomes parallelizable after landing.

Story quality:

- One primary objective per story.
- Explicit implementation area (`frontend` | `backend` | `full-stack`).
- Acceptance criteria are verifiable and include auditable tracker updates.
- Dependency entries are concrete and actionable.

## Story Output Contract

Use this structure for each `PRD/stories/` entry:

- title:
- implementation area: (`frontend` | `backend` | `full-stack`)
- user value:
- scope:
  - ...
- acceptance criteria:
  - ...
- execution mode: (`parallel-ready` | `sequential`)
- dependencies:
  - ...
- exclusions:
  - ...

Tracker criterion requirement for MVP2+:

- Include at least one acceptance criterion that names concrete file updates, such as:
  - `PRD/analysis/MVP2-bedrock-integration-roadmap.md`
  - `PRD/README.md`
  - the relevant `PRD/stories/STORY-###` file

## Task-Specific Read Order (Minimal)

For analysis outputs:

1. `PRD/sections/decisions.md` (confirm exact constraints/IDs when needed)
2. relevant `PRD/sections/*` files for the problem area
3. this corpus and any active story/roadmap files for scope anchoring

For story drafting:

1. analysis artifact (input)
2. `PRD/sections/decisions.md`
3. relevant `PRD/sections/functional-requirements.md` and `PRD/sections/user-flows.md`
4. this corpus for output shape and dependency/tracker rules

## Secret-Handling Non-Negotiables

- Never commit real secrets.
- Keep local secret material under `.secrets/`.
- Never place real values in `.env`, `.env.example`, PRD docs, stories, screenshots, or commit messages.
- Before secret-related changes (file naming/location/env variable changes), request explicit user confirmation.
- Before commit/push, ensure `.secrets/` content is not staged and no secret payloads appear in diffs.
- If secret exposure is suspected: stop and notify user before proceeding.
