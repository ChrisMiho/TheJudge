# IDEA — scan-audio-confirmation

**Problem:** With hands-free auto-add (DEC-056), each scanned card lands without a tap. The `scan-ux-responsiveness` package ships a visual thumbs-up popup as confirmation, but at a live table a player's eyes are on the cards, not the screen — an audio cue confirms an add without requiring the user to watch the screen. DEC-057 specified both a visual popup and an audio "ding"; the audio half was deferred to keep `scan-ux-responsiveness` scoped to visual-only.

**Outcome:** A short "ding" plays on each successful auto-add, on by default, with a simple mute toggle on the scan screen. Muting suppresses sound without suppressing the visual confirmation. Played from a bundled audio asset (`apps/frontend/public/assets/scanSuccess.wav`, served at `/assets/scanSuccess.wav`) — a short 16-bit mono PCM WAV.

**Non-goals:** No change to the visual confirmation popup, the stabilizer/lock logic, the add path, or any backend/API/prompt/`GameContext` boundary (DEC-050). No animation/audio library; no runtime tone synthesis. Frontend-only.

**References:** DEC-057 (confirmation-feedback decision — audio half), REQ-040 (audio acceptance criterion), NFR-006 (functional carve-out), and the visual half shipped under `PRD/work/scan-ux-responsiveness/`.
