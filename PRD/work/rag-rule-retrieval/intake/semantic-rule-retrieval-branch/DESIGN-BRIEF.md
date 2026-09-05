# Design brief — semantic rule retrieval + combo over-assertion fix

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

Two coupled changes to how Ask AI answers rules and combo questions. Both are
backend/prompt-only: no `AskAiRequest`, Zod schema, or frontend change, and no
new product-facing endpoint.

## What the player gets

- **(A) Sharper rule excerpts.** The "ADDITIONAL RELEVANT RULE EXCERPTS" block
  (System 3) stops picking rules by keyword overlap and starts picking them by
  meaning. It finds the rule that actually answers the question — especially on
  multi-card and combo questions, where keyword matching collapses today.
- **(B) No fabricated combos.** In Quick Question (lookup mode, no board), the
  model stops claiming a working combo built from cards that don't combo. It
  asserts an assembled combo only when every ingredient is an attached card;
  otherwise it names the missing role and says the cards don't combo as-is.

## Why (measured — not re-derived here)

Benchmark: 156 labeled question→rule pairs, recall@5.

| Retrieval | clean recall@5 | multi-card recall@5 |
| --- | --- | --- |
| lexical TF-IDF (today) | 0.577 | 0.026 |
| semantic — local all-MiniLM-L6-v2 | 0.865 | 0.763 |
| semantic — OpenAI text-embedding-3-small | 0.885 | 0.603 |

Lexical finds the right rule ~58% of the time on clean questions and collapses
to ~3% when attached-card oracle text pollutes the query (the combo case).
Local MiniLM ties OpenAI clean and beats it multi-card. Combo over-assertion:
in the 500-case combo suite the only hard errors were the model inventing a
combo from non-comboing cards. Full record:
`PRD/work/semantic-rule-retrieval/FINDINGS-EMBEDDING-PROVIDER.md` and
`PRD/work/combo-context-validation/FINDINGS.md` (cited, not re-opened).

## Change A — semantic rule retrieval (System 3)

**Mechanism (new REQ-170).**

- **Offline embeddings artifact.** A committed artifact
  (`apps/backend/data/gameRulesRuleEmbeddings.json` or equivalent) holds one
  vector per rule in `gameRulesRuleIndex.json` (~3,432 rules). Built by an
  offline step alongside `build-game-rules.mjs`, rebuilt only on CR refresh.
  Model: `all-MiniLM-L6-v2`, 384-dim, quantized (q8). Bundled corpus ~5.3MB.
- **Embedding-provider seam.** A new `EMBEDDING_PROVIDER` flag (`mock` | `local`
  | `openai`) mirrors the existing `ASK_AI_PROVIDER` boundary (DEC-020). Default
  is `mock` when unset; no auto-switch on `NODE_ENV`/deploy target.
  - `mock` — no embedding, no external call; System 3 uses lexical only. Keeps
    mock the default that runs with no model access (NFR-009 / DEC-017 / DEC-033).
  - `local` — the shipped semantic provider. Embeds the query in-process with
    the bundled model (~2ms/query, no external call), cosine-ranks against the
    committed rule vectors.
  - `openai` — seam-selectable for live mode only; never the default.
- **Runtime.** The async route handler embeds the query and injects the query
  vector (or null) into `preparePromptInput` as an option, so
  `preparePromptInput` stays synchronous. Cosine over the bundled vectors fills
  System 3's existing top-5 slot. No vector database — vectors live in-process.
- **Lexical retained, three ways.** Mock/offline default; the exact-rule-id and
  parent-rule-id boost merged into ranking (semantic won't catch a cited "rule
  613.9"); and the fallback on any embedding failure. So System 3 is never worse
  than today.
- **Query-construction fix.** Build the retrieval query from the question plus
  the keyword signal, not raw concatenated card oracle text — that pollution is
  what tanks recall on multi-card questions.
- **Eval (REQ-032 extended).** The retrieval eval measures the semantic path
  using **committed frozen query embeddings**, so `system3-expected-recall` /
  `system3-noise-excluded` run with no live embedding or AI call — honoring
  REQ-032's no-external-call constraint.

**Preserved posture.** System 3's "no per-request external call" posture is
**preserved**, not reversed — because the shipped semantic provider is a bundled
local model. Only `EMBEDDING_PROVIDER=openai` would add a per-request call, and
it is not the default. This is the simplification the local-model decision buys.

**Scope guardrails.** RAG scope is rules only; cards/combos/rulings stay keyed
lookups. No vector database (hosted store justified only if RAG later spans
150k+ vectors — out of scope). The parked mechanic-definition corpus
(`prompt-context-refinement/RAG-DEFERRED.md`) is a separate feature that reuses
this embedding machinery but is not built here.

## Change B — combo over-assertion fix (lookup mode)

Strengthen the prompt instruction, not a structured status contract (decided
with the owner).

- REQ-095's existing instruction tells the model to check each ingredient's card
  state **against the submitted board** before calling a combo live. In lookup
  mode there is no board, so that check has nothing to bind to — the
  over-assertion slips through. That is the gap.
- Fix: in lookup mode (no board / no game state), the model asserts an assembled
  or working combo **only when every ingredient is an attached card**. When any
  required ingredient is not attached, it names the missing role and states the
  cards do not combo as-is — it does not present the combo as assembled.
- This rides REQ-167's existing complete/partial lookup rendering: a "complete"
  classification (every ingredient slot filled across the attached set) is the
  only case allowed to assert assembled; a "partial" names the missing
  ingredient's own identity/template from the catalog and says the cards don't
  combo as-is. Naming the missing role is a **description**, not a card
  recommendation or search — REQ-167's no-recommendation-engine (and REQ-167's
  underlying non-goal) is preserved.

**Regression.** Reuse the 500-case combo eval harness
(`combo-context-validation/harness/select-suite.mjs` + `run-live.mjs`,
sequential + cached + `--confirm-live-calls` gated) to regression-test the fix.

## PRD/sections amendments (new/changed stable IDs)

- **REQ-170 (new)** — semantic rule retrieval: local embedding provider seam,
  rule-embeddings artifact + offline build step, runtime query-embed + cosine,
  exact-rule-id boost merge, query-construction fix, lexical fallback, q8
  re-confirmation gate. Written into `functional-requirements.md`.
- **REQ-022 (amended)** — System 3 enrichment acceptance now describes the
  semantic-primary path with lexical fallback and the query-construction fix,
  and records that the no-per-request-external-call constraint is **preserved**
  by the local embedding (references REQ-170).
- **REQ-032 (amended)** — retrieval relevance eval now measures the semantic
  path via committed frozen query embeddings; the no-live-call constraint
  extends to embedding calls.
- **REQ-095 (amended)** — combo prompt instruction adds the lookup-mode (no
  board) attached-card test for asserting an assembled combo.
- **REQ-167 (amended note)** — reaffirms that the lookup answer says the cards
  don't combo as-is when no candidate fully assembles across the attached set,
  and that naming the missing role stays a description, not a recommendation
  engine (no-recommendation-engine preserved).
- **`system-map/game-rules-retrieval.md` (amended)** — System 3 narrative
  rewritten for semantic retrieval + lexical fallback + query-construction fix.
- **`integrations-and-data.md` (amended)** — adds the `EMBEDDING_PROVIDER`
  modes and the rule-embeddings artifact + build/refresh policy.
- **`quick-lookup/README.md` (amended)** — the `### Retrieval` Built: line and
  the `## Measured bounds` retrieval line now describe System 3 semantic-primary
  scoring (cosine over committed rule embeddings) with the exact-rule-id boost
  merged and lexical retained as the mock/offline default and failure fallback,
  and the lookup query built from the question plus the keyword signal, not raw
  card oracle text (REQ-170; the amended REQ-022 they already cite).
- **`in-depth/README.md` (amended)** — the `### Retrieval enrichment` supplemental-
  scoring Built: line now describes System 3 semantic-primary scoring with
  lexical fallback under REQ-170, keeping the DEC-046 lineage.

No new FLOW-### — the change is internal prompt assembly, not a user-visible
flow. No new DEC-### — the decision log is retired.

## Interaction with Q-001 (flagged, not resolved)

Q-001 asks how the System 3 keyword vocabulary is derived and maintained.
Semantic retrieval **reduces reliance** on the hand-derived vocabulary (meaning
now drives ranking), but does not remove it — the vocabulary still feeds the
query keyword signal and the exact-rule-id boost. Q-001 stays open; REQ-170
records the interaction and does not resolve it.

## Material assumptions (assumption ladder)

Graph mode: no user approval pause; assumptions recorded here per the
preparation contract. None met the three-condition genuine-blocker test.

1. **Seam flag name `EMBEDDING_PROVIDER`, values `mock`|`local`|`openai`,
   default `mock`.** Ladder #3 (established local pattern): mirrors the existing
   `ASK_AI_PROVIDER` flag exactly (DEC-020, `providers/README.md`) — same
   mock-default, no auto-switch on `NODE_ENV`. Wire spelling is an
   implementation choice; the behavior is what's fixed.
2. **Embeddings artifact path `apps/backend/data/gameRulesRuleEmbeddings.json`.**
   Ladder #3: sits beside the existing `gameRulesRuleIndex.json` and follows the
   dual-output build convention. Exact filename is an implementation choice.
3. **q8 quantized model shipped, with an fp32 container-image fallback if recall
   drops materially.** Adopted from the resolved investigation
   (FINDINGS-EMBEDDING-PROVIDER.md). Written as a build-time re-confirmation gate
   (REQ-170 acceptance), not a product decision to re-open.
4. **`local` is the shipped semantic provider in live mode; `mock` stays lexical
   default.** Adopted from the resolved provider decision. Ladder #1 once
   adopted: it is the intake's stated, measured decision, surfaced at the define
   gate via this diff.
5. **New REQ-170 rather than folding the mechanism into REQ-022.** Ladder #3/#4:
   the semantic mechanism is substantial, citable durable truth (artifact,
   provider seam, runtime plumbing); REQ-022 stays the enrichment-behavior
   requirement and references REQ-170. Smallest change that keeps both
   discoverable.

## Non-goals

No vector database. No semantic retrieval over cards/combos/rulings. Not the
parked mechanic-definition corpus injection (`RAG-DEFERRED.md`). No
card-recommendation engine (REQ-167 preserved). No `AskAiRequest`/response/error
shape change; no new endpoint; no frontend change.

## Evidence (cited, not re-opened)

- `PRD/work/semantic-rule-retrieval/FINDINGS-EMBEDDING-PROVIDER.md` — provider
  measurement + decision.
- `PRD/work/semantic-rule-retrieval/GRAPH-BRIEF.md`, `IDEA.md`, `HANDOFF.md` —
  intake.
- `PRD/work/combo-context-validation/FINDINGS.md` + `harness/` — prior
  investigation and reusable RAG + combo eval harness.
