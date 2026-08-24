# Surface B — Frontend lib, types, and styles

## Inventory

- `git ls-files apps/frontend/src/lib apps/frontend/src/types apps/frontend/src/test | wc -l`
  → **136**.
- Top-level `apps/frontend/src/*` files in scope (App.tsx + its co-located
  `App.*.test.tsx` files, `main.tsx`, `types.ts`, `index.css`):
  `git ls-files 'apps/frontend/src/App*' apps/frontend/src/main.tsx
  apps/frontend/src/types.ts apps/frontend/src/index.css | wc -l` → **23**
  (19 `App.*.test.tsx` files + `App.tsx` + `main.tsx` + `types.ts` +
  `index.css`; corrected during slice E's coverage reconciliation — the
  original slice B pass mis-added this line to 22).
- **Total for this surface: 159.**

## Seeding searches run

- Repeated exported symbol names:
  `grep -rhoE '^export (const|function) [A-Za-z0-9_]+'
  apps/frontend/src/lib apps/frontend/src/types` — surfaced `saveDraft` /
  `loadDraft` (3 hits: TS overload pair + implementation, one function, not
  a finding) and `CARD_WIDTH` / `CARD_HEIGHT` (2 hits each, real duplicate
  definitions — F-01 below).
- Repeated magic-number `Math.max`/`Math.min` clamps across `lib/scan/**` —
  each site clamps a different quantity (frame coordinates, attempt counts,
  byte values); no shared "clamp to card/frame bounds" need found below the
  floor of two independent same-need implementations.
- `localStorage` call sites: `grep -rln localStorage apps/frontend/src/lib`
  — 5 modules, of which `lifeTracker/persistence.ts` and
  `conversationHistory/persistence.ts` route through a private `getStorage()`
  helper and `scan/audioPrefs.ts` / `theme/themePrefs.ts` guard each call
  inline — F-02 below.
- Read the four `*Policy.test.ts` files in this surface
  (`cardRulingsTransformPolicy.test.ts`, `gameRulesBuildPolicy.test.ts`,
  `metadataTransformPolicy.test.ts`, `scryfallRefreshPolicy.test.ts`) and
  `apps/frontend/src/lib/scan/recipe.ts` for this surface's own within-surface
  findings; their cross-boundary verdict against `scripts/*.mjs` is slice E's,
  per this slice's requirement 7 — not resolved here.

## Findings

### F-01: Card pixel dimensions defined twice in `lib/scan`

**Need:** The canonical width/height (in pixels) of a normalized card image,
used by both the live-capture detector and the offline hash builder.

**Locations:**
- `apps/frontend/src/lib/scan/detector.ts:3-4` — `export const CARD_WIDTH =
  745` / `export const CARD_HEIGHT = 1040`
- `apps/frontend/src/lib/scan/identify.ts:21-22` — `export const CARD_WIDTH =
  745;` / `export const CARD_HEIGHT = 1040;`

**Verdict:** accidental. The values are identical today, but the two
constants are independent declarations, not one imported from the other.
Consumers split cleanly by which copy they import:
`detector.ts`'s copy feeds `ScanCameraSurface.tsx`, `ScanDebugOverlay.tsx`,
and the detector's own test suite; `identify.ts`'s copy feeds
`scripts/build-card-hashes.mjs` (imported directly from the `.ts` source, a
cross-boundary consumer — noted for slice E, not resolved here).

**Consolidation:** keep one definition (candidate home:
`apps/frontend/src/lib/scan/types.ts`, already the shared type home for this
directory) and have both `detector.ts` and `identify.ts` import it. Touches 2
lib files plus the new/host module; ripples to no call site since the
exported names are unchanged.

**Size:** small.

**Complexity removed:** 2 independent declarations of a physical constant
that must stay bit-identical for the detector's card-corner geometry and the
hash builder's crop region to agree; nothing enforces that today beyond both
authors having typed the same two numbers. This is the same shape of risk
the brief's perceptual-hash starting point names for `recipe.ts` — a sibling
instance one directory over.

### F-02: Safe-localStorage access reimplemented per module, two different ways

**Need:** Read or write one `localStorage` key without letting a disabled
storage API (privacy mode, quota, non-browser test environment) throw and
crash the caller.

**Locations:**
- `apps/frontend/src/lib/lifeTracker/persistence.ts:107-112` — private
  `getStorage(): Storage | null` (`try { return globalThis.localStorage ??
  null } catch { return null }`)
- `apps/frontend/src/lib/conversationHistory/persistence.ts:32-37` — private
  `getStorage(): Storage | null`, byte-for-byte identical body to the above
- `apps/frontend/src/lib/scan/audioPrefs.ts:5-18` — `loadScanAudioMuted` /
  `saveScanAudioMuted`, each wrapping its own single `localStorage.getItem`
  / `.setItem` call in its own `try`/`catch`
- `apps/frontend/src/lib/theme/themePrefs.ts:6-59` — four separate functions
  (`loadThemePaletteId`, `saveThemePaletteId`, `loadColorlessCustomRgb`,
  `saveColorlessCustomRgb`), each with its own inline `try`/`catch` around a
  single `localStorage` call

**Verdict:** accidental. Four modules solve the identical problem two
different ways — a shared accessor function in two of them, ad hoc inline
guards in the other two — which is stronger evidence of independent
reinvention than if all four had copy-pasted one shape: nobody was working
from a shared reference, each author separately concluded "this call needs a
try/catch."

**Consolidation:** one small `safeLocalStorage` module (candidate home:
`apps/frontend/src/lib/storage.ts`, new file) exporting a guarded
`getItem`/`setItem`/`removeItem` (or a `getStorage()` accessor, matching the
existing two-adopter shape) that all four modules import instead of writing
their own guard. Touches 4 lib files plus 1 new file; no behavior change —
every existing guard already degrades to "acts as if storage is empty/absent"
on failure, so a shared implementation only needs to preserve that.

**Size:** small.

**Complexity removed:** 4 independent places currently reimplement the same
try/catch shape (6 total guard sites, counting `themePrefs.ts`'s four). If
storage access needs to change (e.g. adding a `console.warn` in dev, or
handling `QuotaExceededError` distinctly from "storage unavailable"), that
change has to be hand-applied 4-6 times; today it already hasn't been, so any
future policy change starts from a baseline that's already
inconsistent between the two sub-patterns.

## Healthy reuse

- `saveDraft` / `loadDraft` in
  `apps/frontend/src/lib/conversationHistory/persistence.ts:206-231` — one
  function with two TypeScript call-signature overloads plus its
  implementation; not duplication, ruled out after reading the file.
- `apps/frontend/src/lib/scan/recipe.ts` and the four `*Policy.test.ts` files
  read for this surface's within-surface pass; no within-surface duplicate
  found in them. Their cross-boundary status against `scripts/*.mjs` is
  slice E's to confirm or dismiss.

## Draft coverage-table row

| Directory | Files examined | Findings |
| --- | --- | --- |
| `apps/frontend/src/lib/**`, `apps/frontend/src/types/**`, top-level `apps/frontend/src/*`, `apps/frontend/src/test/**`, CSS | 159 | 2 (F-01, F-02) |
