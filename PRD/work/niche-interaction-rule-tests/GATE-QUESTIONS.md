# Gate questions — niche-interaction-rule-tests

**Decide:** three items. Answer each verdict slot below (accept, edit, or
reject; a reason is required for edit or reject), then merge the docs PR to
start the build.

- `REQ-220` (new) — the fix: a rules topic that switches on when two or more
  cards replace or prevent.
- `REQ-022` (amended) — the curated rules baseline stops being strictly
  "card-agnostic" to allow that one switch.
- `REQ-221` (new) — the tester's two questions become gating tests.

Full evidence, the baseline across every rule-output suite, and every
candidate tried with its measured result: `DESIGN-BRIEF.md` in this folder.

## REQ-220 — the replacement-effect interaction rules reach the AI when two or more cards replace or prevent

**What this decides:** whether The Judge adds the Comprehensive Rules on how
replacement and prevention effects interact to the AI's prompt whenever two or
more cards in the question say "instead" or "prevent".

**In plain terms:** a tester attached Academy Manufactor and Esix, Fractal
Bloom and asked how they combine when he makes a Treasure. Both cards are
replacement effects — effects that swap one event for another, marked by the
word "instead". The rule that answers it (616.1: the player picks which effect
applies first; 616.1f: then whatever still applies gets its turn) never reached
the AI; it got token definitions instead. With this change, two or more such
cards in a Quick Lookup question, or on the stack or battlefield in an
In-Depth game question, switch on a curated rules topic — "Interaction of
Replacement and Prevention Effects", the full text of rules 616.1, 616.1a
through 616.1g, and 616.2 — in the prompt's `GAME RULES (reference)` section.
Measured offline: the Manufactor + Esix question goes from MISS to HIT, and
every existing rule-output test gives exactly the result it gives today.
Search-side alternatives (feeding card text into the rules search, or adding
the term "replacement effect" to it) were measured too. None got both 616.1
and 616.1f into the top ten under both rankings: adding the term lifted 616.1
to 7th or 8th under the older word-match ranking only, never under the shipped
ranking, and 616.1f never came closer than 25th. Two of them broke the
Necropotence question and the retrieval benchmark. The rules search itself (System 3 — the scored search that adds up
to ten rule excerpts) is not changed: it still searches the question plus each
card's name, type line, and keywords, never its full text (REQ-178).

**What happens if you say no:** retrieval stays as it is. The Manufactor + Esix
question keeps reaching the AI without the rules that decide it, and `REQ-221`'s
Manufactor test could not pass.

**Proposed diff** — `PRD/sections/functional-requirements.md`, appended after
`REQ-219`:

```diff
+### REQ-220
+- Title: Replacement-effect interaction rules when two or more cards replace or prevent
+- Priority: high
+- Description: When two or more cards in a request carry replacement or prevention wording, the assembled prompt's `GAME RULES (reference)` section includes the curated topic `replacement-effects-interaction` — the Comprehensive Rules for how replacement and prevention effects interact (the affected player chooses the order, the special cases that apply first, and the process repeating until no effect is left to apply). It applies in lookup mode and game mode alike. It is the one System 2 topic selected by card wording rather than game state.
+- Acceptance Criteria:
+  - `apps/backend/data/gameRulesTopicManifest.json` gains topic `replacement-effects-interaction`, titled "Interaction of Replacement and Prevention Effects", with rule numbers `616.1`, `616.1a`, `616.1b`, `616.1c`, `616.1d`, `616.1e`, `616.1f`, `616.1g`, `616.2`; `node scripts/build-game-rules.mjs`, run against the local Comprehensive Rules source (`apps/backend/data/cr/source.txt`, gitignored), writes it into `gameRulesByTopic.json` as verbatim Comprehensive Rules text, like every other topic, while `gameRulesRuleIndex.json`, `gameRulesTokenStats.json`, `gameRulesCoreTopics.json`, and `gameRulesRuleEmbeddings.json` stay byte-identical
+  - a card carries replacement or prevention wording when its oracle text contains, as a whole word in any letter case, "instead" (CR 614.1a: effects that use the word "instead" are replacement effects) or "prevent", "prevents", or "prevented"; other forms such as "prevention" or "preventing" do not count
+  - the topic is selected when two or more cards in the request carry that wording — in lookup mode the attached cards, in game mode every card on the stack and in populated zones; two copies of one card count as two. With fewer than two it is not selected
+  - one shared selection function serves both modes, so lookup and game mode cannot drift apart
+  - in lookup mode the topic is added alongside the four always-on core topics, never in place of them; in game mode it is added alongside the game-state-gated topics
+  - the topic's rule numbers join the curated exclusion set, so System 3 never repeats them (REQ-179)
+  - System 3's search text, scoring, cap, and embeddings are unchanged: the query stays the question plus each card's name, type line, and keywords, never oracle text (REQ-167, REQ-178, REQ-190)
+  - with Academy Manufactor and Esix, Fractal Bloom attached to the question "How do academy manufactor and esix, fractal bloom interact when I'm attempting to create a treasure token?", rules `616.1` and `616.1f` are in the prompt under both hybrid and lexical ranking (REQ-221 holds this as a gating fixture)
+  - no existing rule-output result moves from its 2026-10-06 measurement: worked-solutions retrieval 16/18 in System 3 under hybrid ranking and 14/18 under lexical; the context-evaluation harness's labelled System 3 checks 14/14 semantic and 14/14 lexical; none of the 31 existing prompt or context goldens changes; the retrieval benchmark's recall@5 stays at 0.5833 clean / 0.5769 polluted lexical and 0.8974 clean / 0.8910 polluted hybrid
+- Constraints:
+  - card wording selects this one topic only; card names and keywords never select a System 2 topic
+  - no live AI call, no new runtime dependency, no per-request external call
+  - verbatim rules text only; no paraphrase
+- Dependencies:
+  - REQ-022 (the curated baseline this topic joins; amended for the card-wording gate)
+  - REQ-074 (Quick Lookup prompt assembly)
+  - REQ-178 (the shared card signal that keeps lookup and game mode aligned; unchanged)
+  - REQ-179 (prefix-based curated exclusion)
+  - REQ-221 (the gating fixtures that hold this result)
+- Notes:
+  - measured at define, 2026-10-06 (`niche-interaction-rule-tests`), offline against the committed corpus with the local embedder: before, with both cards attached, 616.1 ranked 50th (lexical) and beyond 300th (hybrid) and 616.1f beyond 300th; System 3's top ten was token and copy rules. After, both rules are in the prompt through this topic
+  - candidates measured and rejected: the attached cards' oracle text in the System 3 search (616.1 still out of the top ten; it pushed the Necropotence + Silence question's rule 514.2 out of the prompt; benchmark polluted recall@5 fell from 0.5769 to 0.3782 lexical and from 0.8910 to 0.7756 hybrid; 25 of 31 goldens changed); oracle text in the embedding only (514.2 pushed to 12th; hybrid polluted recall@5 0.8333); the terms "replacement effect" / "prevention effect" added to the search from card wording, card side or question side (616.1 reached 8th and 7th under lexical ranking but only 31st–35th under hybrid, the shipped ranking; 616.1f stayed 25th or worse under both; polluted recall@5 fell); no search-side candidate got both 616.1 and 616.1f into the top ten under both rankings; the topic on any one marked card (fired on Questing Beast's "can't be prevented" alone and changed a golden)
+  - the full 616.1 family is shipped rather than a minimal subset because rule 616.1 directs the player through "the steps listed in rules 616.1a–f", and listing 616.1 bars System 3 from every 616.1 sub-rule; the topic adds 3,662 characters to a prompt when it fires (about 25% on the Manufactor + Esix prompt). 4.8% of cards carry the wording (matched as whole words in any letter case), so two random attached cards both carry it about 0.2% of the time
+  - the build re-runs every suite above and records its before/after here
```

Supporting product-truth edits that follow from this requirement (each listed in
the brief's amendment-set table with its grep hit):

`PRD/sections/system-map.md`, `## Game rules retrieval` and `### Curated game rules (System 2)`:

```diff
-- Summary: Retrieves card rulings, a card-agnostic curated game-rules baseline, and relevance-scored supplemental rules text to ground prompt reasoning; System 2 (curated) and System 3 (supplemental) are tuned and measured together.
+- Summary: Retrieves card rulings, a curated game-rules baseline (gated by game state, plus one card-wording gate for replacement-effect interactions), and relevance-scored supplemental rules text to ground prompt reasoning; System 2 (curated) and System 3 (supplemental) are tuned and measured together.
 - Lives in: `apps/backend/src/cardRulings.ts`, `gameRules.ts`, `gameRulesTopicSelection.ts`, `gameRulesRetrieval.ts`
-- Backed by: DEC-029, DEC-030, DEC-032, DEC-045, DEC-046, DEC-047, REQ-022, REQ-032
+- Backed by: DEC-029, DEC-030, DEC-032, DEC-045, DEC-046, DEC-047, REQ-022, REQ-032, REQ-220
```

```diff
-- Summary: Selects an always-on core plus card-agnostic, game-state-gated conditional topics (`turnPhase`, `combatStep`, populated zones) per request, replacing the prior "all topics every request" baseline.
+- Summary: Selects an always-on core plus game-state-gated conditional topics (`turnPhase`, `combatStep`, populated zones) per request, plus the replacement-effect interaction topic when two or more cards carry replacement or prevention wording (REQ-220), replacing the prior "all topics every request" baseline.
 - Lives in: `apps/backend/src/gameRulesTopicSelection.ts`, `gameRules.ts`
-- Backed by: DEC-030, DEC-045, REQ-022
+- Backed by: DEC-030, DEC-045, REQ-022, REQ-220
```

`PRD/sections/system-map/game-rules-retrieval.md`:

```diff
-Backed by: DEC-029, DEC-030, DEC-032, DEC-045, DEC-046, DEC-047, REQ-022, REQ-032, REQ-177, REQ-178, REQ-179, REQ-180, REQ-181
+Backed by: DEC-029, DEC-030, DEC-032, DEC-045, DEC-046, DEC-047, REQ-022, REQ-032, REQ-177, REQ-178, REQ-179, REQ-180, REQ-181, REQ-220
```

```diff
 System 2 is the curated baseline. It always includes core rules topics, then adds
-conditional buckets from card-agnostic game-state signals only: `turnPhase`,
-`combatStep`, and populated zone presence. Card names, oracle text, and keywords do
-not affect System 2. This replaces the prior "all topics every request" baseline with
+conditional buckets from game-state signals: `turnPhase`, `combatStep`, and populated
+zone presence. One topic is gated on card wording instead: when two or more submitted
+or attached cards carry replacement or prevention wording ("instead", "prevent"), it
+adds the replacement-effect interaction rules (CR 616.1, 616.1a–g, 616.2; REQ-220).
+Card names and keywords never affect System 2. This replaces the prior "all topics every request" baseline with
 a smaller `GAME RULES (reference)` section that still covers the stable vocabulary the
```

```diff
 vocabulary. Prompt preparation first collects submitted cards for System 1. It then
-selects System 2 topics from game-state signals and derives the selected curated rule
-IDs from those topics.
+selects System 2 topics from game-state signals and the card-wording gate (REQ-220)
+and derives the selected curated rule IDs from those topics.
```

```diff
-- System 2 is intentionally card-agnostic. It is driven by `turnPhase`, `combatStep`,
-  and populated-zone presence, not card names, oracle text, or keywords.
+- System 2 is driven by `turnPhase`, `combatStep`, and populated-zone presence, plus
+  one card-wording gate: two or more cards whose oracle text says "instead" or
+  "prevent" add the replacement-effect interaction topic (REQ-220). Card names and
+  keywords never select a System 2 topic, and relevance scoring stays System 3's job.
```

`PRD/sections/system-map/prompt-layout-spec.md`:

```diff
-| 7 | `GAME RULES (reference)` | Curated core-rules excerpts (System 2) — state-gated by submitted zones/cards in game mode, a fixed always-on set in lookup mode. |
+| 7 | `GAME RULES (reference)` | Curated core-rules excerpts (System 2) — state-gated by submitted zones/cards in game mode, an always-on set in lookup mode; in both, the replacement-effect interaction topic is added when two or more cards carry replacement or prevention wording (REQ-220). |
```

```diff
-| `GAME RULES (reference)` | conditional — present when System 2 selects ≥1 topic from the submitted zones/cards; can be empty | conditional — present when the always-on core topic set renders; in practice always true (the set is fixed and non-empty) | conditional — same always-on set as lookup with cards | conditional — same rule as whichever mode the follow-up is in |
+| `GAME RULES (reference)` | conditional — present when System 2 selects ≥1 topic from the submitted zones/cards; can be empty | conditional — present when the always-on core topic set renders; in practice always true (the core set is fixed and non-empty), plus the replacement-effect interaction topic when two or more attached cards carry replacement or prevention wording (REQ-220) | conditional — the always-on core set only (no cards, so the REQ-220 topic never fires) | conditional — same rule as whichever mode the follow-up is in |
```

`PRD/sections/integrations-and-data.md`:

```diff
-- verbatim WotC Comprehensive Rules excerpts for curated general game-rules topics selected per DEC-045 (always-on core plus game-state-gated expansion) from the static backend artifact
+- verbatim WotC Comprehensive Rules excerpts for curated general game-rules topics selected per DEC-045 (always-on core plus game-state-gated expansion) plus the replacement-effect interaction topic when two or more cards carry replacement or prevention wording (REQ-220), from the static backend artifact
```

```diff
-- include curated topics selected per DEC-045 (always-on core plus game-state-gated expansion) from the committed artifact
+- include curated topics selected per DEC-045 (always-on core plus game-state-gated expansion) and REQ-220 (the replacement-effect interaction topic, on card wording) from the committed artifact
```

`PRD/sections/quick-lookup/README.md`:

```diff
   table of contents and heading-only entries stripped (REQ-179), excluding by
-  rule-number prefix the curated rule numbers the always-on core topics already
-  carry, and returning a small capped set of the best-ranked rules. IDF-scored
+  rule-number prefix the curated rule numbers the selected curated topics already
+  carry, and returning a small capped set of the best-ranked rules. IDF-scored
```

```diff
 - Built: the always-on core game-rules topics are a fixed curated set
   (stack-and-priority, targets, zones, triggered-ability basics), not the
   state-gated selector the game flow uses — lookup carries no game state to gate
-  on. (DEC-045, REQ-074)
+  on. One topic is added on card wording: when two or more attached cards say
+  "instead" or "prevent" (replacement or prevention effects), the prompt also
+  carries the replacement-effect interaction rules (CR 616.1, 616.1a–g, 616.2),
+  so a question about two such cards — Academy Manufactor with Esix, Fractal
+  Bloom, say — gets the rule that the player chooses the order. (DEC-045,
+  REQ-074, REQ-220)
```

and in its header, `- Backed by:` gains `REQ-220` at the end of the list.

`PRD/sections/in-depth/README.md`, `### Retrieval enrichment (machinery consumed)`:

```diff
 - Built: `GAME RULES (reference)` loads verbatim WotC Comprehensive Rules
   excerpts from committed artifacts, selected by DEC-045's always-on core plus
-  card-agnostic game-state-gated expansion (System 2, gated on `turnPhase`,
-  `combatStep`, and populated zones only — no card names or oracle text). It is
-  omitted only when the artifact is missing/empty, with a warning logged.
-  (DEC-030, DEC-045, REQ-022)
+  game-state-gated expansion (System 2, gated on `turnPhase`, `combatStep`, and
+  populated zones), plus the replacement-effect interaction topic when two or
+  more cards on the stack or in play say "instead" or "prevent" (REQ-220); card
+  names and keywords never select a topic. It is omitted only when the artifact
+  is missing/empty, with a warning logged. (DEC-030, DEC-045, REQ-022, REQ-220)
```

and in its header, `- Backed by:` gains `REQ-220` at the end of the list.

- Verdict:
- Reason:

## REQ-022 — the curated rules baseline gains one card-wording switch (amended)

**What this decides:** whether the standing rule that the curated rules
baseline ignores the cards entirely is relaxed for exactly one case: two or
more cards with replacement or prevention wording.

**In plain terms:** REQ-022 is the requirement that puts official rules text in
every prompt, in two parts. System 2 is a curated set of rule topics picked by
the game situation (turn phase, combat step, which zones have cards). System 3
is a scored search over every rule. REQ-022 says today that System 2 uses
"only card-agnostic game-state signals ... no card names, oracle text, or
keywords", and that "System 3 owns all card/question-driven retrieval".
`REQ-220` needs System 2 to read one thing from the cards: whether at least two
of them say "instead" or "prevent". This amendment makes that the single
allowed exception. Card names and keywords still never pick a topic, and
relevance scoring stays with System 3.

**What happens if you say no:** REQ-022 keeps forbidding card text in topic
selection, so `REQ-220` as written cannot ship. Rejecting this means rejecting
`REQ-220`, or editing it into a different mechanism.

**Proposed diff** — `PRD/sections/functional-requirements.md`, `### REQ-022`:

```diff
-- Description: Every backend AI prompt must include a curated library of verbatim WotC Comprehensive Rules excerpts as reference context, selected by card-agnostic game-state signals for the baseline and by card/question-driven relevance scoring for supplemental rules, without changing the product API or UI.
+- Description: Every backend AI prompt must include a curated library of verbatim WotC Comprehensive Rules excerpts as reference context, selected by game-state signals for the baseline — plus one card-wording gate for replacement-effect interactions (REQ-220) — and by card/question-driven relevance scoring for supplemental rules, without changing the product API or UI.
```

```diff
-  - every assembled prompt includes `GAME RULES (reference)` with curated topics selected per DEC-045 (always-on core plus game-state-gated expansion) in stable `id` order when the artifact is present
+  - every assembled prompt includes `GAME RULES (reference)` with curated topics selected per DEC-045 (always-on core plus game-state-gated expansion) and REQ-220 (the replacement-effect interaction topic when two or more cards carry replacement or prevention wording) in stable `id` order when the artifact is present
```

```diff
-  - System 2 selection uses only card-agnostic game-state signals (`turnPhase`, `combatStep`, populated zones); no card names, oracle text, or keywords
-  - System 3 owns all card/question-driven retrieval including oracle-keyword signals
+  - System 2 selection uses game-state signals (`turnPhase`, `combatStep`, populated zones) plus exactly one card signal: whether two or more cards' oracle text carries replacement or prevention wording as REQ-220 defines it (the whole word "instead", "prevent", "prevents", or "prevented"), which selects the replacement-effect interaction topic (REQ-220); card names and keywords never select a System 2 topic
+  - System 3 owns all relevance-scored card/question-driven retrieval including oracle-keyword signals; REQ-220's wording gate is a fixed on/off switch, not scoring
```

and under `- Dependencies:`, after `  - REQ-182 (the hybrid blend that is now System 3's shipped ranking)`:

```diff
+  - REQ-220 (the card-wording gate for the replacement-effect interaction topic)
```

and as the last bullet of `- Notes:`:

```diff
+  - amended by `niche-interaction-rule-tests` (2026-10-06): System 2 is no longer strictly card-agnostic. One topic, the replacement-effect interaction rules, is selected when two or more cards carry replacement or prevention wording (REQ-220), because no change to System 3's search, measured offline, got both rules 616.1 and 616.1f into the prompt under both rankings for a question about two such cards attached together
```

- Verdict:
- Reason:

## REQ-221 — the tester's two questions become gating rule tests

**What this decides:** whether the tester's two questions, asked word for word
with every named card attached, join the rule tests that must pass before any
change ships (`npm run quality:check`), or stay out of the gate.

**In plain terms:** the repo already has a gating test set, the
context-evaluation harness: about thirty saved example questions, each with the
rules that must reach the prompt, checked on every quality check. This adds the
tester's two questions to it. The Manufactor + Esix test passes when the
replacement-effect interaction topic (`REQ-220`) is in the prompt — that topic
carries rules 616.1 and 616.1f. The Necropotence + Silence test passes when
rules 514.2 ("this turn" effects like Silence end in the cleanup step) and
514.3a (a trigger in the cleanup step gives players priority) are in the rules
search's top ten; they are today. If a later change drops either set, the
build fails. Recommended because both pass once `REQ-220` ships, and a gate is
what keeps a fix fixed; the owner asked for these cases to join "a full test of
all use cases". They cannot join the worked-solutions gold set instead:
REQ-185 admits only questions whose answer is official text copied word for
word, and neither has one.

**What happens if you say no:** the two questions are not added to any test
set. `REQ-220`'s result is measured once at build and recorded in its Notes,
but nothing stops a later retrieval change from losing it again.

**Proposed diff** — `PRD/sections/functional-requirements.md`, appended after
`REQ-220`:

```diff
+### REQ-221
+- Title: Reported hard interactions are gating rule-retrieval fixtures
+- Priority: medium
+- Description: Rules questions that real players reported The Judge got wrong are added, word for word and with every named card attached, as labelled fixtures in the context-evaluation harness (REQ-032), so `npm run quality:check` fails if the rules that decide them stop reaching the prompt. Each fixture names the rules it needs by hand-labelled rule or topic id and carries no answer key.
+- Acceptance Criteria:
+  - two fixtures in `apps/backend/src/eval/fixtures/`, both `mode: "lookup"`, cards attached by real oracle id with their committed oracle text, type line, and keywords:
+    - `quick-lookup-replacement-interaction` — question, verbatim: "How do academy manufactor and esix, fractal bloom interact when I'm attempting to create a treasure token?"; cards `Academy Manufactor` and `Esix, Fractal Bloom` (two cards; the comma is part of Esix's name); expects System 2 topics `stack-and-priority`, `targets-basics`, `zones-basics`, `abilities-trigger-basics`, and `replacement-effects-interaction`, which carries rules `616.1` and `616.1f` (REQ-220)
+    - `quick-lookup-cleanup-trigger` — question, verbatim: "Can I use the triggered ability of necropotence during my cleanup step to dodge silence effects and cast borne upon a wind?"; cards `Silence`, `Necropotence`, `Borne Upon a Wind`; expects supplemental rule ids `514.2` and `514.3a` in System 3's top ten
+  - each fixture has committed prompt and context goldens and passes the golden-scenario check in `contextEvaluationHarness.test.ts`, which also runs its labelled checks
+  - `quick-lookup-replacement-interaction` carries the System 2 topic label only (`expectedSystem2TopicIds`), checked in the golden-scenario test; topic selection does not depend on ranking. It carries no System 3 label, because once its topic fires the curated exclusion (REQ-179) bars every 616.1 rule from System 3, so it gets no frozen query embedding and no semantic-path check
+  - `quick-lookup-cleanup-trigger` carries the System 3 label (`expectedSupplementalRuleIds`), so it gets one frozen query embedding (`npm run eval:build-frozen-query-embeddings`) and passes the System 3 checks under both the lexical golden-scenario test and the semantic-path relevance check
+  - each fixture's `description` says in words where the question came from — tester feedback, 2026-10-06, a player's replies in a friend's Magic group chat, relayed to the owner as screenshots — and never names a repo path to intake evidence (the work package holding it is deleted at cleanup)
+- Constraints:
+  - expected rule and topic ids are hand-labelled from the committed Comprehensive Rules text, never copied from scorer output (REQ-032); no fixture or label is added, edited, or removed to make a result pass
+  - no answer key; a reported question enters the answer-quality gold set only through REQ-185's own tiers
+  - offline: no live AI call, no live embedding call at test time
+- Dependencies:
+  - REQ-032 (labelled relevance checks in the gating harness)
+  - REQ-220 (the topic the Manufactor + Esix fixture expects)
+  - REQ-185 (the gold set these stay out of)
+- Notes:
+  - owner direction (2026-10-06): cases attach every named card; a question with the cards only typed is out of focus. The tester's own attachment is unknown and is treated as attached
+  - measured at define with the cards attached: the Necropotence + Silence case already passes (514.2 at System 3 #7, 514.3a at #3 hybrid; #7 and #4 lexical); the AI still answered it wrong, so a pass here says the rules reached the prompt, never that the answer was right
```

`PRD/sections/system-map.md`, `## Eval harness`:

```diff
-- Backed by: DEC-025, DEC-030, DEC-032, DEC-047, REQ-032, NFR-018, REQ-185
+- Backed by: DEC-025, DEC-030, DEC-032, DEC-047, REQ-032, NFR-018, REQ-185, REQ-221
```

- Verdict:
- Reason:

## Blocker questions

None. The one product choice the owner's direction left open — whether the new
cases gate a build — is `REQ-221` above, with a recommendation. No live model
spend is proposed: every retrieval measurement is offline, and answer
correctness belongs to the prompt-format follow-up recorded in the brief.
