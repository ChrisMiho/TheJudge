# Quality check — small-fixes-cats-menu-white

Run `graph-20261014-225350`, node `gate-qc`, attempt 1, 2026-10-14. Mode: graph is controlling.

**Verdict: FAIL** — four issues, all fixable in `DESIGN-BRIEF.md` (no product-truth change needed). Marker set to `STATUS.refining`.

## What was checked and held

- Every removed (`-`) line in all 24 diff hunks of `GATE-QUESTIONS.md` matches `PRD/sections/` verbatim, and each hunk's start line is the real line (scripted check against REQ-203 5228, REQ-207 5383/5396/5421, REQ-099 2408/2424/2426/2450, REQ-044 918/921/939, REQ-113 2796/2812, FLOW-007 168/176/185, in-depth 529, shared-chrome 109/118/187/196/434, system-map 221/228).
- A line-level grep finds no "Blue default / fall back to Blue" text outside the diffs except retired `decisions.md` DEC-119, which the brief names as left alone.
- Each of the six blocks has the three plain-language parts (what this decides, in plain terms, what happens if you say no), a complete diff, and blank Verdict and Reason slots.
- Code claims hold: `MtgAssistantApp.tsx:878` is the only `onBrandClick`; `DEFAULT_PALETTE_ID = "blue"` at `palettes.ts:28` with the comment at line 45; `.menu-tray::after { right: -1px }` at `shell.css:415-420`; `.app-header .menu-toggle` 50px/1.4rem with the `min-width: 768px` block at 54px/1.5rem; `index.html` theme-color and favicon both `#0050d8`; `.icon-chip` is `flow.css:35` (80% panel fill, 1px `--surface-edge`); `appliedTheme.ts:20` falls back to `"blue"`; the three cat tests exist in `App.interaction-flows.presentation.test.tsx`.
- Pre-start paint surfaces: only `tokens.css` `:root`, `index.html` theme-color and `index.html` favicon paint the default before `applyPalette` sets `data-profile`. Header art (`shell.css`) and haze (`ambience.css`) are all `[data-profile=...]`-scoped, so they do not paint early. There is no manifest. The brief covers all three.

## Findings (return to refinement)

1. **Second default pin missed in `palettes.test.ts`.** Brief section 3 names only line 77 (`expect(DEFAULT_PALETTE_ID).toBe("blue")`). The same test (lines 76-80) also asserts `defaultPalette?.name.toLowerCase()` contains `"blue"` (line 80) and is titled "includes a default blue palette…". Changing only line 77 leaves the test failing. Name the whole test (title, line 77, line 80). Also rename the title of `App.mtg-color-themes.test.tsx:171` ("…falls back to Blue"; its body already follows the constant).
2. **`tokens.css` change is under-specified.** The default block is the combined selector `:root, [data-profile="blue"] { ... }` (line 41-42). "`:root` carries White's values" must say how: split it so `[data-profile="blue"]` keeps Blue's values (including `--motif` and `--wash-tint`) and `:root` takes White's. As written, a builder can break Blue.
3. **First-paint White has no automated test.** Section 3's test list covers the constant and the settled theme, but the pre-start surfaces (`tokens.css` `:root`, `index.html` theme-color, favicon fill) are checked only live ("Fresh storage"). Add a testable criterion: a stylesheet/HTML assertion that `:root` token values equal White's `[data-profile="white"]` values and that `index.html` theme-color and favicon fill equal White's accent, so the two cannot drift. Also state that this pre-start hex in `index.html` is a deliberate placeholder exception to REQ-219/REQ-216's "no hard-coded per-profile hex" (it is already one today with Blue's hex).
4. **Two acceptance criteria are not testable as written.** (a) Cat placement: the build tests list (count adds across screens, holds, fresh mount, Life Tracker, nine taps) never asserts the picture sits directly under the banner header on non-Game screens; add one (for example, the picture follows the header and precedes the page content on Ask a Question and Trade Balancer). (b) Tray overflow: "scrollWidth equals clientWidth" cannot be measured in jsdom; the REQ-113 criterion says "tests or stylesheet assertions" but the brief does not say which. State the automated form (stylesheet assertion: the tray's `::after` no longer extends past the tray box, and the tray's x-overflow is not scrollable) and keep the live 390×844 / 1440×900 measurement as the verification step.

## Not findings

- `PRD/sections/` unchanged and `GATE-QUESTIONS.md` unedited: by design.
- The desktop tray shape gap (full-height versus the floating card REQ-113 describes) is recorded in the brief's non-goals as a pre-existing follow-up.
- No `screen-layout.md` row is needed: no new screen or overlay is introduced (the cat picture is an in-flow image on existing screens).
