# Slice A — Blue scene personality

## Status: done

## Goal

Restore connected desktop Blue constellations and varied simple large inscriptions.

## Requirements

Implement DESIGN-BRIEF.md; preserve other scenes, small runes, frame timing, reduced motion, fallback, decorative semantics and tray link suppression. Dependency: none; one integrated renderer slice.

## Acceptance criteria

- [x] A1 — Renderer tests cover desktop links, mobile baseline, resize, diversity, containment, lifecycle and cleanup.
- [x] A2 — Shared-chrome and REQ-207 describe the implemented Blue presentation.
- [x] A3 — Quality gate and production build pass.
- [x] A4 — Browser checks at 390×844, 1280×800, 1440×900 and 1920×1080 plus Menu tray confirm restrained shapes, readable panels, no overflow, reduced motion and frame pacing.
- [x] A5 — Browser closed, owned frontend server stopped and port released; captures reside in PRD/work/blue-ambient-personality/.playwright-mcp/.

## Verification

`npm --workspace apps/frontend run test -- src/components/AmbientScene.test.tsx`
`npm run quality:check`
`npm run build`
Browser scenarios from A4 and cleanup from A5.

## Files touched

- apps/frontend/src/components/AmbientScene.tsx
- apps/frontend/src/components/AmbientScene.test.tsx
- apps/frontend/src/lib/theme/blueInscription.ts
- PRD/sections/shared-chrome/README.md
- PRD/sections/functional-requirements.md
- PRD/work/blue-ambient-personality/*
- PRD/work/STATUS.md

## PRD promotion checklist

Shared-chrome / REQ-207 applied with code; no DEC entry. Retain work package for review; cleanup writes receipt and deletes it after shipping.

## Ship gates

- [x] Slice acceptance criteria satisfied and verified
- [x] Tests updated; npm run quality:check green for touched areas
- [x] Public contract unchanged unless slice scoped a change
- [x] No secrets committed
- [x] Durable outcomes promoted; work package ready to delete
