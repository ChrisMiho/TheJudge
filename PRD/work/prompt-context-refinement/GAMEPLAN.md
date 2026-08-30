status: active

# Gameplan — prompt-context-refinement

## What ships

Quick Question stops guessing. Today a player can attach one card, and asking
about any other card is a gamble — the model only reliably knows the one
attached card. This ships a bounded 5-card list instead: every attached card
gets full metadata and WotC rulings, rules retrieval scores the question plus
every card, and "how do these cards combo" explains a complete combo or names
the missing piece for a partial one. Separately, the "combo" guardrail
over-refusal gets fixed with a maintained glossary of valid Magic phrasing, a
readable doc explains what's actually in the backend prompt on each path, and
a committed set of real hard rules questions (with sources documented) starts
validating prompt quality against real cases.

Four independent product changes, landing in five reviewable slices.

## Architecture / data flow

**Multi-card lookup (slices A, B)** — one `POST /api/ask-ai` endpoint, one
`mode: "lookup"` branch, no new endpoint or mode:

1. `askAiRequest.ts` — the lookup branch's `card: lookupCardReferenceSchema.optional()`
   becomes a bounded array (`cards`, max 5) on the same `lookupCardReferenceSchema`
   shape (no zone/owner/caster/targets/context-notes fields).
2. `context.ts` — `buildLookupPromptContext` normalizes the array;
   `LookupPromptContext.card?: LookupPromptCard` (`types/index.ts`) becomes
   `cards?: LookupPromptCard[]`.
3. `preparation.ts` — `prepareLookupPromptInput` loops the card set for
   rulings (`cardsForRulings`), the System 3 query (`buildQueryTokensFromParts`
   over every card's oracle text + type line), and
   `resolveLookupComboCandidates` builds one `ComboMatchInstance` per attached
   card (today: one or zero).
4. `commanderSpellbook/matcher.ts` — `selectComboCandidates` already takes a
   list of `instances`; the lookup-mode qualify/rank rule changes from
   "the one attached card must match" to "qualify on any one attached card,
   rank by attached-card coverage" (REQ-094, amended). Complete/partial
   classification for a board-less mode is new: complete when every ingredient
   slot is filled somewhere in the attached set, partial when it qualifies but
   a slot is unmatched — REQ-094's zone/quantity checks don't apply here.
5. `commanderSpellbook/formatting.ts` — REQ-095's present/missing rendering
   already covers lookup (zone-specific rows are empty); it needs no new
   branch, just verification against the new complete/partial classification.
6. Frontend `quick-lookup/QuickLookupApp.tsx` — one selected card becomes a
   capped list; add/preview/remove per card; cap enforced and stated. Wiring
   through `lib/contextFlow/flow.ts` (`buildLookupAskAiRequest`),
   `hooks/useAskAiSubmitOrchestration.ts` (`FrozenAskAiContext` `kind: "lookup"`)
   changes `card` to `cards` end to end, including the frozen-context replay
   used to rebuild follow-up requests.
7. `screen-layout.md`'s "Quick Question — pre-submit" row currently records a
   measured single-card image cap; it gets re-measured for the multi-card add
   strip, following the same measured-bound convention already used on that
   row (ui-review dated entries, both viewports).

**Guardrail wording (slice C)** — one line in `promptAssembly.ts` (~line 142)
changes from "treat unrecognized or off-domain terms as not found" to
something that recognizes common Magic-adjacent phrasing before falling back
to refusal. No classifier, no new branch. A new glossary doc backs the wording
so the categories are maintained and explained, not just a bare word list.

**Prompt-layout spec (slice D)** — a new doc, no code change. Every section
`buildPromptText` (`promptAssembly.ts`) assembles, in order, with a
present/absent/conditional matrix across game / lookup-with-cards /
lookup-no-card / follow-up, verified against the assembly code and
`npm run prompt:preview` output.

**Worked-solutions eval (slice E)** — new fixtures under the existing eval
harness (`apps/backend/src/eval/`), each with documented source/provenance.
Test data only; never wired into a live prompt; non-gating in
`quality:check`.

## Slice order and dependencies

| Slice | Scope | REQ/FLOW | Depends on |
| --- | --- | --- | --- |
| A | Multi-card lookup — backend contract, prompt assembly, retrieval, combo matching | REQ-167 (backend ACs), REQ-094 (amended), REQ-095 (verified, no new AC) | none |
| B | Multi-card lookup — pre-submit UI, frozen-context/follow-up wiring, screen-layout re-measurement | REQ-167 (UI ACs), FLOW-023 | A (needs the `cards` wire contract) |
| C | Guardrail wording + phrasing glossary | REQ-168 | none (parallel-ready; touches `promptAssembly.ts` near but not inside A's combo/enrichment edits — sequence after A if working solo to avoid a same-file merge) |
| D | Prompt-layout spec doc | REQ-169 | A, C (doc must describe the shipped multi-card sections and reworded guardrail, not the pre-change prompt) |
| E | Worked-solutions eval set | NFR-018 | none |

Default parallel-ready except where stated. For one sequential agent: A, B, C,
D, E in letter order satisfies every dependency.

## Verification checklist (package-wide)

- `npm run quality:check` green (typecheck, lint, format, coverage, scripts)
- `npm --workspace apps/backend run test:eval` green
- `npm run prompt:preview:all` regenerated and spot-checked for slices A/C/D
- Playwright verification for slice B only (browser-observable UI risk); no
  other slice touches rendered UI
- No new endpoint, no `AskAiRequest`/`AskAiResponse` field beyond the
  documented `card` → `cards` shape change, no classifier added

## Ship gates

See slice E's `## Ship gates` block (final slice) for the promotion checklist
executed at cleanup.
