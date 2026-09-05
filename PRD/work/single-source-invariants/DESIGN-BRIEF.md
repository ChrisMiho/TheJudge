# Design brief: single-source the cross-cutting product-truth invariants

## What this is (plain terms)

A few product rules are copied word-for-word across many docs instead of living
in one place. "The core product has one main endpoint", "local dev defaults to
the mock provider", "TheJudge is an assistant, not a rules engine" — each is
restated in 5–15 files. When the rule changes you must find and edit every copy,
and it is easy to miss one. That is exactly what bit the image-first-cards run:
a gate listed the one-endpoint rule's homes from memory, cited a **retired**
decision (DEC-010) as if it were the live rule, and missed two live copies
(REQ-012, NFR-004).

This work gives each such rule **one canonical home** that carries the full rule
text plus an explicit list of everywhere it is echoed; every other mention keeps
its short context-line but points at the home instead of carrying an independent
copy that can drift. It adds a **grep-before-amend** process rule so refinement
and gate-authoring enumerate a rule's homes by grep, never from memory. And it
fixes one concrete contradiction the audit surfaced: the root `README.md` still
tells agents to author new `DEC-###` bodies, which every other authority says is
retired.

## Scope boundary (read this first)

**In scope — cross-cutting *invariant assertions*.** A rule stated *as a rule*
("the product uses one main endpoint") in 3+ files. Four invariants qualify,
plus one contradiction and one process guardrail.

**Out of scope — per-feature scope clauses.** Dozens of feature requirements say
things like "frontend-only; no change to ... any product-facing endpoint". These
*reference* an invariant but are not restatements of the rule — they are one
feature's promise about its own blast radius. They are left untouched. The idea
bounds this explicitly ("single-feature requirements are out of scope"), and
DEC-168's feature-spec consolidation already governs them.

The test for "is this a mention to fold": does the line assert the rule itself,
or does it promise that one feature does not violate it? Only the first is in
scope.

**Scope test — a retired-DEC citation does not move a line out of scope (the
CLASS A rule, adopted loop 4).** Classify by what the line *does*, never by which
DEC it cites. A line that *states* an invariant as a standing fact — e.g. "the
single product-facing `POST /api/ask-ai` endpoint" — is in scope and repoints to
the canonical home **even when it cites retired DEC-010** (or DEC-013 / DEC-002).
Do **not** file such a line as an out-of-scope "traceability citation" merely
because a retired DEC-ID appears in it. A retired-DEC citation lands out of scope
only when the line itself is (a) a bare Backed-by / traceability reference that
does not state the rule (`system-map.md` "Backed by:" lists, the NFR-004 backing
list, a trailing `(DEC-020, DEC-010)` parenthetical), or (b) a per-feature
closed-door clause that cites the invariant to bound one feature's blast radius
(`user-feedback/README.md:123`). This is the defect that stranded
`in-depth/README.md:278` across three prior loops: it states the endpoint rule,
is structurally identical to the already-repointed `quick-lookup/README.md:158`,
yet was filed as out-of-scope traceability because it cited DEC-010.

## The four invariants and their grep-derived amendment sets

Enumerated by grep across `PRD/` and `README.md` (excluding `receipts/`,
`ideasForLater/`, `work/`), per the grep-before-amend rule this work introduces.
Commands: `grep -rniE` on the pattern families below. These lists are the
amendment sets — the exact homes each invariant edit must touch.

**Loop-4 full re-reconciliation (2026-09-04, `graph-20260904-201403`).** All four
families were re-grepped one more time against the live corpus and reconciled
hit-by-hit — the endpoint family by the broad endpoint pattern *and* a dedicated
`grep -rniE 'DEC-010'`; the mock-first and rules-engine families by their pattern
sets; the decision-log family by `decisions.md|decision log|start with .*router|
read-first`. Result: exactly two previously-unlisted live homes, both stragglers
of the two recurring classes this loop targets — `in-depth/README.md:278`
(CLASS A: an endpoint-rule assertion filed out because it cites DEC-010) and root
`README.md:17` (CLASS B: a second decision-log "start here" contradiction beside
`:163`). No third class surfaced: the mock-first amendment set (canonical
`integrations-and-data.md:16` + 10 pointers) and the rules-engine amendment set
(canonical `goals-and-non-goals.md:85` + ~20 pointers) both matched their fresh
grep with no new rule-stating home, and no mock-first / rules-engine line cites a
retired DEC as the live rule outside the pointers already in scope.

### A. One main product-facing endpoint

Recommended canonical home: **`non-functional-requirements.md` NFR-004**
("Lightweight architecture") — the enforceable architecture constraint; it
already names the sole carve-out (`GET /api/cards/:oracleId`, REQ-175).

Assertions (rule-as-rule) — the amendment set (re-derived by `grep -rniE` 2026-09-04):
- `non-functional-requirements.md:35` (NFR-004 constraint) — **canonical**
- `functional-requirements.md:175` (REQ-012 constraint)
- `functional-requirements.md:1677` (REQ-072 constraint) — "`POST /api/ask-ai` stays the one
  answer endpoint"; cites **DEC-010** (retired), repoint to NFR-004
- `functional-requirements.md:2195` (REQ-094 constraint, "second product-facing endpoint")
- `functional-requirements.md:4020` (REQ-175 Description) and `:4031` (REQ-175 Constraints) —
  the second-product-facing-endpoint carve-out and its amendment set
- `goals-and-non-goals.md:39` (Shipped capabilities) and `:75` (Explicit Non-Goals)
- `overview.md:56` (Key Constraints)
- `PRD/README.md:145` (Implementation Snapshot) — asserts "a single product-facing backend route"; repoint to NFR-004
- `technical-design-rules.md:12` (Allowed) and `:36` (Forbidden)
- `quick-lookup/README.md:158` — cites **DEC-010** (retired) as the live rule; repoint
- `in-depth/README.md:278` — "the single product-facing `POST /api/ask-ai` endpoint (DEC-010)";
  **states the rule** as a standing architectural fact, structurally identical to
  `quick-lookup/README.md:158`; cites **DEC-010** (retired), repoint to NFR-004. Reclassified
  from out-of-scope traceability to in-scope loop 4 (CLASS A rule above)
- `integrations-and-data.md:151,246` — already point to the amendment set (D5 authorization
  for the REQ-175 carve-out); repoint the reference to NFR-004
- `decisions.md:51` (DEC-010, already `retired`) — left as the demoted index row; not a live home
- Out of scope — DEC-010 hits that do *not* state the rule (per the CLASS A scope test above):
  bare traceability / Backed-by references — `system-map.md:125,132,153` (Backed-by lists),
  `non-functional-requirements.md:99` (NFR-004 backing list), `in-depth/README.md:10` (Backed-by
  list), `in-depth/README.md:281` (trailing `(DEC-020, DEC-010)` parenthetical); and one
  per-feature closed-door clause citing the invariant — `user-feedback/README.md:123` ("the
  product is backend-minimal (one product endpoint, DEC-010 ...) so a third-party form backend
  was chosen precisely to avoid a new route" — the feedback feature's own blast-radius promise,
  DEC-168 governs it)

Correction note (grep-from-memory defects fixed this pass): the prior set (a) attributed the
`:4020,:4031` lines to `integrations-and-data.md` (only 444 lines) — they are REQ-175 in
`functional-requirements.md`; (b) labeled `:2195` as REQ-072 — it is REQ-094; (c) omitted the
real REQ-072 endpoint home at `:1677` (which cites retired DEC-010). Same class of defect this
feature exists to eliminate. Loop-3 comprehensive re-grep added `PRD/README.md:145` (the
Implementation-Snapshot "single product-facing backend route" assertion, previously unlisted —
the same straggler pattern surfacing in a family that had passed prior re-checks). Loop-4
`grep -rniE 'DEC-010'` reclassified `in-depth/README.md:278` from out-of-scope traceability to
in-scope: it states the endpoint rule and is structurally identical to the already-repointed
`quick-lookup/README.md:158`, but was filed out because it cites DEC-010 — the classification
defect the CLASS A scope test now forbids. No further rule-stating DEC-010 home exists (full
DEC-010 hit-by-hit classification recorded in `GATE-QUESTIONS.md`, INV-ENDPOINT).

Out of scope (per-feature scope clauses referencing the rule): the ~25
"no change to ... any product-facing endpoint" lines in `functional-requirements.md`
and the feature-spec READMEs (`shared-chrome`, `trade-balancer`, `scan/data/*`,
`user-feedback`).

### B. Mock-first local default

Recommended canonical home: **`integrations-and-data.md:16`** (the AI-provider
boundary spec) — the precise technical authority for provider behavior
(`ASK_AI_PROVIDER=mock` default, `openai` live).

Assertions — the amendment set:
- `integrations-and-data.md:16` — **canonical**
- `overview.md:31,59` (Current Product Status; Key Constraints)
- `goals-and-non-goals.md:38` ("mock-first integration path")
- `technical-design-rules.md:15,16` (Allowed Design Direction)
- `in-depth/README.md:46,370`, `quick-lookup/README.md:29,279` (feature-summary + Provider-boundary restatements)
- `PRD/README.md:137,140` (navigation + Current-Editorial-Notes restatements)
- root `README.md:16,115` (onboarding restatement)

Correction note (loop-3 comprehensive re-grep): added `in-depth/README.md:370`,
`quick-lookup/README.md:279` (the Provider-boundary "Built" mock-default restatements, distinct
from the feature-summary lines :46/:29) and `PRD/README.md:140` (the Current-Editorial-Notes
"Default local provider mode is mock" line, distinct from the :137 status note). The mock-first
family was not re-grepped in loop 2; all three were confirmed by direct file read.

### C. No deterministic rules engine (assistant, not judge)

Recommended canonical home: **`goals-and-non-goals.md` Scope Notes (line 85)** —
already the fullest framing, carrying the DEC-094 assistant-suite identity.

Assertions — the amendment set (re-derived by `grep -rniE` 2026-09-04):
- `goals-and-non-goals.md:85` (Scope Notes) — **canonical**; also `:50,:65,:66` (constraint/non-goal lines)
- `overview.md:23,24` (Product Positioning "This product is not:") and `:39` (Current Product Status)
- `problem-statement.md:31,32`
- `technical-design-rules.md:32-35` (Forbidden Design Drift block)
- `agent-working-rules.md:41,44`
- `integrations-and-data.md:370-373` (backend must-not-add list, incl. board-state simulation logic)
- `functional-requirements.md:2195` (REQ-094 constraint — the dual endpoint/rules-engine line),
  `:1863` (REQ-081) and `:1918` (REQ-083) (feature restatements citing DEC-013)
- `in-depth/README.md:49-50`, `quick-lookup/README.md:34` (Quick Lookup identity line, "not a
  full rules browser or a judge authority"), `user-flows.md:268` (Quick-Lookup note,
  DEC-002/DEC-013) and `:302` (life-tracker note, DEC-013), `system-map/prompt-assembly.md:92`,
  `system-map/game-rules-retrieval.md:46,89`, `life-tracker/README.md:44`
- root `README.md:3`
- `decisions.md:42,43,54` (DEC-001, DEC-002, DEC-013 — retired index rows; left as-is)
- Out of scope — per-feature scope clauses referencing the rule: `functional-requirements.md:238,252`
  (prompt-context caveats), `:1735` (lookup enrichment), `:1820` (REQ-079 topic list), `:2218`
  (combo prompt data); `decisions.md:142` (DEC-101 index row)

Correction note (this pass): added `user-flows.md:268` (the Quick-Lookup "not a Comprehensive
Rules browser / not judge authority" note, five lines from the already-listed `:302`), plus
grep-recovered homes the prior memory-listed set missed — `integrations-and-data.md:370-373`,
`agent-working-rules.md:44`, `problem-statement.md:32`, `game-rules-retrieval.md:89`,
`goals-and-non-goals.md:66`, `overview.md:24`, and the DEC-002 index row. Also fixed the `:2195`
mislabel (REQ-094, not REQ-072) and labeled `:1863`/`:1918` (REQ-081/REQ-083). Loop-3
comprehensive re-grep added `quick-lookup/README.md:34` — the same "not a full rules browser or
a judge authority" identity assertion already captured for `in-depth/README.md:49-50` and
`life-tracker/README.md:44`.

### D. Decision-log-retired (and the root-README contradiction)

Canonical home already exists: **`doc-lifecycle.md` "Decision lifecycle (retired)"**
(lines 45–51). The rule is single-sourced there and echoed correctly by
`requirement-format.md`, `agent-working-rules.md`, `writing-rules.md`,
`PRD/README.md`, and `graph-workflow-contract.md`.

The **contradictions** — two lines in the root `README.md` still treat the
retired log as live, and an agent that onboards from the root README first would
follow both:
- `:163` still says *"record new DEC bodies in the relevant
  `PRD/sections/decisions/<domain>.md` file and keep the router index current."* —
  authoring retired-log entries.
- `:17` still says *"Product source of truth: `PRD/sections/` (start with the
  `decisions.md` router)"* — sends the reader to *start* at the log, the
  "read-first" role the corpus removed (`doc-lifecycle.md:48` and
  `agent-working-rules.md:15`: "demoted historical index ... no longer
  read-first"). Folded in loop 4 (CLASS B). Structurally the read-first twin of
  the `:163` write contradiction.

Fix: rewrite both lines to match, pointing at the feature specs as read-first #1
and at `doc-lifecycle.md` as the decision-lifecycle home. (Root
`README.md:16,136,137` merely *resolve* cited DEC-IDs via the index — that is
allowed and stays.)

## The guardrail: grep-before-amend

New durable rule in **`writing-rules.md`** (process authority for how docs are
written), cross-referenced from **`requirement-format.md`**. Substance:

- A **cross-cutting invariant** is a product rule asserted as a rule in 3+ files.
- Before writing or amending one, enumerate its full amendment set by `grep`
  across `PRD/` and `README.md` — never from memory.
- Each invariant's **canonical home carries the amendment-set list** (an explicit
  "echoed in / enforced at" list). Amending the rule means editing the home and
  re-grepping to refresh that list, so drifted pointers are caught.
- The distinction between an invariant *assertion* and a per-feature *scope
  clause* (above) governs what the set includes.

The refinement and gate-authoring **skills** reference this rule. Editing skill
files is outside a graph run's write scope (the `thejudge-*` trees are
protected), so build wires the reference only if it lands in a non-skill
instruction file; otherwise the skill-side pointer is a follow-up noted here, not
a blocker. The durable product-truth home is the instruction file.

## Design decisions (canonical-home model)

- **"Links to it", not "delete it".** Every echo keeps its context-appropriate
  one-line phrasing (a goal line reads as a goal, a design constraint as a
  constraint) but references the canonical ID instead of carrying independent
  substance. This matches the idea's "every other mention links to it" and
  preserves each file's reader-job.
- **Enforceable requirements stay enforceable.** REQ-012 / REQ-072 / NFR-004 keep
  their constraints; only the *rule text* is single-sourced. The constraint now
  reads "one main product-facing endpoint (canonical: NFR-004)" rather than a
  divergent independent copy.
- **IDs are preserved, none minted.** No new `REQ`/`FLOW`/`NFR`/`DEC`. The lever
  is de-duplication, not an ID-system change (idea non-goal). The retired DEC
  index rows (DEC-010, DEC-001, DEC-013) stay as resolvable history.

## Material assumptions (graph is controlling; conservative ladder applied)

Recorded per `preparation-contract.md`. None meets the genuine-decision-blocker
test — every choice changes doc structure only, not product behavior, a code
contract, data handling, or security; all are reversible. Each is offered to the
owner as an accept/edit/reject slot so the choice of home can be overridden.

1. **Canonical home per invariant** (A→NFR-004, B→integrations-and-data.md,
   C→goals-and-non-goals Scope Notes, D-home→doc-lifecycle.md). Basis: assumption
   ladder #1/#3 — prefer the existing structure where the rule is most naturally
   authoritative and enforceable. Alternative homes (goals-and-non-goals for A;
   overview for B) are the natural edit-slot overrides.
2. **Scope boundary** = invariant assertions only; per-feature scope clauses out.
   Basis: the idea's own "single-feature requirements are out of scope" + the
   3+-places bound + DEC-168 already owning per-feature truth.
3. **Guardrail home** = `writing-rules.md` + `requirement-format.md` cross-ref;
   skill wiring out of graph-write scope. Basis: assumption ladder #1 — product
   process truth lives in instruction files; skills are protected.
4. **Canonical home carries the amendment-set list.** Basis: this is the direct
   structural fix for the D5 near-miss (a memory-listed set went stale); it makes
   grep-before-amend self-maintaining.

## Non-goals

- Not a rewrite of how product truth is represented; the REQ/DEC/NFR ID system
  stays (it is what let grep recover the homes here).
- Not touching per-feature scope clauses.
- Not deleting or renumbering retired DEC index rows.
- Not a code change — this is documentation/product-truth only.

## References

- Invariant homes: `non-functional-requirements.md` (NFR-004),
  `functional-requirements.md` (REQ-012, REQ-072), `goals-and-non-goals.md`,
  `overview.md`, `integrations-and-data.md`, `problem-statement.md`,
  `technical-design-rules.md`, `agent-working-rules.md`, `doc-lifecycle.md`,
  `writing-rules.md`, `requirement-format.md`, feature specs, root `README.md`.
- Origin evidence: `receipts/image-first-cards-2026-09-05.md` (D5 near-miss);
  method precedent: `receipts/codebase-duplication-audit-2026-08-23.md`.
- Proposed durable-truth edits: `GATE-QUESTIONS.md` (one block per invariant).
</content>
</invoke>
