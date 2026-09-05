# Probe: prompt data optimization (rules engine + upcoming RAG)

Off-lifecycle probe (`thejudge-investigate`). Inert to `thejudge-*` skills.
Worktree: `.claude/worktrees/probe-prompt-data-optimization` (branch
`worktree-probe-prompt-data-optimization`, based on `main` @ 639d3a2).

## Owner's ask (verbatim)

> how to optimize the data being utilized within this application for the
> prompt engineering functionality that drives the rules engine thats being
> built, rag is in scope and upcoming

## Shaped question

When a player asks a question, the backend builds one prompt from card data,
curated rules, retrieved rule excerpts, and rulings. Three things to learn:

1. **Where does the prompt's data budget go today, and how much of it is
   signal?** Measure per-section share across the committed golden prompts.
2. **Which data-shape changes would most improve grounding?** Retrieval query
   construction, curation of the always-on rules, rule chunking, card fields,
   rulings selection, and how the prompt is handed to the provider.
3. **Which of those are prerequisites for the planned RAG move, and which are
   independent wins that ship without RAG?**

Out of scope: answer-quality judging (parked as `ai-answer-quality-baseline`),
infra placement of vectors (already studied in
`PRD/ideasForLater/future-infra/sections/{rag-data-plane,retrieval-architecture}.md`).

## What ran

| # | Probe | Where | How |
| --- | --- | --- | --- |
| 1 | Prior RAG work recovery (branches `explore/semantic-rule-retrieval`, `investigate/combo-context-validation`) | `FINDINGS-prior-work.md` | subagent, read-only via `git show` |
| 2 | Data pipeline + artifact shape audit (build scripts, committed JSON, fields kept/dropped) | `FINDINGS-data-pipeline.md` | subagent, read-only |
| 3 | Prompt anatomy measurement across 30 golden prompts + retrieval noise audit | `FINDINGS-prompt-anatomy.md` | inline script |

Also run inline: `npm run test:eval` (green), `npm run eval:worked-solutions`
(6/6 hits), `npm run retrieval:report` (crashes on `main`, see
`FINDINGS-prompt-anatomy.md` §7), OpenAI prompt-caching and pricing pages
fetched 2026-09-01 to correct the caching arithmetic.

Verified inline after the subagent reported them: 147 duplicate rule IDs in
the rule index (TOC copies, entries 0–147); `Grizzly Bears` and `Hill Giant`
absent from `cardMetadata.json`; 705 cards with `//` inside `subtypes`
(e.g. Delver of Secrets → `["Human","Wizard","//","Creature"]`).

## Landing

**Answer mode.** The ask was a question. The recommendation is in the chat
reply; the ordered lever list is in `FINDINGS-prompt-anatomy.md` §8 and
`FINDINGS-data-pipeline.md` §6.

Two build paths exist and they do not overlap:

1. **Data hygiene + retrieval query/scoring, no embeddings.** Everything in
   the two lever lists marked "independent of RAG". Nothing in
   `PRD/work/semantic-rule-retrieval/` covers it. Would be a new package.
2. **Semantic rule retrieval.** Already designed on
   `origin/thejudge-auto/semantic-rule-retrieval` (DESIGN-BRIEF, 9-slot
   GATE-QUESTIONS, proposed `PRD/sections/` diff), parked at `owner-action`.
   Its draft PR #154 was closed unmerged on 2026-09-01 with no comment; the
   branch content is intact. That package should absorb the chunking
   findings here (TOC strip, keyword-level 702 chunks, parent-prefixed
   sub-rules, examples split) before its build phase, since it currently
   commits to one vector per raw index entry.

No `GRAPH-BRIEF.md` was written for path 1; the owner did not ask for a
build handoff. If wanted, it is a small brief: the lever lists above are
already file:line grounded.
