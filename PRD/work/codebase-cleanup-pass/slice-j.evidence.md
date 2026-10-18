# Slice J evidence

## Baseline (tip after slice I, 2026-10-18)

- Frontend build prints two CSS warnings (`Expected percentage but found ";"`, the two stray `};`). Built CSS 211,949 bytes (copy kept in the scratch folder as `css-before`).
- Frontend: 155 files, 1663 tests pass.
- "Before" computed-style dump and screenshots taken on the untouched tip before any CSS edit (see below).

## Changes (every line number re-read; several of the brief's had moved)

- C-02: the 12 `index.css` rules that were only `display: none` on a `[hidden]` selector are gone (`.place-more`, `.ctx-form label`, `.targets input.field`, `.review-sum`, `.more-row`, `.review-filters`, `.review-count-line`, `.seg button`, `.pp-filter`, `.indicator`, `.lt-scope .add-err`, `.lt-scope .lt-tab`). The global `[hidden] { display: none !important; }` in `flow.css` forces them. `shell.css`'s `.icon-round[hidden]`, `flow.css`'s `.stage[hidden]` and `.arrow[hidden]` (the ported layers) stay.
- C-03: the "waiting" chat block in `flow.css` (everything from the "the wait (round 8)" comment to `.wait-time`), the keyframes `mote`, `seal-ring`, `ink-in`, `wait-breathe`, `seal-scry`, `caret`, `wait-out`, their reduced-motion entries, `.btn.ghost`, `.card-panel`, `.lt-scope .life-custom .err`, `.lt-scope .tile.pulse .n` and `tick`. Checked first: no TSX produces `waiting`, `wait-line`, `wait-foot`, `wait-time`, `ghost`, `card-panel`, `err` or `pulse` on these elements; `think` (used by `.indicator`) and `motion-exit` stay; `.msg.judge .seal { position: relative }` stays; `.ring .card.summon` and its reduced-motion entry stay.
- U-12 (CSS part): a fresh zero-producer check (TS, TSX, HTML and tests) for each class in the list, then removal of the 22 classes with no producer and no stylesheet-reading test: `demo-bar`, `demo-toggle`, `before-after`, `overlay-backdrop`, `overlay-panel`, `foot-note`, `thinking`, `flow-hint`, `msg-judge`, `msg-judge-seal`, `msg-judge-who`, `tile-tools`, `roster-more`, `drop-before`, `drop-after`, `header-side`, `life-note`, `place-more`, `surface-wash`, `btn-accent`, `accent-text`, `tap-target`. Kept because a test reads them: `panel-inner`, `scroll-cap-4-enrichment` (`responsiveSurfaceHooks.test.tsx`). Kept by design: `.step-eyebrow`, `summon`. Removal was by selector (a selector list that also names a live selector keeps the live part).
- C-04: `.act-zones button[data-current="true"]` (two rules), its `.mark` and `.mark::after` variants, `[data-current] .zg`, `.review[data-collapsed="true"]`, and the `.act-zones button .mark` half of the `.place-zones button .mark` selector list; no code sets `data-current` on those buttons or `data-collapsed` on the review. `--idq-shadow-act-1` stays.
- C-05: the `index.css` copies of `orb-breathe` and `mic-listen`; frames compared with the surviving copies in `shell.css` and `flow.css` value for value (equal after parsing).
- C-06: the six unread tokens (`--glow-dot`, `--glow-accent-18`, `--lift-send`, `--lift-send-hover`, `--lift-message`, `--stroke-bright`); the unread-token scan was re-run after the sweep and finds none left. `--idq-shadow-9`, `--ring-w` and the card-rings lines are untouched.
- C-08: folded into their original blocks: `.extras .counters` (`grid-template-columns: 1fr`), `.extras .cmd-row, .extras .named-row` (`display: flex`, `min-width: 0`, `gap: 0.5rem`; its `grid-template-columns` kept so the computed value is unchanged), `.lt-scope .tile` (`display: block`, `cursor: default`, `justify-items` kept), `.lt-scope .tiles .tile.custom .rm` (`left: 2px; right: auto`).
- C-12: `tailwind.config.ts` loses `screens.xs` and `colors.accent.contrast` (no `xs:` or `*-accent-contrast` utility is used), gains `corePlugins: { container: false }`; `@tailwind components` is gone from `index.css`. The `.ring` blocklist is untouched.
- C-13 / D-14: the two stray `};` removed (build now prints no warning), the six collapsed `@media` openers put on their own line, the orphan "Question History, below 600px" comment and the stale "the message bubbles (`flow.css:355-374`)" pointer deleted. New `src/test/stylesheets.test.ts` (`Frontend - Stylesheets`, 8 tests): reads the seven stylesheets (and checks the list is every `.css` under `src`), runs postcss over each and esbuild's CSS minifier (the tool that printed the build warnings; postcss alone accepts a stray `};`) and fails on any warning. It fails on the old `index.css` (2 warnings) and passes now. It needs the node test environment (esbuild's encoder check fails in jsdom), set by a pragma in the file.

## Proof

- J1, built CSS: both built stylesheets were parsed with postcss and flattened to one entry per rule (at-rule context, selector, declarations) and per keyframes block; a longest-common-subsequence diff gives 1,418 entries before, 1,307 after, 123 removed, 12 changed, and every other entry present in the same relative order. The 12 changed are exactly the expected ones: `:root` (six tokens gone), the two keyframes whose duplicate copy went (`orb-breathe`, `mic-listen`), the reduced-motion list, the two keyframes whose stray `};` was fixed (`node-pulse`, `foil`, same frames), `.player-more .link, .extras .link` (lost `.roster-more .link`), `.place-zones button .mark` (lost `.act-zones button .mark`), and the four C-08 folds (counters, command and named rows, tile, remove button).
- J2, computed style: 2,252 elements in 24 dumps, 0 differ; method and per-tool table in `docs/design/codebase-cleanup-pass/slice-j/computed-style-summary.md`. Raw hashes: `PRD/work/codebase-cleanup-pass/.playwright-mcp/dumps-merged.json` (before and after labelled `beforeE` and `afterE`; the earlier labels in the other two files are method-calibration runs).
- J3: `npm --workspace apps/frontend run build` exits 0 with zero warnings (two before).
- J4 and J5: frontend 156 files, 1671 tests pass (1663 plus the 8 new). No stylesheet-reading guard test and no other test file was edited in this slice (`git diff` for the slice shows only the six CSS and config files plus the new test).
- J8: a search of the slice's diff for `.ring`, `adaptive-context`, `idq-shadow-9`, `--ring-w`, `step-eyebrow` and bare `body`/`html`/`*` selectors finds only one reformatted line: the reduced-motion `@media` opener that carries the `.adaptive-context-*` entries, which keeps them all (it was split onto a new line). `.ring .card.summon` stays in its reduced-motion list.
- `npm --workspace apps/frontend run typecheck` exits 0.

## Dated observations (manual criteria)

2026-10-18 J1 — built CSS compared rule by rule (1,418 entries before, 1,307 after): 123 removed, 12 changed (all expected, listed above), the rest unchanged and in the same order.

2026-10-18 J8 — no `.ring` rule, no `body`/`html`/`*` rule, no `.adaptive-context-*` rule, no `--idq-shadow-9` or `--ring-w`, no `StepEyebrow` or `.step-eyebrow`, and no `.ring` blocklist entry removed; the only touched line that names `.adaptive-context-*` is the reduced-motion opener, reformatted with its list intact.

2026-10-18 J10 — browser: `browser_close` called after the last capture. Server: the dev server (vite, port 5451, started by this node, whole tree stopped with plain `kill`); `lsof -i :5451` prints nothing afterwards. Captures: `PRD/work/codebase-cleanup-pass/.playwright-mcp/dumps-before.json`, `dumps-after.json`, `dumps-merged.json` (throwaway), screenshots in `docs/design/codebase-cleanup-pass/slice-j/`.

## Reverted findings

None. Method notes: the first comparison attempts differed everywhere because (a) the capture browser's viewport had changed after resizing for screenshots, and (b) the six deleted custom properties are inherited by every element and Chrome lists custom properties in an order that changes with the set; the final run excludes the six from the hash and sorts property names, in one browser session, and its noise check (two captures of the same tip) gives 0 differences.
