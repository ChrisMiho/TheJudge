# Design brief — right-rules-in-order

**Ask:** Decide. Answer each verdict slot in `GATE-QUESTIONS.md` (39 slots: 13
new requirements, 26 amendments). Nothing here is product truth until you accept
it; `build` applies what you accept.

## What the player gets

When a player asks a rules question, the rules that decide the ruling reach
Luna (the answering model) about twice as often. On the held-out half of the
practice suite, deciding-rule citations in her top ten go from 223 to about 450.
Questions where every deciding rule reaches her go from 75 to about 150 of 580.

She reads those rules the way a judge would. They come in rule-book order,
grouped and labelled with where they sit ("Turn Structure › Cleanup Step"). A
rule that says "subject to the following exception:" arrives with the exception.

Quick Lookup gets the short summary of a turn step when the question names one.
In-Depth already gets it for the current step. That summary is the main reason
In-Depth got the Necropotence corner case right 10 of 12 times against Quick
Lookup's 6 of 12.

A set of prompt bugs goes away: wrong facts in the step summaries, instructions
that describe sections Quick Lookup doesn't have, rule numbers printed twice,
two rules missing from the rule data, rulings parked far from their card.

Unrelated cards on the table pull search off course no more than today. The
search model stays the same size and speed.

All figures above are the intake's measurements
(`intake/GRAPH-BRIEF-search-and-prompt.md`), cited, not re-derived. The build
re-measures them on its own code (Acceptance targets below).

## Scope — four parts, in this order

**A. Rule data.** Fix the rule-book parser and rebuild the rule index: part
titles glued onto eight rules (including 514.3a and 616.2), two real rules
dropped as headings (700.15, 303.7), two empty pieces kept (702.163, 702.179),
two-letter rule ids merged (704.5aa into 704.5z), word tokens that keep sentence
dots or split "can't". Add the rule book's glossary (for obsolete terms like
"mana burn"), its edition and source hash, and its part titles (for labels).
Slot: REQ-179.

**B. Search.** Four token fixes (every card keyword weighted, dots stripped,
Porter stemming, six everyday verbs dropped from the keyword list), a fixed
concept map that turns card wording into rule-book concepts, a per-card search
with two reserved slots, the current turn step in In-Depth's query, meaning
weight 0.65, a loud failure when the OpenAI embedder's vector size mismatches,
stray numbers no longer read as rule ids, and a rule-book-order tie-break.
Slots: REQ-233, REQ-234, REQ-235, REQ-178, REQ-180, REQ-182, REQ-181.

**C. The trained model.** `all-MiniLM-L6-v2` fine-tuned on the committed
corpus, the rule book's worked examples and the local practice suite. A
committed script trains, cross-validates and exports it; the owner retrains it
locally when the rule book, corpus or suite changes. The model lives in the
private S3 bucket, never in git; a committed manifest names it and hashes every
file; packaging fetches and checks it; every committed vector file records the
model that built it. Slots: REQ-236, REQ-237, REQ-181, REQ-183, REQ-184,
REQ-232, NFR-017.

**D. Prompt building.** Corrected step summaries, and Quick Lookup gets them
when a step is named. Excerpts in rule-book order, grouped, labelled, id once,
with the parent's lead-in where a piece needs it. Lead-ins arrive with their
lists, in search excerpts and curated topics alike; curated topics gain missing
rules. Rulings sit under their card. In-Depth picks curated topics by card
wording and question. One instruction list, a reference block per mode, one
stack numbering, rules framed as binding. "See rule X" pointers carry what they
point at. Card blocks show power, toughness and loyalty, and keep line breaks.
Slots: REQ-238 to REQ-245, REQ-022, REQ-024, REQ-030, REQ-074, REQ-167,
REQ-176, REQ-190, REQ-220, FLOW-011, FLOW-023, and the seven section docs.

Order of work: A → B → C → D. Training (C) uses the shipped query builder from B
and the fixed rule text from A, so it runs after both land. D depends on A only
and may run beside C.

## Non-goals

- No reranker, no BM25, no bigger off-the-shelf embedder, no labelled rule text
  inside the vectors (intake "Results that were tested and rejected").
- The excerpt cap stays ten (REQ-190). **Amended 2026-10-12 at the build-half park:** the owner accepted up to fifteen excerpts with a 0.6 relevance cutoff (REQ-190) and keyword rule sets beside the excerpts (REQ-235); see `GATE-QUESTIONS.md` `## Build-half amendments` and `evidence/fix-experiments.md`.
- No change to answer grading, the judge, or the rubric.
- P5 ("use only the provided context") and P13 (instructions as a system
  message) stay as they are; a paid run tests them later.
- S6, the follow-up search query, is briefed separately and out of scope.
- No change to the request or response shapes, the frontend, or any endpoint.
- No practice-suite question, answer, card list, id or per-question result in
  any committed file.

## Stable IDs

New (reserved here, written live only by `build`):

| ID | In plain terms |
| --- | --- |
| REQ-233 | Search word matching: dots, stemming, six verbs off the keyword list, stray numbers, rule-order ties, obsolete terms via the glossary |
| REQ-234 | The concept map: card wording becomes rule-book concepts in the search |
| REQ-235 | Per-card search fills two of the ten slots |
| REQ-236 | The Magic-trained search model: training, cross-validation, retraining |
| REQ-237 | The trained model is stored privately in S3 and checked at every load |
| REQ-238 | Step summaries corrected; Quick Lookup gets them when a step is named |
| REQ-239 | Excerpts in rule-book order, grouped, labelled, id once, lead-in where needed |
| REQ-240 | A rule that promises a list arrives with it; curated topics completed |
| REQ-241 | Rulings sit under their card, framed as situation-specific |
| REQ-242 | In-Depth picks curated topics by card wording and question, not zones |
| REQ-243 | One instruction list, a reference block per mode, one stack numbering, rules binding |
| REQ-244 | "See rule X" pointers carry what they point at |
| REQ-245 | Card blocks show power, toughness, loyalty, and keep line breaks |

Amended: REQ-022, REQ-024, REQ-030, REQ-074, REQ-167, REQ-176, REQ-178,
REQ-179, REQ-180, REQ-181, REQ-182, REQ-183, REQ-184, REQ-190, REQ-220,
REQ-232, NFR-017, FLOW-011, FLOW-023; and the section docs
`system-map/game-rules-retrieval.md`, `system-map/prompt-layout-spec.md`,
`system-map/prompt-assembly.md`, `quick-lookup/README.md`,
`in-depth/README.md`, `integrations-and-data.md`, `system-map.md`.

No `DEC-###` is added (the decision log is retired). No screen changes, so no
`screen-layout.md` row.

The amendment set comes from one line-level grep: 100 hits, 70 amend, 5 build,
25 no change. Command, hit list and a row per hit:
`evidence/amendment-grep.md`.

## Design decisions

### A. Rule data

- The parser fixes are listed in REQ-179's amendment. After them the index is
  rebuilt from the same 2026-09-25 rule book. The build diffs old against new
  and asserts that `ruleId`, `sectionTitle` and `text` change only for the
  listed pieces (plus the two restored rules, minus the two empty ones).
  `searchText` and the token statistics change everywhere, because of the token
  fixes in B; that is expected and recorded.
- The glossary (741 entries, 35 obsolete) is stored beside the index. It feeds
  only obsolete-term query translation (REQ-233). It is never an excerpt.
- The index records the rule book's edition, a hash of its source, and each
  part's title. Part titles feed the path labels (REQ-239).

### B. Search

- Word weights: question ×3, card signal ×1, concept term ×2. A token that is a
  keyword (vocabulary word or the card's own Scryfall keyword) is additionally
  ×6, multiplying the source weight as today.
- Concept terms and In-Depth's turn step also join the text that is embedded.
  Raw card oracle text never enters the main query or its embedding (REQ-178).
- Per-card search is a separate query per card. It never merges into the main
  query, so the main eight slots keep REQ-178's protection.
- Blend: meaning 0.65 / words 0.35, each normalised by its own maximum, as
  today. 0.65 sits inside REQ-182's accepted band of 0.50–0.70.

### C. The trained model

- Recipe and export as REQ-236 states (intake C.2–C.3, ported).
- Storage and identity as REQ-237 states (intake C.5–C.6).
- The shipped model trains on 100% of the data. The acceptance numbers come
  from 5-fold cross-validation, so each question is scored by a model that
  never trained on it.
- The first training is done in `build`, locally. A probe implementation exists
  to port (intake C.1 names its three files under
  `PRD/work/probe-prompt-format-tuning/runs/search-trained-embedder/`; cited
  only, not opened here).

### D. Prompt building

- In-Depth order becomes: preamble → instructions → reference (game) → general
  context → additional game state → phase guidance → zone sections (each card
  followed by its rulings) → curated rules → excerpts → combo context → scope →
  history → question.
- Quick Lookup order becomes: preamble → instructions → reference (lookup) →
  phase guidance (only when a step is named) → curated rules → excerpts → cards
  (each followed by its rulings) → combo context → history → question.
- `OFFICIAL RULINGS (WotC reference)` stops being its own section.

## Acceptance targets

Free and local, run by `build` on its own code and data. Thresholds are the
intake's measured values with a small margin.

1. **Search fidelity, before any change.** The build's committed scorer
   reproduces production's current top ten on every suite and corpus question:
   473 deciding-rule citations found in the suite (tuning plus check), 159
   suite questions with every deciding rule found, 5 of the hard 25, 351 corpus
   citations, 305 corpus cases with every deciding rule. A mismatch stops the
   build before any change.
2. **Cross-validated suite, 5-fold, shipped recipe.** Check half ≥ 430
   citations (measured 449), tuning half ≥ 410, every-rule check ≥ 140, hard 25
   ≥ 15.
3. **Final model.** Corpus ≥ 410 citations and ≥ 355 cases with every deciding
   rule. Bench@5 (156 questions with three unrelated cards, top-five hits)
   ≥ 118. Necropotence (`necropotence-silence-borne-upon-a-wind-cleanup`): 514.1,
   514.2 and 514.3a all in the top ten in both versions, and in the built
   prompt.
4. **Built prompts.** Every committed corpus case built as a Quick Lookup prompt,
   and as an In-Depth prompt when it has a game state:
   - 0 lead-ins without their list, and the list-overflow line fires on 0;
   - 100% of excerpts in rule order;
   - 0 doubled rule ids;
   - 0 references to sections absent from that mode;
   - the step summary present in Quick Lookup whenever the question names a step;
   - every case whose deciding 613.x (layers) or 510.x (combat damage) rule
     reached the prompt before the change still has it after.
   This check is committed and runs in `quality:check` (the corpus is
   committed; no suite data is read).
5. **In-Depth topics.** On the 9 corpus cases that exist in both versions,
   In-Depth keeps at least 17 of their 30 deciding rules in the prompt.
6. **Standing gates stay green.** `npm run quality:check`; `npm run test:eval`
   with every golden change reviewed, never silent; the 12 labelled fixture
   checks (REQ-182); the 156-pair benchmark's hybrid recall@5 at or above
   REQ-182's floors (0.8526 clean, 0.8333 polluted); the rules gate under the
   one-time re-baseline rule in REQ-236.
7. **Concept map test.** Every distinct word of every concept term appears in
   the committed rule index (163 words over 82 entries at intake). Entry counts
   are 77 oracle-text plus 5 type-line.
8. **Rule data diff.** Only the listed pieces change their id, title or text.
9. **Identity.** A test proves a model-id mismatch between a vector file and
   the runtime model is refused loudly; another proves an OpenAI-sized query
   vector against the 384-dimension rule vectors is refused loudly.
10. **Stemming cases.** The ranks of 702.3a (`defender-ageless-sentinels`),
    113.7a (`sensei-top`) and 615.12 (`unpreventable-damage-hydra`) are recorded
    before and after. Reported, not gated.
11. **Size.** Report rule characters per prompt (intake expects about 4.9k
    against 7.5k for search excerpts; curated lists add about 3.7k to every
    prompt, see REQ-240). The model folder is about 23.0 MB. NFR-017's package
    budget test passes.
12. **Privacy.**
    - A local scan of every tracked file against the suite's question and
      answer text finds 0 matches (run locally, counts only).
    - `git ls-files` lists no model weights (`*.onnx`, `*.safetensors`,
      checkpoints). A committed test asserts this.
    - Training pairs, checkpoints and per-question results exist only under
      git-ignored folders.

## After merge (owner)

1. **Before merging the code PR:** upload the 100% model folder to the private
   bucket under `models/<model-id>/` with profile `thejudge-admin`, and run
   `scripts/aws-bootstrap.sh` if the deploy role lacks `s3:GetObject` on that
   prefix. The build hands over the exact commands. The deploy on merge fails
   (by design, REQ-237) if the model is not there.
2. **After deploy, free check:** one live request plus a CloudWatch tail to
   confirm the semantic path is live (the native-binding chain has failed
   silently twice before).
3. **Latency:** time one live Quick Lookup and one In-Depth answer; the answer
   budget is 30 s (Lambda 40 s).
4. **One paid batch, launched by the owner with `!`:** Luna answering, judge
   gpt-6.1-sol, rubric per `docs/eval/answer-quality-investigation/RUNBOOK.md`,
   `--max-cost-usd` ≤ 15 per run:
   - Necropotence ×10 per version; bar: Quick Lookup ≥ 9/10 (today 6/12);
   - the hard 25 and the 18 hard corpus cases; bar: no regression;
   - the ordinary corpus regression set; bar: no regression;
   - then P5 and P13 as separate prompt-only arms.
   Before spending, assert the request inputs and abort on any silent fallback
   flag.

## Material assumptions

Each was resolved per question with the conservative ladder in
`PRD/instructions/preparation-contract.md`.

1. **Intake mis-cite.** The intake says the excerpt cap stays ten under REQ-095.
   REQ-095 is combo enrichment; the cap lives in REQ-190 (and REQ-181,
   REQ-182). The cap is unchanged either way. (Rung 1.)
2. **Card-wording search terms reverse a recorded rejection.** REQ-220's notes
   record that adding "replacement effect" terms from card wording to the
   search was measured and rejected on 2026-10-07, on the stock model. The
   concept map does this on the trained model, measured by the intake's ablation
   (432 check without the map, 449 with). Surfaced in REQ-234's slot so the
   owner decides knowingly. (Rung 1.)
3. **Training on the practice suite touches REQ-232.** REQ-232 keeps the suite
   local only and says nothing from it enters a player's prompt. A model trained
   partly on it ships its weights to production from private storage. Surfaced
   as its own slot; if rejected, the model trains without practice questions
   (intake: 348 check against 449). (Rung 1.)
4. **Hard 25.** The build reproduces the probe's hard-25 selection from local
   material and keeps its ids git-ignored; committed text gives its count and
   level only. If it cannot be reproduced, the build parks that one gate for
   the owner rather than substituting a different set. (Rung 4.)
5. **Lead-in rule and list budget.** A lead-in is a rule whose text ends in a
   colon or in "following exception(s)." or "following rules."; its list is its
   directly lettered sub-rules. Measured at define on the committed index: 28
   lead-ins have such a list; list size median 1,071 characters, 90th
   percentile 3,587, largest 5,359 (704.5, 24 items). The per-prompt list budget
   is 12,000 characters, enough for any two of the largest lists. (Rung 4,
   measured.)
6. **Curated lists go in the manifest.** A curated topic's lead-in rule lists
   its list items as topic rule numbers, so REQ-179's exact-number exclusion and
   its data test keep working unchanged. 117.3a–d add 916 characters and
   400.7's twelve sub-rules add 2,833 to every prompt (always-on topics).
   (Rung 3.)
7. **Step detection.** A step is named when the question contains a step name
   from one fixed committed table of rule-book step names, or when an attached
   card's concept terms name a step. At most three summaries, in turn order.
   Quick Lookup renders them under `PHASE GUIDANCE` after `MTG REFERENCE`,
   worded as a description of the step, not "You are in…". (Rung 4.)
8. **In-Depth turn step in the query.** The step's rule-book name (for example
   "cleanup step") joins the word query at concept weight and the embedded
   text. (Rung 3.)
9. **Obsolete terms.** When the question contains a glossary term the glossary
   marks obsolete, that entry's definition words join the word query at concept
   weight and the embedded text. (Rung 4.)
10. **Stray numbers.** A bare three-digit number counts as a rule reference only
    after "rule", "rules", "CR" or "section"; a dotted id (613.9) always counts.
    (Rung 4.)
11. **One stemmer.** Porter stemming is one in-repo implementation shared by the
    rule-index build, the backend and the training export. No new npm
    dependency. (Rung 6.)
12. **Per-card search.** Cosine-only over the committed rule vectors, using the
    card's oracle text as the card-detail artifact holds it. Off under `mock`
    (all ten slots from the main list). Offline gates use committed frozen
    per-card vectors so they stay offline and mirror production. (Rungs 2–3.)
13. **Loud mismatch.** At runtime a model-id or dimension mismatch disables the
    semantic path with one error-level diagnostic naming both sides (REQ-181's
    lexical fallback, never a silent mixed ranking). Packaging, the eval
    harnesses, the benchmark and the rules gate refuse outright. (Rung 2.)
14. **In-Depth topic choice applies to In-Depth only.** Quick Lookup keeps its
    four always-on topics plus REQ-220. Trigger terms for each formerly
    zone-gated topic come only from words of the topic's own title and its
    rules' section titles. (Rung 4.)
15. **Rulings under the first appearance.** A card shown more than once carries
    its rulings once, under its first appearance. (Rung 4.)
16. **Pointer cap.** At most ten resolved "see rule X" pointers per prompt, each
    first sentence capped at 250 characters. (Rung 4.)
17. **Power/toughness/loyalty are backend-only**, like `keywords` (REQ-180): the
    card-detail route's block and the frontend payload are unchanged. A
    multi-face card's values are its faces' values joined with " // ". (Rung 5.)
18. **Rules gate re-baseline.** A model swap will move individual corpus hits.
    The rules gate (REQ-222) is re-baselined once, in this change, with
    `--allow-regressions`, every lost hit listed in the PR body and receipt, and
    net hits required to rise. This is a product decision, so it sits in
    REQ-236's slot. (Rung 1.)
19. **Standing benchmark floors stay.** REQ-182's hybrid recall@5 floors and
    the 12 labelled checks remain gates. A miss parks the build for the owner.
    (Rung 2.)
20. **Built-prompt checks.** Each corpus case is built in Quick Lookup, and in
    In-Depth when it carries a game state. (Rung 3.)
21. **Local inputs for `build`.** The raw 2026-09-25 rule book and the practice
    suite are read from the main checkout's git-ignored copies
    (`apps/backend/data/cr/source.txt`, `output/practice-suite/`). Nothing is
    downloaded. If the rule book is absent, the build parks. (Rung 1, the
    human-approved refresh policy.)
22. **Toolchain.** Training needs Python 3.12, `uv` and sentence-transformers,
    plus the public base model. These are dev-only, used by the owner-run
    training, never by the runtime or CI. (Rung 6, authorised by REQ-236 if
    accepted.)
23. **Names.** Proposed paths: concept map `apps/backend/src/gameRulesConceptMap.ts`;
    manifest `apps/backend/data/embeddingModel.manifest.json`; fetch script
    `scripts/fetch-embedding-model.mjs`. Map-out may rename. (Rung 3.)

## Blocker questions

None. Each open choice passed the ladder above. The two that change data
handling or reverse a recorded decision (assumptions 2 and 3) are surfaced as
gate slots rather than blockers, because the gate is where the owner decides
them.

## Current truth read

`PRD/sections/system-map/game-rules-retrieval.md`, `prompt-layout-spec.md`,
`prompt-assembly.md`, `quick-lookup/README.md`, `in-depth/README.md`,
`integrations-and-data.md`, `system-map.md`, `functional-requirements.md`
(REQ-022, 024, 030, 074, 167, 168, 169, 175–184, 190, 220, 222, 232),
`non-functional-requirements.md` (NFR-002, NFR-017), `user-flows.md` (FLOW-011,
FLOW-023), and the source files those docs name. The probe folder the intake
cites was not opened.
