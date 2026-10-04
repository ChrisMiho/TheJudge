status: refining

# anchor-ask-composer

See IDEA.md. Intake: intake/GRAPH-BRIEF.md.

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/anchor-ask-composer

## Preparation gate

- Quality-check: FAIL (2026-10-03, gate-qc attempt 1)
- Checked artifact: `PRD/work/anchor-ask-composer/DESIGN-BRIEF.md`
- Findings:
  1. Wrong frame variant. The brief and REQ-218 name `page-content-wide-fit` (56rem / 94vw). Both Ask screens use the `narrow` variant today (36rem / 92vw); the matching fit variant is `narrow-fit` (`PageShell.tsx`). Adopting wide-fit silently widens the column and contradicts the screen-layout Ask rows (shell 92%/48rem cap). Name the correct fit child and state in REQ-218 that column width is unchanged.
  2. In-depth variant switching is a hidden assumption. `PageShell`'s variant is per page; Game/Zones/Cards stay content-sized (DEC-145) while only Enrichment is framed. State how the frame applies only at the Enrichment station (conditional variant) in the brief and REQ-218, or the implementer must guess.
  3. Proposed quick-lookup/README.md Layout/fit diff reads "the pre-submit view is a 100dvh anchored frame ... and the answered workspace follow ..." (subject/verb broken). Reword.
  4. screen-layout.md Ask pre-submit Notes cell still cites DEC-145 (content-sized) while the proposed Phone/Desktop cells drop that wording; add a note or edit so the row does not contradict itself.
