# Findings: free audit of rule search and prompt building (session 4, 2026-10-11)

Free and local. No model was called. Three parallel audits ran:
- **the search engine** (`S` ids);
- **the rule data** (`D` ids);
- **prompt building, including Quick Lookup against In-Depth** (`P` ids).

Scripts and raw outputs are in `runs/audit-search/`, `runs/audit-data/` and `runs/audit-prompt/`.

The audit agents couldn't save their own report files, so this file merges their reports. The headline claims were re-checked directly against code and data:
- the excerpt order and the doubled ids in the saved Necropotence prompt;
- the phase-guidance text;
- the tokenizer split;
- 514.3a's stray part title;
- 700.15, 303.7 and 704.5aa missing from the index;
- the 20-word keyword list.

Both saved Necropotence prompts hash-match the paid runs (Quick Lookup `16c57d45…`, In-Depth `bcc3b22e…`). The probe's copy of production ranking matched production's top 10 on every question checked: 1,181 suite, 25 hard, 415 corpus.

Privacy: practice-suite outputs hold counts, rule ids and keyword names only.

## The answer

1. **The Necropotence Quick Lookup gap has two failures. The wrong answers come from the second.**
   - *Search:* the exception rule 514.3a (a trigger during cleanup gives priority) never arrives, in either version. Luna gets that part right only from her own training, which isn't guaranteed. Fix #3 below (deliver a lead-in's list) guarantees it, because 514.3 ranks 2nd.
   - *Prompt building:* the rule ending Silence's effect is present but misused.

   Prompt-building fixes only count once the needed rules are guaranteed present. The detail:
   - The fact that decides it was in the prompt: 703.4p, "this turn" effects end during cleanup. But it arrived as item 5, after the "you get priority" rule.
   - The prompt also says "no priority" twice (514.3 and 724.1f), and 514.3 ends "subject to the following exception:" with the exception missing.
   - In-Depth gets a one-paragraph ordered summary of the cleanup step. Quick Lookup never does.
   - In 5 of 6 Quick Lookup misses, Luna found the priority window and still ruled that Silence applies.
   - p ≈ 0.04 pooled with the breakdown run. Consistent mechanism, not yet proven.
2. **Search has one real bug and several small ones.** Fixed all together, they move deciding-rule reach from 19% to 23%.
   - The real bug: a card's keywords get keyword weight only if they're on a 20-word list.
   - Worth fixing, but it doesn't close the gap. When the deciding rule misses, it still ranks about 450th.
3. **The rule data is current but has four parser bugs.**
   - A stray part title on 514.3a and 7 other rules.
   - Two real rules missing (700.15 "enters", 303.7).
   - 704.5aa merged into 704.5z.
   - Sentence-ending periods break word matching.
4. **Many small prompt bugs.** Wrong facts in the step summaries, text that describes sections Quick Lookup doesn't have, a pointer to a glossary that isn't there, stack numbered two ways, and rule ids printed twice.
5. **What free work can and can't settle.** Free work can find and fix bugs, and confirm each fix is present. Whether a design change (ordering, framing, step summaries) makes Luna rule better needs a paid check. Batch those into one run once the prompt is clean.

## Ranked fix list

Ranked by likely effect on Luna, in player terms.

| # | Fix | Ids | Kind | Evidence of effect |
| --- | --- | --- | --- | --- |
| 1 | Give Quick Lookup the step summary when the question names a turn step, and correct every step summary against the rules | P1, P4 | Weakness + Bug | Main cause of Quick Lookup 6/12 against In-Depth 10/12 |
| 2 | Show rule excerpts in rule order, grouped by family, each with a path label ("Turn Structure › Cleanup Step › 514.3a") and its parent's lead-in | P2, D5, D6, P10 | Weakness | 0 of 46 prompts are in rule order today. 370 pieces (13%) only make sense next to their parent or siblings |
| 3 | Never deliver a lead-in without its list ("following rules:", "following exception:") | P3, D11 | Bug (curated) / Weakness | Curated 117.3 dangles in 414 of 415 prompts, 400.7 in 398. 514.3 dangles on Necropotence |
| 4 | Count every card keyword as a keyword in search (multi-word keywords as one phrase) | S1 | Bug (against REQ-180) | Suite +58 deciding citations (473 → 531). Corpus every-rule-present 305 → 336 of 415 |
| 5 | Fix the rule parser: part titles, curly-quote rules, double-letter ids | D2, D3, D4 | Bug | 8 pieces carry a stray part title (incl. 514.3a, 616.2). 700.15 and 303.7 are never shown. 704.5aa is mislabelled |
| 6 | Put the game's turn step in the In-Depth search query | S2 | Weakness (amends REQ-178) | Necropotence In-Depth: 514.3a rank 17 → 8 |
| 7 | Frame Wizards rulings as situation-specific, and place each card's rulings under the card | P6 | Weakness | 12 "unclear" misses came from a nearby-situation ruling |
| 8 | Strip sentence-ending periods in word match; map "can't" → "cannot" | D1, S5, D13 | Bug | Small measured gain (+1 citation). Correctness fix |
| 9 | Clean the instructions: one shared list, a per-mode reference block, a single stack-numbering convention, no dangling glossary pointer, rules framed as binding | P8, P9, P14, P15, P17 | Bug + Weakness | Quick Lookup is told about sections it never has |
| 10 | Resolve "see rule X" pointers: attach the target, or a family/section summary | D7, P18 | Weakness | 73% of pointers in Quick Lookup prompts point at text that isn't there |
| 11 | Pick In-Depth curated topics by card wording, not by which zones have cards | P7 | Weakness | About 6.2k unrelated characters on Necropotence |
| 12 | Make a switch to a stronger embedder fail loudly instead of silently dropping to word-only search | S7 | Bug (latent) | Must come first before any embedder test |
| 13 | Smaller fixes | P11 (no P/T in card data), P12 (oracle line breaks lost), P16 (delayed-trigger topic has the wrong rule), D10 (glossary missing: obsolete terms like "mana burn" don't translate), S3 (stemming: mixed, test first), S6 (follow-up query), S8 (stray 3-digit number = rule id), S12 (everyday verbs on the keyword list), S13 (tie-break), D12 (no rule-book edition stamp) | Mixed | |

Not levers (measured):
- **Length re-weighting on its own (S4).** Long rules over 256 word pieces are 1.7% of the book and take 26% of slots, but correcting for length swaps them for other non-deciding rules.
- **A true min-max blend (S9):** 473 → 460.
- **A shorter embed window (S10):** 473 → 467.

The 2,000-character cut costs rule text only in 205.3m. The embedder's real window is 512 word pieces, not 256 as SYNTHESIS says.

## Still open, and still free to measure

These go after the remaining wall: search can't link what a card does to the abstract rule.

- **Card wording → rule-concept search terms** (SYNTHESIS lead 2). This is the one fix aimed at Necropotence's missing 514.3a: its trigger link lives only in card text.
- **A stronger local embedder** run through transformers.js (bge or e5 class). Free, unlike hosted. Fix S7's silent fallback first.
- **A local reranker** (a cross-encoder) over the top 100. Top 100 holds 38% of deciding rules, against 19% in the top 10.

## Detail by audit

### Search engine (S)

| Id | What's wrong | Evidence | Measured effect | Kind |
| --- | --- | --- | --- | --- |
| S1 | Card keywords get ×6 weight only if on the 20-word list | `gameRulesRetrieval.ts:396-398, 440`; `gameRulesKeywordVocabulary.json`. 975 of 1,514 suite card keywords (64%) get none: Enchant, Mill, Equip, First strike… | +58 suite citations; corpus every-rule-present 305 → 336 | Bug (REQ-180) |
| S2 | Query has no card wording (REQ-178) and no In-Depth turn step | `gameRulesRetrieval.ts:400-416` | Adding the step: 514.3a 17 → 8; 9 In-Depth cases 17 → 18 | Weakness |
| S3 | No stemming | 401 suite question words miss on inflection only | Suite +24, hard 25 5 → 7, corpus −3 | Weakness |
| S4 | Long rules take slots; no length or term-frequency correction | `:530-553`. Over 256 pieces: 1.7% of book, 26% of slots, 1.9 deciding per 100 slots against 4.1 for 65–128 | Re-weighting alone doesn't help | Weakness (known) |
| S5 | Sentence-ending dots kept on words | `:359`. 32% of suite questions lose a word | +1 citation | Bug |
| S6 | Follow-up searched alone | `preparation.ts:105-119`. Necropotence follow-up deciding ranks 1,911 / 335 / 290 | Unknown suite-wide | Weakness |
| S7 | `EMBEDDING_PROVIDER=openai` silently drops to word-only (1,536 vs 384 dims) | `openAiEmbeddingProvider.ts:4`, `gameRulesRetrieval.ts:671-675` | None today; breaks any embedder test | Bug (latent) |
| S8 | Any standalone 3-digit number counts as a rule id | `:366`. Fired 0 times | Latent | Bug |
| S9 | 60/40 blend acts like about 50/50; "min-max" is really divide-by-max | `:686-688, 726-729` | True min-max: 473 → 460 | Naming |
| S10 | Embedder window 512, trained at 128 | `embedder-window-probe.out.txt` | Embedding at 256: 473 → 467 | None needed |
| S11 | Excerpts in score order | see P2 | | Weakness |
| S12 | Everyday verbs on the keyword list (counter, destroy, exile, sacrifice, trigger, replacement) | ×6 fires on 50% of suite questions | Untested | Weakness |
| S13 | Tie-break `parseFloat(ruleId)` | `:755`. 0 boundary ties | None | Bug (cosmetic) |
| S14 | Rule-id boosts never fire for player questions | 0 of 1,596 | None | Info |

Checked and fine:
- the query and rule tokenizers are the same code;
- token stats match a rebuild;
- rule vectors match a fresh embedding;
- no query is cut;
- curated dedupe is exact-id.

### Rule data (D)

| Id | What's wrong | Evidence | Kind |
| --- | --- | --- | --- |
| D1 | Word match keeps the final period ("graveyard." ≠ "graveyard") | `build-game-rules.mjs:30`; 2,302 of 2,893 pieces affected, incl. 704.5f, 701.8a, 701.21a | Bug (= S5) |
| D2 | Part titles glued onto the last rule of each part | 123.9, 213.1g, 315.7, 408.3, **514.3a**, **616.2**, 733.2, 811.5; `build-game-rules.mjs:200` | Bug |
| D3 | 700.15 and 303.7 dropped as "headings" (curly closing quote); 702.163 and 702.179 kept as empty pieces | `build-game-rules.mjs:131-139` | Bug (REQ-179) |
| D4 | 704.5aa merged into 704.5z | id pattern allows one letter (`:200`) | Bug |
| D5 | Labels lack part, keyword and family: 127 "General", 579 "Keyword Abilities"; prompt prints none | `promptFormatting.ts:292` | Weakness |
| D6 | 370 pieces need parent or siblings (list items, "First/Second", "At this point", "this rule"); 50 pieces in 23 groups have identical text (504.2 = 507.2 = 508.2 = 509.2) | `runs/audit-data/out/context-loss-ids.json` | Weakness |
| D7 | 37% of citations point at a bare section or dropped family title; 111 pieces hand their procedure to another rule | `out/cross-refs.json` | Weakness |
| D8 | Examples outweigh the rule in 132 vectors (613.6: 91 rule + 484 example tokens) | | Weakness |
| D9 | 2,000-char cut costs rule text only in 205.3m | | Weakness (minor) |
| D10 | Glossary (741 entries, 35 obsolete terms) not in the data | `build-game-rules.mjs:191` | Weakness |
| D11 | Curated topics current, but 117.3, 510.1, 603.10 end in ":" without their list; layer topics omit 613.4d, 613.8b | | Weakness |
| D12 | No rule-book edition or source hash stored | `cr/source.txt` gitignored | Weakness |
| D13 | Word match drops "can't"/"it's", turns "doesn't" into "doesn"; stray U+2028 / NBSP | | Weakness |

Checked and fine:
- the index rebuilds byte-for-byte from the 2026-09-25 rule book;
- the embeddings are aligned and current;
- all 74 curated rule ids exist with current wording;
- all 495 deciding-rule ids in the 416 corpus cases exist.

### Prompt building (P)

| Id | What's wrong | Evidence | Kind |
| --- | --- | --- | --- |
| P1 | Quick Lookup never gets phase guidance, even when the question names the step; no curated topic covers turn steps | `promptAssembly.ts:110-167`; 24 topics, none for 500–514 | Weakness |
| P2 | Excerpts in score order | `promptFormatting.ts:291-301`; Necropotence order 703.4n, 514.3, 514.1, 724.1f, 703.4p | Weakness |
| P3 | Lead-ins delivered without their list | 117.3 in 414/415, 400.7 in 398/415 | Bug / Weakness |
| P4 | Step summaries wrong: cleanup omits "this turn"; untap says triggers resolve before upkeep (502.4: they wait); declare blockers mentions damage-assignment order (removed from the rules) | `phaseGuidance.ts:15-22, 39-49, 56-59` | Bug |
| P5 | "Use only the provided context" while the deciding rule is present about 19% of the time | `promptFormatting.ts:14`, `promptAssembly.ts:144` | Weakness (paid A/B to judge) |
| P6 | Every ruling for every card; framed as "how each card works"; In-Depth puts the rules block between cards and rulings | `normalization.ts:9-11`, `promptFormatting.ts:280-285` | Weakness |
| P7 | In-Depth topics chosen by zone occupancy | `gameRulesTopicSelection.ts:32-39, 134-136` | Weakness |
| P8 | Quick Lookup's reference text describes phase guidance, scope note and stack it never has | `mtgReference.ts:7, 18`; `promptFormatting.ts:13-15` | Bug |
| P9 | Duplicated instructions; uneven instruction sets between modes | `promptFormatting.ts:16-17` against `promptAssembly.ts:61-63, 141-149` | Weakness |
| P10 | Rule id printed twice (`514.3a. 514.3a`) | `promptFormatting.ts:294` | Bug |
| P11 | No power/toughness/loyalty in card data | `cardDetail.ts:11-22` | Weakness (known, deferred) |
| P12 | Oracle text loses line breaks | `normalization.ts:15-16, 40-41` | Weakness |
| P13 | Whole prompt sent as one user message; no system/instructions channel | `openAiResponsesProvider.ts:103` | Weakness (paid A/B to judge) |
| P14 | Pointer to a phrasing glossary that isn't in the prompt; garbled sentence | `promptAssembly.ts:149` | Bug |
| P15 | Stack numbered from 0 in the preamble, from 1 in the stack section | `promptFormatting.ts:15` against `:225` | Bug |
| P16 | "Delayed Triggered Abilities" topic carries 603.10, not 603.7a–c | `gameRulesByTopic.json` | Bug |
| P17 | Three near-identical "does not override" lines; rules framed as "shared vocabulary" | `gameRules.ts:15-16` | Weakness |
| P18 | 73% of "see rule" pointers in Quick Lookup prompts lead nowhere | `runs/audit-prompt/corpus-stats.json` | Weakness |

Quick Lookup against In-Depth, across the 9 paired corpus cases:
- deciding rules present, pooled: 6 of 30 against 17 of 30, mostly from In-Depth's zone-triggered layer topics;
- rulings and card text are identical in both.
