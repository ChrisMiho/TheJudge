# Gate questions — niche-interaction-rule-tests

**Decide:** one new requirement, `REQ-220`. Answer its verdict slot below
(accept, edit, or reject; a reason is required for edit or reject), then merge
the docs PR to start the build.

Full evidence and measurements: `DESIGN-BRIEF.md` in this folder.

## REQ-220 — a repeatable check that the right rules reach the AI for the tester's two hard questions

**What this decides:** whether The Judge gets a small, separate, report-only test
set that asks the tester's two failed questions word for word and says whether
the rules that decide them reach the AI's prompt — and which rules count as
"the right ones" for each.

**In plain terms:** a tester asked Quick Lookup two hard questions and says it got
both wrong. This adds four test cases: each of his two questions, asked once with
the cards only typed and once with the cards picked in Quick Lookup's card
picker. For each, the check names the Comprehensive Rules that should be in the
prompt and reports HIT or MISS, offline, with no AI call and no cost.

The expected rules are labelled by hand from the official rules text:

- **Academy Manufactor + Esix, Fractal Bloom** (making a Treasure): rule 616.1 —
  when two replacement effects (effects that swap one event for another, worded
  with "instead") apply to the same event, the player chooses which goes first —
  and rule 616.1f — after one applies, any effect that still applies gets its
  turn. **Today: MISS.** Neither rule reaches the prompt, with or without the
  cards picked; the AI gets token definitions instead.
- **Silence + Necropotence + Borne Upon a Wind** (cleanup step): rule 514.2 —
  "this turn" effects like Silence end in the cleanup step — and rule 514.3a — if
  something triggers in the cleanup step, players get priority and can cast
  spells. **Today: HIT.** Both rules already reach the prompt. The tester's wrong
  answer here happened with the right rule in front of the AI, so this check
  cannot catch it; it is recorded as such, not hidden.

The cases live in their own folder, separate from the worked-solutions "gold
set" (the 18 hard questions the answer-quality run grades, which only accepts a
question whose answer is official text copied word for word — REQ-185; neither
of these interactions has one). The check reports and never blocks a build, the
same as the existing worked-solutions retrieval check (NFR-018 keeps that track
"not a build-blocking gate unless the owner later promotes it"); it could not
gate today anyway, because the Manufactor case misses and this package does not
change how rules are found.

**What happens if you say no:** no test cases are added. The tester's two
questions stay unmeasured, and the evidence that the Manufactor question is a
rule-finding gap while the Silence question is an answer gap lives only in this
package's brief, which is deleted when the package closes.

**Proposed diff** — `PRD/sections/functional-requirements.md`, appended after
`REQ-219`:

```diff
+### REQ-220
+- Title: Interaction retrieval check for reported hard interactions
+- Priority: medium
+- Description: A committed, offline, report-only set of rules questions that real players reported The Judge got wrong, each asked word for word through the production prompt-preparation path, checks whether the Comprehensive Rules that decide the question reach the prompt (System 3 supplemental retrieval, top ten). Each case carries hand-labelled expected rule ids and no answer key. It is separate from the answer-quality gold set (REQ-185), never read by the answer-quality run (REQ-188), and never a build gate. A miss names a concrete retrieval gap; a hit says only that the rule reached the prompt, never that the answer built from it was right.
+- Acceptance Criteria:
+  - cases live in `apps/backend/src/eval/interaction-retrieval/*.case.json`, outside `apps/backend/src/eval/fixtures/` (the directory the gating `contextEvaluationHarness.test.ts` reads), so no gating suite picks them up
+  - the first-ship set is four cases, the two questions a tester reported on 2026-10-06, each asked bare (card names typed only) and with the named cards attached by oracle id the way Quick Lookup's card picker sends them:
+    - `manufactor-esix-treasure-bare` and `manufactor-esix-treasure-cards` — question, verbatim: "How do academy manufactor and esix, fractal bloom interact when I'm attempting to create a treasure token?"; cards attached in the second: Academy Manufactor, Esix, Fractal Bloom; expected rule ids `616.1`, `616.1f`
+    - `necropotence-silence-cleanup-bare` and `necropotence-silence-cleanup-cards` — question, verbatim: "Can I use the triggered ability of necropotence during my cleanup step to dodge silence effects and cast borne upon a wind?"; cards attached in the second: Silence, Necropotence, Borne Upon a Wind; expected rule ids `514.2`, `514.3a`
+  - a case is valid only when it carries a non-empty `id`, `question`, and `whyHard`; at least one expected rule id, each present in the committed `apps/backend/data/gameRulesRuleIndex.json`; a `cards` list (may be empty) whose entries each carry `name` and `oracleId`; and a `source` block naming where the question came from (reporter, date, intake evidence path) and the rule ids its labels are read from. One shared loader validates every case and throws on a malformed one, naming each problem, rather than letting it score as a miss
+  - `npm run eval:interaction-retrieval` runs every case offline through the unmodified production `preparePromptInput` with the inputs a player's lookup supplies — the committed rule, card-detail, and card-rulings indexes; the case's cards attached by oracle id; the question (plus attached cards' compact signal) embedded by `EMBEDDING_PROVIDER`, default `local` — reusing `scripts/lib/prompt-fidelity.mjs`, and refuses to report a run whose embedder silently fell back to lexical ranking (as REQ-185's retrieval check does)
+  - the report prints one line per case — HIT when every expected rule id is in System 3's top ten, MISS otherwise; whether ranking was semantic or lexical; and each expected rule's System 3 rank or "not in prompt" — plus a summary line; a MISS exits 0
+  - the command appears in none of the gate scripts (`package.json` `quality:check`, `test`, `coverage:check`, `test:scripts`; `apps/backend/package.json` `test:eval`), asserted by a regression-guard test, as REQ-188 does for the answer-quality run; the loader's own unit tests are pure and offline and run under `npm run test:scripts`
+  - a README in the case directory states what the set is, what HIT and MISS mean, that it is not runtime prompt context and not a build gate, and the provenance rule below
+- Constraints:
+  - no live AI provider call, no live embedding call beyond the in-process local model, no network, no new runtime dependency (NFR-018)
+  - questions come from real player reports, word for word; expected rule ids are hand-labelled from the committed Comprehensive Rules text and never copied from scorer output (REQ-032); outside sources (judge Q&A, articles, forums) may explain why a case matters and are cited in the case, never used as its answer
+  - no case or label is added, edited, or removed to make a result look better (as REQ-185)
+  - no `workedSolution` or other answer key; a case enters the answer-quality gold set only through REQ-185's own tiers
+  - the worked-solutions retrieval check (`npm run eval:worked-solutions`) and its 18 cases are unchanged
+- Dependencies:
+  - REQ-032 (hand-labelled expected rule ids)
+  - REQ-185 (the gold set this stays separate from, and the production-fidelity request path it reuses)
+  - REQ-188 (the never-in-a-gate guard this mirrors)
+  - REQ-190 (the System 3 cap of ten that defines "reached the prompt")
+  - NFR-018 (the non-gating validation track)
+- Notes:
+  - measured 2026-10-06 (define, `niche-interaction-rule-tests`), production cap ten, local embedder (hybrid) and `EMBEDDING_PROVIDER=mock` (lexical): both Manufactor + Esix cases MISS under both rankings — 616.1 ranks 92 (bare) and beyond 300 (cards) semantically, 35 and 50 lexically, and 616.1f, 616.1e, 616.2, and 614.5 rank beyond 300 throughout; System 3's top ten is mostly token and copy rules (111.10a, the Treasure definition, ranks first to third). Both Necropotence + Silence cases HIT under both rankings — 514.2 at rank 5 to 7 and 514.3a at rank 3 to 4. The first build run's report is re-recorded here as the baseline
+  - the Manufactor miss has a named cause: the question never says "replacement" or "instead", and System 3's search text is the question plus each attached card's name, type line, and keywords, never its oracle text (REQ-167, REQ-178), so the "instead" on both cards never reaches the search. A diagnostic rephrasing that names "replacement effects" pulled 616.1f to rank 10 but not 616.1. Fixing this is a retrieval change for its own package; this check is its before/after measure
+  - the Necropotence + Silence hit means the rule that decides the question was in the prompt when the tester got a wrong answer; this check cannot detect that answer failure, and the answer-quality run (REQ-188) can only once an official published answer exists for it (REQ-185)
+  - the tester also reported the answer did not know Necropotence has a discard trigger. With the cards attached the prompt carries Necropotence's oracle text and rulings; with names only typed it carries no card text. Which way the tester asked is unknown
```

**Proposed diff** — `PRD/sections/system-map.md`, `## Eval harness`:

```diff
 ## Eval harness
 
 - Status: shipped
-- Summary: Context-evaluation harness with fixtures, golden comparisons, labeled retrieval-relevance checks over prompt assembly and retrieval, and an on-demand answer-quality baseline that scores the model's final answer against published worked solutions.
+- Summary: Context-evaluation harness with fixtures, golden comparisons, labeled retrieval-relevance checks over prompt assembly and retrieval, an on-demand answer-quality baseline that scores the model's final answer against published worked solutions, and an on-demand interaction retrieval check over hard interactions real players reported.
 - Lives in: `apps/backend/src/eval/`
-- Backed by: DEC-025, DEC-030, DEC-032, DEC-047, REQ-032, NFR-018, REQ-185
+- Backed by: DEC-025, DEC-030, DEC-032, DEC-047, REQ-032, NFR-018, REQ-185, REQ-220
```

and a new child entry after `### Answer-quality baseline`:

```diff
+### Interaction retrieval check
+
+- Status: shipped
+- Summary: On-demand, offline, report-only check that asks hard interaction questions real players reported, word for word, bare and with the named cards attached, through the production prompt-preparation path, and reports whether each case's hand-labelled Comprehensive Rules reach System 3's top ten. No answer key, no model call, never in `quality:check`, never a build gate.
+- Lives in: `apps/backend/src/eval/interaction-retrieval/`, `scripts/eval-interaction-retrieval.mjs`, `scripts/lib/interaction-cases.mjs`
+- Backed by: REQ-220, REQ-032, NFR-018
```

- Verdict:
- Reason:

## Blocker questions

None. Where the cases live, whether they gate a build, and which rules each case
expects are all inside `REQ-220` above, each with a recommendation the PRD
supports (REQ-185's official-answer bar, NFR-018's non-gating stance, REQ-032's
hand-labelled rule ids). An `edit` verdict on `REQ-220` changes any of them.
