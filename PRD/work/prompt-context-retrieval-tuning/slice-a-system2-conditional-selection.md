# Slice A — System 2 conditional topic selection

## Status: planned

## Goal

Replace "all curated topics on every prompt" with DEC-045 always-on core plus game-state-gated conditional expansion. Wire per-request selection into `preparePromptInput` so `formatGameRulesSection` and `collectCuratedRuleIds` reflect the selected subset.

## Requirements

- DEC-045: always-on core + conditional buckets per `DESIGN-BRIEF.md` / `GAMEPLAN.md`
- REQ-022: curated topics selected per game state, stable `id` order
- Signals only: `turnPhase`, `combatStep`, populated zone presence — no card/oracle/keyword signals

## Files touched

- `apps/backend/src/gameRulesTopicSelection.ts` — **new**
- `apps/backend/src/gameRulesTopicSelection.test.ts` — **new**
- `apps/backend/src/prompt/preparation.ts`
- `apps/backend/src/gameRules.test.ts` — only if shared helpers land in `gameRules.ts`

## Changes

### `gameRulesTopicSelection.ts`

Export:

```ts
export const ALWAYS_ON_TOPIC_IDS = [
  "stack-and-priority",
  "targets-basics",
  "zones-basics",
  "abilities-trigger-basics"
] as const;

export function selectGameRulesTopics(
  context: PromptContext,
  allTopics: GameRulesTopic[]
): GameRulesTopic[];
```

Implementation notes:

- Build topic id set from triggers (union buckets per `GAMEPLAN.md` table).
- Stack non-empty: `context.orderedStack.length > 0` (not merely `selectedZones` includes stack).
- Battlefield populated: any item in `context.populatedZones` with `zoneId === "battlefield"` and `items.length > 0`.
- Combat: `context.gameContext.turnPhase === "combat"`; branch on `combatStep` per DEC-045; absent/other `combatStep` adds full combat+damage set.
- Upkeep/draw/end_step/cleanup: `turnPhase` in `{ upkeep, draw, end_step, cleanup }`.
- Filter `allTopics` to selected ids; return sorted by `id` localeCompare (manifest order already sorted in loader — preserve stable output).
- Unknown topic ids in manifest are ignored; missing ids in manifest are no-ops.

### `preparation.ts`

Before `formatGameRulesSection`:

```ts
const allTopics = options.gameRulesTopics ?? [];
const selectedTopics = selectGameRulesTopics(context, allTopics);
const gameRulesSection = formatGameRulesSection(selectedTopics);
const curatedRuleIds = collectCuratedRuleIds(selectedTopics);
```

Use `selectedTopics` everywhere `gameRulesTopics` was passed to `buildPromptText`, diagnostics, and `enrichmentDebug.curatedGameRules`.

`index.ts` continues passing the full loaded topic list — no change to startup load path.

### Tests

Cover each conditional bucket independently plus:

- Core-only minimal scenario (`main_1`, empty zones).
- Stack + battlefield union (both bucket sets).
- Combat with each `combatStep` variant and absent `combatStep`.
- Upkeep triggers topic only on upkeep/draw/end_step/cleanup.

## Acceptance criteria

- [ ] `selectGameRulesTopics` returns exactly the four always-on topics for `main_1` with no stack/battlefield cards
- [ ] Non-empty stack adds all five stack conditional topic ids
- [ ] Populated battlefield adds all six battlefield conditional topic ids
- [ ] `combat` + `declare_attackers` adds `combat-phase-structure` and `combat-declare-attackers` (plus core)
- [ ] `combat` + `combat_damage` adds combat-phase + all damage topics listed in DEC-045
- [ ] `combat` without recognized `combatStep` adds full combat+damage topic set
- [ ] `upkeep` (and draw/end_step/cleanup) adds `abilities-delayed-triggers`
- [ ] `preparePromptInput` uses selected topics; `enrichmentDebug.curatedGameRules.topicIds` matches selection
- [ ] Output topic order is stable `id` ascending

## Verification

```bash
cd apps/backend && npm run test -- src/gameRulesTopicSelection.test.ts
cd apps/backend && npm run quality:check
```

## Notes

- Prompt golden files will shrink for many fixtures once this ships; intentional regeneration happens in Slice C (do not bulk-update goldens in A unless tests require it).
- `collectCuratedRuleIds` shrink is prerequisite for System 3 picking rules previously excluded only because they were in the all-topics baseline.
