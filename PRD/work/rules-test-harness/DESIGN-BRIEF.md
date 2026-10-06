# DESIGN-BRIEF — rules-test-harness (run 1)

**What this is:** the design for run 1 of the rules test harness. Today the
app's AI is graded on 18 hard rules cases. After run 1 it is checked against
393 cases: one for every real Magic mechanic, plus 120 in the twelve
rules areas players get wrong most, such as copies, layers, replacement
effects, triggers, combat, and multiplayer (the full list is in the REQ-185
slot).

**What you need to do:** answer `GATE-QUESTIONS.md` — eleven accept/edit/reject
slots and two questions (which mechanics are joke-only, and how many tier-3
cases run 1 carries). Then merge the docs PR.

**What it changes for you:** two free checks run on every pull request and
block it when an attached card stops reaching the AI, or when a deciding rule
that used to reach the AI stops reaching it. Grading the AI's actual answer
stays on demand and costs about two cents per case. By default it re-grades
only the cases whose prompt or official answer changed, using the model and
setting players actually get. The first such run also re-grades today's 18
cases, about 35 cents, because their scores predate that fingerprint. You approve every case before it counts: the 18 existing cases
by accepting REQ-185, every new case in batches, after merge, whenever you
choose.

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
   - a state-fact check, with every `gameState` parsed by the In-Depth
     request's own schema.
3. **Live runner changes:**
   - case selection (`--changed` by default);
   - a per-case prompt hash;
   - per-case merge of the scores file;
   - judge usage recorded;
   - routine lineup `gpt-4.1` at cap 10;
   - the blind ranking skipped for a one-model run;
   - the free check for cited rule ids that are not in the rule index (test
     layers 5 and 6).
4. **Owner review flow**: render pending cases in batches (new drafts, and
   approved cases whose official text changed), then apply your verdicts.
   Approving a case records the fingerprint of the text you approved.
5. **Coverage report and mechanic coverage gate**, with the committed excluded
   list, plus the **staleness report**.
6. **Mechanic cases**: 255 drafts at the recommended exclusion list (Q-007),
   and the coverage gate switched on in `quality:check` once they exist.
7. **Hard-area depth**: 120 drafts — 60 from unused CR `Example:` lines, 58
   from WotC rulings that name a second card, and the two tester cases as
   tier-3 drafts (M16).

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

The intake is this run's starting brief (`intake/GRAPH-BRIEF.md`). It was
written on 2026-10-06 from your planning notes and from the probe, the
investigation that measured them. It is evidence, not a decision: anything it
proposes still needs your accept.

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
  `rulesIndexDate`, because the committed index carries no rules date (M13, A11).
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

The 18 cases migrate as `approved` (assumption A1). That is the one carve-out
from the rule that no agent sets `approved`: your accept of REQ-185 is the
approval, and the slice A migration only writes it down. The REQ-185
constraint, the REQ-185 description, REQ-224's description and its
no-agent criterion, and A19 all carry the same exception. Every later case
reaches `approved` only through the review apply command.

The loader requires `review.reviewedOn`, and the build cannot know the date
you accepted REQ-185. So each of the 18 records the migration date: the date
slice A's migration commit is made. Its review note names the approval
source: "approved by the owner's accept of REQ-185 at the define gate;
migrated to format version 2". REQ-185's migrated-cases criterion, REQ-224's
no-agent criterion, A1, and slice A's done-when say the same.

**Every reader of the two renamed fields (slice A).** A grep of `scripts/`
and `apps/backend/src/eval/` for `workedSolution` and
`expectedSupplementalRuleIds` finds these case-file readers, which slice A
moves to `expected.answer` and `expected.decidingRuleIds`:

- `scripts/eval-answer-quality.mjs`, lines 408, 426, 431 (deciding rule ids)
  and 433, 464, 480 (reference answer);
- `scripts/eval-worked-solutions.mjs`, lines 65 and 120 (deciding rule ids);
- `scripts/lib/gold-cases.mjs`, lines 9, 12, 55–62 (the loader's checks and
  comment), which slice A rewrites for format version 2;
- the test case objects in `scripts/lib/gold-cases.test.mjs` (lines 11, 12,
  28, 29, 60–75) and `scripts/eval-worked-solutions.test.mjs` (lines 30, 31,
  60, 94, 97);
- `apps/backend/src/eval/worked-solutions/README.md`, rewritten in slice A.

The other hits are not case-file reads and stay as they are.
`apps/backend/src/eval/contextEvaluationHarness.ts`, `relevanceReport.test.ts`,
`contextEvaluationHarness.test.ts`, `scripts/build-frozen-query-embeddings.mjs`
and `apps/backend/src/eval/fixtures/README.md` read the context-eval
fixtures' own `expectedSupplementalRuleIds` field, a separate format.
`judge.ts`, `assertions.ts`, and the transcript type in `artifact.ts` use the
old names as parameter and transcript keys; only their callers change.
`artifact.ts` line 68 keeps `workedSolution` on the no-prose list on purpose
(REQ-189).

**What `cards` each migrated case carries (A14).** Every card the question
names as a real card is attached, which is REQ-185's every-named-card rule
applied to today's questions:

- the three tier-2 cases carry their cited card, exactly as
  `buildCaseRequest` attaches it today (Panharmonicon, Restoration Angel,
  Sensei's Divining Top);
- `token-created-by-name-uses-oracle-card` carries Tarmogoyf (oracle id
  `45900b2f-f6a9-4c42-9642-008f3c1cf6dd`), because its question names that
  real card;
- the other 14 tier-1 cases carry an empty list: their questions describe
  hypothetical cards ("a 4/3 creature", "an Aura that says…") and name none.

Measured, not reasoned (M15): attaching Tarmogoyf keeps 111.11 in that
case's prompt, and the run stays 16/18 with the same two misses
(`panharmonicon-controller-not-entering-permanent`,
`restoration-angel-blink-resets-counters`). Every attached card's oracle text
and all its rulings reach the prompt (Tarmogoyf 5/5). The one visible effect
is that the token case's prompt text changes. That does not single it out for
re-grading, because none of today's 18 graded records in `results.json`
carries a prompt hash or a reference-answer hash (the per-case record gains
both in slice C). A record without both hashes counts as ungraded in the
headline and is selected by `--changed`, so the first routine run re-grades
all 18 cases, the token case among them: about $0.35 at the recorded cost
basis (18 × ($0.0098 measured per answer + $0.0099 estimated per judge
call), M8).

**How `gameState` reaches the prompt (A15).** `gameState` is null or an
In-Depth game context in the exact shape the In-Depth request already carries
(`gameContext` in `apps/backend/src/validation/askAiRequest.ts`). That
schema is TypeScript and the case loader is a plain `.mjs` that runs under
`node --test` without tsx, so the validation is split in two. The loader
checks the structural rules below (no `owner` on a stack item, no `caster`
off the stack). A backend vitest test in slice B parses every non-null
`gameState` in the corpus with the In-Depth `gameContextSchema` and fails,
naming the case, on any it rejects (A3, A15). A case with a `gameState` is asked as an In-Depth
(`mode: "game"`) request, with its `cards` placed in those zones; a case
without one is asked as a lookup with `cards` attached. Slice A builds both
in `buildCaseRequest` (`scripts/lib/prompt-fidelity.mjs`), the one request
builder the offline gate (slice B) and the live runner (slice C) share. Today
it attaches only a tier-2 case's cited card. The facts map as follows,
checked against the request type in code:

| Fact the ruling depends on | Request field | What the prompt prints |
| --- | --- | --- |
| Which zone a card is in | `gameContext.zones.<zone>[]` (stack, battlefield, hand, graveyard, exile, library, command) | a `ZONE:` section per populated zone |
| Stack order | the order of `zones.stack[]`, bottom first | `ZONE: STACK (BOTTOM TO TOP)`, `Stack item N` |
| Who cast a stack item | `zones.stack[].caster` | `caster:` |
| Who owns a card that is not on the stack | `zones.<zone>[].owner`, every zone but the stack | `owner:` |
| What a card targets | `zones.<zone>[].targets[]` | `targets:` |
| Who controls a card, when that differs from its owner | `zones.<zone>[].contextNotes` (up to 280 characters), for example "controlled by Player 2" | `contextNotes:` |
| Turn phase, combat step, active player, life and counters | `turnPhase`, `combatStep`, `activePlayer`, `players[]` | the general game-context lines |

The request type has no controller field, so a controller fact rides the
card's note. That needs no product change; a dedicated controller field
would be a separate In-Depth decision.

The prompt prints `owner:` only for cards outside the stack
(`apps/backend/src/prompt/promptFormatting.ts`, `formatNonStackZoneSections`,
line 255) and `caster:` only for stack items (`formatStackSection`). The
request schema accepts both fields in every zone, but the one it does not
print would be a fact no check can see. So the case loader rejects a
`gameState` that sets `owner` on a stack item or `caster` on a card outside
the stack; a fact like that goes in the card's `contextNotes`. The In-Depth
request itself is unchanged.

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
  migrated cases, the baseline reproduces today's 16/18 (M6), also with
  the migrated `cards` lists (M15).
- **State-fact check.** Applies only where `gameState` is set. First, a
  backend vitest test parses the case's `gameState` with the In-Depth
  `gameContextSchema`; a case the schema rejects fails the gate, naming the
  case. This is where the full In-Depth validation happens, because the
  schema is TypeScript and the `.mjs` loader checks only the structural rules
  (A3, A15). Then, for each fact
  in the mapping table above, the field's printed line (for example
  `owner: Player 2` for a battlefield card, `caster: Player 1` and
  `Stack item 2` for a stack item, or the note text) appears in the assembled
  prompt. `owner` is checked on cards outside the stack and `caster` on stack
  items, the only places the loader allows them (A15). A missing line fails
  the gate.

The ranking uses committed frozen query vectors, built by the shipped local
embedder. This follows REQ-181's
`apps/backend/src/eval/fixtures/frozen-query-embeddings.json` and
`npm run eval:build-frozen-query-embeddings`. Frozen vectors are required: a
lexical pass gives 14/18, not production's 16/18 (M6).

**Awaiting a re-freeze (slice B).** The vector build command stores, with
each vector, a SHA-256 hash of the query text (`buildRetrievalQueryText`)
it was embedded from. One function, built in slice B beside the vector
file, rebuilds each case's query text, hashes it, and compares. On a
mismatch the case is awaiting a re-freeze: the gate reports it, does not
score it in the ratchet (neither hit nor miss, whatever the baseline
records), and counts it in the summary line. A card-data refresh that
changes a card's keywords therefore never fails the weekly
`data:refresh-pr`. Slice E's staleness command calls the same function to
list those cases; nothing re-implements the comparison.

### Live runner (REQ-186 to REQ-190)

The runner grades only `approved`, non-stale cases. "Stale" uses one
comparison, owned by slice A: the shared loader computes the hashes REQ-225
names from committed data and reports whether a case's stored `snapshot`
still matches. Slice C's filter, slice D's review render, and slice E's
staleness report all call that function; none re-implements it.

- **Selection.** `--changed` is the default. It picks a case when its prompt
  hash at that model and cap differs from its last graded record, when the
  hash of its current reference answer (`expected.answer`) differs from the
  reference-answer hash that record was judged against, when that record
  carries no prompt hash or no reference-answer hash, or when the case has
  never been graded. Today's 18 records carry neither hash, so the first
  routine run selects all 18, about $0.35 (M8 cost basis, see
  `### Case format version 2`). The reference-answer trigger is what re-grades a case
  whose answer was reworked while its prompt stayed identical, for example a
  tier-1 case whose deciding rule's text changed but does not reach the
  prompt. The alternatives are `--tag`, `--tier`, `--sample N` (seeded) and
  `--all`.
- **Default lineup.** `gpt-4.1` at cap 10. The four-model bake-off and other
  caps are explicit flags.
- **Ranking.** A one-model run skips the blind ranking.
- **Free check.** A deterministic check lists cited rule ids that are not in
  the committed index. These are worded as "not in the committed index",
  because the index lags the newest Comprehensive Rules (M1).
- **Scores file.** `results.json` merges per case: each case's record carries
  its own prompt hash, reference-answer hash (SHA-256 of the
  `expected.answer` it was judged against), timestamp, commit, and the judge's
  token use.
- **Headline.** Per tier over approved, non-stale cases. A case counts
  through its latest graded record only when that record was judged against
  the case's current reference answer (its reference-answer hash matches).
  A case with no such record counts as ungraded; a record without a
  reference-answer hash, as each of today's 18 is, is not such a record, so
  those 18 count as ungraded until the first routine run re-grades them. The ungraded and stale
  counts print beside the headline. Tier 3 is never pooled with the official
  tiers. A stale case's last record stays in `results.json` but is not
  counted, because REQ-225 says a stale case leaves live scoring until you
  re-approve it. Once re-approved, it counts again from re-approval by the
  same rule: at once from its existing record if its answer did not change,
  or, if the answer was reworked, as ungraded until `--changed` re-grades it
  (A22).

### Owner review flow (REQ-224)

1. A render command writes pending cases in batches to a gitignored
   `output/` file. Pending means every `draft`, every `approved` case the
   stale comparison flags (A18), and, on request, `needs-edit` cases. Batches
   are grouped by mechanic, then by rules section. A stale case is marked
   stale, and its entry names each dependency that changed and shows that
   dependency's current committed text.
2. You fill in a verdict for each case: approve, reject, or edit (with a
   required note).
3. An apply command writes `review.status`, `reviewedOn`, and the note back
   into each case file. On an `approve` verdict it also re-records the case's
   `snapshot` hashes from the committed data. It changes no other field. This
   is how a stale approved case returns to live grading: you re-approve it in
   a batch, its hashes now match, and the runner's filter selects it again.
   It is the only command that writes `snapshot` after a case is authored.
4. The apply command refuses a case whose question or answer changed since the
   batch was rendered. It also refuses one whose committed rule, oracle, or
   ruling text changed since the render, so you never approve text you did
   not see.
5. After writing verdicts, the apply command rewrites `coverage.json`, so your
   own review never leaves that file out of date and never fails the next
   pull request. Slice D builds steps 1 to 4; slice E, which creates
   `coverage.json`, adds step 5 (A20).

Nothing in the build waits for your review.

### Coverage gate and report (REQ-223), staleness report (REQ-225)

The mechanic list is the distinct `701.N` / `702.N` prefixes in the committed
index, excluding 701.1 and 702.1. That is 258 mechanics today (M1).

A committed excluded list holds the Q-007 answer. A case covers a mechanic
when one of its deciding rule ids sits under that mechanic.

A mechanic with no `draft`, `approved`, or `needs-edit` case fails the gate.
The coverage command also rewrites `coverage.json`, which holds counts only.
The review apply command rewrites it the same way after writing verdicts
(A20). Slices F and G, which add cases, rerun the coverage command as part
of their done-when. So the gate's out-of-date check fails only when someone
edits a case by hand and does not rerun the coverage command.

The staleness report compares each case's stored hashes with the committed
data. It lists stale cases, through slice A's stale comparison, and cases
awaiting a query-vector re-freeze, through slice B's re-freeze check. It
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
| M4 | Joke-only candidates | `node PRD/work/rules-test-harness/measure/text-search.mjs` plus inline `node -e` over the card-detail and rulings indexes | 701.51 Open an Attraction: 46 cards, 15 with rulings. 701.52 Roll to Visit: 3 cards, 1 with rulings. 702.158 Space Sculptor: Space Beleren, 8 rulings. 702.159 Visit: 0 by keyword, 56 cards naming "visit", 24 with rulings. **702.186 ∞ is real**: 4 committed cards print ∞ in their oracle text, 2 of them with rulings (`text-search.mjs`: `textCards=4`, `textCardsWithRuling=2`). Two are the Infinity Stone cards that carry the ∞ ability: The Soul Stone (`92cfba68-…`, 3 rulings dated 2025-09-19) and The Mind Stone (`b175e826-…`, no rulings). The other two are Un-set cards that print the ∞ symbol in their own text: Urza's Fun House (9 rulings) and Mox Lotus (no rulings). **701.45 Assemble** (Unstable Contraptions) is on 25 cards and was not in the intake's list. The card-detail build keeps every English paper card, Un-sets included (`scripts/build-card-metadata.mjs` `shouldIncludeCard`), and carries no acorn or set field. So committed data cannot settle legality |
| M5 | Newer-than-index mechanics on committed cards | inline `node -e` over `cardDetailByOracleId.json.br` keywords | Heal 33 cards (15 with rulings), Recruit 10 (10), Power-up 37 (0), Teamwork 17 (0), Storied 9 (9): **106 cards** a player can attach today whose mechanic rule is missing from every prompt |
| M6 | Gold cases whose deciding rule reaches the prompt (cap 10) | `npm run eval:worked-solutions`; `EMBEDDING_PROVIDER=mock npm run eval:worked-solutions`; each timed with `/usr/bin/time -p` | **16/18** with the local embedder (18/18 ranked semantically). Misses: `panharmonicon-controller-not-entering-permanent` (603.2), `restoration-angel-blink-resets-counters` (400.7). The lexical pass gives 14/18. Wall time is 0.68 s lexical and 1.05 s semantic for all 18, including data load |
| M7 | Can the card check be absolute? | inline `node -e` over `cardRulingsByOracleId.json.br`; `apps/backend/src/prompt/normalization.ts` constants | The most rulings on one card is 32, against `MAX_RULINGS_PER_CARD` 100. The largest single card's rulings section is 8,937 characters, against `MAX_RULINGS_SECTION_CHARS` 1,000,000. No card is truncated |
| M8 | Live cost per case | inline `node -e` over `apps/backend/src/eval/answer-quality/results.json` | `gpt-4.1` at cap 10: 57,327 input and 7,614 output tokens over 18 answers, $0.1756, so **$0.0098 per answer** (measured). `totalCostUsd` $0.6275 equals the answer calls exactly: **judge usage was never recorded**. The judge estimate from the run's own assumptions (`scripts/eval-answer-quality.mjs`: 1,500 input and 800 output tokens at $1.25/$10.00) is $0.0099 per lone call. So a routine case is about **$0.02** and 400 cases about **$8**. This is an estimate, higher than the intake's $5–6 |
| M9 | Frozen-vector footprint | `ls -la` and `node -e` on `apps/backend/src/eval/fixtures/frozen-query-embeddings.json` | 9 vectors of 384 dimensions in 81,915 bytes, about 9.1 KB each, so about **3.6 MB** for 400 cases in the same JSON encoding |
| M10 | Line-level grep of the IDs the proposal amends or relies on | `grep -rnE "REQ-177\|REQ-18[5-9]\|REQ-190\|NFR-018" PRD/ apps/backend/src/eval/ scripts/ --exclude-dir=rules-test-harness` | **220** hit lines (re-run in define attempt 6, unchanged from attempts 2 to 5); disposition per line in `## Cross-cutting disposition` |
| M11 | New IDs unused | `grep -rl "REQ-22[2-5]" PRD/ --exclude-dir=rules-test-harness`; `grep -rnE '(^\|[^A-Z-])Q-00[78]' PRD/` | REQ-222 to REQ-225: 0 files. Q-007, Q-008: unused (the highest Q in use is Q-006). REQ-220 and REQ-221 are left to the deferred package |
| M12 | Eval fixtures | `ls apps/backend/src/eval/fixtures/*.fixture.json \| wc -l` | 31 |
| M13 | Rule-index date | `grep -l -i 'effective as of' apps/backend/data/*.json` | none. The index carries no CR date; the git log last touched it 2026-09-05. The intake's "2026-06-05" is not verifiable from committed data |
| M15 | Does migrating `cards` move the 16/18 baseline? (attempt 2) | `npx tsx PRD/work/rules-test-harness/measure/migration-cards.mjs` (local embedder, same path as `eval:worked-solutions`), timed with `/usr/bin/time -p` | Today's attachment (tier-2 cited card only): **16/18**, misses `panharmonicon-controller-not-entering-permanent` and `restoration-angel-blink-resets-counters`. Proposed migration (also Tarmogoyf on `token-created-by-name-uses-oracle-card`): **16/18, the same two misses**, under both "every deciding rule" and "at least one deciding rule" counting. Card check on the attached cards: oracle text present for all four; rulings Panharmonicon 9/9, Restoration Angel 3/3, Sensei's Divining Top 2/2, Tarmogoyf 5/5. Only `token-created-by-name-uses-oracle-card` names a real card among the 15 tier-1 questions. 1.61 s wall time for both variants |
| M16 | Hard-area depth pools and their `does-not-work` supply (attempt 2; ruling terms widened to the twelve hard areas in attempt 3, timed with `/usr/bin/time -p`: 2.94 s) | `node PRD/work/rules-test-harness/measure/depth-pool.mjs` | **`Example:` lines** in the hard areas (M1b's sections): 126, of which 13 are already used by the 18 gold cases, leaving **113 unused**; 20 of the 113 are negative-phrased. Unused per area: combat 6, triggers 10, resolution 7, continuous effects 6, layers 10, replacement/prevention 13, SBA 1, copies 21, double-faced 10, multiplayer 15, two-headed giant 9, Commander 5. **Rulings naming a second card** (the full name of another committed card of two or more words, word-bounded; single-word names skipped, so this undercounts): 4,988 rulings over 5,101 card pairs; **2,651** of them match a term for one of the same twelve hard areas (copies 388, layers 21, continuous effects 31, replacement/prevention 308, triggers 1,010, resolution 566, combat 344, SBA 17, double-faced 174, multiplayer 29, two-headed giant 402, Commander 255; a ruling can match several); **1,232** of those 2,651 are negative-phrased (doesn't, can't, won't, isn't, not, never, no longer). Negative phrasing is a proxy for supply only; each case's outcome is set when it is authored |
| M17 | Can a backend vitest test import `scripts/lib/gold-cases.mjs` and `scripts/lib/prompt-fidelity.mjs` with one copy and a green backend typecheck? (define attempt 6) | `/usr/bin/time -p node PRD/work/rules-test-harness/measure/ts-boundary.mjs`. It builds a throwaway tree in the OS temp dir (deleted at the end) mirroring `scripts/lib/` beside `apps/backend/src/eval/`, copies the two committed modules in unchanged, and writes a scratch `apps/backend/tsconfig.json` with the backend's options (extends the real `tsconfig.base.json`: strict; `module`/`moduleResolution` NodeNext, `types` node, `rootDir` src, `include` src, no `allowJs`) | **V1, static import, no declaration:** `tsc --noEmit` exit 2, `error TS7016: Could not find a declaration file for module '../../../../scripts/lib/gold-cases.mjs'` and the same for `prompt-fidelity.mjs` (plus two TS7006 implicit-`any` errors from the untyped results). **V2, static import plus a sibling `gold-cases.d.mts` and `prompt-fidelity.d.mts`:** `tsc --noEmit` exit 0; `tsc` with emit (the backend build) exit 0, so a declaration outside `rootDir` raises no error; `vitest run` exit 0, 1 test passed: it loaded the 18 committed cases from `apps/backend/src/eval/worked-solutions/` and `buildCaseRequest` attached one card to each of the three tier-2 cases. **V3, variable-path dynamic import:** `tsc --noEmit` exit 0 and `vitest run` 1 passed, but every export is typed `any`. 2.20 s wall time for all three variants. V2 is the A3 mechanism |

### Run-1 size, from the measurements

| Block | Cases | Basis |
| --- | --- | --- |
| Migrated gold set | 18 | unchanged |
| One per real mechanic | **255** | 258 mechanics (M1) − 2 excluded at the Q-007 recommendation (701.45 Assemble, 702.158 Space Sculptor) − 1 already covered (702.19 Trample, M3). The split is 66 keyword actions (67 − Assemble) and 189 keyword abilities (191 − Space Sculptor − Trample). Each mechanic Q-007 moves in or out adds or removes one case |
| Hard-area depth | **120** | 60 from the 113 unused hard-area `Example:` lines (M16) + 58 from the 2,651 hard-area rulings that name a second card (M16) + the 2 tester cases as tier 3. 60 + 58 + 2 = 120 |
| **Total** | **393** | 18 + 255 + 120, the owner's "~400" |

How the hard-area block is split (A16):

- **60 `Example:` lines** is about half of the 113 unused (M16). Run 1 takes
  every area's lines before a second from the same rule, so all twelve hard
  areas are represented. SBA has only 1 unused line and supplies 1.
- **58 two-card rulings** come from a pool of 2,651 (M16), weighted toward the
  areas the AI has already been wrong on: replacement-effect ordering,
  cleanup-step timing, the post-2024 combat damage rule 510.1c, and copy effects.
- **Tier 3 and Q-008.** The 2 testers are the only tier-3 drafts at the Q-008
  recommendation. The ceiling of 13 more comes from the intake: its hard-area
  table caps your tier-3 bucket at 15 (`intake/GRAPH-BRIEF.md`, the tier-3
  row of its hard-area table). This brief counts the 2 testers inside that bucket,
  so 15 − 2 = 13 remain. If you choose N more (0 to 13), N of the 58 two-card
  ruling slots become tier-3 drafts instead. Any of the 58 may be the one
  swapped; 13 is a cap on your research load, not a count of eligible slots.
  The block stays 120 and the total stays 393.

**At least a third `does-not-work`** (REQ-185) is an acceptance criterion
with a measured basis. A third of 120 is 40. The two pools hold 20
negative-phrased unused `Example:` lines and 1,232 negative-phrased hard-area
two-card rulings (M16), so 40 is reachable from the rulings pool alone.
Negative phrasing only shows supply. Each case's `outcome` is set when it is
authored, and the coverage report counts cases per `outcome` (REQ-223), which
is how slice G proves the criterion.

## Findings the owner should know

1. **∞ Infinity is not joke-only.** Four committed cards print ∞ and two of
   them have rulings. The ∞ ability itself is on the two Infinity Stone cards
   (The Soul Stone has 3 official rulings; The Mind Stone has none), so run 1
   should cover it (M4).
2. **The intake did not list Assemble.** It is an Unstable mechanic on 25 cards (M4).
   The card data cannot tell acorn from non-acorn, so the excluded list is your
   call (Q-007).
3. **Attractions may be real.** The intake excluded the three Attraction
   mechanics as joke-only. Unfinity cards without the acorn stamp are legal in
   eternal formats, and committed data cannot show which Attraction cards
   carry the stamp. So the Q-007 recommendation now includes them and
   excludes only Assemble and Space Sculptor.
4. **Recorded live cost leaves out the judge.** REQ-188's "$0.63 actual" covers
   the answers only. REQ-188 and REQ-189 now require judge usage to be
   recorded (M8).
5. **Five mechanics are missing from every prompt.** Heal, Recruit, Power-up,
   Teamwork and Storied are in the newer Comprehensive Rules, and 106 attachable
   cards carry them, but their rules are not in the committed index (M5). This
   is a finding for the deferred rules-data refresh, not for this run.
6. **Thin mechanics are thinner than the intake said, but fewer.** Only two
   mechanics lack any official card ruling route (M3). The intake's ~9 "thin"
   mechanics mostly have a ruling on a card whose text names them, which still
   needs checking case by case.

## Material assumptions (preparation-contract ladder)

| # | Assumption | Rung and evidence |
| --- | --- | --- |
| A1 | The 18 migrated cases are `approved`, approved by the owner's accept of REQ-185; this is the one carve-out from "no agent sets `approved`", and the REQ-185 constraint and description, REQ-224's description and no-agent criterion, and A19 all state it. Their `review.reviewedOn` is the migration date (the date slice A's migration commit is made), and their review note names the approval source ("approved by the owner's accept of REQ-185 at the define gate; migrated to format version 2"), because the loader requires `reviewedOn` and the build cannot know the owner's accept date | Rung 5, preserve behavior: they score in today's baseline (REQ-185 notes; `results.json`). This is stated in the REQ-185 slot so you can edit it; an `edit` there that makes them `draft` removes the carve-out |
| A2 | Case files stay flat in `apps/backend/src/eval/worked-solutions/` under their names | Rung 2: `preparation.test.ts` reads six by path, and `scripts/eval-worked-solutions.mjs` reads the folder |
| A3 | The offline gate runs as tests already inside `quality:check`. Every test that needs TypeScript — the real `preparePromptInput`, `buildRetrievalQueryText`, or the In-Depth request schema, directly or through a helper that loads them — is a backend vitest test under `apps/backend/src/eval/`, which `coverage:check` runs. It reads cases through the shared loader `scripts/lib/gold-cases.mjs` and builds requests through `scripts/lib/prompt-fidelity.mjs`, never a second copy, by a static import of each `.mjs`. The backend typecheck (`tsc --noEmit` over `apps/backend/tsconfig.json`: `rootDir: src`, strict, no `allowJs`) rejects that import with TS7016 unless a type declaration sits beside the module, so slice A adds one per module, `scripts/lib/gold-cases.d.mts` and `scripts/lib/prompt-fidelity.d.mts`, declaring the exports backend tests call. A declaration states types, never logic: the tests load the real `.mjs` at run time, so a renamed or removed export fails a test even if its declaration lags. The backend compiler options stay unchanged and `npm run typecheck` stays green. A `test:scripts` test (`node --test`, no tsx) never imports TypeScript and injects fakes instead. Checks that need no TypeScript, such as the coverage gate, may run under either | Rung 3, following the code: the REQ-177 benchmark gate is `apps/backend/src/eval/ragRetrievalBenchmark.test.ts` beside its logic in `ragRetrievalBenchmark.ts`, run by `npm --workspace apps/backend run test:coverage` inside `coverage:check`; `test:scripts` is `node --test scripts/*.test.mjs scripts/lib/*.test.mjs`, and `scripts/eval-answer-quality.test.mjs` injects a fake prompt measure so it "never depends on the real preparePromptInput TS import"; `scripts/lib/prompt-fidelity.mjs` loads TypeScript only inside lazy loader bodies, under tsx. The import mechanism is measured (M17): with the backend's compiler options, a bare import of the two `.mjs` files fails `tsc --noEmit` with TS7016; a sibling `.d.mts` for each makes `tsc --noEmit`, the emitting backend build, and `vitest run` pass, loading the 18 committed cases and building the three tier-2 requests. A variable-path dynamic import also passes, but types every export as `any`, so the typecheck never catches a wrong call; rejected. Precedent: `apps/backend/src/prompt/preparation.test.ts:12-18` copies the six case ids rather than import across the workspace boundary. That test stays as it is, because it copies a fixed list of names, not reading logic. This package departs from it for the loader and the request builder, because REQ-185 requires every reader to read cases through the one shared loader, and a second copy of the loader's checks is the divergence REQ-185 forbids. A frontend test already imports a script across the same boundary (`apps/frontend/src/lib/metadataTransformPolicy.test.ts` imports `scripts/build-card-metadata.mjs`); it needs no declaration only because the frontend sets `allowJs`, which the backend does not |
| A4 | Frozen vectors follow REQ-181's JSON fixture; the build may choose a more compact encoding if determinism holds | Rungs 3 and 4; about 3.6 MB at today's encoding (M9) |
| A5 | When card data changes a case's query text, the case is reported as awaiting a re-freeze and is not failed. Slice B owns it: each frozen vector stores a SHA-256 hash of its query text, and one re-freeze check compares it with the query text built now, skips the case in the ratchet, and counts it in the gate summary. Slice E's staleness command calls that check to list the cases | Rung 4, smallest reversible. Owner decision: staleness never blocks `data:refresh-pr`. A missing vector on a new case does fail. Under A21 the behavior lands in B and E, and REQ-222 is applied at E, where the staleness listing it names lands |
| A6 | The routine lineup is `gpt-4.1` at cap 10 | The probe recommendation; the deployed model and cap (`scripts/aws-deploy.sh`, REQ-190). Owner confirms in the REQ-188 and REQ-190 slots |
| A7 | Coverage counts `draft`, `approved`, and `needs-edit`; `rejected` does not | Rung 4. Owner decision 4 ("at least one case") read as "a non-rejected case" |
| A8 | Rejected cases stay in the corpus with status `rejected` | Rung 4: dedup still sees them; git keeps the history either way |
| A9 | The cited-rule check says "not in the committed index", not "made up" | Rung 1, evidence: the index lags the CR (M1) |
| A10 | The coverage report names mechanics by rule number, with a best-effort name from the first subrule's text | Rung 6: no new data file. The index has no heading entries (M1) and the raw CR is gitignored |
| A11 | `snapshot` hashes the rule-index file instead of storing a rules date | Rung 1, evidence: no date in committed data (M13) |
| A12 | `npm run eval:worked-solutions` keeps its behavior and reads all non-rejected cases through the v2 loader | Rung 1: REQ-185's constraint that it "keeps working unchanged" |
| A13 | The REQ-177 benchmark is untouched by corpus growth | Rung 2: `rag-retrieval-benchmark.json` embeds its own 6 gold copies (`grep -c '"source": "gold"'` gives 6) |
| A14 | Migrated `cards`: the tier-2 cited card for the three tier-2 cases, Tarmogoyf for `token-created-by-name-uses-oracle-card`, and an empty list for the other 14 tier-1 cases | Rung 1, REQ-185 as proposed (every card the question names is attached) plus rung 5: measured, the change keeps 16/18 with the same two misses (M15) |
| A15 | `gameState` is an In-Depth `gameContext`, validated by the existing schema (`gameContextSchema` in `askAiRequest.ts`) in a backend vitest test in slice B that parses every non-null `gameState` in the corpus, because the schema is TypeScript and the `.mjs` loader runs without tsx (A3); a controller that differs from the owner is stated in the card's `contextNotes`; the `.mjs` case loader checks the structural rules, rejecting `owner` on a stack item and `caster` on a card outside the stack, so every stated fact is one the prompt prints; slice A's `buildCaseRequest` turns a `gameState` into the In-Depth request | Rungs 2 and 6: the request type in `apps/backend/src/validation/askAiRequest.ts` has zones, stack order, `owner`, `caster`, `targets`, and `contextNotes`, and no controller field; reusing it adds no new data contract. `promptFormatting.ts` prints `owner:` only outside the stack (line 255) and `caster:` only on the stack, so the narrower case rule is the smallest one that keeps the state-fact check complete |
| A16 | The 120 hard-area cases split 60 `Example:` lines, 58 two-card rulings, 2 tester cases, over one list of twelve hard areas (M1b, M16, and the REQ-185 criterion); Q-008's extra tier-3 cases, at most 13 (the intake's tier-3 cap of 15 minus the 2 testers), replace two-card ruling slots one for one | Rung 4: both pools are measured over the same twelve areas and each pick is about half or less of its pool (M16); the total stays fixed whatever Q-008 says |
| A17 | Slice E ships the coverage gate as tested code that is not yet wired into `quality:check`; slice F wires it in when its 255 cases land | Rung 4: every slice stays green on its own, and the gate never runs while it is known to fail. Fixture-corpus tests prove E's gate logic before F |
| A18 | The stale comparison is one loader function built in slice A, beside `snapshot` hashing; slice C's filter, slice D's review render, and slice E's report call it | Rung 3: one shared loader (REQ-185) already serves every reader |
| A19 | A stale approved case returns through the review flow: the render includes every flagged approved case, and an `approve` verdict makes the apply command re-record its `snapshot` hashes. Every approval re-records them, and the apply command refuses a case whose committed text changed after the render. Slice D builds it | Rung 4, smallest reversible: reuses REQ-224's one write path instead of adding a separate re-snapshot command, and keeps "no agent sets `approved`" true, because only an owner verdict re-records the hashes that make a case gradable again. Its one exception, the 18 first-ship cases the slice A migration writes as `approved`, is also an owner decision: the owner's accept of REQ-185 (A1) |
| A20 | The review apply command rewrites `coverage.json` after writing verdicts; slice E adds that step when it creates the file | Rung 4: the owner's own review must never fail the next pull request on REQ-223's out-of-date check; rerunning a separate command by hand is the failure the gate-qc found |
| A21 | Each `GATE-QUESTIONS.md` slot is applied in the first slice where every behavior it states is true. A bare citation of an ID this package reserves (REQ-222 to REQ-225) may be applied ahead of that ID's own entry | Rung 3: the build half lands every slice in one code PR into `main` (`PRD/instructions/graph-workflow-contract.md`, `## The two runs`: a second, code PR carries the code and the applied truth), so `main` never holds a citation of an ID that is not there; a citation states a relation, not a behavior |
| A22 | A stale approved case's last graded record stays in `results.json` but is not counted in REQ-187's headline; the headline prints a stale count beside the ungraded count. One rule covers every approved, non-stale case, re-approved or not: it counts through its latest graded record only when that record's reference-answer hash matches the hash of the case's current `expected.answer`, and otherwise counts as ungraded, which includes a record with no reference-answer hash (every record written before this package, the 18 in today's `results.json`). So a re-approved case counts again from re-approval: at once from its existing record if its answer did not change, or as ungraded until `--changed` re-grades it if the answer was reworked. `--changed` selects a case whose reference-answer hash differs from its last record's (REQ-188), so that re-grade always happens on the next routine run | Rung 1, derived from REQ-225's existing rule that a stale case leaves live scoring until the owner re-approves it, and its plain-terms promise that the AI is never graded against an answer that may be out of date. REQ-189 drops a record only when the case leaves the corpus or is no longer `approved`, so the record is kept. The reference-answer condition is rung 3, reusing REQ-189's existing per-case rule that a record judged against a different reference-answer hash is incomparable, and the hash the per-case record already stores; counting from re-approval rather than only from a fresh record means a case whose prompt and answer are both unchanged, which `--changed` rightly never re-selects, is not left ungraded for good. Not a blocker question: the existing rules settle it |

Two genuine decision blockers went to the owner as Q-007 and Q-008. Each
changes scope and has no PRD basis, and taking the smaller option would
silently decide it.

## Slices (ordered, for map-out)

Each slice applies PRD truth in the build's apply-by-intent step, by one
rule (A21): a `GATE-QUESTIONS.md` slot is applied in the first slice where
every behavior it states is true in code. A slot whose diffs describe
different slices' work is applied in parts, as listed.

| Slice | Delivers | Applies | Done when |
| --- | --- | --- | --- |
| A | Format v2 schema and loader (`scripts/lib/gold-cases.mjs`), including the A15 rule (no `owner` on a stack item, no `caster` outside the stack), dedup, derived tags, `snapshot` hashing and the one stale comparison every reader calls (A18), migration of the 18 with the `cards` lists in A14 (as `approved`, A1), the field rename in every case-file reader (`workedSolution` to `expected.answer` and `expectedSupplementalRuleIds` to `expected.decidingRuleIds` in `scripts/eval-answer-quality.mjs` lines 408, 426, 431, 433, 464, 480, `scripts/eval-worked-solutions.mjs` lines 65 and 120, `scripts/lib/gold-cases.mjs`, and the case objects in `scripts/lib/gold-cases.test.mjs` and `scripts/eval-worked-solutions.test.mjs`; the full list is under `### Case format version 2`), `buildCaseRequest` building every case's request (A15: a lookup with every `cards` entry attached, or, for a case with a `gameState`, the In-Depth `mode: "game"` request with that `gameState` as its `gameContext`), the sibling type declarations `scripts/lib/gold-cases.d.mts` and `scripts/lib/prompt-fidelity.d.mts` that let backend vitest tests import both modules with one copy (A3, M17), README rewrite | — (REQ-185 is applied in G, where its run-1 authoring criterion becomes true) | The 18 migrated cases have byte-identical question and answer text (a test diff), and each has `review.status` `approved`, `review.reviewedOn` set to the migration date, and a review note naming the approval source (A1). Each migrated case's `cards` matches A14. No case-file read of `workedSolution` or `expectedSupplementalRuleIds` remains in `scripts/` or `apps/backend/src/eval/` (a grep; the context-eval fixture readers, parameter names, and the no-prose list stay, as listed under `### Case format version 2`). `scripts/eval-answer-quality.mjs` passes the case's `expected.answer` to the judge and its `expected.decidingRuleIds` to the assertions and retrieval check, and its existing tests and dry run (no key, no network) pass on the migrated 18. `eval:worked-solutions` still reports 16/18 with the same two misses (measured for this exact migration, M15). A unit test shows the stale comparison flags a changed rule, oracle, or ruling hash and passes unchanged data. `buildCaseRequest` tests: a case without a `gameState` gives a lookup with every `cards` entry attached by oracle id; a fixture case with a `gameState` (two stack items, a battlefield card with an owner) gives a `mode: "game"` request that the In-Depth request schema accepts, with each card in its zone and the stack in order (a backend vitest test, because the schema is TypeScript; the loader and lookup-request tests run under `test:scripts`, A3). The loader rejects a fixture `gameState` with `owner` on a stack item, and one with `caster` on a battlefield card. `preparation.test.ts`, the benchmark, and the context-eval fixtures pass unchanged. `npm run typecheck` is green, with the backend vitest test above importing `scripts/lib/gold-cases.mjs` and `scripts/lib/prompt-fidelity.mjs` statically through their `.d.mts` declarations (A3, M17) |
| B | Offline prompt gate: card check, frozen-vector build command and file (each vector stored with a SHA-256 hash of the query text it was embedded from), the one re-freeze check (rebuilds a case's query text and compares its hash; on a mismatch the case is awaiting a re-freeze, is skipped by the ratchet, and is counted in the gate summary, A5), ratchet baseline and raise command, state-fact check over the A15 mapping (requests built by slice A's `buildCaseRequest`), the `gameState` schema check (every non-null `gameState` in the corpus parsed with the In-Depth `gameContextSchema` from `apps/backend/src/validation/askAiRequest.ts`; the `.mjs` loader checks only the structural rules, A15), wired into `quality:check` as backend vitest tests under `apps/backend/src/eval/`, which `coverage:check` runs (A3) | The new system-map entry `Rules test corpus gates and review` (from the REQ-222 slot) added as `Status: partial`. REQ-222's own entry is applied in E, because its re-freeze criterion names the staleness report | The gate's tests are backend vitest tests under `apps/backend/src/eval/` that read cases through `scripts/lib/gold-cases.mjs` and run in `coverage:check` (A3). The gate passes on the 18 with a baseline of 16 hits. A planted dropped card and a planted lost rule each fail it. State-fact check: a fixture case with a `gameState` (a stack of two items with a caster, a battlefield card with an owner, and a controller note) passes through `buildCaseRequest` and the real `preparePromptInput`, and a unit test fails the check when one stated fact's line is missing from the prompt. Re-freeze test: a fixture case whose stored query-text hash differs from its rebuilt query text, and whose baseline records a hit, is reported as awaiting a re-freeze, does not fail the gate, is neither a hit nor a miss in the ratchet, and the summary prints an awaiting-re-freeze count of 1; the same case with no vector at all fails the gate. Schema check: every non-null `gameState` in the corpus parses under `gameContextSchema`, and a planted fixture `gameState` the schema rejects (a turn phase outside `turnPhaseSchema`) fails the gate, naming the case. No network or model call (the test fails if the embedder is invoked). `npm run typecheck` is green (A3, M17) |
| C | Live runner: selection flags (`--changed` on a changed prompt hash or reference-answer hash, or on a last record missing either hash), the approved-and-non-stale filter (calling slice A's stale comparison), requests from slice A's `buildCaseRequest`, prompt hash, per-case merge, the headline over records judged against the current reference answer (A22; a record without a prompt hash or reference-answer hash, as each of the 18 in today's `results.json` is, counts as ungraded), judge usage, default `gpt-4.1` at cap `[10]`, ranking skipped for one model, unknown-rule-id assertion, `shortAnswer` added to the no-prose guard | REQ-186, REQ-187, REQ-190, and the system-map answer-quality entry (from the REQ-188 slot). REQ-188 is applied in F, because it says the coverage gate runs in `quality:check`; REQ-189 in E, because it names the coverage file | The dry run prints selection and cost with no network call when there is no key. Unit tests (`test:scripts`, with injected fakes for the prompt and the provider, A3) cover the merge, selection, the stale filter, and the ranking skip. Selection test: `--changed` picks a case whose prompt hash matches its last record but whose `expected.answer` hash differs from that record's reference-answer hash, and skips a case where both match. Legacy-record test: a fixture record with no prompt hash and no reference-answer hash counts as ungraded in the headline and is selected by `--changed`; the dry run on the real corpus selects all 18 migrated cases, because none of today's 18 records carries the hashes, and prints its cost estimate (this brief's estimate is about $0.35: 18 × ($0.0098 + $0.0099), M8), so the first routine run re-grades them. Unknown-rule-id test: a fixture answer citing a rule id the committed index lacks records that id in the per-case list, worded "not in the committed rule index"; one citing only existing ids records an empty list. Judge-usage test: a fake judge's token usage lands in the per-case record and in the run totals, with answer and judge shown separately. No-prose test: `writeResultsFile` throws on a record carrying `shortAnswer`. Drop test: a merge where a previously recorded case is now `needs-edit`, and one where a case left the corpus, drops both records and keeps every other case's record unchanged. Headline tests (A22): a fixture with one stale approved case that has a Correctness-2 record leaves it out of the count and prints a stale count of 1; a re-approved case whose answer did not change counts at once from its existing record; a re-approved case whose answer was reworked (its last record's reference-answer hash differs) counts as ungraded, not from the old record, is selected by `--changed` although its prompt hash is unchanged, and after a fake re-grade merges a new record counts from that record. The regression guard still passes |
| D | Review command (render batches, including approved cases the stale comparison flags, marked stale with each changed dependency's current text) and apply command (writes `review.*`, and on `approve` re-records `snapshot`, A19). The apply command's `coverage.json` rewrite is added in E, which creates that file (A20) | — (REQ-224 is applied in E, where its coverage-file step lands) | Round-trip test: render, fill, apply changes only `review.*`, plus `snapshot` on an `approve` verdict. Stale path test: a fixture approved case whose ruling hash no longer matches is rendered marked stale; applying `approve` re-records its hashes, after which slice A's stale comparison passes and slice C's filter selects it again. Each refusal case is tested, including committed text changed between render and apply. Test placement follows A3 |
| E | Coverage command and report (including counts per `outcome`), `coverage.json`, excluded list (per Q-007), the coverage gate as a tested function **not yet wired into `quality:check`** (A17), staleness command (stale cases through slice A's stale comparison, cases awaiting a re-freeze through slice B's re-freeze check), and the `coverage.json` rewrite at the end of slice D's apply command (A20) | REQ-189, REQ-222, REQ-224, REQ-225 | Fixture-corpus tests: an uncovered mechanic fails the gate, an excluded id the index lacks fails it, an out-of-date coverage file fails it, and a fully covered fixture passes. Applying a filled review batch that changes a status leaves the out-of-date check passing. Run on the real corpus, the coverage command lists the 255 mechanics still uncovered as report output, not a failure. `quality:check` is green. The staleness report is clean on unchanged data. Staleness fixture test: a fixture case with a changed ruling hash is listed as stale naming that dependency, and a fixture case whose stored query-text hash no longer matches is listed as awaiting a re-freeze (a backend vitest test, because slice B's re-freeze check rebuilds query text with `buildRetrievalQueryText`, A3); neither run fails any gate |
| F | 255 mechanic cases as `draft` with frozen vectors; coverage file rewritten; the coverage gate wired into `quality:check`; map-out may split by family (701 actions 66; 702.2–702.100; 702.101–702.192) | REQ-188, REQ-223, NFR-018, goals line, system-map `## Eval harness` (from the REQ-222 slot) | The coverage gate runs in `quality:check` and passes. Every case passes the card check. The ratchet baseline is recorded |
| G | 120 hard-area cases as `draft` with frozen vectors (A16: 60 from unused `Example:` lines, 58 from two-card rulings, the 2 tester cases as tier-3 drafts — Q1 via 614.1a, 616.1, 616.1e, 616.1f; Q2 via 514.1, 514.2, 514.3a), with any Q-008 tier-3 drafts taking two-card ruling slots; coverage file rewritten; the corpus README brought up to REQ-185's README criterion, including slice D's and E's commands | REQ-185 | The coverage report shows the 60 / 58 / 2 split and at least 40 of the 120 with `outcome` `does-not-work`. Both gates pass. The ratchet baseline is re-recorded at the end. No live run is needed to merge |

The order is the intake's. Every slice builds and tests green on its own:
slice E's gate does not run in `quality:check` until slice F gives it the
cases it needs.

Each slice applies only the truth that is true once it lands (A21). So:

- REQ-186, REQ-187, REQ-190, and the answer-quality system-map summary go in
  at C, where every behavior they state lands.
- REQ-189, REQ-222, REQ-224, and REQ-225 go in at E: REQ-189 and REQ-224
  name the coverage file E creates, and REQ-222 and REQ-225 name E's
  staleness report.
- REQ-188, REQ-223, NFR-018, the goals line, and the `## Eval harness`
  summary go in at F, because each says the coverage gate runs in
  `quality:check`.
- REQ-185 goes in at G, because its run-1 criterion is true only once the
  120 hard-area cases exist.

A slot may cite an ID, or rely on wording, from another slot of this
proposal before that slot is applied. Two kinds occur:

- **A new ID cited before its entry goes in.** REQ-186 and REQ-187 (at C)
  cite REQ-225's staleness rule (E). The system-map entry added at B cites REQ-222
  to REQ-225. REQ-189 and REQ-224 (at E) cite REQ-223 (F).
- **An amended entry's new wording relied on before the amendment goes
  in.** REQ-225 (at E) names REQ-188's skip of stale cases (F). REQ-186,
  REQ-187 (at C), REQ-222, REQ-224, REQ-225 (at E), and NFR-018 (at F) use
  REQ-185's new terms (tier 3, `approved`, the rules test corpus), which go
  in at G.

That is acceptable for two reasons. First, the behavior behind each citation
already works in code when the citing slot lands: slice A's format and stale
comparison exist from A, slice C's filter from C, and E's coverage command
from E; the B entry is marked `partial` for the rest. Second, every slice
lands in the one code PR into `main` (A21), so `main` never holds a citation
of an ID, or a term, that is not there.

The new system-map entry goes in at slice B as `partial` (system-map.md:
some features shipped, others planned), because the review, coverage, and
staleness commands it describes arrive in slices D and E. Cleanup promotes it
to `shipped` under the system-map promotion rule (code exists and a cleanup
receipt records it).

## Risks

- **Review load.** About 375 new drafts (255 + 120) is a large review. Batches grouped by
  mechanic keep each sitting short. Run 2 is sized to your review budget.
- **Text-route mechanics.** For the 30 mechanics that only have a text-matched
  ruling (M3), authoring must confirm the ruling is about the mechanic. If it
  is not, the answer falls back to the rule's own text (tier 1).
- **Live cost is still an estimate.** Judge usage has never been recorded
  (M8). The first live run that records it replaces the estimate.
- **The frozen-vector file is about 3.6 MB.** It lives under `src/eval/`,
  never in `apps/backend/data/`. The build should confirm Lambda packaging
  does not pick it up.

## Define attempt 2 — what changed for the gate-qc findings

| # | Finding (README `## Preparation gate`) | Resolution |
| --- | --- | --- |
| 1 | Slice E not green on its own; stale comparison has no owner | Slice E ships the coverage gate as tested code, wired into `quality:check` only in slice F (A17). Slice A owns the one stale comparison that slices C and E call (A18). REQ-223, NFR-018, the goals line, and the `## Eval harness` summary are applied in F |
| 2 | Run-1 size does not add up; counts untraced | New M16 measures both pools (113 unused `Example:` lines; 2,371 hard-area two-card rulings, re-measured as 2,651 over the twelve areas in attempt 3) and their `does-not-work` supply. The block is 60 + 58 + 2 = 120 and the total 18 + 255 + 120 = 393. Q-008's extra tier-3 cases replace two-card ruling slots one for one. The at-least-a-third criterion stays, with its measured basis in the REQ-185 notes and outcome counts in the coverage report (REQ-223, REQ-189) |
| 3 | Migrated `cards` unspecified | A14 and the REQ-185 migrated-cases criterion state each case's `cards`. New M15 measures it: 16/18, the same two misses |
| 4 | Q-007 and Q-008 not plain language | Both rewritten: decision first, every term glossed, a default, and "nothing gets built until you answer" for a blank. Q-007 now recommends keeping the three Attraction mechanics, matching its own caution (255 mechanic cases, not 252) |
| 5 | Disposition table missing a row; one row miscited | Added `PRD/work/STATUS.md:21`; corrected `STATUS.md:52`; the grep re-run gives 220 hits and 220 rows |
| 6 | Unamended wording inside amended entries | REQ-187's Correctness, Calibration, and no-axis bullets are now amended. REQ-189's no-prose guard keeps `workedSolution` on purpose (a version-1 field name must never leak in), says so, and adds `shortAnswer` |
| 7 | State-fact check untested; mapping unspecified; system-map status | The `gameState` mapping table (A15), checked against `apps/backend/src/validation/askAiRequest.ts`; slice B's done-when tests the state-fact check; the new system-map entry goes in as `partial` |
| 8 | Infinity count | M4, owner finding 1, and Q-007 now say 4 cards print ∞, 2 with rulings, and name all four |

## Define attempt 3 — what changed for the gate-qc findings

| # | Finding (README `## Preparation gate`) | Resolution |
| --- | --- | --- |
| 1 | A stale approved case has no path back | The review render now includes every approved case the stale comparison flags, marked stale with each changed dependency's current text. An `approve` verdict makes the apply command re-record `snapshot`; the apply command also refuses a case whose committed text changed after the render (A19). Slice D owns it, with a stale-path test in its done-when. REQ-224's render and apply criteria, REQ-225's re-approval criterion, and REQ-185's `snapshot` wording now agree |
| 2 | State-fact check cannot pass on the stack | The prompt prints `owner:` only outside the stack and `caster:` only on it (`promptFormatting.ts` line 255). The loader now rejects `owner` on a stack item and `caster` off the stack; the check covers `owner` off the stack and `caster` on it. A15, the mapping table, the state-fact paragraph, REQ-185's `gameState` wording, and the REQ-222 state-fact criterion say the same |
| 3 | No slice turns `gameState` into an In-Depth request | Slice A's `buildCaseRequest` builds it, with tests in A's done-when; B and C use it |
| 4 | Slices cite REQ-222 to REQ-225 before they are applied | Slots now apply where every behavior they state lands (A21): REQ-185 moves from A to G, REQ-188 from C to F, REQ-189 from C to E, REQ-222 from B to E, REQ-224 from D to E. The brief says why the remaining citations ahead of an entry are acceptable (one code PR into `main`) |
| 5 | Owner review leaves `coverage.json` out of date | The apply command rewrites `coverage.json` after writing verdicts; slice E adds that step when it creates the file (A20). REQ-189, REQ-223, REQ-224, and slices D and E say so |
| 6 | Up to 13 extra tier-3 cases has no source | The intake caps the tier-3 bucket at 15, and the 2 testers count inside it, so 13 remain (A16, run-1 size, Q-008). Q-008 now says any of the 58 two-card ruling cases can be swapped and 13 is a cap on research load |
| 7 | Q-007 miscounts the intake's list; the intake is undefined | Q-007 now says the intake excluded four mechanics (the three Attraction mechanics and Space Sculptor), did not list Assemble, and left ∞ undecided: 253 mechanic cases with its list and ∞ kept, 252 with Assemble added. Q-007 and the brief define the intake where they first name it |
| 8 | Two hard-area lists | One list of twelve everywhere. M16's ruling search now has one term per area (re-run: 2,651 hard-area two-card rulings, 1,232 negative-phrased; `Example:` counts unchanged), and the REQ-185 criterion and notes name the same twelve |

## Define attempt 4 — what changed for the gate-qc findings

| # | Finding or advisory (README `## Preparation gate`) | Resolution |
| --- | --- | --- |
| 1 | The 18 migrated cases ship `approved` against the no-agent-approves rule | One carve-out, worded the same everywhere: the 18 first-ship cases are approved by the owner's accept of REQ-185, and the migration only writes that down. It is in the REQ-185 constraint, description, migrated-cases criterion and plain terms; REQ-224's description, no-agent criterion and plain terms; A1; A19; and `### Case format version 2`. The migrated cases' `snapshot` is recorded at migration, which counts as their authoring, so REQ-224's and REQ-225's "only the apply command rewrites `snapshot` after authoring" still holds. Slice A's done-when checks the 18 are `approved` |
| 2 | The awaiting-re-freeze state has no owner or test | Slice B owns it: each frozen vector stores a SHA-256 hash of its query text, and one re-freeze check compares it with the query text built now, skips the case in the ratchet, and counts it in the gate summary (A5). Slice E's staleness command calls that check. Fixture tests in B's and E's done-when. REQ-222's frozen-vector criterion names the stored hash and the shared check, and its plain terms say it. REQ-222 stays applied at E (A21) |
| 3 | Slice A must name `scripts/eval-answer-quality.mjs` | Confirmed lines 408, 426, 431, 433, 464, 480. A grep of `scripts/` and `apps/backend/src/eval/` also found `scripts/eval-worked-solutions.mjs` lines 65 and 120, the loader, and two test files. All are named in slice A's delivers and done-when and listed under `### Case format version 2`, with the hits that stay (context-eval fixture readers, parameter names, the no-prose list) |
| 4 | Does a stale approved case's last record count in REQ-187's headline | Derived, not a blocker: REQ-225 says a stale case leaves live scoring until re-approved, so the record stays in `results.json` but is not counted, and the headline prints a stale count (A22). REQ-187's headline criterion and plain terms, REQ-225's re-approval criterion, plain terms and dependencies, the live-runner headline bullet, and a slice C headline test say so |

## Define attempt 5 — what changed for the gate-qc findings

| # | Finding or advisory (README `## Preparation gate`) | Resolution |
| --- | --- | --- |
| 1 | A re-approved stale case has no defined way back into the headline | One rule (A22): an approved, non-stale case counts through its latest graded record only when that record's reference-answer hash matches the hash of its current `expected.answer`; otherwise it counts as ungraded. So a re-approved case counts from re-approval: at once if its answer did not change, or as ungraded until re-graded if it was reworked. `--changed` now also picks a case whose reference-answer hash differs from its last record's (REQ-188 selection criterion and plain terms, the system-map summary, the brief's `Live runner` Selection bullet, the opening summary). REQ-187's headline formula and plain terms, REQ-225's re-approval criterion and plain terms, REQ-189's record field (now defined as SHA-256 of `expected.answer`) and plain terms, and REQ-224's plain terms agree. Slice C's done-when adds a selection test and the re-approved-then-re-graded headline tests |
| 2 | `DESIGN-BRIEF.md:125` cites a missing M14 | Now cites M13 and A11. A grep of the package for measurement ids finds no other reference without a row (M14 survives only in the README gate finding, which this node does not edit) |
| 3 | `review.reviewedOn` for the 18 migrated cases | The migration date (the date slice A's migration commit is made), with a review note naming the approval source. Stated in REQ-185's migrated-cases criterion, REQ-224's no-agent criterion, A1, `### Case format version 2`, and slice A's done-when |
| 4 | Slice C's done-when names too few tests | It now names tests for the unknown-rule-id assertion, judge-usage recording, the `shortAnswer` no-prose guard, and dropping non-approved and removed cases from `results.json` |
| 5 | Where gate tests that import TypeScript live | Followed the REQ-177 benchmark: backend vitest tests under `apps/backend/src/eval/`, run by `coverage:check`, reading cases through `scripts/lib/gold-cases.mjs`; `test:scripts` tests never import TypeScript and inject fakes (A3). Slices A, B, C, D, and E's done-whens name the placement, and the new system-map entry's `Lives in` line names `apps/backend/src/eval/` |

## Define attempt 6 — what changed for the gate-qc findings

| # | Finding or advisory (README `## Preparation gate`) | Resolution |
| --- | --- | --- |
| 1 | Backend vitest tests cannot import the `.mjs` loader; no test parses `gameState` with the In-Depth schema | Measured first (M17): a bare import fails `tsc --noEmit` with TS7016 under the backend's options; a sibling `.d.mts` per module keeps `tsc --noEmit`, the backend build, and `vitest run` green; a variable-path dynamic import also passes but types everything `any`, so it is rejected. Slice A adds `scripts/lib/gold-cases.d.mts` and `scripts/lib/prompt-fidelity.d.mts` (A3). A3 records why this departs from `preparation.test.ts:12-18` (that test copies six names; copying the loader is what REQ-185 forbids). The `.mjs` loader checks only the structural `gameState` rules; slice B's backend vitest test parses every non-null `gameState` with `gameContextSchema` (A15, the `How gameState reaches the prompt` paragraph, the state-fact check bullet, the Scope list). REQ-185's `format version 2` criterion and REQ-222's state-fact criterion, plain terms, and system-map summary say the same. Slices A and B add typecheck-green to their done-whens |
| 2 | Today's 18 records carry no prompt or reference-answer hash | A record missing either hash counts as ungraded in the headline and is selected by `--changed`, so the first routine run re-grades all 18, about $0.35 (18 × ($0.0098 + $0.0099), M8). Corrected the token-case paragraph under `### Case format version 2` (it no longer claims the token case alone is re-selected). Stated in the Live runner Selection and Headline bullets, A22, slice C's delivers and done-when (a legacy-record test and the real-corpus dry run selecting 18), the opening summary, REQ-187's headline criterion and plain terms, REQ-188's selection criterion, plain terms, and system-map summary, and REQ-189's merge criterion and plain terms |

## Cross-cutting disposition

One quoted grep (M10), at line level, over `PRD/`, `apps/backend/src/eval/`,
and `scripts/`. The package's own folder is excluded. One row per hit line.

- "Amends" means the line is a `-` line in a `GATE-QUESTIONS.md` diff.
- "Kept verbatim" means the line stays true inside an amended entry.
- "Build changes" means a code comment or doc outside `PRD/sections/` that
  the named slice updates.

`PRD/sections/in-depth/README.md` has no hit for any of the eight IDs; its row
is added at the end.

Hits: 220 lines (re-run on 2026-10-06 in define attempt 6, after the board row moved to `## refined`; same 220 file:line keys as attempts 2 to 5, checked by a sorted diff of hit keys against this table's keys).

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
| `PRD/sections/functional-requirements.md:4451` | REQ-185 | - no axis for WotC card-ruling citation is defined: at first ship the gold set's tier-2 ca… | Amends: `-` line in the REQ-187 slot (tier-2 and tier-3 cases are scored by the same four axes; attempt 2, gate-qc finding 6) |
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
| `PRD/work/STATUS.md:21` | REQ-185, NFR-018 | \| [rules-test-harness](rules-test-harness/) \| Refined (define attempt 6, after gate-qc FAIL 5; the… | No change: this package's own board row, naming the IDs it proposes to amend; the graph lifecycle rewrites it at each status move |
| `PRD/work/STATUS.md:52` | REQ-177, REQ-185 | \| [combo-context-validation](../ideasForLater/combo-context-validation/) \| ideation — in… | No change: parked-idea board note citing REQ-177's note (where its throwaway harness is recorded) and the answer-quality instrument (REQ-185–190) as related work; both citations stay true |
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
| `apps/backend/src/eval/answer-quality/rubric.ts:94` | REQ-187 | * The run's single headline figure (REQ-187): the count of gold cases | Build changes (slice C): headline per tier over latest graded records judged against the current reference answer (REQ-187) |
| `apps/backend/src/eval/retrievalReportParity.test.ts:1` | REQ-177 | // REQ-177 acceptance criterion: an automated test asserts the relevance | Leaves true: REQ-177 benchmark, parity test, and baseline are unchanged |
| `apps/backend/src/eval/retrievalReportParity.test.ts:6` | REQ-177 | // Before REQ-177, `retrievalReportInputs.ts` built no card-detail index at | Leaves true: REQ-177 benchmark, parity test, and baseline are unchanged |
| `apps/backend/src/eval/retrievalReportParity.test.ts:89` | REQ-177 | describe("Backend - Eval - report/harness parity (REQ-177)", () => { | Leaves true: REQ-177 benchmark, parity test, and baseline are unchanged |
| `apps/backend/src/eval/contextEvaluationHarness.test.ts:122` | REQ-177 | // REQ-176/REQ-177: `context.ts` resolves a card's descriptive block from an | Leaves true: REQ-177 benchmark, parity test, and baseline are unchanged |
| `apps/backend/src/eval/contextEvaluationHarness.test.ts:132` | REQ-177 | // card-intrinsic fields differently (REQ-177). | Leaves true: REQ-177 benchmark, parity test, and baseline are unchanged |
| `apps/backend/src/eval/fixtureCardDetail.ts:1` | REQ-177 | // REQ-177: single canonical card-detail-index builder for eval fixtures. | Leaves true: REQ-177 benchmark, parity test, and baseline are unchanged |
| `scripts/package-lambda.sh:31` | REQ-177 | # cold start — the same class of measurement/deploy-integrity bug REQ-177 | Leaves true: REQ-177 benchmark, parity test, and baseline are unchanged |
| `scripts/eval-answer-quality.mjs:1` | REQ-188, REQ-190, NFR-018 | // Answer-quality baseline run (REQ-188, REQ-190; NFR-018). | Leaves true |
| `scripts/eval-answer-quality.mjs:3` | REQ-185 | // Bake-off: every gold case (scripts/lib/gold-cases.mjs, REQ-185) answered | Build changes (slice C): 'every gold case' becomes the selected approved cases (REQ-188 case selection, `--changed` on prompt or reference-answer hash) |
| `scripts/eval-answer-quality.mjs:73` | REQ-188 | /** Published list rates, USD per million tokens (re-checked before a live run; REQ-188's … | Leaves true: comment's claim survives the proposal |
| `scripts/eval-answer-quality.mjs:82` | REQ-188 | // Output-token assumptions behind the printed dry-run estimate only (REQ-188's | Leaves true: comment's claim survives the proposal |
| `scripts/eval-answer-quality.mjs:94` | REQ-188 | * the lineup (REQ-188): the answer-model lineup is a run option, not an | Build changes (slice C): default lineup becomes gpt-4.1 alone (REQ-188) |
| `scripts/eval-answer-quality.mjs:127` | REQ-186 | /** Judge model is its own explicit setting (REQ-186), defaulting to gpt-5 -- never OPENAI… | Leaves true: comment's claim survives the proposal |
| `scripts/eval-answer-quality.mjs:236` | REQ-188 | /** A character-count cost estimate (REQ-188's M3 methodology). Never a target -- the live… | Leaves true: comment's claim survives the proposal |
| `scripts/eval-answer-quality.mjs:286` | REQ-189 | * committed `AnswerQualityResults` shape (REQ-189) -- per-leg headline | Build changes (slice C): per-case merge and per-tier headline (REQ-187, REQ-189) |
| `scripts/eval-answer-quality.mjs:337` | REQ-189 | // the committed per-case-per-leg schema (REQ-189) -- stripped here. | Build changes (slice C): per-case record gains prompt hash, reference-answer hash, judge usage, unknown rule ids (REQ-189) |
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
