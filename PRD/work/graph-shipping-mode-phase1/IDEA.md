# graph-shipping-mode-phase1

## Problem
The automated lifecycle carried forward a quirk of the old manual flow: refinement
mutates durable product truth (`PRD/sections/`) up front, during spec-forming.
That's the piece that fights everything else — it makes spec-forming touch shared
files (so parallel formers collide), and it puts product truth into main before
the code that backs it exists. Symptom seen 2026-09-01: the overnight loop parked
after one target and every later fresh run hit the base→main guard; the deeper
cause is *where the writing happens*, not the guard.

## Outcome — move the writing: propose / apply / close
Rework the shared lifecycle's division of labour so durable mutation happens once,
in implementation, together with the code:

1. **Refinement = propose.** Writes only inside `PRD/work/<slug>/`: the design
   brief, the *proposed* `PRD/sections/` changes captured as markdown/diff in the
   work folder, and the gate questions. Never mutates durable `PRD/sections/` or
   code. Its job becomes documenting the change, not making it.
2. **Implement = apply.** Takes the approved proposal and writes the real updates
   — the durable `PRD/sections/` edits **and** the code, together, in one PR.
   Applies **by intent** against current truth (re-derives the edit from the
   brief), not by replaying a possibly-stale frozen diff.
3. **Cleanup = close.** Already promotes at close; reconcile so promotion happens
   once (in apply/close), then delete the work folder.

The `define` gate then reads the *proposal* (already the full diff embedded in
`GATE-QUESTIONS.md`), not a live-applied diff. An empty proposal (no product
truth) means no gate.

## Why this is the foundation
- Kills the spec-ahead-of-code window: durable truth and code land together.
- Makes parallel spec-forming conflict-free: each former writes only its own work
  folder. This is the prerequisite for [[graph-shipping-mode-phase2]].
- Makes the base→main guard and auto-bridge mostly moot — retire/shrink rather
  than engineer them.

## Non-goals
- No concurrency or background loop yet — that is Phase 2. This is correct even
  single-threaded.
- `land` (merge to main) stays a human merge.
- No product/app (`PRD/sections/`) truth changes here: this is an agent-workflow
  rework of the `thejudge-*` lifecycle skills, `graph-workflow-contract.md`, and
  the graph scripts/tests.

## Scope note
This changes the SHARED lifecycle skills (refinement, implement, cleanup), so it
reworks both the manual thejudge flow and the automated graph flow — consistently.
Divergent behaviour between the two modes would be worse than the larger change.
