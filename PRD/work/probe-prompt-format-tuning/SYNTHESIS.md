# Synthesis — what three sessions of testing say about getting Luna to 100%

Written 2026-10-11, end of session 3. This is the reference to point a fresh
session at. It replaces reading `HANDOFF.md`, `HANDOFF-2.md` and the ledger
end to end. Evidence lives in the `FINDINGS-*.md` files and `PROBE.md`, which
are named where each claim is made.

## Bottom line

1. **Luna is already near 100% on everyday questions.** She gets 43 of 44
   ordinary corpus cases and 94% of the hard ones. She misses on rules corner
   cases: about a third of the practice suite, and most of the 25 hardest
   questions.
2. **Two separate gaps cause the corner-case misses.**
   - *The rule doesn't reach her.* The deciding rule is in her prompt for 19% of
     practice questions, and 8% of the hardest.
   - *She misapplies the rule when it does reach her.* With every deciding rule
     handed to her, 85% of her remaining misses were rules she had and got wrong.
3. **Fixing either gap alone doesn't get close to 100%.**
   - Every deciding rule added: 66 → 75 of 125 on the hard 25.
   - A stronger model of the same family (Sol), with today's prompt: no better
     on first answers.
4. **Prompt wording, deliberation tricks and search tuning are exhausted.**
   Nine variants lost or did nothing (list below). Don't re-test them.
5. **The open question is the one your friend's app raises:** does a much
   stronger reasoner (Opus), possibly with far more of the rule book in front of
   it, close both gaps at once? It's testable for about $15. That's the
   recommended next step, before any rebuild.

## The goal

The owner's definition of 100%: if Luna is wrong, being told so makes her
re-check and land on the right answer, and a right answer holds instead of
caving. At a table, the player saying "that's wrong" is often the one losing
the ruling, so holding matters as much as fixing.

## Where Luna stands

| Question set | Luna today (`gpt-6-luna`, medium effort) |
| --- | --- |
| Ordinary corpus cases (the project's own) | 43–44 of 44 |
| Hard corpus cases, 18 × 6 | 101 of 108 (94%) |
| Practice suite (RulesGuru, 1,184 questions, used with permission, local only) | 67–69% agree per pass; 31% of questions flip between passes |
| Hard 25 practice questions (level 3 / Corner Case, each answer checked) | about 53% (66 of 125) |
| The 10 hardest of those | 8 of 50 |

Weakest rules areas across the suite:
- last known information;
- combat damage;
- state-based actions;
- type line and subtypes;
- layers;
- leaving the game;
- zones.

On the hard 25, the misses group into a few reasoning patterns:
- judging a card at the wrong moment (as it enters or leaves);
- layer-4 ordering and dependency;
- "becomes an X" wording;
- phasing;
- casting order.

(`FINDINGS-suite-passes.md`, `HANDOFF-2.md`.)

## What we learned

### Gap 1: the deciding rule rarely reaches her

How rule search works today:
- **Chunks:** the Comprehensive Rules are cut into 2,893 chunks, one per
  numbered rule, with a median of 41 words. Ten chunks go into the prompt,
  alongside a few hand-written curated topics.
- **Ranking:** each chunk scores 60% on meaning, using `all-MiniLM-L6-v2`, a
  small bundled embedding model, and 40% on word match.

What we measured (all free, local):
- **19% of deciding-rule citations reach the prompt** across the suite. On the
  hard 25 it's 8%.
- **Missing rules aren't near misses.** The median missing rule ranks about
  300th. Three in four rank below 100th.
- **Why:** a question talks about specific cards. The deciding rule talks
  abstractly ("a replacement effect that modifies how a permanent enters…").
  Neither half of the search links the two.
- **What we tried, and it didn't help:**
  - *Length correction.* The same long rules (800.4a in 39% of prompts) crowd
    the slots because word match favours long text. Correcting for length
    pushes them out but finds fewer deciding rules. Today's setting is already
    the best variant. (`FINDINGS-rule-search.md`)
  - *Searching on Luna's step list instead of the question.* This doubles the
    deciding rules found (20 → 42 of 236), but never completes the set for
    an extra question. (`FINDINGS-rule-search.md`)
  - *Bigger chunks* (see the chunk-size section below). They find more rules
    only by adding proportionally more text. Efficiency is flat.
- **Value if solved:** with every deciding rule added, Luna went from 66 to 75 of
  125 on the hard 25. That's a real gain, but it's the ceiling for retrieval
  alone.

### Gap 2: she misapplies rules she has

With every deciding rule added, Luna listed her steps and the prompt part each
step relied on. A judge then sorted every miss into three kinds:

| Kind of miss | Count |
| --- | --- |
| Had the rule, applied it wrong | 148 (85%) |
| Prompt wording unclear | 16: 12 a misleading Wizards ruling, 3 the rule book's own banding wording, 0 our instructions |
| Prompt lacked it | 11 |

The rules she most often had and misapplied were 613.8a, 305.7, 614.12, 614.1c
and 613.6. Her own "this is unclear" notes were mostly noise: 206 flagged, 18
real and tied to a miss. (`FINDINGS-unclear.md`)

**Prompt rewording has little to aim at. This is a reasoning gap.**

### Gap 3: re-checking when challenged

| Re-check | Set | Held right | Abandoned right | Fixed wrong |
| --- | --- | --- | --- | --- |
| Player pushback, Luna | 62 corpus × 3 | 172 | 5 | 7 |
| Player pushback, Luna | hard 25 × 5 | 48 | 18 | 10 |
| Neutral self-check, Luna | hard 25 × 5 | 53 | 13 | 6 |
| Player pushback, Luna | hard 10 × 5 | 3 | 5 | 2 |
| Player pushback, Sol | hard 10 × 5 | 4 | 5 | 7 |

- On easy questions she holds.
- On hard ones she caves about as often as she corrects.
- Sol re-checks better (7 fixed to 2, same abandon rate), but 50 conversations
  is a hint, not proof.

(`FINDINGS-pushback-hard25.md`, `FINDINGS-models-hard10.md`.)

### Model comparison so far

| On the hard 10, today's prompt | Luna | Sol (`gpt-6-sol`) |
| --- | --- | --- |
| First answer right | 8 / 50 | 9 / 50 |
| Wrong outcome | 33 | 33 |
| Median time | 16.3 s | 8.4 s |
| Cost per answer | $0.0015 | $0.0205 |

- **Sol doesn't fix first answers.** That's with today's prompt, which mostly
  lacks the deciding rule. Sol with the rules present is untested.
- **Terra** (`gpt-5.6-terra`) was dropped: it's an older model at about Sol's
  price.
- **Astra** is untested.
- **Judging:** `gpt-6-luna` as a judge agrees with `gpt-6.1-sol` on 96% of
  right/not-right calls, at about a twentieth of the cost. Use it for probe
  runs.

## Don't re-test: nine things that lost or did nothing

| Tried | Result |
| --- | --- |
| Layer/timing recipe in the prompt | 96 vs 101 of 108 hard corpus |
| Describe tasks before answering | 96 vs 101; hard 25 47% vs 62%; twice as slow |
| High reasoning effort | 94 vs 101; 7 answers over 30 s |
| Low reasoning effort | 88 vs 101 |
| More curated rules topics on Quick Lookup | 62/120 vs 64/118 |
| Automatic self-check after every answer | hard 25 66 → 59; slower |
| Length-corrected rule search | fewer deciding rules found |
| Search on Luna's step list | no question gains its full rule set |
| Asking Luna what's unclear | 85% of misses are misapplied rules; little wording to fix |

The common thread: every "make Luna think more" variant lost, and every "find
the rules better" variant hit the same wall.

## Ready to build (independent of everything else)

**Follow-ups keep their first-turn rules.** Today a follow-up searches rules on
the follow-up text alone. It keeps 1.5 of 10 rules, and 29 of 186 follow-ups
told the player a rule she'd cited "wasn't provided". Carrying turn 1's rules
forward fixes that (0 "wasn't provided", 7 fixed vs 4).

The same build adds a pushback mode to the answer-quality eval. Everything it
needs is in `GRAPH-BRIEF.md`. Handoff:
`/graph-kickoff "Follow-ups keep their first-turn rule excerpts, and the answer-quality eval gains a pushback follow-up mode" PRD/work/probe-prompt-format-tuning/GRAPH-BRIEF.md`

## RAG: chunk size and the whole rule book (free measurements)

The whole Comprehensive Rules is about 842,000 characters, or about 211,000
tokens. It splits into 146 sections (614, 702 …) and 1,174 rule families
(614.12 with its sub-rules).

"Small-to-big" retrieval means matching on small chunks, then handing over the
whole family or section each hit belongs to. Across the suite, here are the
share of deciding rules reached, and the rule text added to the prompt
(`runs/missing-rules/chunk-size-probe.mjs`):

| What goes in the prompt | Deciding rules reached | Rule text added (median) |
| --- | --- | --- |
| Today: top 10 rules | 19% | 7k chars |
| Top 30 rules | 27% | 19k |
| Top 10 hits → their whole families | 28% | 21k |
| Top 3 hits → their whole sections | 27% | 40k |
| Top 100 rules | 38% | 52k |
| Top 5 hits → their whole sections | 33% | 95k |
| The whole rule book | 100% | 842k |

**Chunk size isn't the lever.** Bigger chunks find more rules only by adding
proportionally more text. At about 20k characters every variant lands near 27%.
The search itself (small embedder plus word match) can't point at the right
part of the book.

There are two ways past that:
- **A much better search.** A stronger embedding model is untested. Re-embedding
  the rule book with a hosted model costs cents. The backend already has an
  OpenAI embeddings seam (`text-embedding-3-small`).
- **Skip search for the rules entirely,** and put the whole book in the prompt,
  cached. 211k tokens fits modern long-context models.

## Your friend's app (Opus): what it could mean

**What we know:**
- His app runs Claude Opus and reportedly gets near 100%.
- He got the Necropotence end-step cleanup question right on the first try.
- He tests with the same RulesGuru questions, so his numbers can be compared
  with our 67–69% suite agreement once we know how he scores.
- He uses RAG, not the whole rule book, and spent a lot of time on chunking.
- He says a conversation costs a few cents with Opus. That matches the
  ~$0.05 estimate for Opus with a normal-sized prompt, and rules out
  whole-book prompting.

**Read this with care:**
- **"Near 100%" on which questions?** Luna is near 100% on everyday questions
  too (43 of 44). The meaningful bar is our hard 25, where Luna gets about 53%.
- **One right try isn't a rate.** The Necropotence + Silence + Borne Upon a Wind
  corner case exists twice in the corpus. Pooling every first answer at today's
  setting across the pushback, carry-forward, re-retrieve and self-check runs:
  - In-Depth (full game state): 10 of 12 right;
  - Quick Lookup (question + cards only): 6 of 12, a coin flip.

  At low effort both collapse (1 of 6 each). Her failures are intermittent,
  not constant.

**Why Opus could still be the real answer:** our two gaps point the same way.
- A much stronger reasoner addresses Gap 2 (misapplying rules she has).
- A model that already knows the rule book well depends less on Gap 1
  (retrieval). Top models carry much of the Comprehensive Rules from training.
- Sol is a step up within the same family. It isn't a different tier of
  reasoning.

**Worth asking your friend:**
1. What does "near 100%" mean? Which questions, and how many?
2. What goes in the prompt? Retrieved chunks (what size, and how many), whole
   sections, or the whole rule book with caching?
3. Which embedding model does he use, if any?
4. Does he use extended thinking? How long do answers take?
5. What does an answer cost him?

## Costs per answer (estimates)

| Setup | Per answer | Per 1,000 questions | Basis |
| --- | --- | --- | --- |
| Luna, today's prompt | $0.0015 | $1.50 | Measured, hard questions |
| Sol, today's prompt | $0.02 | $20 | Measured, hard 10 |
| Luna + whole rule book | ~$0.02 uncached | ~$20 | 211k tokens × $0.10/M; OpenAI cache discount not checked |
| Opus, today's prompt | ~$0.05 | ~$50 | ~4k in × $4/M + ~1.5k out × $20/M |
| Opus + whole rule book, cached | ~$0.09 | ~$90, plus cache refills | 211k cached reads × $0.20/M on top |

Opus figures use third-party listings of Opus 5.5 pricing: $4 / $20 per million,
$0.20 cache reads, $8 per million for a 1-hour cache write. Check Anthropic's
own rate card before budgeting.

**The caching catch:** at low traffic the cache expires between questions. Each
refill writes the whole book again, about $1.70 an hour for a 1-hour cache. The
first uncached request costs about $0.85. Whole-book prompting only pays at
steady traffic.

Latency is unmeasured. A 211k-token prompt adds read time even when cached, so
it has to be checked against the 30 s budget.

## Next session (owner's direction, 2026-10-11): deep RAG and prompt analysis, aimed at Necropotence

**Goal:** the Necropotence + Silence + Borne Upon a Wind cleanup case right
every time, in both versions, without breaking anything else.

**Bar:**
- 10 of 10 right on In-Depth and 10 of 10 on Quick Lookup, at today's setting;
- no loss on the hard corpus cases (18 × 3) or the ordinary ones.

5 of 6 against 6 of 6 is within noise, so measure at 10+ repeats.

**The question:** is the gap in how rules are found (RAG), in how the prompt is
built and worded, or both? The owner suspects the prompt may simply not be
built right. His friend's app (Opus + carefully chunked RAG, a few cents a
conversation) suggests the chunking and prompt design may matter more than
our tests so far assumed.

**Leads already visible, to check first (all free):**

1. *Quick Lookup vs In-Depth: 6 of 12 vs 10 of 12 on the same corner case.*
   Diff the two prompts Luna actually receives:
   - which rules arrive;
   - which curated topics;
   - which Wizards rulings;
   - section order and size.

   What In-Depth carries that Quick Lookup lacks is the first suspect.
   Quick Lookup gets only the four always-on topics plus the replacement topic
   (REQ-220).
2. *The search query never sees what the cards do.* It uses each card's name,
   type line and keywords, not its rules text (REQ-178). Full rules text was
   dropped because it drowned the old benchmark. But Necropotence's deciding
   ideas live in card wording: "skip your draw step", "until end of turn",
   "at the beginning of your end step". These map to rule concepts (cleanup
   step 514.3a, end of turn effects ending 514.2) that the query never names.
   - *Candidate:* turn card wording into rule-concept search terms, using a
     small curated phrase → rule map or one cheap extraction call. Search on
     those terms, not on raw card text.
3. *Chunks lose their context.* Each chunk is one numbered rule, median 41
   words. A sub-rule like 514.3a arrives without its parent 514.3 or the
   section title. Common RAG practice:
   - prefix each chunk with its section and parent rule ("contextual chunk
     headers");
   - match small, hand over the parent.

   The chunk-size probe showed parents alone don't raise reach per character;
   headers that improve the *match* are untested.
4. *The embedder is small.* `all-MiniLM-L6-v2` has 384 dimensions and reads at
   most about 256 word pieces. Long rules are cut before they're embedded. A
   stronger embedder (hosted, cents to re-embed the whole book) is untested on
   deciding-rule reach.
5. *Nothing reorders the shortlist.* There's no reranking step: a model scoring
   the top 50–100 candidates against the question. Top 100 holds 38% of
   deciding rules against 19% in today's top 10, so a good reranker could
   roughly double reach at today's prompt size. It can't exceed 38% without
   better recall first.
6. *Prompt construction.* Audit `apps/backend/src/prompt/` end to end:
   - section order and labels;
   - how rule excerpts, curated topics and Wizards rulings are framed;
   - what Luna is told to do with each;
   - total length.

   12 of the "unclear" misses were a Wizards ruling for a nearby situation
   pulling her off course. How rulings are introduced may matter.

**How to run it:**
- Free first: retrieval reach for each candidate on the whole suite, hard 25,
  and both Necropotence cases (the `runs/missing-rules/` scripts are the
  template).
- Only then paid: Necropotence × 10 per version, plus the corpus regression
  sets, graded by the Luna judge (96% agreement with Sol).
- Each paid arm costs well under $1.

**Ask the friend (makes the analysis far sharper):**
- chunk size and boundaries;
- whether chunks carry headers or parent text;
- embedder and reranker;
- how many chunks reach the prompt;
- how card text is used in the query;
- prompt structure;
- how he scores RulesGuru, and his number.

## Alternative decisive test: Opus on our hard questions

**Opus on our hard questions,** graded by the Luna judge. Two setups:

1. **Opus with today's prompt.** This tests whether it's the model.
2. **Opus with the whole rule book in the prompt, cached.** This tests whether
   it's the model plus full rules.

| Set | Size | Notes |
| --- | --- | --- |
| Hard 25 | × 3 | |
| Hard corpus cases | 18 × 3 | Includes Necropotence + Silence and Academy Manufactor + Esix |
| Ordinary corpus cases | × 1 | Regression watch |

Add the pushback turn, the same as every other run here.

- **Cost:** about $15 for both setups.
- **Needs:** an Anthropic API key. The project is OpenAI-only today. A probe
  script can call Anthropic directly without touching product code.
- **How to read it:**
  - *Opus, today's prompt, near 100% on the hard 25:* the model is the lever,
    and the decision becomes cost (compare Opus on disputes only).
  - *Only the whole-book setup gets there:* the rebuild is about context, not
    search tuning.
  - *Neither gets there:* the remaining misses are reference disputes or truly
    contested rulings, and 100% on corner cases isn't a realistic bar.

**Cheaper side test (cents):** re-embed the rule book with a hosted embedding
model and re-measure deciding-rule reach. This tests whether "better search"
is real or whether the wall is in the questions themselves.

**Shelved until the Opus result is in:** "Luna answers, Sol re-checks on
dispute" (about $2.50, design in `FINDINGS-models-hard10.md`). If Opus wins, the
same escalation idea applies with Opus.

## How to run things (don't rediscover)

- **Worktree:** `.worktrees/probe-pft` (detached at `9a9852dc`, `npm ci` done,
  embedder warm). It holds all local practice-suite data under
  `output/rulesguru/`. Paid runs refuse a checkout with untracked files, so
  they run there. Don't remove it without asking.
- **Every live run:** dry run first. Pass `--max-cost-usd` ≤ 15, or a script's
  own hard stop. Check `embeddingProvider` `local` and the reported model on
  every record.
- **Sets:**
  - hard 25: `output/rulesguru/reports/pft-hard25-verify.json`;
  - hard 10: `pft-hard10.json`, picked by `runs/model-compare/pick-hard10.mjs`.
- **Reusable scripts:**
  - two-turn pushback with any OpenAI model and both judges:
    `runs/model-compare/model-compare-probe.mjs`;
  - every-rule injection plus step diagnosis: `runs/unclear-hard25/`;
  - free retrieval measurements: `runs/missing-rules/`.
- **"Right"** means Correctness 2 from the judge (rubric `2026-10-10.1`). The
  owner sided with the strict judge: a right outcome with a real side error
  scores 1.
- **Variance:** 31% of practice questions flip between passes. Compare settings
  with repeats, never single runs.
- **Privacy (non-negotiable):** practice-suite questions are used with
  permission and stay local. No question text, answer, card list or
  per-question result goes into any committed file, PR, commit message or
  `PRD/` text. Counts, levels, rules sections and tags only.
- **Billing:** the OpenAI account ran dry once mid-run (2026-10-11). Auto-reload
  is now on. The scripts resume from disk.

## Spend to date

About $84: sessions 1–2 about $75, session 3 $8.58. Session 3 covered pushback
on the hard 25 ($2.15), "ask what's unclear" ($2.66), Luna on the hard 10
($0.94) and Sol on the hard 10 ($2.83).

## Sources for the cost figures

- Opus 5.5 pricing (third-party, unverified):
  - [eesel.ai](https://www.eesel.ai/blog/claude-opus-5-5-pricing)
  - [finout.io](https://www.finout.io/blog/claude-opus-5.5-pricing-2026-what-anthropics-new-flagship-actually-costs)
  - [layer3labs.io](https://www.layer3labs.io/guides/claude-opus-5-5-api-pricing)
- OpenAI rates: the eval's own table, `scripts/eval-answer-quality.mjs`, checked
  2026-10-08.
