# Commander Spellbook Combo Enrichment — Gameplan

Mapped 2026-08-11 from `DESIGN-BRIEF.md` (quality check PASS, same date).
Supersedes the deleted 2026-08-03 A–E plan, which predated the card-state and
answer-quality expansion.

## Architecture

Six modules under `apps/backend/src/commanderSpellbook/`, two build scripts, one
measurement script. Nothing in `apps/frontend/`. No route, schema, or contract
change anywhere.

```
scripts/refresh-commander-spellbook-data.mjs   (network, human-approved)
        │  writes gitignored raw pages
        ▼
apps/backend/data/commander-spellbook/*.json   (gitignored)
        │
scripts/build-commander-spellbook-combos.mjs   (deterministic, offline)
        │  OK-only filter, template expansion, camelCase projection
        ▼
apps/backend/data/commanderSpellbookCombos.json      (committed, variant detail)
apps/backend/data/commanderSpellbookComboIndex.json  (committed, oracle/template index)
        │
        │  loaded once at startup, fail-open
        ▼
runtime/createConfiguredApp.ts ──> app/createApp.ts ──> prompt/preparation.ts
        │                                                      │
        │  config/index.ts: COMBO_ENRICHMENT_ENABLED           │
        │  (false ⇒ catalog never loaded ⇒ options omitted)    │
        ▼                                                      ▼
commanderSpellbook/{catalog,intent,zones,matcher,formatting}.ts
                                                               │
                                            prompt/promptAssembly.ts
                                            (COMMANDER SPELLBOOK COMBO CONTEXT)
```

### Module boundaries

| Module | Owns | Must not |
|---|---|---|
| `catalog.ts` | artifact types, `loadComboCatalog()`, integrity validation, one-time warn | know about requests or prompts |
| `zones.ts` | the single `ZoneId` ⇄ `H/B/C/E/G/L` map | be duplicated in matcher or formatter |
| `intent.ts` | the one word/phrase-boundary combo-intent detector | call a model; be re-implemented per mode |
| `matcher.ts` | assignment, quantities, annotations, ranking, five-cap | render strings |
| `formatting.ts` | the prompt section text and instruction lines | decide eligibility |

`intent.ts` and `zones.ts` are single authoritative definitions imported by both
the game and lookup paths — `technical-design-rules.md`'s reuse-before-creating
rule is the reason they are separate files rather than matcher internals.

## Data flow through prompt assembly

`preparePromptInput()` already receives artifacts through
`PreparePromptInputOptions` (`cardRulingsIndex`, `gameRulesTopics`,
`gameRulesRuleIndex`). Combo enrichment follows that exact shape: a new optional
`comboCatalog` option, absent when the artifact is missing or the config flag is
off. Absent option ⇒ no matcher run ⇒ no section. No branch anywhere else needs
to know why it is absent.

### Section placement

`buildPromptText()` (game) currently ends:

```
zoneSections → GAME RULES → ADDITIONAL RELEVANT RULE EXCERPTS → RULINGS
             → SCOPE → CONVERSATION HISTORY → QUESTION
```

The combo section is inserted **immediately after the rulings section and before
`SCOPE`**, keeping all enrichment contiguous. `buildLookupPromptText()` gets the
same relative position — after `officialRulingsSection`, before
`conversationHistorySection`.

REQ-095 requires only "after card/rules/rulings enrichment and before
conversation history plus the current question", which a post-`SCOPE` placement
would also satisfy. The pre-`SCOPE` choice is pinned here so goldens are stable;
changing it later is a golden update, not a requirement change.

## Verification checklist

Every item is covered by a slice acceptance criterion.

- [ ] Build is deterministic for identical raw inputs; `OK`-only with `EXAMPLE` rejected
- [ ] Zone-scoped card state survives the build uncollapsed for multi-zone ingredients
- [ ] Template expansion (query-backed + explicit) and unresolved-template retention
- [ ] Failed/partial refresh never overwrites a valid committed snapshot
- [ ] Loader fails open on missing/empty/malformed artifacts, warning once per path
- [ ] Null steps/prereqs/mana/card-state in a committed variant is an integrity failure
- [ ] `COMBO_ENRICHMENT_ENABLED=false` suppresses enrichment with no contract change
- [ ] Narrow intent positives (`combo`, `infinite`, `go infinite`, `loop`, `win condition`) and broad-language non-triggers (`synergy`, `interaction`, `works with`)
- [ ] Quantity-aware distinct-instance assignment; one instance never fills two slots
- [ ] Unresolved template can never complete a candidate
- [ ] Game complete/non-intent, game partial/explicit, lookup attached/explicit, lookup no-card and no-intent branches
- [ ] State annotation resolves to the matched instance's zone; expected zone for wrong-zone/missing
- [ ] Stable top-five ranking across the full six-key order
- [ ] Rendered classification never emits the bare word "complete"
- [ ] State-verification instruction present in both prompt modes
- [ ] Prompt ordering, community-source guardrails, mock exposure, eval goldens
- [ ] `AskAiRequest`/response/Zod/route/provider selection byte-identical
- [ ] Executed, human-reviewed answer-quality comparison with a recorded conclusion

## Slices

| Slice | Objective | Depends on | Parallel-ready |
|---|---|---|---|
| A | Refresh + build scripts → committed artifacts | — | yes |
| B | Runtime catalog loader, integrity validation, config flag | A | no — consumes A's artifact schema |
| C | Intent detector, zone map, matcher/ranker | B | no — consumes B's loaded types |
| D | Prompt section rendering + both prompt paths | C | no — consumes C's annotations |
| E | Eval fixtures, goldens, full-path coverage | D | yes — parallel with F |
| F | Answer-quality A/B script + recorded conclusion | D | yes — parallel with E |

A–D are sequential by data dependency, not by convention: each consumes the
previous slice's type contract. E and F both depend only on D and may run
concurrently.

## Owner-action checkpoints

Two steps an agent cannot self-authorize. Neither blocks the slices around it.

1. **Production corpus refresh (slice A).** `refresh-commander-spellbook-data.mjs`
   makes live network calls to Commander Spellbook and Scryfall, which REQ-093
   gates on explicit human approval. Slice A is verified end to end against
   committed sample raw inputs under `apps/backend/src/commanderSpellbook/__fixtures__/`;
   the real committed artifacts land when the owner approves one refresh run.
   B–E work against fixture artifacts and do not wait for it.
2. **Live provider A/B (slice F).** Costs money and needs `ASK_AI_PROVIDER=openai`
   plus a real key. The script ships complete and refuses to run without
   `--confirm-live-calls`; the owner triggers the run and reviews the output.

Slice F's *conclusion* is the only ship-gate dependency, and per DEC-161 it
informs the decision without blocking the build.

## Risks

- **Upstream schema drift.** Every field name in the brief comes from
  `spellbook/serializers/variant_serializer.py`. The build must fail loudly on an
  unrecognized `status` value or a missing expected key rather than silently
  emitting a thinner corpus.
- **Corpus size.** Commander Spellbook publishes tens of thousands of variants.
  If the trimmed artifact is large enough to hurt Lambda cold start, the index /
  detail split is the lever — the index is what matching needs, and detail can be
  narrowed to selected variants. Measure in slice B before optimizing.
- **Golden churn.** Adding fixtures changes `checklist-report.golden.txt` as well
  as the per-scenario goldens. Slice E updates goldens only for the intentional
  combo-section addition.

## Constraints carried into every slice

- Vitest outermost `describe` is `Backend - Ask AI` (closed vocabulary in
  `PRD/instructions/test-naming.md`). Do not invent `Backend - Commander Spellbook`
  without updating that file first. No slice/REQ/DEC labels in titles.
- No browser verification: backend-only, no user-visible surface, so
  `runtime-process-hygiene.md`'s Playwright policy does not trigger for any slice.
- `AskAiRequest`, Zod schemas, success/error shapes, provider selection, and
  `POST /api/ask-ai` stay unchanged — the enrichment is invisible to the contract.
