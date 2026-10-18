# Slice J — Dead and duplicated styles go; parse errors fail the build

## Status: done

Depends on: B (shared CSS test helpers). Findings: C-02, C-03, C-04, C-05, C-06, C-08, C-12, C-13, D-14, U-12 (CSS part).

## Goal

Dead and duplicated CSS is deleted and a check fails the build on stylesheet parse errors. Every deletion is a rule no element can match, a rule a later rule fully overrides, or an exact duplicate. Every screen looks the same.

## Where evidence lives

- **Kept in the repo (outside `PRD/work/`, which cleanup deletes):** `docs/design/codebase-cleanup-pass/slice-j/` holds the REQ-202 Life Tracker screenshot pairs (`before-390x844.png`, `after-390x844.png`, `before-1440x900.png`, `after-1440x900.png`), `computed-style-summary.md` (per tool and colour profile: element count, number of differing properties, which must be 0), and `README.md` (PR-ready text, including the line "The Life Tracker table's elements are part of the computed-style dump").
- **Throwaway, in `PRD/work/codebase-cleanup-pass/.playwright-mcp/`:** raw browser captures and the raw computed-style JSON dumps.

## Requirements

1. **Capture the "before" first, on the untouched tip,** before any CSS edit: (a) build the CSS (`npm --workspace apps/frontend run build`) and copy the built `.css` files to the scratchpad; (b) serve the app from this worktree on an owned port (not 5173/5273/5300) with the project's dev or preview command; (c) in the browser dump `getComputedStyle` for every element on each tool (In-Depth, Quick Question, Trade, Life Tracker and its sheets, the scanner), in two colour profiles, to `.playwright-mcp/`; (d) take the Life Tracker screenshots at 390x844 and 1440x900 with the Game setup sheet open, saved as the `before-*` files in `docs/design/codebase-cleanup-pass/slice-j/`. Stop the server and close the browser.
2. Make the CSS edits below in small commits, re-reading every line number first (several are the probes' numbers).
3. **C-02.** Delete the 12 `index.css` rules whose only declaration is `display: none` on a `[hidden]` selector (about `:1521, 1841, 1919, 1974, 2077, 2119, 2177, 2366, 3678, 4153, 5217, 5227`). The global `[hidden] { display: none !important; }` at `styles/flow.css` about `:446` already forces them. The three in the ported layers stay.
4. **C-03.** Delete the dead "waiting" chat block in `flow.css` (about `:393-440`) and the seven keyframes only it uses (`mote`, `seal-ring`, `ink-in`, `wait-breathe`, `seal-scry`, `caret`, `wait-out`), their entries in the reduced-motion list (about `:449`), `.btn.ghost`, `.card-panel`, `.lt-scope .life-custom .err`, `.lt-scope .tile.pulse .n` and its `tick` keyframe. Keep `think` (used at about `index.css:4195`) and `motion-exit` (a test asserts it). Leave `.ring .card.summon` and its reduced-motion entry.
5. **U-12 (CSS part).** Delete the about 28 dead classes U-12 lists in `intake/FINDINGS-ui-and-personalities.md`, after a fresh zero-producer check for each (search `.tsx`, `.ts`, `.html`, tests). Exclusions: `.step-eyebrow`, `summon`, and anything a stylesheet-reading test asserts.
6. **C-04.** Delete the state rules for attributes the code never sets: `.act-zones button[data-current="true"]` (about `:2216`, `:2315`), `[data-current] .mark`, `.mark::after`, `[data-current] .zg`, the `.act-zones button .mark` half of about `:1489`, and `.review[data-collapsed="true"]` (about `:1943`). Keep `--idq-shadow-act-1`. Leave `.ring .card[data-offstage]`.
7. **C-05.** Delete the `index.css` copies of `orb-breathe` (about `:478`) and `mic-listen` (about `:956`) after checking the frames equal the surviving copies value for value.
8. **C-06.** Delete the six unread glow tokens (`lib/theme/glows.css` about `:9, 15-18, 21`). Re-run the unread-token check after the U-12 sweep and delete any newly orphaned token (for example `--glow-soft-10`) that no rule reads and card-rings does not name. Do not touch `--idq-shadow-9`, `--ring-w`, or glows lines about `31` and `72`.
9. **C-08.** Fold the later overrides into their original blocks: `.extras .counters`, `.extras .cmd-row, .extras .named-row` (about `:1302`, `:1323` with `:2507`, `:2511`), `.lt-scope .tile` (swap only `display` and `cursor`, keep `justify-items`), `.lt-scope .tiles .tile.custom .rm`.
10. **C-12.** In `tailwind.config.ts` remove the unused `screens.xs` and `colors.accent.contrast`, add `corePlugins: { container: false }`, and remove `@tailwind components` from `index.css` line 1 once it emits nothing. Leave the `.ring` blocklist.
11. **C-13 and D-14.** Delete the two stray `};` (about `index.css:1086`, `:3510`) that cause the two build warnings, fix the six collapsed `@media` openers, delete the orphan comment (about `:91-92`) and the stale pointer (about `:966`). Add a test `Frontend - Stylesheets` that runs postcss over the seven stylesheets and fails on any parse warning.
12. Leave alone: `.ring` rules, `body`/`html`/`*`, the `.adaptive-context-*` CSS, `StepEyebrow`. Edit no stylesheet-reading guard test.
13. **Capture the "after"** with the same procedure, save the `after-*` screenshots, run the comparison, write `computed-style-summary.md` and `README.md` under `docs/design/codebase-cleanup-pass/slice-j/`.
14. **Cleanup:** call `browser_close`, stop the owned dev server, confirm the port is released (`lsof -i :<port>` prints nothing), and record the capture path in `slice-j.evidence.md`.

## Acceptance criteria

- [ ] J1. The built CSS before and after differ only by deleted rules: every surviving rule keeps its values and relative order (diff method and result in the evidence log).
- [ ] J2. The computed-style dump of every element on each tool (In-Depth, Quick Question, Trade, Life Tracker and its sheets, scanner) in two colour profiles is identical before and after; the result is in `docs/design/codebase-cleanup-pass/slice-j/computed-style-summary.md` and states the Life Tracker table's elements are included.
- [ ] J3. `npm --workspace apps/frontend run build` prints zero CSS warnings.
- [ ] J4. A `Frontend - Stylesheets` test runs postcss over the seven stylesheets and fails on any parse warning; it passes.
- [ ] J5. The full frontend suite is green and no stylesheet-reading guard test was edited (`git diff --name-only origin/main` shows only `Frontend - Stylesheets` as a new/changed CSS-related test, plus slice B's helper swaps).
- [ ] J6. The four REQ-202 Life Tracker screenshots (`before`/`after` at 390x844 and 1440x900, Game setup sheet open) are committed under `docs/design/codebase-cleanup-pass/slice-j/` and show no visible difference.
- [ ] J7. `docs/design/codebase-cleanup-pass/slice-j/README.md` holds PR-ready text that names the screenshot pair and the computed-style dump, including that the Life Tracker table's elements are in the dump.
- [ ] J8. `.ring` rules, `body`/`html`/`*`, `.adaptive-context-*`, `--idq-shadow-9`, `--ring-w`, `StepEyebrow` and the `.ring` blocklist are untouched (`git diff origin/main` check recorded).
- [ ] J9. `npm --workspace apps/frontend run typecheck` exits 0 and `npm run lint` exits 0.
- [ ] J10. Browser closed, owned server stopped, port released; raw captures written to `PRD/work/codebase-cleanup-pass/.playwright-mcp/`; paths recorded in the evidence log.

## Verification

```bash
npm --workspace apps/frontend run build
npm --workspace apps/frontend run test
npm --workspace apps/frontend run typecheck
npm run lint
git diff --name-only origin/main
ls docs/design/codebase-cleanup-pass/slice-j
```

## Reverted findings

None. No deletion failed its computed-style or built-CSS proof. Evidence: `slice-j.evidence.md`.

## Files touched

- `apps/frontend/src/index.css`, `apps/frontend/src/styles/flow.css`, `apps/frontend/src/lib/theme/glows.css` (re-read the paths)
- `apps/frontend/tailwind.config.ts`
- new `Frontend - Stylesheets` test
- `docs/design/codebase-cleanup-pass/slice-j/` (screenshots, summary, README)
