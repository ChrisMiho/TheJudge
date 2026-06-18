---
name: prd-doc-traceability
description: Lightweight guardrails so PRD truth-layer docs reflect shipped reality, plus a concise living "system map" so questions are answerable without re-deriving behavior from code
metadata:
  type: project
---

# Idea: prd-doc-traceability

## Problem

The PRD workflow promotes decisions/requirements into the `sections/` truth layer during planning, before (or without) implementation, and the `Status:` field tracks decision lifecycle (confirmed/superseded), not whether code shipped. As a result the truth layer mixes "decided" with "built," and answering "is this real / how does it actually work?" requires re-deriving behavior from code — a doc-reading journey. Contributing symptoms found on 2026-06-18: `gameStateNotes` / `ADDITIONAL GAME STATE` exists only in docs (DEC-043 marked `confirmed`) while reading like a shipped feature; some commit messages described doc-only changes as feature additions; `PRD/README.md`'s "Active work packages" table is stale (dead link to the already-shipped `supplemental-game-rules-retrieval`, wrong statuses).

## Desired Outcome

- A reader (human or agent) can tell, from the truth layer alone, whether a decision/requirement is shipped vs planned, without opening the code.
- A concise living "system map" exists for major subsystems (prompt assembly, the three rule-retrieval systems) describing current behavior and where it lives, so common questions are answered in one read.
- A lightweight promotion guardrail and commit-message convention reduce future drift.
- Immediate drift is reconciled (PRD/README work table, DEC-043 status).

## Non-Goals

- No per-decision → code-line link maintenance burden (explicitly rejected as too tedious).
- No teardown or consolidation of the PRD folder structure; it drives direction well and stays.
- No new tooling required if a documentation convention suffices.

## Open questions

- Where the "system map" lives (a `sections/` file vs a code-adjacent README) and how it stays current.
- Whether implementation-state is a new field on decisions/requirements or a separate index.
- Minimal viable promotion gate that doesn't slow planning.
