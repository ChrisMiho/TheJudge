# DESIGN-BRIEF — scan-audio-confirmation

## Goal

Ship the audio half of the scan auto-add confirmation feedback: a short "ding" on each
successful hands-free auto-add, on by default, with a mute toggle on the scan screen.
Realizes the audio half deferred out of DEC-057. Frontend-only.

## Scope

- Play a short "ding" on each successful auto-add, fired off the **same** monotonic
  `ScanAddConfirmation.id` event that already drives the visual thumbs-up popup in
  `ScanCameraSurface.tsx` — sound and popup fire together; a repeat add of the same card
  re-fires both.
- Played from the bundled static asset `apps/frontend/public/assets/scanSuccess.wav`
  (served at `/assets/scanSuccess.wav`), a short 16-bit mono PCM WAV. No audio or animation
  library; no runtime tone synthesis.
- **Mute toggle**: a speaker/mute icon button **top-left** on the scan screen, paired with
  the convergence status indicator. Default **ON** (sound plays). Leaves the top-right cluster
  (scanned-cards review bubble + Debug toggle) untouched.
- Muting suppresses **audio only** — the visual thumbs-up popup is unaffected.
- **Persistence**: mute preference persists across reloads via `localStorage` — the first
  `localStorage` use in the repo, isolated in a small dedicated helper
  `apps/frontend/src/lib/scan/audioPrefs.ts` (load/save) with its own unit test. A corrupt or
  unavailable store falls back to the default (unmuted) and never throws.
- **Audio unlock**: mobile browsers gate playback on a prior user gesture; entering the scanner
  is itself a tap, so the audio element is primed on scanner open. A blocked/failed play degrades
  silently — never throws, never pauses or blocks scanning.

## Key decisions

- **DEC-061** — Each successful scan auto-add plays a short "ding", on by default, with a mute
  toggle; muting suppresses sound only, never the visual confirmation. Persists across reloads
  via `localStorage`. Realizes the audio half deferred out of DEC-057.
- Persistence model: **persist across reloads** (chosen over per-session in-memory or ephemeral
  per-open) — a mute preference is the kind of setting users expect to stick.
- Toggle placement: **top-left, near the status indicator** (chosen over bottom control bar or
  top-right stacked) — keeps the already-crowded top-right clear.
- Audio is **functional confirmation feedback, not animation** — explicitly outside the NFR-006
  carve-out (which governs popup motion only); no carve-out and no library needed for audio.

## Non-goals

- No change to the visual thumbs-up popup, the three-state convergence indicator, the stabilizer
  or lock/convergence logic, the add path, or any owner/duplicate-block/stack-limit/removal logic.
- No change to `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly
  (`buildPromptContext`/`buildPromptText`), the provider boundary, or any product-facing endpoint.
- No volume control, no per-zone or per-card sound variation, no device-silent-switch detection
  (not reliably available on the web platform; the in-app mute is the control).
- No audio library, no animation library, no runtime tone synthesis.

## PRD references

- Decisions: **DEC-061** (this package), DEC-057 (the deferral source), DEC-056 (hands-free
  auto-add this confirms), DEC-058 (one-tap removal — the wrong-add safety net)
- Requirements: **REQ-042** (audio confirmation acceptance criteria), REQ-040 (responsive scan
  experience; its audio bullet now points here), NFR-006 (popup-motion carve-out — audio is
  outside it), NFR-010 (scan performance budget), NFR-001 (mobile-first)
- Flows: FLOW-006 step 4 (scan-into-zone; ding now plays unless muted)
- System map: `Scan audio confirmation` entry under Card scanning (status `planned` until ship)

## Implementation anchors (non-binding)

- Trigger point: the `confirmation?.id` effect in
  `apps/frontend/src/components/ScanCameraSurface.tsx` (currently fires the popup only).
- New helper: `apps/frontend/src/lib/scan/audioPrefs.ts` (load/save mute preference) + unit test.
- Mute state likely threads through `apps/frontend/src/hooks/useScanCapture.ts` and/or
  `ScanCameraSurface.tsx`; reuse existing scan plumbing rather than adding a new store.
- Asset already present: `apps/frontend/public/assets/scanSuccess.wav` (untracked — commit it).
