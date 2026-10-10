# Findings — how RulesGuru questions fit the rules test harness

Measured 2026-10-10 against `main` at `dabad406`. Counts only; no RulesGuru
text is recorded here or anywhere in the repo. The raw sample lives in this
session's scratchpad and is not kept.

## Sample

918 questions, crawled in id order from id 2 to id 2249 through
`GET https://rulesguru.org/api/questions/?json=<settings>` with every level,
every complexity, legality `all`, and no tag filter. Ids run to at least 3677,
and the 2026-10-06 probe counted about 1,487 questions, so this is roughly 60%
of the set, skewed toward older questions. The crawl was stopped early, on
purpose, to keep load off a free community site.

## API behaviour the importer must handle

- Rate limit: the server answers "Please don't send more than one request
  every 2 seconds." Each 50-question request took about 30 s to return.
- `previousId: 0` is rejected ("0 is not a valid previous ID"). Start at 1.
- Some batches fail with "Incorrectly formatted json." even though the request
  is identical in form to ones that succeed. Halving the batch size got past it
  each time (50 → 25 → 12 → 6). The importer needs adaptive batch size and must
  be resumable from the last id it saved.
- **Cards are re-rolled on every fetch.** Questions are templates; each fetch
  substitutes different matching cards (the returned `url` encodes the roll).
  An import must freeze each question exactly as fetched, or a case changes
  under the test between runs.
- Fields per question: `id`, `level`, `complexity`, `tags`, `includedCards`
  (full card objects with name and rules text), `questionSimple`,
  `answerSimple`, `answerSimpleCited` (answer with rule ids inline),
  `citedRules` (map of rule id → rule text), `url`.

## Fit numbers (918 questions)

| Measure | Count |
| --- | --- |
| Level 0 / 1 / 2 / 3 / Corner Case | 89 / 330 / 295 / 141 / 63 |
| Complexity Simple / Intermediate / Complicated | 835 / 78 / 5 |
| Tagged "Unsupported answers" (exclude by default) | 43 |
| Cite at least one CR rule | 830 (90%) |
| …every cited rule is in our committed rule index | 820 |
| Cited rule ids missing from our index | 7, all bare keyword headers (`702.16`, `701.7`, …) whose subrules we do have |
| Cite a rule none of our 400 cases decides on | 686 (75%) |
| Distinct cited rule ids our cases never decide on | 470 (our corpus decides on 372 in total) |
| Cite a CR section (e.g. 118, 400, 601) our cases never touch | 270 |
| Have at least one card carrying a WotC ruling in our data | 881 (96%) |
| Share any card with our existing cases | 110 (12%) |
| Cards per question: 1 / 2 / 3 / 4+ | 64 / 366 / 375 / 110 |
| Question length p50 / p90 / max (chars) | 173 / 273 / 476 |
| Answer length p50 / p90 / max (chars) | 224 / 494 / 2,416 |

Most cited CR sections: 702 (180), 603 (132), 614 (129), 613 (110), 608 (88),
601 (79), 704 (73), 616 (63), 701 (52), 118 (44), 113 (39), 400 (33), 707 (32).

Card lookup: 676 of 918 questions had every card resolve by name through
`apps/frontend/public/data/cardMetadata.json`. The misses were mostly vanilla
creatures (Squire, Gore Swine, Memnite, …). That file leaves out cards with no
rules text, but `cardDetailByOracleId.json.br` does carry them (2,967 entries
with no oracle text). So the importer needs a full name → oracle id lookup, not
the scan metadata. The miss count is a gap in the probe's lookup, not cards we
lack.

## What it means

- **Breadth, not overlap.** Three questions in four exercise a rule our corpus
  never decides on, and only one in eight shares a card with it. RulesGuru
  covers ground our 400 cases do not.
- **The free check is the big win.** `citedRules` maps straight onto our
  `decidingRuleIds`, so the offline "did the deciding rule reach the prompt"
  check runs over the whole set with no provider call and no cost.
- **Difficulty axis.** Level and complexity give a difficulty split our corpus
  lacks.
- **Not ground truth.** Answers are community-written. REQ-185 says a
  contributor's answer is never ground truth unless the owner approves it as
  tier 3, so this suite is graded and reported apart from the official corpus.
