# Quality check — small-fixes-cats-menu-white

Run `graph-20261014-225350`, node `gate-qc`, attempt 2, 2026-10-14. Mode: graph is controlling.

**Verdict: FAIL** — two new findings, both small and fixable in `DESIGN-BRIEF.md` (no product-truth change, `GATE-QUESTIONS.md` unchanged). Marker set to `STATUS.refining`.

## Attempt 1 findings: all four verified resolved in the files

1. Default pin test: the brief now names the whole `palettes.test.ts` test (title, line 77, line 80) and the `App.mtg-color-themes.test.tsx:171` title. Both lines confirmed in the code. Resolved.
2. `tokens.css` split: the brief says `[data-profile="blue"]` keeps its six values and a separate `:root` takes White's six, and lists them. Matches `tokens.css` lines 41-58 exactly. Resolved (but see new finding A on ordering).
3. First-paint test: specified in `applyPalette.test.ts`, which does read `tokens.css` and `index.html` as text (lines 14-15; a theme-color test exists at line 86). Placeholder exception for REQ-219/REQ-216 stated (A9). Resolved.
4. Testability: a `compareDocumentPosition` placement test and a `shell.css` stylesheet assertion for the tray are now named, with the live measurement kept as verification. `.menu-tray` has `overflow-y: auto` and `.menu-tray::after` has `right: -1px` as described. Resolved.

## What was checked and held

- Diff removed-lines and code claims from attempt 1 stand; the brief edit did not touch `GATE-QUESTIONS.md`.
- Default-pin test census: `DEFAULT_PALETTE_ID` users (`themePrefs.test.ts`, `useThemePalette.test.ts`, the rest of `App.mtg-color-themes.test.tsx`) follow the constant; `App.theming.test.tsx:134` only clicks "Theme: Blue" and is not a default pin; `appliedTheme.ts:20` is named.
- Screen-layout catalog: no new screen or overlay, no row needed. Technical-design rules: frontend/presentation only.

## Findings (return to refinement)

A. **`:root` block order is unspecified, and equal specificity makes it matter.** `:root` and `[data-profile="x"]` both have specificity (0,1,0), so the later rule wins. If the new White `:root` block lands after the profile blocks, every colour paints White. Neither the first-paint test (compares values only) nor jsdom tests (no cascade) catch it, and the live check only covers a fresh White visit. Say the new `:root` block stays at the top, before every `[data-profile]` block, and add a stylesheet assertion that its offset precedes `[data-profile="blue"]` (or that each profile block comes after it), plus a live check that Blue and one other colour still paint their own values.

B. **A second "blue" default fallback is not dispositioned.** `apps/frontend/src/components/AmbientScene.tsx:550-552` falls back to `'blue'` (`dataset.profile || 'blue'`, `RECIPES.blue`, `SCENES.blue`) when no `data-profile` is set yet. It runs before `applyPalette` on a first visit (the tray scene mounts in `FeaturePortalMenu`), until the MutationObserver at line 622 restarts it. The brief's pre-start surface list (A7) and Touches list do not mention it. Decide and record it: change the fallback to White (and add the file to Touches with a test), or state it is a one-frame transient left alone because the observer corrects it.

## Not findings

- `PRD/sections/` unchanged and `GATE-QUESTIONS.md` unedited: by design.
- The desktop tray shape gap is recorded in non-goals as a pre-existing follow-up.
