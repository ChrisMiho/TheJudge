# GAMEPLAN — ui-look-translation

Goal: every redesigned screen looks like the direction-1 mockup (`docs/design/ui-reimagining/direction-1/`), except where an accepted gate block says the app behaves differently. Source of intent: `DESIGN-BRIEF.md`; finalized proposal: `GATE-QUESTIONS.md` (13 accept, 1 edit; REQ-079 retired). Base: PR #239's branch (`thejudge-auto/ui-reimagining-build-work`); the code PR targets it, not `main`.

## Architecture

Port the mockup, do not re-approximate it.

1. Tokens: `tokens.css` is the only place a colour, surface, radius, shadow, glow, type size or spacing value is defined. REQ-200's roles and `lib/theme/` resolve to it.
2. Shell: `shell.css` + `ambience.css` (header, Menu tray, Theme band, sheets, ambient scene).
3. Flow: `flow.css` (stage, composer, plates, shelf, pills).
4. One `AmbientScene` mounts the port of `ambience.js` on a fixed canvas; still frame under reduced motion.
5. Each React screen renders its mockup page's DOM order and class names so the ported CSS applies unchanged. Props, state and behaviour tests of shared components stay.

Mockup pages: `shared-chrome-menu.html`, `quick-question.html`, `in-depth-question.html`, `trade-balancer.html`, `card-scan.html`, `life-tracker-menus.html` (plus `life-tracker-after.html` for the untouched table). The requirement wins on behaviour; the mockup wins on look; a look change that needs a behaviour change is parked for the owner, never a builder's call.

## Slices

| Slice | Name | Mockup page | Depends on | Gate blocks applied |
| --- | --- | --- | --- | --- |
| A | Frame | `shared-chrome-menu.html` | none | NFR-006, REQ-207, REQ-216 |
| B | Ask a Question | `quick-question.html` | A | FLOW-011, REQ-124, REQ-079 (retire), REQ-070, REQ-206, REQ-167 |
| C | In-depth details | `in-depth-question.html` | A (code for REQ-070/REQ-124 here; truth edits in B) | REQ-209 |
| D | Trade Balancer | `trade-balancer.html` | A | REQ-215 |
| E | Card scanner | `card-scan.html` | A | REQ-214 |
| F | Life Tracker menus | `life-tracker-menus.html` | A | REQ-202, REQ-082 |

B to F are independent of each other; they run in letter order only because they all add lines to `index.css` on one stacked branch. F is final and carries the promotion checklist and Ship gates. The Life Tracker table is out of scope and pixel-unchanged (REQ-202): its before/after pair is attached by every slice, never a slice of its own.

## Id to slice (each applied in exactly one slice)

| Id | Slice | Notes |
| --- | --- | --- |
| NFR-006 | A | canvas scene allowed |
| REQ-207 | A | header at top edge, glass panels |
| REQ-216 | A | applied here; cited by every slice |
| FLOW-011 | B | two-row composer |
| REQ-124 | B | truth edit here; In-depth code lands in C |
| REQ-079 | B | retire; whole 69-row amendment set (functional-requirements, user-flows, system-map, quick-lookup spec and README, `screen-layout.md` zero hits) plus the code removing the panel and the locked topic pill (REQ-091 loses its only entry point) |
| REQ-070 | B | truth edit here; In-depth code lands in C |
| REQ-206 | B | position dots |
| REQ-167 | B | early card search on Ask a Question |
| REQ-209 | C | ruling Edit chip |
| REQ-215 | D | same printing merges |
| REQ-214 | E | scanner hint line |
| REQ-202 | F | Edit names, Done bar |
| REQ-082 | F | content-sized Counters sheet |

Build applies each block to `PRD/sections/` by intent against current truth, exactly once, in the slice named above.

## Data flow and verification

- Capture: serve the build in mock mode on its own port and a copy of the mockup folder on another; Playwright MCP, absolute paths, reduced motion emulated, same profile and state both sides, 390x844 and 1440x900.
- Compare: `node scripts/compare-screenshot-pair.mjs --build ... --mockup ... [--mask ...] [--tolerance N]` (created in slice A) prints one JSON line; each slice records one row per pair in `docs/design/ui-reimagining/build-screenshots/translation/<screen>/DIFF-RESULTS.md` against its own threshold below 0.05.
- Audit: REQ-216 (a1) whole files of the rebuilt components and (a2) every added line under `apps/frontend/src`, brief's verbatim command, both zero; plus a two-profile recolour pair.
- Tests: `npm run quality:check`, `npm --workspace apps/frontend run test`, `npm --workspace apps/backend run test`.
- Cleanup evidence per slice: browser closed, owned servers stopped, ports released, capture path recorded.
- Review compares pairs and numbers; the owner's side-by-side look is the final check; the code PR stays IN PROGRESS until then.

## Constraints

- Ports 5273, 3100 and 5300 are the owner's: a build never starts, stops or reuses them. Serve its own build with `VITE_ASK_AI_PROVIDER=mock PORT=<port> FRONTEND_PORT=<port> node scripts/dev.mjs` and its own copy of the mockup folder on other ports.
- Playwright MCP needs absolute paths. Never stash.
- Presentation only except where an accepted block says otherwise: no change to `AskAiRequest`, Zod schemas, prompts, backend routes, card metadata, scan matching, or the data pipeline.
- No new dependency (pngjs is already a devDependency), no light theme, no animation library.
- Deliverables land outside `PRD/work/` (screenshots and `DIFF-RESULTS.md` under `docs/design/ui-reimagining/build-screenshots/translation/`, the script under `scripts/`) because close deletes the package folder.
- Exempt from the REQ-216 audit: token layer (`lib/theme/`), ported stylesheets, `AmbientScene.tsx`, `TradePile.tsx`, `ScanCardOutline.tsx`, `ScanDebugOverlay.tsx`, `lib/cardIdentityRing.ts`, the Life Tracker table files.

## Risks

- Scene frame must be identical run to run for the pixel diff; slice A records how (A7).
- Glass values may break REQ-200 contrast floors; the requirement wins and the slice raises the value (A6).
- Mockup deviations forced by REQ-122/REQ-205/REQ-123 are named masks.
