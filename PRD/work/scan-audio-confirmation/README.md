---
status: active
---

# scan-audio-confirmation

Add the audio half of the scan auto-add confirmation feedback: a short "ding" on each successful auto-add, on by default with a mute toggle on the scan screen. Played from a bundled audio asset (`apps/frontend/public/assets/scanSuccess.wav`). Split out of `scan-ux-responsiveness`, which ships the visual thumbs-up popup only. Frontend-only.

See [IDEA.md](./IDEA.md) for the captured problem and scope.

## Status

- active — all slices done (A + B). Next: `thejudge-cleanup` to promote PRD truth, write the receipt, and delete this folder.

## Slices

| Slice | Doc | Objective | Depends on | Status |
| --- | --- | --- | --- | --- |
| A | [slice-a-audio-prefs.md](./slice-a-audio-prefs.md) | `audioPrefs` localStorage persistence helper + unit test | — | done |
| B | [slice-b-audio-toggle.md](./slice-b-audio-toggle.md) | Audio playback + mute toggle in `ScanCameraSurface`; track asset | A | done |

Slice B is the final slice (PRD promotion checklist + Ship gates).

## Implementation map

| Area | Path | Change |
| --- | --- | --- |
| Persistence helper | `apps/frontend/src/lib/scan/audioPrefs.ts` (+ `.test.ts`) | new — load/save mute pref, safe fallback |
| Audio + toggle | `apps/frontend/src/components/ScanCameraSurface.tsx` (+ `.test.tsx`) | ding on `confirmation?.id`; top-left mute toggle |
| Asset | `apps/frontend/public/assets/scanSuccess.wav` | track existing untracked WAV |
| Unchanged | `apps/frontend/src/hooks/useScanCapture.ts`, stabilizer, add path, backend | no edits |

## PRD references

- Decision: DEC-061 (this package — audio "ding" + mute toggle, on by default, persisted), DEC-057 (the deferral source; visual half shipped under `scan-ux-responsiveness`)
- Requirement: REQ-042 (audio confirmation acceptance criteria), REQ-040 (responsive scan experience; its audio bullet now points here)
- Non-functional: NFR-006 (governs popup motion only — audio is outside it), NFR-010 (scan performance budget), NFR-001 (mobile-first)
- Flow: FLOW-006 step 4 (ding now plays unless muted)
