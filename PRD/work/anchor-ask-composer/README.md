status: refined

# anchor-ask-composer

See IDEA.md. Intake: intake/GRAPH-BRIEF.md.

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/anchor-ask-composer

## Preparation gate

- Quality-check: PASS (2026-10-03, gate-qc attempt 3). Width finding (attempt-2 item 5) RESOLVED: REQ-218 scopes the scanner's 31.5rem override to the scanner host, keeps the Ask column 36rem / 92vw, and carries a measured 1440px criterion. All proposed diff `-` anchors match current PRD/sections text; no remaining findings.
- Previous: FAIL (gate-qc attempt 2)
- Attempt 2 findings (latest; attempt-1 items 1-4 below are RESOLVED):
  5. "Column width unchanged" is false as written. `apps/frontend/src/index.css` (~line 4244) has `@media (min-width: 720px) { .page-content-narrow-fit { width: min(31.5rem, 92vw); } }`, a scanner-specific override that shrinks the narrow-fit column to 31.5rem on desktop (narrow is 36rem). Adopting `narrow-fit` as-is narrows both Ask screens on desktop, contradicting the brief and REQ-218 criteria ("36rem / 92vw", "must not widen/change"). Refinement must either scope that override to the scanner (scanner-only class) so Ask keeps 36rem, or state the width change as an explicit decision; and add a REQ-218 criterion asserting the column width at 1440px.
- Attempt 1 record:
- Checked artifact: `PRD/work/anchor-ask-composer/DESIGN-BRIEF.md`
- Findings:
  1. Wrong frame variant. The brief and REQ-218 name `page-content-wide-fit` (56rem / 94vw). Both Ask screens use the `narrow` variant today (36rem / 92vw); the matching fit variant is `narrow-fit` (`PageShell.tsx`). Adopting wide-fit silently widens the column and contradicts the screen-layout Ask rows (shell 92%/48rem cap). Name the correct fit child and state in REQ-218 that column width is unchanged.
  2. In-depth variant switching is a hidden assumption. `PageShell`'s variant is per page; Game/Zones/Cards stay content-sized (DEC-145) while only Enrichment is framed. State how the frame applies only at the Enrichment station (conditional variant) in the brief and REQ-218, or the implementer must guess.
  3. Proposed quick-lookup/README.md Layout/fit diff reads "the pre-submit view is a 100dvh anchored frame ... and the answered workspace follow ..." (subject/verb broken). Reword.
  4. screen-layout.md Ask pre-submit Notes cell still cites DEC-145 (content-sized) while the proposed Phone/Desktop cells drop that wording; add a note or edit so the row does not contradict itself.
