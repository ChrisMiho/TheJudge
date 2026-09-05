# Prompt layout spec

Backed by: DEC-025, DEC-042, REQ-169, DEC-107, REQ-074

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
| 1 | `SYSTEM ROLE PREAMBLE` | Fixed lines that set the assistant's persona, scope, and ground rules (e.g. never invent hidden state) — identical text on every path. |
| 2 | `INSTRUCTIONS` | A short bulleted list of behavioral rules for the answer; the exact bullets differ by path (see matrix). |
| 3 | `MTG REFERENCE` | The static, fixed `MTG_PROMPT_REFERENCE` block — core Magic background (turn structure, zones, the layer system) — identical text on every path. |
| 4 | `GENERAL GAME CONTEXT` | The submitted game state's shared facts: player count, life totals, turn phase, active player. Game mode only. |
| 5 | `PHASE GUIDANCE` | A short note on what's relevant to check during the current turn phase / combat step. Game mode only. |
| 6 | `ZONE: <name>` (one heading per populated zone) | The ordered stack (bottom to top) plus any other zone with cards, each card's full metadata. Game mode only. |
| 7 | `GAME RULES (reference)` | Curated core-rules excerpts (System 2) — state-gated by submitted zones/cards in game mode, a fixed always-on set in lookup mode. |
| 8 | `ADDITIONAL RELEVANT RULE EXCERPTS` | Supplemental rule excerpts (System 3) retrieved by keyword-scoring the question plus, in lookup mode, each attached card's name, type line, and keywords — not its full oracle text (REQ-167, REQ-178). |
| 9 | `CARD (looked up)` | Full metadata (name, mana cost, type line, oracle text, etc.) for every card attached to a lookup question — one heading, one block per attached card, up to 5 (REQ-167). Lookup mode only. |
| 10 | `OFFICIAL RULINGS (WotC reference)` | Published Oracle rulings (System 1) for the submitted cards (game mode) or every attached card (lookup mode, REQ-167). |
| 11 | `COMMANDER SPELLBOOK COMBO CONTEXT — COMMUNITY-SOURCED` | Community-sourced combo candidates matched against the submitted or attached cards, only when the question expresses explicit combo intent (DEC-116, REQ-094 amended by REQ-167). |
| 12 | `SCOPE` | One sentence naming which zones carry no cards or were not included, so the model doesn't assume unsubmitted state. Game mode only. |
| 13 | `CONVERSATION HISTORY` | Prior turns of the same conversation, included on a follow-up so the model treats the new question as a refinement rather than a fresh start. |
| 14 | `QUESTION` | The player's final, normalized question text — always the last section. |

## Presence matrix

Columns are the four paths REQ-169 names: In-Depth game mode (initial turn),
Quick Question with one or more cards attached, Quick Question with no card,
and a follow-up turn (either mode — the column that differs is exactly which
sections a follow-up adds).

| Section | Game mode | Lookup, cards attached | Lookup, no card | Follow-up |
| --- | --- | --- | --- | --- |
| `SYSTEM ROLE PREAMBLE` | present | present | present | present |
| `INSTRUCTIONS` | present (3 base bullets) | present (5 fixed bullets: base 3 + verbatim-fidelity + REQ-168 guardrail) | present (same 5 fixed bullets) | conditional — a game-mode follow-up adds one more bullet ("treat follow-up questions as refinements…"); a lookup follow-up's bullet set never changes |
| `MTG REFERENCE` | present | present | present | present |
| `GENERAL GAME CONTEXT` | present | absent | absent | conditional — present only when the follow-up is in game mode |
| `PHASE GUIDANCE` | present | absent | absent | conditional — present only when the follow-up is in game mode |
| `ZONE: <name>` | conditional — present when ≥1 zone has cards (always true for a valid game request) | absent | absent | conditional — present only on a game-mode follow-up with populated zones |
| `GAME RULES (reference)` | conditional — present when System 2 selects ≥1 topic from the submitted zones/cards; can be empty | conditional — present when the always-on core topic set renders; in practice always true (the set is fixed and non-empty) | conditional — same always-on set as lookup with cards | conditional — same rule as whichever mode the follow-up is in |
| `ADDITIONAL RELEVANT RULE EXCERPTS` | conditional — present when System 3 retrieves ≥1 scoring rule; can be empty | conditional — present when System 3 retrieves ≥1 scoring rule (question + each attached card's name/type line/keywords, REQ-167, REQ-178); can be empty | conditional — present when System 3 retrieves ≥1 scoring rule from the question alone; can be empty | conditional — same rule as whichever mode |
| `CARD (looked up)` | absent | present (REQ-167: one heading, one block per attached card, ≥1 always true on this path) | absent | conditional — present only on a lookup follow-up whose frozen card set is non-empty |
| `OFFICIAL RULINGS (WotC reference)` | conditional — present when ≥1 submitted card has a matching published ruling | conditional — present when ≥1 attached card has a matching published ruling (gated first on ≥1 card attached, REQ-167) | absent (no cards to have rulings) | conditional — same rule as whichever mode, applied to that mode's frozen card/zone set |
| `COMMANDER SPELLBOOK COMBO CONTEXT` | conditional — present only with explicit combo intent in the question and ≥1 relevant submitted card | conditional — present only with explicit combo intent and ≥1 attached card qualifying on any one card (REQ-094 amended by REQ-167) | absent (no cards to qualify) | conditional — same rule as whichever mode |
| `SCOPE` | present (always renders a sentence, even "(all zones included)") | absent | absent | conditional — present only when the follow-up is in game mode |
| `CONVERSATION HISTORY` | absent (initial turn) | absent (initial turn) | absent (initial turn) | present (this is what defines the path); could theoretically be empty if the full history were truncated away, but that has never been observed in practice |
| `QUESTION` | present | present | present | present |

## Verification

The matrix above was checked against `promptAssembly.ts`'s actual code (not
authored from memory) and against real `npm run prompt:preview` output for one
fixture per path, run 2026-08-30:

- Game mode — `combat-deathtouch`: confirmed order `SYSTEM ROLE PREAMBLE` →
  `INSTRUCTIONS` (3 bullets) → `MTG REFERENCE` → `GENERAL GAME CONTEXT` →
  `PHASE GUIDANCE` → `ZONE: BATTLEFIELD` → `GAME RULES (reference)` →
  `ADDITIONAL RELEVANT RULE EXCERPTS` → `SCOPE` → `QUESTION`.
- Follow-up (game mode) — `follow-up-chat`: same order as above, plus the
  4th `INSTRUCTIONS` bullet and a `CONVERSATION HISTORY` section between
  `SCOPE` and `QUESTION`.
- Lookup, cards attached — `quick-lookup-multi-card` (the slice A multi-card
  fixture, REQ-167): confirmed order `SYSTEM ROLE PREAMBLE` → `INSTRUCTIONS`
  (5 bullets) → `MTG REFERENCE` → `GAME RULES (reference)` →
  `ADDITIONAL RELEVANT RULE EXCERPTS` → `CARD (looked up)` (both attached
  cards under one heading) → `QUESTION`.
- Lookup, no card — `quick-lookup-no-card`: same order with `CARD (looked
  up)` structurally absent.
- `COMMANDER SPELLBOOK COMBO CONTEXT` and `OFFICIAL RULINGS` position (after
  `ADDITIONAL RELEVANT RULE EXCERPTS` / `CARD`, before the next section) were
  confirmed directly against the source and against the committed eval golden
  `commander-spellbook-lookup-multi-card-complete.prompt.golden.txt`, since no
  representative `prompt:preview` fixture in the committed set carries both a
  live ruling match and combo intent together.

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
