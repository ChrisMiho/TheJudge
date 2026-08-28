# Sweep finding — navigation
- Corpus file: /Users/chrismiho/Coding/Projects/TheJudge/PRD/sections/decisions/navigation.md
- Scored against: 7 current-state specs under PRD/sections/<feature>/README.md
- Items: 14

## DEC-095 — absorbed
Extensible destination registry and frontend-only, state-preserving mode switching are both live in shared-chrome/README.md ("the tray lists the registered destinations in registry order", DEC-095 cited); the top-middle placement clause is correctly shown as superseded by DEC-122 in the same spec's "Rejected alternatives" section rather than dropped silently.

## DEC-104 — absorbed
Action-entry registry kind and the v1 Send feedback entry are both in shared-chrome/README.md: "then the Send feedback action entry (which opens the feedback modal without switching the active destination)".

## DEC-109 — absorbed
The "never floats fixed / dock inline to the shell" guarantee is restated verbatim in shared-chrome/README.md ("never fixed to the viewport (a fixed fallback survives in code only as a defensive net for a hypothetical headerless destination)"); the PortalSlot mechanism it introduced is still listed live under "Where it lives" (`PortalSlot.tsx`, `slotContext.tsx`).

## DEC-110 — absorbed
Theme section hosted inside the Menu (no standalone floating theme control) is stated directly in shared-chrome/README.md's "Theme section" block.

## DEC-111 — absorbed
The surviving sessionStorage bare-`/` fallback semantics (guarded read/validate/fallback) are captured in shared-chrome/README.md: "persists across a refresh within the same tab via guarded sessionStorage (demoted to the bare-`/` fallback under DEC-157)" — matching the decision's own note that only its no-URL-routing clause was superseded.

## DEC-121 — obsolete
Superseded outright by DEC-122 per the decision's own Notes; shared-chrome/README.md's "Rejected alternatives" section names it explicitly as a closed door ("Top-middle Menu tab with a widen-and-glow prominence pass — closed door"), so none of its width/border/glow treatment applies to current state.

## DEC-122 — absorbed
Corner-rail trigger, sliding tray, centered brand block, and in-flow eyebrow label are all in shared-chrome/README.md's "Menu corner rail and tray" block, matching the decision's Impact list point for point.

## DEC-133 — absorbed
Full-height left tray sized to the visible shell, matching top/bottom-left radii, and the optional decorative brand mark are stated in shared-chrome/README.md ("the tray fills the visible shell side... with matching top- and bottom-left shell radii and an optional quiet, non-interactive brand mark in unused lower space").

## DEC-135 — absorbed
Quick Question as default/leading destination and full-bleed edge-to-edge row separators are both in shared-chrome/README.md's Menu tray bullet.

## DEC-137 — absorbed
Both parts are captured: the single-zone rail's interactive-box-capped-to-paint geometry with hit-testing as the compliance check, and the side-by-side split rail for History-bearing destinations, are both in shared-chrome/README.md's "Menu corner rail and tray" block and the "Measured bounds" section.

## DEC-140 — absorbed
Tray occluding the History zone and hiding/disabling the rail icons while open (as amended by DEC-150) is stated in shared-chrome/README.md: "while the tray is open, neither the Menu trigger nor the History zone is visible or hit-testable... and the tray fully occludes the under-rail History zone."

## DEC-147 — absorbed
Full-content opacity and painted-bounds-stay-inside-viewport are both in shared-chrome/README.md's tray bullet ("opaque across its full painted bounds... painted content does not overflow the shell/viewport bottom").

## DEC-150 — absorbed
Rail icons hidden/unclickable while the tray is open, with outside-click/Escape as the sole close path, is stated verbatim in shared-chrome/README.md, including the aria-hidden/tabIndex/pointer-events mechanism.

## DEC-157 — absorbed
Flat react-router destinations, URL as source of truth, keep-alive `DestinationOutlet` mounting preserved, per-destination `React.lazy`/`Suspense`, and the scan/vendor `manualChunks` groups are all covered in shared-chrome/README.md's "Destination routing and the load fallback" section, matching the decision's Impact list in detail.
