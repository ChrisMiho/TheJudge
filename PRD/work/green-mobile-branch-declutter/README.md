status: active

# green-mobile-branch-declutter

See IDEA.md.

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/green-mobile-branch-declutter/DESIGN-BRIEF.md`
- Findings: none blocking (re-check 2026-10-04 after the define gate resolved — REQ-207 accept-as-written). Brief and finalized proposal agree (green on a phone `< 768px` stays a quiet backdrop clear of content; green-only, presentation-only); no new IDs; the three REQ-207 diff anchors exist verbatim in `functional-requirements.md`; cited truth (REQ-201, DEC-117, DEC-149) real; `AmbientScene.tsx:169` is `if (H > W * 1.6 && W < 520)`. Four non-blocking implementer notes: (1) the fix must cover the whole phone band `< 768px`, not only the current `W < 520` trigger; (2) the only required evidence is a before/after screenshot pair at 390×844 on Ask a Question, In-depth, and the Menu tray; (3) the grounding screenshots in `.playwright-mcp/` are gitignored and absent, so capture a fresh "before" pair; (4) REQ-207's "phone shell ≈ 100% of viewport width" is better cited to `screen-layout.md` than DEC-145/REQ-124 — cite imprecision, requirement unchanged.

## Slices

| Slice | Doc | Criteria | Depends on | Status |
| --- | --- | --- | --- | --- |
| A | `slice-a-quiet-green-phone-scene.md` | `slice-a.criteria.json` | none | planned |

Implementation map: `AmbientScene.tsx` (`GREEN.backdrop`/`init`) and its test; the REQ-207 amendment is applied at build. See `GAMEPLAN.md`.
