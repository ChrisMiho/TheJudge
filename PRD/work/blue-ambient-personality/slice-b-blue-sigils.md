# Slice B — Quieter Blue sigils

## Status: done

## Goal

Restore Blue’s mystical character through fewer links and larger versions of its own invented script.

## Requirements

Use the revised DESIGN-BRIEF.md. Dependency: A done, because B tunes the renderer introduced there. Preserve A’s timing, accessibility, reduced-motion, fallback and page/tray resize behavior. Existing small runes remain unchanged; their dictionary is shared with larger sigils.

## Acceptance criteria

- [x] B1 — Desktop connections are a modest lift above the original; small glyphs, phone and other-colour baselines remain intact.
- [x] B2 — Six sparse invented sigils reuse Blue’s glyph vocabulary, optionally framed by a broken arc; variety, containment and lifecycle tests pass.
- [x] B3 — Shared-chrome and REQ-207 match the revised presentation; quality gate and build pass.
- [x] B4 — Browser review confirms quieter desktop connections and glyph-derived large forms at 390×844, 1280×800, 1440×900, 1920×1080 and in the tray, with readable panels and reduced-motion still rendering.
- [x] B5 — Verification browser closed; owner-requested review runtime left running by explicit request; captures recorded under this work package.

## Verification

`npm --workspace apps/frontend run test -- src/components/AmbientScene.test.tsx`
`npm run quality:check`
`npm run build`
Browser checks and cleanup per B4/B5.

## Files touched

- apps/frontend/src/components/AmbientScene.tsx
- apps/frontend/src/components/AmbientScene.test.tsx
- apps/frontend/src/lib/theme/blueInscription.ts
- PRD/sections/shared-chrome/README.md
- PRD/sections/functional-requirements.md
- PRD/work/blue-ambient-personality/* (preserve slice A artifacts)
- PRD/work/STATUS.md

## PRD promotion checklist

Apply final shared-chrome / REQ-207 intent in B; keep package for owner PR review and later cleanup. No new DEC.

## Ship gates

- [x] Slice acceptance criteria satisfied and verified
- [x] Tests updated; quality gate green
- [x] Public contract unchanged
- [x] No secrets committed
- [x] Durable truth updated; package ready for cleanup after shipping

Verification evidence: `slice-b.evidence.md`.
