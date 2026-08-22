# Commander Spellbook Combo Enrichment — Gameplan

Re-mapped 2026-08-21 from `DESIGN-BRIEF.md`'s 2026-08-12 amendment (quality
check PASS, 2026-08-21). Supersedes the 2026-08-11 A–F gameplan, which the
amendment invalidated: the corpus build could not parse a single real
upstream variant (wrong wire casing), and the paginated source proved
unusable in practice (throttled after 13,600 variants). This plan carries
slices G–J; A–F remain in the package as evidence of the false ship-ready.

## Architecture

Six modules under `apps/backend/src/commanderSpellbook/`, two build scripts,
one measurement script — same module boundary as before. What changes is the
corpus source, the wire-format parsing, and the storage/loading shape of the
detail artifact.

```
scripts/refresh-commander-spellbook-data.mjs   (network, human-approved)
        │  single bulk-export request — no cursor walk, no throttling
        ▼
apps/backend/data/commander-spellbook/*.json   (gitignored)
        │
scripts/build-commander-spellbook-combos.mjs   (deterministic, offline)
        │  OK-only filter (defensive — export publishes none else),
        │  camelCase field reads, template expansion,
        │  per-variant individual gzip + byte-offset directory
        ▼
apps/backend/data/commanderSpellbookCombos.json.gz      (committed, lazy-access detail store)
apps/backend/data/commanderSpellbookComboIndex.json.gz  (committed, oracle/template index + byte offsets)
        │
        │  index loaded once at startup (eager, cheap); detail fetched
        │  lazily per requested variant id, fail-open
        ▼
runtime/createConfiguredApp.ts ──> app/createApp.ts ──> prompt/preparation.ts
        │                                                      │
        │  config/index.ts: COMBO_ENRICHMENT_ENABLED           │
        │  (false ⇒ index never loaded ⇒ options omitted)      │
        ▼                                                      ▼
commanderSpellbook/{catalog,intent,zones,matcher,formatting}.ts
                                                               │
                                            prompt/promptAssembly.ts
                                            (COMMANDER SPELLBOOK COMBO CONTEXT)
```

### Module boundaries

Unchanged from the 2026-08-11 plan — the amendment changes data access
patterns, not module ownership.

| Module | Owns | Must not |
|---|---|---|
| `catalog.ts` | artifact types, eager index load, lazy per-variant detail fetch, integrity validation, one-time warn | know about requests or prompts |
| `zones.ts` | the single `ZoneId` ⇄ `H/B/C/E/G/L` map | be duplicated in matcher or formatter |
| `intent.ts` | the one word/phrase-boundary combo-intent detector | call a model; be re-implemented per mode |
| `matcher.ts` | candidate resolution via index membership, lazy detail fetch, assignment, quantities, annotations, ranking, five-cap | render strings |
| `formatting.ts` | the prompt section text and instruction lines | decide eligibility |

## Why the detail artifact's internal format changes

The 2026-08-12 amendment measured the full detail catalog at ~868MB RSS /
254MB retained heap versus ~95MB RSS / 18MB retained heap for the index
alone — and at most five variants ever enter a prompt, so nearly all of that
resident detail is never read on a given request. No AWS Lambda function is
currently live in this account, so there is no real memory ceiling to check
against; the owner chose to design for the safe case rather than assume a
generous one.

The mechanism (built entirely from Node's `fs` and `zlib`, no new
dependency): instead of one gzip stream wrapping a single JSON array, each
variant's JSON record is gzip-compressed **individually**, and those
individually-compressed members are concatenated into one file. Gzip members
are self-contained — `zlib.gunzipSync` on a buffer slice containing exactly
one member decompresses just that member, independent of any other member's
bytes. The index artifact (small, ~1.7MB gzipped) carries a
`variantId → { offset, length }` directory into that concatenated file.  At
runtime: read only the requested variant's byte range (a positional `fs`
read), `gunzipSync` only that slice, parse only that one JSON object.

Net effect: the index loads fully into memory once, cheaply. The detail
store is touched only for the handful of candidate ids a request's matching
actually resolves — never the full 105k-variant set.

## Data flow through prompt assembly

Unchanged from the 2026-08-11 plan: `preparePromptInput()` receives an
optional `comboCatalog` option, absent when the artifact is missing or the
config flag is off. Absent option ⇒ no matcher run ⇒ no section.

### Section placement

Unchanged: the combo section is inserted immediately after the rulings
section and before `SCOPE` in `buildPromptText()`, and after
`officialRulingsSection` before `conversationHistorySection` in
`buildLookupPromptText()`. REQ-095's ordering requirement is satisfied either
way; the pre-`SCOPE` choice stays pinned so goldens remain stable.

## Verification checklist

Every item is covered by a slice acceptance criterion (slices G–J).

- [ ] Build sources the bulk export exclusively; the paginated walk is gone
- [ ] Build reads camelCase wire fields throughout; no snake_case reads remain
- [ ] `npm run data:refresh` runs the combo download as part of its chain
- [ ] Detail artifact is concatenated per-variant gzip members; index carries byte offsets
- [ ] Loader reads the index eagerly, detail lazily per requested variant id
- [ ] A test proves exactly one gzip member decompresses per single-variant lookup
- [ ] Null steps/prereqs/mana/card-state in a lazily-decompressed variant is an integrity failure
- [ ] Loader fails open on missing/empty/malformed artifacts, warning once per path
- [ ] `COMBO_ENRICHMENT_ENABLED=false` suppresses enrichment with no contract change
- [ ] Matcher resolves candidates via index membership, not an in-memory array of every variant
- [ ] Quantity-aware distinct-instance assignment and stable top-five ranking hold at real scale (105,447 variants / 7,371 oracle ids)
- [ ] Both prompt paths render the combo section correctly at real scale
- [ ] Rendered classification never emits the bare word "complete"; state-verification instruction present in both prompt modes
- [ ] `AskAiRequest`/response/Zod/route/provider selection byte-identical
- [ ] Comparison scenarios use real oracle ids and produce genuinely different prompts across legs
- [ ] Executed, human-reviewed answer-quality comparison with a recorded conclusion

## Slices

| Slice | Objective | Depends on | Parallel-ready |
|---|---|---|---|
| G | Bulk-export build, camelCase fix, lazy-access storage format | — | yes |
| H | Lazy runtime catalog loader | G | no — consumes G's storage format |
| I | Matching integration at real scale | H | no — consumes H's lookup interface |
| J | Real-scenario answer-quality comparison; ship gates | I | no — final slice |

G→H→I→J are strictly sequential: each slice's design depends on the previous
slice's real interface (the storage format, then the lookup API, then the
verified matching layer), not merely on convention.

## Files touched across the package

| File | Slices |
|---|---|
| `scripts/refresh-commander-spellbook-data.mjs` | G |
| `scripts/build-commander-spellbook-combos.mjs` | G |
| `scripts/refresh-scryfall-data.mjs`, `package.json` (`data:refresh` wiring) | G |
| `apps/backend/src/commanderSpellbook/__fixtures__/*` | G |
| `apps/backend/data/commanderSpellbookCombos.json.gz`, `apps/backend/data/commanderSpellbookComboIndex.json.gz` | G (fixture-scale), J (real corpus, owner-approved) |
| `apps/backend/src/commanderSpellbook/catalog.ts` | H |
| `apps/backend/src/commanderSpellbook/matcher.ts` | I |
| `apps/backend/src/commanderSpellbook/formatting.ts`, `apps/backend/src/prompt/{preparation,promptAssembly}.ts` | I (verification only) |
| `scripts/compare-combo-answer-quality.mjs` | J |
| `apps/backend/src/eval/fixtures/commander-spellbook-*` | I, J (verification only — content unchanged) |

Untouched by design: `apps/frontend/**`, `apps/backend/src/validation/**`,
`apps/backend/src/routes/**`, `apps/backend/src/providers/**`,
`apps/backend/src/config/index.ts`, `runtime/createConfiguredApp.ts`,
`app/createApp.ts` (all already wired correctly by the 2026-08-11 slices B–D
and unaffected by this amendment).

## Owner-action checkpoints

Two steps an agent cannot self-authorize. Neither blocks slices G–I.

1. **Production corpus refresh (slice J).** The real bulk-export download,
   for real. Slices G–I are verified against fixture-scale or realistic
   synthetic data; the real committed artifacts land only when the owner
   separately approves invoking that live call — distinct from the
   architecture approval already recorded in DEC-162.
2. **Live provider A/B (slice J).** Costs money and needs
   `ASK_AI_PROVIDER=openai` plus a real key. The script ships complete and
   refuses to run without `--confirm-live-calls`; the owner triggers the run
   and reviews the output. Per DEC-161, its conclusion informs the ship
   decision without blocking it.

## Risks

- **Upstream schema drift, again.** The 2026-08-12 defect happened because a
  PRD line asserted a wire-format claim the implementation trusted instead of
  verifying against real bytes. Slice G's fixtures come from a real upstream
  response specifically to make a future rename fail loudly instead of
  passing silently a second time.
- **Lazy-loader correctness.** The individually-gzipped-member format is
  unusual; slice H's H3 criterion (prove exactly one member decompresses per
  lookup, via a spy/counter) exists because "should be lazy" is not the same
  claim as "is lazy," and this format has no precedent elsewhere in the
  codebase to copy from.
- **Golden churn.** Regenerating fixtures at real scale changes
  `checklist-report.golden.txt` and per-scenario goldens; slice I updates
  goldens only for the scale change, not for any intentional matching
  semantics change (there is none).

## Constraints carried into every slice

- Vitest outermost `describe` is `Backend - Ask AI` (closed vocabulary in
  `PRD/instructions/test-naming.md`). Do not invent
  `Backend - Commander Spellbook` without updating that file first. No
  slice/REQ/DEC labels in titles.
- No browser verification: backend-only, no user-visible surface, so
  `runtime-process-hygiene.md`'s Playwright policy does not trigger for any
  slice.
- `AskAiRequest`, Zod schemas, success/error shapes, provider selection, and
  `POST /api/ask-ai` stay unchanged — the enrichment is invisible to the
  contract.
