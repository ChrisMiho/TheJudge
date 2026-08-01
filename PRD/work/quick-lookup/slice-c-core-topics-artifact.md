# Slice C — Core-topics browse artifact

## Status: done

## Goal

Commit a small frontend-bundled subset of the curated rules topics, derived from
the same `gameRulesByTopic.json` source the prompt uses, so Quick Lookup's empty
state can browse core rules topics with no AI call (REQ-079).

## Requirements

1. Extend `scripts/build-game-rules.mjs` to emit a second output file —
   `apps/frontend/public/data/gameRulesCoreTopics.json` — after the existing
   `gameRulesByTopic.json` / `gameRulesRuleIndex.json` / `gameRulesTokenStats.json`
   writes, in the same script run (no new npm script; it rides `data:build`).
2. Select a fixed, small id set: `ALWAYS_ON_TOPIC_IDS` (`stack-and-priority`,
   `targets-basics`, `zones-basics`, `abilities-trigger-basics` — import from
   `apps/backend/src/gameRulesTopicSelection.ts`, or mirror the literal list if
   importing a TS module from the build script is awkward — keep them
   byte-identical either way) **plus** two additional high-value browse topics:
   `combat-phase-structure` and `layers-order`.
3. For each selected id, emit `{ id, title, ruleNumbers, excerpt }` copied
   verbatim from the matching `gameRulesByTopic.json` entry — no hand-authored
   text, no re-derivation of the excerpt. If a selected id is missing from the
   topic manifest output, skip it and log a build warning (graceful degradation,
   matching the existing `build-game-rules.mjs` pattern for missing sources).
4. Output ordering is stable — the fixed id list order, not manifest order —
   pretty-printed with the same `prettier` JSON formatting the script already
   uses for `gameRulesByTopic.json`.
5. `scripts/build-game-rules.mjs` has no existing unit test file and no script
   in this repo is currently unit-tested in isolation (verified: no
   `scripts/*.test.*` files exist). Do not invent new test infrastructure for
   this slice; verify by running `npm run data:build` and diffing the generated
   `gameRulesCoreTopics.json` against `gameRulesByTopic.json` (Acceptance
   criteria below are checked by inspection/diff, not a new test suite).

## Acceptance criteria

- [ ] `npm run data:build` produces `apps/frontend/public/data/gameRulesCoreTopics.json`
      with exactly six entries (four always-on + two browse) in fixed order.
- [ ] Every emitted entry's `title`/`ruleNumbers`/`excerpt` is byte-identical to
      the matching `gameRulesByTopic.json` entry.
- [ ] Deleting a selected topic from the manifest (test fixture) produces a
      build warning and a shorter (not crashed) output, consistent with the
      script's existing graceful-degradation behavior.
- [ ] Re-running `npm run data:build` twice produces byte-identical output
      (deterministic build).

## Verification

```bash
npm run data:build
git diff apps/frontend/public/data/gameRulesCoreTopics.json
node -e "
const core = require('./apps/frontend/public/data/gameRulesCoreTopics.json');
const full = require('./apps/backend/data/gameRulesByTopic.json');
const byId = Object.fromEntries(full.map((t) => [t.id, t]));
for (const t of core) {
  const src = byId[t.id];
  if (!src || src.title !== t.title || src.excerpt !== t.excerpt) throw new Error('drift: ' + t.id);
}
console.log('core topics match source, count=' + core.length);
"
```

## Files touched

- `scripts/build-game-rules.mjs`
- `apps/frontend/public/data/gameRulesCoreTopics.json` (generated, committed)

## Notes

- Independent of Slices A/B — no dependency on the request contract or prompt
  assembly. Safe to build first or in parallel.
- Slice D consumes this artifact at runtime via a `fetch('/data/gameRulesCoreTopics.json')`
  call, the same pattern `cardMetadata.json` already uses.
- This is a discoverability fallback, not a full Comprehensive Rules browser
  (explicit non-goal) — do not expand the id set beyond the six selected here
  without an explicit product decision.
