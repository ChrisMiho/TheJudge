# Report: Luna holds her answer quality at the 15-excerpt cap

Run 2026-10-12 on the code merged in #293 and #294 (run commit `1d51a0b0`, whose
tree equals `main` at `8e9ae9ff`). This is the answer-quality check REQ-190 asks for
after the excerpt cap moved from ten to up to fifteen with a 0.6 relevance cutoff.

## What this means for a player

Nothing gets worse. Luna answers as accurately with up to fifteen rule excerpts as
she did with ten, and she now gets the Necropotence-and-Silence cleanup question
right in Quick Lookup. That question failed in 4 of 6 tries at cap 10. Answers
average 4.1 seconds, and none came near the 30-second limit.

**Verdict: keep cap 15.**

## How it was measured

- Every approved case in the rules test corpus: 408 (390 tier 1–2, 18 tier 3).
  That includes the three cases #294 re-approved.
- Answer model `gpt-6-luna` at its default effort, cap 15, arm A (production
  prompt). Grader `gpt-6.1-sol`, one answer per case.
- Requests built like a player's: cards attached, and the question searched with
  the trained search model `rule-search-d2c2e500a4c6`. Every record shows
  `embeddingProvider: local`, status `ok`, and reported effort `medium`.
- Cost $2.12. Mean answer time 4.1 s, 95th percentile 7.6 s, none over 30 s.

## Results

| Set | Cap 10 (earlier runs) | Cap 15, as graded | Cap 15, grader mistakes removed |
| --- | --- | --- | --- |
| Phase 4 set, same 126 cases | 124 graded; 125 after the owner's adjudication | 119 | 124–125 |
| Hard layer and timing set, 18 cases | 101 of 108 (6 tries each) | 14 of 18 | 15–16 of 18 |
| Whole corpus, 408 cases | not measured | 394 | 401–405 |

The grader marked 14 answers below full credit. Reading each one against the
card text in Luna's prompt:

- **7 are grader mistakes.** Luna was right.
  - `clash-whirlpool-whelm`: the card says "you *may* put that creature on top".
  - `encore-broodmate-tyrant`: the attached card *is* Broodmate Tyrant.
  - `resolution-scroll-of-isildur-illegal-target`: chapter I says "up to one
    target", so choosing no target is legal.
  - `ward-winter-cursed-rider`: the card's ward cost *is* "Pay 2 life".
  - `devour-voracious-dragon`: the card *is* Devour 1, so one counter per
    creature is correct.
  - `academy-manufactor-esix-treasure`: the same correct edge case the owner
    overruled the grader on in Phase 4.
  - `fear-inkfathom-witch`: a harmless "until the turn ends" aside.
- **3 are real side errors.** Each has the right main answer and a wrong extra
  claim.
  - `horsemanship-barbarian-general`: says a horsemanship creature can block a
    flyer.
  - `necropotence-silence-borne-upon-a-wind-cleanup-in-depth`: right ruling, but
    the hand count after Borne Upon a Wind is 7, not 8.
  - `replacement-kalitas-blood-artist-no-dies-trigger-in-depth`: implies Player 2
    can respond only after Murder resolves.
- **4 are borderline wording.**
  - `modular-zabaz-the-glimmerwasp`: "the trigger resolves there".
  - `layers-mycosynth-lattice-march-dependency`: skips the edge case of a land
    that is already a creature.
  - `convert-soundwave-sonic-spy-soundwave-superior-captain`: a caveat worded
    loosely.
  - `frenzy-frenzy-sliver`: "gives … frenzy 1" where it means frenzy triggers.

On the 126-case Phase 4 set, the real errors at cap 15 are one or two:
horsemanship, plus Zabaz if its wording counts. The owner-adjudicated cap-10 run
had one, the Necropotence Quick Lookup case. The case gained is the Necropotence Quick Lookup case, graded 0 at
cap 10 and 2 now. The hard set's single answers sit inside the run-to-run spread
measured on 2026-10-10.

## Follow-ups

1. **The grader never sees the cards' own text.** `buildLoneJudgePrompt`
   (`apps/backend/src/eval/answer-quality/judge.ts`) passes rule excerpts and
   game state only. Five of the seven grader mistakes above were correct card
   facts it called invented or unsupported. Adding each attached card's oracle
   text to the grader's evidence should remove most of them. It changes the
   rubric inputs, so it needs a regrade of a known set to confirm.
2. **The run record names the wrong search model.**
   `scripts/eval-answer-quality.mjs:1126` hard-codes
   `Xenova/all-MiniLM-L6-v2` whenever the provider is `local`. The provider
   actually loads `rule-search-d2c2e500a4c6` (`LOCAL_MODEL_ID`). The label
   should come from `LOCAL_MODEL_ID`.
3. **Re-approval drops the approval note.** `eval:rules-review:apply` writes
   `review.note` from the batch, so a blank note erased each case's original
   approval note; #294 restored them by hand. Apply could keep the existing note
   when the batch gives none.
4. **The Necropotence lesson from a live question.** When the owner asked about
   casting on the end step, the numbered cleanup rules did not reach the first
   answer, and Luna did not connect Necropotence's discard trigger to the
   cleanup priority window. Two leads are recorded in
   `PRD/work/probe-concept-map-wording/HANDOFF.md`: a concept-map entry for
   discard triggers, and one line in the cleanup step guidance naming that case.

## Evidence

Run records, transcripts and the per-case comparison are backed up outside the
repo, in `~/Coding/Projects/TheJudge-backups/cap15-answer-check-2026-10-12/`.
Every case named here is a committed corpus case.
