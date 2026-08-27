# Slice A — manual observation log

2026-08-27 A3 — read "What it is" (PRD/sections/shared-chrome/README.md lines
17-44) against PRD/sections/system-map.md's "## Feature portal (app
navigation)" block and the package README. It names all four registered
destinations (Quick Question, In-Depth Question, Life Tracker, Trade
Balancer), frames shared chrome as the mounting frame every destination
lives inside (shell, Menu rail, layout rules, chat workspace/history
drawer/View Context/card-detail popup for the two ask flows), and states the
binding-constraint-7 split explicitly ("per-screen rows stay with their
feature... while shared chrome and the shared layout language live here").
No invented scope found.

2026-08-27 A4 — read each of the first four "How it works" subsections
(lines 48-167) against PRD/sections/decisions/navigation.md (DEC-095,
DEC-104, DEC-109, DEC-110, DEC-111, DEC-121, DEC-122, DEC-133, DEC-135,
DEC-137, DEC-140, DEC-147, DEC-150, DEC-157, read in full), PRD/sections/
decisions/ui-presentation.md (DEC-085, DEC-117, DEC-145, DEC-148, DEC-149,
read in full), and PRD/sections/system-map.md's "## Feature portal (app
navigation)" and "## Mock-mode banner" blocks. Every bullet traces to its
cited source: shell/PageShell full-bleed exception (DEC-145/DEC-117),
mock-mode banner single-source-of-truth + single-mount + known gap
(DEC-085/REQ-123), flat top-level routing + URL-as-truth + keep-alive
mounting (DEC-157), per-destination Suspense + manualChunks (DEC-157/
NFR-014), corner-rail trigger + full-height tray + brand centering +
eyebrow relocation (DEC-122/DEC-109/DEC-133), registry-order tray list +
Send-feedback action entry + Theme section (DEC-135/DEC-104/DEC-095), tray
opacity/bounds (DEC-133/DEC-147), split Menu+History rail + hit-testing
(DEC-137/DEC-126), rail-icons-hidden-while-open + outside-click/Escape
close (DEC-150/DEC-140/DEC-147), sessionStorage bare-`/` fallback
(DEC-111/DEC-157), Theme-section-in-tray + no standalone control
(DEC-110), automatic fluid responsive presentation (DEC-117/REQ-096/
NFR-011), palette-orb row inset (REQ-131/DEC-135). No invented capability
and no dropped behavior found.

2026-08-27 A6 — read "Measured bounds" (lines 307-357), structural bullets
only (shell width, single-zone rail, split rail, Menu tray, mock-mode
banner, routing, touch-target/text floor) against the same DEC bodies and
PRD/sections/screen-layout.md's "Shared chrome" catalog rows (Suite shell,
Destination load fallback, Mock-mode banner, Feature-portal Menu rail +
tray). Figures match: 768px desktop shell at 1440px viewport (DEC-145),
5.5rem x 3.5rem / 5.5rem x 10.5rem single-zone rail (DEC-137), 2.75rem x
2.75rem split-rail zones in one 2.75rem band (DEC-137), NFR-001 44px touch
floor. Read through into the conversation-chrome bullets that follow
(history drawer, View Context, workspace clearance, card popup, shared card
image) and found no contradiction with the structural bullets — the two
sets cite disjoint DEC/REQ groups and disjoint surfaces.

2026-08-27 A7 — read the eight structural closed-door bullets in "Rejected
alternatives and deferred scope" (lines 361-393) against each cited DEC's
Context/Notes prose in PRD/sections/decisions/navigation.md and PRD/sections/
decisions/ui-presentation.md (read in full above): top-middle Menu tab
(DEC-122/DEC-121 Notes: "superseded outright by DEC-122... none of this
decision's width/border/glow treatment carries forward"), partial-height
floating drawer (DEC-133 Impact/Context), stacked Menu-over-History zones
(DEC-137 Decision part 2 + Notes "amends DEC-126's stacked two-zone
arrangement to side-by-side"), rail interactive-box-exceeds-paint (DEC-137
Decision part 1 + Context), Menu-trigger-as-close-control (DEC-150 Decision
"amends DEC-140's prior... clause"), sessionStorage-as-source-of-truth
(DEC-157 Notes "supersedes only DEC-111/REQ-090's no-URL-routing
constraint"), single-Suspense-boundary (DEC-157 Decision "never a single
boundary around the outlet, which would suspend and blank already-loaded
siblings"), standalone floating theme control/density preference
(DEC-110/DEC-117 Decision+Impact). Each bullet's Context/Notes language
matches the file's prose; nothing invented, nothing omitted.
