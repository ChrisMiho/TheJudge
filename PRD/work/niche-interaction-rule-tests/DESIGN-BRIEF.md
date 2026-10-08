# Design brief — niche-interaction-rule-tests

**What this is:** make the rules a player needs reach the AI when they ask about
two cards whose replacement effects collide, and lock that in with the
repo's rule-output tests, including the rules test harness that shipped on
2026-10-07.

**The headline.** A tester asked Quick Lookup how Academy Manufactor and Esix,
Fractal Bloom combine when he makes a Treasure. Even with both cards attached,
the AI never received the rules that answer it. The rules test corpus now holds
this question as an approved case, and names four deciding rules: 614.1a (an
effect that says "instead" is a replacement effect), 616.1 and 616.1e (when two
replacement effects apply to one event, the affected player picks which goes
first), and 616.1f (then whatever still applies gets its turn). Today none of
the four reaches the prompt. The fix proposed here is a curated rules topic,
"Interaction of Replacement and Prevention Effects" (CR 614.1a, all of 616.1,
616.1a–g, and 616.2), that switches on whenever two or more cards in the
question carry replacement or prevention wording (the whole word "instead",
"prevent", "prevents", or "prevented", in any letter case). Measured offline:
all four deciding rules reach the prompt, and no existing rule-output count
moves.

**The catch the harness exposed.** The rules gate (REQ-222, the offline check in
`npm run quality:check` that fails when a deciding rule stops reaching the
prompt) counts only the scored rules search (System 3). A curated topic is
invisible to it. Worse, the topic moves one existing case's deciding rule,
616.1f on `replacement-bard-and-bilbo-tokens`, out of the search and into the
topic: still in the prompt, but the gate reads it as lost and fails the build
(measured with the production prompt code). So this package also proposes an
amendment to REQ-222: a rule carried by a selected curated topic counts as
reaching the prompt.

**The tester's second question** (Silence + Necropotence + Borne Upon a Wind)
depends on the wording. In the tester's own words, rules 514.2 and 514.3a
reach the prompt (search positions #7 and #3) and the AI still answered wrong:
that is the answer-format problem recorded as the next package. In the
corpus's approved wording, 514.1 reaches it and 514.2 and 514.3a do not
(#29 and #13). This package does not change that; it is recorded as a
follow-up (see "Reconciling the Necropotence numbers").

**What the owner decides at the gate** (`GATE-QUESTIONS.md`):

- `REQ-220` — the new replacement-interaction rules topic (the retrieval fix),
  built from the same rules version as everything already stored, and the
  stored-topic size guard raised to fit it (24 topics, 26,000 characters).
- `REQ-022` — amended in place: the curated rules baseline is no longer
  strictly "card-agnostic"; it gains this one card-wording switch.
- `REQ-222` — amended in place: the rules gate counts a deciding rule carried by
  a selected curated topic as reaching the prompt, so it can hold REQ-220's fix
  and does not fail on the one rule REQ-220 moves.
- `REQ-221` — withdrawn. It proposed two context-eval fixtures for the tester's
  questions; both questions are now approved cases in the rules test corpus,
  and the rules gate holds them.

No live model spend is proposed: every measurement here is offline.

## Owner direction (re-scope, 2026-10-06; resumed 2026-10-07)

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

The package was deferred on 2026-10-06 until a rules test harness existed, and
the owner resumed it on 2026-10-07 after the harness shipped (PR #269, REQ-222 to
REQ-225). The deferral asked for two things this pass does: re-measure REQ-220
on the harness, and fold REQ-221's two cases into it.

## The tester's questions (evidence, verbatim)

From `intake/screenwriter_temp_1791299243121.jpg`:

1. "How do academy manufactor and esix, fractal bloom interact when I'm
   attempting to create a treasure token?"
2. "Can I use the triggered ability of necropotence during my cleanup step to
   dodge silence effects and cast borne upon a wind?"

Per the owner, both are measured as if he attached every named card: Q1 with
`Academy Manufactor` and `Esix, Fractal Bloom` (two cards; the comma is part of
Esix's name), Q2 with `Silence`, `Necropotence`, and `Borne Upon a Wind`.

**In the rules test corpus.** Both are approved tier-3 cases (an owner-approved
answer where no official text exists) with `source.pool` `tester`, each with
every named card attached, worded by the owner rather than verbatim:

- `academy-manufactor-esix-treasure` — "How do Academy Manufactor and Esix,
  Fractal Bloom interact when I create a Treasure?"; deciding rules 614.1a,
  616.1, 616.1e, 616.1f.
- `necropotence-silence-borne-upon-a-wind-cleanup` — a longer question that
  states the hand size, who cast Silence, and asks about casting after
  discarding; deciding rules 514.1, 514.2, 514.3a.

This brief measures both wordings: the corpus case (what the gates hold) and the
tester's verbatim question (what he actually asked).

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
tester's claim that "you cannot benefit from both". The approved corpus answer
reads the rules the same way.

**Q2.** In the cleanup step, the player discards to hand size (514.1); then
"this turn" effects end (514.2), which ends Silence; then, if anything
triggered, players get priority and another cleanup step follows (514.3a).
Necropotence's discard trigger fires on that discard, so its controller gets
priority after Silence has ended and can cast Borne Upon a Wind. The tester is
right, and the approved corpus answer agrees.

Outside sources are evidence for the owner, never an answer key (REQ-185: "An
answer written by a contributor or an agent is never ground truth").

## The full rule-output test set

Every suite in the repo that checks which rules reach the prompt, as of the
merged tree (2026-10-07). "Gating" means a failure fails `npm run quality:check`.

| Suite | What it checks | Gating? |
| --- | --- | --- |
| Rules gate (`apps/backend/src/eval/rules-gate/rulesGate.test.ts`, REQ-222) | for every non-rejected case of the 393-case rules test corpus (392 non-rejected): every attached card's text and rulings in the prompt (absolute), and each deciding rule that was among the System 3 excerpts at the production cap of ten still is (a ratchet over `baseline.json`, ranked from committed frozen query vectors) | yes (backend vitest, run by `coverage:check`) |
| Coverage gate (`scripts/rules-coverage-gate.test.mjs`, REQ-223) | every real mechanic has a case; `coverage.json` matches the corpus | yes (`test:scripts`) |
| Staleness report (`npm run eval:rules-staleness`, REQ-225) | cases whose rule, oracle, or ruling text changed, and cases awaiting a vector re-freeze | no, report only |
| Evidence trace (`npm run eval:evidence-trace`, REQ-229) | per deciding rule: search rank, whether System 3 picked it, whether its text is anywhere in the prompt (`availableToAnswer`); parity with the rules gate's baseline | no, report only |
| Worked-solutions retrieval check (`npm run eval:worked-solutions`, REQ-185, NFR-018) | whether each case's deciding rules are all in System 3's top ten, now over the whole corpus (System 3 is the scored rules search that adds up to ten rule excerpts to every prompt) | no, report only |
| Context-eval golden scenarios (`contextEvaluationHarness.test.ts`, lexical) | every fixture's prompt and context against committed golden files, the checklist report golden (`checklist-report.golden.txt`, one row per fixture), plus labelled System 3 checks (REQ-032) | yes |
| Context-eval semantic relevance (same file, frozen query embeddings) | the same labelled System 3 checks under the shipped hybrid ranking | yes |
| Hybrid-retrieval benchmark (`ragRetrievalBenchmark.test.ts`, `npm run benchmark:rag-retrieval`, REQ-177, REQ-182) | recall@5 and MRR over 156 question→rule pairs, clean and with three cards' signal mixed in | lexical clean recall gates against the step-1 baseline; hybrid numbers are recorded |
| Retrieval relevance report (`npm run retrieval:report`) | the same labelled fixtures as the harness, printed | no |
| Answer-quality run (`npm run eval:answer-quality`, REQ-188) | the model's final answer against the corpus's approved answers | no; live model spend, not run here |

## Method

Two scripts in this folder, run from the repo root, offline: committed rule,
card, and rulings indexes; committed frozen query vectors; the local MiniLM
embedder in process; no network; no model call.

- `measure-candidates.mjs` (output `measure-candidates.out.txt`):
  `npx tsx PRD/work/niche-interaction-rule-tests/measure-candidates.mjs`. Each
  candidate changes only how the System 3 query, or the curated topic set, is
  built from the cards; scoring is the unmodified production
  `retrieveRulesForQueryWithDebug`. Before any candidate is scored it asserts
  its baseline reproduces production exactly: `preparePromptInput`'s System 3
  picks for the two verbatim tester questions and the 18 first-ship corpus
  cases (hybrid and lexical), the 9 labelled fixtures with their frozen
  embeddings, and the benchmark's `scoreBenchmark` numbers. It scores the two
  verbatim questions against the deciding rules of their corpus cases.
- `measure-rules-gate.mjs` (output `measure-rules-gate.out.txt`; the nine-rule
  variant, `TOPIC_RULES=nine`, in `measure-rules-gate.nine.out.txt`):
  `npx tsx PRD/work/niche-interaction-rule-tests/measure-rules-gate.mjs`. It runs
  the real rules gate over the corpus and confirms it reproduces `baseline.json`
  case by case (G1); asserts a reimplementation matches production for all 392
  scored cases (G2); runs the topic over the whole corpus (G3); ranks every
  deciding rule of both tester cases in both wordings (G4); runs production code
  with the topic patched in, built in memory from the committed rule index by
  the build script's own `transformGameRules` (G5); and simulates the REQ-222
  amendment (G6, G7). G8 measures prompt sizes.

"In prompt" means in System 3's top ten or in a selected curated topic.

## Baseline across all suites (measured 2026-10-07, merged tree)

| Suite | Baseline |
| --- | --- |
| Rules gate | 392 cases scored, 287 with every deciding rule a System 3 excerpt, 105 with a miss, 0 failed, 0 regressed; reproduces `baseline.json` for all 392 |
| Manufactor + Esix, corpus case | **none of 614.1a, 616.1, 616.1e, 616.1f in prompt**, both rankings (all beyond #400 hybrid; 616.1f #332 lexical) |
| Manufactor + Esix, verbatim | **none in prompt** (616.1 #357 hybrid, #50 lexical; the rest beyond #300) |
| Necropotence + Silence, corpus case | 514.1 System 3 #3 hybrid (#2 lexical); 514.2 and 514.3a **not in prompt** (#29 and #13 hybrid, #88 and #89 lexical) |
| Necropotence + Silence, verbatim | 514.2 System 3 #7 and 514.3a #3 hybrid (#7 and #4 lexical); 514.1 **not in prompt** (beyond #300 hybrid, #11 lexical) |
| Worked-solutions, whole corpus | 287/392 (local embedder, all ranked semantically) |
| Worked-solutions, 18 first-ship cases | 16/18 hybrid, 14/18 lexical in System 3; 18/18 and 16/18 in prompt |
| Gating semantic labelled checks | 14/14 |
| Gating lexical labelled checks | 14/14 |
| Gating goldens | 31 fixtures' prompt and context goldens, all match; checklist report golden 31 rows, all PASS |
| Coverage gate | passes (4/4 tests), `coverage.json` current |
| Staleness report | 0 stale, 0 awaiting a re-freeze |
| Benchmark, lexical | clean recall@5 0.5833 (MRR 0.4249); polluted 0.5769 (0.4110) |
| Benchmark, hybrid | clean recall@5 0.8974 (MRR 0.7107); polluted 0.8910 (0.6920) |

Six corpus cases (five on 603.2, one on 400.7, including the first-ship
Panharmonicon and Restoration Angel cases) have a deciding rule that is already
in the prompt through a curated topic, so System 3 is barred from repeating it
and the search-only counts report it as a miss (G6; each rule's full text
checked in the production prompt).

## Reconciling the Necropotence numbers

Attempt 5 reported the Necropotence question as a HIT (514.2 at System 3 #7,
514.3a at #3). The rules gate's baseline records the corpus case missing both.
Both are right; they measure different query text.

- **Not the cap and not the ranking.** Both use the production cap of ten and
  the shipped hybrid ranking. The committed frozen vector is bit-identical to a
  live local embedding of the same query text (maximum difference 0, G4).
- **The query text differs.** Attempt 5 measured the tester's verbatim question
  ("Can I use the triggered ability of necropotence during my cleanup step to
  dodge silence effects and cast borne upon a wind?"). The corpus case is the
  owner's longer rewording ("I control Necropotence and have more than seven
  cards in hand at my cleanup step. ..."). The attached cards are the same three.
- **Measured both ways (G4):** verbatim, 514.2 #7 and 514.3a #3, 514.1 beyond
  #400; corpus wording, 514.1 #3, 514.2 #29, 514.3a #13. Card order is a minor
  factor: the corpus wording with attempt 5's card order puts 514.2 at #25 and
  514.1 at #4, still out of the top ten for 514.2 and 514.3a.
- **What follows.** Neither wording gets all three deciding rules into the
  prompt. The tester's own prompt carried 514.2 and 514.3a and the AI still
  answered wrong, so the format follow-up stands. The corpus wording's misses
  are a retrieval gap this package does not close; REQ-220's topic does not fire
  on these cards (none says "instead" or "prevent"). Recorded under Follow-ups.

## Candidates tried (measured, not reasoned)

The two new columns score each candidate against the deciding rules of the
corpus cases (Q1: 614.1a, 616.1, 616.1e, 616.1f; Q2: 514.1, 514.2, 514.3a) on the
tester's verbatim questions. Earlier attempts scored only 616.1 and 616.1f, and
514.2 and 514.3a.

| Candidate | Manufactor + Esix | Necropotence + Silence | Existing suites |
| --- | --- | --- | --- |
| C1 — put attached cards' oracle text into the System 3 search | MISS (616.1 #47 lexical / #284 hybrid) | **loses 514.2** (#33 / #68) | benchmark polluted lexical 0.5769 → 0.3782, hybrid 0.8910 → 0.7756; 25 of 31 prompt goldens change |
| C2 — embed oracle text, keep word search unchanged | MISS (616.1 #274 hybrid) | **loses 514.2** (#12 hybrid) | benchmark polluted hybrid 0.8910 → 0.8333 |
| C3 — add the rules term "replacement effect" / "prevention effect" to a card's search signal when its text says "instead" / "prevent" | MISS (616.1 #35 hybrid, #8 lexical; 616.1f #62 / #57; 614.1a #112 / #120) | unchanged | polluted lexical 0.5769 → 0.5577, hybrid 0.8910 → 0.8718; 1 prompt golden changes |
| C4 — the same terms added to the question side (weighted ×3) | MISS (616.1 #31 / #7; 616.1f #27 / #25; 614.1a #70 / #79) | unchanged | polluted lexical → 0.5128, hybrid → 0.8718; 1 prompt golden changes |
| C5 — curated 616 topic (616.1, 616.1e, 616.1f, 616.2) when **any one** card carries the wording | 3 of 4 in prompt (614.1a missing) | unchanged | no score moves; 1 prompt golden changes (Questing Beast's "can't be prevented" fires it alone) |
| C6 — same topic when **two or more** cards carry the wording | 3 of 4 (614.1a missing) | unchanged | nothing moves; 0 prompt goldens change |
| C7 — full 616 family (616.1, 616.1a–g, 616.2), two or more cards | 3 of 4 (614.1a missing) | unchanged | nothing moves; 0 prompt goldens change |
| **C8 — C7 plus 614.1a, two or more cards** | **4 of 4 in prompt**, both rankings | unchanged | nothing moves; 0 prompt goldens change |

Every candidate leaves worked-solutions on the first-ship 18 (16/18 and 14/18)
and both gating labelled checks (14/14) unchanged; the benchmark's clean
condition has no cards, so no candidate can move it. "Unchanged" for Q2 means
514.2 #7 and 514.3a #3 hybrid with 514.1 out, as in the baseline. Full per-rule
ranks are in `measure-candidates.out.txt`.

What this shows: no search-side change (C1–C4) got the deciding rules into the
top ten under both rankings. The closest, C3 and C4, lift 616.1 to #8 and #7
under lexical ranking only; under hybrid ranking (the shipped one) 616.1 stays
at #31–35, and 616.1f at #25 or worse under every candidate and both rankings.
The rules' words ("two or more replacement and/or prevention effects are
attempting to modify the way an event affects an object or player") look
nothing like a question about Treasure tokens, and adding card text drowns the
question (C1, C2 lose Q2's 514.2 and break the benchmark). A topic switched on
by the cards' own wording is deterministic and exact.

## Proposal: C8

**What a player gets.** Attach two or more cards that say "instead" (or
"prevent") and ask about them: the AI's `GAME RULES (reference)` section now
includes the Comprehensive Rules on how replacement and prevention effects
interact — that "instead" marks a replacement effect, who chooses the order,
the special cases that go first, and that the process repeats until nothing is
left to apply. The same happens in a game (In-Depth) question when two or more
cards on the stack or in any zone carry the wording.

**Why the full 616 family over the minimal four rules.** Both measured identical
on every suite. 616.1 itself says the player chooses "following the steps
listed in rules 616.1a–f"; shipping 616.1 without those steps hands the AI a
procedure with its steps missing. Listing 616.1 also bars System 3 from
pulling any 616.1 sub-rule (REQ-179's prefix rule), so a minimal set would
make 616.1a–d and 616.1g unreachable whenever the topic is on.

**Why 614.1a joins it.** The approved corpus case names 614.1a as a deciding
rule (it is how a player tells that both cards are replacement effects), and
System 3 ranks it beyond #400 for this question under both rankings with or
without the topic. Without it the topic delivers three of the case's four
deciding rules (C7). It adds 175 characters of rule text, changes no other
measured number, and is exactly the definition the topic's switch is built on
(the word "instead").

**Cost.** The topic adds 3,898 characters to a prompt when it fires, measured
through `formatGameRulesSection` (3,837 of it is the ten rules' own text, the
rest is the title line and line breaks). On the tester's verbatim Manufactor +
Esix question that is the 14,524-character prompt growing to 18,422, about 27%.
Measured firing rate, matching whole words in any letter case
(`/\binstead\b/i`, `/\bprevent(s|ed)?\b/i` in the scripts, so "prevention" and
"preventing" do not count): 1,790 of 37,564 cards (4.8%) carry the wording, so
two randomly chosen attached cards both carry it about 0.2% of the time. In the
existing suites it fires on none of the 31 fixtures, the 18 first-ship cases,
or the 156 benchmark questions; in the 392-case corpus it fires on 6 cases, all
two-card replacement questions (G3).

**Why "two or more".** C5 (any one card) fired on the existing
`quick-lookup-multi-keyword-card` fixture (Questing Beast, whose text says
combat damage "can't be prevented") and changed its golden prompt; one effect
alone has nothing to interact with under 616. Two copies of the same card in
a game count as two, which covers the classic "two doubling effects" case.

**What does not change.** System 3's search text stays the question plus each
card's name, type line, and keywords, never oracle text (REQ-167, REQ-178), so
those requirements need no amendment. System 3 scoring, its cap of ten
(REQ-190), and the embeddings are untouched; no frozen query vector changes,
in the context-eval fixtures or the rules gate.

## The rules gate cannot see the topic (REQ-222 amendment, recommended)

Measured, not reasoned (G5, production `preparePromptInput` with the topic
patched in):

- **The topic does not register as a hit.** With the topic, all four of the
  Manufactor case's deciding rules are in the prompt, and the real rules gate
  still records hit `[]`, miss `[614.1a, 616.1, 616.1e, 616.1f]`. The gate reads
  only `enrichmentDebug.supplemental.selected` (System 3), and once the topic
  fires the curated exclusion (REQ-179) bars those rules from System 3 for good.
- **REQ-220 as written fails the gate.** The topic fires on
  `replacement-bard-and-bilbo-tokens` (Bard, King of Dale + Bilbo, Fellow
  Conspirator), whose baseline records 616.1f as a System 3 hit. With the topic,
  616.1f is carried by the topic instead, still in the prompt, and the gate
  fails: "deciding rule 616.1f used to reach the prompt and no longer does
  (ratchet)". That is the only recorded hit the topic moves (G3).

**Recommendation: amend REQ-222's ratchet** so a deciding rule reaches the
prompt when it is a System 3 excerpt *or* one of the rule numbers of a curated
topic selected for that prompt (read from the production enrichment debug
block, `curatedGameRules.topics`, which the gate already collects). Per case the
baseline keeps `hit` and `miss` exactly as today (System 3 picks) and adds a
third list, `inTopic`, written only when non-empty: deciding rules that are not
System 3 picks but are carried by a selected topic. The gate fails when a rule
recorded in `hit` or `inTopic` reaches the prompt by neither route; a rule that
moves between the two routes is not a loss.

Why this shape (G7, simulated over all 392 cases with the topic):

- Recorded hits lost: 0, so the build's baseline raise needs no
  `--allow-regressions`.
- Cases with a topic-carried deciding rule: 6 today, 11 with the topic. The
  Manufactor case records all four of its deciding rules there, so a later
  change that drops the topic fails the gate.
- `hit` and `miss` keep their System 3 meaning, so the evidence trace's parity
  with the baseline (REQ-229) and the first-ship test ("16 of 18 first-ship
  cases hitting", `rulesGate.test.ts`) still hold, and the worked-solutions
  count stays 287/392.

Alternatives considered: a one-off prompt-contains assertion for the Manufactor
case (holds this one fix, but the gate still fails on Bard + Bilbo); or raising
the baseline with `--allow-regressions` (records a rule that is in the prompt as
lost, and holds nothing). Neither is recommended.

## What REQ-221 became: withdrawn

REQ-221 proposed two labelled fixtures in the context-eval harness so the
tester's questions would gate the build. Both questions are now approved cases
in the rules test corpus (above), and the rules gate runs every approved case on
every `quality:check`. Two more fixtures would duplicate them. With the REQ-222
amendment, the Manufactor case's four deciding rules are held by the gate once
the build raises the baseline (a REQ-220 acceptance criterion), and the
Necropotence case's 514.1 is held today. Nothing durable is left for REQ-221 to
say, so it is withdrawn; its block stays in `GATE-QUESTIONS.md` with an empty
diff so the owner sees the change, and the number REQ-221 stays unused.

## Acceptance targets (from the measured numbers)

After the build, the same measurements must show:

- Manufactor + Esix, corpus case `academy-manufactor-esix-treasure`: 614.1a,
  616.1, 616.1e, and 616.1f all in the prompt, through the topic, under both
  rankings; the raised `baseline.json` records the four as `inTopic` for this
  case. The tester's verbatim question, both cards attached: the same four in
  the prompt, both rankings.
- Necropotence + Silence: unchanged. Corpus case 514.1 System 3 #3 hybrid (#2
  lexical) with 514.2 and 514.3a outside the top ten; verbatim question 514.2
  #7 and 514.3a #3 hybrid (#7 and #4 lexical).
- Rules gate: passes. After `npm run eval:rules-gate:baseline`, every case's
  `hit` and `miss` are identical to today except
  `replacement-bard-and-bilbo-tokens` (616.1f moves from `hit` to `miss`, and
  both 616.1 and 616.1f are recorded in `inTopic`); 11 cases carry `inTopic`;
  287 cases still have every deciding rule a System 3 excerpt; no frozen query
  vector changes.
- Worked-solutions: 287/392 on the whole corpus; 16/18 hybrid and 14/18 lexical
  on the first-ship 18 (18/18 and 16/18 in prompt) — unchanged.
- Gating labelled checks: 14/14 semantic and 14/14 lexical — unchanged.
- Gating goldens: none of the 31 fixtures' prompt or context goldens changes;
  `checklist-report.golden.txt` unchanged (no fixture is added).
- Benchmark: lexical clean 0.5833 / polluted 0.5769, hybrid clean 0.8974 /
  polluted 0.8910 — unchanged.
- Coverage gate passes with `coverage.json` unchanged; staleness report 0 stale,
  0 awaiting a re-freeze.
- Game-rules data: `gameRulesByTopic.json` gains the one new topic and no
  existing topic changes; `gameRulesRuleIndex.json`, `gameRulesTokenStats.json`,
  `gameRulesRuleEmbeddings.json`, and `gameRulesCoreTopics.json` are unchanged
  (see Scope 1).
- Build-policy test (`gameRulesBuildPolicy.test.ts`): passes with 24 topics and
  a total topic text of 25,808 characters under the new 26,000 ceiling (see
  Scope 2).

A result that fixes the new case but moves any other number is a regression and
is reported as one, never re-labelled.

## Amendment set (one line-level grep per invariant, one row per hit)

### Invariant 1: "System 2 (the curated rules baseline) is card-agnostic"

Every product-truth line asserting it, enumerated by:

```
grep -rniE "card-agnostic|game-state-gated|state-gated|game-state signals|always-on core|fixed always-on|fixed curated set|DEC-045 core set|no card names|not card names|affect System 2|oracle text, or keywords|owns all card" PRD/sections
```

Case-insensitive (`-i`), so a restatement that starts a sentence or a bullet
("Always-on core topics") is caught. Re-run on the merged tree, 2026-10-07: 28
hits, the same lines as 2026-10-06. The same grep over the eval READMEs
(`apps/backend/src/eval/fixtures/README.md`,
`apps/backend/src/eval/worked-solutions/README.md`) has 0 hits.

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
| `quick-lookup/README.md:349` | "Always-on core topics: a fixed four-topic core set (stack-and-priority, targets, zones, triggered-ability basics)" | unchanged — still true: the four core topics stay fixed and always on; the new topic is a fifth, conditional topic added beside them, not a member of the core set |
| `in-depth/README.md:375` | "selected by DEC-045's always-on core plus" | amend (REQ-220 block) |
| `in-depth/README.md:376` | "card-agnostic game-state-gated expansion" | amend (REQ-220 block), same bullet |
| `in-depth/README.md:377` | "no card names or oracle text" | amend (REQ-220 block), same bullet |
| `in-depth/README.md:527` | closed door: the flat "all topics every request" baseline | unchanged — history, still true |
| `user-flows.md:257` | lookup flow step 7: "always-on core game-rules topics ... always runs" | unchanged — still true |
| `decisions.md:86` | DEC-045 row, status `retired` | unchanged — retired historical index; the decision log is not amended (decisions are amended in place in feature specs) |

Lines outside the grep that restate or touch the invariant, found by reading
the files the hits sit in, plus the parked-ideas folder, the selector's
source, and the two product-truth lines that quote the curated topic count
(`grep -rniE "23 curated|23 topics" PRD/sections`, 2 hits, unchanged on the
merged tree):

| Line | Says | Disposition |
| --- | --- | --- |
| `system-map/game-rules-retrieval.md:94` | worked example: System 2 "selects the always-on topics plus combat and battlefield-oriented curated topics" for a deathtouch combat question | unchanged — still true: that example carries no two cards with replacement or prevention wording, so the new topic does not fire |
| `functional-requirements.md:1781` | REQ-074 second criterion: "when a card is attached, the assembled prompt additionally includes" the card's metadata, its rulings, and System 3 scored on the card's compact signal | unchanged — still true: the list says what an attached card adds, not that nothing else may be added; the topic is added by REQ-220, which names REQ-074 as a dependency, and the lookup topic list is amended at `quick-lookup/README.md:288` |
| `functional-requirements.md:1782` | REQ-074: the lookup prompt omits "System 2 game-state topic gating (DEC-045)" because lookup never carries game state | unchanged — still true: the new gate reads card wording, not game state, so lookup still has no game-state topic gating |
| `quick-lookup/README.md:200` | "three things always run regardless of the attached card set" (the reference block, the always-on core topics, System 3) | unchanged — still true: those three still always run; the new topic is a fourth, conditional addition, and the lookup topic list stays a superset of the core four |
| `quick-lookup/README.md:204–213` | "when one or more cards are attached, per-card enrichment layers in": each card's metadata, its rulings, System 3 on the compact signal | unchanged — still true: it describes per-card enrichment, which the topic is not (it fires on two or more cards together); the topic is carried by the `:288` bullet's amendment and REQ-220 |
| `quick-lookup/README.md:215` | game-state-only sections omitted, including "System 2 game-state topic gating (DEC-045)" | unchanged — still true, same reason as `functional-requirements.md:1782` |
| `user-flows.md:527` | FLOW-023 step 5: the backend assembles one lookup prompt with per-card metadata and rulings, System 3 on the compact signal, and combo enrichment | unchanged — still true: the step lists none of the curated topics (not even the always-on four, which step 7 of the lookup flow at `:257` names), so the new conditional topic's absence is consistent; carried by REQ-220 and the `quick-lookup/README.md:288` amendment |
| `goals-and-non-goals.md:60` | prompt-size risk: "~25–32k chars typical/worst case when all 23 curated topics ship" | unchanged — a sizing note about the retired flat "all topics every request" baseline (DEC-045 replaced it), which never ships again; the topic count it quotes is that baseline's |
| `non-functional-requirements.md:22` | same risk, past tense: "when all 23 curated topics shipped" | unchanged — history of the same retired baseline |
| `PRD/ideasForLater/future-infra/sections/retrieval-architecture.md:10` | System 2 is "keyed only on `turnPhase`, `combatStep`, and populated-zone presence (never card text or keywords)" | unchanged — a parked idea file describing the state when it was written, not product truth |
| `apps/backend/src/gameRulesTopicSelection.ts:7` (header) | "Selection is driven only by card-agnostic game-state signals ... No card names, oracle text, or keywords influence this selection" | build updates it with the code (not product truth) |
| `apps/backend/src/gameRulesTopicSelection.ts:93` (`selectGameRulesTopics` JSDoc) | "Normalized prompt context (game-state signals only are read)" | build updates it with the code, together with the header at `:7` |

### Invariant 2: "the rules gate counts only System 3 excerpts" (REQ-222 amendment)

The harness rewrote the eval landscape, so every line that says what the rules
gate's baseline records, or reads it, enumerated by:

```
grep -rniE "ratchet|baseline\.json|System 3 excerpts|selectedInSearch|records System 3|System 3 selections|hit and miss" PRD/sections apps/backend/src/eval/fixtures/README.md apps/backend/src/eval/worked-solutions/README.md
```

12 hits, 2026-10-07:

| Hit | Says | Disposition |
| --- | --- | --- |
| `system-map.md:508` | Rules test corpus gates: "each case's deciding rule reaches it at least as often as the recorded baseline (ratchet, frozen query vectors)" | unchanged — still true: a rule carried by a topic reaches the prompt |
| `functional-requirements.md:4428` | REQ-185 note: at build the gate recorded 290 cases with every deciding rule reaching the prompt, misses "recorded in the ratchet baseline" | unchanged — dated measurement, history |
| `functional-requirements.md:4540` | REQ-189: `goldRuleInPrompt` is whether a deciding rule "was among the System 3 excerpts" | unchanged — REQ-189's own metric, not the ratchet; the amendment leaves it as is |
| `functional-requirements.md:5791` | REQ-222 rule check: baseline records deciding rules "among the System 3 excerpts" | amend (REQ-222 block) |
| `functional-requirements.md:5792` | REQ-222 frozen query vectors | unchanged — still true: no query text changes, so no vector changes |
| `functional-requirements.md:5794` | REQ-222 summary: "cases scored (hit and missed)" | amend (REQ-222 block): the summary also counts cases with a topic-carried rule |
| `functional-requirements.md:5959` | REQ-229: per deciding rule, its System 3 rank, whether selected, whether skipped because a curated topic carries it | unchanged — still true |
| `functional-requirements.md:5961` | REQ-229: `goldRuleInPrompt` "one deciding rule among the System 3 selections" | unchanged — REQ-189's meaning, unaffected |
| `functional-requirements.md:5965` | REQ-229 parity: the trace's `selectedInSearch` matches `baseline.json`'s hit and miss | unchanged — still true: `hit` and `miss` keep their System 3 meaning; `inTopic` is a separate list the parity check does not read |
| `functional-requirements.md:5976` | REQ-229 note: "The baseline records System 3 selections only" | amend (REQ-222 block), one clause: "The baseline's hit and miss lists record System 3 selections only" |
| `functional-requirements.md:6002` | REQ-230 note: 14 partial, 91 none, 287 full System 3 coverage at `3e973ced` | unchanged — dated measurement; read from `hit`/`miss`, which keep their meaning |
| `apps/backend/src/eval/worked-solutions/README.md:151` | the gate checks "that each deciding rule that used to reach it still does (a ratchet over `baseline.json`)" | build adds one sentence beside it (not product truth): a rule carried by a selected curated topic counts as reaching the prompt and is recorded as `inTopic` |

Code that reads the baseline (`grep -rln "rules-gate/baseline\|loadBaseline\|BaselineCase\|RulesGateBaseline" scripts apps/backend/src`, 5 files):
`rulesGate.ts` and `baseline.ts` (build edits), `rulesGate.test.ts` (build
adds tests), `scripts/raise-rules-gate-baseline.mjs` (no edit: it calls
`raiseBaseline`, which writes the new list), and `scripts/eval-evidence-trace.mjs`
(no edit: its parity check reads `hit` and `miss` only).

## Scope

1. **The topic** — `replacement-effects-interaction`, titled "Interaction of
   Replacement and Prevention Effects", added to
   `apps/backend/data/gameRulesTopicManifest.json` (in id order, right after
   `replacement-effects-basics`, in the file's inline array style) with rule
   numbers 614.1a, 616.1, 616.1a–616.1g, 616.2, and written into
   `gameRulesByTopic.json` as verbatim CR text. Only that one data file gains
   anything; every other game-rules artifact stays as it is.
   - **Build path: add only the new topic, with the ten rules' text taken from
     the committed rule index.** `apps/backend/data/gameRulesRuleIndex.json`
     holds the Comprehensive Rules text that every shipped game-rules artifact
     was built from (the 2026-06-05 text on the merged tree), and that every
     measurement in this brief used. After the manifest edit, and once the
     repo's dependencies are installed, run from the repo root:
     `node PRD/work/niche-interaction-rule-tests/build-topic-from-index.mjs`.
     It feeds the index's rule text to the build script's own
     `transformGameRules` (so the excerpt is exactly what
     `scripts/build-game-rules.mjs` extracts for every topic), formats the file
     the way the build script does, writes `gameRulesByTopic.json` and nothing
     else, and refuses to write if any existing topic would change, any rule
     number is missing, or nothing new would be added.
   - **Why not `node scripts/build-game-rules.mjs`.** It reads the gitignored
     `apps/backend/data/cr/source.txt`. In a fresh worktree that file is
     absent, and the script then prints "Preserved existing game rules
     artifact", exits 0, and does not write the topic. Building from any other
     rules text rewrites the whole rules corpus, which is a rules-text refresh
     and not this package's scope. So: do not copy, download, or build from any
     `source.txt`, and do not run `npm run data:build`.
   - **Measured at define (2026-10-07)** on a clean export of the merged tree
     with the manifest entry added: 23 of 23 existing topics byte-identical; the
     new topic's excerpt is 3,846 characters; the file's diff is the six added
     lines of the new topic only; `gameRulesRuleIndex.json`,
     `gameRulesTokenStats.json`, `gameRulesRuleEmbeddings.json`, and
     `apps/frontend/public/data/gameRulesCoreTopics.json` byte-identical; the
     build-policy test, with the two numbers of Scope 2 changed, passes (9/9).
   - Required result: among the game-rules data files, `git diff --stat` lists
     only `gameRulesTopicManifest.json` and `gameRulesByTopic.json`.
     If the script refuses, stop and report; never edit the artifact by hand.
   - Carried as-is: 616.2 is the last rule of chapter 6, so its index text,
     like the build script's own extraction from any rules source, ends with
     the next chapter's heading line, "7. Additional Rules". The topic carries
     it verbatim; trimming it means changing the extractor, which is out of
     scope.
2. **The build-policy test** —
   `apps/frontend/src/lib/gameRulesBuildPolicy.test.ts` ("keeps the committed
   curated topic artifact inside the budget") asserts exactly 23 topics
   (`expect(manifest).toHaveLength(23)`, line 202) and total topic text
   between 18,000 and 22,000 characters (lines 205–206). Committed total
   21,962; with the topic, measured 25,808, so both assertions fail unless
   changed. Change exactly two numbers, as REQ-220 proposes for the owner's
   verdict: the count 23 → 24 and the ceiling 22,000 → 26,000. The 18,000
   floor and the test's other checks stay (the per-rule check that each listed
   rule number starts a line of its topic's excerpt passes for 614.1a). The
   ceiling guards the stored topic library, not any single prompt: a prompt
   carries only the topics selected for it. 26,000 leaves 192 characters of
   room, so any further topic again needs an owner-visible raise.
3. **The selector** — one shared function decides whether the topic is on:
   two or more cards whose oracle text contains the whole word "instead",
   "prevent", "prevents", or "prevented", in any letter case (so "prevention"
   and "preventing" do not count; the measured regexes are
   `/\binstead\b/i` and `/\bprevent(s|ed)?\b/i`). Lookup passes the attached
   cards; game mode passes every card on the stack or in any zone. Lookup's
   topic list becomes the four always-on topics plus this one when it fires;
   game mode's `selectGameRulesTopics` adds it the same way. Both keep the
   topics in id order.
4. **The rules-gate ratchet (REQ-222 amendment)** — in
   `apps/backend/src/eval/rules-gate/rulesGate.ts`, read the selected topics'
   rule numbers from `prepared.enrichmentDebug.curatedGameRules.topics` (already
   collected, `collectEnrichmentDebug: true`); per case compute `inTopic`
   (deciding rules that are not System 3 picks but are listed by a selected
   topic); a regression is a rule recorded in `hit` or `inTopic` that is now
   neither a System 3 pick nor topic-carried; a new hit is a deciding rule that
   reaches the prompt now by either route and is in neither recorded list.
   `BaselineCase` gains an optional `inTopic`; `raiseBaseline` writes it only
   when non-empty; the report's summary line adds the count of cases with a
   topic-carried rule. `hit` and `miss` keep their System 3 meaning.
   `preparePromptInput` is not changed. Then, with the topic and the selector in
   place, run `npm run eval:rules-gate:baseline` (no `--allow-regressions`; it
   must not refuse) and commit `baseline.json`.
5. **PRD truth applied at build** — REQ-220 added; REQ-022 and REQ-222 amended;
   the supporting system-map, data, and feature-spec lines amended, exactly as
   `GATE-QUESTIONS.md` proposes. REQ-221 is withdrawn: nothing is applied for it.
6. **Re-measure after the build** — the define scripts simulate the topic on
   top of production, so once production carries it their parity checks no
   longer hold; re-measure with the suites themselves and record before/after
   in REQ-220's Notes: `npm run eval:worked-solutions` (287/392),
   `npm run eval:rules-staleness`, `npm run quality:check` (rules gate, coverage
   gate, context-eval harness, benchmark, build-policy), and, after committing,
   `npm run eval:evidence-trace -- --case academy-manufactor-esix-treasure`
   (`availableToAnswer` true for all four deciding rules; the trace refuses a
   checkout with uncommitted changes, and writes only under the gitignored
   `output/`).

## Technical shape (for map-out)

- Selector: a small pure function (for example
  `selectCardWordingTopicIds(cards)` in `gameRulesTopicSelection.ts`) reading
  only `oracleText`; `prepareLookupPromptInput`'s always-on filter
  (`apps/backend/src/prompt/preparation.ts:212`) and `selectGameRulesTopics`
  both call it. Reuse before creating (`technical-design-rules.md`): the topic
  renders through the existing `formatGameRulesSection`, and its rule numbers
  flow into the curated exclusion set through the existing
  `collectCuratedRuleIds`.
- Rules gate: the change is confined to `rulesGate.ts` and the `BaselineCase`
  type; `raise-rules-gate-baseline.mjs` and the evidence trace need no edit
  (Amendment set, invariant 2).
- Existing gating tests to expect touching (edit or add):
  `apps/backend/src/gameRulesTopicSelection.test.ts` (selector cases: two
  marked cards fire, one does not, "prevention" does not count, a game zone
  card counts; its existing fixtures use empty oracle text, so they do not
  change), `apps/backend/src/prompt/preparation.test.ts` (lookup topic list),
  `apps/backend/src/prompt/promptAssembly.test.ts`,
  `apps/frontend/src/lib/gameRulesBuildPolicy.test.ts` (topic count 23 → 24 at
  line 202, ceiling 22,000 → 26,000 at line 206; Scope 2), and
  `apps/backend/src/eval/rules-gate/rulesGate.test.ts` (new tests: a rule
  carried by a selected topic is recorded as `inTopic`, for example 603.2 on
  `panharmonicon-controller-not-entering-permanent`; a recorded System 3 hit
  that moves into a selected topic is not a regression; a recorded `inTopic`
  rule that leaves the prompt fails; `raiseBaseline` writes `inTopic` only when
  non-empty; the committed baseline records 614.1a, 616.1, 616.1e, 616.1f as
  `inTopic` for `academy-manufactor-esix-treasure`. The existing "16 of 18
  first-ship cases hitting" test and every planted-baseline test keep passing
  unchanged).
- Existing gating tests the change flows through without an edit, to run:
  `apps/backend/src/eval/contextEvaluationHarness.test.ts` (no fixture fires
  the topic, so no golden changes; run it without the golden-update mode),
  `apps/backend/src/eval/retrievalReportParity.test.ts` and
  `retrievalReportInputs.test.ts` (both read every labelled fixture and the
  committed topic artifact), `ragRetrievalBenchmark.test.ts` (no cards in its
  clean condition; numbers must not move), and the coverage gate
  `scripts/rules-coverage-gate.test.mjs` (no case or mechanic changes, so
  `coverage.json` stays current).
- Oracle ids: Academy Manufactor `f36d1d8b-8303-44a9-ab56-531931641ea2`; Esix,
  Fractal Bloom `9d22960b-babc-4cf3-b228-d32e13bc6014`; Silence
  `8aed54cb-d1bb-45ad-adbe-38e55d84ff31`; Necropotence
  `94a844d2-0574-45a7-b347-e0e329767c42`; Borne Upon a Wind
  `ce19962d-94f9-4b2b-b668-963c0acce308`.

## Build in a fresh worktree (checked as the builder will run it)

The build half cuts `.worktrees/implement-niche-interaction-rule-tests` from
`origin/main` after the docs PR merges, so this folder (with both scripts) is on
`main`. In order:

1. `npm ci` (or `npm install`) at the worktree root: the topic build imports
   `prettier`, and every suite runs through `tsx` and vitest.
2. Edit `gameRulesTopicManifest.json` by hand (Scope 1; the one-line
   `ruleNumbers` array is 117 characters, inside prettier's 120, so
   `format:check` passes), then run
   `node PRD/work/niche-interaction-rule-tests/build-topic-from-index.mjs`;
   check `git diff --stat` (Scope 1, required result).
3. Change the two build-policy numbers (Scope 2).
4. Add the selector and its two call sites (Scope 3) with their tests.
5. Amend `rulesGate.ts` and `BaselineCase`, add the rules-gate tests (Scope 4),
   then run `npm run eval:rules-gate:baseline` and commit `baseline.json`. If
   it refuses, stop and report.
6. Apply the PRD truth (Scope 5).
7. `npm run quality:check`, then the re-measurement (Scope 6).

No step needs the gitignored `source.txt`, a network call, an API key, or a
frozen-vector rebuild.

**Dependency and risk: PR #273.** The 2026-10-07 data refresh (open, not merged)
moves the Comprehensive Rules text to 2026-09-25, regenerates goldens, and
changes the rules-gate baseline. If it merges before the build, the build's
`origin/main` carries a different rule index: `build-topic-from-index.mjs` then
takes the topic's text from that index (still one rules version for every
artifact), and every number in this brief that depends on rules text — the
excerpt's 3,846 characters, the 25,808 total, the 287/392 counts, the baseline
contents — must be re-measured before the build commits. If the new total
exceeds 26,000, or any acceptance number above moves for a reason other than
the refresh itself, stop and report to the owner rather than change the
ceiling or the targets.

## Material assumptions (assumption ladder, `preparation-contract.md`)

| Question | Resolved as | Ladder rung and evidence |
| --- | --- | --- |
| Typed-only or cards-attached cases? | Cards attached only | Owner direction (answered-once in the ledger). |
| Which retrieval change? | C8 | Measured: only the topic candidates (C5–C8) put the Manufactor case's rules in the prompt; C6–C8 are the only ones with zero movement on every existing suite; C8 is the only one that delivers all four deciding rules the approved case names (rung 1: REQ-185's corpus, owner-approved). |
| Include 614.1a in the topic? | Yes | Rung 1: the owner-approved case lists it as deciding; measured: System 3 ranks it beyond #400 either way, and adding it moves no other number. Owner-visible inside REQ-220. |
| Fire on one marked card or two? | Two | Measured: one fires on an existing fixture and changes its prompt golden; CR 616 governs two or more effects (rung 4, smallest scope). |
| What counts as replacement/prevention wording? | The whole word "instead", "prevent", "prevents", or "prevented", any letter case ("prevention" and "preventing" do not count) — the rule the 4.8% rate and the zero-churn result were measured with | CR 614.1a defines replacement effects by "instead"; CR 616 covers "replacement and/or prevention effects". Rung 4: the narrowest marker that matches the CR's own definition. |
| Both modes, or lookup only? | Both; in game mode every card on the stack or in any zone | Rung 3: REQ-178 already holds lookup and game mode to one shared card signal "so lookup and game mode cannot drift apart"; the selector reads the same card set System 3's card signal reads in game mode (`contextCards`: stack plus every populated zone); measured zero churn in game fixtures. |
| How does the harness hold the fix? | Amend REQ-222's ratchet to count topic-carried rules (owner decides) | Measured: the System 3-only gate cannot see the topic and fails on Bard + Bilbo. Rung 1 conflict (REQ-222 as written), so surfaced as its own amended ID with a recommendation, not settled. |
| REQ-221? | Withdrawn (owner confirms) | Rung 1: both cases are approved corpus cases already gated by REQ-222 (REQ-185); new fixtures would duplicate them. Surfaced with its own block. |
| Add the Necropotence corpus wording's retrieval gap to this package? | No, follow-up | Rung 4, smallest scope; no measured candidate fixes it, REQ-220's topic does not fire on those cards, and the tester's own wording already carried 514.2 and 514.3a. Recorded under Follow-ups and named in the gate header so the owner sees it. |
| Add to the worked-solutions gold set? | Already there | The harness made the corpus the gold set (REQ-185); both cases are approved tier 3. |
| Live model run? | None | Retrieval is fully measured offline. Answer correctness belongs to the format follow-up, which the owner wants tested. |
| Which rules text do the new rules come from, and does anything else rebuild? | The committed rule index; only `gameRulesByTopic.json` gains the topic, no other artifact changes | Measured (Scope 1): the index-based build leaves 23/23 topics and the index, stats, and embeddings byte-identical. Rung 4, smallest scope: one rules version for every artifact. PR #273 is a stated dependency, not solved here. |
| New build-policy limits? | 24 topics; ceiling 26,000 characters (floor 18,000 kept) | Measured total 25,808. Rung 4: the smallest round ceiling with room for this topic keeps the guard tight. Owner-visible, so proposed inside REQ-220 for its verdict. |

No question met all three conditions of the genuine-blocker test: each has a
measured or PRD-backed answer, and the two product choices (the gate's counting,
REQ-221's withdrawal) are surfaced as their own stable IDs.

## Non-goals

- No prompt output-format change (the owner's next step, below).
- No change to System 3's search text, scoring, cap, or embeddings.
- No change to `preparePromptInput`; the rules gate only reads more of what it
  already collects.
- No typed-names-only handling (owner: out of focus).
- No live model call; no new runtime dependency; no network.
- No answer key committed; no tester, web, or agent text as ground truth.
- No new context-eval fixture and no corpus case added or edited.
- No user-visible screen, overlay, or wire-contract change, so no
  `screen-layout.md` row (REQ-126).

## Follow-ups (not in scope)

- **Prompt output format — the named next package.** The owner: "lets start
  with making the rules correct, and then we can make the output pretty", and
  "if were going to adjust the output format, we again need to test". What the
  measurement shows: on the tester's own Necropotence + Silence wording, rule
  514.2 (Silence ends in cleanup) and 514.3a (priority after a cleanup trigger)
  were already in the prompt at System 3 #7 and #3, with Necropotence's discard
  trigger in the attached card text, and the AI still insisted Silence applies
  in cleanup. The rules were there and the answer was wrong, so the next lever
  is how the prompt presents them. That package must test any format change
  against the same suites as here, plus a live answer check; offline retrieval
  suites cannot see answer quality. Measured basis for its cost: today the
  verbatim Q1 prompt is 14,524 characters and the verbatim Q2 prompt 14,699
  (hybrid) or 15,136 (lexical). Once REQ-220 ships, Q1 also carries the topic
  (3,898 characters through `formatGameRulesSection`), 18,422 characters, and
  that is the prompt the format package starts from. So its prompts run about
  14,700–18,400 characters (≈3,700–4,600 input tokens at about four characters
  a token); at the gpt-4.1 list rate in `scripts/eval-answer-quality.mjs` ($2 /
  $8 per million input / output tokens, 600 assumed output tokens) one answer
  costs about $0.012–$0.014.
- **Necropotence corpus wording misses 514.2 and 514.3a.** The approved case
  `necropotence-silence-borne-upon-a-wind-cleanup` gets 514.1 (#3) but not 514.2
  (#29) or 514.3a (#13), and the tester's own wording gets the reverse. Neither
  gets all three. A retrieval question for its own package (the answer-quality
  investigation's evidence trace, REQ-229, already reports it).
- **Search-only counts treat curated rules as misses.** `npm run
  eval:worked-solutions` and REQ-189's `goldRuleInPrompt` count only System 3
  picks, so six cases (603.2, 400.7) whose rule is in the prompt through a
  topic report MISS. The REQ-222 amendment fixes this for the gate only.
- **Typed card names.** If a player types names without attaching cards, the
  prompt carries no card text. The owner put this out of focus.
- **Rules-text refresh.** Every shipped game-rules artifact is on the
  2026-06-05 text on the merged tree; PR #273 moves it. This package's topic
  then rebuilds from the new text with the rest.

## References

- REQ-022 — curated rules baseline (System 2) and supplemental retrieval (System 3).
- REQ-032 — hand-labelled expected rule ids; the gating labelled checks.
- REQ-074 — Quick Lookup prompt assembly.
- REQ-167, REQ-178 — System 3 search text: question plus each card's name, type line, keywords.
- REQ-179 — curated rule numbers exclude their sub-rules from System 3.
- REQ-182 — hybrid ranking and its benchmark floors.
- REQ-185 — the rules test corpus (both tester cases are approved tier 3).
- REQ-188, NFR-018 — answer-quality run, non-gating validation track.
- REQ-190 — System 3 cap of ten.
- REQ-222 — the offline rules gate and its ratchet baseline (amended here).
- REQ-223 — the mechanic coverage gate.
- REQ-225 — the staleness report.
- REQ-229 — the evidence trace and its parity with the baseline.
- Intake: `intake/feedback.md`, `intake/screenwriter_temp_1791297379886.jpg`,
  `intake/screenwriter_temp_1791297414126.jpg`,
  `intake/screenwriter_temp_1791298001844.jpg`,
  `intake/screenwriter_temp_1791299243121.jpg` (the tester's verbatim prompts).
- Outside evidence (unverified, for the owner):
  https://edhrec.com/articles/learning-how-to-use-necropotence-in-cedh,
  https://tappedout.net/mtg-questions/interaction-between-peregrin-took-and-academy-manufactor.
- Measurement: `measure-candidates.mjs`, `measure-rules-gate.mjs`, and their
  outputs (this folder); `measure-retrieval.mjs` is the first define's script
  (typed-only and attached, single candidate list), kept as the earlier evidence;
  `build-topic-from-index.mjs` is the build step.
