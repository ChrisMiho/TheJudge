# GAMEPLAN — anchor-ask-composer

Player-facing goal: on both Ask screens (Ask a Question, In-depth Enrichment) typing a long question grows the box upward in place. The cards stay on screen, the send button stays put, and on a phone the box floats above the keyboard.

Source of truth: `DESIGN-BRIEF.md` and `GATE-QUESTIONS.md` (all four verdicts accept). Quality-check: PASS recorded in README `## Preparation gate`.

## Architecture

- One shared layout move. Reuse the shipped `page-shell-fit` shell with the `narrow-fit` content child (`PageShell` variant). No new frame, no `overflow: hidden` on the inner column.
- `index.css` ~line 4268 holds a global scanner-only `.page-content-narrow-fit { width: min(31.5rem, 92vw) }` at >=720px. Re-scope it to the scanner host so the Ask column keeps 36rem / 92vw.
- Ask a Question: the pre-submit `PageShell` in `QuickLookupApp.tsx` (line ~542) uses `narrow-fit` always (today only when the scanner is open). The `.qq` card stage becomes `flex:1; min-height:0` and region-scrolls; the composer (`ComposerPill`, `.q-box`) is the pinned foot.
- In-depth: only the Enrichment station (`EnrichmentStep.tsx` composer-surface `PageShell`, line ~737) switches `narrow` to `narrow-fit`. The conversation-active shell (~653), Game, Zones, Cards stay `narrow` (DEC-145). The per-card context list flexes and region-scrolls; the composer is pinned.
- Mobile keyboard: composer height resolves against `visualViewport` (plus `dvh`) so it sits above the on-screen keyboard.
- Untouched: `ComposerPill` structure, card stage, request modes, prompts, routes, backend, mock default.

## Slices

| Slice | Name | Depends on |
| --- | --- | --- |
| A | Scope scanner width override, frame Ask a Question | none |
| B | Frame In-depth Enrichment | A |
| C | Keep composer above the phone keyboard | A |
| D | Apply product truth, measured verification, ship gates | A, B, C |

## PRD truth application (build node, note carried from preparation)

Build applies the approved `GATE-QUESTIONS.md` diffs to `PRD/sections/` by intent, together with the code (slice D, with a draft check in each code slice's own area). The new REQ-218 entry must be placed between REQ-217 and REQ-219 in `functional-requirements.md` — the diff text says "after REQ-216" but ids shifted since it was authored. REQ-110, REQ-129, REQ-206 amend in place. Also the `screen-layout.md`, `quick-lookup/README.md`, `in-depth/README.md`, `user-flows.md` edits. Re-verify each `-` anchor against current text before applying. Coordinates with `indepth-chip-collapse` (same REQ-206 line): read the current REQ-206 text at apply time, never paste a stale line.

## Verification checklist

- [ ] `npm --workspace apps/frontend run test` green; `npm run quality:check` green
- [ ] 1440x716 and 390x740: document height never exceeds viewport with a 300-char question, on Ask a Question and In-depth Enrichment; send pill `bottom` inside viewport
- [ ] 1440px Ask column measures 36rem (576px), scanner column still 31.5rem (504px)
- [ ] Focused phone viewport: composer above the keyboard
- [ ] Phone search-fold, card-detail popup, answered follow-up composer still work
- [ ] Game / Zones / Cards steps still content-sized (no frame)
- [ ] Playwright browser closed, owned servers stopped, ports released, captures under `PRD/work/anchor-ask-composer/.playwright-mcp/`

## Risks

- Trade Balancer review gotcha: do not re-add `overflow: hidden` on the inner column at 1440px (clips the full-bleed header).
- Phone search-fold interacts with the flexing stage: verify after A.
- Measure in the browser; code reading alone has produced wrong layout premises here.
