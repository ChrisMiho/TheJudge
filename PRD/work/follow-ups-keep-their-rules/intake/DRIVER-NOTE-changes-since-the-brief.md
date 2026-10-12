# Driver note: what changed on `main` after the brief was written

Written by the graph driver on 2026-10-12 at kickoff. This is evidence, not
authority. Every product decision it touches is still the owner's at the define
gate. `GRAPH-BRIEF.md` (staged beside this note, verbatim) was written on
2026-10-10, before these merges.

## Merges since the brief

- **#293 `right-rules-in-order`** (merged 2026-10-12, `2e737ba3`) changed rule
  search (System 3) under the brief's feet:
  - the excerpt cap is up to 15 with a 0.6 relevance cutoff, not 10 (REQ-190);
  - keyword rule sets now sit beside the excerpts (REQ-235);
  - the query carries concept-map terms drawn from card wording (REQ-234);
  - search uses the Magic-trained model `rule-search-d2c2e500a4c6` (REQ-236,
    REQ-237);
  - each attached card's own text is searched separately for two reserved
    per-card slots (REQ-235).

  It applied REQ-233 to REQ-245. The highest ids on `main` are now REQ-245 and
  NFR-019. The brief's line references, such as `preparation.ts:105` and the
  "10 supplemental excerpts" wording, predate this.
  `buildRetrievalQueryText` is now at `apps/backend/src/prompt/preparation.ts:133`.
- **#294** re-approved three corpus cases staled by #293's rule-text cleanup.
- **#295** cap-15 answer check (`docs/eval/cap15-answer-check/REPORT.md`):
  Luna's accuracy holds at cap 15. Its follow-ups include that the answer-quality
  grader (`buildLoneJudgePrompt`) never sees attached cards' oracle text. That
  matters to a pushback mode graded by the same judge.

## A live observation that bears on the brief's defect

On 2026-10-12 the owner asked production a three-turn Quick Lookup question
with Necropotence and Silence attached: casting on the end step after Silence,
then "what if it put an instant into my hand?", then "what about end step
cleanup?". The driver rebuilt all three prompts locally with the shipped model.

- Turns 1 and 2: none of 514.1, 514.2 or 514.3a reached the excerpts. The step
  guidance carried a cleanup summary.
- Turn 3: all three reached the excerpts, because the follow-up's own text named
  cleanup.

Each turn's rule search used that turn's text plus the cards, and nothing from
earlier turns. This is consistent with the brief's description of the defect,
measured on the post-#293 code.
