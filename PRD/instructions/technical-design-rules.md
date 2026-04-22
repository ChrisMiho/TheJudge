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
- AWS Bedrock through backend only
- mock-first delivery before real AI integration

## Required Constraints
- preserve stack ordering exactly
- keep backend intentionally small
- use backend-only model invocation
- keep animations basic
- preserve plain-text MVP1 response output

## Forbidden Design Drift
Do not propose or implement:
- deterministic rules engine behavior
- legality validation
- board-state simulation
- full gameplay-rules target/controller/mode simulation for MVP1
- extra product-facing endpoints
- microservices
- runtime metadata refresh/sync
- billing/auth/account systems in MVP1
- flashy UI animation systems
- duplicate-card support in MVP1

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
