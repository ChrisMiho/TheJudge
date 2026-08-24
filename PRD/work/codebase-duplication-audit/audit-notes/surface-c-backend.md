# Surface C — Backend

## Inventory

`git ls-files apps/backend/src | wc -l` → **162** files.

## Seeding searches run

- Repeated exported symbol names: `grep -rhoE '^export (const|function|class)
  [A-Za-z0-9_]+' apps/backend/src --include='*.ts'` — only `resolveRulingsForPrompt`
  repeats (3 hits: two TS call-signature overloads plus the implementation in
  `cardRulings.ts:130-141` — one function, not a finding).
- Repeated literal zone-name arrays: grepped `zones.ts` and `constants.ts`
  for the six/seven canonical zone strings — surfaced `CANONICAL_ZONE_ORDER`
  (cross-boundary candidate, noted below, not resolved here).
- `truncate`/`clip`/`slice(0,` sweep across `prompt/` and `commanderSpellbook/`
  — `promptFormatting.ts`'s `truncatePromptLabel` is a one-line delegation to
  `normalization.ts`'s `truncateOracleText` (healthy, not a finding);
  `formatList`/zone-join helpers are one-off single-call-site string
  formatting, below the floor.
- `429`/`isRetryable`/`shouldRetry`/backoff sweep across `providers/` — no
  hits; retry/backoff logic in this codebase lives in `scripts/`, not
  duplicated here.
- Read the rest of the inventory beyond what searches surfaced: `app/`,
  `config/`, `runtime/`, `validation/`, `errors.ts`, `commanderSpellbook/*`,
  and `providers/*` in full, to confirm no near-identical function found by
  eye that grep would have missed (env-var parsers in `config/index.ts` are
  each purpose-built with distinct validation rules; `providers/`'s three
  files are small and non-overlapping; `commanderSpellbook/zones.ts`'s two
  `Record` maps are an intentional forward/reverse pair, not a duplicate).

## Findings

No within-surface finding clears the floor. Every repeated shape found (the
`resolveRulingsForPrompt` overloads, `truncatePromptLabel`'s delegation, the
zone-map pair in `zones.ts`) resolves to one implementation on inspection,
not two independent ones.

## Cross-boundary candidate (noted for slice E, not resolved here)

**`CANONICAL_ZONE_ORDER`** is defined independently in two places:
- `apps/backend/src/constants.ts:14-21`
- `apps/frontend/src/lib/contextFlow/phaseZoneDefaults.ts:7-14`

Both arrays are `["stack", "battlefield", "hand", "graveyard", "exile",
"library", "command"]`, identical order. The frontend definition's own doc
comment reads "Matches backend zone ordering expectations" — the duplication
is already known to whoever wrote it, which is exactly the shape of risk the
brief's `PLAYER_LABELS` starting point names. This is a fourth cross-boundary
candidate beyond the brief's three named starting points; slice E's
requirement 3 ("look for any other cross-boundary pair") covers it. Backend
also derives `NON_STACK_CANONICAL_ZONE_ORDER` from its own copy
(`constants.ts:24-25`); no frontend equivalent exists.

Also noted for slice E: this surface's `apps/backend/src/constants.ts:3-12`
is the `PLAYER_LABELS` side of the brief's already-named player-label
starting point.

## Healthy reuse

- `apps/backend/src/commanderSpellbook/zones.ts:13-28` —
  `ZONE_ID_TO_COMBO_ZONE` / `COMBO_ZONE_TO_ZONE_ID` are an intentional
  forward/reverse map pair for the same lookup, not a duplicate.
- `apps/backend/src/prompt/promptFormatting.ts:39-41` — `truncatePromptLabel`
  is a thin named wrapper around `normalization.ts`'s `truncateOracleText`,
  confirming truncation logic has exactly one implementation in this surface.
- `apps/backend/src/errors.ts` — `createProviderUnavailableError` /
  `createProviderTimeoutError` / `createUnexpectedError` share a default
  message and one repeated `retryAfterSeconds: 13`, but all three delegate to
  the single `AppError` class; parallel factory functions for genuinely
  different error codes, not duplicated logic.

## Draft coverage-table row

| Directory | Files examined | Findings |
| --- | --- | --- |
| `apps/backend/src/**` | 162 | 0 (1 cross-boundary candidate flagged for slice E) |
