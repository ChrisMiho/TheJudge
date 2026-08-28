# Slice C — Verify the full backend path section against actual backend source

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

## Status: planned

## Goal

Confirm `PRD/sections/in-depth/README.md`'s `## The full backend path
(mode: "game")` section (lines 253–356 at map-out time: Request validation,
Prompt assembly, Retrieval enrichment, Combo enrichment, Provider boundary
and diagnostics) is correct and complete against the actual
`apps/backend/src/` files it names, read directly — not against the
requirement summaries alone — and against the backend-facing portion of
**Where it lives**. In-Depth's `mode: "game"` branch is the backend's
original and largest consumer — several files here (retrieval, combo) are
shared with Quick Lookup's `mode: "lookup"` branch already verified by
`quick-lookup-spec`; re-verify them here against the game-mode call sites
specifically, do not assume the lookup-mode verification transfers. This
slice verifies; it does not author. Close any confirmed, sourced gap with a
bounded additive correction only.

## Requirements

1. Read `apps/backend/src/validation/askAiRequest.ts` directly. Confirm:
   `askAiRequestSchema` is a `mode`-discriminated union; a payload with no
   `mode` key defaults to `"game"` for back-compat; the game branch is
   `{ question, gameContext }` with no top-level `stack`/`battlefieldContext`
   and no `card` field; `gameContext.zones` carries only non-empty zone
   arrays; `gameStateNotes` validation (optional, trimmed,
   control-character-guarded, 2000-char cap, omitted when blank);
   `conversationHistory` validation (optional, 1–20 turns, ≤2000 chars/
   message, alternating starting with user ending with assistant) — this is
   the same shared validator Quick Lookup's slice B already checked; confirm
   it applies identically here rather than re-deriving it from scratch.
2. Read `apps/backend/src/prompt/preparation.ts`, `apps/backend/src/prompt/context.ts`,
   `apps/backend/src/prompt/normalization.ts`, `apps/backend/src/prompt/mtgReference.ts`,
   and `apps/backend/src/prompt/phaseGuidance.ts` directly. Confirm the fixed
   section order (`GENERAL GAME CONTEXT` → `ADDITIONAL GAME STATE` when
   present → `PHASE GUIDANCE` → populated zone sections → `GAME RULES
   (reference)` → `ADDITIONAL RELEVANT RULE EXCERPTS` → `OFFICIAL RULINGS` →
   combo context when eligible → `CONVERSATION HISTORY` when present →
   `SCOPE` → `QUESTION`) matches `prepareGamePromptInput`'s actual assembly
   call order. Confirm `PHASE GUIDANCE` is combat-substep-specific when
   `turnPhase` is `combat`, falling back to generic combat framing when
   `combatStep` is absent, and is never omitted for a valid phase. Confirm
   every card in every populated zone section emits full metadata
   (`oracleText`, `manaCost`, `manaValue`, `typeLine`, `colors`,
   `supertypes`, `subtypes`, `targets`, `contextNotes`), the empty-
   oracle-text fallback string, and that the stack section alone carries
   `stackRole`/`caster`/`manaSpent` while non-stack sections use `owner` and
   omit `caster`; confirm `cardId`/`imageUrl` stay out of the prompt text.
3. Read `apps/backend/src/gameRules.ts` and `apps/backend/src/gameRulesRetrieval.ts`
   directly. Confirm `GAME RULES (reference)` loads verbatim WotC
   Comprehensive Rules excerpts selected by an always-on core set (DEC-045)
   plus card-agnostic game-state-gated expansion (System 2, gated only on
   `turnPhase`/`combatStep`/populated zones — no card names or oracle text),
   omitted only when the artifact is missing/empty with a logged warning.
   Confirm `ADDITIONAL RELEVANT RULE EXCERPTS` adds up to 5 supplemental
   rules via IDF-weighted lexical scoring with question/keyword boosts
   (DEC-046), deduplicated against the System 2 selection, omitted when
   nothing scores above 0.
4. Read `apps/backend/src/cardRulings.ts` directly. Confirm `OFFICIAL
   RULINGS` carries published WotC Oracle rulings for submitted cards, and
   confirm the DEC-047 relevance-verification claim (eval harness, labeled
   expected outcomes for System 2/System 3, not structural checks alone) —
   this is the slice's known-candidate header-citation-gap target (see
   requirement 8), read DEC-047 in full before confirming this bullet.
5. Read `apps/backend/src/commanderSpellbook/` (`catalog.ts`, `intent.ts`,
   `matcher.ts`, `zones.ts`, `formatting.ts`) and the game-mode combo call
   site inside `apps/backend/src/prompt/preparation.ts` directly (the
   `prepareGamePromptInput` combo-resolution path, distinct from Quick
   Lookup's `resolveLookupComboCandidates` already verified elsewhere).
   Confirm: without explicit combo intent, retrieval returns only complete
   candidates (every ingredient/quantity assigned to a distinct submitted
   card instance in a compatible starting zone); with explicit combo intent
   (detector: `combo`, `infinite`, `loop`, `win condition`, etc.), complete
   candidates rank first and partial candidates may also return; at most 5
   variants selected, deterministically ordered (DEC-116, DEC-162, REQ-093,
   REQ-094). Confirm the `COMMANDER SPELLBOOK COMBO CONTEXT —
   COMMUNITY-SOURCED` section position (after enrichment, before
   conversation history/question), per-ingredient fields surfaced, the
   forbidden bare "complete" wording, and the answer-quality-A/B-only
   measurement claim (DEC-161 — confirm no golden/build-gate use exists by
   grepping `quality:check`/eval config for a combo-quality gate).
6. Read `apps/backend/src/providers/askAiProvider.ts`,
   `createAskAiProvider.ts`, `mockAskAiProvider.ts`,
   `openAiResponsesProvider.ts`, and `apps/backend/src/providers/README.md`
   directly. Confirm `AskAiProvider.generateAnswer` consumes only the
   assembled prompt text and never inspects `mode`; confirm `ASK_AI_PROVIDER`
   selection, mock-default behavior exposing the assembled prompt
   (including `CONVERSATION HISTORY`, frozen `gameContext`, phase guidance,
   any combo section) as `answer`, and the `openai` live path; confirm
   upstream failures map to the normalized error shape.
7. Independently re-verify the slice's known-candidate header-citation gap
   findings recorded in `GAMEPLAN.md`'s "Known candidate finding" section —
   do not trust that pre-scout, re-derive it from source:
   - Read `PRD/sections/decisions/rules-retrieval.md` DEC-047 in full.
     Confirm it is `Status: confirmed` and its subject (eval-harness
     labeled-outcome relevance verification) matches the "Retrieval
     enrichment" `OFFICIAL RULINGS` bullet's inline `(DEC-029, REQ-032,
     DEC-047)` citation. Confirm DEC-047 is absent from the spec's header
     `Backed by:` line (`grep`). If both hold, add DEC-047 to `Backed by:`
     (insertion only, no reordering of existing entries).
   - Read `PRD/sections/functional-requirements.md` REQ-033 in full.
     Confirm it is the live response-size diagnostic-logs requirement and
     matches "Provider boundary and diagnostics"'s second bullet's inline
     `(DEC-049, REQ-033)` citation. Confirm REQ-033 is absent from `Backed
     by:`. If both hold, add REQ-033 to `Backed by:` (insertion only).
8. Confirm the successful-live-answer diagnostics bullet (`correlationId`,
   `providerElapsedMs`, `answerChars`, `estimatedAnswerTokens`,
   `charsPerTokenEstimate`) against `openAiResponsesProvider.ts` or the
   route handler that emits them, and confirm live responses stay
   `{ answer }`-only with no sidecar.
9. Confirm the backend-facing portion of **Where it lives** — `askAi.ts`,
   the `askAiRequest.ts` game-mode branch, the `apps/backend/src/prompt/`
   files (`preparation.ts`, `context.ts`, `normalization.ts`,
   `mtgReference.ts`, `phaseGuidance.ts`), the retrieval modules
   (`cardRulings.ts`, `gameRules.ts`, `gameRulesTopicSelection.ts`,
   `gameRulesRetrieval.ts`), the `apps/backend/src/commanderSpellbook/`
   modules, and `apps/backend/src/providers/` — against the actual
   repository tree (`ls`/`find`). Do not check the frontend file list in
   this same paragraph — slices A/B own that half.
10. Confirm no new stable ID token appears in the backend-path section
    beyond the licensed DEC-047/REQ-033 additions (if applied) — every other
    ID token must already resolve to a real, pre-existing ID in its home
    file.
11. Touch only `PRD/sections/in-depth/README.md`, and only within **The
    full backend path** section, its header's `Backed by:` line (for the
    DEC-047/REQ-033 addition), and the backend half of **Where it lives** —
    no edit to any other section (What it is, How it works, Measured
    bounds, Rejected alternatives, or the frontend half of Where it lives —
    slices A/B own those), no other file, no DEC/REQ/FLOW/NFR body edit, no
    `system-map.md`/`screen-layout.md` edit, no `apps/` change, no new
    decision.

## Acceptance criteria

- [ ] C1 — Request-validation bullets (mode-discriminated union, default-to-
      game, no top-level `stack`/`battlefieldContext`/`card`, empty-zone
      omission, `gameStateNotes` bounds, shared `conversationHistory`
      validation) are confirmed against `askAiRequest.ts`, read directly.
- [ ] C2 — Prompt-assembly bullets (fixed section order, `PHASE GUIDANCE`
      combat-substep specificity, full per-card metadata, stack-vs-non-stack
      field differences) are confirmed against `preparation.ts`, `context.ts`,
      `normalization.ts`, `mtgReference.ts`, and `phaseGuidance.ts`, read
      directly.
- [ ] C3 — Retrieval bullets (always-on core plus game-state-gated System 2
      expansion, IDF-weighted System 3 supplemental scoring with dedup,
      omission conditions) are confirmed against `gameRules.ts` and
      `gameRulesRetrieval.ts`, read directly.
- [ ] C4 — Combo-enrichment bullets (complete-vs-partial candidate gating on
      explicit intent, 5-variant cap, deterministic ordering, section
      position, forbidden "complete" wording, A/B-only measurement) are
      confirmed against `apps/backend/src/commanderSpellbook/` and the
      game-mode combo call site in `preparation.ts`, read directly.
- [ ] C5 — Provider-boundary and diagnostics bullets (mode-agnostic
      `generateAnswer`, `ASK_AI_PROVIDER` selection, mock-default exposing
      the assembled prompt, live-path diagnostics fields, `{ answer }`-only
      response shape) are confirmed against `apps/backend/src/providers/*`
      and `apps/backend/src/providers/README.md`, read directly.
- [ ] C6 — The DEC-047 header-citation gap is independently re-verified; if
      confirmed, DEC-047 is added to the `Backed by:` line.
- [ ] C7 — The REQ-033 header-citation gap is independently re-verified; if
      confirmed, REQ-033 is added to the `Backed by:` line.
- [ ] C8 — The backend-facing portion of **Where it lives** names every
      backend file the spec's backend-path section actually depends on,
      confirmed present in the repository tree.
- [ ] C9 — No new (minted) stable ID token appears in the backend-path
      section beyond the licensed DEC-047/REQ-033 additions (if applied) —
      and this slice's diff touches only `PRD/sections/in-depth/README.md`,
      confined to the backend-path section, the `Backed by:` line, and the
      backend half of Where it lives — no `apps/` change, no edit to any
      existing DEC/REQ/FLOW/NFR body, no `system-map.md`/`screen-layout.md`
      edit.

## Verification

```bash
sed -n '/^## The full backend path/,/^## Measured bounds/p' PRD/sections/in-depth/README.md
grep -n "mode\|strict\|gameContext\|gameStateNotes\|conversationHistory" apps/backend/src/validation/askAiRequest.ts
grep -n "prepareGamePromptInput" -A 30 apps/backend/src/prompt/preparation.ts
grep -n "getPhaseGuidance" apps/backend/src/prompt/phaseGuidance.ts apps/backend/src/prompt/preparation.ts
grep -n "GENERAL GAME CONTEXT\|ADDITIONAL GAME STATE\|PHASE GUIDANCE\|GAME RULES\|ADDITIONAL RELEVANT RULE EXCERPTS\|OFFICIAL RULINGS\|CONVERSATION HISTORY\|SCOPE\|QUESTION" apps/backend/src/prompt/*.ts
grep -n "ALWAYS_ON\|selectGameRulesTopics" apps/backend/src/gameRules.ts
grep -n "retrieveRulesForQuery\|IDF\|score" apps/backend/src/gameRulesRetrieval.ts
cat apps/backend/src/cardRulings.ts | head -60
grep -n "^### DEC-047\b" -A 15 PRD/sections/decisions/rules-retrieval.md
grep -n "^### REQ-033\b" -A 15 PRD/sections/functional-requirements.md
grep -n "resolveGameComboCandidates\|selectComboCandidates\|hasExplicitComboIntent" -A 15 apps/backend/src/prompt/preparation.ts
grep -n "^### DEC-116\b" -A 20 PRD/sections/decisions/combo-retrieval.md
ls apps/backend/src/commanderSpellbook/
cat apps/backend/src/providers/README.md
grep -n "generateAnswer\|mode" apps/backend/src/providers/askAiProvider.ts
grep -n "correlationId\|providerElapsedMs\|answerChars\|estimatedAnswerTokens\|charsPerTokenEstimate" -r apps/backend/src
ls apps/backend/src/routes/askAi.ts apps/backend/src/validation/askAiRequest.ts apps/backend/src/prompt/preparation.ts apps/backend/src/prompt/context.ts apps/backend/src/prompt/normalization.ts apps/backend/src/prompt/mtgReference.ts apps/backend/src/prompt/phaseGuidance.ts apps/backend/src/cardRulings.ts apps/backend/src/gameRules.ts apps/backend/src/gameRulesTopicSelection.ts apps/backend/src/gameRulesRetrieval.ts
grep -oE "(DEC|REQ|FLOW|NFR|Q)-[0-9]+" PRD/sections/in-depth/README.md | sort -u
git status --porcelain PRD/sections/ apps/
```

## Files touched

- `PRD/sections/in-depth/README.md` (verify; bounded additive correction
  confined to the backend-path section, the `Backed by:` line, and the
  backend half of Where it lives)
