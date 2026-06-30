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
- decorative UI motion is permitted app-wide but must stay CSS-based, `prefers-reduced-motion`-aware, and performance-safe (DEC-079, NFR-006); do not introduce an animation library/framework without a new confirmed decision
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
- dependency-driven/heavyweight animation frameworks, or motion that ignores `prefers-reduced-motion` or regresses mobile performance (decorative CSS motion is permitted per DEC-079/NFR-006; this narrows the prior blanket "flashy UI animation systems" exclusion)
- duplicate-card support in the core product

## Design Proposal Rules

- **reuse before creating** — before writing a new constant, helper, or type, search for an existing one and reuse or extend it rather than re-implementing; shared logic must have a single authoritative definition imported wherever needed, and duplicated constants/functions across files or the FE↔BE boundary are a defect, not a style preference
- tie proposals back to existing requirements and decisions
- prefer the smallest solution that satisfies current scope
- keep future extensibility notes separate from current implementation scope
- if a proposal adds product behavior, update product section files rather than burying it in technical notes

## Prompt-Related Rules

- preserve bottom-to-top ordering semantics
- pass documented structured context fields (question, stack, and approved game/battlefield/entry context)
- do not add hidden-state assumptions beyond documented prompt guidance
- do not add rules-validation behavior under the label of prompt enrichment
- do not change `AskAiRequest` shape, Zod schemas, or backend prompt assembly (`buildPromptContext`, `buildPromptText`) without a new confirmed decision in the relevant `sections/decisions/<domain>.md` file and a router index line in `sections/decisions.md`
- `MAX_PROMPT_CHAR_BUDGET` is set to `EFFECTIVELY_UNLIMITED_CHARS = 1_000_000` (DEC-042 amendment to DEC-030); do not bypass prompt diagnostics to silence test failures; update eval goldens only for intentional behavior changes; revisit cap values after latency/cost sampling
