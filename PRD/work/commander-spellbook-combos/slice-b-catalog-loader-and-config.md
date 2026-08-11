# Slice B — Runtime catalog loader and config flag

## Status: planned

## Goal

Load the committed combo artifacts once at startup behind a runtime config flag,
failing open on every artifact problem.

## Requirements

1. `apps/backend/src/commanderSpellbook/catalog.ts` exports the artifact types and
   `loadComboCatalog(detailPath, indexPath)`, following `gameRules.ts`'s pattern:
   `existsSync` guard, `JSON.parse` in try/catch, `warnOnce` keyed by file path,
   and an empty/undefined result on any failure.
2. Missing, empty, or malformed artifacts disable combo enrichment only, emit one
   diagnostic warning per process per path, and leave the normal Ask AI path
   untouched.
3. Because the corpus is `OK`-only, a loaded variant with null steps,
   prerequisites, mana needed, or card state is an **artifact-integrity failure**
   handled exactly like a corrupt artifact — warn once and disable enrichment.
   Do not silently skip the offending variant.
4. `readServerConfig` in `apps/backend/src/config/index.ts` gains
   `comboEnrichmentEnabled: boolean` parsed from `COMBO_ENRICHMENT_ENABLED`,
   defaulting to `true`. Parsing follows the existing boolean-env helpers in
   `logging.ts` rather than a new ad-hoc parser.
5. `createConfiguredApp` loads the catalog only when the flag is enabled and
   passes it to `createApp`, which threads it into `PreparePromptInputOptions` as
   an optional `comboCatalog` — the same shape `cardRulingsIndex` and
   `gameRulesTopics` already use. A disabled flag means the option is simply
   absent; no downstream branch learns why.
6. Measure the loaded artifact's size and parse cost and record it in verification
   evidence, so the GAMEPLAN's cold-start risk is answered with a number before
   any optimization is considered.

## Acceptance criteria

- [ ] Both artifact paths absent → `loadComboCatalog` returns the empty result,
      warns exactly once per path, and the app starts and answers normally
- [ ] Same paths absent across two `loadComboCatalog` calls in one process →
      still exactly one warning per path
- [ ] Malformed JSON, an empty file, and a valid-JSON-wrong-shape artifact each
      produce the empty result plus one warning, never a thrown error
- [ ] A fixture variant with `steps: null` (or null mana/prereqs/card state) is
      treated as an integrity failure: warn once, enrichment disabled
- [ ] `readServerConfig({})` returns `comboEnrichmentEnabled: true`
- [ ] `readServerConfig({ COMBO_ENRICHMENT_ENABLED: "false" })` returns `false`;
      casing and surrounding whitespace are normalized as with `ASK_AI_PROVIDER`
- [ ] With the flag false, `createConfiguredApp` never reads either artifact file
      and `PreparePromptInputOptions.comboCatalog` is `undefined`
- [ ] Two `createConfiguredApp` calls in one process with different env objects
      yield one app with the catalog and one without — no module-load latch
- [ ] `POST /api/ask-ai` request/response bodies are byte-identical with the flag
      on and off when no variant matches
- [ ] Artifact size and parse duration recorded in verification evidence

## Verification

```bash
npm --workspace apps/backend run test -- commanderSpellbook config createConfiguredApp
npm --workspace apps/backend run typecheck
```

Vitest suites use outermost `describe("Backend - Ask AI", …)` for the catalog and
wiring, `describe("Backend - Shared", …)` for `readServerConfig` (matching the
existing `config/index.test.ts`).

## Files touched

- `apps/backend/src/commanderSpellbook/catalog.ts` (new)
- `apps/backend/src/commanderSpellbook/catalog.test.ts` (new)
- `apps/backend/src/config/index.ts`
- `apps/backend/src/config/index.test.ts`
- `apps/backend/src/runtime/createConfiguredApp.ts`
- `apps/backend/src/app/createApp.ts`
- `apps/backend/src/prompt/preparation.ts` (option plumbing only)
