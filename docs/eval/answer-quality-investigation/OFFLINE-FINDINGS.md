# Offline findings (Phase 0): answer-quality investigation

Dated 2026-10-07. Free, offline, no model call. Written by the build of the
`answer-quality-investigation` package; the paid phases (1 to 5) are in `RUNBOOK.md`.

## The short version

A player who asks about Academy Manufactor with Esix gets a prompt that carries
none of the four rules that decide the answer (614.1a, 616.1, 616.1e, 616.1f), and
the two rules the search ranks nearest sit at 646th and 1,111th. A player who asks
about Necropotence, Silence and Borne Upon a Wind gets rule 514.1 and rule 514.3, but
not the exception 514.3a that decides the case, nor 514.2. So for these two
cases the first problem is **missing evidence**: whatever the model does, it was
never given the deciding rules.

Across all 392 approved cases, the prompt carries every deciding rule for 290 and
misses at least one for 102. Tier 1 is almost clean (78 of 80); tier 2 is where the
misses live (98 of 310 cases). The measuring tools built in this package reproduce the
offline gate's committed baseline for every one of the 392 cases.

What this build could **not** measure, and why: PR #273's head (`07cc3ab6`) and the
unchanged-input stratum (how many prompts the refresh left byte-identical). Both need a
second checkout, and this build ran in one worktree and fetched nothing. They are step 0
of the runbook.

## What was measured

| Item | Value |
| --- | --- |
| Checkout | the build checkout of `thejudge-auto/answer-quality-investigation-work`; every trace folder records the exact commit in its `trace.json` (`commit`) |
| Relation to the base | descends from `3e973ced` (the recorded base). `git diff 3e973ced HEAD` over `apps/backend/data/`, `apps/backend/src/eval/worked-solutions/`, `apps/backend/src/eval/rules-gate/` and `apps/backend/src/prompt/`, `routes/`, `providers/` is empty: the data, the corpus, the gate and the prompt code are the base's |
| Head | `07cc3ab6` (PR #273) was **not** run: no second worktree was created (the build writes only inside its own worktree), and a worktree needs `npm ci` and the embedding model. Its facts below come from `git show` / `git diff` only, read-only |
| Network | none. No OpenAI call, no Scryfall fetch, no data refresh |

So "base" below means this checkout. The base/head comparison runs from step 0 of the runbook.

## 1. Where the deciding rules go (trace over all 392 approved cases)

`npm run eval:evidence-trace` (offline, frozen query vectors, the unmodified production prompt builder):

| | Cases | Deciding rules | Selected in search | Available to the answer | Complete procedure | `goldRuleInPrompt` |
| --- | --- | --- | --- | --- | --- | --- |
| overall | 392 | 434 | 308 | 314 | 290 | 301 |
| tier 1 | 80 | 80 | 78 | 78 | 78 | 78 |
| tier 2 | 310 | 347 | 229 | 235 | 212 | 222 |
| tier 3 | 2 | 7 | 1 | 1 | 0 | 1 |

- **Selected in search** is what the committed baseline records. **Available to the
  answer** adds a rule whose text arrives another way. Six rules are available without
  being selected: 603.2 in five cases and 400.7 in one, each carried by a curated rules topic.
- **Complete procedure** (every deciding rule available) is 290; **every rule selected**
  is 287; **`goldRuleInPrompt`** (at least one deciding rule selected, the scorecard's
  existing flag) is 301. The old flag hides the 11 cases that have some but not all of
  their rules.
- Missed rules that were ranked (117 of the 126 not selected): they rank just below the
  cap more often than far down. Rank 11 to 20: 28 rules; 11 to 50: 59 rules; median rank 46;
  75th percentile 157; the worst is 2,703. A bigger excerpt cap would rescue some of them and
  not the rest.
- Nine rules were never ranked because System 3 skips them for a curated topic. Six are
  carried by that topic. Three are **not**: 603.3b, 603.2e and 603.2g (in
  `resolution-goreclaw-and-brawl-bash-ogre`, `triggers-becomes-tapped-not-entering-tapped`,
  `triggers-damage-prevented-no-trigger`). Search skips a lettered subrule because its
  parent is curated, but the topic carries the parent's text only. That is a retrieval hole
  the follow-up should know about.
- Four cases have the parent present and the deciding subrule absent ("514.3 is there,
  514.3a is not"), the Necropotence case among them.

## 2. The named cases

Rank is the position in the full System 3 ranking of that case's prompt (higher number,
further down).

**`academy-manufactor-esix-treasure`** (tier 3; prompt 16,710 characters; cards Academy
Manufactor and Esix, Fractal Bloom). Per-rule coverage 0 of 4; complete procedure no;
`goldRuleInPrompt` no.

| Rule | Rank | Selected | Available | Parent / subrules |
| --- | --- | --- | --- | --- |
| 614.1a | 1,916 of 2,721 | no | no | parent 614.1 not available |
| 616.1 | 1,111 | no | no | its subrules 616.1a to 616.1g all absent |
| 616.1e | 2,329 | no | no | parent 616.1 absent |
| 616.1f | 646 | no | no | parent 616.1 absent |

**`necropotence-silence-borne-upon-a-wind-cleanup`** (tier 3; prompt 12,565 characters;
cards Necropotence, Borne Upon a Wind, Silence). Per-rule coverage 1 of 3; complete
procedure no; `goldRuleInPrompt` yes (the flag reads "hit" for a case that cannot be
answered from its prompt).

| Rule | Rank | Selected | Available | Parent / subrules |
| --- | --- | --- | --- | --- |
| 514.1 | 3 of 2,645 | yes | yes | |
| 514.2 | 29 | no | no | |
| 514.3a | 13 | no | no | parent 514.3 is selected and present, the exception is not |

**`multiplayer-only-blood-ends-your-nightmares-opponents`** (tier 2; the case that loses
608.2d at the head). Per-rule coverage 2 of 2 at the base. 608.2d ranks **10 of 2,686**:
the last rank inside the cap of 10. The refresh adds 39 rule ids, which per commit
`68ea3c0b` moves it past the cap; this build cannot confirm that rank (step 0 does).

## 3. The trace reproduces the offline gate

`npm run eval:evidence-trace` ran over the 392 approved cases of this checkout: **392 of
392 agree** with `apps/backend/src/eval/rules-gate/baseline.json` on hit and miss, 0
diverge, 0 awaiting a re-freeze (all 392 ranked with their committed frozen vector). This
is the parity check of the design (the trace run from the revision that wrote the baseline
reproduces it). The trace tests also cover the refusal of a dirty checkout and the commit
record.

## 4. The refresh (PR #273), read from git only

`git diff 3e973ced 07cc3ab6`: 43 files. Corpus side: 17 case files changed, **10 existing
approved cases re-snapshotted** and **7 new drafts** (`recruit-esgaroth-garrison`,
`empower-jace-theorists-proxy`, `storied-thorin-oakenshield`, `heal-wolverine-fierce-fighter`,
`power-up-abomination-activate-once`, `power-up-captain-marvel-cost-reduction-by-type`,
`teamwork-repulsor-blast-total-power`). The drafts are not approved, so no run grades them.
Every re-snapshotted case keeps its question and reference answer byte for byte; only its
snapshot hashes changed.

The ten, with the review provenance each carries at the head:

| Case | Tier | Source that changed | Head `review` |
| --- | --- | --- | --- |
| `boast-tuskeri-firewalker` | 2 | rules | approved, reviewedOn 2026-10-07 |
| `combat-flying-and-shadow` | 1 | rules | approved, 2026-10-07 |
| `copies-quicksilver-gargantuan-and-tarmogoyf` | 1 | rulings | approved, 2026-10-07 |
| `exhaust-afterburner-expert` | 2 | rules | approved, 2026-10-07 |
| `forecast-sky-hussar` | 2 | rules | approved, 2026-10-07 |
| `max-speed-amonkhet-raceway` | 2 | rules | approved, 2026-10-07 |
| `necropotence-silence-borne-upon-a-wind-cleanup` | 3 | rules | approved, 2026-10-07 |
| `replacement-lifegain-and-draw-replacements-combine` | 1 | rules | approved, 2026-10-07 |
| `shuffle-sylvan-primordial` | 2 | oracle text | approved, 2026-10-07 |
| `token-created-by-name-uses-oracle-card` | 1 | rulings | approved, 2026-10-07; note: approved by the owner's accept of REQ-185 at the define gate |

Provenance reading (assumption A17): commit `68ea3c0b` says the ten were "re-rendered,
checked against the new text, and re-approved through the review loop". REQ-224 makes only
the owner's apply set `approved`, but no case file records who gave the verdict, and only
the last one carries a note naming the owner. So none of the ten is shown here to be an
owner verdict. **They are counted (10 of 392) and the Phase 2 primary cohort holds them out
until the owner confirms them** (runbook step 0).

From the same commit message: the head baseline reads 291 hit and 104 missed of 395; one
accepted loss (608.2d for the multiplayer case); the Comprehensive Rules moved from the
2026-08-07 to the 2026-09-25 release (39 rule ids added, 19 removed, 51 reworded).

**Not measurable here:** the unchanged-input stratum (cases whose prompt hash is identical
at base and head). It needs both revisions' traces; `eval:evidence-trace:compare` prints it
as "Prompt hash equal (unchanged-input stratum)". Runbook step 0 produces it.

## 5. Staleness and coverage (both ran, this checkout)

- `npm run eval:rules-staleness`: 392 cases checked; **stale: none; awaiting a query-vector
  re-freeze: none**. Every stored snapshot matches the committed rule, oracle and ruling text.
- `npm run eval:rules-coverage`: 256 of 256 mechanics covered (256 approved, 0 draft only,
  0 needs-edit only), 2 excluded (701.45 Assemble, 702.158 Space Sculptor). Cases per tier:
  1: 80, 2: 310, 3: 2; per status: approved 392, rejected 1. It rewrites
  `apps/backend/src/eval/answer-quality/coverage.json`, which came out unchanged.

## 6. The two committed case sets

Written by `npm run eval:answer-quality:manifests` (seed 20261007), which re-runs
byte for byte under `-- --check`.

- Pools from the trace: 287 fully selected, 14 partly, 91 with none (the numbers in the
  design).
- **Diagnostic: 46 cases** = the two tester cases, the multiplayer case, the 14 partial cases
  (Necropotence is both tester and partial, so 16 mandatory), a seeded 20 with none selected
  and a seeded 10 fully selected as passing controls. Defaults were kept; the design said "about 47".
- **Held-out: 80 cases** of the 346 remaining, spread over 28 Comprehensive Rules sections in
  proportion to section size; disjoint from the diagnostic set (a test asserts it). Only
  ids and hashes are stored.

## 7. Arm B: what it was built from, and the freeze

`node --import tsx scripts/diagnostic-arms-check.mjs --observations` measures the
production (arm A) prompt over the 46 diagnostic cases. No reference answer is read.

| Observation | Value |
| --- | --- |
| Mean prompt size | 15,289 characters; exactly 10 rule excerpts each |
| Excerpt order | never in rule-number order (0 of 46): excerpts follow the search rank |
| A rule and its lettered exception both attached | 13 prompts, 21 pairs; adjacent in A: 8 of 21; adjacent in B: 13 of 21 (the rest have a third sibling between them) |
| Duplicate evidence units | 0 |
| Excerpts that repeat a curated-topic rule | 0 |
| Distance from a card's text to its rulings | mean 1,014 characters in A (rulings come in a separate section after every card); 324 in B |

So the grouping is: each card followed by its own rulings; the rule excerpts in rule-number
order (a rule beside its exception); the curated background rules last; the preamble,
combo section and question where they were. **B.1 is frozen on 2026-10-07** under that
grouping (`ARM_REGISTRY.B.frozen = true`, which also makes D.1 usable). A different grouping
would be B.2, never an edit of B.1.

Over all 46 diagnostic cases (`node --import tsx scripts/diagnostic-arms-check.mjs`, also run
by `npm run test:scripts`): parse-then-render reproduces arm A exactly; B holds exactly A's
evidence units and changes nothing but order and headings (line for line); C adds only
deciding-rule bundle rules A does not already carry (for Academy Manufactor, ten: 614.1,
614.1a, 616.1, 616.1a to 616.1g); D holds C's units in B's order; no arm adds the case's
reference answer or short answer. (For many tier 1 and 2 cases the reference answer **is**
rule or ruling text, so arm A's own prompt quotes it whenever that rule is retrieved. The
test therefore asks that an arm never adds it, not that it never appears.)

## 8. Cost of the paid phases (dry runs)

Every paid phase was dry-run with no key and no network. Call counts and dollar estimates,
with each rate's check date, are in `RUNBOOK.md`. The estimates use the dry run's
character-count method with the default judge (`gpt-5`); a reasoning judge or Luna can cost
several times that, which is what the spending cap is for.

## 9. Build observation (2026-10-07)

During this build no live OpenAI call was made, no data refresh ran, and no Scryfall or
other data fetch happened. Every run of the answer-quality command in this build was a dry
run with `ANSWER_QUALITY_NO_LOCAL_ENV=1` and no key in the environment, or a unit test with
an injected fake client; `--confirm-live-calls` was never passed. The only network use was
git and GitHub for the branch and its PR. The embedding model cache was copied from another
checkout on disk, not downloaded.
