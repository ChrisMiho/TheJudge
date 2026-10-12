# Prompt layout spec

Backed by: DEC-025, DEC-042, REQ-169, DEC-107, REQ-074, REQ-178, REQ-181, REQ-182, REQ-190, REQ-235, REQ-238, REQ-239, REQ-240, REQ-241, REQ-243, REQ-244, REQ-245

## Purpose

Past ad-hoc prompt inspection was, in the owner's words, "an overwhelming
amount of json." This doc is the readable answer: every section the backend
prompt is built from, listed in the order the code actually assembles them,
with a plain one-line description each, plus a presence matrix showing which
sections appear on which path. It is documentation only — it changes no code,
no request contract, and no runtime behavior. To see a real assembled prompt
rather than reading about its shape, use `npm run prompt:preview` (below).

Two functions in `apps/backend/src/prompt/promptAssembly.ts` build the prompt:
`buildPromptText` for In-Depth game mode, and `buildLookupPromptText` for
Quick Question lookup mode (`mode: "lookup"`). Both push section headings and
bodies onto one ordered array and join it with newlines — there is no
reordering, template engine, or second assembly path per mode variant. The
table below merges both functions' section lists into one ordered reading:
every section keeps its real position from whichever function renders it, and
a section only one path uses (like `CARD (looked up)`, lookup-only) sits at
that path's actual position, not an invented one.

## Sections, in assembly order

| # | Section heading | What it is, in one line |
| --- | --- | --- |
| 1 | `SYSTEM ROLE PREAMBLE` | Fixed lines that set the assistant's persona, scope, and ground rules (e.g. never invent hidden state) — the same on every path, except the stack-order line ("Stack item 1 is the bottom of the stack"), which only game mode carries (REQ-243). |
| 2 | `INSTRUCTIONS` | One shared bulleted list of behavioral rules, including the one statement that the rules are binding and never override the submitted game state or card text; lookup adds its off-domain line, a game-mode follow-up adds its follow-up line (REQ-243). |
| 3 | `MTG REFERENCE` | Core Magic background (turn structure, the layer system), one block per mode: the game-mode block also describes the app's turn-phase field, zones and scope note; the lookup block describes only what a lookup prompt contains (REQ-243). |
| 4 | `GENERAL GAME CONTEXT` | The submitted game state's shared facts: player count, life totals, turn phase, active player. Game mode only. |
| 5 | `PHASE GUIDANCE` | A short, rules-checked summary of a turn step: in game mode the current step / combat step; in lookup mode each step the question (or an attached card's concept terms) names, at most three, right after `MTG REFERENCE` (REQ-024, REQ-238). |
| 6 | `ZONE: <name>` (one heading per populated zone) | The ordered stack (bottom to top) plus any other zone with cards, each card's full metadata (with power, toughness and loyalty when it has them, oracle line breaks kept, REQ-245) followed by its WotC rulings at its first appearance (REQ-241). Game mode only. |
| 7 | `GAME RULES (reference)` | Curated core-rules excerpts (System 2) — an always-on set plus turn-phase and combat-step topics, and in game mode the topics the cards' wording or the question match (REQ-242), an always-on set in lookup mode; in both, the replacement-effect interaction topic is added when two or more cards carry replacement or prevention wording (REQ-220); each topic prints its rules in rule-book order, each id once, and a topic rule that introduces a list carries the list (REQ-239, REQ-240); "see rule X" pointers to text not in the prompt carry the target's first sentence or title (REQ-244). |
| 8 | `ADDITIONAL RELEVANT RULE EXCERPTS` | Supplemental rule excerpts (System 3), ranked by a hybrid blend of normalised cosine against committed per-rule embeddings and normalised keyword-overlap score, with the exact-rule-id boost merged into the blended score and keyword-overlap scoring alone retained as the mock/offline default and the failure fallback, from a query built from the question plus each attached card's name, type line, keywords and concept terms — not its full oracle text — up to fifteen excerpts (thirteen main-ranking slots after the 0.6 relevance cutoff plus two per-card slots) with each attached card's keyword rules added whole beside them (REQ-167, REQ-178, REQ-181, REQ-182, REQ-190, REQ-234, REQ-235); printed in rule-book order, grouped under "<part> › <section>" path labels, each id once, a delivered lead-in followed by its list and a sub-rule that cannot stand alone preceded by its parent's lead-in sentence (REQ-239, REQ-240). |
| 9 | `CARD (looked up)` | Full metadata (name, mana cost, type line, power/toughness/loyalty when present, oracle text, etc.) for every card attached to a lookup question — one heading, one block per attached card, each followed by its WotC rulings (REQ-167, REQ-241, REQ-245). Lookup mode only. |
| 10 | `COMMANDER SPELLBOOK COMBO CONTEXT — COMMUNITY-SOURCED` | Community-sourced combo candidates matched against the submitted or attached cards, only when the question expresses explicit combo intent (DEC-116, REQ-094 amended by REQ-167). |
| 11 | `SCOPE` | One sentence naming which zones carry no cards or were not included, so the model doesn't assume unsubmitted state. Game mode only. |
| 12 | `CONVERSATION HISTORY` | Prior turns of the same conversation, included on a follow-up so the model treats the new question as a refinement rather than a fresh start. |
| 13 | `QUESTION` | The player's final, normalized question text — always the last section. |

## Presence matrix

Columns are the four paths REQ-169 names: In-Depth game mode (initial turn),
Quick Question with one or more cards attached, Quick Question with no card,
and a follow-up turn (either mode — the column that differs is exactly which
sections a follow-up adds).

| Section | Game mode | Lookup, cards attached | Lookup, no card | Follow-up |
| --- | --- | --- | --- | --- |
| `SYSTEM ROLE PREAMBLE` | present | present | present | present |
| `INSTRUCTIONS` | present (the shared list, 6 bullets, REQ-243) | present (the shared list + the REQ-168 off-domain line, 7 bullets) | present (same as with cards) | conditional — a game-mode follow-up adds one more bullet ("treat follow-up questions as refinements…"); a lookup follow-up's bullet set never changes |
| `MTG REFERENCE` | present (game-mode block) | present (lookup block) | present (lookup block) | present (the block for whichever mode the follow-up is in) |
| `GENERAL GAME CONTEXT` | present | absent | absent | conditional — present only when the follow-up is in game mode |
| `PHASE GUIDANCE` | present | conditional — present when the question names a turn step or an attached card's concept terms do (REQ-238) | conditional — present when the question names a turn step (REQ-238) | conditional — same rule as whichever mode the follow-up is in, with the steps named by the conversation's opening question (REQ-246) |
| `ZONE: <name>` | conditional — present when ≥1 zone has cards (always true for a valid game request); each card's WotC rulings, when it has any, follow its block at its first appearance (REQ-241) | absent | absent | conditional — present only on a game-mode follow-up with populated zones |
| `GAME RULES (reference)` | conditional — present when System 2 selects ≥1 topic from the game state, the cards' wording or the question (REQ-242); can be empty | conditional — present when the always-on core topic set renders; in practice always true (the core set is fixed and non-empty), plus the replacement-effect interaction topic when two or more attached cards carry replacement or prevention wording (REQ-220) | conditional — the always-on core set only (no cards, so the REQ-220 topic never fires) | conditional — same rule as whichever mode the follow-up is in, with the question-word triggers read from the conversation's opening question (REQ-246) |
| `ADDITIONAL RELEVANT RULE EXCERPTS` | conditional — present when System 3 retrieves ≥1 scoring rule; can be empty; up to two slots from per-card search (REQ-235) | conditional — present when System 3 retrieves ≥1 scoring rule (question + each attached card's name/type line/keywords/concept terms, plus per-card search and keyword sets, REQ-167, REQ-178, REQ-234, REQ-235); can be empty | conditional — present when System 3 retrieves ≥1 scoring rule from the question alone; can be empty | conditional — same rule as whichever mode, with the excerpts searched from the conversation's opening question, so they equal the opening request's (REQ-246) |
| `CARD (looked up)` | absent | present (REQ-167: one heading, one block per attached card, ≥1 always true on this path; each card's WotC rulings, when it has any, follow its block, REQ-241) | absent | conditional — present only on a lookup follow-up whose frozen card set is non-empty |
| `COMMANDER SPELLBOOK COMBO CONTEXT` | conditional — present only with explicit combo intent in the question and ≥1 relevant submitted card | conditional — present only with explicit combo intent and ≥1 attached card qualifying on any one card (REQ-094 amended by REQ-167) | absent (no cards to qualify) | conditional — same rule as whichever mode |
| `SCOPE` | present (always renders a sentence, even "(all zones included)") | absent | absent | conditional — present only when the follow-up is in game mode |
| `CONVERSATION HISTORY` | absent (initial turn) | absent (initial turn) | absent (initial turn) | present (this is what defines the path); could theoretically be empty if the full history were truncated away, but that has never been observed in practice |
| `QUESTION` | present | present | present | present |

## Verification

The matrix above was checked against `promptAssembly.ts`'s actual code (not
authored from memory) and against real `npm run prompt:preview` output for one
fixture per path, run 2026-10-12:

- Game mode — `combat-deathtouch`: confirmed order `SYSTEM ROLE PREAMBLE` →
  `INSTRUCTIONS` (the shared list) → `MTG REFERENCE` (game-mode block) → `GENERAL GAME CONTEXT` →
  `PHASE GUIDANCE` → `ZONE: BATTLEFIELD` → `GAME RULES (reference)` →
  `ADDITIONAL RELEVANT RULE EXCERPTS` → `SCOPE` → `QUESTION`.
- Follow-up (game mode) — `follow-up-chat`: same order as above, plus the
  follow-up `INSTRUCTIONS` bullet and a `CONVERSATION HISTORY` section between
  `SCOPE` and `QUESTION`.
- Lookup, cards attached — `quick-lookup-multi-card` (the slice A multi-card
  fixture, REQ-167): confirmed order `SYSTEM ROLE PREAMBLE` → `INSTRUCTIONS`
  (the shared list + the off-domain line) → `MTG REFERENCE` (lookup block) → `GAME RULES (reference)` →
  `ADDITIONAL RELEVANT RULE EXCERPTS` → `CARD (looked up)` (both attached
  cards under one heading, each followed by its rulings) → `QUESTION`.
- Lookup, no card — `quick-lookup-no-card`: same order with `CARD (looked
  up)` structurally absent.
- Lookup naming a turn step — `quick-lookup-multi-keyword-card` (the card's
  concept term names the combat damage step): `PHASE GUIDANCE` right after
  `MTG REFERENCE` (committed golden).
- `COMMANDER SPELLBOOK COMBO CONTEXT` position (after
  `ADDITIONAL RELEVANT RULE EXCERPTS` / `CARD`, before the next section) and
  rulings under each card were confirmed directly against the source and against
  the committed eval golden
  `commander-spellbook-lookup-multi-card-complete.prompt.golden.txt`.

### `npm run prompt:preview`

`npm run prompt:preview --fixture <id>` (or `npm run prompt:preview:all` for
the default set) spins up a real backend on an isolated port in mock mode,
posts a committed eval fixture's request to the real `/api/ask-ai` endpoint,
and writes one folder per fixture under `output/prompt-preview/<id>/`
(gitignored) containing:

- `production.prompt.txt` — the exact assembled prompt text, readable, no
  JSON.
- `request.json` — the request payload that was sent.
- `context.json` — the normalized `PromptInputContext` built from it.
- `diagnostics.json` — prompt-budget and section-size diagnostics.
- `enrichment.json` — the enrichment-debug sidecar (System 2/3 selection
  detail, rulings resolution detail).
- `meta.json` — the run's id, description, and pass/fail result.

Use it whenever this doc's shape needs a live check against real code, rather
than trusting the table above from memory.

## Where it lives

Assembly code: `apps/backend/src/prompt/promptAssembly.ts`
(`buildPromptText`, `buildLookupPromptText`), `promptFormatting.ts` (per-section
formatters), `mtgReference.ts` (the static reference block), `phaseGuidance.ts`.
Preview tool: `scripts/prompt-preview.mjs`. Cross-linked from
`PRD/sections/system-map/prompt-assembly.md`,
`PRD/sections/quick-lookup/README.md`, and `PRD/sections/in-depth/README.md`.
