# Slice B — Runtime catalog loader and config flag

## Status: done

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

- [x] Both artifact paths absent → `loadComboCatalog` returns the empty result,
      warns exactly once per path, and the app starts and answers normally
- [x] Same paths absent across two `loadComboCatalog` calls in one process →
      still exactly one warning per path
- [x] Malformed JSON, an empty file, and a valid-JSON-wrong-shape artifact each
      produce the empty result plus one warning, never a thrown error
- [x] A fixture variant with `steps: null` (or null mana/prereqs/card state) is
      treated as an integrity failure: warn once, enrichment disabled
- [x] `readServerConfig({})` returns `comboEnrichmentEnabled: true`
- [x] `readServerConfig({ COMBO_ENRICHMENT_ENABLED: "false" })` returns `false`;
      casing and surrounding whitespace are normalized as with `ASK_AI_PROVIDER`
- [x] With the flag false, `createConfiguredApp` never reads either artifact file
      and `PreparePromptInputOptions.comboCatalog` is `undefined`
- [x] Two `createConfiguredApp` calls in one process with different env objects
      yield one app with the catalog and one without — no module-load latch
- [x] `POST /api/ask-ai` request/response bodies are byte-identical with the flag
      on and off when no variant matches
- [x] Artifact size and parse duration recorded in verification evidence

## Verification evidence

Recorded 2026-08-11 on the implementation worktree.

- `npm --workspace apps/backend run test -- commanderSpellbook config createConfiguredApp`
  — 38/38 pass across `catalog.test.ts` (11), `config/index.test.ts` (22),
  `runtime/createConfiguredApp.test.ts` (5).
- `npm --workspace apps/backend run typecheck` — clean.
- The "never reads either artifact" assertion is enforced by mocking `node:fs`
  and recording every `existsSync` / `readFileSync` path, so a future refactor
  that loads eagerly fails the test rather than passing silently.

### Cold-start measurement (GAMEPLAN corpus-size risk)

Measured with a synthetic corpus in the real artifact shape (3 ingredients per
variant, one multi-zone with two card-state strings), loaded through the compiled
`loadComboCatalog` with full integrity validation. Median of 5 runs:

| Variants | Detail artifact | Index artifact | `loadComboCatalog` |
|---|---|---|---|
| 10,000 | 11.04 MB | 0.93 MB | 28 ms |
| 30,000 | 33.13 MB | 1.84 MB | 75 ms |

Startup cost is a one-time 28–75 ms, which does not by itself justify
restructuring. The notable figure is the **detail artifact's size**: it grows
roughly linearly at ~1.1 MB per 1,000 variants, while the index — the only part
matching actually needs — stays under 2 MB even at 30,000.

No optimization is applied here, per the GAMEPLAN's "measure in slice B before
optimizing". If the owner-approved production refresh lands a corpus at the upper
end of that range, the recorded lever is available: keep loading the index
eagerly and narrow the detail artifact to selected variants. That would be a new
decision, not a silent change.

### Reuse note

`COMBO_ENRICHMENT_ENABLED` parsing did not get a new ad-hoc parser. The
`TRUE_VALUES` / `FALSE_VALUES` logic duplicated between
`resolveDebugLoggingEnabled` and `resolvePayloadLoggingEnabled` was extracted
into an exported `resolveBooleanEnv(rawValue, envName, defaultEnabled)` in
`logging.ts`; both existing helpers now delegate to it with identical behavior
and identical error-message shape, and the new flag is a third caller.

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
