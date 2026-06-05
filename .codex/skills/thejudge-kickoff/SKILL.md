---
name: thejudge-kickoff
description: >-
  Loads minimal onboarding context for TheJudge (README + PRD control plane).
  Optionally captures a new idea in PRD/work/<slug>/IDEA.md. Use when starting
  a new session or beginning work on a new feature.
disable-model-invocation: true
---

# TheJudge Kickoff

## Goal

Orient the agent without pre-loading the full PRD. Optionally seed a new work package when the user describes an idea.

## Required reads

1. `README.md` — stack, layout, quality gates, current product status
2. `PRD/README.md` — control plane, precedence, navigation

Do not read other PRD files unless the user provides paths in the same message.

## New idea capture (when user describes one)

1. Propose a kebab-case slug (e.g. `card-wotc-rule-enrichment`).
2. Create `PRD/work/<slug>/IDEA.md` — 3–5 sentences: problem, outcome, non-goals.
3. Create `PRD/work/<slug>/README.md` with `status: ideation` at top.
4. Confirm slug and paths in your response.

If the user only wants orientation, skip writes.

## Response format

Short paragraph (2–3 sentences):

1. Product in one phrase (flow-validation MTG assistant)
2. Current baseline from README + PRD/README (core product, not MVP framing)
3. Ready for next task — or confirm idea captured at `PRD/work/<slug>/`

## Do not

- Pre-load `sections/` or instructions
- Summarize full PRD during kickoff
- Route to other skills (user picks manually)
- Write code

## Reference

PRD quick map: [reference.md](reference.md)
