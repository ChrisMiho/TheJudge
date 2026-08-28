# Phase C plan — retire the decision log

Status: **proposed, awaiting owner approval.** Nothing edited yet. This is the
plan the kickoff asked for; the evidence is `refactor-gameplan.md`,
`sweep-decision-audit/DISPOSITION.md` + `ROLLUP.md`, and the two recon sweeps
summarized below.

Phase C is the one irreversible step. It edits `thejudge-*` skills, so it runs
as an ordinary interactive session, not a graph run. PR to main; owner merges.

---

## The crux: what "delete" means (needs your call)

The gameplan says "delete ~149 decision entries" **and** "update the 21
remaining citations." Those two numbers only reconcile one way.

Recon found **1,522 durable citation sites** pointing at DEC bodies: every
spec's `Backed by:` line, all of `functional-requirements.md` (697 lines),
`system-map.md`, `user-flows.md`, `screen-layout.md`, `integrations-and-data.md`,
and more. If deleting a decision meant its ID stopped resolving, all 1,522 would
dangle — not 21.

They reconcile because the **router index resolves every DEC-ID**. The router
preamble already says so: *"Cross-references to a DEC-ID elsewhere in the PRD …
resolve them the same way, via this index."* So the design the gameplan's "21"
figure implies is:

- **Delete the decision _bodies_** (the `### DEC-xxx … Notes:` blocks in
  `sections/decisions/<domain>.md`).
- **Keep the router index** (`sections/decisions.md`), demoted from precedence #1
  to #2, preamble rewritten so it is a historical ID-resolver, not read-first.
- Every DEC-ID still resolves — to its one-line router summary plus "current
  truth lives in the feature spec." The 1,522 content citations keep working
  and are **not edited**.
- Only the **21 tooling/process citations** (skills + instruction files that
  assert the old precedence or the write-a-DEC step) get reworded.

This satisfies both hard guardrails at once: no ID is renumbered, and every ID
stays resolvable (constraints #2 and #3).

**Recommendation:** delete bodies, keep the demoted router. The alternative —
also stripping the index — would break 1,522 references and violate "IDs
survive." I do not recommend it.

**Open sub-question for you:** the two Lambda survivors (DEC-084, DEC-169) keep
full bodies. Everything else loses its body. Confirm the mechanic above and I
build to it.

---

## The deletion set (from the Phase B audit)

156 confirmed decisions audited. **2 survive, 154 lose their body.**

| Bucket | Count | Action |
| --- | --- | --- |
| `absorbed` | 122 | delete body |
| `partial` → fix-spec (applied PR #125) | 15 | delete body |
| `not-absorbed`/`partial` → fix-doc (applied PR #125) | 12 | delete body |
| out-of-scope, Cursor (DEC-115, DEC-165) | 2 | delete body |
| obsolete (DEC-067, DEC-121, DEC-089) | 3 | delete body |
| out-of-scope, Lambda (DEC-084, DEC-169) | 2 | **KEEP body** |

154 deleted + 2 kept = 156. The kept two are kept because their content is not
captured anywhere durable yet; deleting would lose it.

---

## Five edit fronts

### Front 1 — flip precedence (7 specs + the router)

Each of the 7 specs carries the identical 3-line status header (lines 3–5):

> Status: draft, derived, non-authoritative view. On any conflict, the cited
> `DEC`/`REQ`/`FLOW` wins — `PRD/sections/decisions.md` stays precedence #1 and
> Read-First #1. Correct this file against those sources, not the other way
> around.

Flip all 7 to: the spec is current-state truth (precedence #1 for what the
feature does today); the decision router drops to #2 as a historical ID
resolver. Keep the `Backed by:` lines verbatim.

Router preamble (`sections/decisions.md` lines 1–27) rewrites to: precedence #2,
not read-first; most bodies retired into the feature specs; the index resolves a
DEC-ID to its one-liner; two deploy decisions still carry bodies.

### Front 2 — delete the 154 bodies

In `sections/decisions/<domain>.md`: remove the `### DEC-xxx … Notes:` block for
each of the 154. Keep DEC-084 and DEC-169 in `deployment.md`. Domain files that
end up empty are deleted; `deployment.md` survives. **Router index rows stay**
(all 169) so every ID resolves.

### Front 3 — rewrite the decision-writing step (skills + instructions)

The gameplan says "5 skills." The write-a-DEC _rule_ actually lives in both
layers; rewriting one without the other leaves the corpus telling agents to
write decisions that no longer exist. Both get the same change — going forward,
current-state truth is edited **in place in the feature spec** (and the relevant
REQ), never recorded as a new DEC.

Skills:
- `thejudge-refinement/SKILL.md` — the "Writes" DEC-authoring step (:66), the
  stable-ID line (:85), the read-first-router line (:86, :37).
- `thejudge-cleanup/SKILL.md` — the promote-new-decisions step (:52).
- `thejudge-map-out` + `requirement-format.md:82` — the slice ship-gate that
  encodes "update the decision body + router line."
- `thejudge-quality-check/SKILL.md` — reads the router as priority #1 (:36, :42);
  reframe to specs-first.
- `thejudge-amend/SKILL.md` — already the negative boundary ("never write a new
  DEC"); confirm it still reads right post-retire.

Instruction files carrying the same rule:
- `requirement-format.md:51-61` — **the Decision Template.** Replace it. Going
  forward there is no new-DEC shape; product truth is the spec/REQ edited in place.
- `doc-lifecycle.md:45-51` — the Decision lifecycle section (new-DEC landing,
  tombstone-trim, nine-topic-files). Rewrite for the retired model.
- `agent-working-rules.md` — read-order #1 (:7-11, :20, :48), promote-decision
  rules (:39, :52).
- `writing-rules.md` (:14, :43), `technical-design-rules.md` (:59) — restate the
  write-a-DEC-first rule; retarget to specs.

### Front 4 — point the define gate at REQ IDs

The `define` gate (`graph-gate-review`, `graph-workflow-contract.md`) is already
ID-agnostic: it walks any stable ID in the `PRD/sections/` diff. Post-retire,
refinement writes REQ/FLOW/spec changes, not new DECs — so the diff naturally
contains REQ IDs. The edits are framing only: the `DEC-166` example in the gate
verdict table (`graph-gate-review/SKILL.md:89`) becomes a REQ example, and any
prose that implies a decision is the reviewed unit points at REQ IDs.

### Front 5 — update the 21 tooling citations

9 skill-file citations + 12 instruction-file citations (8 in
`technical-design-rules.md`). These are the process-layer references to DEC IDs
and the old precedence — reworded, not the 1,522 content citations. Most overlap
Fronts 3–4; this front is the sweep that catches the rest.

---

## Closeout

Per the kickoff: once the verdicts are consumed, close out
`PRD/work/sweep-decision-audit/` — write a receipt under
`PRD/instructions/receipts/`, then delete the folder. Update
`PRD/work/adhoc/PROGRESS.md` (Phase C ✅). Both land in this PR.

---

## Shape of the work

**One PR to main, several commits** — Phase C is atomic (the precedence flip and
the body deletion must land together or the corpus is briefly inconsistent).
Commit order for reviewable stages:

1. Router preamble + 7 spec headers (the precedence flip).
2. Delete the 154 bodies.
3. Rewrite the template + the decision-writing step across skills + instructions.
4. Define-gate reframe + the 21 tooling citations.
5. Receipt + delete `sweep-decision-audit/` + PROGRESS.md.

Verification before the PR: grep that every deleted DEC-ID still resolves in the
router index; grep that no skill/instruction still tells an agent to author a new
DEC; grep that no spec header still says "non-authoritative / precedence #1 to
decisions.md"; confirm DEC-084/DEC-169 bodies intact.

## Guardrails honored
- No ID renumbered; every ID stays resolvable via the kept router index.
- Measured bounds + rejected-alternatives fields already live in the specs
  (Phase A/B) — Phase C touches neither.
- PR to main; owner merges. No push.
