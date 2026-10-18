status: active

# codebase-cleanup-pass

A behavior-preserving health pass over the code: clearer structure, faster and cleaner tests, dead code and dead styles removed. Players see no change.

- Idea: `IDEA.md`
- Intake (evidence only, 13 files from the 2026-10-18 and 2026-10-17 probes): `intake/`
- Start with `intake/HEALTH-REPORT-2026-10-18.md` and `intake/HEALTH-REPORT.md`.
- Design brief: `DESIGN-BRIEF.md` — eleven behavior-preserving slices (A–K; K added by owner decision on 2026-10-18), a disposition for every Q-, C-, K-, T- finding, follow-ups. No product-truth change, so no `GATE-QUESTIONS.md`.
- Quality check: `QUALITY-CHECK.md` — PASS, five advisory findings.
- Next step: the owner reviews the docs PR and merges it; `graph-implement` builds it.
- Gameplan: `GAMEPLAN.md`. REQ-202 screenshot pairs for J and K are kept in `docs/design/codebase-cleanup-pass/` (outside `PRD/work/`).

## Slices

Built strictly in order; each ships alone.

| Slice | Doc | Depends on | Status |
| --- | --- | --- | --- |
| A | [slice-a.md](slice-a.md) — backend tests faster, no leaked temp folders | none | done |
| B | [slice-b.md](slice-b.md) — frontend tests: lighter setup, shared helpers | none | done |
| C | [slice-c.md](slice-c.md) — passing checks switched on | none | done |
| D | [slice-d.md](slice-d.md) — ship only what runs; shared script helpers | A | done |
| E | [slice-e.md](slice-e.md) — combo matching skips incomplete combos | none | done |
| F | [slice-f.md](slice-f.md) — prompt pipeline written once | none | planned |
| G | [slice-g.md](slice-g.md) — rule search scoring behind an order snapshot | E, F | planned |
| H | [slice-h.md](slice-h.md) — In-Depth question flow loses dead wiring | none | planned |
| I | [slice-i.md](slice-i.md) — scanner hook keeps only what screens use | none | planned |
| J | [slice-j.md](slice-j.md) — dead and duplicated CSS goes; parse errors fail the build | B | planned |
| K | [slice-k.md](slice-k.md) — Life Tracker cleanups | J | planned |

## Autonomous metadata

- Autonomous base: origin/main

## Preparation gate

- Quality-check: PASS
- Checked artifact: `PRD/work/codebase-cleanup-pass/DESIGN-BRIEF.md`
- Findings: none blocking (attempt 2, 2026-10-18, build half, re-grade of the owner-edited brief). Advisory: (1) slice K must also update the moved `useLifeTracker.ts`'s own relative imports (`../../types`, `./counters`, `./persistence`, `./state`, `./types`), not only the test's; (2) some cited line numbers are still the probes' and are marked so — the builder re-reads them. Attempt 1 (spec-forming half) also passed; its advisories, recorded next, were folded into the brief by the owner. Attempt 1 advisory: (1) T-11 drops the `master` push trigger but `PRD/instructions/ci.md:6` says the gate runs on pushes to main/master — add a `ci.md` line edit to slice D at map-out, or keep the trigger; (2) the disposition table counts 36 built + 11 built-in-part, not 27 + 20 (totals 47 and 68 hold); (3) "same timing" should read "same timing, except In-Depth combo matching gets faster" (slice E); (4) probe line numbers and bare file names need a builder re-read, which the brief already requires; (5) slice J's PR should state that the Life Tracker table's styles are in the computed-style dump (REQ-202). Owner review 2026-10-18: advisories 1, 2, 3 and 5 folded into the brief (`## Owner decisions`); 4 was already required.
