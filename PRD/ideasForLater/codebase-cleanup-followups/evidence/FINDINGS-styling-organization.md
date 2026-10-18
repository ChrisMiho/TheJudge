# Findings — styling organization (2026-10-18)

## Summary in plain words

Players would see nothing different after any fix below. Every fix either deletes a rule that no element can match or that a later rule fully overrides, or moves rules without changing their order.

The biggest problem is how the CSS is organized. `index.css` is really four ported screen stylesheets (In-Depth, Trade Balancer, Scanner, Life Tracker sheets) joined to an app layer. It has no section markers, and its global rules (`:root`, `body`, `*`) sit in the middle of the file.

Beyond the 28 dead classes U-12 already lists, I found about 260 more lines that are dead or duplicated:
- twelve redundant `[hidden]` rules
- a whole dead "waiting" chat block in `flow.css`, with 8 keyframes only it uses
- five state rules for an attribute the code never sets
- two keyframes declared twice
- six glow tokens nobody reads
- a 57-line copy of the Life Tracker sheet styles, keyed to a test id

Colours and shadows are already almost fully on tokens. That part is healthy.

Method: I parsed all 7 stylesheets with postcss (1,250 selector rules). I checked every class against string literals in production TS/TSX and `index.html`, compared each property of duplicated selectors, checked which keyframes and custom properties are actually used, and diffed the generated Tailwind utilities against custom class names. A scratch `vite build` (output in scratchpad only) reproduced D-14's two warnings.

**Constraint for every fix:** 17 test files read `src/index.css` as text. Some use first-occurrence `indexOf` slicing (`motion-foundation.test.ts:9-18,60`, `ambient-accent-foundation.test.ts:9-30`, `reduced-motion.test.ts`), so moving a rule can break a test even when pixels don't change.

One hollow test: `ambient-accent-foundation.test.ts:89` `cssBlock("body")` matches the word "body" inside the comment at `index.css:6` (`--font-body`). It never checks the real `body` rule.

**Suggested proof harness, reusable for every finding:**
1. Build the CSS before and after the change and diff the output.
2. Use Playwright to dump `getComputedStyle` for every element on each tool (In-Depth, Quick Question, Trade, Life Tracker sheets, scanner) in two colour profiles, and compare.

## Findings — ranked

### C-01 — `index.css` is four screen stylesheets glued together with no sections
- **Evidence:**
  - `index.css` is 5,398 lines. It contains four contiguous ported regions, each opened by a header comment:
    - In-Depth details: `:1002` to about `:2650` (~1,650 lines)
    - Trade Balancer: `:3153–3946` (794)
    - Card scanner: `:3947–4473` (527)
    - Life Tracker sheets: `:4474–5357` (884)
  - Global rules are split across the file: `html` at `:22`; the `:root` token block at `:2653`; `body` at `:2714`; `*` at `:2731`; `::selection` at `:2735`. That puts them between In-Depth and the motion utilities.
  - Selector families are scattered:
    - `.flow-*` appears in 9 separate runs (`:1133, 2543, 2552, 3184, 3192, 3648, 3794, 3830, 3958`)
    - `.side` in 9 runs, `.scan-*` in 7, `.page-*` in 6
  - 41 selectors are written in two or three places within `index.css`. For example `.wait-inscription-bubble` is at `:204` and again at `:3082`.
- **Why it is poor:** finding "all the Trade CSS" means searching 5,400 lines. Rules for one element drift apart, which is how C-04, C-08 and U-07 happened.
- **Appearance-preserving fix:**
  - Move Trade (`:3153–3946`), Scanner (`:3947–4473`) and Life Tracker sheets (`:4474–5357`) into `styles/screens/{trade,scanner,life-tracker}.css`, imported in `main.tsx` right after `index.css`, in that order.
  - That only swaps them with the 40-line tail (`:5358–5398`: `.send-spinner`, `send-spin`, two reduced-motion blocks). I checked that no rule in those three regions competes with the tail. The one overlap is `.lt-sheet.drawer-panel` (`:4587`), and it sets no `transition`. The reduced-motion block is `!important`.
  - Leave the In-Depth region for a second step. Many text-reading tests check its selectors.
  - Add short section banners to what remains.
- **Size:** M
- **Proof of no change:**
  - The minified bundle contains the same rules in the same relative order, except that the moved regions now come after the 40-line tail.
  - Only two tests read the moved regions:
    - `motion-foundation.test.ts:93` reads `.scan-confirm-popup` (`index.css:3943`, inside the Trade range). Keep that rule in `index.css` or repoint the test.
    - `QuickLookupApp.test.tsx:267` reads the `.page-content-narrow-fit:has(... .scan-panel ...)` string, which stays in `index.css`.
- **Overlap:**
  - card-search: `CardSearchPop` may touch `.side .search-pop` (`:3450`) in the Trade region.
  - popups: deletes `.adaptive-context-*` at `:830-856` and `:2618-2628`, outside the moved regions.
  - Run this after both briefs to avoid merge pain.

### C-02 — Twelve `[hidden]` rules repeat what one global rule already forces
- **Evidence:**
  - `flow.css:446` has `[hidden] { display: none !important; }`. An author `!important` beats any normal declaration, whatever its specificity.
  - `index.css` still has 12 rules that set only `display: none`: `:1521, 1841, 1919, 1974, 2077, 2119, 2177, 2366, 3678, 4153, 5217, 5227` (`.place-more[hidden]`, `.ctx-form label[hidden]`, `.review-sum[hidden]`, `.seg button[hidden]`, `.pp-filter[hidden]`, `.lt-scope .lt-tab[hidden]` and others).
  - The ported layers have 3 more: `shell.css:283`, `flow.css:62`, `flow.css:146`.
  - The only other `display … !important` in the app is `.side` (`index.css:3399`). It never carries `hidden`.
- **Why it is poor:** about 48 lines of noise. It suggests each element needs its own hide rule.
- **Appearance-preserving fix:** delete the 12 `index.css` rules. Leave the ported three, since those files mirror the mockup.
- **Size:** S
- **Proof of no change:** no test reads these selectors. Toggling any `hidden` element shows it still computes `display: none`.
- **Overlap:** none (`:5217` and `:5227` are in the Life Tracker sheets region, not the frozen table).

### C-03 — Dead "waiting" chat block in `flow.css`, its 8 keyframes, and five more dead classes (new instances of U-12, plus a correction)
- **Evidence:**
  - Nothing renders the `waiting`, `wait`, `typed`, `thinking` or `wait-line*` classes. `ConversationThread.tsx:220` only emits `conversation-message msg judge…`.
  - So `flow.css:393-395` and `:397-440` (about 47 lines) never match. Those rules are the only users of the keyframes `mote`, `seal-ring`, `ink-in`, `wait-breathe`, `seal-scry`, `caret` and `wait-out`.
  - `summon` (`flow.css:100`) has the same problem.
  - The reduced-motion list at `flow.css:449` names 8 of these dead selectors.
  - U-12 named only `thinking` and `wait-line(s)/time/foot`. The `waiting`, `wait` and `typed` classes and the keyframes are new.
  - **Correction to U-12:** it excluded `ghost`, `err` and `pulse` as "built at runtime", but no production code produces them:
    - `shell.css:1020` `.btn.ghost` has no producer.
    - `index.css:4906` `.lt-scope .life-custom .err` is dead: the custom-life error renders outside the form as `.lt-note-error` (`GameSetupPanel.tsx:260`).
    - `index.css:5122` `.lt-scope .tile.pulse .n` is dead (no `pulse` anywhere), along with its keyframe `tick` (`:5126-5128`).
  - Also new: `shell.css:845` `.card-panel` has no producer.
  - `motion-exit` is used only by tests, and `motion-foundation.test.ts:51` asserts its keyframe, so keep it.
- **Why it is poor:** about 75 lines plus 9 keyframes that look live but are not.
- **Appearance-preserving fix:** delete these together with U-12's sweep. Keep the `think` keyframe (`flow.css:396`), because `index.css:4195` uses it.
- **Size:** S
- **Proof of no change:** the strict class scan (classes appearing as tokens in production string literals) finds zero producers. No test reads these flow.css selectors.
- **Overlap:** none. It touches `.lt-scope` sheet CSS, not the REQ-202 table.

### C-04 — State rules for attributes the code never sets
- **Evidence:**
  - `ZoneCardMenu.tsx:135-147`: the "Move to" buttons never carry `data-current`, because `otherZones` leaves out the current zone, and they have no `.mark` child. `git log -S` shows they never did. So these rules are dead:
    - `.act-zones button[data-current="true"]` at `index.css:2216` and again at `:2315`
    - `[data-current] .mark` at `:2221`
    - `.mark::after` at `:2227`
    - `[data-current] .zg` at `:2319`
    - the `.act-zones button .mark` half of the grouped selector at `:1489`
  - `.review[data-collapsed="true"]` (`index.css:1943`) is dead: `EnrichmentStep.tsx:805` unmounts the list instead.
  - `.ring .card[data-offstage="true"]` (`flow.css:91`) is dead: `CardStage.tsx` never sets `data-offstage`.
- **Why it is poor:** about 26 lines describing states the UI does not have, which misleads the next edit.
- **Appearance-preserving fix:** delete them. Keep `--idq-shadow-act-1`, which `:4868` still uses.
- **Size:** S
- **Proof of no change:** grep finds no production producer of these attribute/value pairs. No test reads `.act-zones` or `.review[data-collapsed]`.
- **Overlap:** none.

### C-05 — Two keyframes declared twice with identical frames
- **Evidence:**
  - `orb-breathe`: `shell.css:229` and `index.css:478-490`
  - `mic-listen`: `flow.css:243` and `index.css:956-964`
  - In each pair the frames are the same values, only reflowed.
- **Why it is poor:** the later copy silently wins, so editing the layer copy does nothing.
- **Appearance-preserving fix:** delete the two `index.css` copies, about 22 lines.
- **Size:** S
- **Proof of no change:** the values are equal, so the last-declared copy behaves identically. No test greps either name.
- **Overlap:** none.

### C-06 — Six glow tokens nobody reads, and a breakpoint token no rule can read
- **Evidence:**
  - These `var(--…)` names are never read anywhere in production CSS or TS (comments stripped): `--glow-dot`, `--glow-accent-18`, `--lift-send`, `--lift-send-hover`, `--lift-message`, `--stroke-bright` (`lib/theme/glows.css:9,15-18,21`).
  - `--sheet-breakpoint` (`index.css:2672`) is never read. Its own comment admits a media query cannot read it.
  - No test mentions any of the seven.
- **Why it is poor:** dead tokens in the one place REQ-216 says is the source of truth.
- **Appearance-preserving fix:** delete the six glow tokens. Handle `--sheet-breakpoint` with C-11.
  - Re-run the unread-token check after U-12's sweep: deleting `.drop-before/after` may orphan `--glow-soft-10`.
- **Size:** S
- **Proof of no change:** an unread custom property cannot affect rendering.
- **Overlap:** none.

### C-07 — `body`, `html` and `*` re-declared in `index.css` over `shell.css` (new instances of U-07)
- **Evidence:**
  - `shell.css:20-36` sets `* {box-sizing}`, `html, body {margin; min-height; font-family}` and `body {background: var(--surface-wash); color; min-height: 100dvh; display: flex…}`.
  - `index.css:2714-2733` overrides four of `body`'s properties:
    - `background: var(--surface-ground)`
    - `color: #e2e8f0` (that line is already U-13)
    - a hand-written Inter stack that adds `Roboto`
    - `min-height: 100vh`
  - It then repeats `* {box-sizing: border-box}`, which Tailwind preflight also sets. The minified bundle already drops shell.css's `*` copy.
  - `body {margin: 0}` is declared three times (preflight, shell, index).
- **Why it is poor:** this is REQ-216's "a screen's selector may not redefine a layer's" rule. The page ground really comes from `index.css`, not the shell layer.
- **Appearance-preserving fix:**
  - Delete `index.css`'s `*` rule and its `margin: 0`. These are identical repeats.
  - Moving the four differing `body` values into `shell.css` keeps pixels only if the values move unchanged. Switching to `--font-body`, `--surface-wash` or `100dvh` is in "Appearance changes" below.
- **Size:** S
- **Proof of no change:**
  - Identical declarations at equal specificity.
  - `ambient-accent-foundation.test.ts:89` would not notice either way (see the hollow-test note above).
- **Overlap:** card-rings (its stylesheet de-duplication slice owns U-07).

### C-08 — In-Depth extras rows and Life Tracker tiles are overridden later in the same file
- **Evidence:**
  - `.extras .counters` at `index.css:1302` sets `grid-template-columns: repeat(3,1fr)`. `:2507` replaces it with `1fr`.
  - `.extras .cmd-row, .extras .named-row` at `:1323` set `display: grid; grid-template-columns: 1fr 5rem; gap: 0.4rem; align-items: center`. `:2511` overrides all four: `display: flex; gap: 0.5rem; align-items: center`, and `grid-template-columns` does nothing under flex. Only `font-size` survives from `:1323`.
  - Life Tracker sheets:
    - `.lt-scope .tile` sets `display: grid; cursor: pointer` at `:5044`, then `display: block; cursor: default` at `:5232`.
    - `.lt-scope .tiles .tile.custom .rm` sets `right: 2px` at `:5179`, then `right: auto; left: 2px` at `:5252`.
- **Why it is poor:** the first block describes a layout that never renders. The real values live about 1,200 lines away.
- **Appearance-preserving fix:**
  - Fold each override into the original block and delete the override.
  - For `.extras`, the merged block is `display: flex; min-width: 0; align-items: center; gap: 0.5rem; font-size: 0.82rem`.
  - For `.lt-scope .tile`, swap only `display` and `cursor`. Keep `justify-items` to be safe: it affects children's `justify-self: auto` resolution.
- **Size:** S
- **Proof of no change:** the merged final values equal today's cascade winners. No test reads `.extras` or `.lt-scope .tile`. Run a computed-style diff on In-Depth's player extras and the Life Tracker Counters sheet.
- **Overlap:** none.

### C-09 — Life Tracker's Game setup sheet is styled through its test id, and every Tailwind class on its header is overridden
- **Evidence:**
  - `PlayerLifeTrackerApp.tsx:39-40` (frozen file) renders `<p className="text-xs font-bold uppercase tracking-[0.14em] text-accent-soft">` and `<h2 className="text-xl font-black text-zinc-100">`.
  - `index.css:5312-5329` targets them through `[data-testid="life-tracker-game-setup"] .sheet-legacy-head p/h2`, with specificity (0,2,1). That rule resets `font-size`, `font-weight`, `letter-spacing`, `line-height` and `color`. As a result, all 8 Tailwind classes have no visible effect: three are overridden outright, and the other values are equal.
  - The whole test-id block at `:5284-5340` (~57 lines) is a near copy of `.lt-sheet`/`.lt-head`/`.lt-body` at `:4480-4530`. `CounterPanel.tsx:315` reaches those through `panelClassName="lt-sheet"`.
- **Why it is poor:**
  - A test id doubles as a style hook.
  - It is a specificity war that the Tailwind classes silently lose.
  - It duplicates the `.lt-head` rules.
- **Appearance-preserving fix:**
  - Lightest version: remove the 8 dead Tailwind classes from the two header lines. The pixels stay the same, and the `text-zinc-100` exemption hit disappears.
  - Fuller version: give `GameSetupModal` `panelClassName="lt-sheet"` and point the test-id rules at that class.
  - Both edit a REQ-202 frozen file, so this is an owner call.
- **Size:** S (classes) / M (selector move)
- **Proof of no change:** computed style of the Game setup head before and after. `PlayerLifeTrackerApp` tests use the test id only for queries.
- **Overlap:** none (popups brief changes Escape handling in `SheetShell`, not this CSS).

### C-10 — An unneeded `!important` on Trade's two sides
- **Evidence:**
  - `index.css:3398-3400` sets `@media (min-width: 720px) { .side { display: flex !important; } }`.
  - The only competing rule is `.side { display: none }` at `:3383`. It has the same specificity and comes earlier, so the media rule already wins without `!important`.
  - `.side[data-active="true"]` (`:3387`) sets `flex` anyway.
  - `TradeSide.tsx:171-175` never adds `hidden`.
- **Why it is poor:** the app's only `!important` outside reduced-motion and the global `[hidden]` rule. It invites the next `!important` in reply.
- **Appearance-preserving fix:** drop `!important`.
- **Size:** S
- **Proof of no change:** the four `.side` rules listed are the complete set (postcss scan). Check Trade at 390 px and 1024 px.
- **Overlap:** card-search (same file region, different lines).

### C-11 — Six breakpoint widths in 45 literal media queries, with a stale "one source" comment
- **Evidence:**
  - Width media queries, excluding reduced-motion:
    - 720/719: 21 (`index.css` 14, `flow.css` 4, `shell.css` 2, `glows.css` 1)
    - 600/599: 13
    - 768/767: 6
    - 640: 3 (`index.css:666, 1346, 1376`)
    - 480/479: 3
    - 1099: 1 (`ambience.css:100`)
  - The `--sheet-breakpoint` comment (`index.css:2662-2671`) says "every other suite boundary keeps 640px/768px". In fact 720 is the most common width.
  - The token itself is unread (C-06).
  - TSX comments cite it as a token: `SheetShell.tsx:52`, `CardPresentation.tsx:162`, `ZoneCardMenu.tsx:75`, `ConversationHistoryDrawer.tsx:30,166`.
- **Why it is poor:** there is no single list of the suite's widths, and the one place that claims to be that list is wrong.
- **Appearance-preserving fix:**
  - Replace the dead token with one comment table in `tokens.css` naming each width and what it switches.
  - Fix the stale comment and the TSX comments.
  - A `postcss-custom-media` setup would add a dependency (REQ-200/216 say no new dependency), so don't.
- **Size:** S
- **Proof of no change:** comments and an unread custom property only.
- **Overlap:** U-10 (the JS side of the same breakpoints). Do them together.

### C-12 — Tailwind config carries unused entries and emits dead utilities
- **Evidence:**
  - `tailwind.config.ts:9-11` declares `screens.xs: "480px"`. It has zero `xs:` uses. Its comment says the Composer's In-depth label folds there, but that is done in `flow.css:281` at 479 px (see `ComposerPill.tsx:206`).
  - `colors.accent.contrast` (`:17`) is used by no class.
  - The build emits `.container` plus `.!container` at 7 breakpoints (14 rules). They are false positives from the words `container` and `!container` in TS code (`ZoneCardPicker.tsx:168-169`). No element has the `container` class.
  - The build also emits Tailwind's `.ring` utility because `CardStage.tsx:59` uses the custom class `ring`. `index.css:370-374` exists only to cancel it with `box-shadow: none`. A collision scan found this is the only custom-class/utility clash.
- **Why it is poor:** dead config, and a CSS override whose only job is to undo a generated utility.
- **Appearance-preserving fix:**
  - Remove `xs` and `accent.contrast`.
  - Add `corePlugins: { container: false }`. After that, `@tailwind components` (`index.css:1`) emits nothing and can go.
  - Optionally add `blocklist: ["ring"]` and delete `index.css:370-374`. `.ring` then has no box-shadow from any source, which is the same computed `none`.
- **Size:** S
- **Proof of no change:** diff the built CSS. Only the `.container` rules (and `.ring` if blocklisted) disappear. No production element carries those classes; the only intentional `ring` user is CardStage's custom class.
- **Overlap:** card-rings, for `.ring` only (it is in U-07's de-dup list).

### C-13 — No check guards the stylesheets, so formatting debris survives
- **Evidence:**
  - Root `format` and `format:check` run Prettier only on `json/yml/yaml`. There is no stylelint, and Vite's minify warnings don't fail the build.
  - Result:
    - D-14's two stray `};` are still at `index.css:1086, 3510` (reproduced: 2 build warnings).
    - Six collapsed `@media (…) {.selector {` openers: `index.css:473, 630, 666, 2613, 5380, 5392`.
    - An orphan comment with no rule: `index.css:91-92` (Question History phone Delete).
    - A stale line pointer: `index.css:966`'s "`flow.css:355-374`" sits on the dead `.msg-judge` block from U-12.
- **Why it is poor:** the next stray brace also ships silently.
- **Appearance-preserving fix:**
  - Fix the 6 openers and delete the orphan comment together with D-14.
  - Add a tiny check (vitest or script) that runs postcss over the 7 files and fails on parse warnings. postcss is already installed.
  - Don't run Prettier over the ported one-line layers: tests regex them by layout (for example `QuickLookupApp.test.tsx:250-256`).
- **Size:** S
- **Proof of no change:** whitespace and comments only, and the build shows zero warnings.
- **Overlap:** D-14 (same edit).

## Appearance changes (out of scope)

- **Body base values (C-07):** moving `body` to the shell layer's own values would change three things: `--surface-wash` instead of `--surface-ground`, `100dvh` instead of `100vh`, and `--font-body`, which drops `Roboto` from the fallback stack. The colour and height are visible. The font change only shows before Inter loads or if it fails.
- **480 vs 479 px:** the short-phone rule is `max-width: 480px` (`index.css:289`), but the label fold is 479 px (`flow.css:281`, `index.css:2489`). Aligning them changes layout at exactly 480 px, and `QuickLookupApp.test.tsx:253` pins the 480 literal.
- **Two monospace stacks:** `index.css:222` uses `ui-monospace, monospace`; `:743` uses `ui-monospace, SFMono-Regular, Menlo, monospace`. Unifying them changes the font on some platforms.
- **Mockup sizes vs REQ-205 tap sizes:** `.send-pair`, `.send-wrap`, `.q-box .deep` and `.fb-pill` are 40 px in the layers and 44 px in `index.css`. Deciding which file owns the value is U-07 / card-rings work; folding wrongly changes pixels.
- **`.act-zones button` vs `.place-zones button`:** `:2200` is one grouped rule, and `:2282` overrides six of its properties for `.act-zones`. Splitting the group so each zone set states its own values is the cleaner shape, but it is churn and risks a visible slip.

## Healthy — don't fix

- Colours are on tokens: `index.css` has 8 literal colours, 3 of them already in U-13, and the rest are the ring fallback and mask `#fff`. Shadows go through `glows.css` tokens; only 6 literal-length shadow declarations remain, 4 of them in the ambient-accent contract, which a test pins.
- All 47 `@keyframes` are referenced by an `animation`, apart from the dead-selector users in C-03.
- Tailwind palette colours appear only in the REQ-216 exemptions plus U-13's one line. There are only 5 arbitrary values (ScanDebugOverlay, CardSelectionPreview, StepEyebrow).
- Inline `style={{…}}` objects are all dynamic values: ring colours, drag offset, fill percent, grid size. The one static exception is `CounterPanel.tsx:448`.
- The REQ-205 transparent-halo blocks (`index.css:2540-2580`, `:3792-3843`) repeat one technique on purpose, with per-control insets. A shared utility would mean markup changes for no visible gain.
- The literal `44px` (49 times in `index.css`) and `999px` are not worth tokenizing: the token layer is the ported mockup file, and tests assert the literal `44px`.
- The one-line rule style in `flow.css`/`shell.css` is the mockup port's own format. Keep it; tests regex it.
- `.ring` is the only collision between a custom class and a Tailwind utility (C-12 covers it).

Scratch scripts and the build output are in `/private/tmp/claude-501/-Users-chrismiho-Coding-Projects-TheJudge/ddf415bc-a3a4-43fb-afd7-540b54a625a5/scratchpad/` (`rules.json`, `dups.txt`, `dead2.js`, `kf3.js`, `vars2.js`, `collide.js`, `dist/`). No repository files were changed.
