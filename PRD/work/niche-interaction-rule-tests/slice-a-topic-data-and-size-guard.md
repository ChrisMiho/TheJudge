# Slice A — Topic data and size guard

## Status: planned

## Dependencies

None (parallel-ready). References only: REQ-220 and REQ-022 (applied in Slice B), REQ-179 (the topic's rule numbers later join the curated exclusion set).

## Goal

Add the curated topic `replacement-effects-interaction` to the committed rules data, built from the committed rule index, and raise the stored-topic size guard to fit it. The topic exists in the data but nothing selects it yet, so no prompt changes.

## Requirements

1. Rule-text version check first. Run `git fetch origin`, then `git diff c1188dc8 origin/main -- apps/backend/data/gameRulesRuleIndex.json`. If empty, continue. If `origin/main` carries a different rule index (PR #273 merged), the topic text comes from that index and every number that depends on rules text (the 3,846-character excerpt, the 25,808 total, the 287/392 count, the baseline contents) must be re-measured before this slice commits. If the topic total then exceeds 26,000, or any acceptance number in `DESIGN-BRIEF.md` moves for a reason other than the refresh itself, stop and report to the owner; never change the ceiling or the targets.
2. `npm ci` at the worktree root (the topic build imports `prettier`).
3. Edit `apps/backend/data/gameRulesTopicManifest.json` by hand: topic `replacement-effects-interaction`, title "Interaction of Replacement and Prevention Effects", rule numbers `614.1a`, `616.1`, `616.1a` to `616.1g`, `616.2`, placed in id order right after `replacement-effects-basics`, in the file's inline array style (the one-line `ruleNumbers` array stays inside prettier's 120 columns so `format:check` passes).
4. Run `node PRD/work/niche-interaction-rule-tests/build-topic-from-index.mjs` from the repo root. It writes `gameRulesByTopic.json` and nothing else, and refuses if any existing topic would change, a rule number is missing, or nothing new would be added. If it refuses, stop and report; never edit `gameRulesByTopic.json` by hand.
5. Do not copy, download, or build from `apps/backend/data/cr/source.txt`; do not run `npm run data:build` or `node scripts/build-game-rules.mjs`. 616.2 ends with the next chapter's heading line, "7. Additional Rules"; carry it verbatim (trimming means changing the extractor, out of scope).
6. In `apps/frontend/src/lib/gameRulesBuildPolicy.test.ts` change exactly two numbers: the topic count 23 to 24 (`expect(manifest).toHaveLength(...)`) and the total-text ceiling 22,000 to 26,000. Keep the 18,000 floor and every other check.

## Acceptance criteria

- [ ] A1: The committed rule index on `origin/main` was compared with `c1188dc8`; it is unchanged, or the rules-text-dependent numbers were re-measured and the 26,000 ceiling still holds
- [ ] A2: `gameRulesTopicManifest.json` gains topic `replacement-effects-interaction` titled "Interaction of Replacement and Prevention Effects" with rule numbers 614.1a, 616.1, 616.1a to 616.1g, 616.2, in id order right after `replacement-effects-basics`
- [ ] A3: `build-topic-from-index.mjs` ran from the repo root and did not refuse
- [ ] A4: Among the game-rules data files, `git diff --stat` lists only `gameRulesTopicManifest.json` and `gameRulesByTopic.json`; `gameRulesRuleIndex.json`, `gameRulesTokenStats.json`, `gameRulesRuleEmbeddings.json`, and `apps/frontend/public/data/gameRulesCoreTopics.json` are byte-identical
- [ ] A5: `gameRulesBuildPolicy.test.ts` expects 24 topics and a 26,000-character ceiling, with the 18,000 floor and its other checks unchanged
- [ ] A6: The build-policy test passes (24 topics, total topic text 25,808 under 26,000 on the 2026-06-05 text)
- [ ] A7: `npm run format:check` passes
- [ ] A8: A dated observation confirms no `source.txt` copy, no `npm run data:build`, no `scripts/build-game-rules.mjs` run, and no network call beyond `npm ci`

## Verification

```bash
git fetch origin && git diff c1188dc8 origin/main -- apps/backend/data/gameRulesRuleIndex.json
node PRD/work/niche-interaction-rule-tests/build-topic-from-index.mjs
git diff --stat
npm --workspace apps/frontend run test -- gameRulesBuildPolicy
npm run format:check
```

## Files touched

- `apps/backend/data/gameRulesTopicManifest.json`
- `apps/backend/data/gameRulesByTopic.json` (written by the build script)
- `apps/frontend/src/lib/gameRulesBuildPolicy.test.ts`
