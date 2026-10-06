# Graph-run brief — rules test harness, run 1 (backbone + every mechanic once)

Self-contained intake for `graph-kickoff`. The open questions in the owner's
intake (`PRD/work/properRulesTestHarness/gameplanIdeas.md`) are **resolved with
data below**, so refinement can go straight to a DESIGN-BRIEF. Probe:
`PRD/work/probe-rules-test-harness/` (2026-10-06).

## What the player gets

Answers they can trust. Today the app grades its AI's rulings on 18 hard cases.
After this run it grades against about 400 cases: one for every real Magic
mechanic, plus ~120 aimed at the hard interactions players actually get wrong
(copies, layers, replacement effects, triggers, multiplayer). Nearly all are
answered by official Wizards text. Two things then get caught
automatically before a change ships: a card the player attached that never
reaches the AI, and a deciding rule that used to reach the AI and no longer
does. Whether the AI's final ruling is right is graded on demand, re-paying only
for cases whose prompt actually changed.

This is the backbone the owner will use to check the AI isn't giving wrong or
made-up rulings. It is built to carry all six test layers from the intake.
Run 1 switches on three of them.

## Why (measured — do not re-derive)

**What exists today** (answer-quality instrument, REQ-185–190, NFR-018):

| Piece | Today |
| --- | --- |
| Gold cases | 18, `apps/backend/src/eval/worked-solutions/*.case.json`, loaded and validated by `scripts/lib/gold-cases.mjs` |
| Answer key rule | tier 1 = CR `Example:` line verbatim; tier 2 = WotC card ruling verbatim; "an answer written by a contributor or an agent is never ground truth" (REQ-185) |
| Grading | deterministic checks + gpt-5 judge grounded on the reference answer + blind ranking + human pass; 4 axes 0–2; headline = count at Correctness 2 (REQ-186/187) |
| Run | `npm run eval:answer-quality`, dry run by default, `--confirm-live-calls`, sequential, never a build gate (REQ-188) |
| Last result | gpt-4.1 at cap 10: 18/18 fully correct; gold rule reached the prompt 16/18 |
| Clarification | **no product behavior**: the prompt never asks the player for missing info |

**Official answer pool, already committed and served in production:**

- 78,734 WotC rulings over 19,854 cards (`apps/backend/data/cardRulingsByOracleId.json.br`, 2026-09-09 build; filtered to `source: "wotc"` by `scripts/build-card-rulings.mjs`).
- 215 CR rule entries carrying an `Example:` line (`apps/backend/data/gameRulesRuleIndex.json`).
- 6,643 rulings name a second card (5,820 pairs; over-counts set and format names) — the run-2 pool for official two-card interactions.

**Mechanic coverage** (CR text effective 2026-08-07):

| | Count |
| --- | --- |
| Keyword mechanics in the CR (194 abilities in 702 + 69 actions in 701) | 263 |
| Joke-only, excluded (701.51 Open an Attraction, 701.52 Roll to Visit Your Attractions, 702.158 Space Sculptor, 702.159 Visit) | 4 |
| 702.186 ∞ (Infinity) — no cards in committed data; confirm joke-only or not | 1 |
| **Real mechanics → one case each** | **258–259** |
| …with ≥1 WotC ruling on a card bearing the keyword | 229 |
| …with a CR `Example:` line | 20 |
| …missing only because Scryfall's keyword field omits basic actions (Destroy, Sacrifice, Cast, …); rulings exist by text search | ~18 |
| …genuinely thin (Provoke, Recover, Ripple, Frenzy, Absorb, Poisonous, Harness, Power-up, Teamwork) | ~9 |
| …in the 2026-08-07 CR but not in the committed 2026-06-05 rule index | 5 |

**Run-1 size: about 400 cases** (owner, 2026-10-06: "lets shoot for 400 tests
… a few copies of tests that cover more niche things … the basics are maybe
easier to resolve"):

| Block | Cases | Answer source |
| --- | --- | --- |
| Migrated gold set | 18 | unchanged |
| Tester cases | 2 | tier 3 (owner-approved) |
| One per real mechanic (Trample, Regenerate already covered) | ~259 | tier 2 ruling on a card bearing it → else CR `Example:` → else verbatim CR rule → else tier 3 |
| **Hard-area depth** | **~120** | see below |

The ~120 hard-area cases:

| Source | Cases | Pool available |
| --- | --- | --- |
| CR worked examples in hard rules areas, not already used | ~50 | 139 `Example:` lines, measured: copies 707 (23), multiplayer 801 (15), triggers 603 (12), layers 613 (12), double-faced 712 (10), resolution 608 (9), two-player-team 810 (9), replacement/prevention 614–616 (15), copiable 611 (6), Commander 903 (5), combat 508–510 (7), SBA 704 (3), other (13); ~10 already in the gold set |
| Official two-card rulings in the same areas | ~55 | 6,643 rulings that name a second card |
| Owner's tier-3 bucket (no official text exists) | ≤15 | owner research; fill with official cases if the owner wants research light |

Rules for the depth block:
- At least a third are `does-not-work` cases (missing condition, wrong
  controller, object changed zones, replacement doesn't apply), so the corpus
  can't teach "it always works".
- A second case on the same mechanic or rules area must test a **different
  interaction** (different cards, a different deciding rule). Rewordings of
  the same case are layer-1 variants for later, not new cases. The loader's
  dedup enforces this.
- Weight toward areas where the AI has already been wrong: replacement-effect
  ordering (Manufactor + Esix), cleanup-step timing (Necropotence + Silence),
  the post-2024 combat damage rule (510.1c), and copy effects.

**Live cost (estimate, not measured):** about $0.013 per case for a gpt-4.1
answer plus gpt-5 grading → about **$5–6 for a full 400-case run**, roughly
1.5 hours sequential under the 30k tokens-per-minute cap. Routine runs re-grade
only changed cases. The first live run's
recorded usage replaces this.

**Outside sources** (probed live, 2026-10-06):

| Source | Use |
| --- | --- |
| Scryfall `wotc` rulings, CR text, WotC Update Bulletins | answer authority (the first two already shipped) |
| WotC Release Notes | card notes ≈ Scryfall rulings (267/294 identical in one set); General Notes only |
| Board & Card Games Stack Exchange | discovery only: 5,237 MTG Qs; CC BY-SA needs credit + share-alike per file |
| Academy Ruins API | discovery: per-rule CR change history, to find stale cases |
| Reddit, RulesGuru, Possibility Storm, Gatherer scraping, Judge Academy, JudgeApps | skip (terms, paywall, gone, or duplicates Scryfall) |
| Cranial Insertion, judge blogs | read by hand for ideas; never copy text |

**Run 1 needs no outside source.** Every answer comes from data already committed.

## Decisions already made — do not re-litigate

Owner, 2026-10-06:

1. **All six layers, built right the first time.** The case format carries
   every layer now: input understanding, clarification, structured state,
   prompt construction, ruling, explanation. Run 1 switches on prompt
   construction (offline), ruling and explanation (live). "This is going to
   become the backbone to how i can validate that the agent is giving reliable
   answers/advice and isnt hallucinating."
2. **A new bucket for unofficial answers.** Interactions with no official text,
   like both tester cases, get an answer the owner researches and approves. It
   is scored and reported on its own, never pooled with the official tiers.
3. **Offline checks may gate; live answers never run automatically.** "im cool
   with validation tests catching when cards arent being attached or context is
   missed, but i cant afford to test against the live backend every time."
4. **Every real mechanic gets at least one case.** Joke-only (Un-set/Acorn)
   mechanics are excluded and listed as excluded.
5. **The owner reviews every case.** No case counts toward a score until the
   owner approves it. That is why the count dropped from 1,000; the owner then
   set run 1 at **~400**: every mechanic once plus ~120 hard-area cases.
6. **Two runs, back to back.** This is run 1. Run 2 grows depth (see below).
7. **Every card attached.** Cases assume the player attached every named card
   (owner direction, 2026-10-06, carried over from the deferred
   `niche-interaction-rule-tests` package). Typed-name-only questions are out
   of focus.

## Recommendations from the probe — owner confirms at the define gate

- **Tier 1 also accepts a CR rule verbatim**, not only an `Example:` line, when
  the question asks exactly what that rule states. This gives the ~9 thin
  mechanics an official answer (e.g. 702.39a for Provoke) instead of sending
  them to the owner's bucket.
- **Tier 3 = the owner's bucket.** An agent may *draft* a tier-3 answer. It must
  cite a CR rule id for every step and list the research it rests on. It stays
  `draft` and never scores until the owner approves it. REQ-185's "never
  ground truth" line becomes "never ground truth unless the owner approves it,
  and then only as tier 3".
- **The rule check is a ratchet, not an absolute bar.** The build records which
  cases currently get their deciding rule into the prompt. The gate fails when
  a case that used to hit now misses. New hits are reported, and the baseline
  is raised only by an explicit command. This matches the REQ-177 lexical
  baseline gate. An absolute bar would fail on day one, because retrieval
  quality is exactly what's being measured.
- **The card check is absolute.** Every case's attached cards must put their
  oracle text and WotC rulings into the prompt. This is deterministic and
  should always pass.
- **Mechanic coverage gates on the committed rule index**, not the newer local
  CR text. Every mechanic in the index that isn't on the excluded list needs at
  least one case. A mechanic first shows up when the rules data is refreshed,
  and that refresh is a deliberate package anyway.
- **Stale cases are reported, not gated.** Each case stores hashes of the rule
  text, oracle text and ruling text it depends on. When a data refresh changes
  one, the case is flagged for re-review and leaves live scoring until it is
  re-approved. It does not block the weekly `data:refresh-pr`. The corpus holds
  only the current answer; git holds the history.
- **Routine live runs grade the deployed setup only:** gpt-4.1 at excerpt cap
  10, cases whose prompt changed since their last graded run. The four-model
  bake-off stays available as an option.

## Design direction (converged)

**Case format** (new version of the gold-case file; existing 18 migrate with
their question and answer text unchanged):

```json
{
  "id": "academy-manufactor-esix-treasure",
  "formatVersion": 2,
  "tier": 3,
  "review": { "status": "draft", "reviewedOn": null },
  "cards": [
    { "oracleId": "<id>", "name": "Academy Manufactor" },
    { "oracleId": "<id>", "name": "Esix, Fractal Bloom" }
  ],
  "gameState": null,
  "question": "How do Academy Manufactor and Esix, Fractal Bloom interact when I create a Treasure?",
  "expected": {
    "outcome": "works",
    "shortAnswer": "You choose the order. Manufactor first gives three copies; Esix first gives one.",
    "answer": "<tier 1/2: official text verbatim; tier 3: owner-approved ruling>",
    "decidingRuleIds": ["614.1a", "616.1", "616.1e", "616.1f"]
  },
  "source": {
    "authority": "owner-approved-derived",
    "citation": "CR 616.1, 616.1e, 616.1f",
    "research": ["<discovery links; never the answer>"],
    "license": "<as today>"
  },
  "layers": {
    "requiredFacts": [],
    "irrelevantFacts": [],
    "variants": []
  },
  "tags": ["mechanic:none", "cr:616"],
  "snapshot": {
    "rulesIndexDate": "2026-06-05",
    "dependsOnHashes": { "rules": "<sha>", "oracle": "<sha>", "rulings": "<sha>" }
  },
  "whyHard": "…"
}
```

- `outcome` is `works`, `does-not-work`, or `depends`, so the corpus can't teach
  "it always works".
- `layers.requiredFacts` / `irrelevantFacts` / `variants` are defined now and
  left empty in run 1. They are the hooks for clarification and messy-wording
  tests later.
- `gameState` maps to the In-Depth request (zones, stack order, controller) and
  is filled only where the ruling depends on it.
- **Tags and difficulty are derived, not hand-written.** `mechanic:` comes from
  the 701/702 ids involved; `cr:` from `decidingRuleIds`; difficulty from the
  number of cards and distinct CR sections, plus flags such as layers,
  replacement or multiplayer.
- **Dedup:** the loader rejects two cases with the same card set and the same
  answer source.

**Layers in run 1:**

| Layer | Run 1 | How |
| --- | --- | --- |
| 4 Prompt construction | **on, offline, gating** | absolute card check + ratchet rule check + state-fact check where `gameState` is set; frozen query embeddings so it's deterministic and free |
| 5 Ruling | **on, live, on demand** | existing Correctness axis |
| 6 Explanation | **on, live, on demand** | existing Grounding / Calibration / Readability axes, plus a new free check that every CR rule id the answer cites exists in the index (made-up rule numbers) |
| 3 Structured state | field + offline check, sparsely filled | |
| 1 Input understanding, 2 Clarification | schema only | need player-wording variants and a product clarification behavior first |

**Live runner:**
- Dry run with a cost estimate by default; `--confirm-live-calls` to spend.
- Picks cases by `--changed` (prompt hash differs from the last graded record, or
  never graded), `--tag`, `--tier`, `--sample N`, or `--all`.
- Scores only `approved` cases.
- `results.json` gains a per-case prompt hash so `--changed` works without
  committing any prose.

**Owner review flow:** the build authors cases as `draft` and ships a review
command. It renders pending cases in batches grouped by mechanic, showing the
question, each attached card's oracle text, the answer verbatim and its
citation. A second step writes the owner's approve / reject / edit verdicts back
into the case files. The build does **not** park waiting for review; review
happens after merge, on the owner's schedule.

**Coverage report:** a command printing mechanic × {approved, draft, none},
CR section × case count, and tier counts. A counts-only committed file sits next
to `results.json`.

## Current-state PRD truth to amend

The decision log is retired, so no DEC entries. New IDs start at **REQ-222**
(REQ-220/221 are reserved by the deferred `niche-interaction-rule-tests`
package).

- `PRD/sections/functional-requirements.md`:
  - REQ-185: tiers, verbatim-rule tier 1, tier 3, format v2, review status, every-mechanic minimum.
  - REQ-186: the made-up-rule-id check.
  - REQ-188: case selection, prompt-hash re-runs, routine lineup.
  - REQ-189: per-case prompt hash, coverage file.
  - New REQ-222+: offline prompt gate (card check + ratchet), coverage gate, owner review flow, staleness report.
- `PRD/sections/non-functional-requirements.md` NFR-018: the offline half now partly gates; the answer half still never gates.
- `PRD/sections/system-map.md` (answer-quality entry), `PRD/sections/goals-and-non-goals.md` and `PRD/sections/in-depth/README.md`, wherever they cite REQ-185–190.
- `apps/backend/src/eval/worked-solutions/README.md`.

## Constraints (don't rediscover)

- **Don't rebuild the rule index.** It is 2026-06-05. The local `cr/source.txt`
  is 2026-08-07, and rebuilding from it rewrites ~50 rules and breaks prompt
  goldens; that is the separately deferred golden-regen follow-up. The 5
  newer-than-index mechanics will miss the rule check. Record that as a finding.
- **Leave existing suites alone:** the 31 context-eval goldens, labelled System 3
  checks, the 156-pair benchmark, and `npm run eval:worked-solutions` all keep
  working. Migrating the 18 cases must not change their question or answer text
  (REQ-185: "no case is added, edited, or removed to make a score look better").
- Mock-first default, no new runtime dependency. Eval data never enters a live
  prompt (NFR-018).
- The live run is never added to `quality:check`, `npm test`, `test:eval`,
  `coverage:check` or `test:scripts` (REQ-188's regression guard stays).
- Sequential live calls (gpt-4.1 org cap 30k TPM).
- A fresh worktree has no `apps/backend/data/models/`. Copy it from the main
  checkout, or the local embedder falls back to lexical; the run refuses to
  record that.
- **Licensing:** commit only WotC text already shipped (rulings + CR). No Stack
  Exchange or Cranial Insertion text in run 1.
- **Measure, don't reason, any numeric acceptance target** (the ratchet baseline,
  per-mechanic hit counts). Several past specs slipped because they didn't.
- **Related, not this run:** the deferred `niche-interaction-rule-tests` (draft
  PR #266) resumes after this lands. Its two tester cases become tier-3 drafts
  here, using the CR derivation in that package's DESIGN-BRIEF: Q1 via 614.1a,
  616.1, 616.1e, 616.1f; Q2 via 514.1, 514.2, 514.3a. Its REQ-220 retrieval fix
  is then re-measured on this harness.

## Run 2 (named, not built here)

- More depth per core rules area beyond run 1's ~120 (stack/priority,
  state-based actions, face-down, zone changes / last known information,
  Commander and multiplayer are the thinnest after run 1).
- More `does-not-work` cases, toward one per rules area.
- More official two-card interactions from the 6,643 rulings that name a
  second card.

Sized to the owner's review budget. Layers 1–2 (player wording, clarification)
follow once the product has a clarification behavior; Stack Exchange then
becomes the discovery source for real wording.

## Evidence + reusable tooling

`PRD/work/probe-rules-test-harness/`:
- `FINDINGS-repo-baseline.md`
- `FINDINGS-mechanic-coverage.md`
- `FINDINGS-external-sources.md`

The scratch measurement scripts aren't committed. Re-derive mechanic counts by
parsing `701.N.` / `702.N.` headings in `apps/backend/data/cr/source.txt` and
joining to `cardDetailByOracleId.json.br` keywords.

## What the graph run should produce

1. A DESIGN-BRIEF for run 1.
2. REQ-185/186/188/189 + NFR-018 amendments, plus new REQ-222+ for the offline
   gate, coverage gate, review flow and staleness report.
3. Slices that build, in order: format v2 + loader + migration of the 18 → the
   offline gate (card check, ratchet, state facts) → live runner selection +
   prompt hash + made-up-rule check → review command → coverage report and gate
   → case authoring by mechanic family (~259 cases, as `draft`) → hard-area
   depth (~120 cases, as `draft`) plus the 2 tester cases as tier-3 drafts.

The owner reviews after merge. Nothing above in "Decisions already made" is
reopened.

## How to hand this off

/graph-kickoff "Build the rules test harness backbone: a six-layer-ready case format, an offline gate that catches dropped cards and missed rules, a budget-safe on-demand answer grader, an owner review flow, and ~400 cases covering every real mechanic once plus ~120 hard interactions" PRD/work/probe-rules-test-harness/GRAPH-BRIEF.md
