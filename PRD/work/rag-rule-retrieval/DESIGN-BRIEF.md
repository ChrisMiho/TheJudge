# Design brief — rag-rule-retrieval

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

One gameplan for RAG in TheJudge: five ordered build steps, each with a
measurement it must pass before the next one starts. Everything is backend and
prompt only. No screen changes, no new endpoint, no change to what the browser
sends or gets back.

## What a player gets

When a player asks a rules question, the answer is grounded in a block of
Comprehensive Rules text the backend picked for it — the
`ADDITIONAL RELEVANT RULE EXCERPTS` section, five excerpts, internally called
System 3. Today that block is picked by word overlap: the backend counts which
rules share the most rare words with the question, and takes the top five.

Two things go wrong, and both are visible in a real answer.

**It picks the wrong rules on ordinary questions.** On a 156-question labelled
benchmark, word overlap put the right rule in the top five 58% of the time
(evidence: intake `combo-context-validation-branch/FINDINGS.md`). Two of every
five rules questions get a prompt with no rule that answers them.

**It collapses when the player attaches cards.** Quick Question sends the
question plus every attached card's full rules text into the same word-overlap
query. A five-card board contributes 30–100 words of card text against a 5–15
word question, so the card text drowns the question. Measured on the same
benchmark, the right rule reached the top five 2.6% of the time — 4 hits in 156.
That is the exact shape of a "how do these cards combo" lookup.

The end state: the block is picked by **meaning**, not word overlap, so the rule
that actually answers the question shows up whether or not it shares vocabulary
with how the player phrased it. Measured on the same benchmark, meaning-based
picking scores 86.5% clean and 76.3% with cards attached.

## The gameplan — five steps, in order

Each step is independently shippable and independently measured. Each one leaves
the product better than it found it, and each measurement is taken from a live
command in this repo, not estimated.

### Step 1 — Make the ruler trustworthy (REQ-177)

**Nothing about retrieval changes.** This step fixes the instrument every later
step is judged on.

There are two ways to measure System 3 recall in this repo today, and **they
disagree right now.** Measured on this branch, 2026-09-05:

| Instrument | Command | Result |
| --- | --- | --- |
| Eval harness (the gate) | `npm --workspace apps/backend run test:eval` | green, all labelled scenarios pass |
| Relevance report (the review aid) | `npm run retrieval:report` | 6 of 9 scenarios FAIL |

The three the report calls failures — `counterspell-stack`,
`quick-lookup-card`, `quick-lookup-multi-card` — the harness calls passes.

**Cause, located in code:** `apps/backend/src/eval/retrievalReportInputs.ts`
calls `buildPromptContext(request)` and `preparePromptInput(request, …)` with no
`cardDetailIndex`. Since REQ-176 (the backend now resolves a card's rules text
server-side by oracle id instead of trusting the request), a missing index means
every card in the report's fixtures resolves with **empty rules text** — so the
report builds a different retrieval query than production and reports different
top-five results. The eval harness builds that index from each fixture's own
cards (`contextEvaluationHarness.test.ts`, `cardDetailIndexFromRequest`) and
therefore matches production.

This matters more than it looks: `system-map.md` asserts today, as shipped truth,
that the report "shares scoring logic with the harness so report output cannot
drift." That statement is false as of REQ-176. The tuning aid for every recall
number in this gameplan is currently lying.

There is also no committed way to reproduce the 156-question benchmark that every
number in this brief comes from. It lives on `origin/explore/semantic-rule-retrieval`
under `PRD/work/combo-context-validation/harness/rag/` — a throwaway scratch
harness on an unmerged branch, with its rule-embeddings blob gitignored.

**What ships:** the report resolves card detail the same way the harness does; a
test asserts the two agree scenario-for-scenario so they cannot drift again; and
the 156-pair benchmark becomes a committed, offline, deterministic recall harness
with the current lexical numbers recorded as the baseline every later step is
measured against.

**Measurement gate:** `npm run retrieval:report` and
`npm --workspace apps/backend run test:eval` return the same per-scenario recall
verdict for all 9 labelled fixtures (today they differ on 3), and a parity test
fails the pull request if they ever diverge. The committed benchmark runs offline
with no live AI or embedding call and records clean and multi-card recall@5 as the
Step 1 baseline.

### Step 2 — Fix the query (REQ-178)

Build the System 3 retrieval query from the player's **question plus a compact
card signal** — each attached card's name, type line, and keyword list — instead
of the question plus every card's full rules text.

This is the single biggest measured lever in the whole gameplan and it needs no
embeddings. The collapse from 58% to 2.6% is caused by the query, not the scorer.
The probe put it plainly: *"a semantic query built the same way inherits the same
flood"* (intake `probe-prompt-data-optimization/FINDINGS-prompt-anatomy.md` §4,
which locates it at `gameRulesRetrieval.ts:220-246`; confirmed live —
`buildQueryParts` appends turn phase, zone ids, and every card's name, type line,
rules text and notes).

**Measurement gate, deliberately relative.** Multi-card recall@5 on the committed
benchmark must land **within 0.10 of the same build's clean-query recall@5**, and
clean recall@5 must not regress from the Step 1 baseline. The gate is written as
a gap, not an absolute floor, because closing the clean/polluted gap is exactly
what this step claims to do — and because a numeric floor derived by proportion
rather than measurement is how NFR-019's unreachable 80% slipped four quality
checks. The absolute numbers are recorded as evidence; the gap is the gate.

### Step 3 — Clean the rule corpus (REQ-179)

The rule index is built by scanning the Comprehensive Rules text for numbered
headers, with no guard for the table of contents at the top of the file.

**Measured live, on this branch, 2026-09-05:** `gameRulesRuleIndex.json` holds
3,432 entries with only 3,285 distinct rule ids — **147 duplicates**, every one a
table-of-contents line that shadows the real rule. **626 entries are under 60
characters**, most of them bare headings like `702.19. Trample` whose actual
definition lives in a separate sibling entry.

Junk entries hurt twice: they win ties on short queries, and they inflate the
word-rarity statistics the current scorer weighs everything by.

Also in this step: System 3 excludes a rule already shown in the curated
`GAME RULES (reference)` block by exact id only, so curating `603.1` still lets
`603.1a` reappear as a duplicate supplemental excerpt. That becomes a prefix
match.

**Measurement gate:** zero duplicate rule ids in the built index (from 147); no
heading-only entry survives (from 626 under-60-char entries, the heading-only
subset named by an assertion in the build test); clean and multi-card recall@5 do
not regress from Step 2's recorded numbers; `npm --workspace apps/backend run
test:eval` stays green.

### Step 4 — Give the query real keywords (REQ-180)

The backend today reconstructs "what mechanic is this about" by tokenising card
rules text against a hand-curated 20-word list
(`apps/backend/data/gameRulesKeywordVocabulary.json`). Scryfall ships a clean
`keywords` array per card and the build pipeline throws it away — it keeps 10 of
62 available fields (intake `probe-prompt-data-optimization/FINDINGS-data-pipeline.md`
§5, `build-card-metadata.mjs`).

This step pulls `keywords` into the **backend** card corpus
(`cardDetailByOracleId.json`) and feeds it as the keyword signal Step 2's compact
query is built from. It is a one-way street: the backend corpus carries more, the
browser's up-front download carries nothing new.

This is where open question **Q-001** — "how should the System 3 keyword
vocabulary be derived and maintained long-term?" — gets answered, by the option
Q-001 already lists: Scryfall per-card `keywords` added to the committed pipeline
and unioned at query time.

**Measurement gate:** the keyword-heavy labelled fixtures hit their expected
rules — specifically `quick-lookup-card` and `quick-lookup-multi-card`, whose
expected rule `702.2b` (deathtouch) is **missed today** by the production path the
report models; clean and multi-card recall@5 do not regress; the up-front
`cardMetadata.json` gzipped size is unchanged, so NFR-019's "at least 40% smaller
than the prior 16.4 MB artifact" first-load gate is untouched.

### Step 5 — Pick rules by meaning (REQ-181)

The end state. Every rule in the index gets turned into a list of numbers (an
*embedding*, a vector that positions the rule's meaning in space) once, offline,
and the result is committed beside the rule index. At question time the query is
turned into the same kind of vector **in the answer process itself**, in about
2 milliseconds, and the closest rules win.

Four things make this small rather than large, and each is ruled on separately at
the gate:

- **Rules only** (SCOPE-A). Cards, rulings, and combos stay exact-id lookups.
- **A small model bundled in the app** (SCOPE-B), not an internet call — so the
  default still runs with no model access and no per-request network hop.
- **No vector database** (SCOPE-C). 3,432 vectors sit in memory and are compared
  directly.
- **Word overlap is kept, never removed** (SCOPE-D): as the offline default, as
  the boost that catches a player citing "rule 613.9" by number, and as the
  fallback if embedding ever fails. So System 3 is never worse than today.

This step also shapes what gets embedded, using the chunking findings the probe
told the prior package to absorb: fold each keyword's sub-rules into one
self-contained document, prefix an orphan lettered sub-rule with its parent
sentence for embedding purposes, and split fused `Example:` text out of the
vector while still printing it. Those change the vector, not the prompt text.

**Measurement gate:** the shipped quantised model's clean and multi-card recall@5
are re-measured on the committed benchmark and compared against the full-precision
baseline (0.865 clean / 0.763 multi-card, intake evidence); a material drop ships
full precision by container image instead. The eval runs on committed frozen query
vectors so REQ-032's no-live-call rule holds. And the deploy package budget test
stays green — see the reserve finding below.

## The deploy-budget finding this step must handle

NFR-017 guards the answer Lambda's 250 MB unzipped package quota
(`scripts/lambda-package-budget.test.mjs`). It splits that into a data budget and
a fixed **20 MB reserve for code plus `node_modules`**.

**Measured live, 2026-09-05:** committed data is 111.9 MB against a 230 MB data
budget — 118 MB of headroom, so the ~5.3 MB embeddings artifact fits easily.

But the bundled model does **not** live in `apps/backend/data`; it lives in
`node_modules`, inside the 20 MB reserve. A quantised MiniLM is ~23 MB on its own
before the runtime that loads it (intake
`semantic-rule-retrieval-branch/FINDINGS-EMBEDDING-PROVIDER.md`). **Step 5 would
blow the reserve.**

The guardrail gets amended in lockstep with the step that needs it — its reserve
re-measured against the real packaged non-data footprint. It is not loosened
quietly and it is not routed around. A disarmed budget check is how the
2026-08-22 two-day deploy outage went unseen, which NFR-017's own notes record.

## Scope

In scope: System 3 supplemental Comprehensive-Rules retrieval — how the query is
built, what the corpus looks like, how rules are scored, and how any of that is
measured.

Non-goals:

- **No semantic retrieval over cards, rulings, or combos.** They are exact-id
  lookups and stay that way (SCOPE-A).
- **No vector database, no hosted embedding service** (SCOPE-C). Both were priced;
  a dedicated always-on host costs hundreds a month idle for a workload that costs
  cents in-process.
- **No mechanic-definition corpus injection.** The parked idea of guaranteeing
  every relevant mechanic's written definition appears in the prompt reuses this
  machinery but is a different feature — a new corpus and a new prompt section.
  It becomes its own package once Step 4 answers Q-001.
- **No System 2 change.** The curated `GAME RULES (reference)` block is picked by
  game state, not by scoring; there is nothing for retrieval to replace there.
- **No prompt-structure work.** Splitting the prompt into system and user roles,
  retuning the static instructions, and reshaping the board rendering are real
  levers, but they are prompt refinement, not retrieval.
- **No combo over-assertion fix.** See the disposition table.
- **No user-visible change.** No new screen, overlay, or layout row, so
  `screen-layout.md` is untouched.
- **No new endpoint.** `POST /api/ask-ai` and `GET /api/cards/:oracleId` stay the
  only two (NFR-004).

## How the three standing constraints are honoured

**The word-overlap path is retained, three ways** (SCOPE-D). It is the offline
default; it is the boost that catches an explicitly cited rule number, which
meaning-matching misses (the benchmark shows gold rule `613.9` at lexical rank 1
and semantic rank 5); and it is the fallback on any embedding failure. Removing
it is not proposed at any step.

**Mock stays the default and still runs with no model access.** The canonical
mock-first rule lives in `integrations-and-data.md`'s Tech Stack line. The new
`EMBEDDING_PROVIDER` switch mirrors the existing `ASK_AI_PROVIDER` switch exactly:
default `mock`, no auto-switch on environment. In `mock` there is no embedding at
all, so a checkout with no model and no network behaves exactly as it does today.

**REQ-032's no-external-call rule holds.** REQ-032 says relevance checks make no
live AI provider calls. Two things preserve it. The shipped semantic provider is a
model bundled in the process, so there is no per-request network call to make in
the first place — the "no per-request external call" posture is *preserved*, not
reversed. And the eval measures the semantic path against **committed frozen query
vectors**, so `system3-expected-recall` and `system3-noise-excluded` run with no
live embedding call and no live AI call, deterministically.

## Disposition of every intake item

| Intake item | Disposition | Why |
| --- | --- | --- |
| `probe-slow-load-vs-rag/PROBE.md` | Absorbed | Its prioritisation answer (compression first) already shipped; its RAG conclusion is this gameplan. |
| `probe-slow-load-vs-rag/FINDINGS-data-layer.md` | Absorbed | Its three-piece ordered path is Steps 2, 4 and 5; its "carry more Scryfall backward, less forward" discipline is Step 4's shape. |
| `probe-slow-load-vs-rag/FINDINGS-slow-load.md` | Out of scope | Deploy-layer compression. `cardMetadata.json` is now under the CloudFront ceiling; `cardScanMap.json` (~21 MB) and `cardPrintingPrices.json` (~38 MB) are not. Reported, not built. |
| `probe-slow-load-vs-rag/GRAPH-BRIEF.md` | Superseded | Already shipped as image-first-cards. |
| `probe-prompt-data-optimization/PROBE.md` + `FINDINGS-prompt-anatomy.md` | Absorbed | Lever 1 (fix the query first) is Step 2; the length-bias and attractor-rule findings are Step 3's regression set. Its `retrieval:report` crash is fixed on this branch — the report now runs and its 3 remaining failures are the parity defect Step 1 fixes. |
| `probe-prompt-data-optimization/FINDINGS-data-pipeline.md` | Partly absorbed | Levers 1, 2, 3, 9 and 10 (corpus hygiene and chunking) are Steps 3 and 5; lever 4's `keywords` is Step 4. Levers 5–8 (multi-face parsing, vanilla creatures, ruling relevance ranking, System 2 keyword gating) are out of scope — real, but card-data and System 2 work, not retrieval. |
| `probe-prompt-data-optimization/FINDINGS-prior-work.md` + `APPENDIX` | Absorbed as evidence | Source of the benchmark table and the ID/branch history. Its warning that no hybrid fusion number was ever measured is carried into REQ-181's gate. |
| `semantic-rule-retrieval-branch/DESIGN-BRIEF.md` | Superseded | Its Change A is Step 5, re-numbered and re-based on live truth; its Change B is descoped (below). |
| `semantic-rule-retrieval-branch/GATE-QUESTIONS.md` | Superseded | Nine unanswered slots on IDs that no longer exist. Its reserved `REQ-170` is now live truth for an unrelated feature (concurrent spec-forming); every ID here is re-minted from live next-free numbers. |
| `semantic-rule-retrieval-branch/FINDINGS-EMBEDDING-PROVIDER.md` | Absorbed as evidence | The provider measurement behind SCOPE-B. Re-opened as a gate slot, not adopted silently. |
| `semantic-rule-retrieval-branch/GRAPH-BRIEF.md`, `IDEA.md`, `HANDOFF.md`, `README.md` | Absorbed as evidence | The decisions they call settled are the four SCOPE slots at this gate. |
| `combo-context-validation-branch/FINDINGS.md` | Absorbed as evidence | Source of the 0.577 / 0.026 / 0.885 / 0.603 benchmark numbers and the 488/500 combo result. |
| `combo-context-validation-branch/HANDOFF.md`, `IDEA.md`, `README.md` | Absorbed as evidence | Method and provenance for the numbers above. |
| `prompt-context-refinement-history/RAG-DEFERRED.md` | Absorbed as a pointer, not as scope | The mechanic-definition enrichment idea stays deferred; this package repoints the two live citations that dangle at its deleted path and records where the idea now lives. |
| `prompt-refinement-notes/promptRefinement-analysis.md` | Absorbed | Confirms RAG's blast radius is one prompt section, and that the other ~12 are refinement levers — which is why this brief's non-goals exclude them. |
| `prompt-refinement-notes/promptRefinement.md` | Absorbed | The owner's original framing; answered by this gameplan plus the refinement non-goal. |
| `prompt-refinement-notes/promptRefinement-notes.md` | Superseded | Consumed by the shipped prompt-context-refinement run; its observation 1 is the RAG-DEFERRED item above. |
| `prompt-refinement-notes/promptRefinement-enhancements.md` | Out of scope | An unfilled template for prompt-refinement intake, not retrieval. |
| Cited-only durable docs (`ideasForLater/future-infra/*`, five receipts, the `explore` harness path) | Cited, not opened | Recorded as citations per the intake rule. |

### The one descoped item worth the owner's eye

The prior package coupled RAG with a **combo over-assertion fix**: in Quick
Question with no board, the model sometimes claims a working combo from cards that
do not combo. Measured, it was the only hard error class in a 500-case suite —
2 of 500, and the highest-severity one a player would notice.

It is **not** retrieval. It is one prompt-instruction line, and folding it into a
retrieval gameplan would make both harder to measure. It is descoped here, with
its evidence preserved, and wants its own small package. Nothing in this gameplan
blocks it or depends on it.

## Amendment set — enumerated by grep, not from memory

Every live `PRD/sections/` location that asserts System 3 is word-overlap scored,
or that its query carries raw card rules text. Each is amended in lockstep with
the step whose source requirement changes it, so a derived spec never contradicts
its requirement.

Enumerated by `grep -rniE 'idf|lexical|keyword.scor|tf-idf'` and
`grep -rniE 'system 3|supplemental'` over `PRD/sections/`, 2026-09-05.

**Scoring assertions (change with Step 5 / REQ-181):**

- `functional-requirements.md` REQ-022 — the source requirement
- `functional-requirements.md` REQ-032 — the eval requirement
- `system-map.md:88` — "Scores up to 5 supplemental rule excerpts … with IDF weighting"
- `system-map/game-rules-retrieval.md:21-25, 37-39, 52-53, 63-66, 82-88`
- `system-map/prompt-layout-spec.md:36` — "retrieved by keyword-scoring"
- `quick-lookup/README.md:260-266` — `### Retrieval` Built: line
- `quick-lookup/README.md:315-317` — `## Measured bounds` retrieval line
- `in-depth/README.md:329-332` — `### Retrieval enrichment` Built: line
- `in-depth/README.md:465-467` — the DEC-032 closed-door note (extended, not rewritten)
- `integrations-and-data.md:350` — "scored per DEC-046"

The two `Built:` lines in `quick-lookup/README.md` and `in-depth/README.md` are
called out explicitly: a prior quality-check failed on exactly those.

**Query-construction assertions (change with Step 2 / REQ-178):**

- `functional-requirements.md` REQ-074 — "System 3 scored against the card as well as the question"
- `functional-requirements.md` REQ-167 — "scores the question plus every attached card's oracle text and type line"
- `quick-lookup/README.md:195-205` and `:260-266` and `:315-317`
- `system-map/prompt-layout-spec.md:36` and `:60`
- `system-map/game-rules-retrieval.md:21, 38, 63`
- `user-flows.md:252` — "card-scored System 3"
- `user-flows.md:517` — "scored over the question plus all attached cards"

**Measurement assertions (change with Step 1 / REQ-177):**

- `system-map.md:493` — "shares scoring logic with the harness so report output cannot drift" (false since REQ-176)
- `functional-requirements.md` REQ-032 — the report acceptance criterion

**Data and infra assertions (change with Steps 4–5):**

- `integrations-and-data.md` Tech Stack — adds the `EMBEDDING_PROVIDER` boundary
- `integrations-and-data.md` Game Rules Data Strategy — adds the embeddings artifact
- `non-functional-requirements.md` NFR-017 — the package-budget reserve

**Dangling pointers repaired (no step; corrects live truth):**

- `functional-requirements.md:3874` (REQ-168 Notes) → cites the deleted
  `PRD/work/prompt-context-refinement/RAG-DEFERRED.md`
- `non-functional-requirements.md:286` (NFR-018 Notes) → same deleted path

**Open question:**

- `open-questions.md` Q-001 — answered by Step 4 / REQ-180

**Not amended:** `screen-layout.md` (no user-visible surface changes),
`system-map/lookup-phrasing-glossary.md` (guardrail phrasing, unrelated),
`system-map/prompt-assembly.md` (describes section order and roles, neither of
which changes), `goals-and-non-goals.md`, `technical-design-rules.md` (no new
endpoint, no rules engine, mock-default preserved).

## Material assumptions

Graph mode: no approval pause. Each assumption below was resolved with
`PRD/instructions/preparation-contract.md`'s conservative assumption ladder,
applied per question as it arose. None met the three-condition genuine-blocker
test.

1. **Five steps in this order, all proposed at one gate.** Ladder #1 and #4. The
   ordering is forced by dependency, not preference: you cannot judge a retrieval
   change on an instrument that disagrees with itself (Step 1 before all), the
   query flood is measured as independent of the scorer (Step 2 before Step 5),
   embedding a corpus with 147 duplicate entries embeds the duplicates (Step 3
   before Step 5), and the keyword signal Step 2's compact query needs is the
   field Step 4 adds (Step 4 before Step 5's final gate). Proposing all five at
   one gate is the graph lifecycle's shape — one `define` gate per package.

2. **New requirement ids `REQ-177` through `REQ-181`.** Ladder #1. Live
   `functional-requirements.md` runs to REQ-176; REQ-170 through REQ-176 were
   minted on `main` after the intake reserved a `REQ-170`-range id in August.
   Every id here is read from the live file today. `FLOW-024` is likewise the
   live high-water mark, and no new FLOW is proposed because no player-facing
   step changes.

3. **Q-001 is answered, not deferred again.** Ladder #1. Q-001's own
   "Options under consideration" already lists Scryfall per-card `keywords` in the
   committed pipeline, unioned at query time; Step 4 is that option. Q-001's
   recommended next step said "revisit after labeled-recall metrics show gaps" —
   Step 1 produces exactly those metrics and Step 4 is the revisit. Answering it
   inside a gate slot the owner rules on is the smallest honest move; leaving it
   open while shipping the mechanism it governs would decide it silently.

4. **The four corpus-scope decisions get their own gate slots** (SCOPE-A through
   SCOPE-D) rather than riding inside REQ-181. Ladder #6. Rules-only scope, a
   bundled local model, no vector database, and retaining word overlap are product
   decisions with real alternatives; the intake calls them settled, and intake is
   evidence, not authority. Each slot carries its measurement inline. To keep a
   single source of truth, each decision's constraint text appears in exactly one
   slot — REQ-181's own slot shows its remaining constraints and points at these
   four.

5. **NFR-017's reserve is amended rather than a new NFR minted.** Ladder #4 and
   #1. The Lambda package quota already has one authoritative home with a live
   test behind it; adding a second size guardrail would create the duplicate
   cross-cutting rule the single-source-invariants work just removed. The reserve
   number is deliberately left to be re-measured at implementation against the
   real packaged footprint rather than set from the intake's ~23 MB figure.

6. **Every numeric gate is relative or re-measured, never derived by proportion.**
   Ladder #2. Step 2's gate is a gap between two numbers from the same build;
   Steps 3 and 4 are no-regression against the previous step's recorded number;
   Step 5 re-measures the quantised model against the full-precision baseline
   rather than asserting it. The one place a proportion was stamped onto a
   different unit — NFR-019's 80% on a gzipped gate — was unreachable and slipped
   four quality checks before the owner caught it.

7. **`EMBEDDING_PROVIDER`, values `mock` | `local` | `openai`, default `mock`.**
   Ladder #3. Mirrors the live `ASK_AI_PROVIDER` boundary exactly. The wire
   spelling is an implementation choice; the mock-default behaviour is the part
   that is fixed.

8. **The embeddings artifact sits beside the rule index in
   `apps/backend/data/`.** Ladder #3. Follows the existing dual-output build
   convention of `build-game-rules.mjs`. The exact filename is an implementation
   choice; NFR-017's tracked-data measurement is what binds it.

9. **NFR-009 does not say what the intake claims.** Ladder #1, recorded because
   the intake's brief repeatedly cites "NFR-009 (mock is default and must run with
   no model access)". Read live: NFR-009 is *Local prompt preview developer
   workflow*. The mock-first canonical rule actually lives in
   `integrations-and-data.md`'s Tech Stack line, which names its own echo sites.
   This brief and the gate cite the real home.

10. **The combo over-assertion fix is descoped.** Ladder #4 and #6. The owner
    asked for a pinpoint RAG gameplan; a prompt-instruction fix with its own
    500-case eval is a separate, smaller package. Its evidence is preserved above
    so it can be opened without re-investigating.

## Evidence

- Measured live on this branch, 2026-09-05: `npm run retrieval:report` (6/9,
  three false failures), `npm --workspace apps/backend run test:eval` (green),
  `node --test scripts/lambda-package-budget.test.mjs` (green, 111.9 MB tracked
  data against a 230 MB budget), and a direct count of
  `apps/backend/data/gameRulesRuleIndex.json` (3,432 entries, 3,285 distinct rule
  ids, 626 entries under 60 chars).
- Located in code: `apps/backend/src/eval/retrievalReportInputs.ts` (no
  `cardDetailIndex` on either path), `apps/backend/src/gameRulesRetrieval.ts`
  `buildQueryParts` and `scoreEntry`,
  `apps/backend/src/eval/contextEvaluationHarness.test.ts`
  `cardDetailIndexFromRequest`, `scripts/lambda-package-budget.test.mjs`.
- Benchmark numbers (0.577 / 0.026 lexical, 0.885 / 0.603 OpenAI, 0.865 / 0.763
  local MiniLM, n=156, recall@5): intake
  `combo-context-validation-branch/FINDINGS.md` and
  `semantic-rule-retrieval-branch/FINDINGS-EMBEDDING-PROVIDER.md`. Cited as
  evidence; Step 1 makes them reproducible in-repo.
- Prompt anatomy and corpus shape: intake `probe-prompt-data-optimization/`.
