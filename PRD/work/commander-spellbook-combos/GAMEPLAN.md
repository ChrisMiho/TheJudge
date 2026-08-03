# GAMEPLAN — commander-spellbook-combos

Backend-only Commander Spellbook prompt enrichment: build a reviewed static combo corpus, load it fail-open at backend startup, match at most five variants deterministically against game or lookup context, and render a clearly community-sourced prompt section without changing the Ask AI contract.

Source of truth: `DESIGN-BRIEF.md`, DEC-116, REQ-093–REQ-095, FLOW-015, plus DEC-013/021/029/030/046/106 and `PRD/instructions/technical-design-rules.md`.

## Architecture

Five additive layers preserve the existing single endpoint and provider boundary:

1. **Offline source and artifact pipeline (Slice A)** — a dedicated, explicitly confirmed network refresh writes a complete raw snapshot under gitignored `apps/backend/data/commander-spellbook/`. A separate deterministic build validates that snapshot and atomically emits the two committed runtime artifacts.
2. **Runtime catalog boundary (Slice B)** — one loader validates both artifacts as a matching pair and exposes normalized readonly maps. Missing, empty, corrupt, or mismatched artifacts return an empty catalog and warn once per failing path.
3. **Eligibility and matching (Slice C)** — a narrow lexical intent detector and a pure matcher select complete or explicit partial candidates. Quantity slots use distinct submitted instances; compatible-zone assignment is maximized before wrong-zone annotation; ranking is deterministic and capped at five.
4. **Prompt/runtime integration (Slice D)** — the startup-loaded catalog flows through the existing app/route dependency injection into `preparePromptInput`. Prompt assembly inserts the formatted community section after official card/rules/rulings enrichment and before `SCOPE`, conversation history, and `QUESTION` as applicable.
5. **End-to-end evaluation and ship closure (Slice E)** — fixture-owned catalog data and seven intentional golden scenarios prove every required game/lookup/failure branch without coupling eval stability to future upstream refreshes.

No layer changes `AskAiRequest`, Zod validation, success/error response shapes, provider selection, `POST /api/ask-ai`, stack ordering, or frontend behavior. Runtime code never calls Commander Spellbook or Scryfall.

## Artifact contracts

Both committed files carry `schemaVersion: 1` and the same deterministic `snapshotId`. The loader rejects the pair if versions or snapshot IDs differ.

`apps/backend/data/commanderSpellbookCombos.json`:

```text
{
  schemaVersion,
  snapshotId,
  source: {
    name, fetchedAt, apiBaseUrl, docsUrl, repositoryUrl,
    licenseName, licenseUrl, attribution
  },
  variants: [{
    id, status, sourceUrl, popularity,
    uses: [{ cardId, name, quantity, startingZones, mustBeCommander, zoneState }],
    requires: [{ templateId, name, quantity, startingZones, mustBeCommander, zoneState }],
    produces: [{ name, quantity }],
    description, manaNeeded, easyPrerequisites, notablePrerequisites, notes
  }]
}
```

`apps/backend/data/commanderSpellbookComboIndex.json`:

```text
{
  schemaVersion,
  snapshotId,
  variantIdsByOracleId: { oracleId: [variantId, ...] },
  templateExpansions: {
    templateId: {
      name,
      status: "resolved" | "unresolved",
      source: "scryfall-query" | "explicit-replacements" | "unresolved",
      oracleIds: [oracleId, ...]
    }
  },
  unresolvedTemplateIds: [templateId, ...]
}
```

The build converts Commander Spellbook zone codes once into TheJudge's canonical starting zones: `H → hand`, `B → battlefield`, `C → command`, `E → exile`, `G → graveyard`, and `L → library`. `stack` has no compatible Commander Spellbook starting-zone code and therefore identity matches there are wrong-zone matches, never complete-zone matches.

Every collection and object-key order is stable. `snapshotId` is derived from normalized raw inputs rather than wall-clock build time, while `source.fetchedAt` comes from the raw snapshot manifest. The output pair is staged and validated before replacement; rollback restores the previous valid pair if either replacement fails.

## Runtime interfaces

Slice B establishes these shared interfaces for later slices:

```ts
type CommanderSpellbookCatalog = {
  variantsById: ReadonlyMap<string, CommanderSpellbookVariant>;
  variantIdsByOracleId: ReadonlyMap<string, readonly string[]>;
  templateExpansionsById: ReadonlyMap<string, CommanderSpellbookTemplateExpansion>;
};

function loadCommanderSpellbookCatalog(
  combosPath: string,
  indexPath: string
): CommanderSpellbookCatalog;
```

Slice C produces:

```ts
function hasExplicitComboIntent(question: string): boolean;

function selectCommanderSpellbookMatches(input: {
  request: AskAiRequest;
  context: PromptInputContext;
  catalog: CommanderSpellbookCatalog;
}): CommanderSpellbookMatch[];
```

`CommanderSpellbookMatch` contains the variant, `classification` (`complete` or `partial`), `trigger` (`automatic` or `explicit`), and non-overlapping annotation lists for compatible exact ingredients, compatible template matches, wrong-zone assignments, missing ingredients, and unresolved templates. It also carries the numeric values used by the ranking comparator so formatter code never re-derives eligibility.

Slice D consumes those matches through:

```ts
function formatCommanderSpellbookSection(matches: readonly CommanderSpellbookMatch[]): string;
```

An empty match list formats to `""`; prompt assembly therefore omits both heading and blank section.

## Matching and ranking data flow

```text
AskAiRequest ──existing validation──> PromptInputContext
      │                                  │
      │ question/mode                    │ normalized card instances + zones
      └────────────────┬─────────────────┘
                       ▼
             hasExplicitComboIntent
                       │
committed artifacts ─loader──> CommanderSpellbookCatalog
                       │
submitted oracle ids ──inverse index──> candidate variant ids
                       │
                       ▼
       flatten ingredient quantities into stable slots
                       │
          maximum compatible assignment first
                       │ remaining slots/instances
          identity-only wrong-zone assignment second
                       │
                       ▼
       annotate complete/partial + anchors + gaps
                       │
                       ▼
 complete > anchor coverage > compatible coverage >
 fewer missing > popularity desc > variant id asc
                       │
                       ▼
                  first five
                       │
                       ▼
 community-sourced prompt section after official enrichment
```

- Game mode without explicit intent filters to complete matches only.
- Game mode with explicit intent keeps complete matches first and permits partial matches. Card names explicitly mentioned using case-insensitive literal boundaries are required on partial candidates; without a named submitted card, every partial candidate must overlap at least one submitted card.
- Lookup mode requires explicit intent and an attached card. Every candidate contains that oracle identity exactly or through a resolved authoritative template expansion.
- Compatible assignment uses maximum-cardinality bipartite matching over stable ingredient slots and submitted instances so a flexible template cannot consume the only card needed by an exact slot. Remaining instances may then annotate identity matches in incompatible zones. No instance is used twice.
- Unresolved templates have no assignment edges and always prevent `complete` classification.
- Mana, commander designation, zone-state prose, legality, and prerequisites are retained as prompt context only and never evaluated as satisfied.

## Prompt contract

`formatCommanderSpellbookSection` emits plain text headed exactly:

`COMMANDER SPELLBOOK COMBO CONTEXT — COMMUNITY-SOURCED`

The section states that Commander Spellbook is community catalog data, not WotC rules or proof of legality/executability, and that official card text, WotC rulings, and Comprehensive Rules remain authoritative. Each entry includes the stable source reference, complete/partial state, compatible exact cards, compatible template matches, wrong-zone pieces, missing pieces, unresolved templates, produced effects, steps, mana needed, prerequisites, and notes when present. Automatically supplied complete matches include the instruction to use them only when relevant to the actual question.

Game prompt order remains:

```text
... zones → GAME RULES → supplemental rules → OFFICIAL RULINGS
→ COMMANDER SPELLBOOK COMBO CONTEXT → SCOPE → CONVERSATION HISTORY → QUESTION
```

Lookup prompt order remains:

```text
... GAME RULES → supplemental rules → CARD → OFFICIAL RULINGS
→ COMMANDER SPELLBOOK COMBO CONTEXT → CONVERSATION HISTORY → QUESTION
```

## Reuse before creating

- `scripts/refresh-scryfall-data.mjs` — request identity, temp-download, and preserve-on-failure patterns.
- `scripts/build-card-rulings.mjs` / `scripts/build-game-rules.mjs` — pure exported transforms, deterministic ordering, graceful prior-artifact preservation, and policy-test pattern.
- `apps/frontend/src/lib/*BuildPolicy.test.ts` plus `src/types/build-card-metadata.d.ts` — existing Vitest seam for root `.mjs` build scripts.
- `apps/backend/src/cardRulings.ts` and `gameRules.ts` — startup loader normalization and warn-once failure behavior.
- `apps/backend/src/prompt/preparation.ts` — single game/lookup enrichment orchestration boundary.
- `apps/backend/src/prompt/promptAssembly.ts` — deterministic section ordering.
- `apps/backend/src/runtime/createConfiguredApp.ts` → `createApp.ts` → `routes/askAi.ts` — existing dependency-injection chain.
- `apps/backend/src/eval/contextEvaluationHarness.ts` and fixture README — golden scenario conventions.
- `scripts/package-lambda.sh` already copies all of `apps/backend/data`; no packaging change is needed.

## Sequential dependency map

| Slice | Objective | Depends on | Sequential blocker |
| --- | --- | --- | --- |
| A | Offline refresh/build + committed corpus | — | Establishes the artifact schema, snapshot pair, and approved source data used everywhere else |
| B | Fail-open runtime catalog loader | A | Must validate and normalize Slice A's exact artifact contract |
| C | Intent-aware matcher and ranker | B | Consumes the normalized catalog types/maps exported by B |
| D | Prompt and runtime integration | C | Consumes C's final match/annotation contract; avoids formatter/preparation churn |
| E | Eval goldens, full regression gate, and ship closure | D | Goldens must capture the final prompt/runtime behavior and intentional ordering |

This package is sequential because every later slice consumes a concrete interface finalized by its predecessor. Splitting these slices into parallel branches would duplicate or speculate about artifact, catalog, match, and prompt contracts.

## Human-approved network gate

Slice A may implement and test all refresh behavior with injected/mock `fetch`, but no agent may run the live Commander Spellbook/Scryfall refresh until the user explicitly approves that network operation in the implementation session. The live command requires the script's confirmation flag:

```bash
npm run data:refresh:commander-spellbook -- --confirm-network
```

The command writes a complete temporary raw snapshot and promotes it only after every required page/expansion succeeds. A refusal, network failure, pagination loop, partial template expansion, or validation failure preserves the prior raw snapshot and both committed artifacts.

## Verification checklist

- [ ] Refresh/build policy tests cover confirmation gating, pagination, reviewed-status filtering, source metadata, explicit/query template expansion, unresolved templates, deterministic serialization, pair validation, and rollback/preservation.
- [ ] A user-approved live refresh produces gitignored raw inputs and non-empty committed detail/index artifacts with matching `schemaVersion` and `snapshotId`.
- [ ] Runtime loader tests prove valid normalization plus warn-once fail-open behavior for missing, empty, malformed, and mismatched artifacts.
- [ ] Matcher tests prove narrow intent positives, broad-language negatives, complete automatic game matches, explicit partials, question anchors, lookup gating, quantity/distinct-instance semantics, zone compatibility, template matches, unresolved templates, and stable top-five ranking.
- [ ] Prompt tests prove exact heading/content, omission on no match, community/WotC authority language, automatic-relevance instruction, and placement after official enrichment but before history/question.
- [ ] App/runtime tests prove the loaded catalog reaches both request modes while the endpoint, request schema, live `{ answer }`, mock sidecars, provider boundary, and stack order remain unchanged.
- [ ] Eval fixtures cover the seven REQ-095 branches and only intentional Commander Spellbook prompt goldens change.
- [ ] `npm --workspace apps/frontend run test -- src/lib/commanderSpellbookDataPolicy.test.ts` passes.
- [ ] `npm --workspace apps/backend run test` passes.
- [ ] `npm --workspace apps/backend run test:eval` passes.
- [ ] `npm run quality:check` passes in the final slice.
- [ ] Final slice carries PRD promotion and cleanup ship gates.
