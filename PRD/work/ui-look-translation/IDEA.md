# ui-look-translation

Problem: the first build (PR #239) put the direction-1 behaviour in place, but the app does not look like the approved mockup. The ambient scene is a haze instead of the mockup's canvas, panels are opaque instead of glass, the header floats below the top edge, and the stage and composer do not match as whole shapes.
Outcome: every redesigned screen is indistinguishable from its mockup page, except where an accepted rule says behaviour differs, by porting the mockup's stylesheet layer and ambient scene and mirroring its DOM order per screen, all under one shared visual system.
Non-goals: no new design direction, no behaviour change beyond the points the owner decides at the define gate, and the Life Tracker table stays pixel-unchanged.

## Prior run

- Prior run: `PRD/instructions/receipts/ui-reimagining-build-2026-10-02.md` (the first build, PR #239; its `## Owner questions` feed this run)
- Prior run: `PRD/instructions/receipts/ui-reimagining-2026-09-24.md` (the direction-1 design run)
- Prior run: `PRD/instructions/receipts/ui-refinement-2026-08-02.md`
- Prior run: `PRD/instructions/receipts/ui-polish-subtle-effects-2026-06-29.md`
- Prior run: `PRD/instructions/receipts/ui-flare-chat-motion-2026-08-03.md`
- Prior run: `PRD/instructions/receipts/ui-compact-layout-refinement-2026-06-26.md`
- Prior run: `PRD/instructions/receipts/quick-question-ui-refinement-2026-08-02.md`
- Prior run: `PRD/instructions/receipts/ui-review-2026-08-11.md`
- Prior run: `PRD/instructions/receipts/excess-ui-2026-08-03.md`

These are offered to refinement as input, never as scope.
