# Slice D — Local core-topics browse artifact + data build

## Status: planned

## Goal

Emit a committed frontend core-topics artifact from the same curated
`gameRulesByTopic.json` excerpts the prompt uses (single source of truth), so Rules
Lookup can offer a zero-cost local browse fallback with no hand-authored second copy
(REQ-079).

## Requirements

1. Extend `scripts/build-game-rules.mjs` to emit
   `apps/frontend/public/data/gameRulesCoreTopics.json` — a small subset derived from
   the same `gameRulesByTopic.json` entries (`id`, `title`, `ruleNumbers`, `excerpt`).
2. The subset id set is a build-time sign-off (DEC-030 pattern): the DEC-045
   `ALWAYS_ON_TOPIC_IDS` core plus a couple of high-value browse topics (e.g. combat,
   layers), captured in a testable build policy. No rules text is forked or
   hand-authored — the artifact carries verbatim excerpts copied from the manifest.
3. `npm run data:build` regenerates the artifact from local inputs with graceful
   degradation (a missing/empty source keeps the prior committed artifact and does not
   break other artifact builds), consistent with the existing game-rules build.
4. The artifact is a static committed bundle (DEC-012 posture) fetched at runtime; no
   runtime rules sync and no new endpoint.

## Acceptance criteria

- [ ] Running `npm run data:build` produces
      `apps/frontend/public/data/gameRulesCoreTopics.json` containing only the
      signed-off subset ids, each with `title`, `ruleNumbers`, and the **verbatim**
      `excerpt` copied from `gameRulesByTopic.json` (no drift).
- [ ] A unit test asserts every subset id exists in `gameRulesByTopic.json` and each
      emitted `excerpt` byte-matches the manifest entry (single source of truth).
- [ ] The build degrades gracefully when the source is missing/empty (prior artifact
      preserved; other builds unaffected).
- [ ] The artifact is small (a discoverability fallback, not a full CR browser).

## Verification

```bash
npm run data:build
npm --workspace apps/frontend run test -- gameRulesCoreTopics   # or the build-policy test file
git diff --stat apps/frontend/public/data/gameRulesCoreTopics.json
```

## Files touched

- `scripts/build-game-rules.mjs` — emit the core-topics subset alongside
  `gameRulesByTopic.json` / `gameRulesRuleIndex.json`
- `apps/frontend/public/data/gameRulesCoreTopics.json` (new committed artifact)
- a build-policy unit test (frontend `lib/` or backend, mirroring
  `gameRulesBuildPolicy.test.ts`) asserting subset membership + verbatim excerpt parity

## Notes

- Independent of the backend prompt slices; parallel-ready with A/B/C.
- Frontend consumption (fetch + render + "ask about this") is Slice E.
