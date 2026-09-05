# Findings: data pipeline and artifact shapes

Scope: what each committed data artifact keeps, drops, and how it is chunked or
filtered before it reaches the player's prompt. All paths are relative to the repo
root. Numbers were measured on the committed artifacts on 2026-09-01 by a
read-only subagent; the three headline defects were re-verified inline (see
`PROBE.md`).

## 1. Artifact inventory

| Artifact | Size | Entries | Produced by | Consumed by | Load point |
|---|---|---|---|---|---|
| `apps/backend/data/gameRulesRuleIndex.json` | 2.25 MB | 3,432 rule entries | `scripts/build-game-rules.mjs:332` (`parseRuleIndex`) | System 3 lexical retrieval | `apps/backend/src/runtime/createConfiguredApp.ts:26-27`, cached in `apps/backend/src/gameRulesRetrieval.ts:54` |
| `apps/backend/data/gameRulesTokenStats.json` | 256 KB | N=3,432; 9,260 tokens | `scripts/build-game-rules.mjs:46-59` | IDF weights for System 3 | `apps/backend/src/gameRulesRetrieval.ts:163` |
| `apps/backend/data/gameRulesByTopic.json` | 25.8 KB | 23 topics, 21,962 excerpt chars | `scripts/build-game-rules.mjs:196-243` from `gameRulesTopicManifest.json` | System 2 curated section | `createConfiguredApp.ts:24` |
| `apps/backend/data/gameRulesTopicManifest.json` | 3 KB | 23 `{id,title,ruleNumbers}` | hand-curated | build script only | `scripts/build-game-rules.mjs:6` |
| `apps/backend/data/gameRulesKeywordVocabulary.json` | 328 B | 20 tokens | hand-curated | 6x keyword boost in System 3 | `apps/backend/src/gameRulesRetrieval.ts:164` |
| `apps/backend/data/cardRulingsByOracleId.json` | 19.5 MB | 19,542 oracle IDs, 76,605 rulings | `scripts/build-card-rulings.mjs` | System 1 official rulings | `createConfiguredApp.ts:22` |
| `apps/frontend/public/data/cardMetadata.json` | 16.4 MB | 33,399 cards | `scripts/build-card-metadata.mjs` | frontend card picker; card fields travel to backend in the request | `apps/frontend/src/components/portal/MtgAssistantApp.tsx:52`, `quick-lookup/QuickLookupApp.tsx:33` |
| `apps/frontend/public/data/gameRulesCoreTopics.json` | 6.4 KB | 6 topics | `scripts/build-game-rules.mjs:250-271` | frontend Quick Lookup browse only (not the prompt) | `QuickLookupApp.tsx:34` |

The CR source (`apps/backend/data/cr/source.txt`) is not committed; the build
preserves the existing artifacts when it is absent (`build-game-rules.mjs:310-313`).
The backend never reads `cardMetadata.json`; card fields reach it only through the
request body (`apps/backend/src/validation/askAiRequest.ts:90-101`).

## 2. Comprehensive Rules index (System 3 corpus)

**Chunk unit.** One entry per numbered rule header, at every depth: section
(`100`), rule (`100.1`), and lettered sub-rule (`100.1a`). The header regex is
`^(\d{3}(?:\.\d+)*(?:[a-z])?)(?:\. | (?=\S))` (`build-game-rules.mjs:149`). Each
entry's `text` runs from its header to the next header of any depth
(`build-game-rules.mjs:161-162`). Breakdown: 294 section-level, 1,165 rule-level,
1,973 lettered sub-rules.

**Fields per entry** (`build-game-rules.mjs:174`): `ruleId`, `sectionTitle`,
`text`, `searchText`, `parentRuleIds`.
- `sectionTitle` is the most recent `NNN. Title` heading seen while scanning
  (`build-game-rules.mjs:164-169`); 139 distinct titles.
- `parentRuleIds` strips the letter, then pops dotted segments
  (`build-game-rules.mjs:122-134`): `702.19b` -> `["702.19", "702"]`.
- `searchText` = `ruleId + " " + sectionTitle + " " + text`, lowercased
  (`build-game-rules.mjs:172`). It is the only thing the scorer tokenizes
  (`gameRulesRetrieval.ts:313`). Median 28 tokens, p90 68.
- Token stats: document frequency per token across `searchText`, deduped per
  entry, with the same tokenizer and 19-word stopword list as the scorer
  (`build-game-rules.mjs:26-38`, mirrored at `gameRulesRetrieval.ts:188-199`).

**What is dropped.** Everything after the last line matching `^Glossary$`
(glossary and credits, `build-game-rules.mjs:139-146`) and any text before the
first `100.` header. Nothing else is filtered.

**What is not dropped but should be: the table of contents.** The CR text opens
with a TOC that lists every section heading. The parser has no TOC guard, so the
first 148 entries (index 0-147, all before `100.1`) are TOC lines, and 147 rule IDs
appear twice (e.g. `100`, `101`, ... each once from the TOC and once from the body).
These duplicates inflate `N` and the heading-token document frequencies.

**Distribution of `text` length** (chars): min 9, p50 188, p90 481, max 2,827
(`205.3m`, the creature-type list). 626 entries are under 60 chars; 919 under 100.
Total 822,744 chars. 18 entries exceed 1,500 chars; 61 exceed 1,000.

**Heading-only entries.** 293 entries match `^\d{3}\. [A-Z]` with length < 60
(TOC copies plus body section headings such as `105. Colors`). Inside section 702
(Keyword Abilities), 192 of the 759 entries are name-only heads like
`702.19. Trample` -- the definition lives in `702.19a`/`702.19b`, which are separate
entries. A further 333 body sub-rules are under 60 chars (e.g. `104.2b An effect may
state that a player wins the game.`).

**Examples.** `Example:` lines are not headers, so they stay fused to the rule they
follow. 215 entries contain at least one example; 44 contain more than one. They are
never split into their own chunk and never stripped, so the example text is scored
and shipped verbatim in the prompt with the rule.

**Section distribution** (entries per hundred): 1xx 551, 2xx 148, 3xx 195, 4xx 96,
5xx 178, 6xx 353, 7xx 1,573, 8xx 195, 9xx 143. Section 7 (keyword abilities and
effects) is 46% of the index.

**Retrieval shape today** (`gameRulesRetrieval.ts`): query = question tokens (3x)
plus every submitted card's name, type line, oracle text, context notes, the zone
ids, and the turn phase (`:220-246`); scoring is set-membership IDF with a 6x boost
for the 20 vocabulary keywords (`:292-327`); top 5 selected (`:392`); entries whose
exact `ruleId` is in a selected curated topic are excluded (`:343`), but their
sub-rules are not (curating `603.1` excludes `603.1` only, not `603.1a`).

**Chunking problems for embedding.**
1. TOC duplicates: 148 junk chunks that will embed almost identically to their body
   twins and win ties on short queries.
2. Name-only chunks: 192 keyword heads (`702.19. Trample`) and 146 body section
   headings carry no rule content; an embedding of "Trample" alone is a magnet for
   any trample question while the actual text sits in the sibling chunk.
3. Sub-rule fragmentation: 1,973 lettered sub-rules are chunked without their parent
   sentence. `702.19b` reads "The controller of an attacking creature with trample
   first assigns damage..." with no mention of what trample is unless the parent
   `702.19a` co-retrieves. Parent context is available only as the `parentRuleIds`
   pointer, not as text.
4. Oversized chunks: the 18 entries over 1,500 chars (`205.3m` at 2,827, subtype
   lists) will dominate token budgets if retrieved and embed as noise.
5. Examples fused: a rule plus two examples embeds as a blend; the example-heavy
   entries (44 with multiple) lose the crisp rule statement in the vector.

## 3. Curated topics (System 2)

**Selection in plain words** (`apps/backend/src/gameRulesTopicSelection.ts`): the
backend looks only at three card-agnostic signals -- is the stack non-empty, is the
battlefield non-empty, and what phase/combat step is it. It never reads card names,
oracle text, or the question (`:4-10`). Lookup mode (Quick Lookup) skips the signals
and sends the always-on set only (`apps/backend/src/prompt/preparation.ts:158-160`).

**Always-on set** (`gameRulesTopicSelection.ts:13-18`), 4 topics, 3,824 chars:
`stack-and-priority` 1,268 (117.1, 117.3, 117.4, 117.7, 405.1, 405.2),
`targets-basics` 861 (115.1, 115.2, 115.10), `zones-basics` 892 (400.1, 400.2,
400.7), `abilities-trigger-basics` 803 (603.1, 603.2, 603.3).

**Conditional buckets.**
| Trigger | Topics | Chars |
|---|---|---|
| stack non-empty (`:21-27`, `:105`) | spell-casting-choices, spell-casting-costs, effects-resolution-targets, copying-spells-abilities, effects-source-impossible | 7,621 |
| battlefield non-empty (`:30-37`, `:109`) | replacement-effects-basics, replacement-etb-effects, layers-order, layers-power-toughness, layers-timestamps-dependencies, abilities-zone-change-triggers | 5,234 |
| `turnPhase === "combat"` and combatStep declare_attackers / declare_blockers / combat_damage (`:74-88`) | combat-phase-structure + the step's topic(s) | 1,074 / 1,251 / 3,296 |
| `turnPhase === "combat"` with no or other combatStep (`:85-86`) | all 7 combat topics | 4,511 |
| turnPhase in upkeep/draw/end_step/cleanup (`:60-62`, `:117`) | abilities-delayed-triggers | 772 |

A typical board question (stack + battlefield populated, main phase) ships
3,824 + 7,621 + 5,234 = 16,679 chars of curated CR text; the full 23-topic corpus is
21,962 chars. Formatting is title + excerpt joined by blank lines under a one-line
disclaimer (`apps/backend/src/gameRules.ts:61-72`); rule numbers are inside the
excerpt text, not in a label.

**Excerpt construction** (`build-game-rules.mjs:107-120`): each manifest rule number
is cut from its header to the next header of any depth, so `603.1` yields the one
paragraph, not `603.1a`+. Excerpts are joined with `\n` (`:238`). If any rule number
goes missing from a new CR, the prior excerpt is preserved wholesale (`:214-225`).

**What the always-on set contains that a typical question does not need.** A
"does my Lightning Bolt kill this creature" question receives zone definitions
(400.1, 400.2, 400.7), the definition of a target (115.1), and how triggers are
defined (603.1-603.3) regardless. `stack-and-priority` includes 405.1/405.2 (what
the stack is) even in lookup mode where there is no stack. Nothing in the
always-on set is keyed to what the cards do. The frontend browse set
(`gameRulesCoreTopics.json`) is deliberately the always-on 4 plus
`combat-phase-structure` and `layers-order` (`build-game-rules.mjs:15-22`; guarded by
`apps/frontend/src/lib/gameRulesBuildPolicy.test.ts:44`).

## 4. Card rulings (System 1)

**Build filter** (`scripts/build-card-rulings.mjs`): keep only `source === "wotc"`
(`:38`); require `oracle_id` (`:44-48`) and a non-empty whitespace-collapsed
`comment` (`:50-54`); drop rulings for oracle IDs not in `cardMetadata.json`
(`:56-59`). Kept per ruling: `publishedAt` and `comment` only (`:66`). No
deduplication of identical comments. Sort within a card: newest `publishedAt`
first, then comment alphabetically (`:75-79`).

**Prompt selection** (`apps/backend/src/cardRulings.ts`): cards are gathered stack
first, then battlefield, hand, graveyard, exile, library, command (`:112-125`); each
card's list is `slice(0, maxRulingsPerCard)` (`:168`), i.e. the newest N since the
artifact is already newest-first. Comments are truncated at `maxCommentChars`
(`:170`) and a section cap trims the last card to one truncated ruling then stops
(`:175-194`). Rendered as `- YYYY-MM-DD: comment` under the card name
(`promptFormatting.ts:256-260`).

**Limits** (`apps/backend/src/prompt/normalization.ts:3-13`):
`MAX_RULINGS_PER_CARD` = 100, `MAX_RULING_COMMENT_CHARS` = 100,000,
`MAX_RULINGS_SECTION_CHARS` = 1,000,000, `MAX_CONVERSATION_HISTORY_CHARS` = 1,000,000,
`MAX_ORACLE_TEXT_CHARS` = 100,000, `MAX_PROMPT_CHAR_BUDGET` = 1,000,000.

**Distributions.** Rulings per card: p50 3, p90 9, p99 16, max 32. Comment length:
p50 180, p90 330, p99 531, max 1,564, mean 201. Rendered chars per card: p50 536,
p90 2,027, max 8,873. Oracle IDs with more than 100 rulings: 0 -- the per-card cap
never binds, and neither does the comment or section cap. Every ruling a card has
is shipped, in date order. 0 rulings with a missing date. 19,542 of 33,399 cards
(58%) have at least one ruling. 15,226 of the rulings are dated 2024 (Scryfall
re-dated many on Oracle updates), so "newest first" is not a relevance signal.

**Ordering favors newest, never most relevant.** No ruling is scored against the
question or the other cards on the board. When two cards each carry 20+ rulings,
all 40+ ship.

## 5. Card fields

Scryfall field -> `cardMetadata.json` -> accepted by request schema -> rendered in prompt.

| Scryfall field | In cardMetadata.json | Request schema (`askAiRequest.ts:90-101`) | Rendered (`promptFormatting.ts:192-204`) |
|---|---|---|---|
| `oracle_id` -> `cardId` | yes (`build-card-metadata.mjs:235`, falls back to `id`) | yes, max 120 | no (used as rulings key) |
| `name` | yes | yes, max 120 | yes |
| `oracle_text` -> `oracleText` | yes; faces joined `\n//\n` (`:37-53`) | yes, max 2,000 | yes; empty prints `(none) — no oracle text recorded` |
| `image_uris` -> `imageUrl` | yes | yes, max 500 | no (sent on the wire, dropped at render) |
| `mana_cost` -> `manaCost` | yes; faces joined ` // ` (`:65-81`) | yes, max 40 | yes; `(none)` when empty |
| `cmc` -> `manaValue` | yes (`:83-88`) | yes, 0-20 | yes |
| `type_line` -> `typeLine` | yes; faces joined ` // ` (`:90-106`) | yes, max 200 | yes |
| `colors` | yes, WUBRG-sorted (`:108-121`) | yes, max 5 | yes; `(none)` |
| supertypes (parsed from type line) | yes (`:123-145`) | yes, max 8 | yes; `(none)` |
| subtypes (parsed from type line) | yes (`:123-145`) | yes, max 12 | yes; `(none)` |
| `keywords` | **dropped** | no field | no |
| `power` / `toughness` | **dropped** | no field | no |
| `loyalty` / `defense` | **dropped** | no field | no |
| `produced_mana` | **dropped** | no field | no |
| `color_identity` | **dropped** | no field | no |
| `legalities` | **dropped** | no field | no |
| `layout` (split/transform/adventure/mdfc) | **dropped** | no field | no |
| `card_faces[].name` | **dropped** (only texts joined) | no field | no |
| `rulings_uri`, `set`, `released_at` | dropped (release date used only for printing choice, `:197-199`) | no | no |

The frontend forwards the metadata entry field-for-field
(`apps/frontend/src/lib/zoneCards.ts:23-37` game mode,
`apps/frontend/src/lib/contextFlow/flow.ts:146-157` lookup mode), so the request
carries exactly the 10 metadata fields and nothing more. `CardMetadataItem` is the
same 10-field shape (`apps/frontend/src/types.ts:11-22`).

**Card set filter** (`build-card-metadata.mjs:147-153`): English, paper, non-digital.
One entry per name; the printing with oracle text + image + oracle id wins, then
standard frame, then newest (`:207-228`).

**Defects found while measuring.**
- Vanilla creatures are absent. `finalizeTransformState` drops any card whose
  `oracleText` is empty (`build-card-metadata.mjs:282-285`). Grizzly Bears, Savannah
  Lions and Hill Giant are not in the 33,399. Basic lands survive only because
  Scryfall gives them reminder text.
- Multi-face type lines are mis-parsed. `parseTypeLine` splits on the first `—`
  and keeps only two halves (`build-card-metadata.mjs:129`), so
  `Creature — Human Wizard // Creature — Human Insect` yields
  `subtypes: ["Human","Wizard","//","Creature"]` and the back face's subtypes are
  lost. 705 of the 972 multi-face cards carry `//` inside `subtypes`; 697 carry a
  card type (`Creature`, `Legendary`) as a subtype. That is what the prompt prints.
- Multi-face oracle text loses face names: the prompt shows
  `text-A // text-B` with no label saying which face is which
  (`build-card-metadata.mjs:48`, then whitespace-collapsed by `context.ts:128`).
- Schema rejects three cards outright: one oracle text over 2,000 chars
  (`Magic and Minions`, 2,151) and two mana costs over 40 chars
  (`Oakhame Ranger // Bring Back` 44, `Who // What // When // Where // Why` 46).
  The frontend will 400 on those (`askAiRequest.ts:93,95`).
- Keywords are absent even though Scryfall ships a clean `keywords` array per card;
  the backend reconstructs keyword intent by tokenizing oracle text against a
  20-word vocabulary (`gameRulesKeywordVocabulary.json`, `gameRulesRetrieval.ts:270-278`).
- Power/toughness and loyalty are absent, so "does 3 damage kill it" questions
  depend on the player typing the toughness into `contextNotes`.

## 6. Data-shape levers (ranked)

1. **Strip the TOC and heading-only chunks from the rule index.** Skip headers
   before the first `100.1` and drop entries whose `text` equals its own heading
   (`build-game-rules.mjs:149-175`). Removes 148 duplicates + ~340 empty heads
   (~14% of entries) that can only ever win by accident. Independent of RAG;
   improves lexical IDF today (`N` and heading-token `df` shrink). Zero prompt
   cost; index shrinks slightly.
2. **Re-chunk 702 keyword abilities as one chunk per keyword.** Fold `702.N` +
   `702.Na..z` into a single entry whose text is the keyword name plus its
   sub-rules (`build-game-rules.mjs:156-177`, keyed off `parentRuleIds`). Gives
   embeddings a self-contained "what trample is and how it assigns damage"
   document. Mostly for RAG; for lexical it reduces 759 entries to ~192 so one hit
   returns the whole definition. Retrieved-chunk size grows from ~200 to ~800 chars
   per keyword.
3. **Prefix each sub-rule chunk with its parent rule sentence for embedding**
   (or embed `parent text + own text` while shipping only own text). Addresses the
   1,973 orphan lettered sub-rules. RAG-only; no prompt cost if the prompt still
   prints the child alone.
4. **Add `keywords`, `power`, `toughness`, `loyalty` to cardMetadata and the
   request schema.** `build-card-metadata.mjs:230-246`, `askAiRequest.ts:90-101`,
   `promptFormatting.ts:192-204`. Keywords let System 2/3 select by what the card
   does instead of by zone occupancy; P/T removes the largest class of "state
   assumptions" in damage questions. Independent of RAG. Cost: ~30 bytes per card
   on the wire, one or two prompt lines per card. Drop `imageUrl` from the wire in
   the same change; it costs up to 500 chars per card and is never rendered.
5. **Fix multi-face handling in the build.** Parse `card_faces` individually for
   type line and subtypes (`build-card-metadata.mjs:123-145`), and label faces in
   oracle text (`Front — Delver of Secrets: ... // Back — Insectile Aberration: ...`,
   `:37-53`). 972 cards currently ship a corrupt subtype list. Independent of RAG.
6. **Stop dropping vanilla creatures.** Emit `oracleText: ""` and let the prompt's
   existing `(none)` branch handle it (`build-card-metadata.mjs:282-285`). Ships
   together with lever 4 so the prompt still has P/T for those cards.
7. **Rank rulings against the question instead of by date, and cap at a small N.**
   Today every ruling ships (cap 100 never binds; p90 card = 2,027 chars, max
   8,873). Score each `comment` against question + other cards' names
   (lexically now, by embedding later) and keep the top 5 (`cardRulings.ts:168`,
   `normalization.ts:10`). Cuts the rulings section by ~60% on ruling-heavy boards
   with no loss when a card has 5 or fewer. Independent of RAG but improves with it.
8. **Make System 2 keyword-aware or shrink the always-on set.** With keywords on the
   wire (lever 4), add buckets keyed on card keywords (e.g. any card with
   `Trample`/`Deathtouch` pulls `damage-lifelink-deathtouch`) and demote
   `zones-basics`/`targets-basics` from always-on to conditional
   (`gameRulesTopicSelection.ts:13-18`). Saves 1,753 chars per prompt on the common
   case. Independent of RAG. Longer term, RAG over the full index makes the curated
   layer a fallback rather than the primary path.
9. **Split fused examples into a separate `examples` field** in the index
   (`build-game-rules.mjs:162`), embed the rule text alone, and print examples only
   when the rule is selected. RAG-only benefit; keeps the 215 example-bearing rules
   crisp in vector space while preserving the examples for the model.
10. **Exclude curated sub-rules from System 3 by prefix, not exact id**
    (`gameRulesRetrieval.ts:343`). Small; prevents `603.1a` re-appearing under
    "additional excerpts" when `603.1` is already curated. Independent of RAG.
