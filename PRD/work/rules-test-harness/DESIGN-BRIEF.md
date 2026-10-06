# DESIGN-BRIEF — rules-test-harness (run 1)

**What this is:** the design for run 1 of the rules test harness. Today the
app's AI is graded on 18 hard rules cases. After run 1 it is checked against
about 390 cases: one for every real Magic mechanic, plus about 120 in the
rules areas players get wrong (copies, layers, replacement effects, triggers,
combat, multiplayer).

**What you need to do:** answer `GATE-QUESTIONS.md` — eleven accept/edit/reject
slots and two questions (which mechanics are joke-only, and how many tier-3
cases run 1 carries). Then merge the docs PR.

**What it changes for you:** two free checks run on every pull request and
block it when an attached card stops reaching the AI, or when a deciding rule
that used to reach the AI stops reaching it. Grading the AI's actual answer
stays on demand and costs about two cents per case. By default it re-grades
only the cases whose prompt changed, using the model and setting players
actually get. You approve every case before it counts, in batches, after
merge, whenever you choose.

Graph-controlled refinement (`graph is controlling`, run
`graph-20261006-181340`, node 3 `define`). Every material assumption is in
`## Material assumptions`; every number is in `## Measurements` with its
command.

## Scope

Run 1 builds, in order:

1. **Case format version 2** and the shared loader, with the 18 existing cases
   migrated (question and answer text byte-identical).
2. **Offline prompt gate** (test layer 4), inside `npm run quality:check`:
   - an absolute card check;
   - a ratchet rule check, which fails only when a case loses a deciding rule
     it used to get, ranked with committed frozen query vectors;
   - a state-fact check.
3. **Live runner changes:**
   - case selection (`--changed` by default);
   - a per-case prompt hash;
   - per-case merge of the scores file;
   - judge usage recorded;
   - routine lineup `gpt-4.1` at cap 10;
   - the blind ranking skipped for a one-model run;
   - the free check for cited rule ids that are not in the rule index (test
     layers 5 and 6).
4. **Owner review flow**: render pending cases in batches, then apply your
   verdicts.
5. **Coverage report and mechanic coverage gate**, with the committed excluded
   list, plus the **staleness report**.
6. **Mechanic cases**: 252 drafts at the recommended exclusion list (Q-007).
7. **Hard-area depth**: about 120 drafts, including the two tester cases as
   tier-3 drafts.

Proposed product truth, all inside `GATE-QUESTIONS.md`:

- amended: REQ-185, REQ-186, REQ-187, REQ-188, REQ-189, REQ-190, NFR-018;
- new: REQ-222 (offline prompt gate), REQ-223 (coverage gate and report),
  REQ-224 (owner review flow), REQ-225 (staleness report);
- in the same slots, the matching `system-map.md` and
  `goals-and-non-goals.md` lines;
- blocker questions Q-007 and Q-008.

## Non-goals

- No change to the live prompt, retrieval, the excerpt cap, or Ask AI
  behavior. No clarification behavior.
- No rule-index rebuild and no Comprehensive Rules refresh. Never
  `npm run data:refresh`.
- No live run in `quality:check`, `npm test`, `test:eval`, `coverage:check`,
  `test:scripts`, or any build gate.
- No outside-source text in run 1 (no Stack Exchange, no Cranial Insertion).
- No player-wording variants or clarification tests (test layers 1 and 2 are
  schema only).
- Run 2 depth (more per rules area, more two-card official interactions) is
  named, not built.
- The existing suites stay as they are:
  - the 31 context-eval fixtures (measured: 31 `*.fixture.json` files);
  - the labelled System 3 checks;
  - the 156-pair benchmark (REQ-177);
  - `npm run eval:worked-solutions`.

## Owner decisions taken as input (2026-10-06, from the intake)

These are not argued again. Each one that becomes product truth sits in a
`GATE-QUESTIONS.md` slot for your accept.

| # | Decision | Where it lands |
| --- | --- | --- |
| 1 | The format carries all six layers now; run 1 turns on layer 4 (offline) and layers 5–6 (live) | REQ-185 "six test layers", REQ-222 |
| 2 | A separate bucket for answers you research, scored and reported apart | REQ-185 tier 3, REQ-187 headline |
| 3 | Offline checks may gate; live answers never run automatically | NFR-018, REQ-188, REQ-222 |
| 4 | Every real mechanic gets at least one case; joke-only ones are excluded and listed | REQ-223, Q-007 |
| 5 | You review every case; nothing counts until approved; ~400 cases | REQ-185 review status, REQ-224 |
| 6 | Two runs back to back; this is run 1 | scope above |
| 7 | Every named card is attached | REQ-185 "every card attached" |

The probe's recommendations are proposals you confirm at the gate. They are:

- tier 1 also accepts a rule's own text (REQ-185);
- tier 3 is your bucket (REQ-185);
- the rule check is a ratchet (REQ-222);
- the card check is absolute (REQ-222);
- coverage reads the committed rule index (REQ-223);
- stale cases are reported, not gated (REQ-225);
- routine runs grade the deployed setup (REQ-188, REQ-190).

## Design

### Case format version 2 (REQ-185)

The fields are the intake's converged shape, with three changes the
measurements forced:

- `snapshot` records a hash of the whole rule-index file rather than a
  `rulesIndexDate`, because the committed index carries no rules date (M14).
- `review.status` adds `needs-edit` and `rejected` alongside `draft` and
  `approved`, so an `edit` verdict has a state to land in.
- `cards` is the attachment list for every tier. Today only a tier-2 case's
  cited card is attached (`scripts/lib/prompt-fidelity.mjs`,
  `buildCaseRequest`).

The existing `question` field stays top-level and the file names stay the
same. `apps/backend/src/prompt/preparation.test.ts` reads six cases'
`question` by path, so those must not move.

`expected.answer` carries what is `workedSolution` today, byte-identical.
`expected.decidingRuleIds` carries what is `expectedSupplementalRuleIds`
today.

The derived `mechanic:` tag comes from 701/702 ids in `decidingRuleIds`. So a
mechanic case always lists its mechanic's own rule as a deciding rule. That is
also what makes the ratchet check whether the mechanic's rule reaches the
prompt.

The 18 cases migrate as `approved` (assumption A1).

### Offline prompt gate (REQ-222)

The gate runs every non-rejected case through the unmodified
`preparePromptInput`, with the same inputs `scripts/lib/prompt-fidelity.mjs`
already assembles. It makes three checks:

- **Card check (absolute).** Every attached card's oracle text and every
  committed ruling appear in the prompt. This is safe as an absolute rule:
  no card's rulings exceed the prompt's limits (M7).
- **Rule check (ratchet).** A committed per-case baseline of hit/miss. The gate
  fails only on a hit turning into a miss. New hits are reported, and an
  explicit command raises the baseline. This is the same shape as REQ-177's
  `step1-baseline.json` and `ragRetrievalBenchmark.test.ts`. For the 18
  migrated cases, the baseline reproduces today's 16/18 (M6).
- **State-fact check.** Applies only where `gameState` is set.

The ranking uses committed frozen query vectors, built by the shipped local
embedder. This follows REQ-181's
`apps/backend/src/eval/fixtures/frozen-query-embeddings.json` and
`npm run eval:build-frozen-query-embeddings`. Frozen vectors are required: a
lexical pass gives 14/18, not production's 16/18 (M6).

### Live runner (REQ-186 to REQ-190)

The runner grades only `approved`, non-stale cases.

- **Selection.** `--changed` is the default. It picks a case when its prompt
  hash at that model and cap differs from its last graded record, or when the
  case has never been graded. The alternatives are `--tag`, `--tier`,
  `--sample N` (seeded) and `--all`.
- **Default lineup.** `gpt-4.1` at cap 10. The four-model bake-off and other
  caps are explicit flags.
- **Ranking.** A one-model run skips the blind ranking.
- **Free check.** A deterministic check lists cited rule ids that are not in
  the committed index. These are worded as "not in the committed index",
  because the index lags the newest Comprehensive Rules (M1).
- **Scores file.** `results.json` merges per case: each case's record carries
  its own prompt hash, reference-answer hash, timestamp, commit, and the judge's
  token use.
- **Headline.** Per tier over the latest graded records. Tier 3 is never
  pooled with the official tiers.

### Owner review flow (REQ-224)

1. A render command writes pending drafts in batches to a gitignored
   `output/` file. Batches are grouped by mechanic, then by rules section.
2. You fill in a verdict for each case: approve, reject, or edit (with a
   required note).
3. An apply command writes `review.status`, `reviewedOn`, and the note back
   into each case file, and changes nothing else.
4. The apply command refuses a case whose question or answer changed since the
   batch was rendered.

Nothing in the build waits for your review.

### Coverage gate and report (REQ-223), staleness report (REQ-225)

The mechanic list is the distinct `701.N` / `702.N` prefixes in the committed
index, excluding 701.1 and 702.1. That is 258 mechanics today (M1).

A committed excluded list holds the Q-007 answer. A case covers a mechanic
when one of its deciding rule ids sits under that mechanic.

A mechanic with no `draft`, `approved`, or `needs-edit` case fails the gate.
The coverage command also rewrites `coverage.json`, which holds counts only.

The staleness report compares each case's stored hashes with the committed
data. It lists stale cases and cases awaiting a query-vector re-freeze. It
never gates.

## Measurements

Every measurement was taken in this worktree on 2026-10-06 against committed
data. Two gitignored inputs were copied from the main checkout, read-only:

- `apps/backend/data/models/` (the local embedder);
- `apps/backend/data/cr/source.txt` (the 2026-08-07 Comprehensive Rules,
  used only to name mechanics and find the ones newer than the index).

`node_modules` is symlinked from the main checkout and is gitignored. No live
model call, no network, no data refresh, no rule-index rebuild. The scratch
scripts are kept in `measure/`.

| # | What | Command | Result |
| --- | --- | --- | --- |
| M1 | Mechanics in the committed rule index | `node PRD/work/rules-test-harness/measure/mechanics.mjs --json PRD/work/rules-test-harness/measure/mechanics-result.json` | **258**: 67 keyword actions (701.2–701.68) and 191 keyword abilities (702.2–702.192), no gaps. The index has no `702.N.` heading entries, only subrules. All 258 ids match the 2026-08-07 CR heading names. The CR has 263; the 5 not in the index are 701.69 Heal, 701.70 Recruit, 702.193 Power-up, 702.194 Teamwork, 702.195 Storied |
| M1b | Official answer pools | same | 277 `Example:` lines across 215 rule entries; 78,734 WotC rulings over 19,854 cards; 37,564 cards in the card-detail index. `Example:` lines in the hard areas: copies 707 23, multiplayer 801 15, triggers 603 12, layers 613 12, double-faced 712 10, resolution 608 9, two-headed giant 810 9, replacement/prevention 614–616 15, continuous effects 611 6, Commander 903 5, combat 508–510 7, SBA 704 3 (126 in total) |
| M2 | Mechanics with a WotC ruling on a card carrying the keyword | same | **226** of 258. 20 mechanics have an `Example:` line. 28 mechanics appear on no card's Scryfall `keywords` field (basic actions such as Destroy, Sacrifice, Cast, Exile; plus Planeswalk, Set in Motion, Abandon, Vote, The Ring Tempts You, Face a Villainous Choice, Harness, Absorb, Poisonous, Daybound and Nightbound, Space Sculptor, Visit, ∞) |
| M3 | Best official answer route per mechanic | `node PRD/work/rules-test-harness/measure/answer-routes.mjs` | 226 via a keyword-card ruling. 30 via a ruling on a card whose oracle text names the mechanic (approximate: a case-by-case check is needed that the ruling is about the mechanic). 0 via an `Example:` line alone. **2** via the rule's own text only (701.32 Set in Motion, 702.59 Recover). Of the 18 gold cases, only 702.19 Trample is covered by a 701/702 deciding rule. The intake's "Regenerate already covered" does not hold under derived tags: that case cites 614.4 |
| M4 | Joke-only candidates | `node PRD/work/rules-test-harness/measure/text-search.mjs` plus inline `node -e` over the card-detail and rulings indexes | 701.51 Open an Attraction: 46 cards, 15 with rulings. 701.52 Roll to Visit: 3 cards, 1 with rulings. 702.158 Space Sculptor: Space Beleren, 8 rulings. 702.159 Visit: 0 by keyword, 56 cards naming "visit", 24 with rulings. **702.186 ∞ is real**: on two Infinity Stone cards (oracle ids `92cfba68-…`, 3 rulings dated 2025-09-19, and `b175e826-…`). **701.45 Assemble** (Unstable Contraptions) is on 25 cards and was not in the intake's list. The card-detail build keeps every English paper card, Un-sets included (`scripts/build-card-metadata.mjs` `shouldIncludeCard`), and carries no acorn or set field. So committed data cannot settle legality |
| M5 | Newer-than-index mechanics on committed cards | inline `node -e` over `cardDetailByOracleId.json.br` keywords | Heal 33 cards (15 with rulings), Recruit 10 (10), Power-up 37 (0), Teamwork 17 (0), Storied 9 (9): **106 cards** a player can attach today whose mechanic rule is missing from every prompt |
| M6 | Gold cases whose deciding rule reaches the prompt (cap 10) | `npm run eval:worked-solutions`; `EMBEDDING_PROVIDER=mock npm run eval:worked-solutions`; each timed with `/usr/bin/time -p` | **16/18** with the local embedder (18/18 ranked semantically). Misses: `panharmonicon-controller-not-entering-permanent` (603.2), `restoration-angel-blink-resets-counters` (400.7). The lexical pass gives 14/18. Wall time is 0.68 s lexical and 1.05 s semantic for all 18, including data load |
| M7 | Can the card check be absolute? | inline `node -e` over `cardRulingsByOracleId.json.br`; `apps/backend/src/prompt/normalization.ts` constants | The most rulings on one card is 32, against `MAX_RULINGS_PER_CARD` 100. The largest single card's rulings section is 8,937 characters, against `MAX_RULINGS_SECTION_CHARS` 1,000,000. No card is truncated |
| M8 | Live cost per case | inline `node -e` over `apps/backend/src/eval/answer-quality/results.json` | `gpt-4.1` at cap 10: 57,327 input and 7,614 output tokens over 18 answers, $0.1756, so **$0.0098 per answer** (measured). `totalCostUsd` $0.6275 equals the answer calls exactly: **judge usage was never recorded**. The judge estimate from the run's own assumptions (`scripts/eval-answer-quality.mjs`: 1,500 input and 800 output tokens at $1.25/$10.00) is $0.0099 per lone call. So a routine case is about **$0.02** and 400 cases about **$8**. This is an estimate, higher than the intake's $5–6 |
| M9 | Frozen-vector footprint | `ls -la` and `node -e` on `apps/backend/src/eval/fixtures/frozen-query-embeddings.json` | 9 vectors of 384 dimensions in 81,915 bytes, about 9.1 KB each, so about **3.6 MB** for 400 cases in the same JSON encoding |
| M10 | Line-level grep of the IDs the proposal amends or relies on | `grep -rnE "REQ-177\|REQ-18[5-9]\|REQ-190\|NFR-018" PRD/ apps/backend/src/eval/ scripts/ --exclude-dir=rules-test-harness` | **219** hit lines; disposition per line in `## Cross-cutting disposition` |
| M11 | New IDs unused | `grep -rl "REQ-22[2-5]" PRD/ --exclude-dir=rules-test-harness`; `grep -rnE '(^\|[^A-Z-])Q-00[78]' PRD/` | REQ-222 to REQ-225: 0 files. Q-007, Q-008: unused (the highest Q in use is Q-006). REQ-220 and REQ-221 are left to the deferred package |
| M12 | Eval fixtures | `ls apps/backend/src/eval/fixtures/*.fixture.json \| wc -l` | 31 |
| M13 | Rule-index date | `grep -l -i 'effective as of' apps/backend/data/*.json` | none. The index carries no CR date; the git log last touched it 2026-09-05. The intake's "2026-06-05" is not verifiable from committed data |

### Run-1 size, from the measurements

| Block | Cases | Basis |
| --- | --- | --- |
| Migrated gold set | 18 | unchanged |
| One per real mechanic | **252** | 258 (M1) − 5 excluded (Q-007 recommendation) − 1 already covered (Trample, M3). The split is 64 keyword actions and 188 keyword abilities |
| Hard-area depth | ~120 | ~50 unused `Example:` lines (126 in the hard areas, M1b, about 10 already used) + ~55 two-card WotC rulings + the 2 tester cases as tier 3 (+ up to 13 more tier 3 per Q-008; the recommendation is 0) |
| **Total** | **~390** | the owner's "~400" |

Acceptance targets that depend on authoring, such as "at least a third of the
depth block is `does-not-work`", are authoring targets. They are counted by
the coverage report at build, not set from a measurement here.

## Findings the owner should know

1. **∞ Infinity is not joke-only.** It is on Infinity Stone cards with official
   rulings, so run 1 should cover it (M4).
2. **The intake missed Assemble.** It is an Unstable mechanic on 25 cards (M4).
   The card data cannot tell acorn from non-acorn, so the excluded list is your
   call (Q-007).
3. **Recorded live cost leaves out the judge.** REQ-188's "$0.63 actual" covers
   the answers only. REQ-188 and REQ-189 now require judge usage to be
   recorded (M8).
4. **Five mechanics are missing from every prompt.** Heal, Recruit, Power-up,
   Teamwork and Storied are in the newer Comprehensive Rules, and 106 attachable
   cards carry them, but their rules are not in the committed index (M5). This
   is a finding for the deferred rules-data refresh, not for this run.
5. **Thin mechanics are thinner than the intake said, but fewer.** Only two
   mechanics lack any official card ruling route (M3). The intake's ~9 "thin"
   mechanics mostly have a ruling on a card whose text names them, which still
   needs checking case by case.

## Material assumptions (preparation-contract ladder)

| # | Assumption | Rung and evidence |
| --- | --- | --- |
| A1 | The 18 migrated cases are `approved` | Rung 5, preserve behavior: they score in today's baseline (REQ-185 notes; `results.json`). This is stated in the REQ-185 slot so you can edit it |
| A2 | Case files stay flat in `apps/backend/src/eval/worked-solutions/` under their names | Rung 2: `preparation.test.ts` reads six by path, and `scripts/eval-worked-solutions.mjs` reads the folder |
| A3 | The offline gate runs as tests already inside `quality:check` (`coverage:check` or `test:scripts`) | Rung 3: the REQ-177 benchmark gate is `ragRetrievalBenchmark.test.ts` |
| A4 | Frozen vectors follow REQ-181's JSON fixture; the build may choose a more compact encoding if determinism holds | Rungs 3 and 4; about 3.6 MB at today's encoding (M9) |
| A5 | When card data changes a case's query text, the case is reported as needing a re-freeze and is not failed | Rung 4, smallest reversible. Owner decision: staleness never blocks `data:refresh-pr`. A missing vector on a new case does fail |
| A6 | The routine lineup is `gpt-4.1` at cap 10 | The probe recommendation; the deployed model and cap (`scripts/aws-deploy.sh`, REQ-190). Owner confirms in the REQ-188 and REQ-190 slots |
| A7 | Coverage counts `draft`, `approved`, and `needs-edit`; `rejected` does not | Rung 4. Owner decision 4 ("at least one case") read as "a non-rejected case" |
| A8 | Rejected cases stay in the corpus with status `rejected` | Rung 4: dedup still sees them; git keeps the history either way |
| A9 | The cited-rule check says "not in the committed index", not "made up" | Rung 1, evidence: the index lags the CR (M1) |
| A10 | The coverage report names mechanics by rule number, with a best-effort name from the first subrule's text | Rung 6: no new data file. The index has no heading entries (M1) and the raw CR is gitignored |
| A11 | `snapshot` hashes the rule-index file instead of storing a rules date | Rung 1, evidence: no date in committed data (M13) |
| A12 | `npm run eval:worked-solutions` keeps its behavior and reads all non-rejected cases through the v2 loader | Rung 1: REQ-185's constraint that it "keeps working unchanged" |
| A13 | The REQ-177 benchmark is untouched by corpus growth | Rung 2: `rag-retrieval-benchmark.json` embeds its own 6 gold copies (`grep -c '"source": "gold"'` gives 6) |

Two genuine decision blockers went to the owner as Q-007 and Q-008. Each
changes scope and has no PRD basis, and taking the smaller option would
silently decide it.

## Slices (ordered, for map-out)

Each slice applies the PRD truth for the IDs it implements, in the build's
apply-by-intent step.

| Slice | Delivers | Applies | Done when |
| --- | --- | --- | --- |
| A | Format v2 schema and loader (`scripts/lib/gold-cases.mjs`), dedup, derived tags, `snapshot` hashing, migration of the 18, `cards` for every tier in `buildCaseRequest`, README rewrite | REQ-185 | The 18 migrated cases have byte-identical question and answer text (a test diff). `eval:worked-solutions` still reports 16/18 with the same two misses. `preparation.test.ts`, the benchmark, and the context-eval fixtures pass unchanged |
| B | Offline prompt gate: card check, frozen-vector build command and file, ratchet baseline and raise command, state-fact check, wired into `quality:check` | REQ-222, NFR-018, goals line, system-map Eval harness and new entry | The gate passes on the 18 with a baseline of 16 hits. A planted dropped-card and a planted lost rule each fail it. No network or model call (the test fails if the embedder is invoked) |
| C | Live runner: selection flags, approved and non-stale filter, prompt hash, per-case merge, judge usage, default `gpt-4.1` at cap `[10]`, ranking skipped for one model, unknown-rule-id assertion | REQ-186, REQ-187, REQ-188, REQ-189, REQ-190, system-map answer-quality | The dry run prints selection and cost with no network call when there is no key. Unit tests cover the merge, selection, and ranking skip. The regression guard still passes |
| D | Review command (render batches) and apply command | REQ-224 | Round-trip test: render, fill, apply changes only `review.*`. Each refusal case is tested |
| E | Coverage command and gate, excluded list (per Q-007), `coverage.json`, staleness command | REQ-223, REQ-225 | The gate fails with the 252 uncovered mechanics listed before slice F, which is expected; map-out may stage the gate as report-only until F lands. The staleness report is clean on unchanged data |
| F | 252 mechanic cases as `draft`; map-out may split by family (701 actions 64; 702.2–702.100; 702.101–702.192) | — | The coverage gate passes. Every case passes the card check. The ratchet baseline is recorded |
| G | ~120 hard-area cases as `draft` (at least a third `does-not-work`), the 2 tester cases as tier-3 drafts (Q1 via 614.1a, 616.1, 616.1e, 616.1f; Q2 via 514.1, 514.2, 514.3a), plus any Q-008 tier-3 drafts | — | The coverage report shows the depth counts. The ratchet baseline is re-recorded at the end. No live run is needed to merge |

The order is the intake's. Slice E's gate cannot pass until F, so map-out
decides whether E lands report-only or E and F ship together.

## Risks

- **Review load.** About 372 new drafts is a large review. Batches grouped by
  mechanic keep each sitting short. Run 2 is sized to your review budget.
- **Text-route mechanics.** For the 30 mechanics that only have a text-matched
  ruling (M3), authoring must confirm the ruling is about the mechanic. If it
  is not, the answer falls back to the rule's own text (tier 1).
- **Live cost is still an estimate.** Judge usage has never been recorded
  (M8). The first live run that records it replaces the estimate.
- **The frozen-vector file is about 3.6 MB.** It lives under `src/eval/`,
  never in `apps/backend/data/`. The build should confirm Lambda packaging
  does not pick it up.

## Cross-cutting disposition

One quoted grep (M10), at line level, over `PRD/`, `apps/backend/src/eval/`,
and `scripts/`. The package's own folder is excluded. One row per hit line.

- "Amends" means the line is a `-` line in a `GATE-QUESTIONS.md` diff.
- "Kept verbatim" means the line stays true inside an amended entry.
- "Build changes" means a code comment or doc outside `PRD/sections/` that
  the named slice updates.

`PRD/sections/in-depth/README.md` has no hit for any of the eight IDs; its row
is added at the end.

Hits: 219 lines.

| Hit | IDs | Line (trimmed) | Disposition |
| --- | --- | --- | --- |
| `PRD/instructions/receipts/image-first-cards-2026-09-05.md:219` | NFR-018 | \| 4 \| gate-qc \| sonnet \| failed \| `? → 42` \| FAIL loop 1/3: REQ-175 new route confli… | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/hybrid-rule-retrieval-2026-09-06.md:57` | REQ-177 | `REQ-177`, `REQ-181`, `NFR-002`, `NFR-017` (including the owner's edit | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/hybrid-rule-retrieval-2026-09-06.md:125` | REQ-177 | `REQ-022`, `REQ-032`, `REQ-177`, `REQ-181`, `NFR-002`, `NFR-017`, | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/hybrid-rule-retrieval-2026-09-06.md:151` | REQ-177 | \| 3 \| define \| opus \| ok \| `0 → 69` \| `STATUS.refined`, board row under `## refined`… | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/hybrid-rule-retrieval-2026-09-06.md:165` | REQ-177 | \| 6 \| build (attempt 3, review loop 1) \| sonnet \| ok \| `0 → 80` (one stream-watchdog … | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/ai-answer-quality-baseline-2026-09-07.md:20` | REQ-190 | (REQ-190's measured note is the recorded run that decision needs), and | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/ai-answer-quality-baseline-2026-09-07.md:35` | REQ-185, REQ-190, NFR-018 | REQ-185 through REQ-190 (`functional-requirements.md`), NFR-018 | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/ai-answer-quality-baseline-2026-09-07.md:100` | REQ-185 | \| REQ-185 \| `functional-requirements.md` \| present (`### REQ-185`, line 4295) \| | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/ai-answer-quality-baseline-2026-09-07.md:101` | REQ-186 | \| REQ-186 \| `functional-requirements.md` \| present (`### REQ-186`, line 4321) \| | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/ai-answer-quality-baseline-2026-09-07.md:102` | REQ-187 | \| REQ-187 \| `functional-requirements.md` \| present (`### REQ-187`, line 4350) \| | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/ai-answer-quality-baseline-2026-09-07.md:103` | REQ-188 | \| REQ-188 \| `functional-requirements.md` \| present (`### REQ-188`, line 4376) \| | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/ai-answer-quality-baseline-2026-09-07.md:104` | REQ-189 | \| REQ-189 \| `functional-requirements.md` \| present (`### REQ-189`, line 4413) \| | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/ai-answer-quality-baseline-2026-09-07.md:105` | REQ-190 | \| REQ-190 \| `functional-requirements.md` \| present (`### REQ-190`, line 4439) \| | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/ai-answer-quality-baseline-2026-09-07.md:106` | NFR-018, REQ-185 | \| REQ-146 amendment \| `functional-requirements.md` \| present (`### REQ-146`, line 3473,… | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/ai-answer-quality-baseline-2026-09-07.md:107` | NFR-018 | \| NFR-018 \| `non-functional-requirements.md` \| present (`### NFR-018`, line 285) \| | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/ai-answer-quality-baseline-2026-09-07.md:108` | NFR-018, REQ-185 | \| `## Eval harness` summary \| `system-map.md` \| present (line 472, cites NFR-018/REQ-18… | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/ai-answer-quality-baseline-2026-09-07.md:126` | REQ-185, NFR-018 | \| 3 \| define \| opus \| ok \| `0 → 53` \| `STATUS.refined`, README `status: refined`, bo… | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/ai-answer-quality-baseline-2026-09-07.md:127` | NFR-018, REQ-185 | \| 4 \| gate-qc \| sonnet \| ok \| `0 → 44` \| PASS, no findings: 4/4 `Current:` excerpts … | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/ai-answer-quality-baseline-2026-09-07.md:129` | REQ-185, REQ-188, REQ-186 | \| 4 \| gate-qc (build half, attempt 1) \| sonnet \| failed → define (loop 1 of 3) \| `0 →… | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/ai-answer-quality-baseline-2026-09-07.md:130` | REQ-185 | \| 3 \| define (build half, attempt 1 — loop 1 of 3) \| opus \| ok \| `0 → 52` (node self-… | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/ai-answer-quality-baseline-2026-09-07.md:131` | REQ-185 | \| 4 \| gate-qc (build half, attempt 2) \| sonnet \| ok \| `0 → 45` (node self-reported 39… | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/ai-answer-quality-baseline-2026-09-07.md:132` | REQ-185, REQ-188, REQ-186, REQ-189, NFR-018 | \| 5 \| plan \| sonnet \| ok \| `0 → 57` (node self-reported 34) \| `GAMEPLAN.md` + five s… | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/ai-answer-quality-baseline-2026-09-07.md:133` | REQ-185, REQ-188, REQ-186, REQ-189, NFR-018 | \| 6 \| build \| sonnet \| failed → parked (build blocker: two human-only criteria) \| `0 … | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/ai-answer-quality-baseline-2026-09-07.md:135` | REQ-185 | \| — \| driver (owner in session, lock not held; instrument corrected) \| — \| ok \| `n/a … | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/ai-answer-quality-baseline-2026-09-07.md:138` | REQ-189, REQ-186, REQ-177 | \| 7 \| review \| opus \| failed → build (loop 1 of 2) \| `0 → 63` (node self-reported 58)… | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/ai-answer-quality-baseline-2026-09-07.md:139` | REQ-177, REQ-189 | \| 6 \| build (attempt 3 — review loop 1 of 2) \| sonnet \| ok \| `0 → 58` (node self-repo… | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/ai-answer-quality-baseline-2026-09-07.md:140` | REQ-186 | \| 7 \| review (attempt 2) \| opus \| ok \| `0 → 41` (node self-reported 38) \| Verdict `a… | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/rag-rule-retrieval-2026-09-05.md:53` | REQ-177 | - **Slice A** (REQ-177) — made the recall ruler trustworthy: the relevance | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/rag-rule-retrieval-2026-09-05.md:105` | REQ-177 | - **REQ-177** (new) — `functional-requirements.md` (report/harness parity, the | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/rag-rule-retrieval-2026-09-05.md:131` | NFR-018 | REQ-168/NFR-018 dangling-citation repoints match the accepted | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/rag-rule-retrieval-2026-09-05.md:141` | REQ-177 | ~L3887 explicitly scopes it out of REQ-177 through REQ-181 and defers it to | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/rag-rule-retrieval-2026-09-05.md:215` | REQ-177 | \| 3 \| define \| opus \| ok \| `0 → 73` \| `STATUS.refined`; `DESIGN-BRIEF.md` (5-step ga… | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/rag-rule-retrieval-2026-09-05.md:216` | REQ-177 | \| 4 \| gate-qc \| sonnet \| ok \| `0 → 54` \| PASS, no findings (attempt 1): all Current … | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/rag-rule-retrieval-2026-09-05.md:219` | REQ-177 | \| 4 \| gate-qc \| sonnet \| failed \| `0 → 103 — cap 60 + grace 30 exhausted` \| build-ha… | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/rag-rule-retrieval-2026-09-05.md:222` | REQ-177 | \| 4 \| gate-qc \| sonnet \| ok \| `0 → 16` \| build-half re-check attempt 3 (run `graph-2… | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/rag-rule-retrieval-2026-09-05.md:223` | REQ-177 | \| 5 \| plan \| sonnet \| ok \| `0 → 40` \| `GAMEPLAN.md` + five slice docs (A `slice-a-tr… | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/rule-excerpt-cap-ten-2026-09-10.md:65` | REQ-185, REQ-188, REQ-190 | REQ-181, REQ-182, REQ-185, REQ-188, REQ-190), | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/rule-excerpt-cap-ten-2026-09-10.md:66` | NFR-018 | `PRD/sections/non-functional-requirements.md` (NFR-018), | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/rule-excerpt-cap-ten-2026-09-10.md:100` | NFR-018 | \| 3 \| define \| opus \| ok \| `0 → 55` \| commit `06b6699` on run branch (pushed) — DESI… | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/prompt-context-refinement-2026-08-31.md:73` | NFR-018 | 5. **Worked-solutions eval set** (NFR-018; slice E). A committed set of real | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/prompt-context-refinement-2026-08-31.md:81` | NFR-018 | FLOW-023/NFR-018 edits) was authored inside this graph run (nodes 3–4, two | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/prompt-context-refinement-2026-08-31.md:89` | NFR-018 | `PRD/sections/non-functional-requirements.md` (NFR-018) all carry their full, | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/prompt-context-refinement-2026-08-31.md:119` | NFR-018 | FLOW-023/NFR-018 confirmed present and accurate at `HEAD`; no edit made. | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/prompt-context-refinement-2026-08-31.md:226` | NFR-018 | \| 3 \| define \| opus \| ok \| `0 → 43` \| `DESIGN-BRIEF.md` + `RAG-DEFERRED.md` written;… | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/prompt-context-refinement-2026-08-31.md:229` | NFR-018 | \| 4 \| gate-qc \| sonnet \| ok \| `0 → 20` \| PASS (re-grade): REQ-094/REQ-167 mutually c… | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/instructions/receipts/compact-data-extracts-2026-09-09.md:138` | REQ-185 | REQ-180, REQ-175, REQ-185, REQ-195, REQ-196 amendments present per the | No change: historical receipt (plain-language standard is forward-only; receipts are never edited) |
| `PRD/sections/functional-requirements.md:401` | REQ-190 | - System 3's scoring mechanism moves from lexical-only to semantic-primary with lexical fa… | Leaves true: the cited instrument still exists with the same non-gating answer posture and the deployed cap of ten |
| `PRD/sections/functional-requirements.md:606` | REQ-177 | - the relevance report and the eval harness model production retrieval identically — same … | Leaves true: relies on REQ-177's benchmark/baseline, which this proposal reuses as a pattern and does not change |
| `PRD/sections/functional-requirements.md:607` | REQ-177 | - a committed offline benchmark of labelled question-to-rule pairs records recall@5 and MR… | Leaves true: relies on REQ-177's benchmark/baseline, which this proposal reuses as a pattern and does not change |
| `PRD/sections/functional-requirements.md:619` | REQ-177 | - REQ-177 (report/harness parity and the committed benchmark) | Leaves true: relies on REQ-177's benchmark/baseline, which this proposal reuses as a pattern and does not change |
| `PRD/sections/functional-requirements.md:3560` | NFR-018, REQ-185, REQ-190 | - do not grow this into a general-purpose LLM evaluation framework; the broad answer-quali… | Leaves true: the cited instrument still exists with the same non-gating answer posture and the deployed cap of ten |
| `PRD/sections/functional-requirements.md:3566` | REQ-188 | - REQ-188 (the answer-quality baseline whose non-gating, confirmation-gated posture this s… | Leaves true: the cited instrument still exists with the same non-gating answer posture and the deployed cap of ten |
| `PRD/sections/functional-requirements.md:3568` | REQ-188 | - the existing `prompt:preview` tooling extracts assembled prompt text from the mock provi… | Leaves true: the cited instrument still exists with the same non-gating answer posture and the deployed cap of ten |
| `PRD/sections/functional-requirements.md:3968` | REQ-177 | - This also resolves the **symptom** half of the mechanic-keyword observation: a mechanic … | Leaves true: relies on REQ-177's benchmark/baseline, which this proposal reuses as a pattern and does not change |
| `PRD/sections/functional-requirements.md:4167` | REQ-177 | ### REQ-177 | Leaves true: relies on REQ-177's benchmark/baseline, which this proposal reuses as a pattern and does not change |
| `PRD/sections/functional-requirements.md:4200` | REQ-177 | - measured on the committed benchmark (REQ-177), multi-card recall@5 lands within 0.10 of … | Leaves true: relies on REQ-177's benchmark/baseline, which this proposal reuses as a pattern and does not change |
| `PRD/sections/functional-requirements.md:4201` | REQ-177 | - measured on the committed benchmark, clean-query recall@5 does not regress below the REQ… | Leaves true: relies on REQ-177's benchmark/baseline, which this proposal reuses as a pattern and does not change |
| `PRD/sections/functional-requirements.md:4208` | REQ-177 | - REQ-177 (the benchmark and repaired report this gate is measured on) | Leaves true: relies on REQ-177's benchmark/baseline, which this proposal reuses as a pattern and does not change |
| `PRD/sections/functional-requirements.md:4225` | REQ-177 | - measured on the committed benchmark (REQ-177), clean and multi-card recall@5 do not regr… | Leaves true: relies on REQ-177's benchmark/baseline, which this proposal reuses as a pattern and does not change |
| `PRD/sections/functional-requirements.md:4232` | REQ-177 | - REQ-177 (the benchmark this no-regression gate is measured on) | Leaves true: relies on REQ-177's benchmark/baseline, which this proposal reuses as a pattern and does not change |
| `PRD/sections/functional-requirements.md:4247` | REQ-177 | - measured on the committed benchmark (REQ-177), clean and multi-card recall@5 do not regr… | Leaves true: relies on REQ-177's benchmark/baseline, which this proposal reuses as a pattern and does not change |
| `PRD/sections/functional-requirements.md:4256` | REQ-177 | - REQ-177 (the benchmark this no-regression gate is measured on) | Leaves true: relies on REQ-177's benchmark/baseline, which this proposal reuses as a pattern and does not change |
| `PRD/sections/functional-requirements.md:4279` | REQ-177 | - the shipped quantised model's clean and multi-card recall@5 are re-measured on the commi… | Leaves true: relies on REQ-177's benchmark/baseline, which this proposal reuses as a pattern and does not change |
| `PRD/sections/functional-requirements.md:4291` | REQ-177 | - REQ-177 (the committed benchmark this is gated on) | Leaves true: relies on REQ-177's benchmark/baseline, which this proposal reuses as a pattern and does not change |
| `PRD/sections/functional-requirements.md:4314` | REQ-177 | - under `EMBEDDING_PROVIDER=mock`, and on any embedding failure, scoring is byte-identical… | Leaves true: relies on REQ-177's benchmark/baseline, which this proposal reuses as a pattern and does not change |
| `PRD/sections/functional-requirements.md:4316` | REQ-177 | - measured on the committed benchmark (REQ-177), clean recall@5 is at or above the 2026-09… | Leaves true: relies on REQ-177's benchmark/baseline, which this proposal reuses as a pattern and does not change |
| `PRD/sections/functional-requirements.md:4325` | REQ-177 | - REQ-177 (the committed benchmark this is gated against) | Leaves true: relies on REQ-177's benchmark/baseline, which this proposal reuses as a pattern and does not change |
| `PRD/sections/functional-requirements.md:4334` | REQ-190 | - the cap moved from 5 to 10 excerpts on 2026-09-09 (`rule-excerpt-cap-ten`) on REQ-190's … | Leaves true: the cited instrument still exists with the same non-gating answer posture and the deployed cap of ten |
| `PRD/sections/functional-requirements.md:4385` | REQ-185 | ### REQ-185 | Leaves true: kept verbatim inside amended REQ-185 |
| `PRD/sections/functional-requirements.md:4388` | NFR-018 | - Description: The answer-quality baseline (NFR-018) grades model answers against a commit… | Amends: rewritten in the REQ-185 slot |
| `PRD/sections/functional-requirements.md:4395` | NFR-018 | - the set grows only through tier 1 or tier 2, under the same licensing resolution NFR-018… | Amends: rewritten in the REQ-185 slot |
| `PRD/sections/functional-requirements.md:4398` | NFR-018 | - the gold cases remain committed evaluation data; they never enter a live prompt, never r… | Leaves true: kept verbatim inside amended REQ-185 |
| `PRD/sections/functional-requirements.md:4402` | NFR-018 | - NFR-018 (the worked-solutions validation track this extends) | Leaves true: kept verbatim inside amended REQ-185 |
| `PRD/sections/functional-requirements.md:4403` | REQ-186 | - REQ-186 (the judge that grades against these cases) | Leaves true: kept verbatim inside amended REQ-185 |
| `PRD/sections/functional-requirements.md:4406` | REQ-190 | - measured 2026-09-07: the gold set holds 18 cases (6 pre-existing plus 12 seeded at build… | Leaves true: kept verbatim inside amended REQ-185 |
| `PRD/sections/functional-requirements.md:4407` | REQ-177 | - the same six original cases are already the gold half of REQ-177's 156-pair retrieval be… | Leaves true: kept verbatim inside amended REQ-185 |
| `PRD/sections/functional-requirements.md:4411` | REQ-186 | ### REQ-186 | Leaves true: kept verbatim inside amended REQ-186 |
| `PRD/sections/functional-requirements.md:4417` | REQ-187 | - layer 2, the lone model judge: one call per answer, carrying the question, the assembled… | Amends: rewritten in the REQ-186 slot |
| `PRD/sections/functional-requirements.md:4420` | REQ-189, REQ-188 | - layer 2b, the blind ranking (`judgeBlindRanking`): for each gold case at each excerpt ca… | Amends: rewritten in the REQ-186 slot |
| `PRD/sections/functional-requirements.md:4421` | REQ-187 | - the rubric text carries a revision identifier (REQ-187's `RUBRIC_REVISION`), recorded in… | Leaves true: kept verbatim inside amended REQ-186 |
| `PRD/sections/functional-requirements.md:4425` | REQ-188 | - never auto-gate or fail a build on a judge score (REQ-188) | Leaves true: kept verbatim inside amended REQ-186 |
| `PRD/sections/functional-requirements.md:4427` | REQ-190, REQ-188 | - the judge never sees which excerpt-cap leg or which answer model produced an answer, in … | Leaves true: kept verbatim inside amended REQ-186 |
| `PRD/sections/functional-requirements.md:4430` | REQ-185 | - REQ-185 (the gold cases and their reference answers) | Leaves true: kept verbatim inside amended REQ-186 |
| `PRD/sections/functional-requirements.md:4431` | REQ-187 | - REQ-187 (the rubric the judge scores against) | Leaves true: kept verbatim inside amended REQ-186 |
| `PRD/sections/functional-requirements.md:4432` | REQ-188 | - REQ-188 (the command that runs it and its cost posture) | Leaves true: kept verbatim inside amended REQ-186 |
| `PRD/sections/functional-requirements.md:4436` | REQ-185 | - grounding the judge in the published worked solution is what makes a model judge defensi… | Amends: rewritten in the REQ-186 slot |
| `PRD/sections/functional-requirements.md:4440` | REQ-187 | ### REQ-187 | Leaves true: kept verbatim inside amended REQ-187 |
| `PRD/sections/functional-requirements.md:4450` | REQ-186 | - the deterministic assertion `namesGoldRuleId` (REQ-186 layer 1) is recorded per case alo… | Leaves true: kept verbatim inside amended REQ-187 |
| `PRD/sections/functional-requirements.md:4451` | REQ-185 | - no axis for WotC card-ruling citation is defined: at first ship the gold set's tier-2 ca… | Leaves true: kept verbatim inside amended REQ-187 |
| `PRD/sections/functional-requirements.md:4452` | REQ-186 | - the four axis names, their 0/1/2 definitions, and the rubric revision identifier live in… | Leaves true: kept verbatim inside amended REQ-187 |
| `PRD/sections/functional-requirements.md:4455` | REQ-188 | - no numeric pass threshold is set on any axis (REQ-188); the first run's scores are the r… | Leaves true: kept verbatim inside amended REQ-187 |
| `PRD/sections/functional-requirements.md:4458` | REQ-186 | - REQ-186 (the judge that applies these axes) | Leaves true: kept verbatim inside amended REQ-187 |
| `PRD/sections/functional-requirements.md:4459` | REQ-185 | - REQ-185 (the reference answers they are scored against) | Leaves true: kept verbatim inside amended REQ-187 |
| `PRD/sections/functional-requirements.md:4460` | REQ-189 | - REQ-189 (the artifact that records them) | Leaves true: kept verbatim inside amended REQ-187 |
| `PRD/sections/functional-requirements.md:4466` | REQ-188 | ### REQ-188 | Leaves true: kept verbatim inside amended REQ-188 |
| `PRD/sections/functional-requirements.md:4473` | REQ-190, REQ-186 | - the answer models are a lineup, given as a repeatable `--model` option; the first-ship l… | Amends: rewritten in the REQ-188 slot |
| `PRD/sections/functional-requirements.md:4474` | REQ-185 | - the prompt is the one a player's lookup would get: `preparePromptInput` receives the com… | Amends: rewritten in the REQ-188 slot |
| `PRD/sections/functional-requirements.md:4479` | REQ-189 | - wall-clock latency per call is recorded in the artifact (REQ-189), so the bake-off canno… | Leaves true: kept verbatim inside amended REQ-188 |
| `PRD/sections/functional-requirements.md:4483` | REQ-189 | - every run records, in the artifact (REQ-189): gold-set case ids, tiers, and count, the a… | Amends: rewritten in the REQ-188 slot |
| `PRD/sections/functional-requirements.md:4485` | REQ-177 | - **no numeric quality target is set by this requirement.** The first live run's scores, t… | Leaves true: kept verbatim inside amended REQ-188 |
| `PRD/sections/functional-requirements.md:4494` | REQ-186 | - REQ-186 (the judging it invokes) | Leaves true: kept verbatim inside amended REQ-188 |
| `PRD/sections/functional-requirements.md:4495` | REQ-189 | - REQ-189 (the artifact it writes) | Leaves true: kept verbatim inside amended REQ-188 |
| `PRD/sections/functional-requirements.md:4496` | REQ-190 | - REQ-190 (the excerpt-cap legs it runs) | Leaves true: kept verbatim inside amended REQ-188 |
| `PRD/sections/functional-requirements.md:4497` | NFR-018 | - NFR-018 (the non-gating validation track this belongs to) | Leaves true: kept verbatim inside amended REQ-188 |
| `PRD/sections/functional-requirements.md:4499` | REQ-185 | - measured 2026-09-07, offline, over the actual 18-case gold set (REQ-185) through the rea… | Leaves true: kept verbatim inside amended REQ-188 |
| `PRD/sections/functional-requirements.md:4501` | REQ-190 | - measured 2026-09-07 (three live runs, $0.67 / $0.69 / $0.63 actual against the ≈$2.50 es… | Leaves true: kept verbatim inside amended REQ-188 |
| `PRD/sections/functional-requirements.md:4503` | REQ-189 | ### REQ-189 | Leaves true: kept verbatim inside amended REQ-189 |
| `PRD/sections/functional-requirements.md:4509` | REQ-188, REQ-186 | - it carries: the run metadata REQ-188 requires (gold-set case ids, tier-1/tier-2 counts, … | Amends: rewritten in the REQ-189 slot |
| `PRD/sections/functional-requirements.md:4519` | REQ-186 | - only the dated human-reviewed conclusion becomes durable project history (REQ-186, REQ-1… | Leaves true: kept verbatim inside amended REQ-189 |
| `PRD/sections/functional-requirements.md:4521` | REQ-187 | - REQ-187 (the axes it records) | Leaves true: kept verbatim inside amended REQ-189 |
| `PRD/sections/functional-requirements.md:4522` | REQ-188 | - REQ-188 (the run metadata it records) | Leaves true: kept verbatim inside amended REQ-189 |
| `PRD/sections/functional-requirements.md:4523` | REQ-177 | - REQ-177 (the committed-benchmark-result convention it follows) | Leaves true: kept verbatim inside amended REQ-189 |
| `PRD/sections/functional-requirements.md:4529` | REQ-190 | ### REQ-190 | Leaves true: kept verbatim inside amended REQ-190 |
| `PRD/sections/functional-requirements.md:4532` | REQ-188 | - Description: An answer-quality run may answer the same gold case at more than one System… | Leaves true: kept verbatim inside amended REQ-190 |
| `PRD/sections/functional-requirements.md:4536` | REQ-190 | - with no override, the assembled prompt is byte-identical to the prompt production has al… | Leaves true: kept verbatim inside amended REQ-190 |
| `PRD/sections/functional-requirements.md:4538` | REQ-189 | - the run artifact records the model and cap per leg and reports the headline correctness … | Leaves true: kept verbatim inside amended REQ-190 |
| `PRD/sections/functional-requirements.md:4543` | REQ-186 | - the judge is not told which cap or which model produced an answer (REQ-186) | Leaves true: kept verbatim inside amended REQ-190 |
| `PRD/sections/functional-requirements.md:4547` | REQ-188 | - REQ-188 (the run that executes the legs) | Leaves true: kept verbatim inside amended REQ-190 |
| `PRD/sections/functional-requirements.md:4550` | REQ-190 | - measured 2026-09-07 (build): `preparation.ts` lines 228, 272, 317, and 355 each held the… | Leaves true: kept verbatim inside amended REQ-190 |
| `PRD/sections/functional-requirements.md:4551` | REQ-185 | - the design brief's earlier measurement (2026-09-06, six committed CR cases only) found t… | Leaves true: kept verbatim inside amended REQ-190 |
| `PRD/sections/functional-requirements.md:4552` | REQ-188, REQ-185, NFR-018 | - measured 2026-09-07 (run 3 of the answer-quality baseline, semantic ranking, tier-2 card… | Leaves true: kept verbatim inside amended REQ-190 |
| `PRD/sections/system-map/game-rules-retrieval.md:2` | REQ-177 | Backed by: DEC-029, DEC-030, DEC-032, DEC-045, DEC-046, DEC-047, REQ-022, REQ-032, REQ-177… | Leaves true: retrieval and the cap of ten are unchanged |
| `PRD/sections/system-map/game-rules-retrieval.md:121` | REQ-190 | - System 3 is capped at ten supplemental excerpts per request (raised from five on 2026-09… | Leaves true: retrieval and the cap of ten are unchanged |
| `PRD/sections/system-map/game-rules-retrieval.md:134` | REQ-177 | or AI call — and by a committed offline labelled benchmark (REQ-177). The human | Leaves true: retrieval and the cap of ten are unchanged |
| `PRD/sections/system-map/game-rules-retrieval.md:135` | REQ-177 | relevance report is held to the harness's verdict by a parity test (REQ-177). | Leaves true: retrieval and the cap of ten are unchanged |
| `PRD/sections/goals-and-non-goals.md:83` | NFR-018, REQ-185, REQ-188 | - automated answer-quality gating in `npm run quality:check`: combo enrichment's effect on… | Amends: rewritten in the NFR-018 slot (goals diff) |
| `PRD/sections/open-questions.md:12` | REQ-177 | - Answered (2026-09-05, RAG retrieval gameplan): option two. Per-card Scryfall `keywords` … | Leaves true: answered Q-001 note about the REQ-180 keyword signal; untouched |
| `PRD/sections/system-map.md:88` | REQ-190 | - Summary: Selects up to 10 supplemental rule excerpts per request (raised from 5 on 2026-… | Leaves true: the deployed cap of ten is unchanged |
| `PRD/sections/system-map.md:475` | NFR-018, REQ-185 | - Backed by: DEC-025, DEC-030, DEC-032, DEC-047, REQ-032, NFR-018, REQ-185 | Amends: rewritten in the REQ-222 slot (system-map Eval harness diff) |
| `PRD/sections/system-map.md:494` | REQ-177 | - Summary: Digestible before/after report (System 2 topics, System 3 top-10 with scores, r… | Leaves true: the retrieval relevance report and REQ-177 parity are unchanged |
| `PRD/sections/system-map.md:496` | REQ-177 | - Backed by: DEC-047, REQ-032, REQ-177 | Leaves true: the retrieval relevance report and REQ-177 parity are unchanged |
| `PRD/sections/system-map.md:503` | NFR-018, REQ-185, REQ-186, REQ-187, REQ-188, REQ-189, REQ-190 | - Backed by: NFR-018, REQ-185, REQ-186, REQ-187, REQ-188, REQ-189, REQ-190 | Leaves true: kept as context in the REQ-188 slot's system-map diff (its Summary line 501 is rewritten; the Backed-by list is unchanged) |
| `PRD/sections/non-functional-requirements.md:300` | NFR-018 | ### NFR-018 | Leaves true: kept verbatim inside amended NFR-018 |
| `PRD/sections/non-functional-requirements.md:302` | REQ-185, REQ-190 | - Description: Today prompt and retrieval quality is regression-tested by golden fixtures … | Amends: rewritten in the NFR-018 slot |
| `PRD/sections/non-functional-requirements.md:306` | REQ-188 | - This is a quality/validation track that reports where the prompt fails hard cases and gu… | Amends: rewritten in the NFR-018 slot |
| `PRD/sections/non-functional-requirements.md:307` | REQ-188 | - The retrieval half stays offline and makes no provider call. The answer half necessarily… | Amends: rewritten in the NFR-018 slot |
| `PRD/sections/non-functional-requirements.md:308` | REQ-185 | - A case enters the set only with a published, citable correct answer; a hand-authored ans… | Amends: rewritten in the NFR-018 slot |
| `PRD/sections/non-functional-requirements.md:312` | REQ-185 | - REQ-185 (the gold set this track's cases now serve as) | Amends: rewritten in the NFR-018 slot |
| `PRD/sections/non-functional-requirements.md:313` | REQ-186, REQ-187, REQ-188, REQ-189, REQ-190 | - REQ-186, REQ-187, REQ-188, REQ-189, REQ-190 (the answer-quality baseline built on that s… | Leaves true: kept verbatim inside amended NFR-018 |
| `PRD/sections/non-functional-requirements.md:315` | REQ-177 | - Distinct from RAG/corpus retrieval: this external data validates and tunes the prompt; i… | Leaves true: kept verbatim inside amended NFR-018 |
| `PRD/sections/non-functional-requirements.md:316` | REQ-177 | - The RAG gameplan's own measurement work (REQ-177) commits an offline labelled question-t… | Leaves true: kept verbatim inside amended NFR-018 |
| `PRD/sections/non-functional-requirements.md:317` | REQ-185 | - Measured 2026-09-07 (build): the gold set grew from 6 to 18 committed cases (REQ-185) wh… | Leaves true: kept verbatim inside amended NFR-018 |
| `PRD/ideasForLater/combo-context-validation/IDEA.md:35` | NFR-018 | rulebook worked-solutions track (NFR-018) covers a different slice; these are | No change: parked-idea note citing NFR-018 as related work; still true |
| `PRD/ideasForLater/combo-context-validation/IDEA.md:64` | NFR-018 | partial-combo, shipped via PR #152). Extends the validation goal behind NFR-018. | No change: parked-idea note citing NFR-018 as related work; still true |
| `PRD/ideasForLater/combo-context-validation/README.md:12` | NFR-018 | Follow-up to `prompt-context-refinement`; extends NFR-018. | No change: parked-idea note citing NFR-018 as related work; still true |
| `PRD/ideasForLater/combo-context-validation/HANDOFF.md:78` | NFR-018 | - **Related pattern:** the just-shipped worked-solutions eval (NFR-018) at | No change: parked-idea note citing NFR-018 as related work; still true |
| `PRD/work/STATUS.md:52` | REQ-177, REQ-185 | \| [combo-context-validation](../ideasForLater/combo-context-validation/) \| ideation — in… | No change: parked-idea note citing NFR-018 as related work; still true |
| `apps/backend/src/eval/benchmark/step1-baseline.json:3` | REQ-177 | "requirement": "REQ-177", | Leaves true: REQ-177 benchmark, parity test, and baseline are unchanged |
| `apps/backend/src/eval/ragRetrievalBenchmark.ts:1` | REQ-177 | // REQ-177 (Step 1 of the RAG gameplan): a committed, offline, deterministic | Leaves true: REQ-177 benchmark, parity test, and baseline are unchanged |
| `apps/backend/src/eval/ragRetrievalBenchmark.ts:15` | REQ-177 | // offline and reproducible, is the point of REQ-177. | Leaves true: REQ-177 benchmark, parity test, and baseline are unchanged |
| `apps/backend/src/eval/ragRetrievalBenchmark.ts:199` | REQ-177 | * REQ-177: thrown when a run asked for the semantic (or hybrid) benchmark | Leaves true: REQ-177 benchmark, parity test, and baseline are unchanged |
| `apps/backend/src/eval/ragRetrievalBenchmark.ts:230` | REQ-177 | * REQ-177: fails loudly (`EmbedderUnavailableError`) the moment `embed()` | Leaves true: REQ-177 benchmark, parity test, and baseline are unchanged |
| `apps/backend/src/eval/worked-solutions/README.md:1` | NFR-018, REQ-185 | # Worked-solutions gold set (NFR-018, REQ-185) | Build changes (slice A): README rewritten per REQ-185's README criterion; not a PRD/sections file, so no gate slot |
| `apps/backend/src/eval/worked-solutions/README.md:89` | REQ-186 | modules, and `PRD/sections/functional-requirements.md` REQ-186 through | Build changes (slice A): README rewritten per REQ-185's README criterion; not a PRD/sections file, so no gate slot |
| `apps/backend/src/eval/worked-solutions/README.md:90` | REQ-190 | REQ-190 for the full requirements. | Build changes (slice A): README rewritten per REQ-185's README criterion; not a PRD/sections file, so no gate slot |
| `apps/backend/src/eval/worked-solutions/README.md:142` | REQ-185 | - Loaded and validated by `scripts/lib/gold-cases.mjs` (REQ-185), the single | Build changes (slice A): README rewritten per REQ-185's README criterion; not a PRD/sections file, so no gate slot |
| `apps/backend/src/eval/ragRetrievalBenchmark.test.ts:27` | REQ-177 | describe("Backend - Eval - RAG retrieval benchmark (REQ-177)", () => { | Leaves true: REQ-177 benchmark, parity test, and baseline are unchanged |
| `apps/backend/src/eval/ragRetrievalBenchmark.test.ts:57` | REQ-177 | it("stays at or above the committed Step 1 baseline (REQ-177/178/179/180 no-regression gat… | Leaves true: REQ-177 benchmark, parity test, and baseline are unchanged |
| `apps/backend/src/eval/ragRetrievalBenchmark.test.ts:74` | REQ-177 | describe("scoreBenchmarkSemantic (REQ-177: no silent lexical-under-semantic-label)", () =>… | Leaves true: REQ-177 benchmark, parity test, and baseline are unchanged |
| `apps/backend/src/eval/answer-quality/artifact.test.ts:59` | REQ-189 | describe("Backend - Eval - Answer quality - artifact (REQ-189)", () => { | Build adds tests (slice C) for the merge |
| `apps/backend/src/eval/answer-quality/artifact.test.ts:224` | REQ-189 | describe(".gitignore (REQ-189)", () => { | Leaves true: comment's claim survives the proposal |
| `apps/backend/src/eval/answer-quality/assertions.test.ts:4` | REQ-186 | describe("Backend - Eval - Answer quality - assertions (REQ-186 layer 1)", () => { | Build adds tests (slice C) under the same describe |
| `apps/backend/src/eval/answer-quality/judge.ts:1` | REQ-186 | // Answer-quality judge (REQ-186 layers 2 and 2b). | Leaves true: comment's claim survives the proposal |
| `apps/backend/src/eval/answer-quality/judge.ts:5` | REQ-187 | // as the reference answer, and the rubric (REQ-187). It scores the four | Leaves true: comment's claim survives the proposal |
| `apps/backend/src/eval/answer-quality/judge.ts:16` | REQ-188 | // (REQ-188) trustworthy. | Leaves true: comment's claim survives the proposal |
| `apps/backend/src/eval/answer-quality/judge.ts:46` | REQ-186 | * (REQ-186) -- never `OPENAI_MODEL`, never an answer model -- mirroring the | Leaves true: comment's claim survives the proposal |
| `apps/backend/src/eval/answer-quality/judge.ts:55` | REQ-186 | /** True when the configured judge model id also appears in the answer-model lineup (REQ-1… | Leaves true: comment's claim survives the proposal |
| `apps/backend/src/eval/answer-quality/judge.ts:123` | REQ-186 | * One call per answer (REQ-186 layer 2). Returns an explicit `undetermined` | Leaves true: comment's claim survives the proposal |
| `apps/backend/src/eval/answer-quality/judge.ts:225` | REQ-186 | * The blind side-by-side rank (REQ-186 layer 2b): for one gold case at one | Build changes (slice C): ranking only when two or more answer models (REQ-186) |
| `apps/backend/src/eval/answer-quality/rubric.test.ts:4` | REQ-187 | describe("Backend - Eval - Answer quality - rubric (REQ-187)", () => { | Leaves true: comment's claim survives the proposal |
| `apps/backend/src/eval/answer-quality/assertions.ts:1` | REQ-186 | // Answer-quality deterministic assertions (REQ-186 layer 1). | Build changes (slice C): adds the unknown-rule-id assertion (REQ-186 layer 1) |
| `apps/backend/src/eval/answer-quality/assertions.ts:5` | REQ-189 | // recorded per case per leg alongside the judge's axis scores (REQ-189) and | Leaves true |
| `apps/backend/src/eval/answer-quality/artifact.ts:1` | REQ-189 | // Answer-quality run artifact (REQ-189). | Build changes (slice C): merge-per-case writer (REQ-189) |
| `apps/backend/src/eval/answer-quality/artifact.ts:35` | REQ-189 | /** One leg is one answer model at one excerpt cap (REQ-189). */ | Leaves true: comment's claim survives the proposal |
| `apps/backend/src/eval/answer-quality/artifact.ts:39` | REQ-187 | /** Count of this leg's gold cases scoring Correctness 2 -- the only headline figure (REQ-… | Build changes (slice C): headline counts per tier (REQ-187) |
| `apps/backend/src/eval/answer-quality/artifact.ts:71` | REQ-189 | * The committed file carries no model prose (REQ-189): no answer text, no | Leaves true: comment's claim survives the proposal |
| `apps/backend/src/eval/answer-quality/artifact.ts:83` | REQ-189 | throw new Error(`${path}.${key} is disallowed model prose in the committed artifact (REQ-1… | Leaves true: comment's claim survives the proposal |
| `apps/backend/src/eval/answer-quality/artifact.ts:101` | REQ-189 | /** Every field REQ-189 requires the committed artifact to carry. */ | Build changes (slice C): required-field list gains REQ-189's new fields |
| `apps/backend/src/eval/answer-quality/judge.test.ts:26` | REQ-186 | describe("Backend - Eval - Answer quality - judge (REQ-186)", () => { | Leaves true: comment's claim survives the proposal |
| `apps/backend/src/eval/answer-quality/rubric.ts:1` | REQ-187 | // Answer-quality rubric (REQ-187). | Leaves true: comment's claim survives the proposal |
| `apps/backend/src/eval/answer-quality/rubric.ts:8` | REQ-187 | // product (REQ-187 constraint). | Leaves true: comment's claim survives the proposal |
| `apps/backend/src/eval/answer-quality/rubric.ts:11` | REQ-186, REQ-189 | // artifact (REQ-186, REQ-189). Axes are added or changed only by amending | Leaves true: comment's claim survives the proposal |
| `apps/backend/src/eval/answer-quality/rubric.ts:12` | REQ-187 | // REQ-187 and bumping this revision, so a score change and a rubric change | Leaves true: comment's claim survives the proposal |
| `apps/backend/src/eval/answer-quality/rubric.ts:72` | REQ-187 | * Bumped only when an axis definition changes (REQ-187). Two runs are | Leaves true: comment's claim survives the proposal |
| `apps/backend/src/eval/answer-quality/rubric.ts:74` | REQ-186, REQ-189 | * (REQ-186, REQ-189). | Leaves true: comment's claim survives the proposal |
| `apps/backend/src/eval/answer-quality/rubric.ts:78` | REQ-186 | /** Renders the rubric as the exact text sent to the judge (REQ-186 layer 2). */ | Leaves true: comment's claim survives the proposal |
| `apps/backend/src/eval/answer-quality/rubric.ts:94` | REQ-187 | * The run's single headline figure (REQ-187): the count of gold cases | Build changes (slice C): headline per tier over latest graded records (REQ-187) |
| `apps/backend/src/eval/retrievalReportParity.test.ts:1` | REQ-177 | // REQ-177 acceptance criterion: an automated test asserts the relevance | Leaves true: REQ-177 benchmark, parity test, and baseline are unchanged |
| `apps/backend/src/eval/retrievalReportParity.test.ts:6` | REQ-177 | // Before REQ-177, `retrievalReportInputs.ts` built no card-detail index at | Leaves true: REQ-177 benchmark, parity test, and baseline are unchanged |
| `apps/backend/src/eval/retrievalReportParity.test.ts:89` | REQ-177 | describe("Backend - Eval - report/harness parity (REQ-177)", () => { | Leaves true: REQ-177 benchmark, parity test, and baseline are unchanged |
| `apps/backend/src/eval/contextEvaluationHarness.test.ts:122` | REQ-177 | // REQ-176/REQ-177: `context.ts` resolves a card's descriptive block from an | Leaves true: REQ-177 benchmark, parity test, and baseline are unchanged |
| `apps/backend/src/eval/contextEvaluationHarness.test.ts:132` | REQ-177 | // card-intrinsic fields differently (REQ-177). | Leaves true: REQ-177 benchmark, parity test, and baseline are unchanged |
| `apps/backend/src/eval/fixtureCardDetail.ts:1` | REQ-177 | // REQ-177: single canonical card-detail-index builder for eval fixtures. | Leaves true: REQ-177 benchmark, parity test, and baseline are unchanged |
| `scripts/package-lambda.sh:31` | REQ-177 | # cold start — the same class of measurement/deploy-integrity bug REQ-177 | Leaves true: REQ-177 benchmark, parity test, and baseline are unchanged |
| `scripts/eval-answer-quality.mjs:1` | REQ-188, REQ-190, NFR-018 | // Answer-quality baseline run (REQ-188, REQ-190; NFR-018). | Leaves true |
| `scripts/eval-answer-quality.mjs:3` | REQ-185 | // Bake-off: every gold case (scripts/lib/gold-cases.mjs, REQ-185) answered | Build changes (slice C): 'every gold case' becomes the selected approved cases (REQ-188 case selection) |
| `scripts/eval-answer-quality.mjs:73` | REQ-188 | /** Published list rates, USD per million tokens (re-checked before a live run; REQ-188's … | Leaves true: comment's claim survives the proposal |
| `scripts/eval-answer-quality.mjs:82` | REQ-188 | // Output-token assumptions behind the printed dry-run estimate only (REQ-188's | Leaves true: comment's claim survives the proposal |
| `scripts/eval-answer-quality.mjs:94` | REQ-188 | * the lineup (REQ-188): the answer-model lineup is a run option, not an | Build changes (slice C): default lineup becomes gpt-4.1 alone (REQ-188) |
| `scripts/eval-answer-quality.mjs:127` | REQ-186 | /** Judge model is its own explicit setting (REQ-186), defaulting to gpt-5 -- never OPENAI… | Leaves true: comment's claim survives the proposal |
| `scripts/eval-answer-quality.mjs:236` | REQ-188 | /** A character-count cost estimate (REQ-188's M3 methodology). Never a target -- the live… | Leaves true: comment's claim survives the proposal |
| `scripts/eval-answer-quality.mjs:286` | REQ-189 | * committed `AnswerQualityResults` shape (REQ-189) -- per-leg headline | Build changes (slice C): per-case merge and per-tier headline (REQ-187, REQ-189) |
| `scripts/eval-answer-quality.mjs:337` | REQ-189 | // the committed per-case-per-leg schema (REQ-189) -- stripped here. | Build changes (slice C): per-case record gains prompt hash, judge usage, unknown rule ids (REQ-189) |
| `scripts/eval-answer-quality.mjs:356` | REQ-188, REQ-190, REQ-186, REQ-189 | * The full live evaluation loop (REQ-188, REQ-190, REQ-186, REQ-189): for | Build changes (slice C): loop skips ranking for a one-model lineup (REQ-186) |
| `scripts/eval-answer-quality.mjs:548` | REQ-188 | * model-access check (REQ-188): the dry run performs it when a key is | Leaves true: comment's claim survives the proposal |
| `scripts/rag-retrieval-benchmark.mjs:1` | REQ-177 | // REQ-177 — run the committed, offline RAG retrieval benchmark (156 labeled | Leaves true: REQ-177 benchmark, parity test, and baseline are unchanged |
| `scripts/rag-retrieval-benchmark.mjs:56` | REQ-177 | requirement: "REQ-177", | Leaves true: REQ-177 benchmark, parity test, and baseline are unchanged |
| `scripts/package-lambda.test.mjs:5` | REQ-177 | // measurement/deploy-integrity bug REQ-177 fixed for the benchmark. This | Leaves true: REQ-177 benchmark, parity test, and baseline are unchanged |
| `scripts/eval-worked-solutions.test.mjs:42` | REQ-185 | test("loadCases reads every *.case.json file, sorted, and rejects a malformed one (via the… | Build changes (slice A): malformed-case fixture updated to the v2 validator |
| `scripts/lib/prompt-fidelity.mjs:2` | REQ-185, REQ-188 | // call `preparePromptInput` (REQ-185, REQ-188): the worked-solutions | Leaves true: still shared by both readers |
| `scripts/lib/prompt-fidelity.mjs:34` | REQ-185 | * The request a gold case is asked as (REQ-185). A tier-2 case tests whether | Build changes (slice A): every case's `cards` attached, not only tier 2 (REQ-185 every-card-attached) |
| `scripts/lib/gold-cases.mjs:1` | REQ-185 | // Shared gold-case loader and validator (REQ-185). | Build changes (slice A): loader becomes the format-v2 validator (REQ-185); comment updated |
| `scripts/lib/gold-cases.mjs:25` | REQ-185 | * REQ-185 requires the gold set to hold at least these, each tier 1. | Leaves true: the six original cases stay required, now migrated (slice A keeps the list) |
| `scripts/eval-worked-solutions.mjs:1` | NFR-018 | // Worked-solutions retrieval check (NFR-018). | Leaves true: comment's claim survives the proposal |
| `scripts/eval-worked-solutions.mjs:7` | REQ-185 | // REQ-185) -- and runs it through preparePromptInput, the unmodified | Leaves true: reads cases through the shared loader (now v2) |
| `scripts/eval-worked-solutions.mjs:56` | REQ-185 | * the shared gold-case loader (REQ-185), so this retrieval check and the | Leaves true |
| `scripts/eval-worked-solutions.mjs:77` | NFR-018 | "WORKED-SOLUTIONS RETRIEVAL CHECK (NFR-018)", | Leaves true: comment's claim survives the proposal |
| `scripts/eval-answer-quality.test.mjs:372` | REQ-185 | test("buildCaseRequest asks a tier-1 case bare and attaches a tier-2 case's cited card the… | Build changes (slice A): buildCaseRequest test asserts every case's cards attached |
| `scripts/eval-answer-quality.test.mjs:448` | REQ-188 | test("REGRESSION GUARD: eval:answer-quality is never wired into any gate script (REQ-188)"… | Leaves true: regression guard kept (REQ-188) |
| `PRD/sections/in-depth/README.md` | (none) | 0 hits for any of the eight IDs; its answer-quality lines (421–423, 579) cite DEC-161's combo A/B | No change: `gameState` maps onto the existing In-Depth request without changing it |

## Citations (recorded, never opened)

- `PRD/work/probe-rules-test-harness/` (`GRAPH-BRIEF.md`,
  `FINDINGS-repo-baseline.md`, `FINDINGS-mechanic-coverage.md`,
  `FINDINGS-external-sources.md`)
- `PRD/work/properRulesTestHarness/gameplanIdeas.md`
- the deferred `niche-interaction-rule-tests` package and its draft PR #266
  (the tester cases' CR derivations are taken from the intake's own text, not
  from that package)
- the prior-run receipts listed in `IDEA.md` `## Prior run`
