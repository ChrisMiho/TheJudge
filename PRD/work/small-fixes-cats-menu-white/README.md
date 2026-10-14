status: refining

# small-fixes-cats-menu-white

Four small fixes: cats Easter egg, bigger desktop menu button, White as the default colour, no menu scrollbar. See `IDEA.md`. Owner request: `intake/owner-request.md` (evidence only).

- Design brief: `DESIGN-BRIEF.md`
- Proposed product truth (owner answers): `GATE-QUESTIONS.md` — REQ-203, REQ-207, REQ-099, REQ-044, FLOW-007, REQ-113
- Live measurements: `evidence/measurements.md` (screenshots in `.playwright-mcp/`, local only)

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/small-fixes-cats-menu-white

## Preparation gate

- Quality-check: FAIL
- Checked artifact: `PRD/work/small-fixes-cats-menu-white/DESIGN-BRIEF.md`
- Findings: (1) the default-colour test pin is the whole `palettes.test.ts` test at lines 76-80 (line 80 also asserts the name contains blue, and the title says default blue palette), plus the `falls back to Blue` title at `App.mtg-color-themes.test.tsx:171` — the brief names only line 77; (2) `tokens.css` lines 41-42 combine `:root, [data-profile="blue"]` — the brief must say to split it so `[data-profile="blue"]` keeps Blue's values (including `--motif` and `--wash-tint`) and `:root` takes White's; (3) White on first paint has no automated check — add an assertion that the `:root` tokens, the theme-color tag and the favicon fill equal White's values, and note the hard-coded hex in `index.html` as a deliberate placeholder exception to the no-hard-coded-per-profile-hex rule (REQ-219/REQ-216); (4) two acceptance criteria are not testable as written — no test asserts the cats sit directly under the header on non-Game screens, and scrollWidth-equals-clientWidth cannot be measured in jsdom, so name the automated form (a stylesheet assertion that the right-edge line no longer overhangs the tray and the tray does not scroll sideways) and keep the live 390×844 and 1440×900 measurement as the verification step. Full report: `QUALITY-CHECK.md`.
