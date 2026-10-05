status: refining

# tab-personality-color-sync

See IDEA.md. Define node (node 3) shaped DESIGN-BRIEF.md and GATE-QUESTIONS.md
(REQ-219 proposed; one blocker, Q-219). Ready for gate-qc (node 4).

## Autonomous metadata

- Autonomous base: origin/thejudge-auto/tab-personality-color-sync

## Preparation gate

- Quality-check: FAIL
- Checked artifact: `PRD/work/tab-personality-color-sync/DESIGN-BRIEF.md`
- Findings:
  1. Stale token rule. The brief ("No new token roles ... DEC-081's explicit 'no new token roles'") and REQ-219's Constraints carry the retired DEC-081 clause. Live REQ-060 says that clause is "superseded by REQ-200's named surface roles". Restate as: reuse the four accent tokens and REQ-200 surface roles, no per-component overrides, define the rest/hover/current treatment once through shared semantic styling (REQ-060 Constraints).
  2. Wrong authority for the "identical rows" refinement. The brief and REQ-219 say they refine DEC-104 "rendered identically". The PRD never says that: DEC-104 (retired) only adds action entries, and "rendered identically in array order" is a code comment (`FeaturePortalMenu.tsx:45`). The PRD rule on row presentation is DEC-135 / shared-chrome "Rows render full-bleed ... active entry keeps a check mark and quiet fill". Cite that, say REQ-219 adds per-row identity within it, and keep the check mark on the active row in the acceptance criteria.
  3. Missing live dependencies. REQ-219 depends only on retired DEC rows plus REQ-067/206/207/213. Add REQ-060 (ambient accent hierarchy, which REQ-219 extends to the tray rows), REQ-200 (surface roles), REQ-059 (motion baseline), DEC-135. State that REQ-060's inventory is a minimum, so no REQ-060 amendment is needed.
  4. Untestable acceptance wording. "bolder, consistently-sized identity mark" and "livelier" have no checkable bar. Give a measurable criterion (e.g. one shared glyph box size for all five rows, larger than today's, accent applied via tokens) so build and review can pass or fail it.
