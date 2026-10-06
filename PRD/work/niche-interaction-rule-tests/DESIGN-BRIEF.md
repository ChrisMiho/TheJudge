# Design brief — niche-interaction-rule-tests

**What this is:** a small, repeatable check that asks the two questions a tester
says The Judge got wrong, exactly as he typed them, and reports whether the
Comprehensive Rules that decide each one reach the prompt the AI answers from.

**What the measurement already shows:** the two failures are different.

- **Academy Manufactor + Esix, Fractal Bloom** is a retrieval gap. None of the
  rules about how two replacement effects combine reach the prompt. The AI only
  gets token definitions, so it is answering a rules-ordering question without
  the ordering rules.
- **Silence + Necropotence + Borne Upon a Wind** is not a retrieval gap. The rule
  that says "this turn" effects like Silence end in the cleanup step (514.2) and
  the rule that gives players priority in the cleanup step when something
  triggers (514.3a) are both already in the prompt. The AI had the right rule and
  still answered wrong. A retrieval test cannot catch that; it is an
  answer-quality problem.

**What the owner decides at the gate:** one new requirement, `REQ-220` (in
`GATE-QUESTIONS.md`): where these cases live, the rule labels each case expects,
and that the check reports but never blocks a build.

## Problem

A tester in a friend's Discord tried Quick Lookup (the free-text rules question
screen at `mtgjudge.gg/quick-lookup`) on two hard interactions and said it got
both wrong, concluding it is "unreliable for actually difficult questions" and
that "the game is too complicated for an LLM" (`intake/screenwriter_temp_1791297414126.jpg`,
`intake/screenwriter_temp_1791298001844.jpg`). The owner wants tests that show,
with evidence, whether the right rules are being pulled for these interactions
(`intake/feedback.md`).

## The tester's inputs (evidence, verbatim)

From `intake/screenwriter_temp_1791299243121.jpg`, added mid-run. This supersedes
`IDEA.md`'s line that the exact inputs were unknown.

1. "How do academy manufactor and esix, fractal bloom interact when I'm attempting
   to create a treasure token?"
2. "Can I use the triggered ability of necropotence during my cleanup step to
   dodge silence effects and cast borne upon a wind?" — the tester says he tried a
   couple of phrasings and all gave the same answer.

The tester also says: the answer to (2) "was insistent that silence still applies
during the cleanup step (it does not) despite me clarifying multiple times", and
it "didn't register that necropotence has a triggered ability when you discard to
hand size until I specifically called it out".

Whether the tester attached the cards in Quick Lookup's optional card picker, or
only typed their names, is unknown. Typed names alone do not attach card text:
Quick Lookup sends a card's oracle text and rulings only when the card is picked
(`apps/backend/src/prompt/preparation.ts`, `prepareLookupPromptInput`). The
measurement below runs both ways.

## What the rules say (for the owner to confirm — not product truth)

The cards, from the committed card data (`cardDetailByOracleId.json.br`,
`cardRulingsByOracleId.json.br`):

- **Academy Manufactor:** "If you would create a Clue, Food, or Treasure token,
  instead create one of each."
- **Esix, Fractal Bloom:** "The first time you would create one or more tokens
  during each of your turns, you may instead choose a creature other than Esix and
  create that many tokens that are copies of that creature." Its official ruling
  (2021-04-16): "This effect can apply to any token, not just creature tokens. For
  example, you could replace creating a Treasure token with creating a copy of the
  chosen creature."
- **Silence:** "Your opponents can't cast spells this turn."
- **Necropotence:** "Skip your draw step. Whenever you discard a card, exile that
  card from your graveyard. Pay 1 life: Exile the top card of your library face
  down. Put that card into your hand at the beginning of your next end step."
- **Borne Upon a Wind:** "You may cast spells this turn as though they had flash.
  Draw a card."

**Interaction 1 — Manufactor + Esix.** Both are replacement effects (an effect
that swaps one event for another, marked by "instead" — CR 614.1a). When two
apply to the same event, the player creating the tokens picks which applies
first (CR 616.1, 616.1e), then the process repeats with whatever still applies
(CR 616.1f), and each effect applies at most once (CR 614.5). Reading those
rules:

- Esix first: the Treasure becomes one copy of the chosen creature; it is no
  longer a Clue, Food, or Treasure, so Manufactor no longer applies. One copy.
- Manufactor first: the Treasure becomes a Clue, a Food, and a Treasure (three
  tokens); Esix still applies to that event and turns it into three copies of
  the chosen creature.

This reading contradicts the tester's claim that "you cannot benefit from both".
No official ruling or judge answer for this exact pair was found; the closest
outside evidence is a Q&A on Peregrin Took + Academy Manufactor, whose answers
say the player chooses the order of the two replacement effects and each applies
once (https://tappedout.net/mtg-questions/interaction-between-peregrin-took-and-academy-manufactor,
2023). A web-search summary that claimed "Esix always applies first" misread
Esix's ruling "This effect applies before anything that modifies how those tokens
enter the battlefield" — Manufactor changes which tokens are created, not how
they enter, so that ruling does not order these two. The owner should confirm
this reading; the test checks only that the ordering rules reach the prompt, not
which answer the AI gives.

**Interaction 2 — Silence + Necropotence + Borne Upon a Wind.** In the cleanup
step (the last step of the turn), the active player first discards down to
maximum hand size (CR 514.1); then "all 'until end of turn' and 'this turn'
effects end" (CR 514.2) — this ends Silence; then, if any ability triggered, it
goes on the stack and players get priority, after which another cleanup step
follows (CR 514.3a). Necropotence's "Whenever you discard a card" triggers on the
cleanup discard, so its controller gets priority after Silence has ended and can
cast Borne Upon a Wind. The tester is right that Silence no longer applies there.
His phrase "go back to your end step" is loose: the rules give priority inside
the cleanup step and then start another cleanup step; the turn does not return
to the end step. Outside evidence agreeing: EDHREC, "Learning How to Use
Necropotence in cEDH" (Harvey McGuinness, 2026-08-11) — "If you pick up a bunch
of cards in your end step, then an opponent casts Silence during that same step
(or any other similar effect), that effect will wear off during the cleanup
step", and "If an ability triggers during the cleanup step, there is another
round of priority followed by another cleanup step"
(https://edhrec.com/articles/learning-how-to-use-necropotence-in-cedh).

Outside sources are cited as evidence for the owner, never as an answer key
(REQ-185: "An answer written by a contributor or an agent is never ground truth";
community sources "may choose which questions enter ... never as its answer").

## Ground truth: what retrieval pulls today (measured 2026-10-06)

**Method.** `PRD/work/niche-interaction-rule-tests/measure-retrieval.mjs`, run from
the repo root with `npx tsx`. It uses the same offline path as
`npm run eval:worked-solutions`: the shared helpers in
`scripts/lib/prompt-fidelity.mjs` (`loadPromptResources`, `buildEmbedder`) and
the unmodified production `preparePromptInput` at the production cap of ten
System 3 excerpts (System 3 is the supplemental rules search that adds up to ten
Comprehensive Rules excerpts to every prompt). The question is embedded by the
local MiniLM model production runs (`EMBEDDING_PROVIDER=local`, hybrid ranking),
and repeated with `EMBEDDING_PROVIDER=mock` (word-overlap ranking only). No
network, no model call. The same setup reproduced the recorded 16/18 on the
existing gold set first, so the tooling is sound in this checkout.

"In prompt" means the rule is in System 3's top ten or in one of the four
always-on curated rule topics (`stack-and-priority`, `targets-basics`,
`zones-basics`, `abilities-trigger-basics`). Depth rank is the rule's position
with the cap raised to 300, to show how far below the cutoff a miss sits.

**Question 1 (Manufactor + Esix), tester's words:**

| Rule | What it says | No cards, hybrid | Cards attached, hybrid | No cards, word-overlap | Cards attached, word-overlap |
| --- | --- | --- | --- | --- | --- |
| 616.1 | affected player chooses which replacement effect applies first | not in prompt (rank 92) | not in prompt (>300) | not in prompt (35) | not in prompt (50) |
| 616.1e | any applicable effect may be chosen | not in prompt (>300) | not in prompt (>300) | not in prompt (>300) | not in prompt (>300) |
| 616.1f | repeat until no effects are left to apply | not in prompt (>300) | not in prompt (>300) | not in prompt (>300) | not in prompt (>300) |
| 616.2 | an effect can become applicable after another modifies the event | not in prompt (>300) | not in prompt (>300) | not in prompt (>300) | not in prompt (>300) |
| 614.5 | each replacement effect applies only once | not in prompt (>300) | not in prompt (>300) | not in prompt (>300) | not in prompt (>300) |
| 111.10a | Treasure token definition | in prompt (rank 1) | in prompt (rank 1) | in prompt (rank 1) | in prompt (rank 3) |

What reached System 3's top ten instead: token rules (111.x), copy rules
(707.1, 707.10e), and unrelated keyword rules (702.174h, 701.36a, 722.3c). With
the cards attached, both cards' oracle text and all nine of their rulings
(Manufactor 4, Esix 5) are in the prompt, including Esix's Treasure ruling — but
still no rule on ordering replacement effects.

**Why it misses.** The tester's question never says "replacement" or "instead".
System 3's search text is the question plus each attached card's name, type line,
and keywords — never the card's oracle text (REQ-167, REQ-178) — so the word
"instead" on both cards never reaches the search. A diagnostic rephrasing (not the
tester's words, cards attached) — "Academy Manufactor and Esix, Fractal Bloom are
both replacement effects on creating a Treasure token. Which one applies first,
and can both apply?" — pulled 616.1f (rank 10, hybrid; rank 4 word-overlap) and
616.1g, but still not 616.1 (rank 52) or 614.5 (rank 63). Naming the mechanic
helps; the player should not have to.

**Question 2 (Silence + Necropotence + Borne Upon a Wind), tester's words:**

| Rule | What it says | No cards, hybrid | Cards attached, hybrid | No cards, word-overlap | Cards attached, word-overlap |
| --- | --- | --- | --- | --- | --- |
| 514.2 | "this turn" effects end in the cleanup step | in prompt (rank 5) | in prompt (rank 7) | in prompt (rank 7) | in prompt (rank 7) |
| 514.3a | a trigger in cleanup gives priority, then another cleanup step | in prompt (rank 3) | in prompt (rank 3) | in prompt (rank 3) | in prompt (rank 4) |
| 514.3 | normally no priority in cleanup | in prompt (rank 1) | in prompt (rank 1) | in prompt (rank 5) | in prompt (rank 5) |
| 514.1 | discard to hand size in cleanup | not in prompt (276) | not in prompt (>300) | not in prompt (11) | not in prompt (11) |
| 603.2 / 603.3 | triggered abilities trigger, then go on the stack | in prompt (curated topic) | in prompt (curated topic) | in prompt (curated topic) | in prompt (curated topic) |

With the cards attached, Silence's, Necropotence's, and Borne Upon a Wind's
oracle text and rulings are in the prompt (Necropotence's "Whenever you discard a
card" included). With no cards attached, none of the card text is — which fits
the tester's report that the answer did not know Necropotence has a discard
trigger, if he typed the names without picking the cards. That is a plausible
explanation, not a confirmed one.

**What this means.** For question 2 the deciding rules were in the prompt and the
answer still said Silence applies in cleanup. A retrieval test will pass on it
today and cannot detect that failure. The answer-quality run (REQ-188) is the
instrument that can, but only for cases with an official published answer
(REQ-185), and neither interaction has one verbatim (see Non-goals).

## Scope

1. **Four committed interaction cases** — the tester's two questions verbatim,
   each asked two ways: bare (names typed only) and with the named cards
   attached by oracle id, the way Quick Lookup's card picker sends them.

   | Case id | Question | Cards attached | Expected rule ids (hand-labelled) | Today (measured) |
   | --- | --- | --- | --- | --- |
   | `manufactor-esix-treasure-bare` | Q1 verbatim | none | 616.1, 616.1f | MISS (neither) |
   | `manufactor-esix-treasure-cards` | Q1 verbatim | Academy Manufactor, Esix, Fractal Bloom | 616.1, 616.1f | MISS (neither) |
   | `necropotence-silence-cleanup-bare` | Q2 verbatim | none | 514.2, 514.3a | HIT (both) |
   | `necropotence-silence-cleanup-cards` | Q2 verbatim | Silence, Necropotence, Borne Upon a Wind | 514.2, 514.3a | HIT (both) |

   Labels are the smallest set that decides each question: for Q1 the rule that
   lets the player choose the order (616.1) and the rule that re-applies the
   remaining effect (616.1f); for Q2 the rule that ends Silence (514.2) and the
   rule that gives priority in cleanup after a trigger (514.3a). They are
   human-labelled from the committed rules text, never copied from scorer output
   (REQ-032's constraint), and the owner confirms them at the gate.

2. **A case loader and validator** — each case must carry a non-empty `id`,
   `question`, `whyHard`, at least one expected rule id, each expected rule id
   present in the committed `gameRulesRuleIndex.json`, a `cards` list (may be
   empty) whose entries carry `name` and `oracleId`, and a `source` block naming
   where the question came from (here: tester feedback, 2026-10-06, the intake
   screenshot path) and the CR rule ids the labels come from. A malformed case
   fails loudly, like `scripts/lib/gold-cases.mjs`. No `workedSolution` field:
   these are not gold cases and the answer-quality run never reads them.

3. **One offline command**, `npm run eval:interaction-retrieval`, that runs every
   case through the same production-fidelity path as `eval:worked-solutions`
   (`scripts/lib/prompt-fidelity.mjs`: committed indexes, cards attached by oracle
   id, question embedded by `EMBEDDING_PROVIDER`, refusal on silent lexical
   fallback) and prints one line per case: HIT/MISS, semantic or lexical, each
   expected rule's System 3 rank or "not in prompt", and a summary. It exits 0 on
   misses; a miss is a tuning signal.

4. **Non-gating, with a guard.** The command is never wired into `npm test`,
   `npm run test:eval`, `npm run coverage:check`, or `npm run quality:check`; a
   regression-guard test asserts that, as `scripts/eval-answer-quality.test.mjs`
   does for the answer-quality run (REQ-188). The loader/validator's own unit
   tests are pure and offline and do run in `npm run test:scripts`, like
   `eval-worked-solutions.test.mjs`.

5. **A README** in the case directory saying what the set is, what a HIT and a
   MISS mean, that it is not runtime prompt context and not a build gate, and the
   provenance rule (questions from real reports; labels from the committed CR;
   outside sources cited as why a case matters, never as its answer).

6. **PRD truth applied at build** — `REQ-220` added to
   `PRD/sections/functional-requirements.md` and the eval-harness entry in
   `PRD/sections/system-map.md` amended, exactly as `GATE-QUESTIONS.md` proposes.

## Technical shape (for map-out)

- Cases live in `apps/backend/src/eval/interaction-retrieval/*.case.json`, outside
  `apps/backend/src/eval/fixtures/` (the directory the gating
  `contextEvaluationHarness.test.ts` globs) — the same separation the
  worked-solutions set uses, so the gating suite cannot pick them up by accident.
- Script `scripts/eval-interaction-retrieval.mjs`, loader
  `scripts/lib/interaction-cases.mjs`, tests
  `scripts/eval-interaction-retrieval.test.mjs` and
  `scripts/lib/interaction-cases.test.mjs`; `package.json` gains
  `"eval:interaction-retrieval": "tsx scripts/eval-interaction-retrieval.mjs"`.
- Reuse before creating (`technical-design-rules.md`): import `loadPromptResources`,
  `buildEmbedder`, `describeRetrieval`, and `assertQueryEmbedded` from
  `scripts/lib/prompt-fidelity.mjs`, and the recall/report shape from
  `scripts/eval-worked-solutions.mjs` (`evaluateCaseRecall`) rather than copying
  them. The one gap is request building: `buildCaseRequest` attaches only a
  tier-2 gold case's single cited card. Generalise it to also accept an explicit
  `cards` list (gold-case behaviour unchanged, covered by its existing tests), or
  add a sibling builder in the same module — map-out picks; either way one
  module owns "how a case becomes a lookup request". The query embedding must be
  built through `buildRetrievalQueryText` with the cards attached, as
  `embedGoldCaseQueries` does, so the embedded text matches what production embeds.
- Rank reporting: `describeRetrieval` already returns `selectedRuleIds`; the
  per-rule rank is its index there. Depth beyond the cap is optional diagnostic
  output, not required.
- Recording: the first build run's report is recorded in `REQ-220`'s Notes as the
  baseline (expected: two misses, two hits, as measured above). Expected labels
  are never edited to turn a miss into a hit (REQ-185's "no case is added,
  edited, or removed to make a score look better", adopted here).

## Material assumptions (assumption ladder, `preparation-contract.md`)

| Question | Resolved as | Ladder rung and evidence |
| --- | --- | --- |
| Do these join the worked-solutions gold set? | No — a separate retrieval-only set | Rung 1: REQ-185 admits only cases whose answer is an official text verbatim (a CR `Example:` line, or a WotC card ruling) and says "there is no tier 3". Neither interaction has one: 514.2 is rule text, not an `Example:` line, and no ruling states the Manufactor+Esix result. Joining would need REQ-185 amended. Surfaced in `REQ-220` for the owner. |
| Do the checks gate `quality:check`? | No — report only | Rung 1: NFR-018 keeps its validation track "not a build-blocking gate unless the owner later promotes it". Rung 2: Q1 misses today and this package changes no retrieval (IDEA non-goal), so a gate would fail every build. Surfaced in `REQ-220`. |
| Which rules does each case expect? | 616.1 + 616.1f; 514.2 + 514.3a | Rung 1: REQ-032 requires human-labelled expected rule ids. Labels read from the committed rules text above. Surfaced in `REQ-220` for the owner to confirm. |
| Bare question, cards attached, or both? | Both | Rung 4/5: the tester's attachment is unknown and the two shapes measured differently for card text; both mirror real Quick Lookup requests (`quick-lookup-no-card` / `quick-lookup-multi-card` fixtures already cover both shapes). |
| Count curated always-on topics as "in prompt"? | Report System 3 rank, like `eval:worked-solutions` | Rung 3: established pattern in `describeRetrieval`. None of the four labels is in a curated topic, so the verdict is the same either way. |
| Add the cases to the answer-quality run? | No | Rung 1: REQ-185/NFR-018 — no case enters without an official published answer. |
| Fix retrieval for Q1 here? | No | IDEA non-goal; the smallest reversible scope (rung 4). |

## Non-goals

- No change to retrieval, ranking, the System 3 cap, prompts, or answers.
- No live model call anywhere; no new runtime dependency; no network.
- No change to the worked-solutions gold set, its loader, or `eval:worked-solutions`
  output (REQ-185: it "keeps working unchanged over the same files").
- No answer key: no tester text, web text, or agent-written answer is committed as
  ground truth.
- No user-visible screen, overlay, or wire-contract change, so no
  `screen-layout.md` row (REQ-126).

## Follow-ups this package surfaces (not in scope)

- **Q1 retrieval gap.** System 3 never sees the word "instead" on attached cards
  because its search text excludes oracle text (REQ-167, REQ-178). A future
  retrieval package could test adding replacement-effect signal for attached cards
  whose oracle text says "instead"; this check is the before/after measure.
- **Q2 answer gap.** The model contradicted 514.2 while 514.2 was in its prompt.
  Only the answer-quality instrument measures that, and only with an official
  answer. The owner could look for an official source (for example a CR
  `Example:` line or a ruling) that states it, which would let it enter the gold
  set as tier 1 or 2.
- **Card text for typed names.** If the tester typed the names without picking the
  cards, the prompt carried no card text at all. Whether Quick Lookup should
  notice card names typed in the question is a product question for its own
  package.

## References

- REQ-032 — retrieval relevance measured against hand-labelled expected rule ids;
  labels never inferred from scorer output.
- REQ-167, REQ-178 — System 3 search text is the question plus each attached
  card's name, type line, and keywords.
- REQ-185 — the worked-solutions gold set and its official-answer entry bar.
- REQ-188 — the answer-quality run and its never-in-a-gate guard.
- REQ-190 — System 3 cap of ten.
- NFR-018 — the non-gating worked-solutions validation track.
- Intake: `intake/feedback.md`, `intake/screenwriter_temp_1791297379886.jpg`,
  `intake/screenwriter_temp_1791297414126.jpg`,
  `intake/screenwriter_temp_1791298001844.jpg`,
  `intake/screenwriter_temp_1791299243121.jpg` (the tester's verbatim prompts).
- Outside evidence (unverified, for the owner):
  https://edhrec.com/articles/learning-how-to-use-necropotence-in-cedh,
  https://tappedout.net/mtg-questions/interaction-between-peregrin-took-and-academy-manufactor.
  Searches for a judge answer on the exact Manufactor + Esix pair found none.
