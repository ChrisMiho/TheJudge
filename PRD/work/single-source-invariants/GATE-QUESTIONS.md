# Gate questions — single-source-invariants

Each block below is one decision. Answer each `- Verdict:` with `accept`,
`edit`, or `reject`; give a `- Reason:` for edit or reject. No new
`REQ`/`FLOW`/`NFR`/`DEC` IDs are minted — existing IDs are preserved; retired
decision-index rows (DEC-010, DEC-001, DEC-013) are left as resolvable history.

The proposals share one model: each invariant gets **one canonical home** that
carries the full rule text plus an explicit "echoed in" list (its amendment set);
every other mention keeps its short context-line but points at the home instead
of carrying an independent copy that can drift. This is documentation only — no
code changes, no behavior changes.

---

## INV-ENDPOINT — the "one main endpoint" rule gets one home, others point to it

**What this decides:** whether the rule "the core product exposes one main
product-facing endpoint" lives as one full statement (in NFR-004, the
lightweight-architecture requirement) that every other doc points to, instead of
being copied word-for-word in seven places where one copy already went stale.

**In plain terms:** the product deliberately keeps a small backend — one main
endpoint (`POST /api/ask-ai`, the answer endpoint), plus a single read-only
carve-out that serves one card's detail block (`GET /api/cards/:oracleId`,
added as REQ-175). Today that rule is restated in NFR-004 (the "smallest
reasonable architecture" requirement), REQ-012, REQ-072, REQ-094, REQ-175, the
goals doc, the overview, the agent design-rules doc, and Quick Lookup's spec — a
dozen homes across five files, and both the Quick Lookup copy and REQ-072 cite
DEC-010, a **retired** decision, as if it were the live rule.
Independent copies are exactly what let the image-first-cards gate miss two of
them. This makes NFR-004 the single home carrying the full rule, the carve-out,
and a list of every place it is echoed; every other mention keeps its own short
line but says "canonical: NFR-004" instead of re-stating the rule. The
requirements (REQ-012, REQ-072, NFR-004) still enforce the rule — only the
duplicated wording collapses.

**What happens if you say no:** the rule stays copied across a dozen homes, the
Quick Lookup and REQ-072 pointers keep citing a retired decision as the live
rule, and the next amendment can miss a home the same way the D5 gate did.

### Proposed diff

**Canonical home — `non-functional-requirements.md`, NFR-004 constraints:**

```diff
 ### NFR-004
 - Title: Lightweight architecture
 - Description: The core product should use the smallest reasonable architecture.
 - Constraints:
-  - one main product-facing backend endpoint, plus the read-only card-detail retrieval route (REQ-175)
+  - **Canonical rule — one main product-facing endpoint.** The core product
+    exposes exactly one main product-facing backend endpoint (the answer
+    endpoint `POST /api/ask-ai`), plus the single read-only card-detail
+    retrieval route (`GET /api/cards/:oracleId`, REQ-175). Adding any further
+    product-facing endpoint requires amending this constraint. This is the
+    single authoritative statement of the one-endpoint rule; the homes below
+    echo it and must be updated together (enumerate by grep before amending —
+    see `instructions/writing-rules.md`, grep-before-amend):
+    REQ-012, REQ-072, REQ-094, REQ-175, `goals-and-non-goals.md`, `overview.md`,
+    `instructions/technical-design-rules.md`, `quick-lookup/README.md`,
+    `in-depth/README.md`, `integrations-and-data.md`, `PRD/README.md`.
+    Retired index row: DEC-010.
   - no microservices
   - no runtime metadata sync tooling
```

**Pointer edits — each keeps its context, references the canonical home:**

```diff
# functional-requirements.md  (REQ-012 Constraints, ~line 175)
-  - one main product-facing endpoint in the core product, plus the read-only card-detail retrieval route (`GET /api/cards/:oracleId`, REQ-175)
+  - one main product-facing endpoint in the core product, plus the read-only card-detail retrieval route (`GET /api/cards/:oracleId`, REQ-175) — canonical rule: NFR-004

# functional-requirements.md  (REQ-072 Constraints, ~line 1677) — repoints a retired-DEC citation
-  - `POST /api/ask-ai` stays the one answer endpoint (DEC-010); a separate read-only card-detail retrieval route (`GET /api/cards/:oracleId`, REQ-175) is permitted alongside it
+  - `POST /api/ask-ai` stays the one answer endpoint (canonical rule: NFR-004); a separate read-only card-detail retrieval route (`GET /api/cards/:oracleId`, REQ-175) is permitted alongside it

# functional-requirements.md  (REQ-094 Constraints, ~line 2195)
-  - do not introduce legality validation, rules simulation, hidden-state assumptions, or a second product-facing endpoint
+  - do not introduce legality validation, rules simulation, hidden-state assumptions, or a second product-facing endpoint (one-endpoint rule canonical: NFR-004; rules-engine rule canonical: `goals-and-non-goals.md` Scope Notes)

# functional-requirements.md  (REQ-175 Description, ~line 4020, and Constraints, ~line 4031)
#   both restate the second-product-facing-endpoint carve-out and enumerate its amendment set
#   (REQ-012, REQ-072, NFR-004, goals-and-non-goals, technical-design-rules). Keep the carve-out
#   text; replace the frozen enumerated amendment list with "the one-endpoint rule (canonical:
#   NFR-004)" so the pointer tracks the home, not a list that can drift.

# goals-and-non-goals.md:39  (Shipped capabilities)
-- one main backend endpoint, plus the read-only card-detail retrieval route (`GET /api/cards/:oracleId`, REQ-175)
+- one main backend endpoint, plus the read-only card-detail retrieval route (`GET /api/cards/:oracleId`, REQ-175) — canonical: NFR-004

# goals-and-non-goals.md:75  (Explicit Non-Goals)
-- arbitrary/expanding product-facing endpoints beyond the answer endpoint and the single read-only card-detail retrieval route (REQ-175)
+- arbitrary/expanding product-facing endpoints beyond the answer endpoint and the single read-only card-detail retrieval route (REQ-175; canonical rule: NFR-004)

# overview.md:56  (Key Constraints)
-- single main backend endpoint
+- single main backend endpoint (canonical rule: NFR-004)

# PRD/README.md:145  (Implementation Snapshot)
-- Runtime code is split across `apps/frontend` and `apps/backend`, with a single product-facing backend route (`POST /api/ask-ai`) plus health endpoint.
+- Runtime code is split across `apps/frontend` and `apps/backend`, with a single product-facing backend route (`POST /api/ask-ai`) plus health endpoint (canonical rule: NFR-004).

# technical-design-rules.md:12  (Allowed Design Direction)
-- one main backend endpoint, plus the read-only card-detail retrieval route (`GET /api/cards/:oracleId`, REQ-175)
+- one main backend endpoint, plus the read-only card-detail retrieval route (`GET /api/cards/:oracleId`, REQ-175) — canonical rule: NFR-004

# technical-design-rules.md:36  (Forbidden Design Drift)
-- product-facing endpoints beyond the answer endpoint and the one read-only card-detail retrieval route (REQ-175)
+- product-facing endpoints beyond the answer endpoint and the one read-only card-detail retrieval route (REQ-175; canonical rule: NFR-004)

# quick-lookup/README.md:158  (repoints a retired-DEC citation to the live rule)
-`POST /api/ask-ai` endpoint (DEC-010's single product-facing endpoint); success
+`POST /api/ask-ai` endpoint (the single product-facing endpoint; canonical rule: NFR-004); success

# in-depth/README.md:277-278  (repoints a retired-DEC citation to the live rule) — states the
#   endpoint rule as a standing architectural fact ("the single product-facing POST /api/ask-ai
#   endpoint"), structurally identical to quick-lookup/README.md:158; in-scope, not traceability
-path below is the `mode: "game"` branch of the single product-facing
-`POST /api/ask-ai` endpoint (DEC-010); success `{ answer }` and error shapes are
+path below is the `mode: "game"` branch of the single product-facing
+`POST /api/ask-ai` endpoint (canonical rule: NFR-004); success `{ answer }` and error shapes are

# integrations-and-data.md:151,246
#   these already list the amendment set that authorized the REQ-175 carve-out (D5);
#   replace the enumerated "REQ-012 / REQ-072 / NFR-004 / goals-and-non-goals /
#   technical-design-rules amendments" reference with "the one-endpoint rule
#   (canonical: NFR-004)" so the pointer tracks the home, not a frozen list.
```

**Left unchanged (out of scope):** the ~25 per-feature "no change to ... any
product-facing endpoint" scope clauses in `functional-requirements.md` and the
feature-spec READMEs — those promise one feature's blast radius, they do not
assert the rule. The retired `decisions.md:51` DEC-010 index row stays as-is.

**Full DEC-010 classification (every live-corpus hit, `grep -rniE 'DEC-010'`,
2026-09-04).** The classification rule: a line that *states* the one-endpoint
rule as a standing architectural fact is in-scope and repoints to NFR-004, even
when it cites DEC-010; a line that cites DEC-010 as a bare traceability /
Backed-by reference, or inside a per-feature closed-door rationale, stays out.
- IN (states the rule → repointed above): `functional-requirements.md:1677`
  (REQ-072), `quick-lookup/README.md:158`, `in-depth/README.md:278`.
- OUT — traceability / Backed-by citations (do not state the rule):
  `non-functional-requirements.md:99` (NFR-004 Backed-by list),
  `system-map.md:125,132,153` (Backed-by lists), `in-depth/README.md:10`
  (Backed-by list), `in-depth/README.md:281` (bare `(DEC-020, DEC-010)`
  parenthetical closing a retrieval sentence).
- OUT — per-feature closed-door rationale citing the invariant (not a
  restatement): `user-feedback/README.md:123` ("the product is backend-minimal
  (one product endpoint, DEC-010; no auth/account systems), so a third-party form
  backend ... was chosen precisely to avoid a new route") — a promise about the
  feedback feature's own blast radius, DEC-168 governs it.
- OUT — the demoted index home itself: `decisions.md:51` (retired DEC-010 row).

- Verdict: accept
- Reason:

---

## INV-MOCK-FIRST — the "mock provider by default locally" rule gets one home

**What this decides:** whether "local development defaults to the mock AI
provider, with the live OpenAI provider opt-in" lives as one full statement (in
the integrations doc, the technical authority for the provider boundary) that
the other eight mentions point to.

**In plain terms:** when a developer runs the app locally, the backend answers
with a canned mock instead of calling OpenAI unless they flip
`ASK_AI_PROVIDER=openai`; production runs the live provider. That rule is
currently restated in the overview, goals, agent design-rules, two feature specs,
both READMEs — nine places. This makes the integrations doc's provider-boundary
line the single home (it is the most precise: it names the exact env toggle and
both modes), and turns the others into short pointers.

**What happens if you say no:** the provider default stays copied across nine
files; if the default ever changes, every copy must be found by hand.

### Proposed diff

**Canonical home — `integrations-and-data.md:16`:**

```diff
-- AI Provider: backend provider boundary (`ASK_AI_PROVIDER=mock` default, `ASK_AI_PROVIDER=openai` for live answers)
+- AI Provider: backend provider boundary (`ASK_AI_PROVIDER=mock` default, `ASK_AI_PROVIDER=openai` for live answers). **Canonical rule — mock-first local default:** local development defaults to the mock provider; the live OpenAI provider is opt-in via `ASK_AI_PROVIDER=openai` and is what production runs. This is the single authoritative statement; echoed in `overview.md`, `goals-and-non-goals.md`, `instructions/technical-design-rules.md`, `in-depth/README.md`, `quick-lookup/README.md`, `PRD/README.md`, and root `README.md` (enumerate by grep before amending — see `instructions/writing-rules.md`, grep-before-amend).
```

**Pointer edits (each keeps its context line, adds "canonical: integrations-and-data.md"):**

```diff
# overview.md:59  (Key Constraints)
-- mock-default local provider mode with optional live OpenAI provider mode
+- mock-default local provider mode with optional live OpenAI provider mode (canonical rule: `integrations-and-data.md`)

# overview.md:31  (Current Product Status) — append pointer to the existing sentence
   ... Local development continues to use `ASK_AI_PROVIDER=mock` by default under `DEC-020`.
+  (canonical rule: `integrations-and-data.md`)

# goals-and-non-goals.md:38  (Shipped capabilities)
-- mock-first integration path
+- mock-first integration path (canonical rule: `integrations-and-data.md`)

# technical-design-rules.md:15-16  (Allowed Design Direction) — collapse two lines to one pointer
-- backend provider boundary with explicit `ASK_AI_PROVIDER` selection (`mock` default, `openai` live)
-- mock-first local baseline before enabling live provider mode
+- backend provider boundary with explicit `ASK_AI_PROVIDER` selection, mock-first local baseline before live mode (canonical rule: `integrations-and-data.md`)

# in-depth/README.md:46,370  and  quick-lookup/README.md:29,279
#   each line is a mock-first restatement; keep its existing phrasing ("(mock by default,
#   OpenAI live)" on :46/:29; "mock is the default ... openai is the live path" on the
#   Provider-boundary "Built" restatements :370/:279) and append "canonical:
#   integrations-and-data.md" once per restatement.

# PRD/README.md:137,140  and  root README.md:16
#   onboarding restatements: keep the one-liner, append "(canonical rule: PRD/sections/integrations-and-data.md)".
#   (:137 is the Current-product-status note; :140 is the Current-Editorial-Notes
#   "Default local provider mode is mock" line.)
#   root README.md:115 (the `ASK_AI_PROVIDER` env-var doc) is a setup reference, left as-is.
```

- Verdict: accept
- Reason:

---

## INV-RULES-ENGINE — the "assistant, not a rules engine" rule gets one home

**What this decides:** whether the identity rule "TheJudge is an MTG assistant
that helps players — not an official judge or a deterministic rules engine" lives
as one full statement (the goals doc's Scope Notes) that the other ~20 mentions
point to.

**In plain terms:** the product never simulates the rules, validates legality,
or tracks board state — it assembles context and asks the AI, and it stays an
assistant, not a judge (this is the DEC-094 assistant-suite identity). That rule
is asserted across the overview, problem statement, agent design-rules, agent
working-rules, several feature specs and system-map files, and the root README.
This makes the goals doc's Scope Notes the single home (it already carries the
fullest DEC-094 framing) and points the rest at it.

**What happens if you say no:** the identity rule stays restated across ~20 homes;
the retired DEC-013 / DEC-001 rows keep being cited as the live rule in feature
specs, the same retired-citation pattern that caused the endpoint near-miss.

### Proposed diff

**Canonical home — `goals-and-non-goals.md:85` (Scope Notes):**

```diff
-TheJudge is an **MTG assistant with a suite of features** that help players — not an official judge or a deterministic/gameplay-accurate rules engine. **In-Depth Question** (the staged game-context + Ask AI feature, internally `mtg-assistant`) is the primary feature; Quick Question and other tools sit alongside it (`DEC-094`).
+**Canonical rule — assistant, not a rules engine.** TheJudge is an **MTG assistant with a suite of features** that help players — not an official judge or a deterministic/gameplay-accurate rules engine. It never implements legality validation, deterministic rules simulation, board-state logic, or format enforcement in the core product. **In-Depth Question** (the staged game-context + Ask AI feature, internally `mtg-assistant`) is the primary feature; Quick Question and other tools sit alongside it (`DEC-094`). This is the single authoritative statement of the assistant-not-rules-engine rule; echoed in `overview.md`, `problem-statement.md`, `instructions/technical-design-rules.md`, `instructions/agent-working-rules.md`, `integrations-and-data.md`, REQ-094, REQ-081, REQ-083, `in-depth/README.md`, `quick-lookup/README.md`, `user-flows.md`, `system-map/prompt-assembly.md`, `system-map/game-rules-retrieval.md`, `life-tracker/README.md`, and root `README.md` (enumerate by grep before amending — see `instructions/writing-rules.md`, grep-before-amend). Retired index rows: DEC-001, DEC-002, DEC-013.
```

**Pointer edits (each keeps its context line, references the canonical home):**

```diff
# overview.md:21-24  (Product Positioning "This product is not:")
#   keep the bullet list; append after "- a deterministic rules engine" the note
#   "(canonical rule: `goals-and-non-goals.md` Scope Notes)".
# overview.md:39  (Current Product Status)  "- no full legality validation"  →  append "(canonical rule: goals-and-non-goals.md Scope Notes)"

# problem-statement.md:31
-- grow a suite of player-help features without becoming a rules engine
+- grow a suite of player-help features without becoming a rules engine (canonical rule: `goals-and-non-goals.md` Scope Notes)

# technical-design-rules.md:32-35  (Forbidden Design Drift) — append one pointer to the group
   - deterministic rules engine behavior
   - legality validation
   - board-state simulation
   - full gameplay-rules target/controller/mode simulation for the core product
+  (canonical rule: `PRD/sections/goals-and-non-goals.md` Scope Notes)

# agent-working-rules.md:41
   ... not an official judge or rules engine) unless decisions explicitly expand scope.
+  (canonical rule: `sections/goals-and-non-goals.md` Scope Notes)

# integrations-and-data.md:370-373  (backend "must not add" list) — append one pointer to the group
   - format rules
   - commander-specific validation
   - legality engine logic
   - board-state simulation logic
+  (canonical rule: `goals-and-non-goals.md` Scope Notes)

# feature/system-map restatements — repoint retired-DEC citations to the live home:
#   in-depth/README.md:49, user-flows.md:268 (Quick-Lookup note, DEC-002 / DEC-013),
#   user-flows.md:302 (life-tracker note, DEC-013), system-map/prompt-assembly.md:92,
#   system-map/game-rules-retrieval.md:46 and :89, life-tracker/README.md:44,
#   functional-requirements.md:1863 (REQ-081), :1918 (REQ-083) (DEC-013): keep the line, append or
#   replace the bare DEC citation with "(canonical rule: goals-and-non-goals.md Scope Notes;
#   retired index DEC-002 / DEC-013)".
#   quick-lookup/README.md:34 (Quick Lookup identity line, "not a full rules browser or a
#   judge authority") carries no DEC citation: keep the line and append "(canonical rule:
#   goals-and-non-goals.md Scope Notes)".

# root README.md:3
-TheJudge is an MTG assistant with a suite of features that help players — not an official judge or a deterministic rules engine.
+TheJudge is an MTG assistant with a suite of features that help players — not an official judge or a deterministic rules engine (canonical rule: `PRD/sections/goals-and-non-goals.md` Scope Notes).
```

**Left unchanged (out of scope):** REQ-072's own retrieval constraints already
point via this block; the retired `decisions.md` DEC-001/DEC-013 rows stay.

- Verdict: accept
- Reason:

---

## INV-DECISION-LOG — fix the two root-README lines that still treat the decision log as live

**What this decides:** whether to fix the two lines in the root `README.md` that
still treat the decision log as live product truth — one telling agents to author
new decision-log entries, one telling them to *start* their reading at the
decision-log router — both of which every other authority says is retired.

**In plain terms:** the whole corpus moved to "the decision log is retired — do
not write a new `DEC-###`; record product truth by editing the feature spec in
place, and read those feature specs first" (stated in `doc-lifecycle.md`,
`requirement-format.md`, `agent-working-rules.md`, `writing-rules.md`,
`PRD/README.md`, and the graph-workflow contract). `doc-lifecycle.md:48` and
`agent-working-rules.md:15` say `decisions.md` is "a demoted historical index ...
no longer read-first". But the root `README.md` contradicts both:

- **`:163`** still says *"record new DEC bodies in
  `PRD/sections/decisions/<domain>.md` and keep the router index current"* — tells
  an agent to author retired-log entries.
- **`:17`** still says *"Product source of truth: `PRD/sections/` (start with the
  `decisions.md` router)"* — tells an agent to *begin* at the retired log, the
  exact "read-first" role the corpus removed.

An agent that reads the root README first — the intended onboarding entry — would
follow both. This rewrites both lines to match, pointing at the feature specs as
read-first #1 and at `doc-lifecycle.md` as the single home for the
decision-lifecycle rule.

**What happens if you say no:** the root README keeps instructing new-DEC
authoring and keeps sending readers to start at the retired log, so an agent that
starts there is told to do exactly what the rest of the corpus forbids.

### Proposed diff

**`README.md:17` (root, onboarding bullets) — repoints the "start here" pointer:**

```diff
-- Product source of truth: `PRD/sections/` (start with the `decisions.md` router)
+- Product source of truth: `PRD/sections/` — read-first #1 is the current-state feature spec `PRD/sections/<feature>/README.md`; `PRD/sections/decisions.md` is a demoted historical index that only resolves a cited `DEC-ID` (canonical rule: `PRD/instructions/doc-lifecycle.md`, "Decision lifecycle (retired)")
```

**`README.md:163` (root, "Documentation Notes"):**

```diff
-- Keep product truth in `PRD/sections/`; record new DEC bodies in the relevant `PRD/sections/decisions/<domain>.md` file and keep the `PRD/sections/decisions.md` router index current.
+- Keep product truth in `PRD/sections/`; record it by editing the current-state feature spec `PRD/sections/<feature>/README.md` and its cited `REQ`/`FLOW` entries in place. The decision log is **retired** — do not author a new `DEC-###` (canonical rule: `PRD/instructions/doc-lifecycle.md`, "Decision lifecycle (retired)"). `PRD/sections/decisions.md` is a demoted historical index that only resolves a cited `DEC-ID`.
```

**Left unchanged:** root `README.md:16,136,137` — these *resolve* cited DEC-IDs
(DEC-020, DEC-029) via the index, which the retired-log rule explicitly permits;
they do not send the reader to start at the log or author a new one.
`doc-lifecycle.md` is already the canonical home and is not edited.

- Verdict: accept
- Reason:

---

## GUARD-GREP-BEFORE-AMEND — enumerate a rule's homes by grep, never from memory

**What this decides:** whether to add a written process rule that refinement and
gate-authoring must grep for every place a cross-cutting rule is stated before
amending it, instead of listing those places from memory.

**In plain terms:** the image-first-cards gate listed the one-endpoint rule's
homes from memory, cited a retired decision as the live rule, and missed two live
copies — a change the owner had approved would still have been silently blocked
by a rule the gate did not know it was amending. This adds a durable rule (in
`writing-rules.md`, the authority for how docs are written, cross-referenced from
`requirement-format.md`): before writing or amending a rule asserted in 3+ files,
enumerate its full set of homes by `grep`, and keep that set listed in the rule's
canonical home so it stays current. It pairs with the single-home structure the
blocks above create — the canonical home carries the list, and grep refreshes it.

**What happens if you say no:** amendment sets keep being listed from memory, and
the next cross-cutting change can miss a home or cite a retired rule the same way.

### Proposed diff

**`writing-rules.md` — new subsection after "## Editing Rules":**

```diff
+## Cross-cutting invariants (grep before amend)
+
+A **cross-cutting invariant** is a product rule asserted *as a rule* in 3+ files
+(for example: one main product-facing endpoint; mock-first local default;
+assistant-not-a-rules-engine). Each has one **canonical home** carrying the full
+rule text and an explicit "echoed in" list of every other place it appears.
+
+- Before writing or amending a cross-cutting invariant, enumerate its full
+  amendment set by `grep` across `PRD/` and `README.md`. **Never enumerate it
+  from memory** — a memory-listed set went stale and cited a retired decision as
+  the live rule (image-first-cards D5, 2026-09-04).
+- Amend the canonical home, then re-grep and refresh its "echoed in" list so a
+  drifted or newly added pointer is caught.
+- Fold only invariant *assertions* (the rule stated as a rule). A per-feature
+  scope clause ("this feature changes no product-facing endpoint") references an
+  invariant but is not a restatement of it — leave those in place.
+- A pointer cites the canonical home, never a retired `DEC-###`, as the live rule.
```

**`requirement-format.md` — cross-reference under "## Formatting Rules":**

```diff
 - Keep entries self-contained.
 - One requirement per entry.
+- When a change touches a cross-cutting invariant (a rule asserted in 3+ files),
+  enumerate its homes by grep and amend them together — see
+  `instructions/writing-rules.md`, "Cross-cutting invariants (grep before amend)".
```

**Follow-up (noted, not blocking):** the `thejudge-refinement` and gate-authoring
skills should reference this rule. Skill files are outside a graph run's write
scope (protected `thejudge-*` trees), so that pointer lands as a separate
ordinary-session edit; the durable product-truth home is the instruction file
above.

- Verdict: accept
- Reason:

---

## Blocker questions

None. Every choice above changes documentation structure only — no product
behavior, code contract, data handling, or security posture — and each is
reversible, so none meets the genuine-decision-blocker test. The canonical-home
choices are offered as edit slots rather than blockers.
