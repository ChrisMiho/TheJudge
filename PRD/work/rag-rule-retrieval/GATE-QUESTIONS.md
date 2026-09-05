# Gate questions — rag-rule-retrieval

Answer each block by filling its `- Verdict:` line with `accept`, `edit`, or
`reject`. `edit` and `reject` need a `- Reason:` so the run knows what to change.
Answer on your own schedule; the run stays parked until every slot is filled.

Nothing below is code. This is the product truth you are approving before
anything gets built. The gameplan these slots implement is
`DESIGN-BRIEF.md` — five ordered steps, each with a measurement it must pass.

Reading order, if you want one: the five `REQ-177`…`REQ-181` slots are the
gameplan itself. The four `SCOPE-` slots are the shape decisions inside Step 5.
Everything after that is bookkeeping — existing requirements and spec pages
brought into line so nothing contradicts.

New ids are read from the live files today: `functional-requirements.md` runs to
REQ-176, so this proposal reserves REQ-177 through REQ-181. No new `FLOW-###`
(nothing a player does changes) and no new `DEC-###` (the decision log is
retired).

---

## REQ-177 — Make the recall ruler trustworthy before tuning anything

- **What this decides:** whether the first thing built is a fix to the two tools
  that measure how often Ask AI finds the right rule — because right now they
  disagree with each other, and every later step is judged on their numbers.

- **In plain terms:** when a player asks a rules question, the backend puts five
  Comprehensive Rules excerpts into the prompt. Two tools in this repo check
  whether those are the *right* five. One is the automated gate that runs on
  every pull request (`npm run test:eval`, required by REQ-032 — the requirement
  that says retrieval must be checked against hand-labelled expected rules, not
  just "did a section appear"). The other is the human review report
  (`npm run retrieval:report`, also required by REQ-032, which calls for "a
  digestible before/after relevance report … for tuning review"). Run live on
  2026-09-05, the gate is green and the report says 3 of 9 scenarios fail. They
  are looking at the same fixtures and disagreeing. The cause is located: the
  report builds its card data differently than production does — since REQ-176
  (the backend now looks up a card's rules text itself by oracle id instead of
  trusting what the browser sent), the report passes no card-text index, so every
  card in its fixtures comes through with **blank rules text** and it scores a
  query production would never build. Separately, the 156-question benchmark
  every number in this gameplan comes from lives on an unmerged side branch as
  throwaway scripts, so nobody can re-run it. This requirement fixes the report,
  adds a test so the two can never drift apart again, and commits the benchmark
  as a real offline harness with today's numbers recorded as the baseline. No
  retrieval behaviour changes at all.

- **What happens if you say no:** every recall number in Steps 2 through 5 is
  measured on an instrument that is currently wrong, and the benchmark stays on a
  branch that was closed unmerged.

Current: `PRD/sections/functional-requirements.md` — no such requirement exists;
REQ-176 is the last entry in the file.

Proposed: append after REQ-176 in `PRD/sections/functional-requirements.md`.

```
### REQ-177
- Title: Trustworthy System 3 retrieval measurement
- Priority: high
- Description: The two instruments that measure System 3 supplemental rule recall — the gating eval harness and the human relevance report — must model production retrieval identically and must not be able to drift apart, and the labelled question-to-rule benchmark used to judge retrieval changes must be committed, offline, and reproducible in-repo. No retrieval behaviour changes under this requirement.
- Acceptance Criteria:
  - the relevance report resolves each fixture's card-intrinsic fields by `cardId` through the same card-detail index path the eval harness uses (REQ-176), so both build the same System 3 query for the same fixture
  - an automated test asserts the report and the harness return the same per-scenario System 3 recall verdict for every fixture carrying an `expected` block, and fails the pull request when they diverge; it runs in `quality:check`
  - before/after evidence is recorded: at the time of writing the report reports 3 of 9 labelled scenarios failing (`counterspell-stack`, `quick-lookup-card`, `quick-lookup-multi-card`) while the harness reports all passing; after this change every labelled scenario returns one verdict from both
  - a committed retrieval benchmark harness scores the labelled question-to-rule corpus (156 pairs: 150 synthetic grounded in real CR text plus 6 gold worked-solution cases) for recall@5 and MRR, under both a clean query and a query polluted with attached-card text, and writes a machine-readable result file
  - the benchmark runs offline and deterministically — no live AI provider call and no live embedding call — consistent with REQ-032's no-live-call constraint
  - the benchmark's current lexical result is recorded as the committed baseline that later retrieval changes are measured against; every subsequent retrieval requirement states its gate relative to a recorded baseline, never to a number derived by proportion
- Constraints:
  - measurement-only: no change to System 3 query construction, scoring, corpus, or output; the prompt text produced for every existing fixture is byte-identical before and after
  - the benchmark is committed evaluation data and tooling; it never becomes runtime prompt context and adds no runtime dependency or external call
  - the eval harness remains the gate; the relevance report remains a review aid whose exit code is advisory
- Dependencies:
  - REQ-032 (the relevance-measurement requirement this repairs)
  - REQ-176 (server-side card-text resolution, whose landing caused the report/harness divergence)
  - DEC-047 (the eval harness and labelled-outcome evaluation)
- Notes:
  - located in code: `apps/backend/src/eval/retrievalReportInputs.ts` calls `buildPromptContext(request)` and `preparePromptInput(request, …)` with no `cardDetailIndex`, while `apps/backend/src/eval/contextEvaluationHarness.test.ts` builds one per fixture (`cardDetailIndexFromRequest`)
  - this is Step 1 of the RAG gameplan; Steps 2–5 (REQ-178, REQ-179, REQ-180, REQ-181) each state their gate against the baseline this requirement records
  - the benchmark corpus and scoring logic originate from a throwaway harness on `origin/explore/semantic-rule-retrieval` (`PRD/work/combo-context-validation/harness/rag/`); committing it in-repo is the point of this requirement
```

- Verdict: accept
- Reason:

---

## REQ-178 — Stop drowning the question in card text

- **What this decides:** whether the backend stops shovelling every attached
  card's full rules text into the rule search, and searches on the question plus
  a short card signal instead.

- **In plain terms:** in Quick Question a player can attach up to five cards
  (REQ-167 — the requirement that let Quick Question hold more than one card).
  The backend then searches the Comprehensive Rules using the player's question
  *plus every one of those cards' complete rules text*. A five-card board
  contributes 30 to 100 words of card text against a 5 to 15 word question, so
  the cards drown the question and the search finds rules that match the cards'
  vocabulary rather than the thing being asked. Measured: the right rule reached
  the top five 58% of the time on a plain question and **2.6% of the time** when
  card text was in the query — 4 hits out of 156. That is exactly the "how do
  these cards combo" case. This changes the search query to the question plus a
  compact card signal — each card's name, type line, and keyword list — which is
  enough to know what the cards are without burying the question. The prompt the
  model reads is unchanged; only the internal search query changes. This is the
  single biggest measured improvement in the gameplan and it needs no new
  technology.

- **What happens if you say no:** attaching cards keeps making rule retrieval
  worse rather than better, and Step 5's semantic upgrade inherits the same
  flood — a meaning-based search built from the same polluted query drops from
  86.5% to 76.3% for the same reason.

Current: `PRD/sections/functional-requirements.md` — no such requirement exists.

Proposed: append after REQ-177.

```
### REQ-178
- Title: System 3 retrieval query is built from the question plus a compact card signal
- Priority: high
- Description: The System 3 supplemental-rules search query is built from the player's question plus a compact per-card signal — each submitted or attached card's name, type line, and keyword list — instead of the question plus every card's full oracle text, context notes, zone ids, and turn phase. The assembled prompt is unchanged; only the internal retrieval query changes.
- Acceptance Criteria:
  - the retrieval query carries the player's question and, per card, that card's name, type line, and keyword list; it no longer concatenates full oracle text or context notes into the query
  - the change applies to both game mode and lookup mode, through the one shared retrieval path (no second implementation)
  - the assembled prompt text is unchanged by this requirement: card oracle text still renders in its own card sections exactly as today, and the supplemental section still carries up to 5 excerpts
  - measured on the committed benchmark (REQ-177), multi-card recall@5 lands within 0.10 of the same build's clean-query recall@5
  - measured on the committed benchmark, clean-query recall@5 does not regress below the REQ-177 baseline
  - the labelled eval fixtures and the relevance report are re-run and their new expected outcomes are re-labelled by hand where retrieval legitimately improves — never by copying current scorer output (REQ-032)
- Constraints:
  - backend and prompt-internal only; no `AskAiRequest` change, no Zod schema change, no frontend change, no new endpoint
  - the acceptance gate is stated as a gap between two numbers measured on the same build, not as an absolute floor derived by proportion; absolute recall figures are recorded as evidence
  - keyword lists come from the signal available at the time this ships (the committed keyword vocabulary); REQ-180 later replaces that source with per-card Scryfall keywords without changing this requirement's shape
- Dependencies:
  - REQ-177 (the benchmark and repaired report this gate is measured on)
  - REQ-022 (the System 3 enrichment requirement this narrows the query for)
  - REQ-167 (multi-card lookup, whose attached-card set feeds the query)
  - REQ-074 (lookup prompt assembly)
- Notes:
  - this is Step 2 of the RAG gameplan and is independent of embeddings: a semantic query built from the same polluted input inherits the same flood (measured: semantic drops 0.885 clean to 0.603 polluted)
  - located in code: `buildQueryParts` in `apps/backend/src/gameRulesRetrieval.ts` currently appends turn phase, zone ids, and every card's name, type line, oracle text, and context notes
```

- Verdict: accept
- Reason:

---

## REQ-179 — Clean the junk out of the rule index

- **What this decides:** whether the build strips the Comprehensive Rules table
  of contents and bare heading lines out of the searchable rule index, and stops
  showing a rule twice.

- **In plain terms:** the rule index is built by scanning the official
  Comprehensive Rules text file for numbered headings. The file opens with a
  table of contents that lists every section heading — and the build has no guard
  for it, so those lines become searchable "rules" that shadow the real ones.
  Counted live on 2026-09-05: the index holds 3,432 entries but only 3,285
  distinct rule numbers, so **147 are duplicates**, and **626 entries are shorter
  than 60 characters** — mostly bare headings like `702.19. Trample` whose actual
  definition lives in a separate entry. Junk entries hurt twice: they win ties on
  short questions, and they distort the word-rarity statistics the whole scorer
  weighs by. Separately, when the prompt's curated rules block already shows rule
  `603.1`, the supplemental block is told to skip `603.1` — but not `603.1a`, so
  the same rule can appear twice in one prompt. That becomes a prefix match.

- **What happens if you say no:** roughly one entry in seven of the searchable
  corpus stays junk that can only ever win by accident, and Step 5 embeds the
  junk along with the real rules.

Current: `PRD/sections/functional-requirements.md` — no such requirement exists.

Proposed: append after REQ-178.

```
### REQ-179
- Title: Comprehensive Rules index hygiene
- Priority: medium
- Description: The committed Comprehensive Rules index excludes the source document's table of contents and heading-only entries, so every searchable entry carries real rule text; and System 3's exclusion of rules already shown in the curated baseline matches by rule-number prefix rather than exact id, so a curated parent rule no longer lets its own lettered sub-rules reappear as supplemental excerpts.
- Acceptance Criteria:
  - the build skips the source document's table of contents; the built index contains zero duplicate rule ids (measured before this change on 2026-09-05: 3,432 entries, 3,285 distinct ids, 147 duplicates)
  - the build omits heading-only entries — an entry whose text is nothing but its own numbered heading — so no searchable entry lacks rule content (measured before this change: 626 entries under 60 characters, of which the heading-only subset is the target; the build test names the exact count it removed)
  - a build test asserts both properties and fails when a future Comprehensive Rules refresh reintroduces either
  - System 3 excludes a candidate rule when its id or any of its parent rule ids is already selected by the curated baseline, replacing today's exact-id-only exclusion
  - measured on the committed benchmark (REQ-177), clean and multi-card recall@5 do not regress below the values recorded after REQ-178
  - `npm run test:eval` stays green; any golden prompt change is an intentional, reviewed consequence of removing a junk excerpt, never a silent update
- Constraints:
  - build-time and retrieval-internal only; no request, response, or frontend change
  - the raw Comprehensive Rules source stays gitignored and human-approval-gated for refresh, unchanged
  - the build's existing graceful degradation is preserved: a missing or unparsable source keeps the prior committed artifacts and exits 0
- Dependencies:
  - REQ-177 (the benchmark this no-regression gate is measured on)
  - REQ-022 (the System 3 enrichment requirement whose corpus this cleans)
- Notes:
  - this is Step 3 of the RAG gameplan; it improves the current word-overlap scorer immediately (fewer junk entries, cleaner word-rarity statistics) and is a prerequisite for REQ-181, which would otherwise embed 147 near-identical duplicate documents
  - the deeper chunking work — folding a keyword's sub-rules into one document, prefixing an orphan sub-rule with its parent sentence, splitting fused examples — shapes what gets embedded rather than what gets printed, and belongs to REQ-181
```

- Verdict: accept
- Reason:

---

## REQ-180 — Use the keyword list Scryfall already gives us

- **What this decides:** whether the backend starts carrying each card's real
  keyword list from Scryfall, instead of guessing at mechanics with a
  hand-written 20-word list — and whether that answers open question Q-001.

- **In plain terms:** to know that a question is about deathtouch or cascade, the
  backend today scans the card's rules text against a hand-curated list of 20
  words kept in a file. Scryfall — the card data source this project already
  builds from — ships a clean, complete `keywords` array on every card, and the
  build throws it away: it keeps 10 of 62 available fields. This adds `keywords`
  to the **backend** card corpus (the server-side card-detail file, not the list
  the browser downloads) and feeds it as the keyword signal that REQ-178's
  compact query is built from. The direction matters: the backend corpus carries
  more, the browser's first-load download carries nothing new, so the first-load
  size gate stays exactly where it is. This is also the answer to open question
  **Q-001** — "how should the System 3 keyword vocabulary be derived and
  maintained long-term?" — by the very option Q-001 already lists.

- **What happens if you say no:** the keyword signal stays a 20-word hand-list
  that goes stale every set release, Q-001 stays open indefinitely, and the two
  labelled deathtouch fixtures keep missing their expected rule.

Current: `PRD/sections/functional-requirements.md` — no such requirement exists.

Proposed: append after REQ-179.

```
### REQ-180
- Title: Per-card Scryfall keywords feed the System 3 keyword signal
- Priority: medium
- Description: The committed backend card-detail artifact carries each card's Scryfall `keywords` array, and System 3's keyword signal is derived from those per-card keywords unioned at query time rather than from tokenizing oracle text against a hand-curated static vocabulary. The frontend's up-front card list is unchanged.
- Acceptance Criteria:
  - the card-data build writes each card's Scryfall `keywords` array into the committed backend card-detail artifact (`cardDetailByOracleId.json`), alongside the fields it already resolves server-side (REQ-176)
  - System 3's keyword signal for a request is the union of the submitted or attached cards' keywords, resolved server-side by `cardId`, plus any keyword the question itself names; the hand-curated static vocabulary is retained only as the source for question-text keyword detection, no longer as the per-card inference path
  - the up-front `cardMetadata.json` the frontend downloads gains no field and its gzipped size is unchanged, so NFR-019's first-load gate (the trimmed artifact must be at least 40% smaller gzipped than the prior combined 16.4 MB artifact) is untouched
  - the keyword-heavy labelled fixtures retrieve their expected rules: `quick-lookup-card` and `quick-lookup-multi-card`, whose expected supplemental rule `702.2b` (deathtouch) the production retrieval path misses today
  - measured on the committed benchmark (REQ-177), clean and multi-card recall@5 do not regress below the values recorded after REQ-179
  - this requirement records the answer to Q-001; `open-questions.md` is updated in the same change
- Constraints:
  - the backend corpus carries more, the browser payload carries less: no Scryfall field added here reaches the up-front frontend download or the request wire
  - no new runtime Scryfall fetch; keywords come from the committed artifact, refreshed only through the existing human-approved `data:refresh` chain
  - no request, response, or frontend change
- Dependencies:
  - REQ-176 (the server-side card-detail artifact this extends)
  - REQ-178 (the compact query this signal feeds)
  - REQ-177 (the benchmark this no-regression gate is measured on)
  - NFR-019 (the first-load payload gate this must not disturb)
  - Q-001 (the open question this answers)
- Notes:
  - this is Step 4 of the RAG gameplan
  - measured evidence: the Scryfall bulk record carries 62 fields and the card-metadata build keeps 10, dropping `keywords` — the exact field Q-001 names as the strongest option
  - power, toughness, and loyalty are also dropped by the same build step and would remove a large class of "does this damage kill it" guesswork; that is card-data work, not retrieval, and is deliberately out of this gameplan's scope
```

- Verdict: accept
- Reason:

---

## REQ-181 — Pick rules by meaning, not word overlap

- **What this decides:** whether the supplemental rules block starts finding
  rules by what they *mean* rather than which rare words they share with the
  question — by shipping a small language model inside the backend and a
  committed file of pre-computed rule vectors.

- **In plain terms:** today the backend counts shared rare words. That finds the
  right rule 58% of the time on a clean question. The upgrade: every rule in the
  index is turned once, offline, into a list of 384 numbers that positions its
  meaning in space — an *embedding* — and the result is committed next to the
  rule index. When a player asks something, their question is turned into the
  same kind of list **inside the backend process, in about 2 milliseconds, with
  no internet call**, and the closest rules win. Measured on the same 156-question
  benchmark, that scores 86.5% clean and 76.3% with cards attached, against 58%
  and 2.6% today. Four choices keep this small, and each one is a separate slot
  below so you rule on it on its own: only rules are searched this way
  (SCOPE-A); the model is bundled and local rather than an internet service
  (SCOPE-B); there is no vector database (SCOPE-C); and word-overlap search is
  kept, never removed (SCOPE-D). Because the model is bundled, the promise that
  answering a question makes no extra network call is **preserved, not reversed**
  — that is the whole simplification the local choice buys. This step also shapes
  what gets embedded: a keyword's scattered sub-rules fold into one
  self-contained document, an orphaned lettered sub-rule is prefixed with its
  parent sentence, and fused `Example:` text is split out of the vector while
  still printing in the prompt.

- **What happens if you say no:** rule retrieval stays word-overlap forever, the
  four earlier steps still improve it substantially, and the measured 58%-to-86.5%
  jump is not taken.

Current: `PRD/sections/functional-requirements.md` — no such requirement exists.

Proposed: append after REQ-180. The four corpus-scope constraints this
requirement depends on are ruled on in slots SCOPE-A through SCOPE-D below and
land in this same Constraints list; they are written once, there, so there is a
single source for each.

```
### REQ-181
- Title: Semantic rule retrieval for System 3
- Priority: high
- Description: System 3 supplemental rule retrieval ranks Comprehensive Rules excerpts by semantic similarity between the player's question and the rule corpus, not by lexical word overlap alone. A committed offline artifact holds one embedding vector per rule; at request time the query is embedded and cosine-ranked against those vectors to fill System 3's existing five-excerpt slot. The query embedder is selected by an explicit provider flag that mirrors the existing `ASK_AI_PROVIDER` boundary.
- Acceptance Criteria:
  - a committed offline artifact in `apps/backend/data/` holds one embedding vector per entry in `gameRulesRuleIndex.json`, built by an offline step alongside `build-game-rules.mjs` and rebuilt only on a Comprehensive Rules refresh
  - a new `EMBEDDING_PROVIDER` flag selects the query embedder with values `mock` | `local` | `openai`; the default when unset is `mock`, and it never auto-switches on `NODE_ENV` or deploy target, mirroring `ASK_AI_PROVIDER`
  - `EMBEDDING_PROVIDER=mock` performs no embedding and makes no external call; System 3 uses lexical retrieval only, so a checkout with no model access and no network behaves exactly as before
  - `EMBEDDING_PROVIDER=local` embeds the query in-process with the bundled model and cosine-ranks it against the committed rule vectors
  - `EMBEDDING_PROVIDER=openai` is seam-selectable for live mode only and is never the default
  - the async route handler embeds the query and passes the resulting vector (or null) into prompt preparation as an option, so `preparePromptInput` stays synchronous
  - the exact-rule-id and parent-rule-id boost is merged with the semantic ranking, so a question citing a rule number by name (for example "rule 613.9") still pulls that rule even when semantic similarity misses it — measured on the benchmark, gold rule 613.9 ranks 1st lexically and 5th semantically
  - on any embedding failure — model load, inference error, missing artifact, provider error — System 3 falls back to lexical retrieval, still returns up to 5 excerpts, and emits one diagnostic warning
  - embedding text is shaped for meaning before vectors are built: a keyword ability's numbered sub-rules are folded into one self-contained document, an orphaned lettered sub-rule's embedding text is prefixed with its parent rule's sentence, and fused `Example:` text is excluded from the embedded text while still rendering in the prompt
  - System 3 remains capped at 5 excerpts, still deduplicated against the curated System 2 selection by rule-number prefix (REQ-179)
  - the shipped quantised model's clean and multi-card recall@5 are re-measured on the committed benchmark (REQ-177) against the full-precision reference of 0.865 clean / 0.763 multi-card; a material drop ships the full-precision model by container image instead of the quantised package
  - the eval measures the semantic path using committed frozen query vectors, so `system3-expected-recall` and `system3-noise-excluded` run with no live embedding call and no live AI call
  - the deploy package budget test (NFR-017) is green with the bundled model and the embeddings artifact present
- Constraints:
  - backend and prompt-internal only; no `AskAiRequest` change, no Zod schema change, no frontend change, no new endpoint
  - the raw model download and any oversized full-precision vector blob are gitignored and never committed; only the trimmed committed vectors ship
  - NFR-002's under-3-second answer target holds; an in-process query embedding adds about 2 milliseconds
  - [the four corpus-scope constraints from SCOPE-A, SCOPE-B, SCOPE-C and SCOPE-D land here]
- Dependencies:
  - REQ-177 (the committed benchmark this is gated on)
  - REQ-178 (the query-construction fix this inherits — a semantic query built from polluted input inherits the same flood)
  - REQ-179 (the cleaned corpus this embeds)
  - REQ-180 (the keyword signal that feeds the query and the merged boost)
  - REQ-022 (the System 3 enrichment behaviour this mechanism serves)
  - REQ-032 (the offline eval this extends)
  - NFR-017 (the deploy package budget this consumes)
  - NFR-002 (the latency target)
- Notes:
  - this is Step 5 of the RAG gameplan, the end state
  - the parked mechanic-definition corpus idea reuses this machinery but is a different feature — a new corpus and a new prompt section — and is not built here
  - no hybrid lexical-plus-semantic fusion score was ever measured; this requirement merges the exact-rule-id boost with semantic ranking rather than claiming a measured fusion result
```

- Verdict: accept
- Reason:

---

## SCOPE-A — Only rules get searched by meaning

- **What this decides:** whether meaning-based search covers the Comprehensive
  Rules only, leaving cards, official rulings, and combos as exact-id lookups.

- **In plain terms:** the prompt is fed from four corpora. Comprehensive Rules
  are *searched* — the backend has to decide which five of 3,432 rules are
  relevant. The other three are not searched at all: a card's official WotC
  rulings, its metadata, and its Commander Spellbook combos are all fetched by
  the card's exact oracle id, which is already perfectly accurate. Extending
  meaning-based search to them would mean embedding 76,605 rulings and roughly
  106,000 combo variants — over 20 times the vector volume, for lookups that
  already never miss. This says: rules only.

- **What happens if you say no:** the scope of what gets embedded is left open,
  which is the decision that would turn a bundled in-memory approach into an
  infrastructure project.

Current: no such statement exists in `PRD/sections/`.

Proposed: added to REQ-181's `Constraints` list in
`PRD/sections/functional-requirements.md`.

```
  - semantic retrieval scope is the Comprehensive Rules corpus only; cards, WotC rulings, and Commander Spellbook combos remain exact-id keyed lookups and are never embedded or semantically searched under this requirement
```

- Verdict: accept
- Reason:

---

## SCOPE-B — A small model bundled in the backend, not an internet call

- **What this decides:** whether the player's question is turned into a meaning
  vector by a small model shipped inside the backend, or by calling OpenAI.

- **In plain terms:** the rule corpus is pre-computed offline either way. The
  only live work is turning the player's question into a vector. Two candidates
  were measured on the same 156-question benchmark. The bundled local model
  (`all-MiniLM-L6-v2`) scored 86.5% clean and **76.3%** with cards attached.
  OpenAI's `text-embedding-3-small` scored 88.5% clean and **60.3%** with cards
  attached. Local ties it clean and beats it clearly on the hard case. Local runs
  in about 2 milliseconds against OpenAI's roughly 250 millisecond round trip.
  Cost rules nothing out — both are under a dollar a month at half a million
  questions. The decisive point is different: a bundled model works with no
  network at all, so the mock default keeps running with no model access, and the
  standing promise that answering a question adds no external call is
  **preserved rather than reversed**. A third model, `bge-small-en-v1.5`, was
  measured and lost badly on the hard case (36.5%). Note that a dedicated
  always-on host such as SageMaker or ECS would cost hundreds a month idle — that
  is explicitly not what this is; the model runs inside the process that already
  exists.

- **What happens if you say no:** either the query embedding becomes a
  per-request OpenAI call — which reverses the no-external-call promise and
  leaves offline mode stuck on word overlap — or Step 5 does not ship.

Current: no such statement exists in `PRD/sections/`.

Proposed: added to REQ-181's `Constraints` list.

```
  - the shipped semantic provider is a small embedding model bundled in the answer process and run in-process (`all-MiniLM-L6-v2`, 384 dimensions, quantised), not a hosted service and not a per-request external call; System 3's no-per-request-external-call posture is preserved by this choice rather than reversed, and only `EMBEDDING_PROVIDER=openai` would add such a call, which is never the default. A dedicated always-on inference host is out of scope
```

- Verdict: accept
- Reason:

---

## SCOPE-C — No vector database

- **What this decides:** whether the rule vectors live in memory inside the
  existing backend, or in a separate database built for vector search.

- **In plain terms:** there are 3,432 rules. At 384 numbers each, the whole set
  is about 5.3 megabytes — small enough to load at startup like the rule index
  already is, and to compare directly against the question's vector on every
  request. A vector database is infrastructure you add when the collection is too
  big to hold, which for this project would mean extending search to cards,
  rulings, and combos: over 150,000 vectors. SCOPE-A says that is not happening.
  So: no new database, no new service, no new operational surface.

- **What happens if you say no:** a new piece of always-on infrastructure enters
  a project whose stated architecture is one small backend with no storage layer.

Current: no such statement exists in `PRD/sections/`.

Proposed: added to REQ-181's `Constraints` list.

```
  - no vector database and no new storage service: the rule vectors are loaded in-process alongside the rule index and cosine-searched directly. A hosted vector store would only be justified if semantic search later spanned cards, rulings, and combos (over 150,000 vectors), which SCOPE-A excludes
```

- Verdict: accept
- Reason:

---

## SCOPE-D — Word-overlap search is kept, never removed

- **What this decides:** whether the existing word-overlap search stays in place
  as the offline default, as a booster for questions that cite a rule by number,
  and as the fallback if embedding fails.

- **In plain terms:** meaning-based search is better on average and worse in one
  specific way: it does not reliably catch a player who writes "what does rule
  613.9 say?" On the benchmark, that exact case ranked 1st by word overlap and
  5th by meaning. So word overlap is retained three ways. It is what runs when
  the provider flag is `mock`, which is the default and must work with no model
  access — the mock-first rule this project holds as canonical. It supplies the
  exact-rule-number boost, merged into the ranking. And it is the fallback if the
  model fails to load or the embedding errors. The consequence: System 3 is never
  worse than it is today, under any failure.

- **What happens if you say no:** either the word-overlap path is removed —
  breaking the mock default and losing cited-rule-number lookups — or its role is
  left unstated and a future implementer may quietly drop it.

Current: no such statement exists in `PRD/sections/`.

Proposed: added to REQ-181's `Constraints` list.

```
  - lexical retrieval is retained and never removed: it is the retrieval path under `EMBEDDING_PROVIDER=mock` (the default, which must run with no model access — canonical mock-first rule, `integrations-and-data.md` Tech Stack), it supplies the exact-rule-id and parent-rule-id boost merged into semantic ranking, and it is the fallback on any embedding failure. System 3 is therefore never worse than its prior lexical-only behaviour under any provider setting or failure mode
```

- Verdict: accept
- Reason:

---

## REQ-022 — The supplemental-rules requirement learns the new mechanism

- **What this decides:** whether REQ-022, the requirement that governs how the
  supplemental rules block behaves, records the new query construction, the
  cleaned corpus, and meaning-based scoring with word overlap kept underneath.

- **In plain terms:** REQ-022 is the requirement that says every prompt gets a
  curated rules block plus up to five supplemental excerpts scored against the
  request. It is the source of truth every feature spec cites for that block.
  These edits record three things it does not say today: the retrieval query is
  built from the question plus a compact card signal rather than raw card text
  (REQ-178); scoring is meaning-first with word overlap kept as the offline
  default, the cited-rule-number booster, and the failure fallback (REQ-181); and
  the standing promise of no per-request external call is *preserved* by the
  bundled model, not reversed.

- **What happens if you say no:** REQ-022 keeps describing word-overlap-only
  scoring over a query stuffed with card text, and every spec page that cites it
  inherits a description that no longer matches the product.

Current: `PRD/sections/functional-requirements.md`, REQ-022 — the tail of its
`Acceptance Criteria`, its `Constraints`, its `Dependencies`, and its `Notes`.

```
  - supplemental rules are excluded from the curated baseline set (deduplicated against selected System 2 topic rule numbers)
  - supplemental section appears after `GAME RULES (reference)` and before `OFFICIAL RULINGS`
  - supplemental section omitted when index missing, empty, or no rules score above 0
  - eval fixtures assert labeled supplemental recall per REQ-032
- Constraints:
  - prompt-only and backend-only; no `AskAiRequest`, Zod schema, or frontend changes
  - no paraphrased rule text
  - no runtime CR or Scryfall fetch per request
  - System 2 selection uses only card-agnostic game-state signals (`turnPhase`, `combatStep`, populated zones); no card names, oracle text, or keywords
  - System 3 owns all card/question-driven retrieval including oracle-keyword signals
- Dependencies:
  - DEC-045
  - DEC-046
  - REQ-032
- Notes:
  - supersedes REQ-022 acceptance criteria that required all curated topics on every request
```

Proposed:

```
  - supplemental rules are excluded from the curated baseline set (deduplicated against selected System 2 topic rule numbers by rule-number prefix, so a curated parent rule also excludes its lettered sub-rules — REQ-179)
  - supplemental section appears after `GAME RULES (reference)` and before `OFFICIAL RULINGS`
  - supplemental section omitted when index missing, empty, or no rules score above 0
  - eval fixtures assert labeled supplemental recall per REQ-032
  - the System 3 retrieval query is built from the player's question plus a compact per-card signal — name, type line, and keyword list — not from raw concatenated card oracle text (REQ-178)
  - System 3 scoring is semantic-primary when the embedding-provider seam is active (REQ-181): the query embedding is cosine-ranked against the committed rule embeddings with the exact-rule-id and parent-rule-id boost merged in. Lexical scoring is retained as the mock/offline default and as the fallback on any embedding failure, so retrieval is never worse than the prior lexical-only behaviour
- Constraints:
  - prompt-only and backend-only; no `AskAiRequest`, Zod schema, or frontend changes
  - no paraphrased rule text
  - no runtime CR or Scryfall fetch per request
  - no per-request external call for System 3 query embedding in the default (`mock`) or shipped-semantic (`local`) modes; the no-per-request-external-call posture is preserved by the bundled local model (REQ-181), not reversed — only `EMBEDDING_PROVIDER=openai` would add one, and it is never the default
  - System 2 selection uses only card-agnostic game-state signals (`turnPhase`, `combatStep`, populated zones); no card names, oracle text, or keywords
  - System 3 owns all card/question-driven retrieval including oracle-keyword signals
- Dependencies:
  - DEC-045
  - DEC-046
  - REQ-032
  - REQ-178 (retrieval query construction)
  - REQ-179 (rule-index hygiene and prefix-based curated exclusion)
  - REQ-181 (semantic retrieval mechanism: embeddings artifact, provider seam, runtime query-embed, lexical fallback)
- Notes:
  - supersedes REQ-022 acceptance criteria that required all curated topics on every request
  - System 3's scoring mechanism moves from lexical-only to semantic-primary with lexical fallback under REQ-181; the section's placement, five-excerpt cap, and System 2 deduplication are unchanged
```

- Verdict: accept
- Reason:

---

## REQ-032 — The retrieval eval measures the new path, still with no live calls

- **What this decides:** whether the automated retrieval check grades the new
  meaning-based path — using pre-frozen question vectors so it still makes no
  live call — and whether it gains a test that stops its review report from
  drifting away from it again.

- **In plain terms:** REQ-032 is the requirement that says retrieval quality is
  checked against hand-labelled expected rules rather than "did a section
  appear", that `npm run test:eval` is the gate, and that a readable before/after
  report exists for tuning review. Three additions. The eval grades the semantic
  path using question vectors frozen and committed to the repo, so it adds no
  live embedding call and no live AI call and stays deterministic. The report and
  the gate must return the same verdict per scenario, enforced by a test —
  because they do not today. And a committed offline benchmark of labelled
  question-to-rule pairs becomes the standing measure that retrieval changes are
  judged on.

- **What happens if you say no:** the semantic path ships with no automated
  relevance regression gate, and the tuning report keeps disagreeing with the
  gate it is supposed to explain.

Current: `PRD/sections/functional-requirements.md`, REQ-032 — its
`Acceptance Criteria` tail, `Constraints`, `Dependencies`, and `Notes`.

```
  - harness check `system3-noise-excluded` passes when no `forbiddenSupplementalRuleIds` entry appears in System 3 top-5
  - scenario fixtures cover the signal taxonomy: stack-resolution (e.g. counterspell), combat-damage/deathtouch, upkeep-trigger, keyword interaction (extend `cascade-keyword`), out-of-manifest SBA (extend `state-based-actions`)
  - a digestible before/after relevance report is available for tuning review (one table per scenario: System 2 topics selected, System 3 top-5 with scores, recall hit/miss); may be a script output or harness report artifact
  - existing structural checks (section presence, ordering, budget) remain unchanged
  - `npm run test:eval` remains the automated regression gate
- Constraints:
  - no live AI provider calls in relevance checks
  - expected rule IDs are human-labeled ground truth, not inferred from current scorer output
  - do not assert full prompt golden text for relevance scenarios unless structural sections change intentionally
- Dependencies:
  - DEC-047
  - REQ-022
- Notes:
  - replaces reliance on manual multi-file `prompt:preview` review as the sole relevance verification path
```

Proposed:

```
  - harness check `system3-noise-excluded` passes when no `forbiddenSupplementalRuleIds` entry appears in System 3 top-5
  - scenario fixtures cover the signal taxonomy: stack-resolution (e.g. counterspell), combat-damage/deathtouch, upkeep-trigger, keyword interaction (extend `cascade-keyword`), out-of-manifest SBA (extend `state-based-actions`)
  - a digestible before/after relevance report is available for tuning review (one table per scenario: System 2 topics selected, System 3 top-5 with scores, recall hit/miss); may be a script output or harness report artifact
  - the relevance report and the eval harness model production retrieval identically — same card-detail resolution, same query construction — and a test asserts they return the same per-scenario recall verdict for every labelled fixture, failing the pull request when they diverge (REQ-177)
  - a committed offline benchmark of labelled question-to-rule pairs records recall@5 and MRR under clean and card-polluted queries, and is the standing measure retrieval changes are judged against (REQ-177)
  - `system3-expected-recall` and `system3-noise-excluded` run against the semantic retrieval path (REQ-181) using committed frozen query embeddings, so the eval measures semantic retrieval with no live embedding call and no live AI call
  - existing structural checks (section presence, ordering, budget) remain unchanged
  - `npm run test:eval` remains the automated regression gate
- Constraints:
  - no live AI provider calls in relevance checks, and no live embedding calls — the semantic path is evaluated via committed frozen query embeddings so the eval stays offline and deterministic
  - expected rule IDs are human-labeled ground truth, not inferred from current scorer output
  - do not assert full prompt golden text for relevance scenarios unless structural sections change intentionally
- Dependencies:
  - DEC-047
  - REQ-022
  - REQ-177 (report/harness parity and the committed benchmark)
  - REQ-181 (the semantic retrieval path this eval now measures)
- Notes:
  - replaces reliance on manual multi-file `prompt:preview` review as the sole relevance verification path
  - the report/harness parity criterion exists because the two diverged in practice: after REQ-176 moved card-text resolution server-side, the report stopped passing a card-detail index and reported three false scenario failures while the gate stayed green
```

- Verdict: accept
- Reason:

---

## REQ-074 — Quick Question's assembly line stops saying "scored against the card"

- **What this decides:** whether the Quick Question prompt-assembly requirement
  records that the rule search uses a compact card signal, not the card's full
  rules text.

- **In plain terms:** REQ-074 is the requirement that describes how a Quick
  Question prompt gets built — always a static reference block, always the
  always-on core rules topics, always supplemental rule retrieval, plus per-card
  detail when cards are attached. One of its acceptance lines says the
  supplemental search is "scored against the card as well as the question". After
  REQ-178 that is still true in spirit but wrong in detail: the search uses the
  card's name, type line, and keywords, not its full rules text. One line
  corrected.

- **What happens if you say no:** the Quick Question assembly requirement
  contradicts REQ-178 about what actually goes into the search.

Current: `PRD/sections/functional-requirements.md`, REQ-074, second acceptance
criterion.

```
  - when a card is attached, the assembled prompt additionally includes that card's full metadata including oracle text using the same per-card formatting as populated-zone cards (REQ-030), that card's WotC rulings (DEC-029), and System 3 scored against the card as well as the question
```

Proposed:

```
  - when a card is attached, the assembled prompt additionally includes that card's full metadata including oracle text using the same per-card formatting as populated-zone cards (REQ-030), that card's WotC rulings (DEC-029), and System 3 scored against the question plus a compact signal for each attached card — name, type line, and keyword list — rather than the card's full oracle text (REQ-178)
```

- Verdict: accept
- Reason:

---

## REQ-167 — Multi-card Quick Question stops promising the whole oracle text goes into the search

- **What this decides:** whether the multi-card Quick Question requirement
  records the corrected search query.

- **In plain terms:** REQ-167 is the requirement that let Quick Question hold up
  to five cards instead of one. One of its acceptance lines promises that the
  supplemental rule search "scores the question plus every attached card's oracle
  text and type line" — which is precisely the behaviour measured as dropping
  recall to 2.6%. This corrects the line to the compact signal. Nothing else
  about REQ-167 changes: the five-card cap, the per-card metadata and rulings,
  and the combo behaviour are untouched.

- **What happens if you say no:** the requirement that introduced multi-card
  lookup keeps promising the exact query construction REQ-178 removes.

Current: `PRD/sections/functional-requirements.md`, REQ-167, third acceptance
criterion.

```
  - Backend enrichment runs per attached card: each card's full metadata (same per-card formatting as populated-zone cards, DEC-042/REQ-030) and each card's WotC rulings (DEC-029) appear; System 3 supplemental retrieval (DEC-046/REQ-022) scores the question plus every attached card's oracle text and type line.
```

Proposed:

```
  - Backend enrichment runs per attached card: each card's full metadata (same per-card formatting as populated-zone cards, DEC-042/REQ-030) and each card's WotC rulings (DEC-029) appear; System 3 supplemental retrieval (DEC-046/REQ-022) scores the question plus a compact signal for every attached card — name, type line, and keyword list. It no longer scores over each card's full oracle text, which was measured to drop supplemental recall@5 from 0.577 to 0.026 on a labelled benchmark (REQ-178).
```

- Verdict: accept
- Reason:

---

## REQ-168 — Repoint a citation to a file that no longer exists

- **What this decides:** whether a note in REQ-168 stops pointing at a deleted
  file.

- **In plain terms:** REQ-168 is the requirement that stopped the Quick Question
  guardrail from refusing everyday Magic words like "combo" as if they were not
  Magic. Its notes correctly split that fix from a larger parked idea — always
  injecting a written definition of every relevant mechanic into the prompt — and
  point at `PRD/work/prompt-context-refinement/RAG-DEFERRED.md` for where that
  idea lives. **That file was deleted when its work package closed.** The citation
  has been dangling ever since. This repoints it to where the idea actually lives
  now: preserved in this package's intake, and named as a non-goal of the RAG
  gameplan that will eventually own it.

- **What happens if you say no:** live product truth keeps citing a path that
  does not exist, and the parked idea has no findable home.

Current: `PRD/sections/functional-requirements.md`, REQ-168, first note.

```
  - This also resolves the **symptom** half of the mechanic-keyword observation: a mechanic asked by name with no card must not be refused as "not an official mechanic." The separate idea of guaranteeing every relevant mechanic's **definition** is enriched into the prompt is RAG-shaped and filed to `PRD/work/prompt-context-refinement/RAG-DEFERRED.md`, not built here.
```

Proposed:

```
  - This also resolves the **symptom** half of the mechanic-keyword observation: a mechanic asked by name with no card must not be refused as "not an official mechanic." The separate idea of guaranteeing every relevant mechanic's **definition** is enriched into the prompt is RAG-shaped and is not built here. It needs a mechanic-definition corpus, a per-question relevance step, and a new prompt section — a different feature from improving which Comprehensive Rules excerpts are selected. It is an explicit non-goal of the RAG retrieval gameplan (REQ-177 through REQ-181) and becomes its own package once REQ-180 settles how the keyword vocabulary is derived. Its original write-up was preserved when the `prompt-context-refinement` package closed and is carried in that gameplan's intake.
```

- Verdict: accept
- Reason:

---

## NFR-018 — Repoint the same dangling citation

- **What this decides:** whether the worked-solutions validation requirement
  stops pointing at the same deleted file.

- **In plain terms:** NFR-018 is the requirement that says prompt quality gets
  validated against real published worked solutions to hard rules questions —
  test data, never runtime context. Its note draws the line between that and RAG,
  and cites the same deleted `RAG-DEFERRED.md` path. Same repoint, same reason.

- **What happens if you say no:** a second live citation keeps pointing at a
  deleted file.

Current: `PRD/sections/non-functional-requirements.md`, NFR-018, note.

```
  - Distinct from RAG/corpus retrieval: this external data validates and tunes the prompt; it is not injected into prompts. The mechanic-definition enrichment idea, which would inject a corpus into the prompt, is RAG-deferred (`PRD/work/prompt-context-refinement/RAG-DEFERRED.md`).
```

Proposed:

```
  - Distinct from RAG/corpus retrieval: this external data validates and tunes the prompt; it is not injected into prompts. The mechanic-definition enrichment idea, which would inject a corpus into the prompt, remains deferred and is an explicit non-goal of the RAG retrieval gameplan (REQ-177 through REQ-181); see REQ-168's note for where it stands.
  - The RAG gameplan's own measurement work (REQ-177) commits an offline labelled question-to-rule benchmark. That benchmark and this worked-solutions set are complementary: the benchmark measures whether the right rule was retrieved, this set measures whether the assembled prompt resolves a hard case correctly.
```

- Verdict: accept
- Reason:

---

## NFR-017 — Raise the deploy package reserve before the model needs it

- **What this decides:** whether the deploy-size guardrail's fixed reserve for
  code and dependencies is re-measured to fit the bundled embedding model —
  rather than being loosened later when it fires, or worked around.

- **In plain terms:** NFR-017 is the guardrail that stops a committed data file
  from making the backend too big to deploy. AWS caps the deployment package at
  250 MB unpacked. The test splits that into a data budget and a **fixed 20 MB
  reserve** for code plus dependencies. Measured live on 2026-09-05: committed
  data is 111.9 MB against a 230 MB budget, so the ~5.3 MB embeddings file fits
  with 118 MB to spare. But the bundled model does not live in the data folder —
  it lives in dependencies, inside that 20 MB reserve, and a quantised model is
  about 23 MB on its own before the runtime that loads it. **Step 5 would blow
  the reserve.** This says: re-measure the reserve against the real packaged
  footprint when the model lands, in the same change, and keep the guardrail
  armed. NFR-017's own notes record why that matters — a disarmed budget check is
  how the 2026-08-22 two-day deploy outage went unseen.

- **What happens if you say no:** either Step 5 fails the deploy budget test on
  the pull request with no sanctioned fix, or somebody quietly raises the number
  to make a red test go green.

Current: `PRD/sections/non-functional-requirements.md`, NFR-017, first constraint
and dependencies.

```
  - `scripts/lambda-package-budget.test.mjs` measures the unzipped on-disk package footprint (code + production `node_modules` + committed `apps/backend/data`) against the 250 MB quota, with a reserve, and fails when the tracked data would exceed the budget
```

Proposed:

```
  - `scripts/lambda-package-budget.test.mjs` measures the unzipped on-disk package footprint (code + production `node_modules` + committed `apps/backend/data`) against the 250 MB quota, with a reserve, and fails when the tracked data would exceed the budget
  - the non-data reserve is sized from a measurement of the real packaged code and production dependencies, not left at a figure the package has outgrown. When a bundled embedding model ships (REQ-181) it lands in production dependencies, inside this reserve, so the reserve is re-measured in that same change and the test's failure message names the model as a contributor. The guardrail is re-based, never loosened to make a red test green — measured on 2026-09-05, committed data was 111.9 MB against a 230 MB data budget (118 MB headroom), so the constrained side is the reserve, not the data budget
```

Current (dependencies):

```
- Dependencies:
  - DEC-169
  - REQ-165
  - REQ-093
```

Proposed:

```
- Dependencies:
  - DEC-169
  - REQ-165
  - REQ-093
  - REQ-181 (the bundled embedding model and committed rule-embeddings artifact this budget must accommodate)
```

- Verdict: accept
- Reason:

---

## Q-001 — Answer the keyword-vocabulary question with the option it already lists

- **What this decides:** whether open question Q-001 gets closed by adopting
  Scryfall's per-card keyword list, or stays open.

- **In plain terms:** Q-001 has asked, since the retrieval scorer was built, how
  the keyword list that drives rule retrieval should be maintained long-term. It
  lists three options: keep hand-curating twenty words, pull Scryfall's per-card
  `keywords` into the committed pipeline and union them at query time, or
  generate the list from the Comprehensive Rules' own keyword-ability section.
  Its recommended next step was to ship the manual list first and "revisit after
  labeled-recall metrics show gaps." Step 1 (REQ-177) produces exactly those
  metrics, and Step 4 (REQ-180) is the revisit — adopting option two. Closing it
  here means the mechanism and the decision that governs it land together instead
  of the mechanism silently deciding it.

- **What happens if you say no:** Q-001 stays open while REQ-180 ships the
  keyword source it was created to decide — which decides it anyway, just without
  you saying so.

Current: `PRD/sections/open-questions.md`, Q-001, last line.

```
- Recommended next step: Ship manual vocabulary in the first implementation slice; revisit after labeled-recall metrics show gaps. Do not block implementation on vocabulary derivation strategy.
```

Proposed:

```
- Recommended next step: Ship manual vocabulary in the first implementation slice; revisit after labeled-recall metrics show gaps. Do not block implementation on vocabulary derivation strategy.
- Answered (2026-09-05, RAG retrieval gameplan): option two. Per-card Scryfall `keywords` are added to the committed backend card-detail artifact and unioned at query time to form the System 3 keyword signal (REQ-180). The hand-curated static vocabulary is retained only for detecting a keyword named in the question text, no longer for inferring a card's keywords from its oracle text. The trigger Q-001 named — labelled recall metrics showing gaps — is produced by the committed retrieval benchmark and the repaired relevance report (REQ-177); the two labelled deathtouch fixtures missing their expected rule `702.2b` are the gap. Option three (generating the vocabulary from Comprehensive Rules 702.x) is not taken: it describes what a keyword means, not which cards carry it, and is better suited to the deferred mechanic-definition corpus than to the retrieval query signal.
```

- Verdict: accept
- Reason:

---

## system-map.md — The System 3 one-liner, and a drift claim that is no longer true

- **What this decides:** whether the system map's one-line summaries of
  supplemental retrieval and of the relevance report are corrected.

- **In plain terms:** `system-map.md` is the index every reader skims to find out
  what a subsystem does. Two of its lines are wrong after this work. The
  supplemental-retrieval line says rules are scored by word-rarity weighting with
  question and keyword boosts — that becomes meaning-first with word overlap
  underneath. And the relevance-report line claims the report "shares scoring
  logic with the harness so report output cannot drift" — which is **already
  false**: they disagree on three scenarios today. That line is corrected to
  describe the parity test REQ-177 adds, which is what actually makes the claim
  true.

- **What happens if you say no:** the map's index of the product keeps asserting
  a scoring mechanism the product no longer uses and a no-drift property that
  does not currently hold.

Current: `PRD/sections/system-map.md`, the `### Supplemental retrieval (System 3)`
block.

```
### Supplemental retrieval (System 3)

- Status: shipped
- Summary: Scores up to 5 supplemental rule excerpts per request with IDF weighting, question/keyword boosts, and rule-id tie-break; deduplicated against the System 2 selection.
- Lives in: `apps/backend/src/gameRulesRetrieval.ts`, `apps/backend/data/gameRulesKeywordVocabulary.json`, `apps/backend/data/gameRulesTokenStats.json`
- Backed by: DEC-032, DEC-046
```

Proposed:

```
### Supplemental retrieval (System 3)

- Status: shipped
- Summary: Selects up to 5 supplemental rule excerpts per request. The query is the player's question plus a compact per-card signal (name, type line, keywords), not raw card oracle text. Ranking is semantic-primary — cosine over committed per-rule embeddings — with the exact-rule-id boost merged in and lexical IDF scoring retained as the mock/offline default and the failure fallback; deduplicated against the System 2 selection by rule-number prefix.
- Lives in: `apps/backend/src/gameRulesRetrieval.ts`, `apps/backend/data/gameRulesKeywordVocabulary.json`, `apps/backend/data/gameRulesTokenStats.json`, the committed per-rule embeddings artifact
- Backed by: DEC-032, DEC-046, REQ-178, REQ-179, REQ-180, REQ-181
```

Current: `PRD/sections/system-map.md`, the `### Retrieval relevance report` block.

```
### Retrieval relevance report

- Status: shipped
- Summary: Digestible before/after report (System 2 topics, System 3 top-5 with scores, recall hit/miss) for tuning review; shares scoring logic with the harness so report output cannot drift.
- Lives in: `scripts/retrieval-relevance-report.mjs`, `apps/backend/src/eval/contextEvaluationHarness.ts` (`buildRelevanceReport`)
- Backed by: DEC-047, REQ-032
```

Proposed:

```
### Retrieval relevance report

- Status: shipped
- Summary: Digestible before/after report (System 2 topics, System 3 top-5 with scores, recall hit/miss) for tuning review. It models production retrieval the same way the eval harness does — same card-detail resolution, same query construction — and a parity test asserts the two return the same per-scenario verdict, so report output cannot drift from the gate (REQ-177). Before REQ-177 the claim was aspirational and untrue: after REQ-176 moved card-text resolution server-side, the report passed no card-detail index and reported three false scenario failures.
- Lives in: `scripts/retrieval-relevance-report.mjs`, `apps/backend/src/eval/retrievalReportInputs.ts`, `apps/backend/src/eval/contextEvaluationHarness.ts` (`buildRelevanceReport`)
- Backed by: DEC-047, REQ-032, REQ-177
```

- Verdict: accept
- Reason:

---

## system-map/game-rules-retrieval.md — The System 3 explainer, rewritten

- **What this decides:** whether the how-it-works page for rules retrieval is
  rewritten to describe the new query, the new corpus, and meaning-first ranking.

- **In plain terms:** this is the page someone reads to understand how the three
  reference systems feed the prompt. Its System 3 sections describe the current
  word-overlap mechanism in detail. They are rewritten to describe: a query built
  from the question plus a compact card signal, ranking by meaning against
  committed rule vectors with the cited-rule-number boost merged in, word overlap
  kept as the offline default and failure fallback, the provider switch, and the
  fact that the query is embedded in the request handler before prompt
  preparation so prompt preparation stays synchronous. It also records that
  Q-001, the keyword-vocabulary question this page has flagged as open since it
  was written, is now answered.

- **What happens if you say no:** the deepest explanation of rules retrieval in
  the corpus keeps describing a mechanism the product no longer uses.

Current: `PRD/sections/system-map/game-rules-retrieval.md`, header line.

```
Backed by: DEC-029, DEC-030, DEC-032, DEC-045, DEC-046, DEC-047, REQ-022, REQ-032
```

Proposed:

```
Backed by: DEC-029, DEC-030, DEC-032, DEC-045, DEC-046, DEC-047, REQ-022, REQ-032, REQ-177, REQ-178, REQ-179, REQ-180, REQ-181
```

Current: the `## How it works` System 3 paragraph.

```
System 3 is supplemental retrieval. It builds a query from the user's question plus
card/context text, scores official rule excerpts with IDF-weighted lexical matching,
question and keyword boosts, exact rule-ID and parent rule-ID bonuses, then selects at
most five excerpts. Ties prefer the highest matching IDF signal, then ascending rule
ID. Before scoring output is selected, System 3 excludes rule IDs already selected by
System 2, so the prompt does not print the same rule in both `GAME RULES (reference)`
and `ADDITIONAL RELEVANT RULE EXCERPTS`.
```

Proposed:

```
System 3 is supplemental retrieval. It builds a query from the user's question plus a
compact per-card signal — each submitted or attached card's name, type line, and
keyword list — deliberately not the cards' full oracle text, which floods the query and
was measured to drop recall@5 from 0.577 to 0.026 on a labelled benchmark. It then
ranks official rule excerpts and selects at most five. Ranking is semantic-primary:
when the embedding-provider seam is active the query is embedded and cosine-ranked
against a committed per-rule embedding vector, with the exact rule-ID and parent
rule-ID boost merged in so a cited rule number (for example "rule 613.9") is still
pulled even when semantic similarity misses it. The IDF-weighted lexical scorer is
retained as the mock/offline default, as the source of the exact-rule-ID boost, and as
the fallback whenever query embedding fails — so System 3 is never worse than its
earlier lexical-only behaviour. Ties prefer the highest matching signal, then ascending
rule ID. Before output is selected, System 3 excludes rule IDs already selected by
System 2 — by rule-number prefix, so a curated parent rule also excludes its lettered
sub-rules — and the prompt does not print the same rule in both `GAME RULES (reference)`
and `ADDITIONAL RELEVANT RULE EXCERPTS`.

The query embedder is chosen by the `EMBEDDING_PROVIDER` seam (`mock` | `local` |
`openai`), which mirrors the `ASK_AI_PROVIDER` boundary. `mock` (the default) does no
embedding and uses lexical only, so the default runs with no model access. `local`
(the shipped semantic provider) embeds the query in-process with a bundled
`all-MiniLM-L6-v2` model in about 2ms — no external call, so System 3 keeps its "no
per-request external call" posture. `openai` is seam-selectable for live mode only and
is never the default. The per-rule embeddings are a committed offline artifact built
alongside `gameRulesRuleIndex.json` and rebuilt only on CR refresh; the vectors are
searched in-process with cosine, with no vector database (REQ-181).

The rule index the corpus is built from excludes the Comprehensive Rules source
document's table of contents and heading-only entries, so no searchable entry is a
duplicate or a bare heading (REQ-179).
```

Current: the `## Data flow` System 3 paragraph.

```
Those curated rule IDs become the exclusion set for System 3. Supplemental retrieval
tokenizes the question and oracle/context text, applies keyword and IDF resources,
scores the rule index, drops entries whose rule IDs are already in the System 2 set,
and returns the top five excerpts plus debug data when mock enrichment diagnostics are
enabled. Prompt rendering places the resulting sections as curated rules, then
supplemental excerpts, then official rulings.
```

Proposed:

```
Those curated rule IDs become the exclusion set for System 3. When a semantic embedding
provider is active, the async route handler embeds the query first and passes the query
vector into prompt preparation as an option, so `preparePromptInput` stays synchronous.
Supplemental retrieval builds the query from the question plus the per-card keyword
signal, ranks the rule index (cosine over the committed rule embeddings when a query
vector is present, IDF-weighted lexical otherwise or on embedding failure) with the
exact-rule-ID boost merged in, drops entries whose rule IDs or parent rule IDs are
already in the System 2 set, and returns the top five excerpts plus debug data when
mock enrichment diagnostics are enabled. Prompt rendering places the resulting sections
as curated rules, then supplemental excerpts, then official rulings.
```

Current: the `## Where it lives` System 3 data line.

```
- System 3 data: `apps/backend/data/gameRulesKeywordVocabulary.json`, `apps/backend/data/gameRulesTokenStats.json`
```

Proposed:

```
- System 3 data: `apps/backend/data/gameRulesKeywordVocabulary.json`, `apps/backend/data/gameRulesTokenStats.json`, the committed per-rule embeddings artifact (REQ-181), and per-card `keywords` resolved from `apps/backend/data/cardDetailByOracleId.json` (REQ-180)
- Embedding-provider seam: `EMBEDDING_PROVIDER` flag, mirroring the `ASK_AI_PROVIDER` boundary under `apps/backend/src/providers/`
```

Current: the `## Worked example` System 3 paragraph.

```
System 3 then searches the question and card/context text for more specific rule
excerpts. Tokens from the direct question carry more weight than incidental card text,
rules-related keywords receive their boost, and any explicit rule number in the query
can pull in an exact or parent match. If a combat damage rule is already present in the
System 2 topic set, that rule ID is excluded from System 3 so the supplemental block
uses its five slots for additional relevant context rather than duplicating the
baseline.
```

Proposed:

```
System 3 then retrieves more specific rule excerpts. It builds the query from the
question plus the attached cards' names, type lines, and keywords — not their full
oracle text — embeds it with the active provider, and cosine-ranks it against the
committed rule embeddings, so the excerpts that actually address deathtouch and
combat-damage assignment surface even when they share few literal words with the
question. Any explicit rule number in the query still pulls in an exact or parent match
through the merged boost. If a combat damage rule is already present in the System 2
topic set, that rule ID and its lettered sub-rules are excluded from System 3 so the
supplemental block uses its five slots for additional relevant context rather than
duplicating the baseline.
```

Current: two lines in `## Invariants / gotchas`.

```
- Relevance is regression-tested by the eval harness under DEC-047 and REQ-032.
- Q-001, the System 3 keyword-vocabulary derivation strategy, remains open. This file
  references that question but does not resolve it.
```

Proposed:

```
- System 3 ranking is semantic-primary (cosine over committed rule embeddings) with the
  exact-rule-ID boost merged in and lexical retained as the mock/offline default and the
  failure fallback; it is never worse than the prior lexical-only behaviour (REQ-181).
- The shipped semantic path uses a bundled local model, so System 3 keeps its "no
  per-request external call" posture; only `EMBEDDING_PROVIDER=openai` would add a
  per-request call, and that is never the default.
- Relevance is regression-tested by the eval harness under DEC-047 and REQ-032, which
  measures the semantic path via committed frozen query embeddings — no live embedding
  or AI call — and by a committed offline labelled benchmark (REQ-177). The human
  relevance report is held to the harness's verdict by a parity test (REQ-177).
- Q-001, the System 3 keyword-vocabulary derivation strategy, is answered: per-card
  Scryfall `keywords` in the committed backend artifact, unioned at query time
  (REQ-180). The hand-curated vocabulary is retained only for detecting a keyword named
  in the question text.
```

- Verdict: accept
- Reason:

---

## system-map/prompt-layout-spec.md — The prompt-section description and presence matrix

- **What this decides:** whether the readable prompt-layout spec's description of
  the supplemental-rules section is corrected.

- **In plain terms:** this is the page you asked for so you could read the
  prompt's shape without wading through JSON. It describes the supplemental-rules
  section as "retrieved by keyword-scoring the question plus, in lookup mode,
  every attached card's oracle text and type line." Both halves change: the
  ranking is by meaning, and the query is the compact card signal. The presence
  matrix cell says the same thing and gets the same correction. Nothing about the
  section's position or when it appears changes.

- **What happens if you say no:** the one page written specifically so the prompt
  can be read at a glance describes a retrieval mechanism the product no longer
  uses.

Current: `PRD/sections/system-map/prompt-layout-spec.md`, header line.

```
Backed by: DEC-025, DEC-042, REQ-169, DEC-107, REQ-074
```

Proposed:

```
Backed by: DEC-025, DEC-042, REQ-169, DEC-107, REQ-074, REQ-178, REQ-181
```

Current: row 8 of the sections table.

```
| 8 | `ADDITIONAL RELEVANT RULE EXCERPTS` | Supplemental rule excerpts (System 3) retrieved by keyword-scoring the question plus, in lookup mode, every attached card's oracle text and type line (REQ-167). |
```

Proposed:

```
| 8 | `ADDITIONAL RELEVANT RULE EXCERPTS` | Supplemental rule excerpts (System 3), ranked by meaning against committed per-rule embeddings with a keyword-overlap fallback, from a query built from the question plus each attached card's name, type line, and keywords — not its full oracle text (REQ-167, REQ-178, REQ-181). |
```

Current: the `ADDITIONAL RELEVANT RULE EXCERPTS` row of the presence matrix.

```
| `ADDITIONAL RELEVANT RULE EXCERPTS` | conditional — present when System 3 retrieves ≥1 scoring rule; can be empty | conditional — present when System 3 retrieves ≥1 scoring rule (question + every attached card's oracle/type text, REQ-167); can be empty | conditional — present when System 3 retrieves ≥1 scoring rule from the question alone; can be empty | conditional — same rule as whichever mode |
```

Proposed:

```
| `ADDITIONAL RELEVANT RULE EXCERPTS` | conditional — present when System 3 retrieves ≥1 scoring rule; can be empty | conditional — present when System 3 retrieves ≥1 scoring rule (question + each attached card's name/type line/keywords, REQ-167, REQ-178); can be empty | conditional — present when System 3 retrieves ≥1 scoring rule from the question alone; can be empty | conditional — same rule as whichever mode |
```

- Verdict: accept
- Reason:

---

## quick-lookup/README.md — The three shipped-fact lines about retrieval

- **What this decides:** whether the Quick Question feature spec's statements of
  what is built today are corrected for the new query and the new ranking.

- **In plain terms:** this file is precedence #1 — the first place anyone looks
  to find out what Quick Question actually does. Three of its lines state, as
  shipped fact, that supplemental retrieval is keyword-scored and that the query
  carries every attached card's full rules text. Both become false. A prior
  quality-check failed on exactly these lines, so they are called out
  specifically here.

- **What happens if you say no:** the first document a reader trusts contradicts
  the requirements behind it.

Current: `PRD/sections/quick-lookup/README.md`, the `Backed by:` list tail.

```
  REQ-129, REQ-132, REQ-134, REQ-141, REQ-167, FLOW-006, FLOW-011, FLOW-023,
  NFR-001
```

Proposed:

```
  REQ-129, REQ-132, REQ-134, REQ-141, REQ-167, REQ-178, REQ-179, REQ-180,
  REQ-181, FLOW-006, FLOW-011, FLOW-023, NFR-001
```

Current: the per-card enrichment `Built:` line.

```
- Built: when one or more cards are attached, per-card enrichment layers in for
  every attached card — each card's full metadata including oracle text using
  the same per-card formatting as populated-zone cards (DEC-042 / REQ-030),
  each card's WotC rulings under one `CARD (looked up)` / `OFFICIAL RULINGS`
  heading per section, and System 3 additionally scored against every attached
  card's oracle text and type line, not only the question. With no cards
  attached, the rulings section and card section are empty and System 3 scores
  on the question alone. (DEC-107, REQ-074, REQ-167)
```

Proposed:

```
- Built: when one or more cards are attached, per-card enrichment layers in for
  every attached card — each card's full metadata including oracle text using
  the same per-card formatting as populated-zone cards (DEC-042 / REQ-030),
  each card's WotC rulings under one `CARD (looked up)` / `OFFICIAL RULINGS`
  heading per section, and System 3 additionally scored against a compact
  signal for every attached card — its name, type line, and keywords — not its
  full oracle text, which was measured to collapse supplemental recall
  (REQ-178). With no cards attached, the rulings section and card section are
  empty and System 3 scores on the question alone. (DEC-107, REQ-074, REQ-167,
  REQ-178)
```

Current: the `### Retrieval` `Built:` line.

```
- Built: System 3 supplemental rules retrieval (DEC-046) is IDF-scored keyword
  retrieval over the loaded rule index, excluding the curated rule numbers the
  always-on core topics already carry, returning a small capped set of the
  best-scoring rules. For lookup the query is built from the question tokens
  always, plus every attached card's oracle text and type line (REQ-167).
  (DEC-046, REQ-022, DEC-107, REQ-167)
```

Proposed:

```
- Built: System 3 supplemental rules retrieval (DEC-046) is semantic-primary
  when the embedding-provider seam is active (REQ-181) — the query embedding is
  cosine-ranked against the committed per-rule embeddings, with the
  exact-rule-id boost merged in — over a rule index with the source document's
  table of contents and heading-only entries stripped (REQ-179), excluding by
  rule-number prefix the curated rule numbers the always-on core topics already
  carry, and returning a small capped set of the best-ranked rules. IDF-scored
  keyword retrieval is retained as the mock/offline default and the fallback on
  any embedding failure, so retrieval is never worse than the prior lexical
  behaviour. For lookup the query is built from the question tokens always, plus
  each attached card's name, type line, and keywords — not its oracle text
  (REQ-167, REQ-178). (DEC-046, REQ-022, REQ-178, REQ-179, REQ-181, DEC-107,
  REQ-167)
```

Current: the `## Measured bounds` retrieval line.

```
- Retrieval: System 3 returns a small capped best-scoring set (top 5), curated
  core-topic rule numbers excluded; question tokens always score, plus every
  attached card's oracle/type tokens (REQ-167). (DEC-046, REQ-022, REQ-167)
```

Proposed:

```
- Retrieval: System 3 returns a small capped best-ranked set (top 5), curated
  core-topic rule numbers excluded by prefix; ranking is semantic-primary
  (cosine over the committed per-rule embeddings) with the exact-rule-id boost
  merged and lexical IDF scoring retained as the mock/offline default and
  failure fallback (REQ-181); the query is the question tokens always, plus each
  attached card's name, type line, and keywords (REQ-167, REQ-178). (DEC-046,
  REQ-022, REQ-178, REQ-181, REQ-167)
```

- Verdict: accept
- Reason:

---

## in-depth/README.md — The supplemental-scoring shipped-fact line

- **What this decides:** whether the In-Depth (game mode) feature spec's
  statement of how supplemental rules are scored is corrected.

- **In plain terms:** same machinery, same correction, on the game-mode side of
  the app. This file states, as shipped fact, that the supplemental block is
  scored by word-rarity weighting with question and keyword boosts. That becomes
  meaning-first with word overlap kept underneath. Its historical
  "rejected alternatives" entry — recording that the original flat one-point-per-
  shared-word scoring was replaced — stays and gains one line so the lineage
  reads forward correctly. This is the second of the two `Built:` lines a prior
  quality-check failed on.

- **What happens if you say no:** the game-mode spec contradicts REQ-022 and
  REQ-181 about how the supplemental block is built.

Current: `PRD/sections/in-depth/README.md`, the `Backed by:` list tail.

```
  REQ-144, FLOW-001, FLOW-002, FLOW-003, FLOW-004, FLOW-005, FLOW-015, NFR-001,
  NFR-002, NFR-006, NFR-009
```

Proposed:

```
  REQ-144, REQ-178, REQ-179, REQ-180, REQ-181, FLOW-001, FLOW-002, FLOW-003,
  FLOW-004, FLOW-005, FLOW-015, NFR-001, NFR-002, NFR-006, NFR-009
```

Current: the `### Retrieval enrichment (machinery consumed)` supplemental line.

```
- Built: `ADDITIONAL RELEVANT RULE EXCERPTS` adds up to 5 supplemental rules
  scored per DEC-046 (IDF-weighted lexical scoring with question and keyword
  boosts, deduplicated against the System 2 selection), omitted when nothing
  scores above 0. (DEC-032, DEC-046, REQ-022)
```

Proposed:

```
- Built: `ADDITIONAL RELEVANT RULE EXCERPTS` adds up to 5 supplemental rules
  scored per DEC-046 — semantic-primary ranking (cosine over the committed
  per-rule embeddings) when the embedding-provider seam is active, with the
  exact-rule-id boost merged and IDF-weighted lexical scoring retained as the
  mock/offline default and the fallback on any embedding failure (REQ-181), from
  a query built from the question plus each submitted card's name, type line,
  and keywords rather than its full oracle text (REQ-178), deduplicated against
  the System 2 selection by rule-number prefix (REQ-179) — omitted when nothing
  scores above 0. (DEC-032, DEC-046, REQ-022, REQ-178, REQ-179, REQ-181)
```

Current: the `## Rejected alternatives and deferred scope` entry.

```
- **DEC-032's flat +1-per-shared-word supplemental scoring — closed door.**
  DEC-046 replaced it with IDF-weighted relevance scoring, question/keyword boosts,
  and an improved tie-break. (DEC-046)
```

Proposed:

```
- **DEC-032's flat +1-per-shared-word supplemental scoring — closed door.**
  DEC-046 replaced it with IDF-weighted relevance scoring, question/keyword boosts,
  and an improved tie-break. REQ-181 then made ranking semantic-primary, keeping
  that IDF scorer as the mock/offline default, the exact-rule-id boost, and the
  failure fallback — so the lexical path is demoted, never removed. (DEC-046,
  REQ-181)
```

- Verdict: accept
- Reason:

---

## integrations-and-data.md — The embedding provider, the vectors file, and the keywords field

- **What this decides:** whether the data and integrations spec records the new
  provider switch, the committed rule-vectors file and its build and failure
  behaviour, and the per-card keywords field.

- **In plain terms:** this file is where the project records every data artifact,
  every provider boundary, and every build rule. Three additions: the
  `EMBEDDING_PROVIDER` switch alongside the existing `ASK_AI_PROVIDER` switch; the
  committed per-rule vectors file — how it is built, when it is rebuilt, what
  happens if it is missing, and the rule that the raw model download is never
  committed; and per-card `keywords` in the backend card-detail artifact. It also
  updates the one line describing how supplemental rules are chosen.

- **What happens if you say no:** the data strategy does not reflect the new file
  or switch, and build and degradation behaviour for embeddings is unspecified.

Current: `PRD/sections/integrations-and-data.md`, the Tech Stack `AI Provider`
line and the line after it.

```
- AI Provider: backend provider boundary (`ASK_AI_PROVIDER=mock` default, `ASK_AI_PROVIDER=openai` for live answers). **Canonical rule — mock-first local default:** local development defaults to the mock provider; the live OpenAI provider is opt-in via `ASK_AI_PROVIDER=openai` and is what production runs. This is the single authoritative statement; echoed in `overview.md`, `goals-and-non-goals.md`, `instructions/technical-design-rules.md`, `in-depth/README.md`, `quick-lookup/README.md`, `PRD/README.md`, and root `README.md` (enumerate by grep before amending — see `instructions/writing-rules.md`, grep-before-amend).
- Provider Access: provider SDKs are backend-only
```

Proposed:

```
- AI Provider: backend provider boundary (`ASK_AI_PROVIDER=mock` default, `ASK_AI_PROVIDER=openai` for live answers). **Canonical rule — mock-first local default:** local development defaults to the mock provider; the live OpenAI provider is opt-in via `ASK_AI_PROVIDER=openai` and is what production runs. This is the single authoritative statement; echoed in `overview.md`, `goals-and-non-goals.md`, `instructions/technical-design-rules.md`, `in-depth/README.md`, `quick-lookup/README.md`, `PRD/README.md`, and root `README.md` (enumerate by grep before amending — see `instructions/writing-rules.md`, grep-before-amend).
- Embedding Provider: backend embedding boundary for System 3 semantic rule retrieval (`EMBEDDING_PROVIDER=mock` default → lexical retrieval only and no embedding at all, `local` → bundled `all-MiniLM-L6-v2` run in-process, `openai` → OpenAI embeddings API, live mode only). Mirrors the `ASK_AI_PROVIDER` seam above and inherits its mock-first default: `mock` and `local` make no per-request external call (REQ-181).
- Provider Access: provider SDKs are backend-only
```

Current: the Game Rules Data Strategy tail.

```
- build scripts degrade gracefully: missing CR source or failed extract keeps the prior committed artifacts and exits 0
- the backend loads both committed artifacts at startup and omits game-rules enrichment if the artifacts are missing or empty
- runtime CR fetches are out of scope for the core product
```

Proposed:

```
- build scripts degrade gracefully: missing CR source or failed extract keeps the prior committed artifacts and exits 0
- the backend loads both committed artifacts at startup and omits game-rules enrichment if the artifacts are missing or empty
- the rule index excludes the source document's table of contents and heading-only entries, so every searchable entry carries real rule text and no rule id appears twice; a build test asserts both and fails when a CR refresh reintroduces either (REQ-179)
- System 3 semantic retrieval adds a committed per-rule embeddings artifact under `apps/backend/data/` holding one 384-dimension vector per entry in `gameRulesRuleIndex.json`, produced offline by a quantised `all-MiniLM-L6-v2`. There is no vector database — the vectors are loaded in-process and cosine-searched (REQ-181)
- the embeddings artifact is built by an offline step alongside `build-game-rules.mjs`, runs in the same `npm run data:build` / `data:refresh` chain, rebuilds only on CR refresh, and degrades gracefully: a missing or malformed artifact disables the semantic path and System 3 falls back to lexical retrieval
- the raw local embedding model download and any full-precision vector blob are gitignored and must not be committed; only the trimmed committed vectors ship. The bundled model itself lands in production dependencies and is counted against NFR-017's deploy package budget
- query embedding at request time is selected by `EMBEDDING_PROVIDER` (`mock` | `local` | `openai`, default `mock`); `mock` and `local` make no per-request external call, so System 3 keeps its no-per-request-external-call posture and the mock default runs with no model access; `openai` is seam-selectable for live mode only (REQ-181)
- runtime CR fetches are out of scope for the core product
```

Current: the committed card-detail bullet in the Card Data Strategy section.

```
- the frontend fetches one card's block on demand from `GET /api/cards/:oracleId` (FLOW-024) and caches per card for the session; ask-ai reads the same backend map internally for server-side resolution (REQ-176)
```

Proposed:

```
- the frontend fetches one card's block on demand from `GET /api/cards/:oracleId` (FLOW-024) and caches per card for the session; ask-ai reads the same backend map internally for server-side resolution (REQ-176)
- the backend map additionally carries each card's Scryfall `keywords` array, used only to build the System 3 retrieval query's keyword signal; it is not part of the on-demand card block the frontend fetches and adds nothing to the up-front payload (REQ-180)
```

Current: the supplemental-rules line in the prompt-contents list.

```
- up to 5 supplemental WotC CR rule excerpts dynamically retrieved from the committed rule index artifact, scored per DEC-046 against the request context and deduplicated against selected System 2 baseline rule numbers
```

Proposed:

```
- up to 5 supplemental WotC CR rule excerpts dynamically retrieved from the committed rule index artifact, ranked semantic-first against the committed per-rule embeddings with the exact-rule-id boost merged and lexical IDF scoring retained as the mock/offline default and failure fallback (DEC-046, REQ-181), from a query built from the question plus each card's name, type line, and keywords rather than its full oracle text (REQ-178), and deduplicated by rule-number prefix against selected System 2 baseline rule numbers (REQ-179)
```

- Verdict: accept
- Reason:

---

## user-flows.md — Two flow steps that describe the old search query

- **What this decides:** whether the two Quick Question flow descriptions stop
  saying the rule search runs over the attached cards' full text.

- **In plain terms:** `user-flows.md` walks through what happens step by step
  when a player uses a feature. Two Quick Question flows describe the backend
  step as scoring supplemental retrieval over the question plus the attached
  cards. Corrected to the compact signal. Nothing a player does changes, so no
  new flow is needed and no other step moves.

- **What happens if you say no:** the step-by-step walkthroughs contradict
  REQ-178 about what the backend actually searches on.

Current: `PRD/sections/user-flows.md`, the single-card Quick Question flow,
step 7.

```
  7. Backend assembles one lookup-mode prompt: question-driven rules retrieval (MTG reference block, always-on core game-rules topics, System 3 supplemental) always runs; when a card is attached, per-card enrichment (WotC rulings, full metadata incl. oracle text, card-scored System 3) layers in; game-state-only sections are always omitted. Off-domain questions get the "confused rules lookup" persona response rather than a direct answer. Backend returns a plain-text answer.
```

Proposed:

```
  7. Backend assembles one lookup-mode prompt: question-driven rules retrieval (MTG reference block, always-on core game-rules topics, System 3 supplemental) always runs; when a card is attached, per-card enrichment (WotC rulings, full metadata incl. oracle text, and a System 3 query extended with that card's name, type line, and keywords — not its oracle text, REQ-178) layers in; game-state-only sections are always omitted. Off-domain questions get the "confused rules lookup" persona response rather than a direct answer. Backend returns a plain-text answer.
```

Current: the multi-card Quick Question flow, step 5.

```
  5. Backend assembles one lookup-mode prompt: per-card full metadata and per-card WotC rulings for every attached card, System 3 supplemental retrieval scored over the question plus all attached cards, and combo enrichment over the card set when explicit combo intent is present; game-state-only sections stay omitted (REQ-167 / DEC-107).
```

Proposed:

```
  5. Backend assembles one lookup-mode prompt: per-card full metadata and per-card WotC rulings for every attached card, System 3 supplemental retrieval scored over the question plus each attached card's name, type line, and keywords — not its full oracle text (REQ-178) — and combo enrichment over the card set when explicit combo intent is present; game-state-only sections stay omitted (REQ-167 / DEC-107).
```

- Verdict: accept
- Reason:

---

## Blocker questions

None. Every open choice was resolved through the conservative assumption ladder
in `PRD/instructions/preparation-contract.md`, and each is recorded with its
evidence in `DESIGN-BRIEF.md` under "Material assumptions". None met the
three-condition genuine-blocker test — for each one, either live `PRD/sections/`
truth, a live measurement taken on this branch, or an established local pattern
gave an authoritative basis.

Two things the owner should know about, which are **not** blockers because
neither stops this gameplan:

**The combo over-assertion fix is descoped.** In Quick Question with no board,
the model sometimes claims a working combo from cards that do not combo — it was
the only hard error class in a 500-case measured suite (2 of 500), and the
highest-severity failure a player would notice. It is a prompt-instruction fix,
not retrieval, and folding it into a retrieval gameplan would make both harder to
measure. Its evidence is preserved in `DESIGN-BRIEF.md`. It wants its own small
package whenever you want it.

**Three large data files still ship uncompressed to the browser.** CloudFront
does not auto-compress objects over 10 MB. `cardMetadata.json` dropped under that
ceiling with image-first-cards, but `cardScanMap.json` (~21 MB) and
`cardPrintingPrices.json` (~38 MB) are still above it, so a fresh visitor to Scan
or Trade Balancer downloads them raw. That is a deploy-layer fix, unrelated to
RAG, reported here so it is not lost.
