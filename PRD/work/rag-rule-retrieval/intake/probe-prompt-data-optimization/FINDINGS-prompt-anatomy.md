# Findings: prompt anatomy and retrieval noise

Measured over the 30 committed golden prompts in
`apps/backend/src/eval/fixtures/*.prompt.golden.txt` (the exact text the
backend sends to OpenAI for each fixture). Script:
`scratchpad/measure-prompts.mjs`; full tables in
`APPENDIX-prompt-measurements.md`. Chars are counted; tokens are estimated at
4 chars/token.

## 1. Where the prompt's data budget goes

Average prompt: **16,993 chars (~4,250 tokens)**.

| Section | Share of all prompt text | Avg chars/prompt |
| --- | ---: | ---: |
| `GAME RULES (reference)` — System 2 curated topics | **57.2%** | 9,726 |
| `ADDITIONAL RELEVANT RULE EXCERPTS` — System 3 lexical retrieval | **20.9%** | 3,553 |
| `MTG REFERENCE` — static block | 8.8% | 1,500 |
| `SYSTEM ROLE PREAMBLE` + `INSTRUCTIONS` | 4.9% | 830 |
| Combo context | 2.8% | 470 |
| `ZONE:` card blocks (the player's actual board) | 2.6% | 450 |
| `SCOPE` + `GENERAL GAME CONTEXT` + `PHASE GUIDANCE` | 1.6% | 273 |
| `QUESTION` | 0.4% | 69 |
| `CARD (looked up)` | 0.4% | 63 |
| `OFFICIAL RULINGS` — System 1 | **0.3%** | 58 |

Read as a player experience: when someone asks a question, **78% of what the
model reads is rules text the backend chose for it**, about **4% is the
player's own board and question**, and well under 1% is the card-specific
official rulings that are the most precise grounding the corpus has.

## 2. System 2 (curated topics) is the biggest cost and is state-gated, not question-gated

Selection is by `turnPhase`, `combatStep`, and which zones are populated
(`apps/backend/src/gameRulesTopicSelection.ts`; documented in
`PRD/sections/system-map/game-rules-retrieval.md`). Consequences seen in the
goldens:

- A populated battlefield pulls in the full layer system (613.1a–g, 613.4a–c,
  613.7, 613.8a) and both replacement-effect topics on every request,
  whether or not the question is about layers. 15 fixtures carry these.
- Any stack pulls in copying (707.10, ~1,900 chars with three examples) and
  cost determination (601.2f) on every request.
- `full-context` (question: "How does this interaction resolve?") renders
  15 topics = **17,305 chars** of curated rules for a Brainstorm / Narset's
  Reversal / Rhystic Study interaction. Roughly two of those topics
  (copying, resolving targets) are on-point.
- Lookup mode always renders the same 4 always-on topics = **4,094 chars**,
  including for `quick-lookup-off-domain` ("How do I bake sourdough bread?"),
  which the instructions tell the model to refuse.

Per-fixture S2 size clusters at 4,094 (lookup), 9,501 (battlefield only),
11,898 (stack only), 17,305 (stack + battlefield). The size is a function of
board shape, not of what was asked.

## 3. System 3 (lexical retrieval) has a measurable length bias and a stable set of attractor rules

Across the 30 goldens, 145 supplemental picks (99 unique rule IDs):

| Measure | Value |
| --- | ---: |
| Corpus mean entry length | 240 chars (p50 188, p90 480) |
| Mean length of a selected entry | **684 chars** (2.85× corpus mean) |
| Selected entries in the longest 10% of the corpus | **81 of 145** |
| Median selected entry's length percentile within corpus | 92nd |

Cause: `scoreEntry` in `apps/backend/src/gameRulesRetrieval.ts:292-327` sums
IDF weight over every query token that appears in the entry, with no length
normalization (no BM25-style saturation or document-length term). A long
rule matches more query tokens and wins on volume. This is the second half of
what the prior 156-question benchmark found (multi-card queries flood the
query side; this is the flood on the document side).

Recurring picks that are almost never relevant to the question asked:

| Rule | Appears in | What it is | Length |
| --- | ---: | --- | ---: |
| 712.21c | 8 of 30 fixtures | melded permanents leaving the battlefield (double-faced cards) | 1,286 |
| 702.75a | 5 | hideaway keyword | 349 |
| 614.13c | 5 | replacement effects modifying how a permanent enters | 960 |
| 702.44c | 4 | sunburst keyword | 510 |
| 616.1f | 3 | interaction of replacement/prevention effects | 1,052 |
| 732.2a | 3 | taking shortcuts | 1,577 |
| 400.6 | 3 | zone-change event determination | 1,400 |

Example: `full-context` ("How does this interaction resolve?") retrieved
603.8 (state triggers), 118.12 (if-you-do costs), 807.5b (multiple stacks in
Grand Melee), 732.2a (shortcuts), 603.10a (leaves-the-battlefield). None of
the five bear on the question. That is **5,904 chars of pure noise** in that
prompt, and the pattern repeats: generic questions ("What happens here?",
"Resolve the stack") retrieve on card oracle text alone, and oracle text of
ordinary cards matches long generic rules.

Where lexical does work: the six worked-solution cases
(`npm run eval:worked-solutions`) hit 6/6, but their questions were authored
by this project using the rule's own vocabulary ("delayed trigger", "last
known information"). That is the clean-query case, not the player-phrasing
case.

## 4. Query construction dumps every card's oracle text into the query

`buildQueryParts` (`gameRulesRetrieval.ts:220-246`) appends turn phase, zone
names, and every card's name + type line + oracle text + context notes to the
question. The question tokens get a 3× multiplier, but a five-card board
contributes 30–100 oracle tokens against a 5–15 token question. This is the
mechanism the prior benchmark measured as recall@5 falling to 0.03 on
multi-card queries. It is independent of whether scoring is lexical or
embedding-based: a semantic query built the same way inherits the same flood.

## 5. Rulings (System 1) are the smallest section by a wide margin

`OFFICIAL RULINGS` appears in only 5 of 30 goldens and averages 58 chars
across all prompts. Fixture cards are mostly synthetic IDs so this
under-represents production, but the shape holds: rulings are exact-match on
oracle ID, capped per card and per section, and are the only per-card
authoritative text in the corpus. They are currently the cheapest and most
precise grounding the prompt has, and the least of the budget.

## 6. How the prompt reaches the provider: one flat string, no cacheable prefix

`apps/backend/src/providers/openAiResponsesProvider.ts:40-43` sends the
entire assembled prompt as a single `input` string to the Responses API with
`model` only. No `instructions` field, no system/user split, no cache
control.

Prompt-caching arithmetic, checked against the OpenAI prompt-caching guide
and pricing page on 2026-09-01 (`developers.openai.com/api/docs/guides/prompt-caching`,
`/api/docs/pricing`):

- Caching is automatic on an identical prefix. For models older than
  GPT-5.6, which includes `gpt-4.1`, the **minimum cacheable prefix is
  2,048 tokens**, rounded down to a multiple of 128, and an entry stays warm
  for about **5 to 10 idle minutes**. `gpt-4.1` bills $2.00 per million
  input tokens, $0.50 cached, $8.00 output; `gpt-4.1-mini` is $0.40 / $0.10 /
  $1.60.
- Today's byte-identical prefix is preamble + instructions + `MTG REFERENCE`
  ≈ 2,330 chars ≈ **580 tokens**. Far below the minimum: **zero cache hits
  on any request today.**
- Moving the four always-on System 2 topics (4,094 chars) into the fixed
  prefix reaches ≈ **1,600 tokens**, still under 2,048. To cache on
  `gpt-4.1` the fixed prefix would have to be ≈ 8,200 chars, i.e. roughly
  half of today's average prompt would have to become state-independent
  and render first. With scale-to-zero traffic and a 5–10 minute cache
  lifetime, hits would be rare even then. **Caching is not a lever worth
  designing around for this app**; the cost lever is sending fewer tokens,
  not caching more of them.
- Output tokens cost 4× input on `gpt-4.1`. A 4,250-token prompt costs
  about $0.0085; a 600-token answer costs about $0.0048. Halving the rules
  text saves roughly $0.004 per question. The value of the cuts below is
  answer quality (less noise for the model to weigh), not spend.

Production runs `gpt-4.1` (`apps/backend/.env.example:8`); the bootstrap
default is `gpt-4.1-mini` (`scripts/aws-bootstrap.sh:17`). The prompt budget
constant is effectively unlimited (`EFFECTIVELY_UNLIMITED_CHARS` =
1,000,000, per `PRD/sections/system-map/prompt-assembly.md`), so nothing in
the code pushes back on section growth.

## 7. Small defects found on the way

- `formatSupplementalRulesSection` (`apps/backend/src/prompt/promptFormatting.ts:280`)
  renders `${ruleId}. ${text}` but `text` already begins with the rule ID, so
  every supplemental excerpt prints its number twice ("603.8. 603.8. Some
  triggered abilities…"). Cosmetic, but it is in every live prompt.
- `npm run retrieval:report` (`scripts/retrieval-relevance-report.mjs:56`)
  crashes on `main` with `Cannot read properties of undefined (reading
  'playerCount')`: it passes every fixture with an `expected` block through
  the game-mode `buildPromptContext`, and four lookup-mode fixtures
  (`quick-lookup-card`, `quick-lookup-multi-card`, `quick-lookup-no-card`,
  `quick-lookup-off-domain`) now carry `expected` blocks. The review aid
  that DEC-047 introduced for tuning System 3 has been unusable since those
  fixtures were labeled. The gating test (`npm run test:eval`) is green; only
  the human-readable report is broken.

## 8. What this means for the ask

Ranked by expected effect on what the model actually reads:

1. **Fix the query before choosing the scorer.** Build the retrieval query
   from the question plus a compact card signal (name, type line, keyword
   list, and the specific sentence of oracle text the question mentions), not
   the full oracle text of every card. Needed for lexical today and for
   embeddings tomorrow. Prior benchmark already quantified the flood.
2. **Length-normalize or replace the lexical scorer.** BM25 (k1/b) would
   remove the 2.85× length bias immediately; hybrid lexical + embedding (the
   prior brief's RA-004 fusion) is the end state. The recurring attractor
   list above is the regression set to test against.
3. **Make System 2 question-aware or shrink it.** Either keep the state
   gating but cap each topic to its lead rule (drop CR examples from the
   curated block), or replace the conditional buckets with retrieval and keep
   only the four always-on topics as a fixed prefix. The layer topics alone
   are ~3,000 chars on every battlefield question.
4. **Give rulings more of the budget.** They are 0.3% today. Raising the
   per-card cap or ordering rulings by relevance to the question (once a
   scorer exists) is cheap.
5. **Split instructions from content when sending.** Use the Responses
   API `instructions` field for the preamble and behavioral rules and keep
   `input` for context and question. No data change, but it stops the
   ground rules from competing with 4,000 tokens of rules text for the
   model's attention. Prompt caching itself is not worth chasing (section 6).
