# Slice A — audioPrefs localStorage persistence helper

## Status: done

> Verified by orchestrator: `npm --workspace apps/frontend run test -- src/lib/scan/audioPrefs.test.ts`
> → 6 passed; `grep -rn localStorage apps/frontend/src | grep -v audioPrefs` → no matches; typecheck
> and `eslint` clean on both files. (Codex's test used an inline `@vitest-environment` docblock that
> broke under this project's opaque-origin jsdom env; the orchestrator rewrote the test to stub an
> in-memory `localStorage` via `vi.stubGlobal`, matching `loadScanMap.test.ts`.)

## Goal

Provide a small, isolated helper that loads and saves the scan-audio mute preference in
`localStorage`, defaulting to **unmuted** and never throwing — the repo's first and only
`localStorage` touchpoint (REQ-042 / DEC-061).

## Requirements

1. New file `apps/frontend/src/lib/scan/audioPrefs.ts` exporting:
   - `loadScanAudioMuted(): boolean` — returns the persisted mute preference; returns `false`
     (unmuted default) when the value is absent, corrupt/unrecognized, or `localStorage` is
     unavailable or throws.
   - `saveScanAudioMuted(muted: boolean): void` — persists the preference; swallows any error
     so a write failure never throws.
2. Use a single, namespaced storage key (e.g. `thejudge.scan.audioMuted`) defined once in the
   module.
3. Both functions are wrapped so a throwing/unavailable `localStorage` (private mode, quota,
   blocked) degrades silently — `load` falls back to the default, `save` is a no-op.
4. No dependency on React, the scan hook, or any audio API; pure module.

## Acceptance criteria

- [ ] `loadScanAudioMuted()` returns `false` when nothing is stored.
- [ ] After `saveScanAudioMuted(true)`, `loadScanAudioMuted()` returns `true` (round-trip);
      after `saveScanAudioMuted(false)`, it returns `false`.
- [ ] A corrupt/unrecognized stored value yields `false` (default), not a throw.
- [ ] When `localStorage` access throws (getItem/setItem stubbed to throw), `loadScanAudioMuted()`
      returns `false` and `saveScanAudioMuted(...)` does not throw.
- [ ] No other repo file references `localStorage` after this slice.

## Verification

```bash
npm --workspace apps/frontend run test -- src/lib/scan/audioPrefs.test.ts
# confirm localStorage stays confined to the helper:
grep -rn "localStorage" apps/frontend/src | grep -v "audioPrefs"   # expect no matches
```

## Files touched

- `apps/frontend/src/lib/scan/audioPrefs.ts` (new)
- `apps/frontend/src/lib/scan/audioPrefs.test.ts` (new)
