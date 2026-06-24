# GAMEPLAN — scan-audio-confirmation

Realizes **REQ-042 / DEC-061**: a short "ding" on each successful hands-free auto-add,
on by default, with a mute toggle top-left on the scan screen. Frontend-only. See
[DESIGN-BRIEF.md](./DESIGN-BRIEF.md) for product truth and non-goals.

## Architecture

Two pieces, both inside the existing scan camera surface — no new store, no library, no
runtime synthesis:

1. **Persistence helper** — `apps/frontend/src/lib/scan/audioPrefs.ts`. The repo's first
   `localStorage` use, isolated here. `loadScanAudioMuted()` / `saveScanAudioMuted()` with a
   single key. Corrupt, missing, or unavailable store → default **unmuted** (`false`),
   never throws.

2. **Audio + toggle in `ScanCameraSurface.tsx`** — a bundled `<audio>` element sourced from
   `/assets/scanSuccess.wav`, primed on scanner open, played off the **same**
   `confirmation?.id` effect that already drives the thumbs-up popup. A speaker/mute icon
   button top-left, paired with the convergence status indicator. Mute state is **local
   component state** seeded from `audioPrefs.load()` on mount and written back on toggle.

### Why mute state stays local to `ScanCameraSurface`

Both consumers of the mute flag — the toggle button and the audio playback effect — live in
`ScanCameraSurface`. `audioPrefs` already carries the value across mounts/reloads, so
threading it through `useScanCapture` or a new store would add plumbing with no consumer
outside the surface. `useScanCapture.ts` is **not modified** by this package.

## Data flow

```
scanner open (a user tap)
  └─ <audio src="/assets/scanSuccess.wav"> primed (load) in the camera-open effect

successful auto-add (useScanCapture, UNCHANGED)
  └─ setAddConfirmation({ id: ++counter, cardName })   ← existing
       └─ ScanCameraSurface confirmation?.id effect (existing):
            ├─ setPopup(...) → thumbs-up popup            ← UNCHANGED (never gated by mute)
            └─ if (!mutedRef.current) audio.play().catch(() => {})   ← NEW, silent on failure

mute toggle (top-left button, NEW)
  └─ setMuted(next); saveScanAudioMuted(next)
       (read via mutedRef inside the play effect so toggling never replays a ding)
```

Mute is read through a ref inside the play effect; the effect stays keyed on
`confirmation?.id` only, mirroring the popup effect, so a mute/unmute never re-fires sound and
a repeat add of the same card re-fires both popup and ding.

## Key implementation notes

- **Priming:** call `audio.load()` (or set `src`) in the existing camera-open effect — entering
  the scanner is itself the unlocking gesture. Reset `currentTime = 0` before each `play()` so
  rapid adds retrigger cleanly.
- **Silent degradation:** every `play()` is `.catch(() => {})`; a blocked/failed play must never
  throw, pause, or block scanning. No state change on failure.
- **Mute gates audio only:** the `setPopup` line is untouched and runs regardless of mute.
- **Asset:** `apps/frontend/public/assets/scanSuccess.wav` exists but is **untracked** — track it
  (`git add`) as part of slice B; served at `/assets/scanSuccess.wav` by Vite static serving.
- **Top-right cluster untouched:** the scanned-cards review bubble (`ScanReviewBubble`, rendered
  by `ZoneCardPicker`) and the `Debug` toggle (`right-3 top-3`) are not moved or restyled.
- **Test env:** `ScanCameraSurface.test.tsx` already mocks `HTMLMediaElement.prototype.play`
  (jsdom has no real playback). Spy on it to assert ding-on/ding-off.

## Verification checklist

- [ ] `apps/frontend/src/lib/scan/audioPrefs.ts` exists with load/save; unit test covers default,
      round-trip, corrupt value, and throwing/unavailable store.
- [ ] Ding plays on `confirmation` change when unmuted; does not play when muted.
- [ ] Thumbs-up popup renders on `confirmation` regardless of mute state.
- [ ] Mute toggle is top-left, paired with the status indicator; `Debug` toggle and review
      bubble (top-right) unchanged.
- [ ] Toggle persists: a remount reads the saved preference.
- [ ] Failed/blocked `play()` does not throw or change scan state.
- [ ] `scanSuccess.wav` is tracked in git.
- [ ] `useScanCapture.ts`, the stabilizer, lock/convergence logic, and the add path are unchanged.
- [ ] No backend / `AskAiRequest` / Zod / `GameContext` / prompt / endpoint changes.
- [ ] `npm --workspace apps/frontend run test` green; `npm run quality:check` green for touched areas.

## Slices

| Slice | Objective | Depends on |
| --- | --- | --- |
| A | `audioPrefs` localStorage persistence helper + unit test | — |
| B | Audio playback + mute toggle in `ScanCameraSurface`; track asset | A |

Slice B is the final slice and carries the PRD promotion checklist and Ship gates.
