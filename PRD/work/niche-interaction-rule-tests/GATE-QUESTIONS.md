# Gate questions — niche-interaction-rule-tests

**Decide:** four items. Answer each verdict slot below (accept, edit, or
reject; a reason is required for edit or reject), then merge the docs PR to
start the build.

- `REQ-220` (new) — the fix: a rules topic that switches on when two or more
  cards replace or prevent, and the size guard on the stored rules topics
  raised to fit it (23 → 24 topics, 22,000 → 26,000 characters).
- `REQ-022` (amended) — the curated rules baseline stops being strictly
  "card-agnostic" to allow that one switch.
- `REQ-222` (amended) — the rules gate counts a rule that reaches the prompt
  through a curated topic, so it can hold this fix and does not fail on the one
  existing rule the fix moves. Recommended; without it `REQ-220` fails the gate.
- `REQ-221` (withdrawn) — the tester's two questions no longer need their own
  test fixtures: both are approved cases in the rules test corpus, which the
  rules gate already runs.

**What this does not fix:** the Necropotence + Silence case in the corpus's
wording still misses rules 514.2 and 514.3a in the rules search (positions #29
and #13; the tester's own wording gets them at #7 and #3). It is recorded as a
follow-up in the brief, not built here.

Full evidence, the baseline across every rule-output suite, every candidate
tried with its measured result, and the rules-gate measurement:
`DESIGN-BRIEF.md` in this folder.

## REQ-220 — the replacement-effect interaction rules reach the AI when two or more cards replace or prevent

**What this decides:** whether The Judge adds the Comprehensive Rules on how
replacement and prevention effects interact to the AI's prompt whenever two or
more cards in the question say "instead" or "prevent", and whether the size
cap on the stored rules topics rises to fit it (24 topics, 26,000
characters).

**In plain terms:** a tester attached Academy Manufactor and Esix, Fractal
Bloom and asked how they combine when he makes a Treasure. Both cards are
replacement effects — effects that swap one event for another, marked by the
word "instead". The rules test corpus holds this question as an approved case
and names the four rules that decide it: 614.1a ("instead" makes it a
replacement effect), 616.1 and 616.1e (the player picks which effect applies
first), and 616.1f (then whatever still applies gets its turn). Today none of
them reaches the AI. With this change, two or more such cards in a Quick Lookup
question, or on the stack or in any zone in an In-Depth game question, switch
on a curated rules topic — "Interaction of Replacement and Prevention Effects",
the full text of rules 614.1a, 616.1, 616.1a through 616.1g, and 616.2 — in
the prompt's `GAME RULES (reference)` section. Measured offline: all four
deciding rules reach the prompt, and every existing rule-output count stays
where it is today. One existing case, Bard, King of Dale with Bilbo, Fellow
Conspirator, now gets rule 616.1f from the topic instead of the rules search;
it is still in the prompt, and the `REQ-222` amendment below is what lets the
rules gate see that.
Search-side alternatives (feeding card text into the rules search, or adding
the term "replacement effect" to it) were measured too. None got the deciding
rules into the top ten under both rankings: adding the term lifted 616.1 to 7th
or 8th under the older word-match ranking only, never under the shipped
ranking, and 616.1f never came closer than 25th. Two of them broke the
Necropotence question and the retrieval benchmark. The rules search itself (System 3 — the scored search that adds up
to ten rule excerpts) is not changed: it still searches the question plus each
card's name, type line, and keywords, never its full text (REQ-178).

The topic's text is the same rules version every other stored rule already
uses, taken from the committed rule index, so nothing else in the stored rules
data changes. Moving to newer rules text is a separate job (the open data
refresh, PR #273; if it merges first, the build re-measures from its text).

This also raises a size guard, which is your call. A test caps the stored
curated rules topics at 23 topics and 22,000 characters in total; today they
total 21,962. The new topic brings the total to 25,808, so the proposal sets
the count to 24 and the cap to 26,000, keeping the 18,000 floor. The cap
covers the stored topic library, not any one prompt: a prompt only carries
the topics picked for it, and this one is picked only when two such cards
are present. 26,000 leaves 192 characters of room, so the next topic
anyone adds needs your sign-off again. If you want a different cap, answer
`edit` with the number.

**What happens if you say no:** retrieval stays as it is. The Manufactor + Esix
question keeps reaching the AI without any of the four rules that decide it.

**Proposed diff** — `PRD/sections/functional-requirements.md`, inserted after
`REQ-219`'s block and before `### REQ-222`, keeping numeric order:

```diff
+### REQ-220
+- Title: Replacement-effect interaction rules when two or more cards replace or prevent
+- Priority: high
+- Description: When two or more cards in a request carry replacement or prevention wording, the assembled prompt's `GAME RULES (reference)` section includes the curated topic `replacement-effects-interaction` — the Comprehensive Rules for how replacement and prevention effects interact (what makes an effect a replacement effect, the affected player choosing the order, the special cases that apply first, and the process repeating until no effect is left to apply). It applies in lookup mode and game mode alike. It is the one System 2 topic selected by card wording rather than game state.
+- Acceptance Criteria:
+  - `apps/backend/data/gameRulesTopicManifest.json` gains topic `replacement-effects-interaction`, titled "Interaction of Replacement and Prevention Effects", with rule numbers `614.1a`, `616.1`, `616.1a`, `616.1b`, `616.1c`, `616.1d`, `616.1e`, `616.1f`, `616.1g`, `616.2`; `gameRulesByTopic.json` gains it as verbatim Comprehensive Rules text taken from the committed rule index (`gameRulesRuleIndex.json`, the same rules text every other shipped game-rules artifact was built from) and extracted the way `scripts/build-game-rules.mjs` extracts every topic; no rules-text refresh: every existing topic entry, `gameRulesRuleIndex.json`, `gameRulesTokenStats.json`, `gameRulesRuleEmbeddings.json`, and `apps/frontend/public/data/gameRulesCoreTopics.json` stay byte-identical
+  - the build-policy test (`apps/frontend/src/lib/gameRulesBuildPolicy.test.ts`) expects 24 curated topics instead of 23 and caps total topic text at 26,000 characters instead of 22,000, keeping its 18,000 floor; measured total with the new topic 25,808 (21,962 before). The cap bounds the stored topic library, not any single prompt
+  - a card carries replacement or prevention wording when its oracle text contains, as a whole word in any letter case, "instead" (CR 614.1a: effects that use the word "instead" are replacement effects) or "prevent", "prevents", or "prevented"; other forms such as "prevention" or "preventing" do not count
+  - the topic is selected when two or more cards in the request carry that wording — in lookup mode the attached cards, in game mode every card on the stack or in any zone; two copies of one card count as two. With fewer than two it is not selected
+  - one shared selection function serves both modes, so lookup and game mode cannot drift apart
+  - in lookup mode the topic is added alongside the four always-on core topics, never in place of them; in game mode it is added alongside the game-state-gated topics
+  - the topic's rule numbers join the curated exclusion set, so System 3 never repeats them (REQ-179)
+  - System 3's search text, scoring, cap, and embeddings are unchanged: the query stays the question plus each card's name, type line, and keywords, never oracle text (REQ-167, REQ-178, REQ-190)
+  - for the approved rules test case `academy-manufactor-esix-treasure` (REQ-185; the tester's question with Academy Manufactor and Esix, Fractal Bloom attached), every deciding rule — `614.1a`, `616.1`, `616.1e`, `616.1f` — reaches the prompt through this topic under both hybrid and lexical ranking, and so does the tester's verbatim question, "How do academy manufactor and esix, fractal bloom interact when I'm attempting to create a treasure token?", with both cards attached
+  - the rules gate's baseline is raised in the same change (`npm run eval:rules-gate:baseline`, without `--allow-regressions`), recording those four rules as carried by a curated topic for `academy-manufactor-esix-treasure` (REQ-222), so the gate fails if they stop reaching the prompt
+  - no existing rule-output result moves from its 2026-10-07 measurement: `npm run eval:worked-solutions` 287 of 392 cases, and 16/18 of the first-ship cases in System 3 under hybrid ranking and 14/18 under lexical; the rules gate passes, with every case's System 3 hits unchanged except `replacement-bard-and-bilbo-tokens`, whose rule `616.1f` moves from a System 3 excerpt into this topic and stays in the prompt; the context-evaluation harness's labelled System 3 checks 14/14 semantic and 14/14 lexical; none of the 31 fixtures' prompt, context, or checklist report goldens changes; the retrieval benchmark's recall@5 stays at 0.5833 clean / 0.5769 polluted lexical and 0.8974 clean / 0.8910 polluted hybrid; the coverage gate passes with `coverage.json` unchanged; the staleness report lists no stale case and no case awaiting a re-freeze
+- Constraints:
+  - card wording selects this one topic only; card names and keywords never select a System 2 topic
+  - no live AI call, no new runtime dependency, no per-request external call
+  - verbatim rules text only; no paraphrase
+- Dependencies:
+  - REQ-022 (the curated baseline this topic joins; amended for the card-wording gate)
+  - REQ-074 (Quick Lookup prompt assembly)
+  - REQ-178 (the shared card signal that keeps lookup and game mode aligned; unchanged)
+  - REQ-179 (prefix-based curated exclusion)
+  - REQ-185 (the approved tester case this fix is measured on)
+  - REQ-222 (the rules gate that holds this result; amended to count rules a curated topic carries)
+- Notes:
+  - measured at define, 2026-10-07 (`niche-interaction-rule-tests`), offline against the committed corpus (the 2026-06-05 rules text) with committed frozen query vectors and the local embedder: before, with both cards attached, none of the case's four deciding rules was in the prompt (all beyond 400th in System 3's hybrid ranking; on the tester's verbatim wording 616.1 ranked 357th hybrid and 50th lexical). After, all four are in the prompt through this topic
+  - candidates measured and rejected: the attached cards' oracle text in the System 3 search (616.1 still out of the top ten; it pushed the Necropotence + Silence question's rule 514.2 out of the prompt; benchmark polluted recall@5 fell from 0.5769 to 0.3782 lexical and from 0.8910 to 0.7756 hybrid; 25 of 31 prompt goldens changed); oracle text in the embedding only (514.2 pushed to 12th; hybrid polluted recall@5 0.8333); the terms "replacement effect" / "prevention effect" added to the search from card wording, card side or question side (616.1 reached 8th and 7th under lexical ranking but only 31st–35th under hybrid, the shipped ranking; 616.1f stayed 25th or worse under both; polluted recall@5 fell); no search-side candidate got the deciding rules into the top ten under both rankings; the topic on any one marked card (fired on Questing Beast's "can't be prevented" alone and changed a prompt golden); the topic without 614.1a (three of the case's four deciding rules)
+  - the full 616.1 family is shipped rather than a minimal subset because rule 616.1 directs the player through "the steps listed in rules 616.1a–f", and listing 616.1 bars System 3 from every 616.1 sub-rule; 614.1a is included because the approved case names it as deciding and System 3 ranks it beyond 400th for this question. The topic adds 3,898 characters to a prompt when it fires (3,837 of rule text plus the title line and line breaks; about 27% on the tester's Manufactor + Esix prompt). 4.8% of cards carry the wording (matched as whole words in any letter case), so two random attached cards both carry it about 0.2% of the time; in the 392 approved rules test cases it fires on 6
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
+zone presence. One topic is gated on card wording instead: when two or more cards —
+attached in a lookup, or on the stack or in any zone in a game — carry replacement or
+prevention wording ("instead", "prevent"), it adds the replacement-effect interaction
+rules (CR 614.1a, 616.1, 616.1a–g, 616.2; REQ-220).
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
+  carries the replacement-effect interaction rules (CR 614.1a, 616.1, 616.1a–g,
+  616.2), so a question about two such cards — Academy Manufactor with Esix,
+  Fractal Bloom, say — gets the rule that the player chooses the order. (DEC-045,
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
+  more cards on the stack or in any zone say "instead" or "prevent" (REQ-220);
+  card names and keywords never select a topic. It is omitted only when the
+  artifact is missing/empty, with a warning logged. (DEC-030, DEC-045, REQ-022,
+  REQ-220)
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
+  - amended by `niche-interaction-rule-tests` (2026-10-07): System 2 is no longer strictly card-agnostic. One topic, the replacement-effect interaction rules, is selected when two or more cards carry replacement or prevention wording (REQ-220), because no change to System 3's search, measured offline, got the rules that decide a question about two such cards attached together (614.1a, 616.1, 616.1e, 616.1f) into the prompt under both rankings
```

- Verdict:
- Reason:

## REQ-222 — the rules gate counts a rule that reaches the prompt through a curated topic (amended)

**What this decides:** whether the rules gate, the offline check in every
`npm run quality:check` that fails when a test case's deciding rule stops
reaching the AI's prompt, also counts a rule that arrives through a curated
rules topic, not only one the rules search picks.

**In plain terms:** the rules gate (REQ-222) runs every case in the rules test
corpus and keeps a baseline of which deciding rules reached the prompt. Today it
counts only the rules search's picks (System 3, up to ten rule excerpts). A
curated topic (System 2, a fixed block of rules switched on by the situation) is
invisible to it, and once a topic carries a rule, the search is barred from
repeating it. Measured with the production prompt code, that causes two
problems for `REQ-220`:

- The fix does not register. With the new topic, all four of the Manufactor +
  Esix case's deciding rules are in the prompt, yet the gate still records zero
  of four. Nothing would stop a later change from losing them.
- The fix fails the build. The topic also fires on an existing case, Bard, King
  of Dale with Bilbo, Fellow Conspirator, and moves its rule 616.1f from the
  search into the topic. The rule is still in the prompt, but the gate reads it
  as lost and fails.

This amendment makes a deciding rule count as reaching the prompt when either
the search picked it or a curated topic selected for that prompt carries it. The
baseline keeps its search hits and misses exactly as today and records
topic-carried rules in a third list, so the answer-quality evidence report that
checks itself against the baseline (REQ-229) is unaffected. Measured over all
392 cases with the new topic: no recorded rule is lost, and 11 cases record a
topic-carried rule (6 already do today, through the always-on topics). The
Manufactor case records all four of its rules there, so the gate holds the fix.
Recommended.

**What happens if you say no:** `REQ-220` fails the rules gate on the Bard +
Bilbo case as built. It could ship only by raising the baseline with
`--allow-regressions`, which records 616.1f as lost although it is in the
prompt, and nothing would hold the Manufactor + Esix fix. If you reject this, I
recommend rejecting or editing `REQ-220` too.

**Proposed diff** — `PRD/sections/functional-requirements.md`, `### REQ-222`:

```diff
-  - **rule check (ratchet)**: a committed baseline file (`apps/backend/src/eval/rules-gate/baseline.json`) records, per case, which of its `decidingRuleIds` were among the System 3 excerpts in the prompt at the production cap (hits) and which were not (misses); the gate fails when a rule recorded as a hit no longer reaches the prompt, naming the case and the rule. Rules that are new hits, and cases not yet in the baseline, are reported and never fail the gate. The baseline is raised only by an explicit command (`npm run eval:rules-gate:baseline`, which refuses while a recorded hit has been lost unless `--allow-regressions` accepts the loss), never automatically, following REQ-177's recorded-baseline gate. At first ship the 18 migrated cases reproduce today's measurement: 16 cases with every deciding rule reaching the prompt, with `panharmonicon-controller-not-entering-permanent` (603.2) and `restoration-angel-blink-resets-counters` (400.7) recorded as misses
+  - **rule check (ratchet)**: a committed baseline file (`apps/backend/src/eval/rules-gate/baseline.json`) records, per case, which of its `decidingRuleIds` were among the System 3 excerpts in the prompt at the production cap (hits) and which were not (misses), and, apart from those, which of them a curated topic selected for that prompt carries (`inTopic`: a deciding rule that is not a System 3 excerpt but is one of the rule numbers of a selected System 2 topic, read from the production enrichment debug block, so its text is in the prompt's `GAME RULES (reference)` section; written only when non-empty). A deciding rule reaches the prompt when it is a System 3 excerpt or carried by a selected curated topic; the gate fails when a rule recorded as a hit or as `inTopic` reaches the prompt by neither route, naming the case and the rule, and a rule that moves from one route to the other is not a loss. Rules that newly reach the prompt by either route, and cases not yet in the baseline, are reported and never fail the gate. The baseline is raised only by an explicit command (`npm run eval:rules-gate:baseline`, which refuses while a recorded hit has been lost unless `--allow-regressions` accepts the loss), never automatically, following REQ-177's recorded-baseline gate. At first ship the 18 migrated cases reproduce today's measurement: 16 cases with every deciding rule reaching the prompt, with `panharmonicon-controller-not-entering-permanent` (603.2) and `restoration-angel-blink-resets-counters` (400.7) recorded as misses
```

```diff
-  - the gate prints a summary: cases checked, cases scored (hit and missed), cases awaiting a re-freeze, cases that regressed, cases that failed, and the new hits to record
+  - the gate prints a summary: cases checked, cases scored (hit and missed), cases with a deciding rule carried by a curated topic, cases awaiting a re-freeze, cases that regressed, cases that failed, and the new hits to record
```

and under `- Dependencies:`, after `  - REQ-181 (the frozen query-vector pattern and the semantic retrieval it reproduces)`:

```diff
+  - REQ-022 (the curated System 2 topics whose listed rules count as reaching the prompt)
```

and as the last bullet of `- Notes:`:

```diff
+  - amended by `niche-interaction-rule-tests` (2026-10-07): the ratchet also counts a deciding rule carried by a selected curated topic, recorded apart as `inTopic`. Measured with production prompt preparation: REQ-220's topic carries all four deciding rules of `academy-manufactor-esix-treasure`, which a System 3-only ratchet records as misses, and it moves rule 616.1f of `replacement-bard-and-bilbo-tokens` from a System 3 excerpt into the topic, which the System 3-only ratchet failed as a lost hit although the rule stays in the prompt. `hit` and `miss` keep their System 3 meaning, so the evidence trace's parity with this baseline (REQ-229) is unchanged. Measured over the 392 approved cases: 6 have a topic-carried deciding rule without REQ-220 (603.2 in five, 400.7 in one), 11 with it, and no recorded hit is lost
```

`PRD/sections/functional-requirements.md`, `### REQ-229`, the first bullet of `- Notes:` (one clause):

```diff
-  - measured 2026-10-07 from the committed `baseline.json` at `3e973ced`: of 392 approved cases, System 3 selects every deciding rule for 287, some for 14, and none for 91. `academy-manufactor-esix-treasure` misses all of 614.1a, 616.1, 616.1e and 616.1f; `necropotence-silence-borne-upon-a-wind-cleanup` selects 514.1 and misses 514.2 and 514.3a. The baseline records System 3 selections only, which is why this trace adds availability
+  - measured 2026-10-07 from the committed `baseline.json` at `3e973ced`: of 392 approved cases, System 3 selects every deciding rule for 287, some for 14, and none for 91. `academy-manufactor-esix-treasure` misses all of 614.1a, 616.1, 616.1e and 616.1f; `necropotence-silence-borne-upon-a-wind-cleanup` selects 514.1 and misses 514.2 and 514.3a. The baseline's hit and miss lists record System 3 selections only, which is why this trace adds availability
```

- Verdict:
- Reason:

## REQ-221 — the tester's two questions as gating fixtures (withdrawn)

**What this decides:** whether to withdraw the earlier proposal that the
tester's two questions become new test fixtures, now that both are already
approved test cases that the build checks.

**In plain terms:** the earlier version of this package proposed REQ-221: add
the tester's two questions, word for word with every card attached, as two new
fixtures in the context-evaluation harness, so `npm run quality:check` fails if
their rules stop reaching the prompt. Since then the rules test harness shipped
(REQ-185, REQ-222). Both questions are now approved cases in its corpus
(`academy-manufactor-esix-treasure` and
`necropotence-silence-borne-upon-a-wind-cleanup`), and the rules gate runs every
approved case on every quality check. Two more fixtures would test the same
questions twice. What REQ-221 was for moves elsewhere: the Manufactor case's
four rules are held by the rules gate once `REQ-220` ships and its baseline is
raised (a `REQ-220` criterion, counted through the `REQ-222` amendment), and the
Necropotence case's rule 514.1 is held today. Withdrawing it means no
`PRD/sections/` edit; the number REQ-221 stays unused. Recommended.

**What happens if you say no:** say which part of the earlier proposal you still
want (for example, separate fixtures in the context-evaluation harness for the
tester's verbatim wording) and the next define pass restores it as REQ-221.

**Proposed diff:** none. No `PRD/sections/` edit. The earlier proposal — a new
`### REQ-221` appended after `REQ-220` in
`PRD/sections/functional-requirements.md`, and `REQ-221` added to the
`- Backed by:` line of `## Eval harness` in `PRD/sections/system-map.md` — is
withdrawn and not applied.

- Verdict:
- Reason:

## Blocker questions

None. The two product choices the harness raised — how the rules gate counts a
rule a curated topic carries, and what happens to REQ-221 — are `REQ-222` and
`REQ-221` above, each with a recommendation. No live model spend is proposed:
every retrieval measurement is offline, and answer correctness belongs to the
prompt-format follow-up recorded in the brief.
