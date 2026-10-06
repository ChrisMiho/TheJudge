# Design brief — niche-interaction-rule-tests

**What this is:** make the rules a player needs reach the AI when they ask about
two cards whose replacement effects collide, and lock that in with the
repo's existing rule-output tests.

**The headline.** A tester asked Quick Lookup how Academy Manufactor and Esix,
Fractal Bloom combine when he makes a Treasure. Even with both cards attached,
the AI never received the rules that answer it (rule 616.1: when two
replacement effects apply to the same event, the affected player picks the
order; 616.1f: then whatever still applies gets its turn). The fix proposed
here is a curated rules topic, "Interaction of Replacement and Prevention
Effects" (all of CR 616.1, 616.1a–g, and 616.2), that switches on whenever two
or more cards in the question carry replacement or prevention wording (the
word "instead", or a form of "prevent"). Measured offline: the Manufactor +
Esix question goes from MISS to HIT, and no existing rule-output test moves by
a single case or a single decimal.

**The tester's second question** (Silence + Necropotence + Borne Upon a Wind)
already gets its deciding rules with the cards attached; the AI answered it
wrong anyway. That is an answer-format problem, recorded as the next package,
not this one.

**What the owner decides at the gate** (`GATE-QUESTIONS.md`):

- `REQ-220` — the new replacement-interaction rules topic (the retrieval fix).
- `REQ-022` — amended in place: the curated rules baseline is no longer
  strictly "card-agnostic"; it gains this one card-wording switch.
- `REQ-221` — the two tester questions join the gating rule tests, so
  `npm run quality:check` fails if these rules ever stop reaching the prompt.

No live model spend is proposed: every measurement here is offline.

## Owner direction (re-scope, 2026-10-06)

The owner reviewed the first proposal (docs PR #266, a report-only test set)
and redirected before answering it. In his words, recorded once each in the
ledger's Instruction ledger:

- "if a user is not adding a card to the context, then i do not expect the
  agent to be able to answer the question" — and "if they are adding all the
  cards, thats the use case id like to focus on". Typed-name-only questions
  are out of focus.
- "i want to operate under the assumption that he did add the cards (even if
  he really didnt)". Every case attaches every named card.
- "the focus of this work should be on refining the rules retrieval process,
  as well as refining the output format of the initial prompt that goes to the
  agent" — and "lets start with making the rules correct, and then we can make
  the output pretty". This package fixes retrieval; output format is next.
- "we should be doing a full test of all use cases were using to validate
  output of rules, this is just expanding on it". Validation is every existing
  rule-output suite, plus the new cases.
- "if were going to adjust the output format, we again need to test". Carried
  into the format follow-up as its acceptance condition.

## The tester's questions (evidence, verbatim)

From `intake/screenwriter_temp_1791299243121.jpg`:

1. "How do academy manufactor and esix, fractal bloom interact when I'm
   attempting to create a treasure token?"
2. "Can I use the triggered ability of necropotence during my cleanup step to
   dodge silence effects and cast borne upon a wind?"

Per the owner, both are measured as if he attached every named card: Q1 with
`Academy Manufactor` and `Esix, Fractal Bloom` (two cards; the comma is part of
Esix's name), Q2 with `Silence`, `Necropotence`, and `Borne Upon a Wind`.

## What the rules say (for the owner to confirm — not product truth)

The cards, from the committed card data (`cardDetailByOracleId.json.br`):

- **Academy Manufactor:** "If you would create a Clue, Food, or Treasure
  token, instead create one of each."
- **Esix, Fractal Bloom:** "The first time you would create one or more tokens
  during each of your turns, you may instead choose a creature other than Esix
  and create that many tokens that are copies of that creature." Its ruling
  (2021-04-16): the effect "can apply to any token, not just creature tokens".
- **Silence:** "Your opponents can't cast spells this turn."
- **Necropotence:** "... Whenever you discard a card, exile that card from your
  graveyard. ..."
- **Borne Upon a Wind:** "You may cast spells this turn as though they had
  flash. Draw a card."

**Q1.** Both cards are replacement effects (CR 614.1a: effects that use the
word "instead"). When two apply to one event, the player creating the tokens
picks which applies first (616.1, 616.1e), then the process repeats with
whatever still applies (616.1f). Esix first: the Treasure becomes one copy of
the chosen creature, which is no longer a Treasure, so Manufactor no longer
applies. Manufactor first: the Treasure becomes a Clue, a Food, and a Treasure,
and Esix still applies, so the player gets three copies. This contradicts the
tester's claim that "you cannot benefit from both". No official ruling on this
exact pair was found; the nearest outside answer (Peregrin Took + Academy
Manufactor, tappedout.net, 2023) reads the rules the same way.

**Q2.** In the cleanup step, the player discards to hand size (514.1); then
"this turn" effects end (514.2), which ends Silence; then, if anything
triggered, players get priority and another cleanup step follows (514.3a).
Necropotence's discard trigger fires on that discard, so its controller gets
priority after Silence has ended and can cast Borne Upon a Wind. The tester is
right. (EDHREC, "Learning How to Use Necropotence in cEDH", 2026-08-11, agrees.)

Outside sources are evidence for the owner, never an answer key (REQ-185: "An
answer written by a contributor or an agent is never ground truth").

## The full rule-output test set

Every suite in the repo that checks which rules reach the prompt. "Gating"
means a failure fails `npm run quality:check`.

| Suite | What it checks | Gating? |
| --- | --- | --- |
| Worked-solutions retrieval check (`npm run eval:worked-solutions`, 18 cases, REQ-185, NFR-018) | whether each hard question's official rule is in System 3's top ten (System 3 is the scored rules search that adds up to ten rule excerpts to every prompt) | no, report only |
| Context-eval golden scenarios (`contextEvaluationHarness.test.ts`, lexical) | every fixture's prompt and context against committed golden files, plus labelled System 3 checks (REQ-032) | yes |
| Context-eval semantic relevance (same file, frozen query embeddings) | the same labelled System 3 checks under the shipped hybrid ranking | yes |
| Hybrid-retrieval benchmark (`ragRetrievalBenchmark.test.ts`, `npm run benchmark:rag-retrieval`, REQ-177, REQ-182) | recall@5 and MRR over 156 question→rule pairs, clean and with three cards' signal mixed in | lexical clean recall gates against the step-1 baseline; hybrid numbers are recorded |
| Retrieval relevance report (`npm run retrieval:report`) | the same labelled fixtures as the harness, printed | no |
| Answer-quality run (`npm run eval:answer-quality`, REQ-188) | the model's final answer against official worked solutions | no; live model spend, not run here |

## Method

`measure-candidates.mjs` (this folder; output saved beside it as
`measure-candidates.out.txt`), run from the repo root with
`npx tsx PRD/work/niche-interaction-rule-tests/measure-candidates.mjs`. Offline:
committed rule, card, and rulings indexes; the local MiniLM embedder in
process; no network; no model call.

Each candidate changes only how the System 3 query, or the curated topic set,
is built from the cards. Scoring is the unmodified production
`retrieveRulesForQueryWithDebug`. Before any candidate is scored, the script
asserts its baseline reproduces production exactly: `preparePromptInput`'s
System 3 picks for both new cases and all 18 gold cases (hybrid and lexical),
the 9 labelled fixtures with their frozen embeddings, and the benchmark's
`scoreBenchmark` numbers. It also reproduces the recorded hybrid benchmark
(0.8974 / 0.8910, `benchmark/semantic-results.json`).

"In prompt" means in System 3's top ten or in a selected curated topic.

## Baseline across all suites (measured 2026-10-06)

| Suite | Baseline |
| --- | --- |
| New: Manufactor + Esix, cards attached | **MISS** — 616.1 not in prompt (rank 50 lexical, beyond 300 hybrid); 616.1f beyond 300 both ways |
| New: Necropotence + Silence, cards attached | **HIT** — 514.2 System 3 #7, 514.3a #3 (hybrid); #7 and #4 (lexical) |
| Worked-solutions, hybrid | 16/18 in System 3; 18/18 in prompt |
| Worked-solutions, lexical | 14/18 in System 3; 16/18 in prompt |
| Gating semantic labelled checks | 14/14 |
| Gating lexical labelled checks | 14/14 |
| Gating prompt goldens | 31 fixtures, all match |
| Benchmark, lexical | clean recall@5 0.5833 (MRR 0.4249); polluted 0.5769 (0.4110) |
| Benchmark, hybrid | clean recall@5 0.8974 (MRR 0.7107); polluted 0.8910 (0.6920) |

The worked-solutions gap between "System 3" and "in prompt" is two cases whose
expected rule (603.2 for Panharmonicon, 400.7 for Restoration Angel) is already
in an always-on curated topic, so System 3 is barred from repeating it. The
check reports them as misses although the rule is in the prompt. Recorded as a
follow-up; not changed here.

## Candidates tried (measured, not reasoned)

| Candidate | Manufactor + Esix | Necropotence + Silence | Existing suites |
| --- | --- | --- | --- |
| C1 — put attached cards' oracle text into the System 3 search | MISS (616.1 #47 lexical / #284 hybrid) | **regresses to MISS** (514.2 #33 / #68) | benchmark polluted lexical 0.5769 → 0.3782, hybrid 0.8910 → 0.7756; 25 of 31 prompt goldens change |
| C2 — embed oracle text, keep word search unchanged | MISS (616.1 #274 hybrid) | **regresses to MISS** (514.2 #12 hybrid) | benchmark polluted hybrid 0.8910 → 0.8333 |
| C3 — add the rules term "replacement effect" / "prevention effect" to a card's search signal when its text says "instead" / "prevent" | MISS (616.1 #35 hybrid, #8 lexical; 616.1f #62 / #57) | HIT | polluted lexical 0.5769 → 0.5577, hybrid 0.8910 → 0.8718; 1 golden changes |
| C4 — the same terms added to the question side (weighted ×3) | MISS (616.1 #31 / #7; 616.1f #27 / #25) | HIT | polluted lexical → 0.5128, hybrid → 0.8718; 1 golden changes |
| C5 — curated 616 topic (616.1, 616.1e, 616.1f, 616.2) when **any one** card carries the wording | **HIT** (curated) | HIT | no score moves; 1 golden changes (Questing Beast's "can't be prevented" fires it alone) |
| C6 — same topic when **two or more** cards carry the wording | **HIT** | HIT | nothing moves; 0 goldens change |
| **C7 — full 616 family (616.1, 616.1a–g, 616.2) when two or more cards carry the wording** | **HIT** | HIT | nothing moves; 0 goldens change |

Every candidate leaves worked-solutions (16/18 and 14/18) and both gating
labelled checks (14/14) unchanged; the benchmark's clean condition has no
cards, so no candidate can move it. Full per-rule ranks are in
`measure-candidates.out.txt`.

What this shows: search-side changes (C1–C4) cannot get 616.1 into the top ten
— the rule's words ("two or more replacement and/or prevention effects are
attempting to modify the way an event affects an object or player") look
nothing like a question about Treasure tokens, and adding card text drowns the
question (C1, C2 break Q2 and the benchmark). A topic switched on by the cards'
own wording is deterministic and exact.

## Proposal: C7

**What a player gets.** Attach two or more cards that say "instead" (or
"prevent") and ask about them: the AI's `GAME RULES (reference)` section now
includes the Comprehensive Rules on how replacement and prevention effects
interact — who chooses the order, the special cases that go first, and that
the process repeats until nothing is left to apply. The same happens in a game
(In-Depth) question when two such cards are on the stack or in play.

**Why the full family over the minimal four rules.** Both measured identical
on every suite. 616.1 itself says the player chooses "following the steps
listed in rules 616.1a–f"; shipping 616.1 without those steps hands the AI a
procedure with its steps missing. Listing 616.1 also bars System 3 from
pulling any 616.1 sub-rule (REQ-179's prefix rule), so a minimal set would
make 616.1a–d and 616.1g unreachable whenever the topic is on.

**Cost.** The topic adds 3,662 characters to a prompt when it fires (the
minimal set: 2,057). On the Manufactor + Esix question that is the 14,524-
character prompt growing about 25%. Measured firing rate: 1,790 of 37,564
cards (4.8%) carry the wording, so two randomly chosen attached cards both
carry it about 0.2% of the time. In the existing suites it fires on none of
the 31 fixtures, 18 gold cases, or 156 benchmark questions.

**Why "two or more".** C5 (any one card) fired on the existing
`quick-lookup-multi-keyword-card` fixture (Questing Beast, whose text says
combat damage "can't be prevented") and changed its golden prompt; one effect
alone has nothing to interact with under 616. Two copies of the same card in
a game count as two, which covers the classic "two doubling effects" case.

**What does not change.** System 3's search text stays the question plus each
card's name, type line, and keywords, never oracle text (REQ-167, REQ-178), so
those requirements need no amendment. System 3 scoring, its cap of ten
(REQ-190), and the embeddings are untouched; no frozen query embedding
changes.

## Acceptance targets (from the measured numbers)

After the build, the same measurement must show:

- Manufactor + Esix (cards attached): 616.1 and 616.1f in the prompt, both
  rankings.
- Necropotence + Silence (cards attached): 514.2 and 514.3a in System 3's top
  ten, both rankings (today #7/#3 hybrid, #7/#4 lexical).
- Worked-solutions: 16/18 hybrid and 14/18 lexical in System 3 (18/18 and
  16/18 in prompt) — unchanged.
- Gating labelled checks: 14/14 semantic and 14/14 lexical on the existing
  fixtures, plus the new fixtures' checks (REQ-221) passing.
- Gating goldens: 0 of the 31 existing prompt or context goldens change.
- Benchmark: lexical clean 0.5833 / polluted 0.5769, hybrid clean 0.8974 /
  polluted 0.8910 — unchanged.

A result that fixes the new cases but moves any existing number is a
regression and is reported as one, never re-labelled.

## How the new cases join the suites (REQ-221, recommended)

Recommendation: two labelled fixtures in the gating context-eval harness
(`apps/backend/src/eval/fixtures/`), so `quality:check` fails if either set of
rules stops reaching the prompt.

- They pass today's labels once REQ-220 ships, so a gate is meaningful
  (the first proposal's reason for report-only — "Q1 misses and nothing fixes
  it" — no longer holds).
- The harness already checks both shapes: `expectedSystem2TopicIds` (curated
  topics — Q1's rules arrive this way) and `expectedSupplementalRuleIds`
  (System 3 — Q2's).
- The worked-solutions gold set is not an option: REQ-185 admits only cases
  with an official answer verbatim, and neither question has one.

## Amendment set (one line-level grep, one row per hit)

C7 changes one standing invariant: "System 2 (the curated rules baseline) is
card-agnostic". Every product-truth line asserting it, enumerated by:

```
grep -rnE "card-agnostic|game-state-gated|state-gated|game-state signals|always-on core|fixed always-on|fixed curated set|DEC-045 core set|no card names|not card names|affect System 2|oracle text, or keywords|owns all card" PRD/sections
```

27 hits, 2026-10-06:

| Hit | Says | Disposition |
| --- | --- | --- |
| `functional-requirements.md:363` | REQ-022 description: baseline "selected by card-agnostic game-state signals" | amend (REQ-022 block) |
| `functional-requirements.md:366` | REQ-022: topics "per DEC-045 (always-on core plus game-state-gated expansion)" | amend (REQ-022 block) |
| `functional-requirements.md:389` | REQ-022 constraint: System 2 uses "no card names, oracle text, or keywords" | amend (REQ-022 block) |
| `functional-requirements.md:390` | REQ-022 constraint: "System 3 owns all card/question-driven retrieval" | amend (REQ-022 block) |
| `functional-requirements.md:1780` | REQ-074: lookup "always includes ... the always-on core game-rules topics" | unchanged — still true; the new topic is added alongside, never instead |
| `system-map.md:66` | Game rules retrieval: "a card-agnostic curated game-rules baseline" | amend (REQ-220 block) |
| `system-map.md:81` | Curated game rules (System 2): "card-agnostic, game-state-gated conditional topics" | amend (REQ-220 block) |
| `system-map/game-rules-retrieval.md:14` | "conditional buckets from card-agnostic game-state signals only" | amend (REQ-220 block) |
| `system-map/game-rules-retrieval.md:16` | "Card names, oracle text, and keywords do not affect System 2" (sentence ends this line) | amend (REQ-220 block) |
| `system-map/game-rules-retrieval.md:63` | "selects System 2 topics from game-state signals" | amend (REQ-220 block) |
| `system-map/game-rules-retrieval.md:117` | invariant: "System 2 is intentionally card-agnostic" | amend (REQ-220 block) |
| `system-map/game-rules-retrieval.md:118` | "not card names, oracle text, or keywords" | amend (REQ-220 block) |
| `system-map/prompt-layout-spec.md:35` | section 7: "a fixed always-on set in lookup mode" | amend (REQ-220 block) |
| `system-map/prompt-layout-spec.md:59` | matrix: lookup's set "is fixed and non-empty" | amend (REQ-220 block) |
| `integrations-and-data.md:363` | prompt carries topics "selected per DEC-045 (always-on core plus game-state-gated expansion)" | amend (REQ-220 block) |
| `integrations-and-data.md:400` | same wording, enrichment "must" list | amend (REQ-220 block) |
| `quick-lookup/README.md:201` | "the always-on core game-rules topics" always run | unchanged — still true |
| `quick-lookup/README.md:202` | "(DEC-045 core set)" | unchanged — same sentence as 201 |
| `quick-lookup/README.md:276` | System 3 excludes "the curated rule numbers the always-on core topics already carry" | amend (REQ-220 block): "the selected curated topics" |
| `quick-lookup/README.md:288` | "the always-on core game-rules topics are a fixed curated set" | amend (REQ-220 block): add the conditional topic |
| `quick-lookup/README.md:290` | "not the state-gated selector the game flow uses" | amend (REQ-220 block), same bullet as 288 |
| `in-depth/README.md:375` | "selected by DEC-045's always-on core plus" | amend (REQ-220 block) |
| `in-depth/README.md:376` | "card-agnostic game-state-gated expansion" | amend (REQ-220 block), same bullet |
| `in-depth/README.md:377` | "no card names or oracle text" | amend (REQ-220 block), same bullet |
| `in-depth/README.md:527` | closed door: the flat "all topics every request" baseline | unchanged — history, still true |
| `user-flows.md:257` | lookup flow step 7: "always-on core game-rules topics ... always runs" | unchanged — still true |
| `decisions.md:86` | DEC-045 row, status `retired` | unchanged — retired historical index; the decision log is not amended (decisions are amended in place in feature specs) |

Code comments that restate the invariant (`gameRulesTopicSelection.ts`'s
header, "No card names, oracle text, or keywords influence this selection")
are the build's to update with the code, not product truth.

## Scope

1. **The topic** — `replacement-effects-interaction` added to
   `apps/backend/data/gameRulesTopicManifest.json` with rule numbers 616.1,
   616.1a–616.1g, 616.2, and rebuilt into `gameRulesByTopic.json` by
   `npm run data:build` (verbatim CR text, like every topic).
2. **The selector** — one shared function decides whether the topic is on:
   two or more cards whose oracle text contains "instead" or a form of
   "prevent" (`prevent`, `prevents`, `prevented`). Lookup passes the attached
   cards; game mode passes every stack and zone card. Lookup's topic list
   becomes the four always-on topics plus this one when it fires; game mode's
   `selectGameRulesTopics` adds it the same way.
3. **The two gating fixtures** (REQ-221) with prompt and context goldens, frozen
   query embeddings, and fixture rulings for the five cards.
4. **PRD truth applied at build** — REQ-220 and REQ-221 added, REQ-022 amended,
   and the supporting system-map, data, and feature-spec lines amended, exactly
   as `GATE-QUESTIONS.md` proposes.
5. **Re-measure** — re-run `measure-candidates.mjs`-equivalent numbers (or the
   suites themselves) and record before/after in REQ-220's Notes.

## Technical shape (for map-out)

- Selector: a small pure function (for example
  `selectCardWordingTopicIds(cards)` in `gameRulesTopicSelection.ts`) reading
  only `oracleText`; `prepareLookupPromptInput`'s always-on filter and
  `selectGameRulesTopics` both call it. Reuse before creating
  (`technical-design-rules.md`): the topic renders through the existing
  `formatGameRulesSection`, and its rule numbers flow into the curated
  exclusion set through the existing `collectCuratedRuleIds`.
- Fixtures: `quick-lookup-replacement-interaction.fixture.json` and
  `quick-lookup-cleanup-trigger.fixture.json`, cards by real oracle id carrying
  their committed oracle text, type line, and keywords (the fixtures' existing
  convention, `cardDetailIndexFromRequest`); the five cards' rulings added to
  the test's fixture rulings map so the lookup card-enrichment check holds;
  `npm run eval:build-frozen-query-embeddings` for the two new vectors (the
  nine existing vectors do not change, because no query text changes).
- Oracle ids: Academy Manufactor `f36d1d8b-8303-44a9-ab56-531931641ea2`; Esix,
  Fractal Bloom `9d22960b-babc-4cf3-b228-d32e13bc6014`; Silence
  `8aed54cb-d1bb-45ad-adbe-38e55d84ff31`; Necropotence
  `94a844d2-0574-45a7-b347-e0e329767c42`; Borne Upon a Wind
  `ce19962d-94f9-4b2b-b668-963c0acce308`.
- Mechanism tests to expect touching: `gameRulesTopicSelection` tests,
  `preparation.test.ts` (lookup topic list), `promptAssembly.test.ts`.

## Material assumptions (assumption ladder, `preparation-contract.md`)

| Question | Resolved as | Ladder rung and evidence |
| --- | --- | --- |
| Typed-only or cards-attached cases? | Cards attached only | Owner direction (answered-once in the ledger). |
| Which retrieval change? | C7 | Measured: the only candidates that fix Q1 are the topic ones (C5–C7); C6/C7 are the only ones with zero movement on every existing suite; C7 over C6 because 616.1 cites 616.1a–f (rung 1, the CR text itself). |
| Fire on one marked card or two? | Two | Measured: one fires on an existing fixture and changes its golden; CR 616 governs two or more effects (rung 4, smallest scope). |
| What counts as replacement/prevention wording? | "instead", or "prevent"/"prevents"/"prevented" | CR 614.1a defines replacement effects by "instead"; CR 616 covers "replacement and/or prevention effects". Rung 4: the narrowest marker that matches the CR's own definition. |
| Both modes, or lookup only? | Both | Rung 3: REQ-178 already holds lookup and game mode to one shared card signal "so lookup and game mode cannot drift apart"; measured zero churn in game fixtures. |
| Gate or report? | Gate, as REQ-221 (owner decides) | The owner asked for the cases to join "a full test of all use cases"; the cases pass after REQ-220, so a gate locks the fix in. Surfaced, not settled. |
| Add to the worked-solutions gold set? | No | Rung 1: REQ-185 admits only official verbatim answers; neither case has one. |
| Live model run? | None | Retrieval is fully measured offline. Answer correctness belongs to the format follow-up, which the owner wants tested. |
| Fix the worked-solutions check's false misses on curated rules? | No, follow-up | Rung 4; outside the owner's direction. |

No question met all three conditions of the genuine-blocker test: each has a
measured or PRD-backed answer, and the one product choice (gating) is surfaced
as its own stable ID.

## Non-goals

- No prompt output-format change (the owner's next step, below).
- No change to System 3's search text, scoring, cap, or embeddings.
- No typed-names-only handling (owner: out of focus).
- No live model call; no new runtime dependency; no network.
- No answer key committed; no tester, web, or agent text as ground truth.
- No user-visible screen, overlay, or wire-contract change, so no
  `screen-layout.md` row (REQ-126).

## Follow-ups (not in scope)

- **Prompt output format — the named next package.** The owner: "lets start
  with making the rules correct, and then we can make the output pretty", and
  "if were going to adjust the output format, we again need to test". What the
  measurement shows: on Necropotence + Silence, rule 514.2 (Silence ends in
  cleanup) and 514.3a (priority after a cleanup trigger) were already in the
  prompt at System 3 #7 and #3, with Necropotence's discard trigger in the
  attached card text, and the AI still insisted Silence applies in cleanup. The
  rules were right and the answer was wrong, so the next lever is how the
  prompt presents them. That package must test any format change against the
  same suites as here, plus a live answer check; offline retrieval suites
  cannot see answer quality. Measured basis for its cost: these two prompts
  are about 14,500–18,200 characters (≈3,700–4,600 input tokens); at the
  gpt-4.1 list rate in `scripts/eval-answer-quality.mjs` ($2 / $8 per million
  input / output tokens, 600 assumed output tokens) one answer costs about
  $0.012–$0.014.
- **Worked-solutions check counts curated rules as misses.** Two of its 18
  cases (Panharmonicon 603.2, Restoration Angel 400.7) have their rule in the
  prompt through an always-on topic, yet report MISS. A small instrument fix.
- **Typed card names.** If a player types names without attaching cards, the
  prompt carries no card text. The owner put this out of focus.

## References

- REQ-022 — curated rules baseline (System 2) and supplemental retrieval (System 3).
- REQ-032 — hand-labelled expected rule ids; the gating labelled checks.
- REQ-074 — Quick Lookup prompt assembly.
- REQ-167, REQ-178 — System 3 search text: question plus each card's name, type line, keywords.
- REQ-179 — curated rule numbers exclude their sub-rules from System 3.
- REQ-182 — hybrid ranking and its benchmark floors.
- REQ-185, REQ-188, NFR-018 — worked-solutions gold set, answer-quality run, non-gating validation track.
- REQ-190 — System 3 cap of ten.
- Intake: `intake/feedback.md`, `intake/screenwriter_temp_1791297379886.jpg`,
  `intake/screenwriter_temp_1791297414126.jpg`,
  `intake/screenwriter_temp_1791298001844.jpg`,
  `intake/screenwriter_temp_1791299243121.jpg` (the tester's verbatim prompts).
- Outside evidence (unverified, for the owner):
  https://edhrec.com/articles/learning-how-to-use-necropotence-in-cedh,
  https://tappedout.net/mtg-questions/interaction-between-peregrin-took-and-academy-manufactor.
- Measurement: `measure-candidates.mjs` and `measure-candidates.out.txt` (this
  folder); `measure-retrieval.mjs` is the first define's script (typed-only and
  attached, single candidate list), kept as the earlier evidence.
