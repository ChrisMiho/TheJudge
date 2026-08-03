status: active

# Unified MTG Color Themes

This work package captures the proposed shared theme system, Magic-inspired presets, and customizable colorless profile.

## Refined outcome

- Replace the retired Blue/Violet/Emerald/Amber/Rose catalog with six globally shared profiles ordered White, Blue, Black, Red, Green, Colorless; Blue remains the default.
- Keep the existing four-token theme contract and global reach across every current consumer, including In-Depth Question, Quick Question, Life Tracker, portal chrome, and scanner accents.
- Give Black a near-black base with a restrained plum identity so it remains distinct from the slate shell and neutral Colorless profile.
- Let Colorless expose an inline full-spectrum picker plus Reset to gray; custom RGB is remembered but deliberately receives no contrast correction or quality guarantee.
- Delete retired persisted palette IDs instead of migrating them; unsupported selections fall back to Blue.

## Product truth

- DEC-119
- REQ-099
- FLOW-007
- NFR-011

See `DESIGN-BRIEF.md` for the approved scope, exact fixed-profile tokens, persistence behavior, and verification boundaries.

## Slice table

| Slice | Name | Depends on | Status |
| --- | --- | --- | --- |
| A | Profile catalog and persistence foundation | — | done |
| B | Colorless runtime and Theme controls | A | done |
| C | Semantic token-role normalization | B | done |
| D | Global reach, verification, and ship closure | A, B, C | done |

The package is sequential: B consumes A's resolver/storage contract, C verifies real surfaces against
the finalized runtime, and D exercises the complete implementation across all named destinations.

## Implementation map

| Slice | New files | Files edited |
| --- | --- | --- |
| A | — | `lib/theme/{palettes,themePrefs}.ts` (+ tests), theme fixture updates in `applyPalette`, `useThemePalette`, portal/App tests, `index.css` |
| B | — | `hooks/useThemePalette.ts` (+ test), `components/portal/{ThemeSection,FeaturePortalMenu}.tsx` (+ tests), `App.tsx`, `App.theming.test.tsx` |
| C | `components/portal/life-tracker/GameSetupPanel.test.tsx` if focused coverage is not already colocated | Life Tracker `GameSetupPanel`, `CounterPanel`, `PlayerLifeTrackerApp`; `ConversationThread`; representative Quick/scanner/App tests |
| D | `App.mtg-color-themes.test.tsx` | Quick, Life Tracker, portal Theme, scanner, ambient-accent, and card-identity-ring tests |

All implementation paths are relative to `apps/frontend/src/`; `index.css` is also under that root.

## Next step

All slices (A, B, C, D) are done. Continue with cleanup to promote durable PRD truth, write the
receipt, and delete this work folder.

**Cursor**

```text
/thejudge-cleanup PRD/work/unified-mtg-color-themes/
```

**Codex**

```text
$thejudge-cleanup PRD/work/unified-mtg-color-themes/
```

**Claude Code**

```text
/thejudge-cleanup PRD/work/unified-mtg-color-themes/
```
