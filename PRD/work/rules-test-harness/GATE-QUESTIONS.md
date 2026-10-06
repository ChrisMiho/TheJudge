# GATE-QUESTIONS — rules-test-harness (run 1)

**What you need to do: Decide.** Answer every `Verdict:` slot below with
`accept`, `edit`, or `reject` (a `Reason:` is required for edit and reject), and
answer the two questions under `## Blocker questions`. Then merge the docs PR.
The merge is the build signal.

This file proposes product truth only. Nothing here is written to
`PRD/sections/` until the build half applies the accepted diffs. Every number
below was measured in this worktree on 2026-10-06; the commands are in
`DESIGN-BRIEF.md`, `## Measurements`.

A few words used throughout:

- **Case** — one rules question with its official answer, stored as one file.
- **Prompt** — the full text the app sends the AI for a player's question:
  the question, the attached cards' text and rulings, and up to ten rule
  excerpts the app picked (System 3, the rule-excerpt retrieval).
- **Deciding rule** — the Comprehensive Rules rule that settles the case.
- **Offline check** — runs on your machine with no AI call and no cost, so it
  can safely run on every pull request inside `npm run quality:check`.
- **Live grading** — asks the real AI the question, then asks a stronger
  judge model whether the answer agrees with the official answer. Costs money.

---

## REQ-185 — the 18-case gold set becomes the rules test corpus

**What this decides:** what a rules test case is, where its answer may come
from, and that no case scores until you approve it.

**In plain terms:** today the app is graded on 18 hard cases, each answered by
official Wizards text: tier 1 is a worked example line from the Comprehensive
Rules, tier 2 is a Wizards card ruling, and nothing else may be an answer
(REQ-185 today says an answer written by a contributor or an agent is never
ground truth). This change turns those 18 into the start of a ~400-case corpus
in a new file format. Tier 1 also accepts a rule's own text verbatim when the
question asks exactly what that rule says. A new tier 3 holds answers you
research and approve where no official text exists; tier 3 is always scored
and reported on its own, never mixed with the official tiers. Every case
attaches every card it names, says whether the interaction works, does not
work, or depends, and carries a review status: an agent may write it as a
`draft`, and only cases you mark `approved` count toward any score. The 18
existing cases keep their question and answer text byte-for-byte and stay
approved, since they already count today.

**What happens if you say no:** the corpus stays at 18 cases in today's format,
with no tier 3 and no review status, and the rest of this proposal has no case
format to build on.

```diff
 ### REQ-185
-- Title: Answer-quality gold set
+- Title: Rules test corpus (answer-quality gold set)
 - Priority: medium
-- Description: The answer-quality baseline (NFR-018) grades model answers against a committed gold set of rules questions that each carry a published, citable, official correct answer. The set is tiered by where that answer comes from, and every tier is official: tier 1 is a Comprehensive Rules worked example (an `Example:` line) verbatim; tier 2 is a WotC card ruling verbatim, paired with a hand-authored, human-reviewed question. The set is seeded by the six worked-solution cases already committed under `apps/backend/src/eval/worked-solutions/`, whose `workedSolution` field is the Comprehensive Rules' own worked example text verbatim (all tier 1), plus twelve hand-picked hard cases from tiers 1 and 2, chosen from topics players commonly get wrong. No case may enter the set with a hand-authored answer key.
+- Description: The answer-quality baseline (NFR-018) and the offline prompt gate (REQ-222) grade the product against one committed corpus of rules test cases, each carrying an approved correct answer. The corpus is tiered by where that answer comes from. Tier 1 is Comprehensive Rules text verbatim — an `Example:` line, or a rule's own text when the question asks exactly what that rule states. Tier 2 is a WotC card ruling verbatim, paired with a hand-authored question. Tier 3 is an answer the owner researched and approved where no official text exists; it is scored and reported apart from tiers 1 and 2 and never pooled with them. The corpus was seeded by the 18 gold cases committed on 2026-09-07 and grows to about 400 cases in run 1 of the rules test harness: at least one case for every real mechanic in the committed rule index (REQ-223) plus about 120 cases in the hard rules areas. No case scores until the owner approves it (REQ-224).
 - Acceptance Criteria:
-  - the gold set contains at least the six `apps/backend/src/eval/worked-solutions/*.case.json` cases at first ship: `delayed-trigger-created-too-late` (603.7a), `illegal-target-partial-resolution` (608.2b), `last-known-information-simultaneous-sba` (704.8), `layers-timestamp-order` (613.9), `replacement-effect-single-application` (614.5), `state-based-actions-mid-resolution` (704.4) — all tier 1 — plus a first-ship seed of twelve additional hard cases: nine tier 1 (`trample-must-assign-lethal-first` 702.19b, `trample-over-planeswalkers-assignment` 702.19c, `combat-damage-assignment-order-multiple-blockers` 510.1c, `mana-ability-remains-mana-ability` 605.2, `regenerate-too-late-after-destroy-resolves` 614.4, `token-created-by-name-uses-oracle-card` 111.11, `copy-does-not-copy-etb-choices` 707.6, `copy-effect-modification-becomes-copiable` 707.9b, `damage-does-not-destroy-sba-does` 120.5) and three tier 2 (`panharmonicon-controller-not-entering-permanent`, `sensei-top-leaves-battlefield-ability-on-stack`, `restoration-angel-blink-resets-counters`), for 18 cases total — each hand-picked from a topic players commonly get wrong, so the first baseline is not six data points; every case records its `tier`
+  - the corpus contains the 18 first-ship cases — the six original worked-solution cases `delayed-trigger-created-too-late` (603.7a), `illegal-target-partial-resolution` (608.2b), `last-known-information-simultaneous-sba` (704.8), `layers-timestamp-order` (613.9), `replacement-effect-single-application` (614.5), `state-based-actions-mid-resolution` (704.4); nine more tier 1 (`trample-must-assign-lethal-first` 702.19b, `trample-over-planeswalkers-assignment` 702.19c, `combat-damage-assignment-order-multiple-blockers` 510.1c, `mana-ability-remains-mana-ability` 605.2, `regenerate-too-late-after-destroy-resolves` 614.4, `token-created-by-name-uses-oracle-card` 111.11, `copy-does-not-copy-etb-choices` 707.6, `copy-effect-modification-becomes-copiable` 707.9b, `damage-does-not-destroy-sba-does` 120.5); and three tier 2 (`panharmonicon-controller-not-entering-permanent`, `sensei-top-leaves-battlefield-ability-on-stack`, `restoration-angel-blink-resets-counters`) — migrated to format version 2 under their existing file names with their `question` and answer text byte-identical to the committed version-1 files, and migrated as `approved` (they already count toward today's baseline)
-  - **tier 1** — the reference answer is a Comprehensive Rules `Example:` line verbatim, cited by rule id, read from the committed flat rule index `apps/backend/data/gameRulesRuleIndex.json` (built by `scripts/build-game-rules.mjs` from the gitignored raw CR download `apps/backend/data/cr/source.txt`, which is never committed — `.gitignore`, `integrations-and-data.md` Game Rules Data Strategy). That committed index carries 277 `Example:` lines across 215 rule entries (measured 2026-09-07) and fifteen are used at first ship, so this is the concrete growth path, and authoring a tier-1 case needs no download and no network call — every tier-1 case cites this file as its `source.committedDataPath`
+  - **tier 1** — the reference answer is Comprehensive Rules text verbatim, read from the committed flat rule index `apps/backend/data/gameRulesRuleIndex.json` (built by `scripts/build-game-rules.mjs` from the gitignored raw CR download `apps/backend/data/cr/source.txt`, which is never committed — `.gitignore`, `integrations-and-data.md` Game Rules Data Strategy), cited by rule id: either an `Example:` line (the index carries 277 across 215 rule entries, measured 2026-10-06) or a rule's own text, used only when the question asks exactly what that rule states. Authoring a tier-1 case needs no download and no network call, and every tier-1 case cites this file as its committed data path
-  - **tier 2** — the reference answer is a WotC card ruling verbatim from `apps/backend/data/cardRulingsByOracleId.json.br` (76,605 rulings over 19,542 cards, measured 2026-09-06), cited by card name, oracle id, and ruling date; the question is hand-authored and reviewed by a human before commit. A tier-2 case tests whether the model honours the ruling the prompt already attaches for that card (`cardRulings.ts`), which is the failure a player actually sees at the table — so the answer-quality run asks a tier-2 case the way a player's lookup asks it, with the cited card attached by oracle id (`scripts/eval-answer-quality.mjs`'s `buildCaseRequest`), and the prompt carries that card's oracle text and published rulings from the committed card-detail and card-rulings indexes; a tier-1 case is asked as the bare question
+  - **tier 2** — the reference answer is a WotC card ruling verbatim from `apps/backend/data/cardRulingsByOracleId.json.br` (78,734 rulings over 19,854 cards, measured 2026-10-06), cited by card name, oracle id, and ruling date; the question is hand-authored. A tier-2 case tests whether the model honours the ruling the prompt already attaches for that card (`cardRulings.ts`), which is the failure a player actually sees at the table
+  - **tier 3** — where no official text answers the question, the reference answer is a ruling the owner researched and approved. An agent may draft a tier-3 answer only as a `draft`: it cites a Comprehensive Rules rule id for every step of its reasoning and lists the research it rests on (links used for discovery, never copied text). A tier-3 answer is never ground truth until the owner approves it, and then only as tier 3. Tier-3 scores are always reported on their own line, never pooled with tiers 1 and 2
+  - **every card attached** — every case lists, in `cards`, each card its question names (oracle id and name), and every run asks the case the way a player's lookup asks it, with all of those cards attached; a case naming no real card (for example a CR worked example about a hypothetical creature) has an empty `cards` list and is asked as the bare question
+  - **format version 2** — a case is valid only when it carries: `id`; `formatVersion` 2; `tier` 1, 2, or 3; `review` (`status` one of `draft`, `approved`, `needs-edit`, `rejected`, plus `reviewedOn` and an optional reviewer note); `cards`; `gameState` (null, or the zones, stack order, and controllers the ruling depends on); a non-empty `question`; `expected` with `outcome` (`works`, `does-not-work`, or `depends`), a one-line `shortAnswer` shown to the reviewer, the reference `answer` (verbatim official text for tiers 1 and 2; the owner-approved ruling for tier 3), and at least one `decidingRuleIds` entry; `source` naming the authority, the citation its tier requires (rule id for tier 1; card name, oracle id, and ruling date for tier 2; a rule id per reasoning step for tier 3), its research links (tier 3 only), and licensing; `layers` with `requiredFacts`, `irrelevantFacts`, and `variants` (defined now, left empty in run 1); `snapshot` with content hashes of the rule text, oracle text, and ruling text the case depends on (REQ-225); and a non-empty `whyHard`. `scripts/lib/gold-cases.mjs` asserts all of these for every case, and every reader — the offline gate (REQ-222), the coverage gate (REQ-223), the review command (REQ-224), `npm run eval:worked-solutions`, and the answer-quality run — reads cases through this one shared loader, so a malformed case fails loudly rather than scoring as a miss
+  - `shortAnswer` and `outcome` are review and reporting aids; the judge is never given them as the reference (REQ-186 grades against `answer` only)
+  - **tags are derived, never hand-written**: `mechanic:` tags come from the 701/702 rule ids in `decidingRuleIds` (a mechanic case always lists that mechanic's own rule), `cr:` tags from every `decidingRuleIds` section, and difficulty from the number of attached cards and distinct rule sections plus flags for layers, replacement effects, and multiplayer
+  - **no duplicates**: the loader rejects two cases with the same set of attached cards and the same answer source; a second case on the same mechanic or rules area must test a different interaction (different cards or a different deciding rule) — a rewording of an existing case is a future `layers.variants` entry, not a new case
+  - **six test layers, three on in run 1**: the format carries hooks for all six layers — 1 input understanding, 2 clarification, 3 structured state, 4 prompt construction, 5 ruling, 6 explanation. Run 1 switches on layer 4 offline (REQ-222) and layers 5 and 6 live and on demand (REQ-186–REQ-188); layer 3 has its field and offline check but is filled only where a ruling depends on it; layers 1 and 2 are schema only until the product has player-wording variants and a clarification behavior
-  - a gold case is valid only when it carries a non-empty `question`, a non-empty `workedSolution` (the reference answer), a `tier` of 1 or 2, a `source` block naming publisher, licensing, and the citation the tier requires (rule id for tier 1; card name, oracle id, and ruling date for tier 2), a non-empty `whyHard`, and at least one `expectedSupplementalRuleIds` entry; `scripts/lib/gold-cases.mjs` asserts all of these for every case and both `npm run eval:worked-solutions` and the answer-quality run read cases through this one shared loader, so a malformed case fails loudly rather than scoring as a miss
   - the ten labelled eval fixtures (`cascade-keyword`, `combat-deathtouch`, `counterspell-stack`, `quick-lookup-card`, `quick-lookup-multi-card`, `quick-lookup-multi-keyword-card`, `quick-lookup-no-card`, `quick-lookup-off-domain`, `state-based-actions`, `upkeep-trigger`) are recorded as **needing an answer key** and are not in the gold set; measured 2026-09-06, every one of them carries only retrieval labels (`expectedSystem2TopicIds`, `expectedSupplementalRuleIds`, `forbiddenSupplementalRuleIds`) and no answer of any kind
-  - the set grows only through tier 1 or tier 2, under the same licensing resolution NFR-018 already required; there is no tier 3. Community sources — "common mistakes" articles, judge blogs, forums — may choose which questions enter and are cited in the case as why it matters, never as its answer. An answer written by a contributor or an agent is never ground truth. Commander Spellbook combos are excluded: they are community-curated, not official, and REQ-146 already inspects real answers on combo scenarios
+  - the corpus grows through tiers 1 and 2 first, under the same licensing resolution NFR-018 already required, and through tier 3 only by owner approval. Community sources — "common mistakes" articles, judge blogs, forums, Stack Exchange — may choose which questions enter and may be listed as tier-3 research, never copied as an answer; no outside-source text is committed in run 1. An answer written by a contributor or an agent is never ground truth unless the owner approves it, and then only as tier 3. Commander Spellbook combos are excluded: they are community-curated, not official, and REQ-146 already inspects real answers on combo scenarios
+  - run 1 of the rules test harness authors, as `draft`: one case for each real mechanic in the committed rule index not already covered (REQ-223), and about 120 hard-area cases — copies, layers, replacement and prevention effects, triggers, combat, state-based actions, double-faced cards, and multiplayer — drawn from unused CR `Example:` lines and from WotC rulings that name a second card, at least a third of them `does-not-work` cases, weighted toward the areas the AI has already been wrong on (replacement-effect ordering, cleanup-step timing, the post-2024 combat damage rule 510.1c, copy effects); plus the two tester cases from the deferred `niche-interaction-rule-tests` package as tier-3 drafts
-  - `apps/backend/src/eval/worked-solutions/README.md` describes both uses of the set — the retrieval check and the answer-quality run — applied in Slice E of the `ai-answer-quality-baseline` package
+  - `apps/backend/src/eval/worked-solutions/README.md` describes the corpus, its three tiers, format version 2, the review flow, and every reader of it, applied in the build half of the `rules-test-harness` package
 - Constraints:
   - the gold cases remain committed evaluation data; they never enter a live prompt, never reach a real player, and add no runtime dependency or external call (NFR-018)
   - the retrieval check `npm run eval:worked-solutions` keeps working unchanged over the same files; the answer-quality run is a second reader of the same data, not a replacement
   - no case is added, edited, or removed to make a score look better
+  - migrating a case to format version 2 never changes its `question` or answer text
+  - the corpus commits only WotC text the project already ships (the committed rulings and Comprehensive Rules) plus owner-approved tier-3 answers; no Stack Exchange, Cranial Insertion, or other outside text
+  - no case is approved by an agent; only the owner's verdict (REQ-224) moves a case to `approved`
 - Dependencies:
   - NFR-018 (the worked-solutions validation track this extends)
   - REQ-186 (the judge that grades against these cases)
   - REQ-032 (the labelled fixtures recorded here as needing an answer key)
+  - REQ-222 (the offline prompt gate that reads the corpus)
+  - REQ-223 (the mechanic coverage gate and report)
+  - REQ-224 (the owner review flow that approves cases)
+  - REQ-225 (the staleness report the `snapshot` hashes feed)
 - Notes:
-  - eighteen cases across two tiers is still a small seed. It is honest signal on hard cases rather than broad signal on easy ones, and the two-tier entry bar above is what keeps it honest as it grows; tier-1 and tier-2 scores are reported with their tier so the two are never pooled without saying so
+  - eighteen cases across two tiers was a small seed: honest signal on hard cases rather than broad signal on easy ones. The tier entry bar above is what keeps the grown corpus honest; tier-1 and tier-2 scores are reported with their tier so the two are never pooled without saying so, and tier-3 scores are never pooled with either
+  - measured 2026-10-06 (define node of the `rules-test-harness` run): the committed rule index holds 258 mechanics (67 keyword actions under 701, 191 keyword abilities under 702, excluding the general rules 701.1 and 702.1); of the 18 cases, only the two trample cases touch a 701/702 rule (702.19); `npm run eval:worked-solutions` with the local embedder reports 16/18 cases whose deciding rule reaches the prompt at cap 10, the misses being `panharmonicon-controller-not-entering-permanent` (603.2) and `restoration-angel-blink-resets-counters` (400.7)
```

- Verdict:
- Reason:

---

## REQ-186 — live grading also catches made-up rule numbers

**What this decides:** two small changes to how a live answer is graded, and
that only approved cases are graded.

**In plain terms:** today every answer is scored by four layers: free
automatic checks, a judge model that compares the answer to the official
answer, a blind side-by-side ranking when several AI models answer the same
question, and your own review of the record (REQ-186). This adds one more free
automatic check: every rule number the answer cites (like "rule 702.19b") must
exist in the app's rule data, so an answer that invents a rule number is
caught at no cost. The side-by-side ranking only runs when two or more models
answer, since ranking one answer against itself means nothing. Only approved,
up-to-date cases are graded, and a tier-3 case is graded against your approved
answer the same way.

**What happens if you say no:** made-up rule numbers are only caught by the
judge or by you reading the record, and a routine one-model run still pays for
a ranking call that ranks a single answer.

```diff
 ### REQ-186
-- Description: Each answer produced by an answer-quality run is scored by four layers in order — deterministic assertions, a reference-grounded model judge that scores each answer alone, a blind side-by-side ranking pass across every answer to the same question, and a human review pass over the written record. The model judge is given the gold case's published worked solution as the reference answer and asked only whether the model's answer agrees with it; it is never asked to rule on Magic rules from its own knowledge. The judge model is stronger than every answer model in the run and is never one of them.
+- Description: Each answer produced by an answer-quality run is scored by four layers in order — deterministic assertions, a reference-grounded model judge that scores each answer alone, a blind side-by-side ranking pass across every answer to the same question when two or more answer models ran, and a human review pass over the written record. The model judge is given the case's approved reference answer (official text for tiers 1 and 2, the owner-approved ruling for tier 3) and asked only whether the model's answer agrees with it; it is never asked to rule on Magic rules from its own knowledge. The judge model is stronger than every answer model in the run and is never one of them.
-  - layer 1, deterministic and free: for each gold case the run records whether the answer names the gold rule id, whether it is non-empty, and its length (`apps/backend/src/eval/answer-quality/assertions.ts`); these need no model call and are computed identically on every run
+  - layer 1, deterministic and free: for each case the run records whether the answer names a deciding rule id, whether it is non-empty, its length, and every Comprehensive Rules rule id the answer cites that does not exist in the committed rule index (`apps/backend/src/eval/answer-quality/assertions.ts`); these need no model call and are computed identically on every run. An unknown rule id is reported as "not in the committed rule index", not as proof of invention, because the committed index can lag the newest Comprehensive Rules (five mechanics in the 2026-08-07 text are not in it, measured 2026-10-06)
-  - layer 2, the lone model judge: one call per answer, carrying the question, the assembled prompt's supplemental rule ids, the model's answer, the case's `workedSolution` as the reference answer, and the rubric (REQ-187); it returns a score per axis plus a one-paragraph rationale (`apps/backend/src/eval/answer-quality/judge.ts`, `judgeAnswerAlone`)
+  - layer 2, the lone model judge: one call per answer, carrying the question, the assembled prompt's supplemental rule ids, the model's answer, the case's `expected.answer` as the reference answer, and the rubric (REQ-187); it returns a score per axis plus a one-paragraph rationale (`apps/backend/src/eval/answer-quality/judge.ts`, `judgeAnswerAlone`)
-  - layer 2b, the blind ranking (`judgeBlindRanking`): for each gold case at each excerpt cap, after every answer has been scored alone, one further judge call sees all answers to that question side by side — model labels hidden (anonymous `Answer A/B/C/...` labels) and presentation order shuffled per case — together with the reference answer and the rubric, and ranks them by agreement with the reference; the harness (never the judge) knows the label-to-model mapping, so the rank is always recoverable per real model id (REQ-189). Side-by-side ranking is more reliable than lone scores and is what makes the model comparison (REQ-188) trustworthy
+  - layer 2b, the blind ranking (`judgeBlindRanking`): when the run's lineup has two or more answer models, for each case at each excerpt cap, after every answer has been scored alone, one further judge call sees all answers to that question side by side — model labels hidden (anonymous `Answer A/B/C/...` labels) and presentation order shuffled per case — together with the reference answer and the rubric, and ranks them by agreement with the reference; the harness (never the judge) knows the label-to-model mapping, so the rank is always recoverable per real model id (REQ-189). A one-model run makes no ranking call and records no rank. Side-by-side ranking is more reliable than lone scores and is what makes the model comparison (REQ-188) trustworthy
+  - only cases whose review status is `approved` and that are not flagged stale (REQ-225) are answered and judged; a tier-3 case is judged exactly like tiers 1 and 2, with its owner-approved answer as the reference
 - Notes:
-  - grounding the judge in the published worked solution is what makes a model judge defensible here. It is only possible because every gold case already carries that text (REQ-185), and it is the reason the gold set may never accept a hand-authored answer key
+  - grounding the judge in an approved reference answer is what makes a model judge defensible here. It is only possible because every case carries that text (REQ-185), and it is the reason no answer an agent writes is ever a reference until the owner approves it as tier 3
```

- Verdict:
- Reason:

---

## REQ-187 — the headline score is reported per tier and over what was actually graded

**What this decides:** how the one headline number is counted once the corpus
is large and runs re-grade only some cases.

**In plain terms:** today the headline is "how many of the 18 cases the AI got
fully right" (Correctness 2 of 2), per model and excerpt setting (REQ-187).
With ~400 cases and runs that re-grade only changed cases, the headline
becomes: for each official tier and for tier 3 separately, how many approved
cases are fully right in their latest graded result, out of how many approved
cases have a graded result — plus how many approved cases have never been
graded, so a partial picture is never shown as the whole.

**What happens if you say no:** the headline keeps counting only the cases in
the latest run, so a run that re-grades five changed cases would report
"5/5" for the whole corpus.

```diff
 ### REQ-187
-- Description: An answer-quality run scores each answer on four axes, each 0–2, against the gold case's published worked solution. Correctness is the run's single headline figure; the other three axes are diagnostic and explain movement rather than defining it.
+- Description: An answer-quality run scores each answer on four axes, each 0–2, against the case's approved reference answer (REQ-185). Correctness is the run's single headline figure; the other three axes are diagnostic and explain movement rather than defining it.
-  - the headline figure a run reports is the count of gold cases scoring Correctness 2, out of the gold-set size, per excerpt-cap leg — for example `4/6 fully correct at cap 5, 3/6 at cap 10` (`apps/backend/src/eval/answer-quality/rubric.ts`, `countFullyCorrect`)
+  - the headline figure is the count of approved cases scoring Correctness 2 in their latest graded record, out of the approved cases that have a graded record, per answer model and excerpt cap, reported separately for tiers 1 and 2 together and for tier 3 — for example `tier 1–2: 231/240 fully correct at cap 10 (12 approved cases ungraded); tier 3: 2/2` (`apps/backend/src/eval/answer-quality/rubric.ts`, `countFullyCorrect`); a tier-3 count is never added to the tier 1–2 count
```

- Verdict:
- Reason:

---

## REQ-188 — live grading picks which cases to re-pay for, and defaults to the deployed setup

**What this decides:** that routine live grading asks only the deployed model
at the deployed setting, and only for the cases whose prompt changed.

**In plain terms:** today a live run asks every case of four AI models at two
excerpt settings, behind a `--confirm-live-calls` flag, and is never part of
any build check (REQ-188). This change keeps the flag, the dry run with a
cost estimate, and the never-a-build-check rule. It adds case selection: only
cases whose prompt changed since their last graded result (or never graded),
or a tag, a tier, a random sample, or everything. By default a run asks only
`gpt-4.1` (the deployed model) at ten rule excerpts (the deployed setting);
the four-model bake-off stays one flag away. The run also records the
judge's own token use and cost, which today's results file leaves out.

**What happens if you say no:** every live run re-asks all ~400 cases on four
models at two settings — about eight answers per case — so a full run costs
several times more than the deployed-model run and nothing lets you re-pay
only for what changed.

```diff
 ### REQ-188
-- Description: The answer-quality baseline is an explicitly invoked command, never scheduled and never wired into any automated gate. It answers every gold case once per model in a configured answer-model lineup and once per excerpt cap, through the production prompt path, so the product's current prompt and retrieval are held fixed while only the model varies. It refuses to contact the provider without an explicit confirmation flag, and records enough run metadata that two runs are comparable, are a deliberate model comparison, or are reported as incomparable.
+- Description: The answer-quality baseline is an explicitly invoked command, never scheduled and never wired into any automated gate. It answers a selected set of approved cases once per model in a configured answer-model lineup and once per excerpt cap, through the production prompt path, so the product's current prompt and retrieval are held fixed while only the model varies. It refuses to contact the provider without an explicit confirmation flag, and records enough run metadata per case that a case's latest graded record is comparable to its earlier ones, is part of a deliberate model comparison, or is reported as incomparable.
-  - the answer models are a lineup, given as a repeatable `--model` option; the first-ship lineup is `gpt-4.1-mini` (the code default and the baseline), `gpt-4.1`, `gpt-5-mini`, and `gpt-5-nano`. Every gold case is answered once per model per excerpt cap (REQ-190) through the same `preparePromptInput` path, so prompt, retrieval, and cap are identical across models. The judge model (REQ-186) is never in the lineup
+  - the answer models are a lineup, given as a repeatable `--model` option; with none given, the lineup is the deployed model alone, `gpt-4.1` (`scripts/aws-deploy.sh` sets `OPENAI_MODEL`), so a routine run grades the setup players actually get. The four-model bake-off (`gpt-4.1-mini`, `gpt-4.1`, `gpt-5-mini`, `gpt-5-nano`) is run by naming those models explicitly. Every selected case is answered once per model per excerpt cap (REQ-190) through the same `preparePromptInput` path, so prompt, retrieval, and cap are identical across models. The judge model (REQ-186) is never in the lineup
+  - **case selection**: the run grades only `approved`, non-stale cases (REQ-225), chosen by exactly one of `--changed` (the default: the case's prompt hash for that model and cap differs from its last graded record, or it has never been graded), `--tag <tag>`, `--tier <1|2|3>`, `--sample <N>` (a seeded random sample, the seed recorded), or `--all`. The dry run prints the selected case count, the reason each was selected, and the estimated cost before any spend
-  - the prompt is the one a player's lookup would get: `preparePromptInput` receives the committed card-detail and card-rulings indexes (the four data files `createConfiguredApp.ts` loads), a tier-2 case's cited card attached (REQ-185), and the question embedded — once per case, from the same retrieval query text the route handler embeds (`buildRetrievalQueryText`), by the provider `EMBEDDING_PROVIDER` names; unset, the run defaults it to `local`, the deployed provider (REQ-184), and an explicit value always wins. Under a real provider the run refuses to continue when the embedder returns no vector or System 3 reports a lexical pass (`assertQueryEmbedded`, `describeRetrieval`), so the `EMBEDDING_PROVIDER` the artifact records is always the provider that actually ranked the excerpts
+  - the prompt is the one a player's lookup would get: `preparePromptInput` receives the committed card-detail and card-rulings indexes (the four data files `createConfiguredApp.ts` loads), every card in the case's `cards` attached by oracle id (REQ-185), and the question embedded — once per case, from the same retrieval query text the route handler embeds (`buildRetrievalQueryText`), by the provider `EMBEDDING_PROVIDER` names; unset, the run defaults it to `local`, the deployed provider (REQ-184), and an explicit value always wins. Under a real provider the run refuses to continue when the embedder returns no vector or System 3 reports a lexical pass (`assertQueryEmbedded`, `describeRetrieval`), so the `EMBEDDING_PROVIDER` the artifact records is always the provider that actually ranked the excerpts
-  - it is never added to `npm run quality:check`, `npm test`, `npm run test:eval`, `npm run coverage:check`, or `npm run test:scripts`, and never asserted against a golden; a regression-guard test (added in Slice E) asserts the command appears in none of those scripts
+  - it is never added to `npm run quality:check`, `npm test`, `npm run test:eval`, `npm run coverage:check`, or `npm run test:scripts`, and never asserted against a golden; a regression-guard test asserts the command appears in none of those scripts. The offline prompt gate (REQ-222) and coverage gate (REQ-223) do run in `quality:check`; they make no provider call and check the prompt, never an answer
-  - every run records, in the artifact (REQ-189): gold-set case ids, tiers, and count, the answer-model lineup, judge model id, rubric revision, `ASK_AI_PROVIDER`, `EMBEDDING_PROVIDER`, model and excerpt cap per leg, git commit, UTC timestamp, per-call prompt characters, per-call input and output token usage, per-call wall-clock latency, and the run's total token usage and cost
+  - every run records, in the artifact (REQ-189): the selected case ids with tier and review status, the selection mode, the answer-model lineup, judge model id, rubric revision, `ASK_AI_PROVIDER`, `EMBEDDING_PROVIDER`, model and excerpt cap per leg, git commit, UTC timestamp, per-call prompt characters and prompt hash, per-call input and output token usage for the answer call and for each judge call, per-call wall-clock latency, and the run's total token usage and cost with answer and judge shown separately
-  - the run tooling reports two runs as **incomparable** when their gold set, judge model, rubric revision, or `EMBEDDING_PROVIDER` differ, rather than presenting a misleading delta. Two runs whose answer-model lineups differ are reported as a **model comparison** — the shared models compared, the unshared ones listed — never as incomparable, because a deliberate bake-off is this instrument's first intended use
+  - the run tooling compares graded records **per case**: a case's latest record is **incomparable** with its earlier one when its reference answer, judge model, rubric revision, or `EMBEDDING_PROVIDER` differ, rather than presenting a misleading delta. Two runs whose answer-model lineups differ are reported as a **model comparison** — the shared models compared, the unshared ones listed — never as incomparable
 - Notes:
+  - measured 2026-10-06 from the committed `results.json` (run 3, `gitCommit b3f860f`): `gpt-4.1` at cap 10 used 57,327 input and 7,614 output tokens over 18 answers, about $0.0098 per answer at $2.00/$8.00 per million tokens. That file's `totalCostUsd` of $0.6275 equals the answer calls alone — the judge's tokens and cost were never recorded — so the "$0.67 / $0.69 / $0.63 actual" figures above cover answers only. Using the run's own judge assumptions (1,500 input and 800 output tokens per lone judge call at gpt-5's $1.25/$10.00), a routine one-model case costs about $0.02 and a full ~400-case routine run about $8. This is an estimate; the first live run that records judge usage replaces it
```

Also edits `PRD/sections/system-map.md` (the answer-quality entry):

```diff
 ### Answer-quality baseline
 
 - Status: shipped
-- Summary: On-demand, confirmation-gated run that asks each model in a configured lineup every gold case and scores the returned answer against that case's published solution — deterministic assertions, a reference-grounded judge model stronger than every contestant, scoring alone and ranking blind side by side over four 0–2 axes, then a human review pass. Never in `quality:check`, never asserted against a golden, never a build gate. Answers each case once per System 3 excerpt cap so the deployed ten-excerpt limit can be compared against a larger one on the same questions; production is ten, and the run's default legs are ten and fifteen. Writes a small committed scores file and gitignored transcripts.
+- Summary: On-demand, confirmation-gated run that asks the selected approved cases of the rules test corpus — by default the cases whose prompt changed since they were last graded, answered by the deployed model at the deployed ten-excerpt cap — and scores each answer against that case's approved reference answer: deterministic assertions (including rule ids the answer cites that are not in the committed rule index), a reference-grounded judge model stronger than every contestant, a blind side-by-side ranking when two or more models answer, over four 0–2 axes, then a human review pass. The four-model bake-off and other excerpt caps are explicit options. Never in `quality:check`, never asserted against a golden, never a build gate. Writes a small committed scores file merged per case and gitignored transcripts; tier-3 scores are always reported apart from the official tiers.
 - Lives in: `apps/backend/src/eval/worked-solutions/`, `apps/backend/src/eval/answer-quality/`, `scripts/eval-answer-quality.mjs`
 - Backed by: NFR-018, REQ-185, REQ-186, REQ-187, REQ-188, REQ-189, REQ-190
```

- Verdict:
- Reason:

---

## REQ-189 — the scores file keeps each case's latest graded result

**What this decides:** how the committed scores file changes once runs grade
only some cases, and that a counts-only coverage file sits beside it.

**In plain terms:** today the committed scores file holds numbers only, never
AI prose, and each run replaces it whole (REQ-189). With partial runs,
replacing it whole would erase every case the run did not touch. This change
makes a run update only the cases it graded, and stamps each case's record
with its own date, commit, and a fingerprint of the exact prompt it was asked
(the "prompt hash"), which is how the next run knows whether that case
changed. A second small counts-only file records corpus coverage (REQ-223).
Still no AI prose in either file.

**What happens if you say no:** each partial run overwrites the whole scores
file, so the "re-pay only for changed cases" plan in REQ-188 cannot work.

```diff
 ### REQ-189
-- Description: An answer-quality run writes a small committed machine-readable scores file and a gitignored human-readable transcript set. The committed file carries scores and run metadata only — no model prose — so two runs diff cleanly and no run output can become a brittle golden.
+- Description: An answer-quality run writes a small committed machine-readable scores file and a gitignored human-readable transcript set. The committed file carries scores and run metadata only — no model prose — and keeps each case's latest graded record per leg, so two runs diff cleanly, a partial run never erases a case it did not grade, and no run output can become a brittle golden. A second counts-only committed file records corpus coverage (REQ-223).
-  - it carries: the run metadata REQ-188 requires (gold-set case ids, tier-1/tier-2 counts, the answer-model lineup, judge model id, whether the judge matches an answer model, rubric revision, `ASK_AI_PROVIDER`, `EMBEDDING_PROVIDER`, git commit, UTC timestamp, total input/output token usage, total cost); per leg — a leg is one answer model at one excerpt cap — the model id, the excerpt cap, the case count, and the headline count of cases scoring Correctness 2; per case per leg, the four axis scores (or an `undetermined` flag in place of them), the `namesGoldRuleId` assertion, `goldRuleInPrompt` (whether one of the case's expected rule ids was among the System 3 excerpts the prompt carried, read from the production enrichment debug block — the retrieval half of a miss, separated from the answer half), prompt characters, input/output token usage, wall-clock latency in milliseconds, and the blind rank from REQ-186's side-by-side pass
+  - it carries: run-level metadata for the latest run (selection mode, the answer-model lineup, judge model id, whether the judge matches an answer model, rubric revision, `ASK_AI_PROVIDER`, `EMBEDDING_PROVIDER`, git commit, UTC timestamp, total input/output token usage and total cost with answer and judge shown separately); per leg — a leg is one answer model at one excerpt cap — the model id, the excerpt cap, the approved-case count, the graded-case count, and the headline counts REQ-187 defines; per case per leg, the case's tier, the four axis scores (or an `undetermined` flag in place of them), the `namesGoldRuleId` assertion, the list of cited rule ids not in the committed rule index (REQ-186), `goldRuleInPrompt` (whether one of the case's deciding rule ids was among the System 3 excerpts the prompt carried, read from the production enrichment debug block — the retrieval half of a miss, separated from the answer half), prompt characters, the prompt hash (SHA-256 of the assembled prompt text), the hash of the reference answer it was judged against, answer and judge input/output token usage, wall-clock latency in milliseconds, the blind rank when REQ-186's side-by-side pass ran, and the record's own UTC timestamp and git commit
-  - the committed results file is replaced, not appended, by each recorded run (`writeResultsFile` overwrites); run-to-run history is the file's git history, so a comparison of two runs is a git diff
+  - a recorded run **merges** into the committed results file: each graded case's record for that leg replaces its previous record, every other case's record is kept unchanged, and the run-level metadata describes the latest run. A case removed from the corpus or no longer `approved` is dropped from the file on the next recorded run. Run-to-run history is the file's git history, so a comparison of two runs is a git diff
-  - the run tooling reports two runs (`compareRuns`) as **incomparable** when their gold set, judge model, rubric revision, or `EMBEDDING_PROVIDER` differ, and as a **model comparison** (shared models compared, unshared ones listed) — never incomparable — when only the answer-model lineup differs
+  - the run tooling compares records (`compareRuns`) per case: **incomparable** when the reference-answer hash, judge model, rubric revision, or `EMBEDDING_PROVIDER` differ, and a **model comparison** (shared models compared, unshared ones listed) — never incomparable — when only the answer-model lineup differs
+  - a counts-only coverage file sits beside it (`apps/backend/src/eval/answer-quality/coverage.json`), written by the coverage command (REQ-223): mechanics by approved / draft / none, case counts per Comprehensive Rules section, and case counts per tier and review status — numbers and ids only, no prose
```

- Verdict:
- Reason:

---

## REQ-190 — a live run defaults to the deployed excerpt cap only

**What this decides:** whether a routine live run also answers every case at a
larger excerpt cap.

**In plain terms:** the excerpt cap is how many rule excerpts the app adds to
the prompt; production uses ten. Today a live run answers every case at ten
and at fifteen by default, to keep testing whether more excerpts help
(REQ-190). This change makes ten the only default, so a routine run pays for
one answer per case. Comparing caps stays available by naming them.

**What happens if you say no:** every routine live run pays for two answers
per case, one at a cap production does not use.

```diff
 ### REQ-190
-  - the run accepts a repeatable `--excerpt-cap` option, defaulting to `[10, 15]` — the deployed cap plus the next value up, so the run always compares production against a larger candidate; each cap value is one leg per answer model, and every gold case is answered once per model per cap in the same run
+  - the run accepts a repeatable `--excerpt-cap` option, defaulting to `[10]` — the deployed cap — so a routine run grades only what production does; a cap comparison such as `--excerpt-cap 10 --excerpt-cap 15` is an explicit choice. Each cap value is one leg per answer model, and every selected case is answered once per model per cap in the same run
```

- Verdict:
- Reason:

---

## NFR-018 — the prompt checks may block a pull request; answer grading never does

**What this decides:** whether the free, offline checks over the rules test
corpus may fail a pull request.

**In plain terms:** today the worked-solutions track is a report, not a build
check (NFR-018). You said: "im cool with validation tests catching when cards
arent being attached or context is missed, but i cant afford to test against
the live backend every time." This change splits the track. The prompt half —
did every attached card reach the AI, did a deciding rule that used to reach
the AI stop reaching it, does every real mechanic have a case — runs offline
inside `npm run quality:check` and can fail a pull request (REQ-222,
REQ-223). The answer half stays on demand, behind its confirmation flag, and
never fails a build. It also records that tier-3 answers you approve are
allowed.

**What happens if you say no:** the prompt checks stay reports you must run
by hand, so a dropped card or a lost rule can merge unnoticed.

```diff
 ### NFR-018
-- Description: Today prompt and retrieval quality is regression-tested by golden fixtures and the eval harness against labeled expected outcomes (REQ-032 / DEC-047). This adds a validation track fed by real-world hard rules questions that carry published worked solutions — the kind found in public rules-Q&A and judge resources — so the prompt can be checked and tuned against how hard cases actually resolve, not only against hand-authored fixtures. The worked solutions are curated into a committed evaluation set and run through the existing eval harness; they are test data, never runtime retrieval. The same committed set is read a second way by the answer-quality baseline (REQ-185 through REQ-190), which asks the live provider each case and scores the returned answer against that case's published worked solution — so this track now measures both halves: whether the right rule reached the prompt, and whether the answer built from it is correct.
+- Description: Today prompt and retrieval quality is regression-tested by golden fixtures and the eval harness against labeled expected outcomes (REQ-032 / DEC-047). This adds a validation track fed by hard rules questions that carry an approved correct answer — official Comprehensive Rules or WotC ruling text wherever it exists, an owner-approved answer otherwise — so the prompt can be checked and tuned against how hard cases actually resolve, not only against hand-authored fixtures. The cases are curated into one committed rules test corpus (REQ-185); they are test data, never runtime retrieval. The corpus is read two ways: an offline prompt gate (REQ-222, REQ-223) that checks whether every attached card and the deciding rule reached the prompt and whether every real mechanic has a case, and the answer-quality baseline (REQ-185 through REQ-190), which asks the live provider each case and scores the returned answer against that case's approved answer — so this track measures both halves: whether the right material reached the prompt, and whether the answer built from it is correct.
 - Constraints:
   - The worked-solutions set is committed evaluation data (fixtures) fed through the existing eval harness (REQ-032 / DEC-047); it never becomes runtime prompt context and adds no new runtime dependency or external call.
   - Specific sources and their licensing/attribution are resolved at implementation before any data is committed; only data licensed for this use is committed.
-  - This is a quality/validation track that reports where the prompt fails hard cases and guides tuning; it is not a build-blocking gate unless the owner later promotes it (mirroring DEC-161's opt-in, non-gating stance on enrichment A/B). This applies unchanged to the answer half: an answer score is never asserted against a golden and never fails a build (REQ-188).
+  - The prompt half is a build-blocking gate: the offline prompt gate (REQ-222) and the mechanic coverage gate (REQ-223) run in `npm run quality:check` and fail a pull request on a dropped card, a deciding rule that used to reach the prompt and no longer does, a case without a frozen query vector, or a real mechanic with no case. The answer half is not a build-blocking gate unless the owner later promotes it (mirroring DEC-161's opt-in, non-gating stance on enrichment A/B): an answer score is never asserted against a golden and never fails a build (REQ-188).
-  - The retrieval half stays offline and makes no provider call. The answer half necessarily makes live provider calls, and is therefore explicitly invoked, confirmation-gated, and never scheduled or wired into any automated gate (REQ-188); the mock-first default is preserved, so a checkout with no key and no network still runs the retrieval half and the answer half's dry plan.
+  - The prompt half stays offline and makes no provider call and no live embedding call — it ranks with committed frozen query vectors. The answer half necessarily makes live provider calls, and is therefore explicitly invoked, confirmation-gated, and never scheduled or wired into any automated gate (REQ-188); the mock-first default is preserved, so a checkout with no key and no network still runs the prompt half and the answer half's dry plan.
-  - A case enters the set only with a published, citable correct answer; a hand-authored answer key is never ground truth (REQ-185).
+  - A case enters the corpus only with an approved correct answer: official text verbatim for tiers 1 and 2, or an owner-approved ruling for tier 3, reported apart from the official tiers; an answer an agent or contributor writes is never ground truth unless the owner approves it as tier 3 (REQ-185).
 - Dependencies:
   - REQ-032, DEC-047 (eval harness and labeled-outcome evaluation)
   - REQ-022, DEC-046 (retrieval the validation set exercises)
-  - REQ-185 (the gold set this track's cases now serve as)
+  - REQ-185 (the rules test corpus this track's cases now serve as)
   - REQ-186, REQ-187, REQ-188, REQ-189, REQ-190 (the answer-quality baseline built on that set)
+  - REQ-222, REQ-223, REQ-224, REQ-225 (the offline prompt gate, the coverage gate, the owner review flow, and the staleness report over that corpus)
```

Also edits `PRD/sections/goals-and-non-goals.md` (Non-Goals):

```diff
-- automated answer-quality gating in `npm run quality:check`: combo enrichment's effect on answers is measured by an opt-in, human-reviewed live-provider A/B that never blocks a build (DEC-161), and the answer-quality baseline over the committed worked-solution gold cases is the same shape — explicitly invoked, confirmation-gated, human-reviewed, never scheduled, never asserted against a golden, and never able to fail a build (NFR-018, REQ-185, REQ-188)
+- automated answer-quality gating in `npm run quality:check`: combo enrichment's effect on answers is measured by an opt-in, human-reviewed live-provider A/B that never blocks a build (DEC-161), and the answer-quality baseline over the committed rules test corpus is the same shape — explicitly invoked, confirmation-gated, human-reviewed, never scheduled, never asserted against a golden, and never able to fail a build (NFR-018, REQ-185, REQ-188). The offline prompt checks over the same corpus (REQ-222, REQ-223) do gate; they check what reaches the prompt, never the answer
```

- Verdict:
- Reason:

---

## REQ-222 — new: an offline check that every attached card and deciding rule reaches the AI

**What this decides:** that every pull request checks, for free, that the AI
still receives what each test case needs.

**In plain terms:** for every case that is not rejected, the check builds the
exact prompt the app would send for that question and confirms three things.
First, every attached card's text and every one of its Wizards rulings is in
the prompt — always, with no exceptions. Second, the deciding rule reaches the
prompt as often as it did before: the check keeps a recorded list of which
cases currently get their deciding rule in, and fails only when a case that
used to get it in no longer does. New successes are reported, and the list is
raised only by a deliberate command. This "ratchet" is how the existing
retrieval benchmark gate works (REQ-177), and it is needed because today only
16 of the 18 cases get their deciding rule in. Third, where a case describes
the game state, those facts appear in the prompt. To make the rule check free
and repeatable, each case's question is turned into its search vector once,
with the same local model production uses, and that vector is committed —
the same "frozen vector" trick the eval harness already uses (REQ-181).

**What happens if you say no:** nothing automatically notices when a player's
attached card or a needed rule stops reaching the AI; you find out from wrong
answers.

```diff
+### REQ-222
+- Title: Offline prompt gate over the rules test corpus
+- Priority: high
+- Description: Every pull request checks, with no provider call and no live embedding call, that the prompt the product would build for each rules test case (REQ-185) carries what that case needs: every attached card's oracle text and WotC rulings, the deciding rule as often as it did before, and any game-state facts the case depends on. It is test layer 4, prompt construction. It runs in `npm run quality:check`.
+- Acceptance Criteria:
+  - for every case whose review status is not `rejected`, the gate builds the request a player's lookup would send — every card in the case's `cards` attached by oracle id, the committed card-detail and card-rulings indexes supplied, and `gameState` mapped onto the In-Depth request where it is set — and runs it through the unmodified production `preparePromptInput`
+  - **card check (absolute)**: for every attached card, the assembled prompt contains that card's oracle text and every WotC ruling the committed rulings index holds for it; any miss fails the gate, naming the case and the card. Measured 2026-10-06, no card in the committed rulings index exceeds the prompt's ruling limits (the most rulings on one card is 32 against a per-card limit of 100; the largest single card's rulings section is 8,937 characters against a section limit of 1,000,000), so this check passes for any card in today's data
+  - **rule check (ratchet)**: a committed baseline file records, per case, whether at least one of its `decidingRuleIds` was among the System 3 excerpts in the prompt at the production cap; the gate fails when a case recorded as a hit is now a miss, naming each such case. Cases that are new hits, and cases not yet in the baseline, are reported and never fail the gate. The baseline is raised only by an explicit command, never automatically, following REQ-177's recorded-baseline gate. At first ship the 18 migrated cases reproduce today's measurement: 16 hits, with `panharmonicon-controller-not-entering-permanent` (603.2) and `restoration-angel-blink-resets-counters` (400.7) recorded as misses
+  - **frozen query vectors**: the System 3 ranking uses one committed query vector per case, embedded once from the exact retrieval query text production builds (`buildRetrievalQueryText`) by the shipped local embedder, following the frozen-vector fixture REQ-181 established (`npm run eval:build-frozen-query-embeddings`); a command (re)builds them and refuses to write a vector when the local model is unavailable. A non-rejected case with no frozen vector fails the gate. A case whose query text no longer matches the text its vector was built from — for example after a card-data refresh changes a card's keywords — is reported as needing a re-freeze and listed by the staleness report (REQ-225), and is not scored by the ratchet until re-frozen, so a weekly `data:refresh-pr` is never blocked by it
+  - **state-fact check (layer 3)**: for every case with a non-null `gameState`, each zone, stack position, and controller fact it states appears in the assembled prompt; a miss fails the gate
+  - the gate prints a summary: cases checked, card-check passes, rule-check hits / misses / new hits / awaiting re-freeze, and state-fact passes
+- Constraints:
+  - no provider call, no live embedding call, no network call; deterministic run to run
+  - no change to `preparePromptInput`, System 3 query construction, scoring, the excerpt cap, or any prompt text; the gate observes the production prompt, it does not alter it
+  - eval data never enters a live prompt (NFR-018); the frozen vectors and the baseline are evaluation data only
+  - the existing suites keep working unchanged: the 31 context-eval golden fixtures, the labelled System 3 checks, the 156-pair retrieval benchmark (REQ-177), and `npm run eval:worked-solutions`
+  - the rule index is not rebuilt; the five mechanics in the 2026-08-07 Comprehensive Rules that the committed index lacks (701.69 Heal, 701.70 Recruit, 702.193 Power-up, 702.194 Teamwork, 702.195 Storied) cannot reach any prompt and are a recorded finding, not a gate failure
+- Dependencies:
+  - REQ-185 (the corpus it reads)
+  - REQ-177 (the recorded-baseline gate pattern)
+  - REQ-181 (the frozen query-vector pattern and the semantic retrieval it reproduces)
+  - REQ-225 (the staleness report that lists cases awaiting re-freeze)
+  - NFR-018 (the track whose prompt half this makes gating)
+- Notes:
+  - measured 2026-10-06: `npm run eval:worked-solutions` reports 16/18 hits with the local embedder (all 18 ranked semantically) and 14/18 with `EMBEDDING_PROVIDER=mock`; the gate must therefore rank semantically from frozen vectors, since a lexical pass would record a different baseline from what production does. The whole 18-case lexical check ran in 0.68 s wall time including data load. The existing frozen-vector fixture holds 9 vectors in 81,915 bytes (about 9.1 KB per 384-dimension vector as JSON), so about 400 cases would add roughly 3.6 MB in the same encoding
```

Also edits `PRD/sections/system-map.md` (`## Eval harness`):

```diff
 ## Eval harness
 
 - Status: shipped
-- Summary: Context-evaluation harness with fixtures, golden comparisons, labeled retrieval-relevance checks over prompt assembly and retrieval, and an on-demand answer-quality baseline that scores the model's final answer against published worked solutions.
+- Summary: Context-evaluation harness with fixtures, golden comparisons, labeled retrieval-relevance checks over prompt assembly and retrieval, an offline gate over the rules test corpus that checks every attached card and deciding rule reaches the prompt and every real mechanic has a case, and an on-demand answer-quality baseline that scores the model's final answer against each case's approved answer.
 - Lives in: `apps/backend/src/eval/`
-- Backed by: DEC-025, DEC-030, DEC-032, DEC-047, REQ-032, NFR-018, REQ-185
+- Backed by: DEC-025, DEC-030, DEC-032, DEC-047, REQ-032, NFR-018, REQ-185, REQ-222, REQ-223, REQ-224, REQ-225
```

and adds a new entry after `### Answer-quality baseline`:

```diff
+### Rules test corpus gates and review
+
+- Status: shipped
+- Summary: Offline checks over the rules test corpus that run in `quality:check` with no provider or live embedding call: every attached card's oracle text and rulings reach the prompt (absolute), each case's deciding rule reaches it at least as often as the recorded baseline (ratchet, frozen query vectors), stated game-state facts reach it, and every real mechanic in the committed rule index has a case. Also the owner review command that turns `draft` cases into `approved` ones, the coverage report, and the staleness report that flags cases whose rule, oracle, or ruling text changed.
+- Lives in: `apps/backend/src/eval/worked-solutions/`, `scripts/lib/gold-cases.mjs`, the gate, review, coverage, and staleness commands under `scripts/`
+- Backed by: REQ-185, REQ-222, REQ-223, REQ-224, REQ-225, NFR-018
```

- Verdict:
- Reason:

---

## REQ-223 — new: every real mechanic has a case, and a coverage report shows where

**What this decides:** that the corpus must hold at least one case for every
real mechanic, which mechanics count as "real", and how you see coverage.

**In plain terms:** you decided every real Magic mechanic gets at least one
case, and joke-only mechanics are excluded and listed as excluded. The app's
rule data (the committed rule index) lists 258 mechanics today: 67 keyword
actions like Sacrifice and 191 keyword abilities like Trample. This check
reads that list straight from the rule data, so a mechanic added by a future
rules refresh is picked up automatically, and fails a pull request when a
mechanic that is not on the committed excluded list has no case (draft or
approved; a rejected case does not count). A coverage report shows, for every
mechanic, whether it has an approved case, only a draft, or none, plus counts
per rules section and per tier. Which mechanics are joke-only is your call:
see Q-007 below.

**What happens if you say no:** nothing stops a mechanic from silently having
no case, and coverage is only known by counting files by hand.

```diff
+### REQ-223
+- Title: Mechanic coverage gate and coverage report for the rules test corpus
+- Priority: high
+- Description: Every real mechanic in the committed rule index has at least one rules test case (REQ-185). The mechanic list is read from `apps/backend/data/gameRulesRuleIndex.json`, never hand-maintained, so a mechanic first appears when the rules data is deliberately refreshed. Joke-only mechanics are excluded through a committed list that names each and why. A coverage command reports where the corpus stands.
+- Acceptance Criteria:
+  - the mechanic list is every distinct `701.N` and `702.N` rule number in the committed rule index other than the general rules 701.1 and 702.1; measured 2026-10-06 that is 258 mechanics (67 keyword actions, 191 keyword abilities), numbered 701.2–701.68 and 702.2–702.192 with no gaps
+  - a committed excluded list names each joke-only mechanic by rule number and name with a one-line reason; at first ship it holds exactly the mechanics the owner confirms at the define gate (Q-007)
+  - a case covers a mechanic when one of its `decidingRuleIds` is that mechanic's rule or one of its subrules (REQ-185's derived `mechanic:` tag)
+  - the gate fails, in `npm run quality:check`, when a listed mechanic not on the excluded list has no case whose review status is `draft`, `approved`, or `needs-edit`, naming each uncovered mechanic; it also fails when the excluded list names a rule number the index does not contain
+  - a coverage command prints mechanic × {approved, draft, none}, case counts per Comprehensive Rules section, and case counts per tier and review status, and rewrites the counts-only coverage file (REQ-189); the gate fails when the committed coverage file is out of date with the corpus
+  - no provider call, no network call, no live embedding call
+- Constraints:
+  - the gate reads the committed rule index only, never the gitignored raw CR text, and never triggers a rule-index rebuild
+  - adding a mechanic to the excluded list is an owner decision recorded in that file, never a way to make the gate pass
+- Dependencies:
+  - REQ-185 (the corpus and its derived tags)
+  - REQ-189 (the coverage file location)
+  - REQ-224 (the review statuses it counts)
+- Notes:
+  - measured 2026-10-06: 226 of the 258 mechanics have a WotC ruling on a card whose Scryfall keywords carry the mechanic; 30 more (the basic actions such as Destroy, Sacrifice, and Cast, which Scryfall's keyword field omits, plus Provoke, Ripple, Absorb, Frenzy, Poisonous, Harness, and others) have a ruling on a card whose oracle text names the mechanic, though whether that ruling is about the mechanic must be checked case by case; two (701.32 Set in Motion, 702.59 Recover) have neither and no `Example:` line, so their tier-1 answer is the rule's own text. Only 20 mechanics have an `Example:` line. The 18 migrated cases cover one mechanic (702.19 Trample)
+  - measured 2026-10-06: the five mechanics in the local 2026-08-07 Comprehensive Rules that the committed index lacks (Heal, Recruit, Power-up, Teamwork, Storied) appear on 106 committed cards (33, 10, 37, 17, 9), so a player can attach those cards today while the rule text is missing from every prompt — a finding for the deferred rules-data refresh, not part of this gate
```

- Verdict:
- Reason:

---

## REQ-224 — new: you review every case, in batches, on your own schedule

**What this decides:** how a drafted case becomes an approved one.

**In plain terms:** you decided no case counts toward a score until you
approve it. The build writes every new case as a `draft` and ships a review
command. The command shows pending cases in batches grouped by mechanic: the
question, each attached card's text, the official answer word for word, and
where it comes from. You mark each one approve, reject, or edit (with a note),
and a second command writes your verdicts back into the case files. An edit
sends the case back for rework; it returns as a draft. The build does not wait
for your review — review happens after merge, whenever you choose.

**What happens if you say no:** there is no way to approve a case except
hand-editing its file, and nothing records who approved what and when.

```diff
+### REQ-224
+- Title: Owner review flow for rules test cases
+- Priority: high
+- Description: Every rules test case (REQ-185) is written as `draft` and counts toward no score until the owner approves it. A review command renders pending cases for the owner in batches; a second step writes the owner's verdicts back into the case files. Review happens after merge on the owner's schedule; no build waits on it.
+- Acceptance Criteria:
+  - a review command renders every case whose status is `draft` (and, on request, `needs-edit`), grouped by mechanic and then by rules section, in batches of a size the owner chooses, to a gitignored file under `output/`; each entry shows the case id, tier, question, every attached card's name and oracle text, the reference answer verbatim, the `shortAnswer`, the `outcome`, the deciding rule ids, the citation, and for tier 3 the research list
+  - each rendered batch carries a verdict slot per case (`approve`, `reject`, or `edit` with a required note); an apply command reads a filled batch and writes `review.status` (`approved`, `rejected`, or `needs-edit`), `review.reviewedOn`, and the note into each case file, changing no other field
+  - the apply command refuses a verdict for a case id it cannot find, a case whose question or reference answer changed since the batch was rendered, or an `edit` with no note, and reports each refusal
+  - an `edit` verdict never changes a tier-1 or tier-2 reference answer to non-official text: the rework may change the question, the attached cards, or choose a different official source, and the case returns to `draft`
+  - no agent sets `approved`; only the apply command, run on an owner-filled batch, does
+  - the review and apply commands make no provider call and no network call
+- Constraints:
+  - the build half never parks waiting for review
+  - rejected cases stay in the corpus with status `rejected` (so dedup still sees them) and are excluded from every gate and score
+- Dependencies:
+  - REQ-185 (the case format and review field)
+  - REQ-223 (the coverage gate that counts review statuses)
+  - REQ-186 (grading only `approved` cases)
```

- Verdict:
- Reason:

---

## REQ-225 — new: cases whose official text changed are flagged for re-review, not blocked

**What this decides:** what happens to a case when a rules or card-data
refresh changes the text it depends on.

**In plain terms:** each case remembers a fingerprint (a hash) of the rule
text, card text, and ruling text it depends on. When a data refresh changes
any of them, a report flags the case as stale. A stale case drops out of live
grading until you re-approve it, so the AI is never graded against an answer
that may be out of date. The report never blocks a pull request, so the weekly
data refresh keeps flowing. The corpus keeps only the current answer; git
keeps the history.

**What happens if you say no:** after a rules or card update, cases can keep
grading the AI against answers the update made wrong, and nothing points you
at which ones to re-check.

```diff
+### REQ-225
+- Title: Staleness report for rules test cases
+- Priority: medium
+- Description: Each rules test case (REQ-185) records content hashes of the rule text, oracle text, and ruling text it depends on. A staleness report compares them with the committed data and flags every case whose dependencies changed. A stale case leaves live scoring until the owner re-approves it. The report never fails a build.
+- Acceptance Criteria:
+  - each case's `snapshot` stores a hash of the rule-index text of every `decidingRuleIds` entry, of every attached card's oracle text, and of every attached card's rulings, plus a hash of the whole rule-index file it was authored against
+  - a staleness command lists every non-rejected case whose stored hashes differ from the committed data, naming which dependency changed, and every case awaiting a query-vector re-freeze (REQ-222)
+  - a stale `approved` case is not selected by the answer-quality run (REQ-188) until the owner re-approves it through the review flow (REQ-224), which re-records its hashes
+  - the staleness command is never part of `npm run quality:check` or any build gate and never blocks `npm run data:refresh-pr`
+  - no provider call, no network call
+- Constraints:
+  - the corpus holds only each case's current answer; history is git history
+  - the staleness report never edits a case
+- Dependencies:
+  - REQ-185 (the `snapshot` field)
+  - REQ-188 (the run that skips stale cases)
+  - REQ-222 (the re-freeze state it lists)
+  - REQ-224 (re-approval)
+- Notes:
+  - the committed rule index carries no Comprehensive Rules date of its own (measured 2026-10-06), so a case records a hash of the index file rather than a rules date
```

- Verdict:
- Reason:

---

## Blocker questions

### Q-007 — which mechanics are joke-only and excluded

**What this decides:** the exact excluded list REQ-223 starts with, and so
how many mechanic cases run 1 writes.

**In plain terms:** you said Un-set and acorn mechanics are excluded. The
intake proposed four: 701.51 Open an Attraction, 701.52 Roll to Visit Your
Attractions, 702.158 Space Sculptor, 702.159 Visit, and asked about 702.186
Infinity (∞). Measured here: Infinity is not joke-only — it is on two Infinity
Stone cards in the app's card data, one with three Wizards rulings dated
2025-09-19. And one more Un-set mechanic the intake missed: 701.45 Assemble,
the Contraption mechanic from Unstable, on 25 cards. The app's card data keeps
Un-set cards and carries no acorn marker, so it cannot settle legality by
itself. One caution: Unfinity's cards without the acorn stamp are legal in
eternal formats, so if the Attraction cards are among them, the three
Attraction mechanics are real, not joke-only.

**Recommendation:** exclude the intake's four plus Assemble (five), include
Infinity. That is 258 − 5 = 253 required mechanics; Trample is already
covered, so run 1 writes 252 mechanic cases.

**What happens if you say no or leave it blank:** the run re-parks here. Any
other list works the same way; each mechanic moved in or out adds or removes
one case.

- Answer:
- Reason:

### Q-008 — how many tier-3 cases (your own research) run 1 carries

**What this decides:** how much of your research time run 1's review costs.

**In plain terms:** tier 3 is for interactions no official text answers; an
agent may draft the answer with a rule cited for every step, but you must
research and approve it. The intake set up to 15 tier-3 cases in the ~120
hard-area cases, filled with official cases if you want research light. The
two tester cases from the deferred package (Academy Manufactor with Esix, and
the cleanup-step case) are tier 3 either way.

**Recommendation:** research-light — only the two tester cases are tier 3 in
run 1, and the other 13 slots are filled with official cases. More tier 3 can
come in run 2.

**What happens if you say no or leave it blank:** the run re-parks here. A
number from 0 to 13 sets how many tier-3 drafts the build writes beyond the
two testers.

- Answer:
- Reason:
