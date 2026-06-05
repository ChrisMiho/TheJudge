# technical-design-rules.md

## Purpose

These rules govern how agents may propose architecture or implementation details.

## Allowed Design Direction

- React + Vite + TypeScript frontend
- Tailwind CSS for styling
- local static metadata file for card search
- one main backend endpoint
- Node.js + TypeScript backend
- Express or Fastify
- backend provider boundary with explicit `ASK_AI_PROVIDER` selection (`mock` default, `openai` live)
- mock-first local baseline before enabling live provider mode

## Required Constraints

- preserve stack ordering exactly
- keep backend intentionally small
- use backend-only model invocation
- keep animations basic
- preserve plain-text core product response output

## Forbidden Design Drift

Do not propose or implement:

- deterministic rules engine behavior
- legality validation
- board-state simulation
- full gameplay-rules target/controller/mode simulation for the core product
- extra product-facing endpoints
- microservices
- runtime metadata refresh/sync
- billing/auth/account systems in the core product
- flashy UI animation systems
- duplicate-card support in the core product

## Design Proposal Rules

- tie proposals back to existing requirements and decisions
- prefer the smallest solution that satisfies current scope
- keep future extensibility notes separate from current implementation scope
- if a proposal adds product behavior, update product section files rather than burying it in technical notes

## Prompt-Related Rules

- preserve bottom-to-top ordering semantics
- pass documented structured context fields (question, stack, and approved game/battlefield/entry context)
- do not add hidden-state assumptions beyond documented prompt guidance
- do not add rules-validation behavior under the label of prompt enrichment
- do not change `AskAiRequest` shape, Zod schemas, or backend prompt assembly (`buildPromptContext`, `buildPromptText`) without a new confirmed decision in `sections/decisions.md`
- do not relax `MAX_PROMPT_CHAR_BUDGET` or bypass prompt diagnostics to silence test failures; update eval goldens only for intentional behavior changes
