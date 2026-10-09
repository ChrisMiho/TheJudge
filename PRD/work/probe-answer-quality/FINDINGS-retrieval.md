Nothing required yet (FYI): both current tester prompts omit deciding rules; card text and published rulings arrive intact.

# Retrieval and prompt construction probe

The current test versions of **both reported interactions omit deciding rules from the prompt**. The attached cards and their published rulings arrive intact. This is evidence of a retrieval gap; it does not establish that prompt layout or GPT-4.1 caused the wrong answers. First distinguish missing evidence from failure to use evidence, then compare models on identical prompts.

Measured 2026-10-07, checkout `3e973ced8d406ba7d608ca60598ed7ea13457385`. Read-only production-code inspection plus offline prompt assembly; no live API or embedding calls. Writes are confined to this evidence file.

## Fresh measurements

The experiment loaded the same four committed card/rule resources as the shared eval loader, built each committed worked-solution request, verified that its committed frozen query vector matched the current query hash, and called production `preparePromptInput` with enrichment debug. For each deciding rule it checked both the selected IDs and presence of the index's full text in the actual prompt. A separate assembly with cap 10,000 exposed full ranking without changing query or scoring. Lexical means a deliberate null query vector.

| Current worked-solution case | Rule | Hybrid rank | Lexical rank | Full rule text present at production cap 10? |
| --- | --- | ---: | ---: | --- |
| Academy Manufactor + Esix | 614.1a | 1916 | not scored positively | No |
| Academy Manufactor + Esix | 616.1 | 1111 | not scored positively | No |
| Academy Manufactor + Esix | 616.1e | 2329 | not scored positively | No |
| Academy Manufactor + Esix | 616.1f | 646 | 332 | No |
| Necropotence + Silence + Borne Upon a Wind | 514.1 | 3 | 2 | Yes |
| Necropotence + Silence + Borne Upon a Wind | 514.2 | 29 | 88 | No |
| Necropotence + Silence + Borne Upon a Wind | 514.3a | 13 | 89 | No |

Both frozen vectors were fresh; both hybrid assemblies exercised semantic ranking. The hybrid prompts measured 16,710 and 12,565 characters, against the application's 1,000,000-character budget. Neither rulings section was truncated. `checkCards` found no missing names, oracle text, or committed rulings. Manufactor's four and Esix's five rulings were present; the cleanup case included Necropotence's four, Borne Upon a Wind's one, and Silence's three.

Hybrid selected rules, in order:

- Manufactor: `702.174h, 205.3g, 111.10a, 722.3c, 203.1, 301.1, 205.3m, 613.9, 702.9c, 301.5a`.
- Cleanup: `703.4n, 514.3, 514.1, 724.1f, 703.4p, 303.1, 506.7f, 902.5b, 724.1d, 306.1`.

The particularly useful organization finding is that **cleanup's normal no-priority rule 514.3 arrives, but its immediately following exception 514.3a does not**. The delivered excerpt literally ends by referring to “the following exception.” This is a concrete incomplete-procedure seam, not merely speculation about a long prompt. Source entries: `apps/backend/data/gameRulesRuleIndex.json:7045`, `:7052`, `:7059`.

Cap 20 would still omit cleanup's 514.2 and every Manufactor deciding rule. Raising a small cap alone cannot solve these examples.

## Historical evidence is about different requests

The earlier `niche-interaction-rule-tests` package survives in `.worktrees/kickoff-niche-interaction-rule-tests/PRD/work/niche-interaction-rule-tests/`. Its `DESIGN-BRIEF.md:60` records the tester's original questions. Its measurement table at `:146` found Manufactor MISS but cleanup HIT: cleanup 514.2 ranked 7 and 514.3a ranked 3 under hybrid ranking. The current worked cases have different question wording and therefore different query vectors. Both old and current cleanup requests attach all three cards; attachment count does **not** explain the discrepancy.

The current cleanup question explicitly supplies the hand-size discard and the earlier main-phase Silence. The tester's short question instead names “triggered ability,” “dodge silence effects,” and “cast borne upon a wind.” Treat these as separate paraphrase test cases; do not describe their differing retrieval results as an implementation regression without a same-request comparison.

That old package measured seven candidate retrieval changes (`DESIGN-BRIEF.md:164`): dumping oracle text into search or only the embedding regressed existing retrieval and cleanup; adding replacement/prevention terminology improved some ranks but did not retrieve the complete rule procedure; a conditional curated full 616 family succeeded on its measured corpus. Those are useful **historical candidate measurements**, not evidence that the candidate shipped. Current `gameRulesTopicSelection.ts:13` and `prompt/preparation.ts:194` still use only the four always-on lookup topics. There is no current conditional 616 topic path.

The old package's account of an incorrect generated answer is historical evidence. This probe generated no answer and cannot establish current model correctness or reproduce the tester's original backend configuration.

## How the evidence reaches the model today

1. **Card resolution.** Attached oracle IDs resolve through the backend's committed detail and rulings indexes. Unknown card IDs degrade to an empty metadata block (`prompt/context.ts:122`). Rulings are included in stored order, up to 100 per card and a large character limit, rather than question-ranked (`cardRulings.ts:169`; `prompt/normalization.ts:3`). These limits did not remove anything in either measured case.
2. **Retrieval input.** The search is the current question plus each card's name, type line, and Scryfall keyword list (`gameRulesRetrieval.ts:396`; `prompt/preparation.ts:106`). It does not include full oracle text, published rulings, follow-up history, context notes, or game-state facts. Game-mode phase/zone information can switch on curated topics separately. The compact signal was intentional after earlier full-oracle query pollution measurements, documented at `gameRulesRetrieval.ts:381`.
3. **Curated baseline.** Lookup always includes triggered-ability basics, stack/priority, targeting, and zones. Game mode additionally chooses topics from populated stack/battlefield and phase (`gameRulesTopicSelection.ts:13`, `:24`, `:34`, `:101`). This creates a testable mode difference even where the underlying interaction is the same.
4. **Ranked supplements.** A flat rule index is ranked by a 60% cosine / 40% lexical blend after per-query normalization, plus explicit rule-ID boosts (`gameRulesRetrieval.ts:318`, `:349`, `:729`). Question words have weight 3; recognized keywords 6. Rule entries matching curated IDs or their descendants are excluded before ranking (`:701`). The result is sliced to ten individual entries (`:831`; `prompt/preparation.ts:55`). There is no subsequent complete-procedure, prerequisite, exception, or sibling-rule expansion.
5. **Prompt organization.** Lookup is a single text string: role heading and instructions, static Magic reference, curated rules, selected supplemental rules, card metadata, card rulings, eligible combo context, conversation history, question (`prompt/promptAssembly.ts:113`). Supplemental rules preserve retrieval order. Lookup explicitly requests relevant verbatim quotations only from supplied rule sections (`:148`). Game mode has different ordering and phase/state framing (`:36`).
6. **Model invocation.** Production sends `{ model, input: preparedPrompt.promptText }` (`providers/openAiResponsesProvider.ts:41`); the answer-quality runner does the same (`scripts/eval-answer-quality.mjs:525`). “SYSTEM ROLE PREAMBLE” is a heading inside that string, not a separately structured API system/developer message. Its effect on answer quality is unmeasured here.

The exact measured retrieval queries were:

```text
How do Academy Manufactor and Esix, Fractal Bloom interact when I create a Treasure? Academy Manufactor Artifact Creature — Assembly-Worker Treasure Food Esix, Fractal Bloom Legendary Creature — Fractal Flying

I control Necropotence and have more than seven cards in hand at my cleanup step. An opponent cast Silence during that turn's main phase. Can I cast Borne Upon a Wind in the cleanup step, after discarding to hand size? Necropotence Enchantment Borne Upon a Wind Instant Silence Instant
```

Neither Manufactor card signal expresses its non-keyword replacement ability. That is a plausible explanation for poor rule-family discovery, not an isolated causal measurement.

## Evaluation parity and measurement traps

- The shared loader, request builder, and embedded-query path materially improve parity (`scripts/lib/prompt-fidelity.mjs:1`, `:40`, `:113`). The offline gate uses the same prompt builder and exact-query frozen vectors; these two measured requests genuinely exercised the shipped retrieval code.
- **A “rule reached the prompt” gate currently counts only supplemental selections.** `eval/rules-gate/rulesGate.ts:179` tests expected IDs against `supplemental.selected`, ignoring the curated section. A deciding rule already supplied by a curated topic can therefore be called a miss. This is a verified measurement limitation, especially relevant before adding a conditional curated topic. It does not explain away the two measured cases: their missing rule texts were independently checked absent.
- The live run's `goldRuleInPrompt` is even narrower: it means **any one** expected rule is among supplemental selections (`scripts/lib/prompt-fidelity.mjs:103`), not all deciding rules and not complete prompt evidence. Cleanup can satisfy that boolean through 514.1 while both decisive later steps are absent. Report complete deciding-rule coverage separately.
- The common resource loader does not supply `comboCatalog`, whereas the production route can (`routes/askAi.ts:115`; `scripts/lib/prompt-fidelity.mjs:118`). This does not change these two questions because neither expresses explicit combo intent, but it limits universal claims of byte-identical runtime parity on other cases.
- Follow-up history is included in the answer prompt but excluded from its retrieval query. A terse follow-up may therefore lose retrieval context even though the model can read the earlier conversation. This is a verified construction property and a **hypothesis for failures**, not a measured regression here.
- Static reference text says “Continuous effects and state-based actions use a layer system” (`prompt/mtgReference.ts:20`). This should receive rules-truth review: it conflates two rules mechanisms. No causal effect on these answers was measured. The flat index also includes a trailing next-chapter heading in 514.3a's text, a minor corpus-cleanliness observation rather than an established answer cause.

## Controlled experiments to hand off

1. Keep the current exact requests, the original tester wording, and meaning-preserving paraphrases as separately named inputs with attached cards. Freeze request, corpus hashes, selected rules, complete prompt, model parameters, answer, grader output, latency, and token usage for every leg. Never compare results from rewritten questions as though only the implementation changed.
2. On GPT-4.1, compare the unmodified prompt with an **evidence-complete diagnostic prompt** that adds the authoritative deciding rule procedure without otherwise changing layout. This is a diagnostic upper bound using answer-key information, not a deployable retrieval solution. Success only after adding evidence identifies an evidence-supply opportunity; persistent failure identifies reasoning/instruction or answer-key issues.
3. Once evidence is held fixed, compare layout variants: preserve all content while moving the question and attached card facts closer to the relevant rule procedure; group a parent rule with its exception/steps; clarify the requested final ruling and conditional outcomes. Grade correctness separately from readability. Do not couple layout changes with new retrieval, new models, or new gold answers in the same comparison.
4. Test retrieval candidates that could discover complete rule families without answer-key leakage: bounded family/exception expansion from retrieved rules; interaction-aware query decomposition; the previously measured conditional curated 616 topic. Preserve the full regression corpus and explicitly measure complete deciding-rule coverage, noise, prompt size, and added latency. Do not blindly repeat full-oracle query concatenation already shown to regress prior measurements.
5. Compare another model only on the same saved prompts and evidence, including the unmodified and evidence-complete arms. This distinguishes robustness to incomplete context from the ability to apply supplied rules. Repeat anchor cases enough to reveal variability, then validate winners over the held-out corpus and old approved cases.

These are experiment candidates, not instructions to modify product code or silently change the existing PR's scope.

## Reproduction

Run from repository root with `node --import tsx --input-type=module`. Import `loadPromptResources` and `buildCaseRequest` from `scripts/lib/prompt-fidelity.mjs`; `loadFrozenVectors` and `checkReFreeze` from `apps/backend/src/eval/rules-gate/frozenVectors.ts`; and `preparePromptInput` from `apps/backend/src/prompt/preparation.ts`. Read the two named JSON cases from `apps/backend/src/eval/worked-solutions/`. For each, build the request, require `checkReFreeze(...).state === "fresh"`, then call `preparePromptInput(request, { ...resources, queryEmbedding: freeze.vector, collectEnrichmentDebug: true })`. Compare each expected rule's full index `text` with `promptText.includes(text)`. Repeat with `supplementalRuleCap: 10000` for rank positions and with `queryEmbedding: null` for lexical ranking. This needs neither credentials nor a local embedding-model download.
