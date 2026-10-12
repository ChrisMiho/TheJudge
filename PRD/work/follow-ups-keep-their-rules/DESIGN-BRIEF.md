# Design brief — follow-ups keep their rules, and the eval learns to push back

**What this is:** the design for one change to Luna's follow-up answers and one new
measuring mode for the answer-quality eval.

**What you need to do:** decide the eleven slots in `GATE-QUESTIONS.md` (two new
requirements, nine one-line amendments). There is no blocker question.

**What it changes:** a follow-up re-checks against the rules Luna had the first time,
and you can measure pushback on demand.

## What the player gets

A player asks Luna a ruling, then replies "that's wrong, check again", or any other
follow-up. Today Luna re-checks with a different set of rules: rule search runs on the
follow-up's words, which name no rules, so most of the rules she quoted the first time
are gone. In the intake's paid probe she then told the player, in about one follow-up
in six, that a rule she had just quoted "wasn't provided".

With this change, a follow-up keeps the rules the opening question found. Luna re-checks
the same evidence, stands by a right ruling with the rule she relied on, and corrects a
wrong one at least as often as today.

The owner also gets a two-turn pushback mode in the answer-quality eval. It answers each
test case, pushes back with a fixed "I don't think that's right. Can you check it
again?", and reports how often a right answer held, flipped, or a wrong one got fixed.

## The design

### Part 1 — a follow-up keeps the opening question's rules (REQ-246)

A follow-up is any request that carries `conversationHistory`, the prior turns the app
sends with every follow-up (REQ-027). Its first turn is always the opening question,
exactly as first sent, fallback included (`useAskAiSubmitOrchestration.ts:171-174`; the
request schema requires the first turn to be the player's, `askAiRequest.ts:231-246`).

The rule: on a follow-up, every rules choice that reads the player's question reads that
opening question instead of the follow-up text. Three choices read the question today:

| Rules choice | Where | Today on a follow-up | With this change |
| --- | --- | --- | --- |
| System 3 search, the up-to-15 "additional relevant rule excerpts" (REQ-190), both halves: word matching and the embedded meaning search | `preparation.ts:112-121, 133-138, 279, 390-391`; the route embeds `buildRetrievalQueryText` at `routes/askAi.ts:106-110` | searches the follow-up's words plus the cards | searches the opening question plus the cards |
| In-Depth curated topics picked by question words (REQ-242, added by #293) | `gameRulesTopicSelection.ts:142` reads `context.finalQuestion` | picked by the follow-up's words | picked by the opening question's words |
| Quick Lookup step guidance for steps the question names (REQ-238, added by #293) | `preparation.ts:284` | named by the follow-up's words | named by the opening question's words |

Everything else in the rules sections already comes from the frozen cards and game
context, so it is already the same on a follow-up: card rulings, per-card search and the
cards' keyword rule sets (REQ-235), card-wording topics (REQ-220, REQ-234), and In-Depth's
current-step guidance. Together, the follow-up's three rules sections — `PHASE
GUIDANCE`, `GAME RULES (reference)` and `ADDITIONAL RELEVANT RULE EXCERPTS` — come out
byte-identical to the opening question's.

What a follow-up still changes: the `QUESTION` section carries the follow-up text, the
`CONVERSATION HISTORY` section and the follow-up instruction appear as today, and the
combo section still reads the follow-up text (non-goal below).

**Mechanism: re-run, don't store.** One helper returns the question rule selection reads
— the first history turn on a follow-up, the request's own question otherwise — and the
lookup branch, the game branch and `buildRetrievalQueryInput` all call it, so the route
embeds the opening question's query and preparation ranks with it. The backend stays
stateless and the request is unchanged. Turn 1 used the same question, cards and game
context, so it selects the same rules.

Measured offline on the 62 diagnostic corpus cases with the committed frozen vectors
(`evidence/offline-measurement.md`): re-running the opening question with the history
attached selects turn 1's rules in 62 of 62, and a repeat preparation is identical in 62
of 62. Rule search reads nothing from the history today.

### Part 2 — the eval's pushback mode (REQ-247)

`npm run eval:answer-quality -- --run-id <id> --manifest <file> --follow-up pushback`
answers each case twice, as one conversation:

1. Turn 1 is today's production request (arm A).
2. Turn 2 is that request with the pushback text as `question` and the history the app
   would send: the turn-1 question as sent, then Luna's turn-1 answer. It goes through
   the route's request schema, is embedded from its own retrieval query text, prepared
   by the unmodified `preparePromptInput`, and answered by the same model. So turn 2
   measures whatever follow-up retrieval the checkout ships: today's before Part 1,
   carried-forward after it.

Each turn is judged alone against the case's reference answer. The run reports, per
model and cap: held, flipped on outcome, flipped on a side detail, fixed, still wrong
(with denominators); mean Grounding on each turn; turn-2 speed against the 30-second
budget; how many of turn 1's System 3 rules turn 2 carried; and how many turn-2 answers
disown a rule turn 1 cited, each with its transcript path. It writes only to its own run
folder and decides nothing.

It reuses the experiment machinery unchanged: the confirmation flag, the spending cap,
checkpoint and resume, the honesty checks that refuse a silent fallback to word-only
search, sequential calls. The spending check covers a whole conversation, so a run never
pays for a turn 1 it cannot follow up. It refuses to combine with a routine run, a
regrade, a practice-suite run, or any diagnostic arm, to keep the first version small.

## Acceptance targets

### Offline, at build (no paid call)

Every number below was measured at refinement on today's code (`0461969f`) and is
recorded with its command in `evidence/offline-measurement.md`.

1. **Same search excerpts.** On the 62 diagnostic cases built as two-turn requests with
   the pushback text and ranked with the frozen vectors, the follow-up's System 3
   selection equals the opening question's, in order: **62 of 62**. Today the follow-up's
   search text differs in 62 of 62, and on the keyword half alone it keeps 357 of the
   opening question's 836 search excerpts, all of them in only 1 case.
2. **Same curated topics.** In-Depth follow-up topics equal the opening's: **9 of 9**.
   Today 6 of 9 change, losing 8 topics.
3. **Same step guidance.** Quick Lookup follow-up `PHASE GUIDANCE` equals the opening's:
   **53 of 53**. Today none of the 18 cases with guidance lose it on this set (their
   guidance comes from frozen card wording), so a unit test covers an opening question
   that names a step in words.
4. **Identical rules sections.** Unit tests in both modes: a follow-up's three rules
   sections are byte-identical to its opening request's, including an opening question
   that names a turn step and one whose words trigger an In-Depth topic the follow-up's
   words do not. The mock provider's follow-up answer shows the carried rules.
5. **The route embeds the opening query.** `buildRetrievalQueryText` and
   `buildPerCardSearchTexts` return the opening request's values for a follow-up.
6. **Opening questions unchanged.** A request without history produces a byte-identical
   prompt: every existing prompt test, preview fixture and the offline prompt gate
   (REQ-222) pass unchanged.
7. **Embedder repeatability.** With the local model cache warm, embedding the same text
   twice in one process returns the same vector. Not measurable here (no model in this
   worktree); the build records it. If it fails, the build parks and returns the
   intake's choice — store turn 1's rules, or send them back in the request — to the
   owner.
8. **Eval mode tests.** With an injected fake client and no network call: the turn-2
   request shape and its schema parse; every refusal; turn 2 embedded from its own query
   text; each transition; the disowning check on pinned positive and negative sentences;
   the whole-conversation spending check; resume at turn 2.

### Post-merge, paid, owner-run (a reading, not a gate)

Two experiment runs, `gpt-6-luna`, cap 15, the 62-case diagnostic manifest, 3 repeats,
`--follow-up pushback`:

- **before** — from the commit that adds the eval mode (slice A), which still follows up
  with today's retrieval;
- **after** — from the merged head.

Each run gets `--max-cost-usd 7`, so both stay under $15. The dry run prints the
estimate first; the intake's pre-#293 probe cost $2.42–$2.48 per 186 conversations at
cap 10, and cap-15 prompts are larger.

Read it as success when, in the after run:

- no turn-2 answer disowns a rule turn 1 cited (the before count is recorded beside it);
- turn-2 mean Grounding is at or above turn 1's;
- turn 2 carries all of turn 1's System 3 rules;
- outcome flips are no more than the before run's plus 2, and fixes no fewer than the
  before run's minus 2 — counts this small move by 1 or 2 on judge noise alone;
- turn-2 answers over 30 seconds are no more than the before run's.

The allowance of 2 is a reading rule, not a measured threshold. The intake's paid probe
on pre-#293 code saw 1 outcome flip today against 2 carried-forward, out of 181 right
first answers, with 2–3 of 4 side flips being judge errors on unchanged answers.

## Likely slices

- **A — the eval's pushback mode** (REQ-247, with the REQ-226 and REQ-228 amendments).
  Tooling only. It goes first so the "before" run measures today's follow-ups on post-#293
  code from a real commit.
- **B — follow-ups keep their rules** (REQ-246, with the REQ-022, REQ-024, REQ-027,
  REQ-074, REQ-178, REQ-238 and REQ-242 amendments), plus the derived-doc rows marked
  `build` in `evidence/amendment-grep.md`.

## Assumptions and evidence

Each was resolved by the conservative ladder in `PRD/instructions/preparation-contract.md`.

1. **Re-run on the opening question, no store and no API field.** Rung 1: REQ-027 says
   no server-side session store; REQ-022 and REQ-074 forbid an `AskAiRequest` change.
   Rung 2: measured, the opening question with the history attached selects turn 1's
   rules in 62 of 62. The remaining risk, embedder repeatability, is target 7.
2. **The first history turn is the opening question, as sent.** Rung 2: the client puts
   the sent question first and appends every later turn
   (`useAskAiSubmitOrchestration.ts:171-174, 247-251, 330-341`); the schema requires a
   player turn first and allows 20 turns (`askAiRequest.ts:231-246`); prompt truncation
   never drops it in practice (the history budget is 1,000,000 characters, REQ-027), and
   the helper reads the request's history, not the truncated copy.
3. **Curated topics and step guidance carry too, not just System 3.** The intake said
   to leave them because they came from the frozen context. #293 made two of them read
   the question (REQ-238, REQ-242), and measured today 6 of 9 In-Depth follow-ups lose
   topics. Rung 1: the idea's outcome is "re-checks against the same rule excerpts the
   opening question retrieved"; the intake's own decision is "carry forward, don't
   re-retrieve". Carrying them keeps one rule for every rules section. They are separate
   slots (REQ-238, REQ-242, REQ-024, part of REQ-022) so the owner can keep System 3 only.
   Measured: System 3's excerpts stay identical either way (9 of 9 In-Depth).
4. **Carry, don't merge, for topics and step guidance as well.** Rung 4, smallest
   scope, and the intake's measured warning: extra rules on a re-check added wrong
   caveats (its "first question plus follow-up" arm doubled side-detail flips).
5. **The combo section keeps reading the follow-up text.** Rung 5: preserve behavior
   the request does not change. Combo context is not rules; the idea scopes rules.
6. **Lexical fallback on one turn only.** If turn 1's embedding failed and the
   follow-up's succeeds (or the reverse), or a deploy lands between turns, the
   follow-up's excerpts can differ from turn 1's. Accepted: rare, and the follow-up
   gets the current build's ranking of the opening question.
7. **Eval: experiment mode only, arm A only, no regrade, no practice suite.** Rung 4.
   Each refusal is reversible later. The practice suite stays out of this build by the
   idea's own non-goal.
8. **Eval disowning check is a fixed phrase list tied to a rule number turn 1 cited.**
   Rung 3: the eval's other deterministic checks (`namesGoldRuleId`, REQ-186) are fixed,
   tested text checks; the report lists every hit's transcript so a false positive is
   visible.
9. **The before/after check runs the before leg from slice A's commit.** Rung 3:
   REQ-226 measures an older revision by running the tooling from that revision's own
   checkout, never by importing code across checkouts.
10. **The check reads outcome flips with a small-count allowance.** The intake's own
    numbers show arm C at 2 outcome flips against today's 1, which a strict "no higher
    than today" rule would have failed on noise. Decision rule stays the owner's; it is a
    reading, never a gate (REQ-188, REQ-228).

## Re-grounded from the intake

The intake brief was written 2026-10-10, before #293. Checked against `0461969f`:

- `buildRetrievalQueryText` is at `preparation.ts:133`, not `:105`; the cap is up to 15
  with a 0.6 cutoff plus keyword sets beside them (REQ-190, REQ-235), not 10.
- "Curated topics come from the frozen context" no longer holds for In-Depth (REQ-242)
  or Quick Lookup step guidance (REQ-238); measured above.
- The "1.5 of 10 excerpts shared" figure is pre-#293 and hybrid; it is not carried
  forward. Today's keyword-half figure is 357 of 836; today's hybrid figure needs the
  embedder and is left to the before run.
- The 62 corpus cases are the committed diagnostic manifest: all approved with matching
  hashes, 9 In-Depth and 53 lookup, its hard set 16 cases (the intake's "18 hard" counts
  the 18 tier-3 cases).
- REQ-188 never says the eval omits history; the eval simply never sends it (no
  `conversationHistory` in `scripts/eval-answer-quality.mjs`). No REQ-188 amendment is
  needed; experiment-mode rules live in REQ-226.

## Non-goals

- No change to Luna's reasoning effort, prompt wording or format.
- No new rules for a follow-up that raises a new topic. Known cost: in the owner's live
  three-turn Necropotence conversation, the third turn's own words ("what about end step
  cleanup?") found 514.1, 514.2 and 514.3a today; with this change that turn keeps the
  opening question's rules instead. Merging fresh follow-up results is untested and
  parked.
- No combo-section change on follow-ups.
- No `AskAiRequest`, schema, route, response or frontend change.
- No change to scoring, the excerpt cap, the corpus, the embeddings or the 30-second
  answer budget.
- No judge change: the lone judge still never sees attached cards' oracle text (#295's
  note), on either turn.
- No practice-suite data, ids or results in any committed file.

## Proposed product truth

All in `GATE-QUESTIONS.md`, one block per ID:

- New: REQ-246 (follow-ups keep the opening question's rules), REQ-247 (the eval's
  pushback mode).
- Amended: REQ-178 (System 3 query), REQ-022 (rules enrichment), REQ-074 (Quick Lookup
  assembly), REQ-027 (follow-up contract), REQ-024 (step guidance), REQ-238 (Quick Lookup
  step guidance), REQ-242 (In-Depth question-word topics), REQ-226 (experiment record
  key), REQ-228 (paired report turn selector).

The enumeration is one grep over `PRD/sections/` with a disposition per hit:
`evidence/amendment-grep.md` (268 hits: 13 amend, 13 build, 242 no change).
