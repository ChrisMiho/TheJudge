# Findings — what a rule excerpt looks like to Luna (session 4, 2026-10-11)

Free and local. This file covers the shape of the rule pieces, not search reach
(that's `FINDINGS-rule-search.md` and SYNTHESIS.md's chunk-size table).

## A rule excerpt has two jobs

1. **Be found.** Search matches the question against each piece. Small pieces
   with one idea each match sharply.
2. **Be understood.** Once Luna has the piece, she needs to know where it sits,
   what came before it, and what it points to.

Today one piece does both jobs. It is shaped for job 1.

## How a piece is stored and shown today

Source: `apps/backend/data/gameRulesRuleIndex.json` (2,893 entries),
`scripts/build-rule-embeddings.mjs:39`, `apps/backend/src/prompt/promptFormatting.ts:292`.

- **Search text:** `<subsection title>: <rule text>`, cut at 2,000 characters.
  The embedder reads only about 256 word pieces of that.
- **Prompt text:** `<rule id>. <rule text>`. The subsection title is dropped. The
  rule text already starts with its id, so the id prints twice
  (`514.3a. 514.3a At this point…`).
- No parent rule, no sibling rules, no part title, and no rule it refers to.

## Measured gaps

| Gap | Count |
| --- | --- |
| Pieces whose subsection title is just "General" | 127 of 2,893, shared across 8 different sections |
| Pieces that say "see rule X" (X not delivered with them) | 753 (26%) |
| Pieces with an `Example:` line fused in | 215 |

## Worked example: the cleanup step (Necropotence's deciding rules)

- **514.3a** begins "At this point, the game checks…". "At this point" means
  after 514.1 (discard to hand size) and 514.2 (damage wears off, "until end
  of turn" effects end). Neither comes with it.
- **514.3** ends "this rule is subject to the following exception:". If it
  arrives without 514.3a, it points at nothing.
- **500.5b** says "until end of turn" effects follow special rules, "see rule
  514.2". 514.2 isn't attached. Its search text starts "General:", so the
  search never sees "Turn Structure".

## What the test should separate

The chunk-size probe measured job 1 only: bigger pieces don't find more
deciding rules per character. Job 2 is untested: whether Luna rules better when
a found rule arrives with its path label, its family, and the rules it cites.
