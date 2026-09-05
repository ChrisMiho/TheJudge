# Gate questions — semantic-rule-retrieval

Answer each block by filling its `- Verdict:` line with `accept`, `edit`, or
`reject`. `edit` and `reject` need a `- Reason:` so the run knows what to change.
You can answer on your own schedule; the run stays parked until every slot is
filled. When done, resume with `/graph-run PRD/work/semantic-rule-retrieval/`.

Each block is one piece of new or changed product truth refinement wrote into
`PRD/sections/`. Nothing below is code yet — this is the product you are
approving before anything gets built.

---

## REQ-170 — Semantic rule retrieval (new requirement)

- **What this decides:** Whether the "additional relevant rule excerpts" block
  in the AI prompt (System 3) starts picking rules by *meaning* using a small
  bundled model, shipping a new committed data file and a provider switch —
  instead of today's keyword matching.
- **In plain terms:** Today System 3 finds rule text by keyword overlap.
  Measured, that finds the right rule about 58% of the time on clean questions
  and collapses to ~3% on multi-card / combo questions. This switches it to
  semantic search: at build time every Comprehensive Rule (~3,432 of them) is
  turned into a number-vector by a small local model (`all-MiniLM-L6-v2`) and
  committed as a ~5.3MB file; at question time the player's question is turned
  into a vector *in-process* (~2ms, no internet call) and the closest rules are
  returned. A new `EMBEDDING_PROVIDER` switch (`mock` | `local` | `openai`)
  mirrors the existing `ASK_AI_PROVIDER` switch — `mock` (the default) stays
  pure keyword and needs no model at all, `local` ships the semantic path,
  `openai` is available for live mode only. Keyword search is kept as the
  default, as a booster for a cited rule number (like "rule 613.9"), and as the
  fallback if embedding ever fails, so retrieval is never worse than today.
- **What happens if you say no:** System 3 stays keyword-only. The ~3%
  multi-card recall stands, and no embeddings file or provider switch is added.

```diff
@@ -3883,3 +3892,38 @@
   - `system-map/prompt-assembly.md`; `scripts/prompt-preview.mjs`
 - Notes:
   - The owner's stated purpose is to drive future prompt-format optimization for better rules resolving; this spec is that reference surface.
+
+### REQ-170
+- Title: Semantic rule retrieval — local embedding provider and rule-embeddings artifact
+- Priority: high
+- Description: System 3 supplemental rule retrieval scores rules by semantic similarity between the player's question and the Comprehensive Rules corpus, not lexical keyword overlap alone. A committed offline artifact holds one pre-embedded vector per rule; at request time the query is embedded and cosine-ranked against those vectors to fill System 3's existing top-5 slot. Query embedding runs through a swappable embedding-provider seam that mirrors the `ASK_AI_PROVIDER` boundary, with a bundled local model as the shipped semantic provider so there is no per-request external call. Lexical retrieval is retained as the mock/offline default, the exact-rule-id boost, and the failure fallback, so retrieval is never worse than today.
+- Acceptance Criteria:
+  - a committed offline artifact `apps/backend/data/gameRulesRuleEmbeddings.json` (or equivalent) holds one embedding vector per rule in `gameRulesRuleIndex.json`, built by an offline step alongside `build-game-rules.mjs` and rebuilt only on CR refresh
+  - the embeddings artifact is produced by the local model `all-MiniLM-L6-v2`, 384-dim, quantized (q8); the bundled 384-dim corpus is ~5.3MB
+  - a new embedding-provider seam selects the query embedder by explicit flag `EMBEDDING_PROVIDER` with values `mock` | `local` | `openai`; default is `mock` when unset and does not auto-switch on `NODE_ENV` or deploy target (mirrors `ASK_AI_PROVIDER`, DEC-020)
+  - `EMBEDDING_PROVIDER=mock` performs no embedding and no external call; System 3 uses lexical retrieval only (preserves NFR-009 / DEC-017 / DEC-033 — mock is the default and runs with no model access)
+  - `EMBEDDING_PROVIDER=local` embeds the query in-process with the bundled model — no external call — and ranks the query vector against the committed rule embeddings by cosine to produce System 3 candidates
+  - `EMBEDDING_PROVIDER=openai` embeds the query via the OpenAI embeddings API (live mode only); it is seam-selectable and never the default
+  - the async route handler embeds the query and injects the query vector (or null) into `preparePromptInput` as an option, so `preparePromptInput` stays synchronous
+  - the exact-rule-id and parent-rule-id boost is merged with semantic ranking so a cited rule number (e.g. "rule 613.9") is still pulled even when semantic similarity misses it
+  - the retrieval query is built from the player's question plus the keyword signal, not raw concatenated card oracle text (query-construction fix)
+  - on any embedding failure (model load, inference error, missing embeddings artifact, provider error) System 3 falls back to lexical retrieval and still returns up to 5 excerpts; one diagnostic warning is emitted
+  - the q8 quantized model's recall@5 is re-confirmed on the committed benchmark before locking it; if it drops materially below the fp32 baseline (clean 0.865 / multi-card 0.763) ship fp32 via a container image instead of the quantized zip
+  - System 3 remains capped at 5 excerpts and deduplicated against the selected System 2 baseline rule IDs (REQ-022 unchanged on those points)
+- Constraints:
+  - backend/prompt-only; no `AskAiRequest`, Zod schema, or frontend change; System 3 still fills its existing top-5 slot
+  - no vector database — the ~3,432 rule vectors live in-process and are cosine-searched, bundled like the rule index
+  - RAG scope is rules only; cards, combos, and rulings stay keyed lookups, not semantic search
+  - no per-request external call in the default (`mock`) or shipped-semantic (`local`) modes; only `EMBEDDING_PROVIDER=openai` adds one, and it is not the default
+  - never commit the raw model download or an oversized embeddings blob; the committed artifact is the trimmed 384-dim vectors only
+  - NFR-002 (<3s) holds — a local query embedding adds ~2ms
+- Dependencies:
+  - REQ-022 (System 3 enrichment behavior this mechanism feeds)
+  - REQ-032 (offline semantic retrieval eval)
+  - DEC-020 (provider-boundary pattern the embedding seam mirrors)
+  - DEC-046 (System 3 scoring this amends)
+  - NFR-009 (mock runs with no model access)
+- Notes:
+  - Provider decided by measurement — local MiniLM ties OpenAI on clean questions (0.865 vs 0.885 recall@5) and beats it on the multi-card case (0.763 vs 0.603); it is ~100x faster per query and free at this scale. Evidence: `PRD/work/semantic-rule-retrieval/FINDINGS-EMBEDDING-PROVIDER.md`.
+  - Interacts with Q-001 (System 3 keyword-vocabulary derivation): semantic retrieval reduces reliance on the hand-derived keyword vocabulary but does not remove it — the vocabulary still feeds the query keyword signal and the exact-rule-id boost. Q-001 stays open; this requirement does not resolve it.
+  - The parked mechanic-definition corpus injection (`prompt-context-refinement/RAG-DEFERRED.md`) is a separate feature that reuses this embedding machinery but is not built here.
```

- Verdict: <accept | edit | reject>
- Reason:

---

## REQ-022 — System 3 enrichment acceptance (amended)

- **What this decides:** Whether REQ-022, the spec for how the supplemental
  rules block behaves, records System 3 as semantic-first with keyword fallback
  and the query-construction fix — while keeping the promise that System 3 makes
  no per-request internet call.
- **In plain terms:** REQ-022 governs the supplemental block. It now says
  scoring is semantic-first when the switch is on, keyword scoring stays the
  default and the fallback, and the query is built from the question plus
  keywords rather than raw card text (raw card text is what tanked recall).
  Crucially, the "no per-request external call" promise still holds because the
  local model runs in-process — it is preserved, not reversed.
- **What happens if you say no:** REQ-022 keeps describing keyword-only scoring,
  and the new mechanism has no acceptance hook in the enrichment spec.

```diff
@@ -368,18 +368,23 @@
   - supplemental section appears after `GAME RULES (reference)` and before `OFFICIAL RULINGS`
   - supplemental section omitted when index missing, empty, or no rules score above 0
   - eval fixtures assert labeled supplemental recall per REQ-032
+  - System 3 scoring is semantic-primary when the embedding-provider seam is active (REQ-170): the query embedding is cosine-ranked against the committed rule embeddings, with the exact-rule-id/parent-rule-id boost merged in; lexical scoring remains the mock/offline default and the fallback on any embedding failure, so retrieval is never worse than the prior lexical behavior
+  - the System 3 retrieval query is built from the question plus the keyword signal, not raw concatenated card oracle text (query-construction fix, REQ-170)
 - Constraints:
   - prompt-only and backend-only; no `AskAiRequest`, Zod schema, or frontend changes
   - no paraphrased rule text
   - no runtime CR or Scryfall fetch per request
+  - no per-request external call for System 3 query embedding in the default (`mock`) or shipped-semantic (`local`) modes; the "no per-request external call" posture is preserved by the bundled local model (REQ-170), not reversed — only `EMBEDDING_PROVIDER=openai` would add one, and it is not the default
   - System 2 selection uses only card-agnostic game-state signals (`turnPhase`, `combatStep`, populated zones); no card names, oracle text, or keywords
   - System 3 owns all card/question-driven retrieval including oracle-keyword signals
 - Dependencies:
   - DEC-045
   - DEC-046
   - REQ-032
+  - REQ-170 (semantic retrieval mechanism: embedding-provider seam, rule-embeddings artifact, runtime query-embed, lexical fallback)
 - Notes:
   - supersedes REQ-022 acceptance criteria that required all curated topics on every request
+  - System 3's scoring mechanism moves from lexical-only to semantic-primary with lexical fallback under REQ-170; the section's placement, 5-excerpt cap, and System 2 dedup are unchanged
```

- Verdict: <accept | edit | reject>
- Reason:

---

## REQ-032 — Retrieval relevance eval (amended)

- **What this decides:** Whether the offline retrieval test measures the new
  semantic path, using pre-committed query vectors so it stays offline and
  makes no live calls.
- **In plain terms:** REQ-032 is the automated check that System 3 returns the
  right rules. It is extended to grade the semantic path too, using query
  vectors frozen and committed to the repo — so the test adds no live embedding
  call and no live AI call, and stays deterministic.
- **What happens if you say no:** the eval only measures keyword retrieval; the
  semantic path ships with no automated relevance regression gate.

```diff
@@ -577,17 +582,19 @@
   - harness check `system2-conditional-selection` passes when selected curated topics match `expectedSystem2TopicIds` for fixtures that define them
   - harness check `system3-expected-recall` passes when every `expectedSupplementalRuleIds` entry appears in System 3 top-5 retrieval results
   - harness check `system3-noise-excluded` passes when no `forbiddenSupplementalRuleIds` entry appears in System 3 top-5
+  - `system3-expected-recall` and `system3-noise-excluded` run against the semantic retrieval path (REQ-170) using committed frozen query embeddings, so the eval measures semantic retrieval with no live embedding call and no live AI call
   - scenario fixtures cover the signal taxonomy: stack-resolution (e.g. counterspell), combat-damage/deathtouch, upkeep-trigger, keyword interaction (extend `cascade-keyword`), out-of-manifest SBA (extend `state-based-actions`)
   - a digestible before/after relevance report is available for tuning review (one table per scenario: System 2 topics selected, System 3 top-5 with scores, recall hit/miss); may be a script output or harness report artifact
   - existing structural checks (section presence, ordering, budget) remain unchanged
   - `npm run test:eval` remains the automated regression gate
 - Constraints:
-  - no live AI provider calls in relevance checks
+  - no live AI provider calls in relevance checks, and no live embedding calls — the semantic path is evaluated via committed frozen query embeddings so the eval stays offline and deterministic
   - expected rule IDs are human-labeled ground truth, not inferred from current scorer output
   - do not assert full prompt golden text for relevance scenarios unless structural sections change intentionally
 - Dependencies:
   - DEC-047
   - REQ-022
+  - REQ-170 (semantic retrieval path this eval now measures)
 - Notes:
   - replaces reliance on manual multi-file `prompt:preview` review as the sole relevance verification path
```

- Verdict: <accept | edit | reject>
- Reason:

---

## REQ-095 — Combo over-assertion, lookup mode (amended)

- **What this decides:** Whether the combo prompt instruction gains a rule for
  lookup mode (no board): only call a combo assembled when every ingredient is
  an attached card; otherwise name the missing role and say the cards don't
  combo as-is.
- **In plain terms:** In Quick Question, with no board submitted, the model
  sometimes claims a working combo from cards that don't actually combo. This
  adds an explicit instruction for that board-less case: assert an assembled
  combo only when every piece is an attached card; otherwise name which role is
  missing and state the cards don't combo as-is. Naming the missing role stays a
  description of the combo's own ingredient — not a card recommendation.
- **What happens if you say no:** the board-less over-assertion gap stays open,
  and the model can keep fabricating combos in lookup mode.

```diff
@@ -2213,6 +2220,7 @@
   - each entry includes its classification, stable Commander Spellbook variant reference, compatible present ingredients, present-but-incompatible-zone ingredients, missing exact ingredients, matched/unresolved template ingredients, per-ingredient applicable card state, per-ingredient `mustBeCommander`, produced effects, steps, mana needed, prerequisites, and notes when available
   - the rendered classification never uses the bare word "complete": a fully assigned candidate renders as all pieces present with card state explicitly unverified, and a candidate with gaps renders as partial with its missing pieces named
   - prompt instructions direct the model to check each ingredient's applicable card state and `mustBeCommander` against the submitted board before asserting that a combo is live, assembled, or executable
+  - in lookup mode (no board / no game state), where the against-the-board check has nothing to bind to, prompt instructions direct the model to assert an assembled or working combo only when every ingredient is an attached card; when any required ingredient is not an attached card, the model names the missing role and states the cards do not combo as-is, rather than presenting the combo as assembled (closes the no-board over-assertion gap; see REQ-167)
   - partial candidates explicitly label every missing or incorrectly zoned ingredient so the model can address the user's question without presenting the combo as currently assembled
   - prompt instructions state that Commander Spellbook is community catalog data, not WotC rules, legality validation, or proof of executability; official card text, WotC rulings, and Comprehensive Rules remain authoritative
   - without explicit combo intent, the model is told to use an automatically matched complete combo only when relevant to the user's actual question; it must not expand into unrelated staples or other variants
```

- Verdict: <accept | edit | reject>
- Reason:

---

## REQ-167 — No-card-recommendation guardrail reaffirmed (amended note)

- **What this decides:** Whether REQ-167's notes reaffirm that naming a missing
  combo role is a *description*, not a card recommendation or search — keeping
  the no-card-recommendation-engine non-goal intact alongside the REQ-095
  change.
- **In plain terms:** REQ-167 is the guardrail that this app is not a
  card-recommendation engine. The added note confirms the new combo instruction
  (naming a missing role) describes the combo's own ingredient and does not turn
  into recommending or searching for cards.
- **What happens if you say no:** nothing explicitly ties the REQ-095 combo
  change back to the no-recommendation guardrail.

```diff
@@ -3842,6 +3850,7 @@
   - Screen-layout's "Quick Question — pre-submit" row records a **single-card** image cap (REQ-129/DEC-160/REQ-141). That row must be re-measured and updated for a multi-card add strip when this ships; it is deliberately not restamped as measured truth here.
   - Does not resolve Q-003 (lightweight game context) or Q-004 (answer-seeded second-pass retrieval); both stay open.
   - Gate review (2026-08-30) tightened the add cap from a suggested ~6 to a fixed 5, and directed that lookup-mode combo answers explain a completed combo when the attached cards fully assemble it, and otherwise name the missing piece(s) and describe what would fill them. The define loop (2026-08-30) settled those mechanics in REQ-094 (amended): "complete" = every ingredient slot filled by an exact/template match in the attached set, with REQ-094's zone/quantity checks dropped for a board-less mode; "partial" = qualifies on at least one attached card but leaves a slot unmatched; lookup selection order is complete-before-partial, then attached-card coverage, then fewer missing, then popularity, then variant id. The answer is REQ-095's existing present/missing rendering, and "what would fill the role" is the missing ingredient's own identity/template from the combo catalog, not a card recommendation. No new stable ID was needed.
+  - Combo over-assertion fix (semantic-rule-retrieval): REQ-095 now carries the lookup-mode (no board) instruction that the model may assert an assembled combo only when every ingredient is an attached card, and otherwise names the missing role and says the cards do not combo as-is. That closes the board-oriented gap where a board-less lookup let a fabricated combo through. Naming the missing role stays a description of the missing ingredient's own identity/template, not a card recommendation or search — the no-card-recommendation-engine non-goal is preserved.
```

- Verdict: <accept | edit | reject>
- Reason:

---

## integrations-and-data.md — Embedding provider + rule-embeddings artifact (amended)

- **What this decides:** Whether the data/integrations spec records the new
  `EMBEDDING_PROVIDER` switch and the committed rule-embeddings file, plus its
  build, refresh, and fail-safe behavior.
- **In plain terms:** This documents the new moving parts in the data layer: the
  `EMBEDDING_PROVIDER` switch (mock/local/openai, default mock); a committed
  ~5.3MB `gameRulesRuleEmbeddings.json` holding one vector per rule; that it is
  built alongside the existing rule index and rebuilt only on a Comprehensive
  Rules refresh; that the raw model download is never committed; and that a
  missing or broken embeddings file falls back to keyword search. If the
  quantized model's recall drops materially, ship the full-precision model via a
  container image instead.
- **What happens if you say no:** the data strategy won't reflect the new file
  or switch, and build/degradation behavior for embeddings stays unspecified.

```diff
@@ -14,6 +14,7 @@ This file captures integrations, payloads, data rules, and delivery constraints.
 - API Framework: Express or Fastify
 - Validation: request validation layer
 - AI Provider: backend provider boundary (`ASK_AI_PROVIDER=mock` default, `ASK_AI_PROVIDER=openai` for live answers)
+- Embedding Provider: backend embedding boundary for System 3 semantic rule retrieval (`EMBEDDING_PROVIDER=mock` default → lexical only, `local` → bundled `all-MiniLM-L6-v2` in-process, `openai` → OpenAI embeddings API); mirrors the `ASK_AI_PROVIDER` seam (REQ-170)
 - Provider Access: provider SDKs are backend-only
 - Storage: none for the core product

@@ -264,6 +265,10 @@ Purpose:
 - build scripts degrade gracefully: missing CR source or failed extract keeps the prior committed artifacts and exits 0
 - the backend loads both committed artifacts at startup and omits game-rules enrichment if the artifacts are missing or empty
 - runtime CR fetches are out of scope for the core product
+- System 3 semantic retrieval adds a committed per-rule embeddings artifact `apps/backend/data/gameRulesRuleEmbeddings.json` (one 384-dim vector per rule in `gameRulesRuleIndex.json`), produced offline by `all-MiniLM-L6-v2` quantized (q8); the 384-dim corpus is ~5.3MB committed — no vector database, cosine-searched in-process (REQ-170)
+- the embeddings artifact is built by an offline step alongside `build-game-rules.mjs`, runs in the same `npm run data:build` / `data:refresh` chain, rebuilds only on CR refresh, and degrades gracefully (a missing or malformed embeddings artifact disables the semantic path and System 3 falls back to lexical retrieval)
+- the raw local embedding model download is gitignored and must not be committed; only the trimmed 384-dim vectors are committed, never an oversized fp32 blob. If q8 recall drops materially below the fp32 baseline on the committed benchmark, ship fp32 via a container image (10GB limit) instead of the quantized zip (REQ-170)
+- query embedding at request time is selected by `EMBEDDING_PROVIDER` (`mock` | `local` | `openai`, default `mock`); `mock` and `local` make no per-request external call, so System 3 keeps its no-per-request-external-call posture and mock runs with no model access (NFR-009); `openai` is seam-selectable for live mode only
```

- Verdict: <accept | edit | reject>
- Reason:

---

## system-map/game-rules-retrieval.md — Retrieval narrative (amended)

- **What this decides:** Whether the System 3 explainer is rewritten to describe
  semantic-first scoring, the provider switch, the embeddings file, the
  query-construction fix, and the async query-embed step.
- **In plain terms:** This is the how-it-works document for rules retrieval. It
  is rewritten so the mechanism, data-flow, and worked-example sections describe
  semantic-first scoring with keyword fallback, the `EMBEDDING_PROVIDER` switch,
  the committed embeddings, building the query from the question plus keywords,
  and the async handler embedding the query before prompt assembly (so the
  prompt-prep function stays synchronous). It also records that semantic
  retrieval reduces reliance on the hand-derived keyword vocabulary (open
  question Q-001) without removing it.
- **What happens if you say no:** the system map keeps describing keyword-only
  retrieval and won't match the shipped behavior.

```diff
@@ -1,5 +1,5 @@
 # Game rules retrieval
-Backed by: DEC-029, DEC-030, DEC-032, DEC-045, DEC-046, DEC-047, REQ-022, REQ-032
+Backed by: DEC-029, DEC-030, DEC-032, DEC-045, DEC-046, DEC-047, REQ-022, REQ-032, REQ-170

 ## How it works

@@ -18,13 +18,29 @@ a smaller `GAME RULES (reference)` section that still covers the stable vocabula
 model needs for stack, priority, zones, targets, combat, delayed triggers, and related
 common interactions.

-System 3 is supplemental retrieval. It builds a query from the user's question plus
-card/context text, scores official rule excerpts with IDF-weighted lexical matching,
-question and keyword boosts, exact rule-ID and parent rule-ID bonuses, then selects at
-most five excerpts. Ties prefer the highest matching IDF signal, then ascending rule
-ID. Before scoring output is selected, System 3 excludes rule IDs already selected by
-System 2, so the prompt does not print the same rule in both `GAME RULES (reference)`
-and `ADDITIONAL RELEVANT RULE EXCERPTS`.
+System 3 is supplemental retrieval. It builds a query from the user's question plus a
+keyword signal — deliberately not raw concatenated card oracle text, which pollutes the
+query and tanks recall on multi-card questions — then scores official rule excerpts and
+selects at most five. Scoring is semantic-primary: when the embedding-provider seam is
+active the query is embedded and cosine-ranked against a committed per-rule embedding
+vector, with the exact rule-ID and parent rule-ID boost merged in so a cited rule number
+(e.g. "rule 613.9") is still pulled even when semantic similarity misses it. The prior
+IDF-weighted lexical scorer is retained as the mock/offline default, as a component of
+the exact-rule-id boost, and as the fallback whenever query embedding fails — so System 3
+is never worse than its earlier lexical-only behavior. Ties prefer the highest matching
+signal, then ascending rule ID. Before output is selected, System 3 excludes rule IDs
+already selected by System 2, so the prompt does not print the same rule in both `GAME
+RULES (reference)` and `ADDITIONAL RELEVANT RULE EXCERPTS`.
+
+The query embedder is chosen by the `EMBEDDING_PROVIDER` seam (`mock` | `local` |
+`openai`), which mirrors the `ASK_AI_PROVIDER` boundary. `mock` (the default) does no
+embedding and uses lexical only, so the default runs with no model access. `local` (the
+shipped semantic provider) embeds the query in-process with a bundled `all-MiniLM-L6-v2`
+model in ~2ms — no external call, so System 3 keeps its "no per-request external call"
+posture. `openai` is seam-selectable for live mode only and is never the default. The
+per-rule embeddings are a committed offline artifact built alongside
+`gameRulesRuleIndex.json` and rebuilt only on CR refresh; the ~3,432 vectors are searched
+in-process with cosine, with no vector database (REQ-170).

 ## Data flow

@@ -34,11 +50,15 @@ vocabulary. Prompt preparation first collects submitted cards for System 1. It t
 selects System 2 topics from game-state signals and derives the selected curated rule
 IDs from those topics.

-Those curated rule IDs become the exclusion set for System 3. Supplemental retrieval
-tokenizes the question and oracle/context text, applies keyword and IDF resources,
-scores the rule index, drops entries whose rule IDs are already in the System 2 set,
-and returns the top five excerpts plus debug data when mock enrichment diagnostics are
-enabled. Prompt rendering places the resulting sections as curated rules, then
+Those curated rule IDs become the exclusion set for System 3. When a semantic
+embedding provider is active, the async route handler embeds the query first and injects
+the query vector into prompt preparation as an option, so `preparePromptInput` stays
+synchronous. Supplemental retrieval builds the query from the question plus the keyword
+signal, ranks the rule index (cosine over the committed rule embeddings when a query
+vector is present, IDF-weighted lexical otherwise or on embedding failure) with the
+exact-rule-id boost merged in, drops entries whose rule IDs are already in the System 2
+set, and returns the top five excerpts plus debug data when mock enrichment diagnostics
+are enabled. Prompt rendering places the resulting sections as curated rules, then
 supplemental excerpts, then official rulings.

 The output is reference text for the prompt. Missing or unparsable artifacts degrade by
@@ -50,7 +70,8 @@ shape change or a deterministic rules-engine answer.
 - System 1: `apps/backend/src/cardRulings.ts`
 - System 2: `apps/backend/src/gameRulesTopicSelection.ts`, `apps/backend/src/gameRules.ts`
 - System 3: `apps/backend/src/gameRulesRetrieval.ts`
-- System 3 data: `apps/backend/data/gameRulesKeywordVocabulary.json`, `apps/backend/data/gameRulesTokenStats.json`
+- System 3 data: `apps/backend/data/gameRulesKeywordVocabulary.json`, `apps/backend/data/gameRulesTokenStats.json`, `apps/backend/data/gameRulesRuleEmbeddings.json` (committed per-rule vectors, REQ-170)
+- Embedding-provider seam: `EMBEDDING_PROVIDER` flag, mirroring the `ASK_AI_PROVIDER` boundary under `apps/backend/src/providers/`

 ## Worked example

@@ -60,13 +81,15 @@ the request. System 2 sees `turnPhase: combat`, the combat step, and populated z
 it selects the always-on topics plus combat and battlefield-oriented curated topics.
 Those topics render in `GAME RULES (reference)`.

-System 3 then searches the question and card/context text for more specific rule
-excerpts. Tokens from the direct question carry more weight than incidental card text,
-rules-related keywords receive their boost, and any explicit rule number in the query
-can pull in an exact or parent match. If a combat damage rule is already present in the
-System 2 topic set, that rule ID is excluded from System 3 so the supplemental block
-uses its five slots for additional relevant context rather than duplicating the
-baseline.
+System 3 then retrieves more specific rule excerpts. It builds the query from the
+question plus the keyword signal (not raw card oracle text), embeds it with the active
+provider, and cosine-ranks it against the committed rule embeddings so the excerpts that
+actually address deathtouch and combat-damage assignment surface even when they share
+few literal keywords with the question; any explicit rule number in the query still
+pulls in an exact or parent match through the merged boost. If a combat damage rule is
+already present in the System 2 topic set, that rule ID is excluded from System 3 so the
+supplemental block uses its five slots for additional relevant context rather than
+duplicating the baseline.

 System 1 independently checks the submitted card IDs against the rulings index. If one
 of those cards has WotC rulings in the committed data, the rulings block appears after
@@ -82,9 +105,19 @@ reference material and simply omits `OFFICIAL RULINGS`.
 - System 3 is deduplicated against the System 2 selection, so the same rule ID never
   appears once as curated baseline and again as supplemental retrieval.
 - System 3 is capped at five supplemental excerpts per request.
-- Relevance is regression-tested by the eval harness under DEC-047 and REQ-032.
-- Q-001, the System 3 keyword-vocabulary derivation strategy, remains open. This file
-  references that question but does not resolve it.
+- System 3 scoring is semantic-primary (cosine over committed rule embeddings) with the
+  exact-rule-id boost merged in and lexical retained as the mock/offline default and the
+  failure fallback; it is never worse than the prior lexical-only behavior (REQ-170).
+- The shipped semantic path uses a bundled local model, so System 3 keeps its "no
+  per-request external call" posture; only `EMBEDDING_PROVIDER=openai` would add a
+  per-request call, and that is not the default.
+- Relevance is regression-tested by the eval harness under DEC-047 and REQ-032, which
+  measures the semantic path via committed frozen query embeddings — no live embedding
+  or AI call.
+- Q-001, the System 3 keyword-vocabulary derivation strategy, remains open. Semantic
+  retrieval reduces reliance on the hand-derived vocabulary but does not remove it (the
+  vocabulary still feeds the query keyword signal and the exact-rule-id boost); this file
+  flags that interaction and does not resolve Q-001.
 - These systems provide prompt reference context only. They do not validate legality,
   simulate board state, or override submitted zones, stack order, targets, notes, or
   card oracle text.
```

- Verdict: <accept | edit | reject>
- Reason:

---

## quick-lookup/README.md — Retrieval "Built:" lines (amended)

- **What this decides:** Whether the Quick Lookup feature spec's "Built:" lines
  are corrected to describe System 3 as semantic-first with keyword fallback,
  and the query as built from the question + keywords (not raw card text).
- **In plain terms:** This spec currently states, as shipped fact, that System 3
  is keyword-scored and that the lookup query includes every attached card's
  oracle text. Both become false when the semantic change ships. These edits fix
  the two "Built:" lines (in `### Retrieval` and `## Measured bounds`) to match
  the new behavior — semantic-first scoring with keyword retained as the default
  and fallback, and the query built from the question plus the keyword signal.
  This is the fix for the quality-check finding that failed the first pass.
- **What happens if you say no:** the Quick Lookup spec keeps describing
  keyword-only retrieval and contradicts REQ-170/REQ-022; a fresh implementer
  has no sanctioned edit to reconcile it.

```diff
@@ -12,8 +12,8 @@
   DEC-100, DEC-116, DEC-131, DEC-146, DEC-153, REQ-072, REQ-073, REQ-074,
   REQ-075, REQ-079, REQ-091, REQ-092, REQ-094, REQ-095, REQ-097, REQ-098,
   REQ-011, REQ-022, REQ-024, REQ-030, REQ-105, REQ-109, REQ-110, REQ-121,
-  REQ-129, REQ-132, REQ-134, REQ-141, REQ-167, FLOW-006, FLOW-011, FLOW-023,
-  NFR-001
+  REQ-129, REQ-132, REQ-134, REQ-141, REQ-167, REQ-170, FLOW-006, FLOW-011,
+  FLOW-023, NFR-001

 ## What it is

@@ -255,12 +255,15 @@ both providers. (DEC-020, REQ-072)

 ### Retrieval

-- Built: System 3 supplemental rules retrieval (DEC-046) is IDF-scored keyword
-  retrieval over the loaded rule index, excluding the curated rule numbers the
-  always-on core topics already carry, returning a small capped set of the
-  best-scoring rules. For lookup the query is built from the question tokens
-  always, plus every attached card's oracle text and type line (REQ-167).
-  (DEC-046, REQ-022, DEC-107, REQ-167)
+- Built: System 3 supplemental rules retrieval (DEC-046) is semantic-primary
+  when the embedding-provider seam is active (REQ-170) — the query embedding is
+  cosine-ranked against the committed rule embeddings, with the exact-rule-id
+  boost merged in — excluding the curated rule numbers the always-on core topics
+  already carry, returning a small capped set of the best-scoring rules. Lexical
+  scoring is retained as the mock/offline default and the fallback on any
+  embedding failure, so retrieval is never worse than the prior lexical behavior.
+  For lookup the query is built from the question plus the keyword signal, not
+  raw card oracle text. (DEC-046, REQ-022, REQ-170, DEC-107, REQ-167)
 - Built: the always-on core game-rules topics are a fixed curated set
   (stack-and-priority, targets, zones, triggered-ability basics), not the
   state-gated selector the game flow uses — lookup carries no game state to gate
@@ -310,8 +313,11 @@ as the current shipped configuration, not product truth.
   ending with assistant, per-message cap — shared with the main flow, not a
   Quick-Lookup-specific policy. (REQ-072, REQ-075)
 - Retrieval: System 3 returns a small capped best-scoring set (top 5), curated
-  core-topic rule numbers excluded; question tokens always score, plus every
-  attached card's oracle/type tokens (REQ-167). (DEC-046, REQ-022, REQ-167)
+  core-topic rule numbers excluded; scoring is semantic-primary (cosine over the
+  committed rule embeddings) with the exact-rule-id boost merged and lexical
+  retained as the mock/offline default and failure fallback (REQ-170), and the
+  query is built from the question plus the keyword signal, not raw card oracle
+  text. (DEC-046, REQ-022, REQ-170, REQ-167)
 - Card attach cap: the pre-submit card-attach strip accepts at most 5 cards
   (REQ-167); an add attempted past the cap is blocked with a stated limit
   message. (REQ-167, `QuickLookupApp.tsx`)
```

- Verdict: <accept | edit | reject>
- Reason:

---

## in-depth/README.md — Retrieval enrichment "Built:" line (amended)

- **What this decides:** Whether the in-depth (Game Mode) feature spec's
  supplemental-rules "Built:" line is corrected to describe semantic-first
  scoring with keyword fallback.
- **In plain terms:** This spec currently states the supplemental rule excerpts
  are scored by keyword/IDF. These edits fix that one "Built:" line to say
  scoring is semantic-first (cosine over the committed embeddings) with keyword
  retained as the default and fallback, keeping the DEC-046 lineage. Same fix as
  the Quick Lookup one, for the shared System 3 machinery.
- **What happens if you say no:** the Game Mode spec keeps describing
  keyword-only supplemental scoring and contradicts REQ-170/REQ-022.

```diff
@@ -21,8 +21,8 @@
   REQ-028, REQ-029, REQ-030, REQ-031, REQ-032, REQ-033, REQ-045, REQ-056, REQ-058,
   REQ-061, REQ-069, REQ-070, REQ-093, REQ-094, REQ-095, REQ-100, REQ-106,
   REQ-110, REQ-121, REQ-130, REQ-132, REQ-136, REQ-137, REQ-138, REQ-139,
-  REQ-144, FLOW-001, FLOW-002, FLOW-003, FLOW-004, FLOW-005, FLOW-015, NFR-001,
-  NFR-002, NFR-006, NFR-009
+  REQ-144, REQ-170, FLOW-001, FLOW-002, FLOW-003, FLOW-004, FLOW-005, FLOW-015,
+  NFR-001, NFR-002, NFR-006, NFR-009
 - Consumed but owned elsewhere (cited, not re-specified here): the shared
   answered-conversation workspace, View Context overlay, history drawer,
   suite-wide card-detail popup, Menu rail (DEC-122), suite shell, and shared
@@ -327,9 +327,12 @@ the game-mode request drives them. (DEC-020, DEC-010)
   omitted only when the artifact is missing/empty, with a warning logged.
   (DEC-030, DEC-045, REQ-022)
 - Built: `ADDITIONAL RELEVANT RULE EXCERPTS` adds up to 5 supplemental rules
-  scored per DEC-046 (IDF-weighted lexical scoring with question and keyword
-  boosts, deduplicated against the System 2 selection), omitted when nothing
-  scores above 0. (DEC-032, DEC-046, REQ-022)
+  scored per DEC-046 — semantic-primary scoring (cosine over the committed rule
+  embeddings) when the embedding-provider seam is active, with the exact-rule-id
+  boost merged and lexical scoring retained as the mock/offline default and the
+  fallback on any embedding failure (REQ-170), deduplicated against the System 2
+  selection — omitted when nothing scores above 0. (DEC-032, DEC-046, REQ-022,
+  REQ-170)
 - Built: `OFFICIAL RULINGS` carries published WotC Oracle rulings for submitted
   cards. Retrieval relevance (System 2 selection and System 3 recall) is verified
   by the eval harness against labeled expected outcomes, not structural checks
```

- Verdict: <accept | edit | reject>
- Reason:

---

## Blocker questions

None. Refinement resolved every open choice through the assumption ladder (all
recorded in `DESIGN-BRIEF.md`); none met the genuine-blocker test. The provider
question was already settled with measurement before this run. Q-001 (System 3
keyword-vocabulary derivation) is flagged as an interaction, not reopened here.
