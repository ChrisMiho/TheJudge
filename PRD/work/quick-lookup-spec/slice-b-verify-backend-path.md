# Slice B — Verify the full-backend-path section against actual backend source

Working directory: /Users/chrismiho/Coding/Projects/TheJudge

## Status: planned

## Goal

Confirm `PRD/sections/quick-lookup/README.md`'s `## The full backend path
(request → assembly → retrieval → provider → response)` section (lines
123–219 at map-out time) is correct and complete against the actual
`apps/backend/src/` files it names, read directly — not against the
requirement summaries alone — and against the backend-facing portion of
**Where it lives**. This is the gameplan's first spec with a dedicated
backend-path section; get its verification standard right since later specs
may follow this precedent. This slice verifies; it does not author. Close
any confirmed, sourced gap with a bounded additive correction only.

## Requirements

1. Read `apps/backend/src/validation/askAiRequest.ts` directly. Confirm:
   `askAiRequestSchema` is a `mode`-discriminated union over `"game" |
   "lookup"`; a payload with no `mode` key defaults to `"game"`; the lookup
   branch is `{ mode: "lookup", question, card?, conversationHistory? }`,
   `.strict()` (a `gameContext` key is rejected as unrecognized); `card` is
   optional and oracle-level only (`cardId`, `name`, `oracleText` required;
   no zone/owner/targets/context fields); `questionSchema` is
   `boundedText(600, 0)`; `conversationHistory` validation (1–20 turns,
   first `user`, last `assistant`, alternating, per-message cap) is shared
   with game mode.
2. Read `apps/backend/src/prompt/preparation.ts` and
   `apps/backend/src/prompt/promptAssembly.ts` directly. Confirm
   `preparePromptInput` routes `mode: "lookup"` to
   `prepareLookupPromptInput` → `buildLookupPromptText`, a single path, not
   a fork by card presence. Confirm what always runs (static MTG reference
   block, always-on core topics, question-scored System 3) versus what
   layers in only with a card attached (full metadata incl. oracle text,
   WotC rulings, System 3 also scored on oracle text + type line). Confirm
   game-state-only sections (zone sections, `PHASE GUIDANCE`, System 2 topic
   gating, zone scope sentence) are structurally absent — the lookup
   assembler never calls those builders (grep for their call sites inside
   `prepareLookupPromptInput` specifically, not `prepareGamePromptInput`).
3. Independently re-verify the known candidate finding recorded in
   `GAMEPLAN.md`'s "Known candidate finding for slice B" section — do not
   trust that pre-scout, re-derive it from source:
   - Read `PRD/sections/decisions/combo-retrieval.md` DEC-116 in full.
     Confirm it is `Status: confirmed` and states lookup mode requires
     explicit combo intent **and** an attached card.
   - Read `PRD/sections/functional-requirements.md` REQ-094 and REQ-095 in
     full. Confirm REQ-094's lookup-mode acceptance criteria (combo
     retrieval runs only with explicit intent + attached card; the
     candidate must contain the attached card as an exact ingredient or
     authoritative template match; no card or no intent → no combo data)
     and REQ-095's shared prompt-section format.
   - Read `PRD/sections/system-map.md`'s `## Commander Spellbook combo
     retrieval` block (confirm the actual heading text — the package README
     paraphrased it as "combo enrichment"). Confirm its `Lives in:` line.
   - In `apps/backend/src/prompt/preparation.ts`, confirm
     `prepareLookupPromptInput` calls `resolveLookupComboCandidates`, and
     that function calls `selectComboCandidates` with `mode: "lookup"`,
     gated on `options.comboCatalog` being present, and that the result
     (`comboCandidates`) is passed into `buildLookupPromptText` — read the
     actual call sites, not the requirement text alone.
   - Confirm `apps/backend/src/eval/fixtures/commander-spellbook-lookup-
     attached-intent.fixture.json` and
     `commander-spellbook-lookup-unrelated.fixture.json` exist and are
     lookup-mode fixtures (open each and check its `mode` field).
   - Confirm `PRD/sections/user-flows.md` FLOW-011's body (read the whole
     entry, not a keyword grep alone) makes no mention of combo retrieval —
     so no correction is needed there.
   - If every one of the above holds (it should — this was checked directly
     at map-out time), the spec's backend-path section has a confirmed,
     sourced gap: apply the bounded additive correction described in
     `GAMEPLAN.md` — a short addition (a new subsection or an added bullet
     inside "Branching prompt assembly") citing DEC-116, REQ-094, REQ-095,
     and `preparation.ts`'s `resolveLookupComboCandidates`; add the two
     `commander-spellbook-lookup-*` fixtures to the "Golden regression
     coverage" bullet; add DEC-116, REQ-094, REQ-095 to the spec's `Backed
     by:` header line; add `apps/backend/src/commanderSpellbook/` to the
     backend half of **Where it lives**. If any part of this pre-scout does
     not hold on independent re-check, do not apply that part of the
     correction — record what was actually found instead.
4. Read `apps/backend/src/prompt/context.ts`,
   `apps/backend/src/prompt/mtgReference.ts`, and
   `apps/backend/src/prompt/phaseGuidance.ts` directly. Confirm
   `buildLookupPromptContext` carries only question + optional card +
   optional history with no fallback question; `MTG_PROMPT_REFERENCE` is a
   bounded static constant shared by both modes; `getPhaseGuidance` is
   called only from the game path.
5. Read `apps/backend/src/gameRulesRetrieval.ts` directly. Confirm System 3
   is IDF-scored keyword retrieval, excludes curated core-topic rule ids,
   returns a capped set (confirm the actual cap value in code — the spec
   should not overstate or understate it), and that the lookup query is
   built from question tokens always plus card oracle/type tokens only when
   a card is attached (`buildQueryTokensFromParts` call site inside
   `prepareLookupPromptInput`). Confirm the always-on core set is a fixed
   four-topic set (`ALWAYS_ON_TOPIC_IDS` in `gameRulesTopicSelection.ts`) —
   cross-check the topic ids the spec implies against the actual constant.
6. Read `apps/backend/src/providers/askAiProvider.ts`,
   `createAskAiProvider.ts`, `mockAskAiProvider.ts`,
   `openAiResponsesProvider.ts`, and `apps/backend/src/providers/README.md`
   directly. Confirm `AskAiProvider.generateAnswer` consumes only the
   assembled prompt text and never inspects `mode`; confirm `ASK_AI_PROVIDER`
   selection, the `mock`-is-default behavior exposing the assembled prompt
   as `answer`, and the `openai` live path are described accurately.
7. Confirm the off-domain guardrail bullets against a direct grep of
   `apps/backend/src/prompt/` for any classifier, validator, or detection
   branch keyed on off-domain input — confirm none exists, so the "prompt-
   instruction-only" claim holds; confirm the instruction wording is pinned
   by `apps/backend/src/eval/fixtures/quick-lookup-off-domain.prompt.golden.txt`
   (read the golden file, don't just confirm it exists).
8. Confirm the backend-facing portion of **Where it lives** — the
   `askAiRequest.ts` mode-lookup branch, the `apps/backend/src/prompt/`
   files, `gameRulesRetrieval.ts`, and `apps/backend/src/providers/` files
   — against the actual repository tree (`ls`/`find`), plus the
   `apps/backend/src/eval/fixtures/quick-lookup-*` golden set. Do not check
   the frontend file list in this same paragraph — slice A owns that half.
9. Confirm no new stable ID token appears in the backend-path section beyond
   the licensed DEC-116/REQ-094/REQ-095 addition (if applied) — every other
   ID token must already resolve to a real, pre-existing ID in its home
   file.
10. Touch only `PRD/sections/quick-lookup/README.md`, and only within **The
    full backend path** section and the backend half of **Where it lives**
    — no edit to any other section of this file (What it is, How it works,
    Measured bounds, Rejected alternatives and deferred scope, or the
    frontend half of Where it lives — slice A owns those), no other file, no
    DEC/REQ/FLOW/NFR body edit, no `system-map.md`/`screen-layout.md`
    edit, no `apps/` change, no new decision.

## Acceptance criteria

- [ ] B1 — Request-validation bullets (mode-discriminated union, default-to-
      game, `.strict()` lookup branch, oracle-level card shape, 600-char
      `questionSchema`, shared conversation-history validation) are confirmed
      against `askAiRequest.ts`, read directly.
- [ ] B2 — Branching-prompt-assembly bullets (single path not forked by
      card, always-run vs. card-conditional layers, structural absence of
      game-state-only sections) are confirmed against `preparation.ts` and
      `promptAssembly.ts`, read directly, including a direct check that the
      lookup assembler never calls the game-context/phase-guidance/zone-
      section builders.
- [ ] B3 — The combo-retrieval finding is independently re-verified against
      DEC-116, REQ-094, REQ-095, the system-map "Commander Spellbook combo
      retrieval" block, `preparation.ts`'s `resolveLookupComboCandidates`
      call sites, and the two `commander-spellbook-lookup-*` fixtures; the
      bounded additive correction (backend-path addition, golden-coverage
      bullet, `Backed by:` line, Where-it-lives addition) is applied if the
      finding holds, and FLOW-011 is confirmed to need no change.
- [ ] B4 — Off-domain-guardrail bullets are confirmed prompt-instruction-
      only via a direct grep of `apps/backend/src/prompt/` for any
      classifier/validator/detection branch, and the pinned wording is
      confirmed against the actual
      `quick-lookup-off-domain.prompt.golden.txt` content.
- [ ] B5 — Retrieval bullets (IDF-scored System 3, capped result set, curated
      exclusion, question-always/card-conditional query tokens, fixed four-
      topic always-on core) are confirmed against `gameRulesRetrieval.ts`
      and `gameRulesTopicSelection.ts`'s `ALWAYS_ON_TOPIC_IDS`, read
      directly.
- [ ] B6 — Provider-boundary bullets (mode-agnostic `generateAnswer`,
      `ASK_AI_PROVIDER` selection, mock-default exposing the assembled
      prompt, golden fixture set including the two combo fixtures added in
      B3) are confirmed against `apps/backend/src/providers/*` and
      `apps/backend/src/providers/README.md`, read directly.
- [ ] B7 — The backend-facing portion of **Where it lives** names every
      backend file the spec's backend-path section actually depends on,
      confirmed present in the repository tree.
- [ ] B8 — No new (minted) stable ID token appears in the backend-path
      section beyond the licensed DEC-116/REQ-094/REQ-095 addition (if
      applied) — and this slice's diff touches only `PRD/sections/quick-
      lookup/README.md`, confined to the backend-path section and the
      backend half of Where it lives — no `apps/` change, no edit to any
      existing DEC/REQ/FLOW/NFR body, no `system-map.md`/`screen-layout.md`
      edit.

## Verification

```bash
sed -n '1,60p' apps/backend/src/validation/askAiRequest.ts
grep -n "mode\|strict\|questionSchema\|boundedText" apps/backend/src/validation/askAiRequest.ts
grep -n "prepareLookupPromptInput\|prepareGamePromptInput\|resolveLookupComboCandidates\|resolveGameComboCandidates" -A 20 apps/backend/src/prompt/preparation.ts
grep -n "getPhaseGuidance\|buildLookupPromptContext\|buildPromptContext" apps/backend/src/prompt/context.ts apps/backend/src/prompt/preparation.ts
cat PRD/sections/decisions/combo-retrieval.md | grep -n "^### DEC-116" -A 20
grep -n "^### REQ-094" -A 20 PRD/sections/functional-requirements.md
grep -n "^### REQ-095" -A 15 PRD/sections/functional-requirements.md
grep -n "^## Commander Spellbook combo retrieval" -A 5 PRD/sections/system-map.md
cat apps/backend/src/eval/fixtures/commander-spellbook-lookup-attached-intent.fixture.json
cat apps/backend/src/eval/fixtures/commander-spellbook-lookup-unrelated.fixture.json
sed -n '238,270p' PRD/sections/user-flows.md
grep -n "retrieveRulesForQuery\b" -A 15 apps/backend/src/gameRulesRetrieval.ts
grep -n "ALWAYS_ON_TOPIC_IDS" -A 6 apps/backend/src/gameRulesTopicSelection.ts
grep -rn "PHASE GUIDANCE\|getPhaseGuidance\|selectGameRulesTopics" apps/backend/src/prompt/preparation.ts
cat apps/backend/src/providers/README.md
cat apps/backend/src/eval/fixtures/quick-lookup-off-domain.prompt.golden.txt
find apps/backend/src/eval/fixtures -maxdepth 1 -iname "quick-lookup-*"
ls apps/backend/src/commanderSpellbook/
grep -oE "(DEC|REQ|FLOW|NFR|Q)-[0-9]+" PRD/sections/quick-lookup/README.md | sort -u
git status --porcelain PRD/sections/ apps/
```

## Files touched

- `PRD/sections/quick-lookup/README.md` (verify; bounded additive
  correction confined to the backend-path section and the backend half of
  Where it lives)
