# Design Brief — prompt-context-refinement

**What this is:** a fresh gameplan for four of the owner's five observations
about the rules-question prompt/context pipeline. The fifth (guaranteed mechanic
definitions) is corpus-retrieval work and is filed to `RAG-DEFERRED.md`.

**What you need to do:** review five new stable IDs at the `define` gate —
REQ-167, REQ-168, REQ-169, FLOW-023, NFR-018. Each is a real product decision
spelled out below in plain terms.

**What it changes:** Quick Question can hold several cards instead of one; the
rules guardrail stops refusing real Magic phrases like "combo"; the backend
prompt gets a readable layout spec; and prompt quality gets validated against
real worked rules solutions. No code changes here — this is the plan.

---

## The five observations, and where each landed

| # | Observation (owner's words, brief) | Landing |
| --- | --- | --- |
| 1 | Guarantee every relevant mechanic's definition is enriched into the prompt | **Split:** refusal symptom → REQ-168; enrichment corpus → `RAG-DEFERRED.md` |
| 2 | A readable spec of the backend prompt layout, per path | **REQ-169** |
| 3 | Tune the guardrail so valid phrases like "combo" aren't refused | **REQ-168** |
| 4 | Use public worked-solutions data to validate/tune the prompt | **NFR-018** |
| 5 | Let Quick Question hold all the cards you want to discuss, drop game context | **REQ-167 + FLOW-023** |

## Scope — what this gameplan covers

Four product changes to the shared Ask AI prompt/context pipeline, all reachable
without touching the game-mode staging flow:

1. **Quick Question, several cards (REQ-167, FLOW-023).** Today the player
   attaches at most one card and any second card is a guess. This lets the player
   add every card they want to ask about (a bounded list, recommend ~6), each at
   oracle identity, while Quick Question still carries no zones, phase, stack, or
   life. The backend enriches each card (metadata + WotC rulings) and scores rule
   retrieval over the question plus all cards. Biggest item; it changes the
   lookup request shape from a single optional `card` to a bounded card list.

2. **Guardrail stops refusing real Magic phrases (REQ-168).** The off-domain
   guardrail is one instruction line in the prompt — no classifier. It over-fired
   on "combo" ("combos isn't a mechanic"). Reword it so common Magic-adjacent
   phrasing is answered, and reserve the "not found in the rules" refusal for
   input that is genuinely not about Magic. This also fixes observation 1's
   refusal symptom (a mechanic asked by name should resolve).

3. **Readable prompt-layout spec (REQ-169).** One maintained doc: every prompt
   section in assembly order, a plain one-liner each, and a matrix of which
   sections appear on which path (game / lookup+cards / lookup no-card /
   follow-up). Points at the existing `npm run prompt:preview` tool, which
   already writes a readable prompt per fixture, for a live example. Docs only.

4. **External worked-solutions validation (NFR-018).** Curate a committed set of
   real hard rules questions with published worked solutions and run them through
   the existing eval harness, to find and tune prompt failures on real cases.
   Test data, not runtime retrieval.

## What is NOT in this gameplan

- **Mechanic-definition enrichment corpus (observation 1) — RAG-deferred.** Filed
  to `RAG-DEFERRED.md`. It needs a mechanic corpus + a relevance matcher + a new
  prompt section, and sits on top of the unresolved Q-001 (keyword-vocabulary
  strategy). Only its refusal symptom is kept here (REQ-168).
- **Lightweight game context on a lookup card (Q-003) — stays open.** Observation
  5 goes the opposite way: more cards, explicitly *no* game state. REQ-167 does
  not resolve Q-003.
- **Answer-seeded second-pass retrieval (Q-004) — stays open.** Untouched.
- **No re-adoption of the three background `promptRefinement*.md` docs.** Cited
  for context only; no conclusion inherited from them.
- **No new endpoint, no game-mode change, no rules engine.** The pipeline stays
  one `POST /api/ask-ai` with mock/OpenAI behind the same boundary.

## Material assumptions (assumption ladder; evidence)

Recorded per the preparation contract. Each is the smallest reversible choice
supported by repository evidence.

1. **Observation 1's enrichment is RAG; its refusal is a guardrail bug.**
   Evidence: the refusal wording matches the DEC-108 off-domain persona line
   (`apps/backend/src/prompt/promptAssembly.ts:142`); the enrichment idea
   requires a new mechanic corpus + matcher + prompt section and rides on the
   open Q-001. Ladder rung 1/6 (PRD truth + no-new-corpus). This split is the
   one place the owner's own uncertainty ("not sure where to draw the line") was
   resolved by judgment rather than deferred — recorded explicitly for review.
2. **Multi-card lookup is a bounded card list on the existing `mode: "lookup"`
   union, not a new mode or endpoint.** Evidence: `askAiRequest.ts` already has
   an optional single `card` on the lookup branch (`lookupCardReferenceSchema`,
   line 249) and DEC-106 shaped the union to grow additively. Ladder rung 6 (no
   new endpoint/contract layer). Exact wire spelling (`cards` array vs. `card`
   as array) left to implementation as a code-shape choice.
3. **Multi-card cap is bounded but the number is calibration, not product
   truth.** Recommend ~6, tuned at implementation against the prompt budget —
   consistent with how retrieval/topic caps are recorded as "measured bounds,"
   not fixed decisions. Ladder rung 4 (smallest reversible scope).
4. **The guardrail stays prompt-instruction-only.** Evidence: DEC-108 states it
   is prompt-instruction-only with no classifier; the fix is wording, not a new
   detection branch. Ladder rung 2 (tested/public contract preserved).
5. **The prompt-layout spec is authored/verified at implementation against code
   and `prompt:preview`, not from memory.** Evidence: `scripts/prompt-preview.mjs`
   emits `production.prompt.txt` + sidecars; `system-map/prompt-assembly.md`
   already documents section order. REQ-169 makes the doc a derived-from-code
   artifact. Ladder rung 3 (established local pattern).
6. **The external worked-solutions set is committed eval fixtures fed through
   the existing harness — no new runtime dependency, no runtime call.** Evidence:
   the eval harness (REQ-032/DEC-047) and committed fixtures are the established
   quality pattern; DEC-161 sets the precedent that answer-quality tracks are
   opt-in and non-gating. Ladder rung 6. Dataset sourcing/licensing is an
   implementation-time investigation, resolved before any data is committed.

7. **Multi-card lookup combo match is qualify-on-any-one plus attached-card
   coverage ranking, not all-cards-required.** For `mode: "lookup"` with N
   attached cards and explicit combo intent, a candidate qualifies when it
   contains at least one attached card (exact or authoritative template), and
   candidates covering more of the attached cards rank ahead of those covering
   fewer, before popularity. Evidence: REQ-094's own game-mode design already
   uses an ANY-overlap-plus-coverage model — "submitted cards seed overlap
   matching and ranking" (AC) and "required-anchor coverage; compatible-zone
   coverage" ranking terms — never an all-cards-required rule. An
   all-cards-required rule would return empty for most arbitrary card sets,
   silently breaking the "how do these cards combo" experience. Ladder rung 1/3
   (PRD truth in the same requirement + established local pattern). This makes
   REQ-094's ranking not purely card-agnostic under multiple cards: it gains an
   attached-card-coverage term ahead of popularity, while single-card coverage
   is uniform so ordering collapses to today's popularity/variant-id.

None of these met the three-condition genuine-blocker test: the PRD, tested
behavior, and established patterns each gave an authoritative basis, and the
smaller option did not silently decide a disputed product behavior. No blocker
is reported.

## PRD alignment and durable changes

New stable IDs (each an owner gate question):

- **REQ-167** — Quick Question accepts several cards with no game state.
  Supersedes DEC-107's single-card / DEC-106's single optional `card`, and
  amends REQ-094's `mode: "lookup"` combo criterion (single attached card →
  bounded attached-card set; qualify-on-any-one plus attached-card-coverage
  ranking). REQ-094 carries the reciprocal "amended by REQ-167" note.
  (`PRD/sections/functional-requirements.md`)
- **REQ-168** — the rules guardrail stops refusing real Magic phrases like
  "combo." Amends DEC-108 / REQ-074 (wording, still prompt-only).
  (`PRD/sections/functional-requirements.md`)
- **REQ-169** — a readable prompt-layout spec with a per-path presence matrix.
  New durable doc mandated (recommend `system-map/prompt-layout-spec.md`).
  (`PRD/sections/functional-requirements.md`)
- **FLOW-023** — ask a Quick Question about several cards with no game state.
  Supersedes FLOW-011's single-card constraint. (`PRD/sections/user-flows.md`)
- **NFR-018** — prompt quality is validated against real worked rules solutions.
  Cites REQ-032 / DEC-047 eval harness. (`PRD/sections/non-functional-requirements.md`)

Feature-spec READMEs (`quick-lookup/README.md`, `in-depth/README.md`) and
`screen-layout.md`'s "Quick Question — pre-submit" row are **not** edited here:
they are current-state truth and get updated at implementation, when the
multi-card behavior and its re-measured image bounds actually ship. Flagged so
map-out schedules those spec updates in the shipping slice's acceptance criteria.

## Where the work lives (for map-out)

- Multi-card lookup: `apps/backend/src/validation/askAiRequest.ts` (lookup
  branch), `apps/backend/src/prompt/` (`preparation.ts`, `promptAssembly.ts`,
  `context.ts`), `apps/backend/src/gameRulesRetrieval.ts`,
  `apps/backend/src/commanderSpellbook/` (match instances); frontend
  `apps/frontend/src/components/portal/quick-lookup/`; goldens under
  `apps/backend/src/eval/fixtures/quick-lookup-*` and
  `commander-spellbook-lookup-*`.
- Guardrail wording: `apps/backend/src/prompt/promptAssembly.ts:142`; off-domain
  golden under `quick-lookup-*`.
- Prompt-layout spec: new `PRD/sections/system-map/prompt-layout-spec.md`;
  reference `scripts/prompt-preview.mjs` and `system-map/prompt-assembly.md`.
- External validation: the eval harness (DEC-047 / REQ-032) and its fixtures.

## Deferred / open items pointer

- `RAG-DEFERRED.md` — observation 1's mechanic-definition enrichment corpus.
- Q-001 (System 3 keyword vocabulary) — unresolved; the RAG item depends on it.
- Q-003 (lightweight game context on a lookup card) — stays open; REQ-167 does
  not resolve it.
- Q-004 (answer-seeded second-pass retrieval) — stays open; untouched.
