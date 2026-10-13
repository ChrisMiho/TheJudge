# Probe — keyword rules don't reach the prompt (2026-10-07)

Evidence for a kickoff. Not product truth.

## Question

The owner asked whether a card's keywords already pull rules into the prompt.
They do, but only as a search weight, and the measured result is that the
keyword's own defining rule usually still misses the prompt.

## How keywords are used today

- `apps/backend/src/gameRulesRetrieval.ts` `buildCompactCardSignal` (line ~396):
  each attached card contributes `name + typeLine + Scryfall keywords` to the
  System 3 query (REQ-178, REQ-180).
- Each query token found in `gameRulesKeywordVocabulary.json` is weighted
  `KEYWORD_TOKEN_MULTIPLIER = 6` (line ~317) in the lexical score (lines ~547,
  ~594). The boost applies to every rule whose text contains that word, not to
  the keyword's defining rule specifically, and the result still competes for
  System 3's ten slots.
- No step maps a card's keyword to its defining rule (e.g. Flying → 702.9).
  System 2 topic selection is card-agnostic apart from REQ-220's new
  replacement/prevention switch (PR #276).

## Measurement (rules gate baseline on PR #276's branch)

- 392 rules-test cases; 99 still have a deciding rule that reaches the prompt
  neither as a System 3 excerpt nor through a curated topic.
- 63 of those 99 miss a keyword or keyword-action rule (701.x / 702.x).
- In about 51 of the 63, the attached card's Scryfall `keywords` already names
  that keyword. 41 match strictly (the rule text starts with the keyword name);
  10 more match by eye where the rule is phrased as an action (Amass, Clash,
  Connive, Detain, Explore, Manifest, Mill, Transform, Triple, Venture).
  So the signal is present and the search still drops the rule.
- About 12 have no matching keyword in card data: basic actions the card's text
  performs without a keyword tag (activate, cast, create, discard, play,
  shuffle, tap/untap), keywords a card grants rather than has (Lymph Sliver
  absorb, Frenzy Sliver), and two others (Ripple on Thrumming Stone, Visit on
  an Attraction).

Method: `apps/backend/src/eval/rules-gate/baseline.json` from
`origin/thejudge-auto/niche-interaction-rule-tests-work`, gap = `miss` minus
`inTopic`; each case's card `oracleId` looked up in
`apps/backend/data/cardDetailByOracleId.json.br` (`keywords`), matched against
the missed rule's text in `apps/backend/data/gameRulesRuleIndex.json`. Offline,
no model calls.

## Candidate fix (for refinement to shape and measure)

A direct lookup: when an attached card's Scryfall keyword names a keyword
ability or action, put that keyword's defining rule in the prompt, outside
System 3's ten-slot competition (the same way REQ-220's topic is). To measure
before deciding: how many of the 51 it closes, the added prompt size per card
(keyword rule families vary in length), whether it moves any existing suite,
and how to resolve keyword name → rule number (the rule index has no title
entries such as `702.9. Flying`; the name sits at the start of the `a`
sub-rule's text).

Open for refinement: the ~12 cases with no keyword tag, and whether to include
the whole rule family (702.9a–c) or only the `a` rule.

## Sequencing

Builds on PR #276 (same files: `gameRulesTopicSelection.ts`,
`prompt/preparation.ts`, rules gate). Kick off after #276 merges. The
prompt-presentation package (Silence + Necropotence: the rules are present and
the answer is still wrong) follows this, tested with a live answer check.
