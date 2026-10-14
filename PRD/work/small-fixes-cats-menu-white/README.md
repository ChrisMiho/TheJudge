status: refined

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
- Findings (attempt 2; attempt 1's four are verified resolved): (A) the new `:root` block in `tokens.css` must stay before every `[data-profile]` block (equal specificity, later wins) — say so, assert the order in a stylesheet test and live-check Blue and one other colour; (B) `AmbientScene.tsx:550` still falls back to `'blue'` before `applyPalette` runs — change it to White (add to Touches with a test) or record it as a one-frame transient the observer corrects. Full report: `QUALITY-CHECK.md`.
