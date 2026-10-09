# Answer quality on hard interactions — what's wrong, and why

Phase 5 report of the answer-quality investigation. Dated 2026-10-09. Measured on `main`
at `d56e2645` (refresh #273 and exact-id curated exclusion #278 merged), tooling commit
`da2221e2`. Total spend $11.44 of the $45 approved. Per-phase evidence: `PAID-RUN.md`.
Free (offline) findings: `docs/eval/answer-quality-investigation/OFFLINE-FINDINGS.md`.

**Status: final.** The GPT-4.1-vs-Luna counts below are owner-adjudicated: the owner graded
all 12 disagreements blind (`PHASE-4-BLIND-REVIEW.md`), and those grades replace the judge's.

## The answer

When the judge gives a player a shaky answer on a hard interaction, the cause today is
**mostly the model's reasoning, not missing rules and not layout.**

- Handing GPT-4.1 every rule that decides the question does not make it right more often.
  On the hardest case (Necropotence + Silence + Borne Upon a Wind) it is wrong every time,
  even when the rule that settles it is in the prompt.
- Regrouping the same rules (cards beside their rulings, rules in number order) does not
  help either.
- GPT-6 Luna, a reasoning model, is more accurate than GPT-4.1 (125 vs 120 of 126 on the
  production prompt; right on all 12 cases where the two disagreed), is preferred in a blind
  side-by-side, and costs about a twentieth as much per answer. It is the only model that ever
  got Necropotence right. But on the hardest questions it is slow: four of its ten hardest
  answers took longer than the 15-second limit production allows, so a player would have seen
  an error, not the answer.
- GPT-4.1 already gets about nine in ten of these deliberately hard questions right. The
  misses that remain are mostly "right outcome, real side error": a wrong timing step, a
  misnamed effect type, an invented example card.

## How it was measured

- **Questions:** 126 approved test cases. 46 "diagnostic" cases picked to stress retrieval
  (the two tester cases, the multiplayer case, every case missing part of its rules, and
  samples of cases with none or all of them), plus 80 held-out cases spread across the
  Comprehensive Rules. Chosen before any paid run; never re-drawn.
- **Requests exactly like a player's:** every answer went through the production prompt
  builder with the cards attached and the question searched by meaning (local embedder). Each
  production prompt was byte-identical to the offline evidence trace. No fallback anywhere.
- **Grader:** `gpt-6.1-sol`, stronger than both contestants and neither of them. Checked
  first against the owner's own grades on 12 answers: 10 of 12 agreed independently; the two
  differences were the judge being stricter about real side errors, and the owner adopted
  that standard. It leans strict and anchored to the reference answer (see uncertainty).
- **Noise floor:** the same 46 production prompts answered twice by GPT-4.1 flip right/wrong
  on 5 cases. Any difference smaller than that is noise.
- **Not run:** the base-vs-head look back at the data refresh (Phase 2). Its decision (merge
  #273) was already made; the one rule the refresh lost (608.2d) was tested directly instead.

## What each test showed

### 1. The judge can be trusted (Phase 1)

10 of 12 owner grades matched the judge before review. The judge never passed a wrong
answer. Both differences were the judge marking down a right outcome with a real side error
(an invented card; wrong trigger timing); the owner agreed on review.

### 2. Missing rules and layout are not the main problem (Phase 3)

Five versions of the same prompt, GPT-4.1, the 46 diagnostic cases. Right answers:

| Version | What changed | Right of 46 |
| --- | --- | --- |
| A | production, unchanged | 42 |
| B | same content, regrouped and given headings | 40 |
| C | production plus every missing deciding rule | 41 |
| D | C's content in B's layout | 43 |
| P | production with one wrong sentence corrected | 41 |

All inside the noise floor. Then three repeat answers per version on five chosen cases:

- **Necropotence:** wrong in every version, including with every deciding rule present
  (0 of 6). Across every paid run GPT-4.1 answered it 26 times and was never right (one
  partial). The prompt says, in rule 514.2, that "this turn" effects end in cleanup; GPT-4.1
  cites the rules either side of it and still says Silence stops the cast.
- **Layers cases (the owner's hypothesis):** production already right 3 of 3 on both, so
  there was nothing for a layers fix to repair. Not supported.
- **Multiplayer (the refresh's accepted loss of 608.2d):** right 15 of 15. Losing that rule
  does not cost players the right answer.
- **A lead, not a finding — the corrected layers sentence on Academy Manufactor + Esix:**
  version P right 3 of 4; production right 1 of 5. The likely mechanism: the uncorrected
  sentence says state-based actions use the layer system and nudges the model toward
  layers on what is really a replacement-effect question. The sample is too small to call.

### 3. GPT-4.1 vs GPT-6 Luna (Phase 4)

Production prompt, 126 cases, both models, same prompts:

| | GPT-4.1 | GPT-6 Luna |
| --- | --- | --- |
| Right (owner-adjudicated) | 120 | 125 |
| Held-out cases right (of 80) | 76 | 80 |
| Preferred in blind side-by-side | 47 | 78 |
| Cites and uses the attached rules (0–2) | 1.26 | 0.89 |
| Typical / slow-end / slowest answer time | 2.7 s / 4.8 s / 7.7 s | 3.6 s / 7.1 s / 13.7 s |
| Cost per answer | ~1¢ | ~0.05¢ |

- After the owner's review, Luna is right on 5 cases GPT-4.1 misses and GPT-4.1 on none Luna
  misses (sign test p ≈ 0.06). On all 12 disagreements across the three runs, Luna scored 2
  every time; GPT-4.1 scored three 2s, seven 1s and two 0s. The blind preference (78 to 47)
  is firm (p ≈ 0.007).
- With every deciding rule added (version C), Luna still leads on correctness (44 vs 42,
  owner-adjudicated) but the blind preference flips to GPT-4.1 (26 to 19, not firm). Luna's
  style advantage shows up mostly when evidence is incomplete; its accuracy advantage holds.
- Luna cites rules less. If the product's trust story depends on showing rule numbers, that
  is a cost.
- On the three named cases, answered three times each:

| Case | GPT-4.1 | Luna | Luna answer times |
| --- | --- | --- | --- |
| Academy Manufactor + Esix | 2 2 1 | 2 2 2 | 20.0 s · 12.5 s · 15.1 s |
| Necropotence + Silence + Borne | 0 0 0 | 2 0 0 | 22.7 s · 11.1 s · 8.2 s |
| Multiplayer (Only Blood + Tajuru) | 2 2 2 | 2 2 2 | ~4 s |

  Luna's one correct Necropotence answer is right for the right reason, and it took 22.7 s.
  Under production's 15 s limit it, and two of the three correct Academy answers, would have
  been errors.

## Failure types, with examples

| Type | What it looks like | Example |
| --- | --- | --- |
| Skips a rule it was given | Cites neighbouring rules, misses the deciding one, reaches the opposite outcome | Necropotence: says Silence still applies though 514.2 (in the prompt) ends it |
| Right outcome, wrong mechanics | Correct yes/no, but a step a player might copy is wrong | Knight of the Mists: target chosen "on resolution" instead of when the trigger goes on the stack; Stream of Thought: copies' timing misstated |
| Misnames the effect type | Calls a type-changing effect a replacement effect | Rukarumel + Bramblewood Paragon |
| Invented support | An example card that doesn't do what's claimed | Blitz Automaton: "Karn, the Great Creator" as a graveyard-casting enabler |
| Self-contradiction | States a wrong rule, then the right result | Thought Eater: "set effects before modifiers", then timestamp order |
| Incomplete summary | Right table, misleading conclusion | Academy Manufactor: "you get no artifact tokens either way" (Esix is optional) |

## Every per-case regression

No refresh comparison was run (Phase 2 skipped), so there is no before/after regression
list. Cases the production prompt got wrong at least once across the paid runs:
`necropotence-silence-borne-upon-a-wind-cleanup` (every GPT-4.1 answer),
`academy-manufactor-esix-treasure` (unstable, 0–2), `layers-hand-size-timestamp-thought-eater`
(2 of 5), `exalted-akrasan-squire`, `prototype-blitz-automaton`, `soulbond-deadeye-navigator`,
`venture-into-the-dungeon-zalto-fire-giant-duke`, plus the six Phase 4
GPT-4.1 side-error cases above. Full tables in `PAID-RUN.md`.

## Small defects found along the way (not product fixes, just facts)

- The built-in rules summary in the prompt (`apps/backend/src/prompt/mtgReference.ts:20`) says
  "Continuous effects and state-based actions use a layer system." State-based actions are
  not part of the layer system (rules 613.1, 704.3).
- Rule 514.3a's text in the committed rule index ends with a stray chapter heading
  ("6. Spells, Abilities, and Effects") — a rules-ingest artifact.
- The committed rule index has no entries for keyword section numbers (702.7, 702.62, …), so
  an answer citing them reads as "unknown rule id" though the rule is real.
- **The time limits stack up inconsistently (read from the deploy scripts, not checked
  live).** `scripts/aws-deploy.sh` sets `OPENAI_TIMEOUT_MS=15000` with
  `OPENAI_MAX_RETRIES=2`, but `scripts/aws-bootstrap.sh` creates the Lambda with
  `--timeout 20`, and the deploy never changes it. A first attempt that times out at 15 s
  leaves 5 s for its retry, so the Lambda is killed mid-retry and the player likely gets a raw
  error, not the app's own timeout message. Raising only the OpenAI timeout (to 30 s, say)
  would be cut off at 20 s by the Lambda. The frontend sets no request time limit of its own;
  the API is a Lambda Function URL (no API Gateway 30 s cap).
- NFR-002 sets a "normal AI latency target under 3 seconds". GPT-4.1's median here was 2.7 s;
  Luna's 3.6 s, and 10–23 s on the hardest questions. A model switch or a longer limit touches
  that requirement.
- The committed diagnostic and held-out sets no longer match a fresh seeded draw at main
  (`manifests -- --check`), because retrieval improved. Expected; the sets are frozen on purpose.

## Decisions

| # | Question | Answer from the evidence | Left to you |
| --- | --- | --- | --- |
| D0 | Which model grades? | `gpt-6.1-sol`, trusted after the Phase 1 check | — |
| D1 | Should #273 merge? | Already merged; its one accepted loss (608.2d) costs no right answers (15 of 15) | — |
| D2 | Evidence, presentation, or neither? | **Neither** rescues reliably; the hard failures are reasoning. One cheap correct sentence fix carries a small-sample lead | whether the sentence lead is worth a confirming run |
| D3 | Does Luna beat GPT-4.1, and only because evidence is missing? | **Yes, on accuracy, and not only because evidence is missing**: owner-adjudicated 125 vs 120 (production) and 44 vs 42 (complete evidence), right on all 12 disagreements; blind-preferred; ~20× cheaper. Against it: too slow for the 15 s limit on 4 of its 10 hardest answers, and cites rules less | **the migration and any timeout or effort change** (not decided here); the runbook's default when not decided is keep GPT-4.1 |
| D4 | Smallest follow-up | The evidence points at the model/reasoning lever and the one wrong sentence, not at retrieval. A retrieval redesign (including PR #266) is not supported by this data | which follow-up to kick off |
| D5 | When may a follow-up ship? | Proposed rule stands as written in the runbook: both tester cases pass adjudicated checks, offline gates pass, every newly wrong approved case fixed or accepted by you, no invented accuracy target | adopting it |

## What remains uncertain

- **The judge under-counts precise answers.** The owner's review overturned three of its 24
  grades, all for being too strict: twice on Luna for a correct detail beyond the reference.
  Any later automated comparison should expect a small bias against the more precise model.
- **The owner's review leaned on the agent's suggested grades** for side errors (the agent
  checked each against rule text but was not blind). The outcome calls were the owner's own.
- **Self-preference:** the judge is a GPT-6 model and Luna is GPT-6. The owner's review found
  the judge biased *against* Luna on correctness, not for it; the blind *ranking* (style) could
  still carry a family preference and is the softer evidence.
- **Luna at other settings:** only its default effort (`medium`) was tested. Whether a lower
  effort keeps the accuracy and fits in 15 s is untested.
- **Sample sizes on the hard cases are small** (three to five answers per version). The
  Necropotence and Academy findings are directional.
- **Only two tier-3 cases exist** in the corpus, so "hardest questions" rests on two cases.
- The production prompt was measured at main; the live AWS deployment was not checked.

## Hand-off

This report is the intake for the next `thejudge-investigate` → `graph-kickoff`. It makes no
product change and proposes no design.

**Owner decisions for the follow-up brief (2026-10-09):**

- The first follow-up asks: **can GPT-6 Luna answer the hardest questions inside the time
  limit?** It weighs a longer limit against a lower effort setting before any model switch.
- The brief carries the time-limit work as one change, not a standalone tweak: an answer
  limit of **30 s** (`OPENAI_TIMEOUT_MS`); the Lambda timeout raised above it (about 40 s;
  today 20 s); the retry count reconsidered so a player is never left waiting for several
  30 s attempts; the 15 s + 2 retries vs 20 s Lambda mismatch fixed; and NFR-002's
  "normal AI latency target under 3 seconds" amended to match whatever is chosen.
- The corrected layers sentence (`mtgReference.ts:20`) may ride in the same kickoff.
- The live Lambda timeout is checked first; this report read it from the deploy scripts only. The questions a kickoff would need answered are D2's
sentence lead, D3's migration/timeout/effort decision, and D4's choice of lever.
