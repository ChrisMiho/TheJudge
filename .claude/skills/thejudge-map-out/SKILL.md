---
name: thejudge-map-out
description: >-
  Creates GAMEPLAN.md and lettered slice docs in PRD/work/<slug>/ for
  sequential agent implementation, and sets STATUS.active. Use after
  quality-check passes, once the work is ready to be sliced for
  implementation.
---

# TheJudge Map Out

## Goal

Produce an implementation-ready work package with lettered slices.

## Inputs

Work slug.

## Mode

Direct invocation keeps the implementation handoffs below.

When the controlling agent explicitly states that an orchestrator is
controlling — `thejudge-prepare is controlling` or `graph-run is controlling` —
read `PRD/instructions/preparation-contract.md`, require `Quality-check: PASS`
in the package README's `Preparation gate` section, create the same
GAMEPLAN/slice contract, and return control to the named orchestrator for
independent review, fresh verification, and publication. The successful
post-merge handoff remains
`$thejudge-implement-all PRD/work/<slug>/`.

## Reads

1. `PRD/work/<slug>/DESIGN-BRIEF.md`
2. Refined `PRD/sections/` referenced in the brief
3. `PRD/instructions/doc-lifecycle.md`
4. `PRD/instructions/workflow-reference.md` — package status / STATUS.* duties
5. `PRD/instructions/runtime-process-hygiene.md` — Playwright policy and the runtime ownership/cleanup contract
6. This skill's `reference.md` for the slice template and Ship gates block

## Writes

- `PRD/work/<slug>/GAMEPLAN.md` — architecture, data flow, verification checklist
- `PRD/work/<slug>/slice-a-*.md` … `slice-n-*.md`
- `PRD/work/<slug>/slice-<letter>.criteria.json` — one per slice, emitted from that
  slice's `## Acceptance criteria` list. Schema and worked example in `reference.md`.
- Update `PRD/work/<slug>/README.md` — slice table, implementation map, `status: active`
- Empty marker `STATUS.active` (replace any prior STATUS.*); board row under `## active` in `PRD/work/STATUS.md`

## Gates

- One primary objective per slice; explicit dependencies stated in the README table.
- Each slice: Status, Goal, Requirements, Files touched, Tests, Acceptance criteria.
- Each acceptance criterion must be verifiable — a test command or an explicit manual check.
- Every criterion also gets an entry in the slice's `.criteria.json`, with
  `value` initialised `false` and an `evidence` block naming the command pattern
  or the file paths that prove it. Author the block **beside the criterion**, in
  the same pass — it is written once with the criterion, never maintained as a
  second list that drifts.
- A criterion no command can prove is marked `"manual": true`. Its evidence event
  is a dated observation line naming the criterion id, written into the slice's
  evidence log. That proves the check *happened*, not that it passed.
- For any slice with browser-observable risk per `runtime-process-hygiene.md`, encode the exact scenarios, viewports, and observations/measurements to check as acceptance criteria, plus a cleanup-evidence acceptance criterion (browser closed, owned server(s) stopped, ports released, capture output path recorded).
- Default parallel-ready; sequential only with a stated blocker.
- Final slice carries the PRD promotion checklist (execution happens in cleanup) and the Ship gates block from `reference.md`.
- Never write product code from this skill; never persist plans to tool-specific plan folders — `PRD/work/` is the only location.
- In orchestrated mode, do not map without `Quality-check: PASS` in the package
  README and do not publish directly.

## Next step

Orchestrated mode: return the mapped package to `thejudge-prepare` for review,
verification, and publication.

Direct mode: `/thejudge-implement PRD/work/<slug>/ slice <first letter>`
(Claude Code) or `$thejudge-implement PRD/work/<slug>/ slice <first letter>`
(Codex) — substitute the first slice letter from the README slice table, not
assumed `A`.

For one unattended agent completing every slice, use `/thejudge-implement-all PRD/work/<slug>/` (`$thejudge-implement-all` in Codex).
