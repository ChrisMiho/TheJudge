# Prompt Refinement vs. RAG — what each lever actually touches

Investigation for `PRD/work/promptRefinement.md`. Grounded in the backend code
(`apps/backend/src/`) and the two RAG design docs
(`PRD/ideasForLater/future-infra/sections/rag-data-plane.md`,
`retrieval-architecture.md`). No code changed; this is a read-and-report.

## The answer, first

Refining the prompt is worth doing even with RAG on the roadmap, because the two
levers barely overlap.

- **RAG replaces one thing:** *how supplemental rules paragraphs get scored and
  picked* (System 3 today, keyword/IDF → semantic/hybrid). A possible later
  extension covers card rulings (System 1). That is the whole of its reach.
- **Refinement owns everything else:** the system role, the instructions, the
  static rules reference, phase guidance, how the game-state object is formatted
  into text, section order and labels, output shaping, conversation-history
  policy, and — a real gap — that the entire prompt ships as one unstructured
  string with no system/user role split.

Of the ~13 labeled sections in the assembled prompt, RAG changes the *contents
of one* (and only the ranking inside it, not the section's existence). The other
~12 are refinement or deterministic-selection levers. So "should I refine the
prompt or wait for RAG" is a false choice — they improve different parts of the
same string.

## What a player does, and what you send

A player sets up a board state in the app and asks a question. The frontend
`POST`s to `/api/ask-ai` (`routes/askAi.ts:44`). The request object
(`validation/askAiRequest.ts`) is a discriminated union on `mode`:

- **`game` mode** (default): `{ question, gameContext, conversationHistory? }`.
  - `gameContext` (`askAiRequest.ts:151`): `playerCount`, `players[]` (life,
    poison, experience, energy, commander damage, counters), `turnPhase`,
    `combatStep?`, `activePlayer?`, `selectedZones[]`, and `zones` keyed by zone
    → array of cards.
  - Each card (`cardReferenceShape`, `askAiRequest.ts:90`): `cardId`, `name`,
    `oracleText`, `manaCost`, `manaValue`, `typeLine`, `colors`, `supertypes`,
    `subtypes`, plus stack metadata — `caster`, `owner`, `targets[]`,
    `contextNotes`, `manaSpent`.
- **`lookup` mode**: `{ question, card?, conversationHistory? }` — a single-card
  question with no board.

That structured object is the "complex thing sent to the backend" you weren't
sure you understood. It is well-typed and validated; it is not the fuzzy part.

## What it transforms into

The object becomes **one flat text string** that is sent verbatim to OpenAI as a
single `input` (`providers/openAiResponsesProvider.ts:40`). There is no LLM in
the loop until this final call — every step before it is deterministic,
in-process, keyword/rule scoring. No embeddings or vector store exist in runtime
code yet.

The transform runs in `prompt/preparation.ts` → `preparePromptInput`
(`preparation.ts:59`):

1. **Normalize** the request into an internal `PromptContext`
   (`prompt/context.ts:164`) — trims text, orders the stack, drops zero counters,
   fills a fallback question.
2. **Gather reference material** from the five systems below.
3. **Assemble** the flat prompt (`prompt/promptAssembly.ts:33`).
4. **Budget-check** it (`prompt/promptDiagnostics.ts`); the route rejects
   over-budget prompts (`askAi.ts:108`).

## The five context systems — and who owns each

The assembled game-mode prompt is an ordered list of labeled sections
(`promptAssembly.ts:56-105`). Mapping each to its lever:

| Prompt section | Source | Lever that improves it |
| --- | --- | --- |
| System role preamble | static (`promptFormatting.ts:12`) | **Refinement** |
| Instructions | static | **Refinement** |
| MTG reference | static (`mtgReference.ts:5`) | **Refinement** |
| General game context | request object | **Refinement** (formatting/what's included) |
| Phase guidance | rule-based static (`phaseGuidance.ts`) | **Refinement** |
| Zone sections (stack + zones) | request object | **Refinement** (formatting) |
| **System 2 — curated rules** | state-machine on phase/zone (`gameRulesTopicSelection.ts`) | **Refinement of the selector** — explicitly *out* of RAG scope |
| **System 3 — supplemental rules** | keyword/IDF scoring (`gameRulesRetrieval.ts`) | **← this is what RAG replaces** |
| **System 1 — official rulings** | exact oracle-ID lookup (`cardRulings.ts`) | Lookup today; *possible later* RAG scope |
| Combo section | deterministic index match (`commanderSpellbook/`) | Separate feature; not RAG |
| Scope | static | **Refinement** |
| Conversation history | truncation (`prompt/normalization.ts`) | **Refinement** (truncation policy) |
| Question | request object | input |

### What RAG actually is, per your own design docs

Both docs scope RAG narrowly and consistently:

- **System 3 only, for the first cut** — the 3,432-entry Comprehensive Rules
  corpus (`gameRulesRuleIndex.json`), keyword/IDF → embeddings
  (`retrieval-architecture.md` RA-001..005).
- **Hybrid, not replacement** — keep the exact rule-ID and keyword bonuses, add a
  cosine signal fused in (RA-004). A player citing "702.19b" must still resolve
  exactly.
- **Rulings (System 1) are an explicit open question** — embedding all 76,605
  rulings is ~20× the vector volume and a separate product-scope decision
  (`rag-data-plane.md` "rulings-corpus-scope-decision"). Not in the first cut.
- **System 2 is out of scope entirely** — it is state-machine selection on
  phase/zone, not scored retrieval, so there is nothing for embeddings to
  replace (`retrieval-architecture.md:10`).

So RAG's blast radius is: better ranking of the supplemental-rules paragraphs.
That's a real quality win for questions phrased in words that don't match the
rule text — but it is one section's contents, not the prompt's design.

## Where refinement still wins (RAG can't reach these)

1. **No system/user role split.** The entire prompt — role, instructions,
   reference, board, question — goes as one `input` string
   (`openAiResponsesProvider.ts:40`), not as separate system + user messages.
   This is a refinement lever RAG never touches and the most structural one
   available.
2. **The static instruction/role/reference text** (`promptFormatting.ts`,
   `mtgReference.ts`, `phaseGuidance.ts`) shapes tone, output format, and how the
   model reasons. RAG changes none of it.
3. **How the board object is rendered to text** — which fields appear, how the
   stack and zones are labeled, what a player's counters read like. Pure
   formatting, pure refinement.
4. **Section order and labeling** in `promptAssembly.ts` — what the model sees
   first and how sections are delimited.
5. **System 2's selector rules** — keyed only on phase/zone, never card text
   (`retrieval-architecture.md:10`). Improving *which* baseline topics fire is
   refinement of a deterministic selector, not RAG.

## Gaps worth naming

- **Single-string prompt with no role separation** — likely the highest-leverage
  refinement available, independent of RAG.
- **System 2 ignores card text** — topic selection can't react to what's actually
  on the board beyond zone presence.
- **The eval harness assumes deterministic scoring**
  (`eval/contextEvaluationHarness.ts`). It checks rule-ID recall/noise against a
  pure-function scorer. Any refinement to the static prompt text is already
  covered by its `.prompt.golden.txt` snapshots — so you *can* measure prompt
  changes today, before RAG. RAG will force this harness to stop asserting exact
  scores (`retrieval-architecture.md` RA-007); refinement doesn't.

## Recommended next step

Refine now; it doesn't wait on RAG and it's measurable today.

The two questions worth putting to a real design pass, in order of leverage:

1. **Split the prompt into system + user roles** rather than one `input` string.
   Structural, RAG-independent, and the eval harness's prompt snapshots will show
   the diff immediately.
2. **Tune the static instruction / role / reference text** against the golden
   fixtures — the part of answer quality RAG will never improve.

RAG remains the right upgrade for *supplemental-rules recall* specifically, and
the design docs already scope it well. But it and refinement are complementary,
not either/or: refinement fixes how the model is asked; RAG fixes which rules it
is handed. When you want to turn either into shippable work, that's a
`graph-run` / refinement pass on a sharpened, feature-shaped request — this
document is the input that sharpens it.
