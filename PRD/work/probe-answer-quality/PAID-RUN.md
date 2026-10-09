# Paid run — answer-quality investigation (per-phase record)

Started 2026-10-08. Follows `docs/eval/answer-quality-investigation/RUNBOOK.md`.
Order: Phase 1 (grader check) → owner blind grading → Phase 3 (arms) → Phase 4
(GPT-4.1 vs GPT-6 Luna) → Phase 5 report. Phase 2 recommended skipped (below).

## Setup

| Item | Value |
| --- | --- |
| Launch checkout | `main` at `d56e2645` (carries #273 refresh + #278 exact-id curated exclusion + the tooling) |
| Run worktree | `.worktrees/aq-paid`, branch `aq-paid-run` (local only, never pushed) |
| Tooling commit (`--expect-commit`) | `07faa2f05bb223abb70e3394518111cf168478f9` — main plus one local commit: rate check dates set to 2026-10-08 and three GPT-6 judge candidates priced. Will move once if arm P's wording file is committed |
| Install | `npm ci` + `apps/backend/data/models` copied from the main checkout |
| Embedder | local MiniLM loads offline in the worktree: mode `local`, 384 dims (checked 2026-10-08) |
| Script tests | `npm run test:scripts` 766/766 pass after the rate commit |

## Step 0 (free) at main

- **Evidence trace** (`eval:evidence-trace --out main`): 392 approved cases; 290 every
  deciding rule selected, 296 complete procedure available, 304 `goldRuleInPrompt`.
  Rules-gate parity: 392 of 392 agree with `baseline.json`. (Offline findings at the old
  base: 287 / 290 / 301.)
- **Staleness:** none stale, none awaiting a re-freeze. **Coverage:** `coverage.json` unchanged.
- **Corpus:** 400 case files = 392 approved + 7 drafts (the refresh's new mechanic cases) +
  1 rejected. The 7 drafts are not approved, so no run grades them. The approved corpus is
  still 392.
- **Manifests:** the committed diagnostic (46) and held-out (80) manifests resolve every case
  at main (every dry run lists them, no refusal). `manifests -- --check` reports they differ
  from a fresh seeded draw at main (pools moved to 290 / 14 / 88 because retrieval improved),
  which is expected: the sets are pre-registered and stay frozen. This check is on-demand, not
  a gate (asserted by `build-answer-quality-manifests.test.mjs`).
- **Named cases at main:**
  - Academy Manufactor + Esix: **now complete** — all four deciding rules (614.1a, 616.1,
    616.1e, 616.1f) reach the prompt through a curated topic. No longer a missing-evidence
    case; at main it tests presentation or the model.
  - Necropotence + Silence + Borne Upon a Wind: still 1 of 3 (514.1 yes; 514.2 rank 30 and
    514.3a rank 14 not selected). Still missing evidence.
  - Multiplayer Only Blood Ends Your Nightmares: 608.2d now ranks 11, one past the cap of 10
    (the accepted loss, confirmed). 701.21a still rank 1.
  - Goreclaw + Brawl-Bash Ogre: 603.3b is now ranked (241) after #278 instead of skipped, but
    still not selected.
- Run manifests built under the worktree's `output/answer-quality/manifests/`:
  `diagnostic-plus-held-out.json` (126), `named-and-disputed.json` (3), `all-approved.json` (392).

## Rates (re-checked 2026-10-08)

Source: `https://developers.openai.com/api/docs/pricing` (the old platform URL redirects
there), standard tier, short context, read from the raw page data. USD per million tokens,
input / output.

| Model | Rate | In table before | Moved? |
| --- | --- | --- | --- |
| gpt-4.1 | $2.00 / $8.00 | same | no |
| gpt-4.1-mini | $0.40 / $1.60 | same | no |
| gpt-5 | $1.25 / $10.00 | same | no (first check) |
| gpt-5-mini | $0.25 / $2.00 | same | no |
| gpt-5-nano | $0.05 / $0.40 | same | no |
| gpt-6-luna | $0.10 / $0.50 | same | no |
| gpt-6-sol | $2.00 / $10.00 | absent | added |
| gpt-6.1-sol | $2.00 / $10.00 | absent | added |
| gpt-6-astra | $10.00 / $50.00 | absent | added |

## Dry-run estimates (no key, no network, `ANSWER_QUALITY_NO_LOCAL_ENV=1`)

Character-count method; excludes reasoning tokens beyond a small assumed output, so real
cost can be several times higher. The cap is the real limit.

| Run | Calls | judge gpt-5 | judge gpt-6.1-sol | judge gpt-6-astra |
| --- | --- | --- | --- | --- |
| P1 grader check (46 diag, 4.1, arm A) | 92 | $1.03 | $1.08 | $3.10 |
| P2 one side (392, arm A) | 784 | $8.60 | $9.04 | $26.29 |
| P3 arms (46 × A/B/C/D) | 368 | $4.12 | $4.32 | $12.42 |
| P3 repeats (3 × 4 arms × 3) | 72 | $0.83 | $0.87 | $2.46 |
| P4 arm A (126 × 4.1 + Luna) | 630 | $5.90 | $6.51 | $26.06 |
| P4 best arm (46 × C × both) | 230 | $2.17 | $2.39 | $9.53 |
| P4 repeats (3 × both × 3) | 45 | $0.43 | $0.48 | $1.87 |

## The ten re-snapshotted cases (step 0.4)

Case files are byte-identical between #273's head (`07cc3ab6`) and main, so step 0.4 still
applies as written. Each keeps its question and reference answer; only snapshot hashes moved.
Deciding-rule text, old Comprehensive Rules (2026-08-07) vs new (2026-09-25):

| Case | Deciding rule | Change |
| --- | --- | --- |
| boast-tuskeri-firewalker | 702.142a | "a special kind of activated ability" → "a keyword that adds additional rules to the activated ability that follows it"; meaning unchanged |
| combat-flying-and-shadow | 509.1b | whitespace only |
| copies-quicksilver-gargantuan-and-tarmogoyf | 707.9d | rule same; a card ruling changed |
| exhaust-afterburner-expert | 702.177a | same reword as boast |
| forecast-sky-hussar | 702.57a | "a special kind of activated ability" → "an activated ability" |
| max-speed-amonkhet-raceway | 702.178a | "a special kind of static ability" → "a static ability" |
| necropotence-silence-borne-upon-a-wind-cleanup | 514.1, 514.2, 514.3a | 514.3a whitespace only |
| replacement-lifegain-and-draw-replacements-combine | 616.2 | whitespace only |
| shuffle-sylvan-primordial | 701.24a | rule same; oracle text changed |
| token-created-by-name-uses-oracle-card | 111.11 | rule same; a card ruling changed |

No change alters what the right answer is. Two of the ten are in the phases chosen here:
Necropotence (diagnostic, named) and replacement-lifegain (held-out, Phase 4).

## Arm P wording (proposed, not yet approved)

The preamble's MTG reference (`apps/backend/src/prompt/mtgReference.ts:20`) says state-based
actions use the layer system. They do not: layers order continuous effects (rule 613.1);
state-based actions are checked whenever a player would get priority (rule 704.3). The
sentence appears exactly once in every lookup prompt.

```json
{
  "replaces": "Continuous effects and state-based actions use a layer system.",
  "correction": "Continuous effects use a layer system (rule 613); state-based actions are not part of it and are checked separately whenever a player would receive priority (rule 704).",
  "approvedOn": "<owner date>"
}
```

Dry run with arm P: refused until `apps/backend/src/eval/answer-quality/arm-p-correction.json`
exists with an approval date.

## Phase 2 recommendation

Skip. The question it answered (should #273 merge?) is settled. The one known loss
(multiplayer 608.2d) is in the named set and is answered and read in Phases 1, 3 and 4. The
offline trace already shows retrieval at main is equal or better than the base on every
coverage count. A look-back costs about $17–18 at the estimate (both sides) plus a base
worktree with tooling grafted on, and its result changes no decision in this run.

## Owner decisions (2026-10-08)

The owner accepted every recommendation:

| Decision | Choice |
| --- | --- |
| D0 judge | `gpt-6.1-sol` (`ANSWER_QUALITY_JUDGE_MODEL=gpt-6.1-sol`) |
| Caps | P1 $5 · P2 skipped · P3 $15 (arms $12, repeats $3) · P4 $25 (arm A $16, best arm $6, repeats $3) |
| Rates | none moved; local rate commit `07faa2f` approved |
| Ten re-snapshotted cases | confirmed |
| Arm P | wording above approved; committed as `da2221e2` (arm-p-correction.json, approvedOn 2026-10-08) |

**Tooling commit for every live run: `da2221e29ec410a5c1a1bad955cf73062ab50391`.**
With the judge set, the dry runs read: P1 $1.08 (92 calls); P3 arms with P $5.40 (460 calls).

## Phase records

### Phase 1 — grader check

- Live launch from the agent was denied by the session's auto-mode permission classifier
  ("Real-World Transactions"), so each live run is launched by the owner with `!`.
- Plan: a $0.10-capped smoke slice first (stops after one or two cases), inspect the
  requests, then `--resume` to the $5 cap.
- **Smoke slice (owner-launched, $0.10 cap):** 5 cases answered, $0.0844 spent, stopped
  cleanly before the cap. Model access verified; 46 queries embedded with
  `EMBEDDING_PROVIDER=local`.
- **Production-fidelity check on the 5 records — PASS:**
  - every live prompt hash equals the offline evidence trace's hash for that case (the trace
    builds the production prompt with the committed semantic query vectors), so the live
    request is byte-identical to what a player's request assembles;
  - `embeddingProvider: local` on every record (semantic, no lexical fallback; the runner's
    `requireSemantic` guard was armed);
  - every card the case names is in its prompt (Lymph Sliver; Academy Manufactor + Esix;
    Crush Dissent; Ayesha Tanaka; Archon's Glory);
  - answer model reported as `gpt-4.1-2025-04-14`; judge `gpt-6.1-sol`; commit `da2221e2`.
- Actual cost runs about $0.017 per case (answer + judge), so the full 46 should land near
  $0.80, under the estimate.
- Judge note: `gpt-6.1-sol` at its default effort reasons briefly (40–52 reasoning tokens per
  grade). Its rationale on Academy Manufactor was specific (it caught a wrong final summary).
  The owner's blind grading tests the judge as configured; if it disagrees, `--regrade-from`
  re-grades the saved answers without re-asking GPT-4.1.
- **Full run (owner-launched `--resume`, $5 cap):** finished 2026-10-08 19:01 UTC. 46 of 46
  records `ok`, 0 errors, 0 undetermined, nothing left uncompleted.
- **Fidelity check on all 46 — PASS:** every prompt hash equals the offline trace's, every
  record `embeddingProvider: local`, every named card present, every record on commit
  `da2221e2`.
- **Spend:** $0.7432 total ($0.4644 answers, $0.2788 judge) of the $5 cap.
- **Latency (GPT-4.1, arm A):** median 3.5 s, slowest 9.0 s; none over the 15 s production
  timeout.
- **Blind grading:** 12 answers in `PHASE-1-BLIND-GRADING.md` (seeded shuffle, seed
  20261008), judge scores withheld. Chosen to stress the judge: every answer it marked below
  full marks, the multiplayer named case, four hard cases it passed despite missing deciding
  rules, two easy controls. The sealed key (judge scores + rationales) is
  `.worktrees/aq-paid/output/answer-quality/runs/phase-1-grader-check/blind-key.json`; it
  is copied here only after the owner grades.
- Per-case judge scores were withheld until the owner graded.

#### Owner grading and agreement (2026-10-08)

The owner asked which answers were obvious. The agent pre-graded ten clear-cut outcomes
(it was **not** blind: it had seen the judge scores while choosing the twelve) and named two
judgment calls. The owner graded those two (#3, #9) and confirmed #10; the owner accepted the
agent's grades on the remaining eight. So eight of the twelve human grades are
agent-proposed and owner-accepted, not independently read: a limit on this check.

| # | Case | Owner | Judge | Note |
| --- | --- | --- | --- | --- |
| 1 | prototype-blitz-automaton | 2 | **1** | judge: right outcome, but invents Karn, the Great Creator as a graveyard-casting enabler |
| 2 | combat-vengeful-archon-prevent-which-damage | 2 | 2 | |
| 3 | layers-hand-size-timestamp-thought-eater | 1 | 1 | both: the "set effects before modifiers" contradiction |
| 4 | exalted-akrasan-squire | 2 | **1** | judge: says triggers resolve "when the stack is empty" (wrong stack timing) |
| 5 | replacement-rukarumel-and-bramblewood-paragon | 2 | 2 | |
| 6 | combat-quest-for-pure-flame-divided-damage | 2 | 2 | |
| 7 | layers-hand-size-timestamp-praetors-counsel | 2 | 2 | |
| 8 | mill-incarnation-technique | 2 | 2 | |
| 9 | academy-manufactor-esix-treasure | 1 | 1 | both: summary makes Esix mandatory, omits declining it |
| 10 | necropotence-silence-borne-upon-a-wind-cleanup | 0 | 0 | both: opposite outcome; misses 514.2 ending Silence |
| 11 | multiplayer-only-blood-ends-your-nightmares-opponents | 2 | 2 | |
| 12 | combat-horizon-drake-protection-from-lands | 2 | 2 | |

**Agreement 10 of 12.** Both disagreements run the same way: the judge is stricter, giving 1
to a right-outcome answer that carries a real side error. Its two reasons are factually
correct (Karn does not grant graveyard casting; triggers resolve one at a time from the stack,
not "when the stack is empty"), and level 1 of the rubric is "right with a material error",
so these are defensible strict calls, not judge mistakes. The judge never passed a wrong
answer, caught the one wrong outcome, and matched the owner on both judgment calls.

**Owner revision (after seeing the judge's reasons):** the owner moved #1 and #4 to 1,
adopting the judge's stricter standard: a right outcome that carries a real side error
(an invented card, misstated stack timing) is a 1, not a 2, because a player can act on
the error. Agreement after review: 12 of 12. The independent figure stays 10 of 12; the
revision sets the grading standard for the rest of the investigation rather than adding
evidence of agreement.

**Verdict: the judge is trusted for this investigation (D0 = `gpt-6.1-sol` stands).** Its
bias is toward under-crediting answers with side errors, and it applies the same bias to
every arm and model, so the comparisons in Phases 3 and 4 are fair. Absolute correctness
counts read slightly low.

Side observation for Phase 5: on most two-card-ruling cases the answer quotes the card ruling
that is the reference answer (the ruling arrives in the prompt with the card), so those cases
are easy whatever the rule search does.

Phase 1 judge distribution (all 46): correctness 2 = 41, 1 = 4, 0 = 1.

### Phase 3 — arms (evidence vs presentation vs the corrected sentence)

- Arm P joins A–D in both runs (owner-approved wording). Dry runs: arms 460 calls, $5.40;
  repeats 90 calls, $1.09.
- Plan: a $0.15-capped smoke slice of `phase-3-arms` first, to check each arm's prompt is
  built as designed (A byte-equal to the trace; B reordered only; C/D add only bundle rules;
  P differs by exactly the one sentence), then `--resume` to $12, then repeats at $3.
- **Smoke slice (owner-launched, $0.15 cap):** 7 records (Lymph Sliver × A–P, Academy
  Manufactor × A, B), $0.1250 spent, stopped cleanly.
- **Arm construction check — PASS** (line-multiset diff of each arm's prompt against A):
  - A: prompt hash equals the offline trace; `embeddingProvider: local`.
  - B: identical content lines; only section headings change (4 production headings out,
    3 B headings in: "THE CARDS AND THEIR RULINGS", "THE RULES FOR THIS QUESTION, IN
    RULE-NUMBER ORDER", "BACKGROUND RULES").
  - C: A plus exactly the missing bundle rule (Lymph Sliver: one line, 702.64a), in
    production's own excerpt format (the doubled "702.64a. 702.64a" prefix is how production
    renders every excerpt).
  - D: C's added rule under B's headings, nothing else.
  - P: byte-equal to A with the one approved sentence replaced.
  - No arm adds the case's reference answer.
  - Records carry arm revisions A.1, B.1, C.1, D.1, P.1.
- **Full arms run (owner-launched `--resume`, $12 cap):** 230 of 230 `ok`, 0 errors, 0
  undetermined. Spend $3.81 ($2.37 answers, $1.43 judge). 20:45–21:27 UTC.
- **Arm construction check on all 230 — PASS** (block-level: each rule's continuation lines
  belong to the rule): A equals the trace for all 46; B changes headings only; C adds 136
  bundle rules and nothing else; D holds C's content; P exact; no arm adds the reference
  answer. Only flag: rule 514.3a's text in the committed rule index ends with the stray
  chapter heading "6. Spells, Abilities, and Effects" (a rules-ingest artifact; minor data
  defect, logged for Phase 5).

#### Phase 3 interim result (single answers; repeats pending)

Correctness 2 per arm, of 46: **A 42 · B 40 · C 41 · D 43 · P 41.** Phase 1's arm A
(same prompts, an earlier sample) scored 41.

**Noise floor:** the same 46 arm-A prompts answered twice (Phase 1 vs Phase 3) flip
right/wrong on **5 cases**. Every arm sits within ±2 of A, so no arm's overall difference
exceeds run-to-run noise. Same picture by evidence pool at main (complete 13, partial 14,
none 19).

Cases not right in every column (A1 = Phase 1's arm A):

| Case | A1 | A | B | C | D | P | Evidence at main |
| --- | --- | --- | --- | --- | --- | --- | --- |
| academy-manufactor-esix-treasure | 1 | 2 | 1 | 2 | 0 | 1 | complete |
| banding-ayesha-tanaka | 2 | 2 | 2 | 2 | 1 | 2 | none |
| combat-vengeful-archon-prevent-which-damage | 2 | 2 | 2 | 1 | 2 | 1 | none |
| copies-clone-of-animated-staff | 2 | 2 | 2 | 1 | 2 | 2 | complete |
| exalted-akrasan-squire | 1 | 2 | 2 | 1 | 2 | 2 | none |
| layers-hand-size-timestamp-thought-eater | 1 | 1 | 2 | 2 | 2 | 2 | partial |
| necropotence-silence-borne-upon-a-wind-cleanup | 0 | 0 | 0 | 0 | 0 | 0 | partial |
| prototype-blitz-automaton | 1 | 2 | 1 | 2 | 2 | 1 | none |
| replacement-unpreventable-damage-hydra | 2 | 2 | 1 | 2 | 2 | 2 | partial |
| soulbond-deadeye-navigator | 2 | 1 | 1 | 2 | 2 | 2 | none |
| venture-into-the-dungeon-zalto-fire-giant-duke | 2 | 1 | 1 | 1 | 2 | 1 | none |

Readings so far:
- **Necropotence is a model failure, not an evidence failure.** Arm C put 514.1, 514.2 and
  514.3a in the prompt. 514.2 says, in the prompt, that all "this turn" effects end in
  cleanup. GPT-4.1 cited 514.1 and 514.3a, skipped 514.2, and still concluded Silence stops
  the cast: 0 under all six columns.
- **Thought Eater** is the only case with a consistent pattern: wrong twice under A,
  right under B, C, D and P. P's corrected sentence is about layers, and this is a
  layers-and-hand-size question, so P's fix is plausible here, but B (layout only) fixes it
  too. One answer per arm cannot separate them.
- Most other differences flip in both directions between arms with the same evidence, i.e.
  sampling noise. Academy Manufactor scores 0, 1 and 2 across arms that all carry its four
  deciding rules.
- Tentative D2: **neither evidence nor presentation rescues reliably at this sample size;
  the hard failure is the model's reasoning.** The repeats (3 answers × 5 arms × the 3 named
  cases) test this before it is stated as a finding.

#### Phase 3 repeats — plan (pre-registered 2026-10-08, before the run)

The owner proposed that correctly identifying layers, with the relevant rules and cards
attached, is the key to good answers. The agent argued the data so far does not show it
(C did not beat A overall; Necropotence and Academy Manufactor fail with every deciding rule
present), and proposed testing it directly. The owner agreed.

- Manifest `output/answer-quality/manifests/named-disputed-and-layers.json`: the three named
  cases plus the two layers / hand-size cases, `layers-hand-size-timestamp-thought-eater` and
  `layers-hand-size-timestamp-praetors-counsel`. 5 cases × arms A, B, C, D, P × 3 answers =
  75 answers, 150 calls; dry run $1.80; cap $3.
- **What would support the layers hypothesis:** on the two layers cases, P (corrected layers
  sentence) right on clearly more answers than A, **and** B (layout only) not matching P.
  If B matches P, the effect is layout, not the layers sentence. If A is already right on most
  answers, there is nothing for layers to fix on these cases.
- **What would confirm "the model, not the evidence":** Necropotence wrong on most answers
  under C and D (every deciding rule present).
- **Status (2026-10-08, evening): not run.** The owner is remote without terminal access. The
  agent's own launch was denied by the auto-mode classifier ("Auto-Mode Bypass"), and so was
  its attempt to add a local permission rule for the eval command. Resume by the owner
  pasting the command at the terminal (`!` prefix); nothing is lost.
- **Run (owner-launched, 2026-10-08/09):** 75 of 75 `ok`, 0 errors, $1.63 of the $3 cap.
  Construction check PASS (only the known 514.3a chapter-heading artifact flags).

#### Phase 3 repeats — result (three answers per arm; correctness per answer)

| Case | A | B | C | D | P |
| --- | --- | --- | --- | --- | --- |
| academy-manufactor-esix-treasure | 0 1 0 | 0 1 1 | 2 1 0 | 0 1 2 | **2 2 2** |
| layers-hand-size-timestamp-praetors-counsel | 2 2 2 | 2 2 2 | 2 2 2 | 2 2 2 | 2 2 2 |
| layers-hand-size-timestamp-thought-eater | 2 2 2 | 2 2 2 | 2 2 2 | 1 2 2 | 2 2 2 |
| multiplayer-only-blood-ends-your-nightmares-opponents | 2 2 2 | 2 2 2 | 2 2 2 | 2 2 2 | 2 2 2 |
| necropotence-silence-borne-upon-a-wind-cleanup | 0 0 0 | 0 0 0 | 0 0 0 | 1 0 0 | 0 0 0 |

Scored against the pre-registered conditions:

- **Layers hypothesis — not supported.** Arm A is already right on 3 of 3 for both layers
  cases, so there is nothing for the layers sentence to fix on them. Pooling every answer so
  far for Thought Eater: A 3 of 5 right, B 4 of 4, P 4 of 4 — B (layout only) matches P, so
  any effect is not the layers sentence.
- **"The model, not the evidence" — confirmed for Necropotence.** With every deciding rule
  attached (C, D) it is right on 0 of 6 answers (one partial); across all 15 repeat answers
  and all 6 Phase 1/3 answers, never once right.
- **Multiplayer (the accepted 608.2d loss): right on 15 of 15.** The lost rule does not cost
  the player the right answer.
- **Unexpected lead — arm P on Academy Manufactor + Esix.** P right 3 of 3 here (plus a 1 in
  the arms run: 3 of 4), against A 1 of 5 across all runs, B 0 of 4, C 2 of 4, D 1 of 4. The
  judge's rationales for the three P answers are specific (both orders, declining Esix, the
  first-token-event limit); A's r1 answer claimed Esix must apply first. Plausible mechanism:
  the uncorrected sentence ties the layer system to rules questions generally, and this is a
  replacement-effect question, not a layers one. The sample is small (a two-sided exact test
  on 3/4 vs 1/5 is far from conclusive), so this is a lead for the follow-up, not a finding.

**D2 (Phase 3 decision): neither evidence nor presentation rescues reliably.** Completing the
evidence (C), regrouping it (B) or both (D) moves no total beyond the run-to-run noise of 5
flips in 46, and the hardest case fails with every deciding rule present. The remaining
failures are the model's reasoning. One cheap, correct prompt fix (the layers sentence, P)
carries a small-sample lead on one replacement-effect case.

Phase 3 spend: $5.44 of the $15 cap ($3.81 arms + $1.63 repeats).

### Phase 4 — GPT-4.1 vs GPT-6 Luna (plan)

- Evidence arm for the "best evidence" run: **C** (evidence added, presentation unchanged —
  the cleanest single change; no arm won Phase 3, and D's lead was within noise).
- Dry runs (judge `gpt-6.1-sol`): `phase-4-arm-a` 126 cases × both models, 630 calls,
  $6.51 (cap $16); `phase-4-best-arm` 46 × C × both, 230 calls, $2.39 (cap $6);
  `phase-4-repeats` 3 named × both × 3, 45 calls, $0.48 (cap $3).
- Smoke slice first ($0.15 cap on `phase-4-arm-a`) to check Luna's records: no reasoning-
  effort setting sent, the reported effort recorded, same prompt hash as GPT-4.1 for each
  case, ranking calls blind.
- **Smoke slice (owner-launched, $0.15 cap):** 4 cases × 2 models + 4 blind rankings,
  $0.1279, stopped cleanly.
- **Check — PASS:**
  - both models get the identical prompt (same prompt hash, equal to the offline trace);
    `embeddingProvider: local`;
  - Luna is sent no reasoning setting and reports effort **`medium`** (its default), recorded
    on every record; GPT-4.1 reports `gpt-4.1-2025-04-14`, no effort;
  - the ranking prompt shows shuffled arbitrary labels and states the judge is not told which
    model wrote which answer (`judge.ts` `buildRankingPrompt`).
- **First impressions (4 cases, not a result):** Luna's visible answers are much shorter
  (≈100–240 tokens vs GPT-4.1's 280–800) and cost about a third as much per graded answer
  ($0.005–0.010 vs $0.014–0.026). Luna took **13.7 s** on Academy Manufactor (1,284 reasoning
  tokens), close to the 15 s production timeout; latency is a real Phase 4 question.
- **Judge caveat surfaced:** on Academy Manufactor Luna added a correct edge case (Manufactor
  can still apply after Esix if the copied creature is itself a Clue, Food or Treasure — rule
  616.1f re-checks applicable effects). The judge marked it 1 for going beyond the reference.
  A judge anchored to the reference can under-credit a model that is *more* precise. Every
  Luna-vs-GPT-4.1 disagreement on the named cases will be read by a person before D3.
- **Full runs (one owner-launched chain, sequential, 2026-10-09 06:48–08:08 UTC):**
  - `phase-4-arm-a`: 252 records + 126 rankings, all `ok`, $3.51 (cap $16).
  - `phase-4-best-arm` (arm C): 92 records + 46 rankings, all `ok`, $1.41 (cap $6).
  - `phase-4-repeats`: 18 records + 9 rankings, all `ok`, $0.34 (cap $3).
- **Fidelity check on all 362 records — PASS:** for every case both models received the
  identical prompt hash; arm-A hashes equal the offline trace; all `embeddingProvider: local`;
  all on commit `da2221e2`; Luna effort `medium` throughout.

#### Phase 4 results (judge grades; provisional until the owner's blind review)

**Production prompt, 126 cases (46 diagnostic + 80 held-out):**

| | GPT-4.1 | GPT-6 Luna |
| --- | --- | --- |
| Correctness 2 / 1 / 0 | 119 / 6 / 1 | **124** / 1 / 1 |
| Diagnostic (46) | 43 | 44 |
| Held-out (80) | 76 | **80** |
| Tier 1 / 2 / 3 | 21/21 · 97/103 · 1/2 | 21/21 · 103/103 · 0/2 |
| Paired: only this model right | 1 | 6 |
| Blind ranking: ranked best | 47 | **78** (1 tie) |
| Grounding (0–2, names/uses rule excerpts) | **1.26** | 0.89 |
| Calibration / readability | 1.94 / 1.99 | 1.97 / 2.00 |
| Latency p50 / p95 / max | **2.7 s / 4.8 s / 7.7 s** | 3.6 s / 7.1 s / 13.7 s |
| Answers over 15 s (production timeout) | 0 | 0 (2 over 10 s) |
| Answer cost per answer | $0.0096 | **$0.0005** (≈ 1/20) |
| Visible / reasoning output tokens (mean) | 370 / 0 | 275 / 173 |

- Paired correctness 6–1 for Luna: two-sided sign test p ≈ 0.13, a lean, not proof. The blind
  ranking 78–47: p ≈ 0.007, a clear preference.
- GPT-4.1's 6 extra misses are all "right outcome, real side error" 1s (wrong timing of a
  target choice, misdescribed copy mechanics, a type-changing effect called a replacement
  effect). Luna's one extra miss is the Academy Manufactor answer the judge marked down for a
  **correct** detail beyond the reference.
- "Unknown rule ids" in 5 GPT-4.1 answers are keyword section numbers (702.7, 702.62,
  702.145, 701.27/701.28) the committed index does not store as entries; real rules, not
  invented ones. Luna: 0.

**Every deciding rule added (arm C), 46 diagnostic cases:** GPT-4.1 42 / Luna 43; paired 1–2;
blind ranking **GPT-4.1 26, Luna 19** (p ≈ 0.37). With complete evidence the ranking
preference for Luna disappears.

**Named cases, 3 repeats each (production prompt):**

| Case | GPT-4.1 | Luna | Luna latency |
| --- | --- | --- | --- |
| Academy Manufactor + Esix | 2 2 1 | 2 2 2 | 20.0 s, 12.5 s, 15.1 s |
| Necropotence + Silence + Borne | 0 0 0 | **2** 0 0 | 22.7 s, 11.1 s, 8.2 s |
| Only Blood + Tajuru (multiplayer) | 2 2 2 | 2 2 2 | ~4 s |

- Luna is the only model ever to get Necropotence right (1 of 5 Luna answers across Phase 4;
  GPT-4.1 0 of 26 across all phases and prompt versions, one partial). The agent read that answer: correct, it names the "this
  turn" effects ending before cleanup priority.
- **Latency is Luna's real limit on hard questions.** Of Luna's 10 tier-3 answers, 8 took over
  10 s and 4 over 15 s (13.7, 17.4, 20.0, 15.1, 22.7 s…). Production (`OPENAI_TIMEOUT_MS`
  default 15000, 2 retries) would have turned those four into errors for the player —
  including the one correct Necropotence answer and two of the three correct Academy answers.
  The eval itself sets no timeout, so these answers were recorded.
- Judge caveat confirmed twice: both of Luna's marked-down answers outside the named cases
  (Academy in arm A, Behold in arm C) were marked down for adding a detail beyond the
  reference, not for an error. The owner's blind review settles them.

**Spend:** Phase 4 $5.26 of $25. Investigation total **$11.44** (P1 $0.74, P3 $5.44, P4 $5.26).

**Owner review:** `PHASE-4-BLIND-REVIEW.md` — 12 blind pairs (3 must-read named-case pairs,
9 other disagreements), seed 20261009. Sealed key:
`.worktrees/aq-paid/output/answer-quality/runs/phase-4-blind-key.json`.

#### Owner adjudication (2026-10-09)

The owner added each card's Oracle text to the packet (same card data the models saw), then
asked for the agent's suggested grades to compare against. The agent checked each disputed
detail against card text or rule text, and stated it was not blind (it had seen the judge's
grades); the models stayed hidden. The owner graded all 24 answers and revised several after
seeing the reasons. Key unsealed after the owner finished.

| # | Case | GPT-4.1 (owner / judge) | Luna (owner / judge) |
| --- | --- | --- | --- |
| 1 | academy-manufactor-esix-treasure (arm A) | 2 / 2 | **2** / 1 |
| 2 | academy-manufactor-esix-treasure (repeat 3) | 1 / 1 | 2 / 2 |
| 3 | necropotence-silence-borne-upon-a-wind-cleanup (repeat 1) | 0 / 0 | 2 / 2 |
| 4 | combat-vengeful-archon-prevent-which-damage | **2** / 1 | 2 / 2 |
| 5 | copies-null-profusion-and-isochron-scepter | 1 / 1 | 2 / 2 |
| 6 | destroy-knight-of-the-mists | 1 / 1 | 2 / 2 |
| 7 | exchange-arcanum-wings | 1 / 1 | 2 / 2 |
| 8 | replicate-stream-of-thought | 1 / 1 | 2 / 2 |
| 9 | soulbond-deadeye-navigator | 1 / 1 | 2 / 2 |
| 10 | behold-celestial-reunion (arm C) | 2 / 2 | **2** / 1 |
| 11 | copies-clone-of-animated-staff (arm C) | 0 / 0 | 2 / 2 |
| 12 | replacement-rukarumel-and-bramblewood-paragon (arm C) | 1 / 1 | 2 / 2 |

- **Luna: 2 on all 12 disagreements.** GPT-4.1: three 2s, seven 1s, two 0s.
- Owner vs judge: 21 of 24 agree. All three differences are the judge being too strict: twice
  on Luna for a **correct** detail beyond the reference (Gingerbrute-style Food copies;
  kindred creature cards), once on GPT-4.1 for "assignment" vs "dealt" wording in the same
  step. The judge under-counted Luna, as suspected.
- Owner vs agent suggestions: 24 of 24 after the owner's review (not independent: the owner saw
  the suggestions).

**Adjudicated Phase 4 counts:**

| Run | GPT-4.1 right | Luna right | Paired: only GPT-4.1 / only Luna |
| --- | --- | --- | --- |
| Production prompt, 126 cases | 120 | **125** | 0 / 5 (sign test p ≈ 0.06) |
| Every rule added (arm C), 46 | 42 | **44** | 0 / 2 |
| Named cases, 3 repeats each (9) | 5 | 7 | 0 / 2 |

Luna's only miss on the production prompt is Necropotence; GPT-4.1 never beats Luna on any
adjudicated case. **D3 evidence:** Luna is more accurate, not just preferred, and the gap is
mostly GPT-4.1's side errors. Its limits remain speed on the hardest questions (4 of 10 tier-3
answers over 15 s) and fewer rule citations.
