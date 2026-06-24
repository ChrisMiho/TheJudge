# Slice B — audio playback + mute toggle in ScanCameraSurface

## Status: done

> Verified by orchestrator (2026-06-23): `npm --workspace apps/frontend run test -- src/components/ScanCameraSurface.test.tsx`
> → 11 passed (4 new audio cases: ding-on-unmuted, no-ding-when-muted, toggle persists via `saveScanAudioMuted`,
> rejected `play()` is silent — popup still renders in all). `npm run quality:check` → exit 0 (green).
> `git ls-files --error-unmatch apps/frontend/public/assets/scanSuccess.wav` → tracked.
> `git diff --stat -- apps/frontend/src/hooks/useScanCapture.ts` → empty (unchanged). Implemented via Codex,
> diff reviewed: `<audio src="/assets/scanSuccess.wav">` primed with `audio.load()` in the camera-open effect;
> ding fired off the existing `confirmation?.id` effect behind `mutedRef` (deps unchanged); mute state seeded
> from `loadScanAudioMuted()`; top-left 🔊/🔇 toggle (`left-3 top-[4.75rem]`, `aria-pressed`/`aria-label`)
> distinct from the untouched top-right Debug button.

## Depends on: Slice A (`audioPrefs` helper)

## Goal

Play a short "ding" from the bundled WAV on each successful auto-add — fired off the existing
`confirmation?.id` effect — and add a top-left mute toggle that suppresses the sound only,
persisting via the slice-A helper (REQ-042 / DEC-061).

## Requirements

1. **Bundled audio element.** Add an `<audio>` to `ScanCameraSurface` sourced from
   `/assets/scanSuccess.wav` (the bundled `apps/frontend/public/assets/scanSuccess.wav`). No
   audio/animation library; no runtime tone synthesis.
2. **Prime on open.** Prime the element (e.g. `audio.load()`) in the existing camera-open
   effect — entering the scanner is itself the user gesture that unlocks mobile playback.
3. **Play on confirmation.** In the existing `confirmation?.id` effect, after the popup is set,
   play the ding when not muted: reset `currentTime = 0` then `play().catch(() => {})`. The
   effect stays keyed on `confirmation?.id` only (matching the popup), so a repeat add re-fires
   both popup and ding, and a mute toggle never replays a ding.
4. **Mute gates audio only.** The `setPopup(...)` call is unchanged and runs regardless of mute
   state; the thumbs-up popup is never suppressed.
5. **Silent degradation.** A blocked or failed `play()` must never throw, pause, or block
   scanning, and must not change scan state.
6. **Mute toggle UI.** A speaker/mute icon button **top-left**, paired with the convergence
   status indicator, with `aria-pressed` and an `aria-label`. Default **ON / unmuted** (sound
   plays). The top-right cluster — `ScanReviewBubble` and the `Debug` toggle (`right-3 top-3`)
   — is not moved or restyled.
7. **State + persistence.** Mute is local component state seeded from `loadScanAudioMuted()` on
   mount; toggling calls `saveScanAudioMuted(next)`. Read the flag via a ref inside the play
   effect so toggling does not re-run it. `useScanCapture.ts` is **not** modified.
8. **Track the asset.** `git add apps/frontend/public/assets/scanSuccess.wav` (currently
   untracked).
9. **Tests.** Extend `ScanCameraSurface.test.tsx` (do not replace existing cases); spy on the
   already-mocked `HTMLMediaElement.prototype.play`.

## Acceptance criteria

- [ ] On a `confirmation` change with mute OFF, `HTMLMediaElement.prototype.play` is called.
- [ ] On a `confirmation` change with mute ON, `play` is **not** called.
- [ ] The thumbs-up popup (`Added <cardName>`) renders on a `confirmation` change regardless of
      mute state.
- [ ] A mute toggle button is present top-left with an accessible label / `aria-pressed`;
      clicking it flips the muted state.
- [ ] With `loadScanAudioMuted()` returning `true`, a freshly rendered surface starts muted
      (no `play` on the next confirmation).
- [ ] Toggling mute calls `saveScanAudioMuted` with the new value.
- [ ] A rejected `play()` (mock rejects) does not surface an error or change status.
- [ ] The `Debug` toggle and scanned-cards review bubble remain top-right and unchanged.
- [ ] `apps/frontend/public/assets/scanSuccess.wav` is tracked by git.

## Verification

```bash
npm --workspace apps/frontend run test -- src/components/ScanCameraSurface.test.tsx
git ls-files --error-unmatch apps/frontend/public/assets/scanSuccess.wav   # asset tracked
git diff --stat -- apps/frontend/src/hooks/useScanCapture.ts               # expect empty (unchanged)
npm run quality:check
```

## Files touched

- `apps/frontend/src/components/ScanCameraSurface.tsx`
- `apps/frontend/src/components/ScanCameraSurface.test.tsx`
- `apps/frontend/public/assets/scanSuccess.wav` (track existing untracked asset)

## PRD promotion checklist (executed in `thejudge-cleanup`)

- [ ] `sections/functional-requirements.md` — REQ-042 stays as shipped acceptance truth (no edit
      expected beyond status signalling, which lives in the system map, not the REQ).
- [ ] `sections/decisions.md` — DEC-061 unchanged (`confirmed`); the doc-lifecycle gate forbids
      using `Status:` to express shipped-vs-planned.
- [ ] `sections/system-map.md` — flip the `Scan audio confirmation` entry under Card scanning
      from `planned` to `shipped`.
- [ ] `sections/user-flows.md` — FLOW-006 step 4 reflects the now-shipped ding (drop any
      "planned"/forward-reference wording for the audio cue).
- [ ] Write receipt `PRD/instructions/receipts/scan-audio-confirmation-<YYYY-MM-DD>.md`.
- [ ] Delete `PRD/work/scan-audio-confirmation/`.

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/scan-audio-confirmation/` ready to delete
