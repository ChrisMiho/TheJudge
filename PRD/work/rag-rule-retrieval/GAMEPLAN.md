# Gameplan — rag-rule-retrieval

Sliced from `DESIGN-BRIEF.md` (five ordered build steps, REQ-177..181) and the
accepted proposal in `GATE-QUESTIONS.md` (24/24 `accept`, 0 edit, 0 reject).

## What a player gets, end to end

Ask AI's rules-question answers get grounded in the right Comprehensive Rules
excerpt more often — first because the tools that measure "right" stop
disagreeing with each other (Slice A), then because attaching cards stops
drowning the question in card text (Slice B), then because the searchable
rule corpus stops being one-seventh junk (Slice C), then because the keyword
signal comes from Scryfall instead of a stale hand list (Slice D), and
finally because the whole thing is ranked by meaning instead of shared rare
words (Slice E). No screen changes. No new endpoint. Each slice ships a
working, measured improvement on its own — nothing depends on Slice E landing
for A through D to be worth shipping.

## Architecture

- **Retrieval core:** `apps/backend/src/gameRulesRetrieval.ts` — query
  construction (`buildQueryParts`/`buildQueryTokens`), scoring
  (`scoreEntry`/lexical IDF), and the System 2 exclusion set.
- **Prompt assembly:** `apps/backend/src/prompt/preparation.ts`
  (`preparePromptInput`) and `apps/backend/src/prompt/context.ts`
  (`buildPromptContext`) — both already take an optional `cardDetailIndex`
  (REQ-176).
- **Eval / review parity:** `apps/backend/src/eval/contextEvaluationHarness.ts`
  (the gate, `test:eval`) and `apps/backend/src/eval/retrievalReportInputs.ts`
  + `scripts/retrieval-relevance-report.mjs` (the review aid,
  `retrieval:report`) — currently diverge because only the harness builds a
  `cardDetailIndex` (Slice A fixes this).
- **Build pipeline:** `scripts/build-game-rules.mjs` (rule index + token
  stats), `scripts/build-card-detail-by-oracle-id.mjs` /
  `scripts/build-card-metadata.mjs` (Scryfall card fields kept server-side vs.
  sent to the browser).
- **Provider seam pattern to mirror:** `apps/backend/src/providers/` —
  `askAiProvider.ts` (interface), `createAskAiProvider.ts` (switch on
  `config.askAiProvider`), `mockAskAiProvider.ts` — `EMBEDDING_PROVIDER`
  (Slice E) follows this exact shape.
- **Deploy budget guard:** `scripts/lambda-package-budget.test.mjs` —
  `NON_DATA_RESERVE` (currently 20 MB) must be re-measured once the bundled
  model lands in `node_modules` (Slice E).

## Data flow (end state, after Slice E)

Player question (+ attached cards) → route handler builds `PromptContext` →
if `EMBEDDING_PROVIDER` is not `mock`, the handler embeds the query in-process
and passes the vector into `preparePromptInput` as an option (so
`preparePromptInput` itself stays synchronous) → System 3 builds its query
from the question plus each card's compact signal (name, type line, keywords
— Slice B/D) → ranks the cleaned rule index (Slice C) by cosine similarity
against committed per-rule embeddings when a vector is present, or by lexical
IDF otherwise/on failure (Slice E) → merges the exact-rule-id/parent-rule-id
boost → excludes anything already in the System 2 set by rule-number prefix
(Slice C) → returns top 5.

## Slice sequence and why it is sequential

Default is parallel-ready; this package states an explicit blocker per
`DESIGN-BRIEF.md` material assumption 1: you cannot judge a retrieval change
on an instrument that disagrees with itself (A before all), the query-flood
fix must be measured independent of the scorer (B before E), embedding a
corpus with 147 duplicate entries embeds the duplicates (C before E), and the
keyword signal B's compact query needs is the field D adds (D before E's
final gate). So: **A → B → C → D → E, strictly sequential.**

| Slice | Step / REQ | Title | Depends on |
| --- | --- | --- | --- |
| A | Step 1 / REQ-177 | Make the recall ruler trustworthy | none |
| B | Step 2 / REQ-178 | Stop drowning the question in card text | A |
| C | Step 3 / REQ-179 | Clean the junk out of the rule index | A, B |
| D | Step 4 / REQ-180 | Use the keyword list Scryfall already gives us | A, B, C |
| E | Step 5 / REQ-181 | Pick rules by meaning, not word overlap | A, B, C, D |

## PRD/sections/ amendment ownership per slice

Each slice applies its step's accepted amendments from `GATE-QUESTIONS.md` by
intent against current live text — never a second copy of the diff
maintained here. Where one stable ID's accepted diff bundles more than one
step's concern (REQ-022, REQ-032, and several bundled paragraphs in
`system-map/prompt-layout-spec.md` and `quick-lookup/README.md`), the earlier
slice lands its own portion and a later slice finishes the location to match
the full accepted text — read `DESIGN-BRIEF.md`'s "Amendment set" section
first for the per-step grouping, then `GATE-QUESTIONS.md`'s block for the
exact accepted wording. Ownership by slice:

- **Slice A:** new `REQ-177` entry; the report/harness-parity portion of
  `REQ-032`; `system-map.md`'s "Retrieval relevance report" block; the two
  dangling-citation repoints (`REQ-168` note, `NFR-018` note) — these aren't
  gated by any step, so the first slice clears them.
- **Slice B:** new `REQ-178` entry; `REQ-074`; `REQ-167`; the
  query-construction portions of `quick-lookup/README.md`,
  `system-map/prompt-layout-spec.md`, `system-map/game-rules-retrieval.md`;
  `user-flows.md` (:252, :517).
- **Slice C:** new `REQ-179` entry only — no other live file asserts the
  index-hygiene detail directly (the prefix-dedup language lands inside
  `REQ-022`'s Slice E edit).
- **Slice D:** new `REQ-180` entry; `open-questions.md` Q-001 answered;
  `integrations-and-data.md` Card Data Strategy (keywords bullet).
- **Slice E:** new `REQ-181` entry with `SCOPE-A`..`SCOPE-D` merged into its
  Constraints; the semantic-eval portion of `REQ-032`; the full `REQ-022`
  diff; `non-functional-requirements.md` `NFR-017`; `system-map.md`'s
  "Supplemental retrieval (System 3)" block; the remaining paragraphs of
  `system-map/game-rules-retrieval.md`; `in-depth/README.md`;
  `integrations-and-data.md` Tech Stack + Game Rules Data Strategy +
  prompt-contents line; finishes `quick-lookup/README.md` and
  `system-map/prompt-layout-spec.md` to their final accepted text.

Not amended by any slice (per `DESIGN-BRIEF.md`, confirmed still true):
`screen-layout.md`, `system-map/lookup-phrasing-glossary.md`,
`system-map/prompt-assembly.md`, `goals-and-non-goals.md`,
`technical-design-rules.md`.

## Verification checklist (whole package)

- [ ] `npm --workspace apps/backend run test:eval` green after every slice
- [ ] `npm run quality:check` green after every slice
- [ ] `npm run retrieval:report` and `test:eval` agree on all labelled
      scenarios from Slice A onward
- [ ] `node --test scripts/lambda-package-budget.test.mjs` green after Slice E
- [ ] Every amended stable ID's live text matches its accepted
      `GATE-QUESTIONS.md` `Proposed:` block once its owning slice lands
- [ ] No user-visible change at any point (no screen, no new endpoint)

## Material assumptions carried from DESIGN-BRIEF into slicing

These were already resolved at `define`/`gate-qc` under the conservative
assumption ladder; recorded here only where they shape a slice boundary or an
acceptance criterion:

1. Five steps, one per slice, strictly sequential — dependency-forced, not
   preference (see table above).
2. `REQ-177`..`REQ-181` are the live next-free ids; no new `FLOW-###` or
   `DEC-###`.
3. Every numeric gate is relative or re-measured, never derived by
   proportion (Slice B's gap gate, Slices C/D's no-regression gates, Slice
   E's re-measurement against the full-precision baseline, and Slice E's
   NFR-017 reserve re-measured against the real packaged footprint rather
   than the ~23 MB intake estimate).
4. `EMBEDDING_PROVIDER` values `mock` | `local` | `openai`, default `mock`,
   mirroring `ASK_AI_PROVIDER` exactly (Slice E). The wire spelling is an
   implementation choice; the mock-default behavior is fixed.
5. The embeddings artifact sits beside the rule index in
   `apps/backend/data/`, following `build-game-rules.mjs`'s existing
   dual-output convention (Slice E). Exact filename is an implementation
   choice.
6. The dangling-citation repoints (`REQ-168`, `NFR-018`) are not gated by any
   step's measurement work; Slice A clears them since it lands first and
   nothing depends on them landing later.

## Next step

`/thejudge-implement PRD/work/rag-rule-retrieval/ slice A` (Claude Code) or
`$thejudge-implement PRD/work/rag-rule-retrieval/ slice A` (Codex). For one
unattended agent completing every slice in sequence, use
`/thejudge-implement-all PRD/work/rag-rule-retrieval/`.
