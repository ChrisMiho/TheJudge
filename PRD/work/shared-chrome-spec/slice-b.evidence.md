# Slice B — manual observation log

2026-08-27 B3 — read each of the last four "How it works" subsections
(PRD/sections/shared-chrome/README.md lines 169-274) against
PRD/sections/decisions/conversation-ux.md (DEC-118, DEC-123, DEC-124,
DEC-125, DEC-126, DEC-127, DEC-129, DEC-130, DEC-131, DEC-134, DEC-138,
DEC-141, DEC-142, DEC-143, DEC-144, read in full) and PRD/sections/
decisions/ui-presentation.md (DEC-151, DEC-156, DEC-158, DEC-159, DEC-160,
read in full). Every bullet traces: shared ConversationWorkspace + stable
workspace rows (DEC-118/DEC-127), markdown rendering + auto-scroll
threshold + reduced motion (DEC-123/DEC-118/DEC-127/NFR-006), short-thread
fill + Start Over reachability (DEC-131/DEC-127/NFR-001), View Context top
clearance post-DEC-137 (DEC-141/REQ-116/DEC-129); 20-entry cap + auto-save
+ guarded reads (DEC-124/FLOW-016/DEC-103-precedent), History-zone entry
point + always-present + non-overlap + LeftEdgeDrawerContext mutual
exclusivity + In-Depth staged-step landing (DEC-126/DEC-129/DEC-134/
DEC-125/FLOW-016), one Draft slot + auto-hydrate + first-submit-clears
(DEC-130/DEC-138/FLOW-017), per-row delete + confirm + active-delete-clears
(DEC-143/REQ-118/FLOW-018); compact View Context trigger + AdaptiveContext
Dialog bottom-sheet/right-drawer + focus trap/restore (DEC-118/DEC-141),
shared outside-click dismissal across the overlay family (DEC-142/REQ-117/
REQ-135), CardSelectionPreview defensive rendering (DEC-144/REQ-119);
corner control opens dismissible popup with local fields only, portal into
AdaptiveContextDialog family, sized to own content, one shared component
across six card surfaces (DEC-151/DEC-158/REQ-128), CardPresentation
Remove-card-only + container-relative sizing (DEC-156/DEC-160/DEC-151/
REQ-141), one shared overlay close-control component across the named
adopters (DEC-159/DEC-156/REQ-142). No invented capability and no dropped
behavior found.

2026-08-27 B4 — read "Measured bounds" (PRD/sections/shared-chrome/
README.md lines 307-357), conversation-chrome bullets (history drawer
width/cap, View Context, workspace clearance, card popup, shared card
image) against the same DEC bodies above and PRD/sections/screen-layout.md's
"Shared chrome" catalog rows for History drawer, View Context, and Card
detail popup. Figures match: history drawer phone min(22rem,88vw) / desktop
min(30rem,90vw) with 20-entry cap + Draft exclusion (DEC-134/DEC-124/
DEC-130); View Context ≥25% scrim / ≤75dvh (REQ-135/DEC-118/DEC-160/
DEC-142); --layout-surface-gap 8px/16px, rail bottom clearance, 64px
auto-scroll threshold (DEC-141/REQ-116/DEC-118); card popup bottom-sheet/
side-panel content-sized, superseded 92x128px/356px/37px geometry
(DEC-158/DEC-151/REQ-128); shared card image container-relative sizing,
~300px floor, w-40/160px zone tile, REQ-129 ceiling (DEC-160/REQ-141). No
contradiction found with slice A's structural bullets (disjoint DEC/REQ
groups, disjoint surfaces).

2026-08-27 B5 — read the four conversation-chrome closed-door bullets in
"Rejected alternatives and deferred scope" (lines 394-406) against each
cited DEC's Context/Notes prose (conversation-ux.md and ui-presentation.md,
both read in full above): full-width in-body history trigger / per-flow
answered-state assemblies (DEC-126 Decision "supersedes DEC-125's...
placement clause"; DEC-125 Decision "instead of a full-width button... the
trigger becomes a small icon-only control"; DEC-118 Impact "one shared
workspace... rather than maintaining separate answered-state assemblies"),
bordered-panel max-h-96 chat thread / fixed-viewport composer (DEC-127
Decision "stops being a secondary bordered panel capped at a small fixed
height... It instead fills the available vertical space"; DEC-131 Impact
"the thread region absorbs available height when content is short"),
card-detail-popup-bound-to-image's-box (DEC-158 Decision "no longer bound
to the card image's bounding box... rather than position: absolute;
inset: 0 over the image"; DEC-151 Notes "popup geometry amended by
DEC-158"), fixed max-h-32 shared-card-image cap (DEC-160 Decision "single
max-h-32 (128px) height cap is replaced by a rule that lets the image fill
the width its host container affords"; DEC-151 Notes "image sizing amended
by DEC-160"). Each bullet's Context/Notes language matches the file's
prose; nothing invented, nothing omitted.

2026-08-27 B6/correction — while confirming every named file in the
conversation-chrome portion of "Where it lives" (lines 429-435) against
`find`/`ls`, found three path inaccuracies: (1) `CardDetailPopup` is not
a separate file — it is a component co-located inside
`apps/frontend/src/components/CardPresentation.tsx` (confirmed via
`grep -n "export function CardDetailPopup" apps/frontend/src/components/
CardPresentation.tsx`, line 100); (2) `FeedbackModal.tsx` lives at
`apps/frontend/src/components/feedback/FeedbackModal.tsx`, not directly
under `apps/frontend/src/components/`; (3) `GameSetupModal` is not a
separate file — it is a component co-located inside `apps/frontend/src/
components/portal/life-tracker/PlayerLifeTrackerApp.tsx` (confirmed via
`grep -n "function GameSetupModal"`, line 24), while `CounterPanel.tsx`
genuinely is its own file at `apps/frontend/src/components/portal/
life-tracker/CounterPanel.tsx`. Applied a bounded additive correction to
that one sentence in `PRD/sections/shared-chrome/README.md`, naming the
correct file paths and marking the two co-located components as such. No
ID token added or removed; no other line touched.
