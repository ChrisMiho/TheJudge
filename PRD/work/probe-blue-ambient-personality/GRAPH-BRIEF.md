# Graph-run brief — Blue connections and inscription variety

Review (build intake). Give Blue a more recognizable desktop scene with connected nodes forming shifting shapes, and make its larger drawn inscriptions vary beyond circles. Preserve the small floating runes the owner already likes.

## What the player gets

On desktop, Blue's nodes connect often enough to read as changing constellations, instead of primarily isolated glowing dots. Larger outlines write themselves, linger, and dissolve, cycling through multiple simple shape families. The smaller floating invented runes keep their existing appearance and motion.

## Why

The current page renders 35 dust nodes at every viewport: Blue's recipe has `n: 70`, while page attachment uses `k: 0.5` and `dust: 0.5`. Connections have an effective maximum distance of 96 CSS pixels (`links: 120` multiplied by `0.6 + 0.4 * 0.5`). Uniform positions across a larger desktop canvas produce far fewer close neighbors.

A geometry simulation of 5,000 uniform layouts per viewport compared identical 35-node distributions under the current radius and a desktop-only adaptive radius:

| Viewport | Current range | Current possible links | Proposed range | Proposed possible links |
| --- | ---: | ---: | ---: | ---: |
| 390×844 | 96px | 44.52 | 96px | 44.52 |
| 1280×800 | 96px | 15.53 | 169.3px | 45.07 |
| 1440×900 | 96px | 12.33 | 190.5px | 44.98 |
| 1920×1080 | 96px | 7.90 | 240px | 44.67 |
| 2560×1440 | 96px | 4.45 | 240px | 26.06 |

The proposed formula is: below 1024px keep the effective radius unchanged; at 1024px and above use `min(240, effectiveRadius * sqrt(W * H / (390 * 844)))`. For the current page, `effectiveRadius` is 96. Recompute against live canvas size on resize. At 1440×900, distance-weighted link strength also rises from 4.17 to 15.60, compared with mobile's 15.45. This model excludes lifecycle fade, drift, panel occlusion, and GPU performance; these figures support the geometry choice, not a claim of visual or performance validation. The 240px cap deliberately limits long lines, so very large displays remain somewhat sparser.

The large Blue actor is currently `spellCircle`, choosing a single ring or a ring with an inner circle. There are no other large shape families. The source comments record earlier feedback that large detailed shapes were excessive: keep the new forms simple.

## Owner intent and proposed defaults

The owner's request establishes more frequent desktop connected-node shapes, more variety among larger inscriptions, and preservation of the liked small floating shapes. No new preference control was requested.

The proposed larger-shape direction is geometric: ring (single/nested), triangle, diamond, hexagon, ellipse, and overlapping loops. An optional style question was offered, but no answer has arrived; this palette is a recommendation, not an owner-approved decision. Incorporate any later preference before finalizing the design.

## Design direction

- Work within `apps/frontend/src/components/AmbientScene.tsx`, the existing handwritten canvas renderer. Use desktop-only connection range scaling with unchanged particle count and initial opacity. Keep phone/tablet connections at the current setting; tray connections are currently disabled and should stay disabled for this work.
- Replace Blue's circle-only large actor with a general inscription actor supporting the six families above. Preserve the existing small `RUNES` and their spawning/motion.
- Select the family using a shuffled bag and prevent consecutive repeats across bag boundaries. Choose the family and any random geometric parameters when an actor spawns, not during drawing.
- Preserve progressive outline drawing, holding, and fading; one active large actor; 260 drawing frames, 600 holding frames, 260 fading frames; and 240–600 idle frames. This is existing frame-based timing, not a new time-based system.
- Preserve quiet outer/secondary strokes (currently alpha 0.16/0.09 before breathing/fade), modest glow, and bounded outline complexity. Avoid dense interior decorations.
- Preserve the existing placement intent: side gutters on wide screens, low on narrower screens and the tray. Current gutter threshold is 150px, wide radius is `min(gutter * 0.5, H * 0.16, 110)`, and narrow radius is `min(W * 0.26, 90)`. Contain the complete extent of each shape, especially overlapping loops, inside the allowed envelope.
- Compute connected-node tuning from live canvas dimensions so resizing does not leave the desktop range stale. Do not broaden this into a general renderer rewrite.

## Current-state PRD truth to amend

Update `PRD/sections/shared-chrome/README.md` and the ambient-scene acceptance criteria of `REQ-207` in `PRD/sections/functional-requirements.md` to describe Blue's frequent desktop connections and varied simple large inscriptions. The existing motion allowance in `NFR-006` (`PRD/sections/non-functional-requirements.md`) already permits this single handwritten renderer, with reduced motion and no animation library. Propose these amendments during refinement; implementation applies the approved truth. Do not add a new decision-log entry.

## Constraints and acceptance evidence

This changes Blue's presentation only. Preserve all other color scenes, theme selection and persistence, small Blue runes, phone connection behavior, and the quiet Menu-tray strength. Keep decoration non-interactive and hidden from assistive technology. Maintain reduced-motion scheduling behavior, deterministic still rendering, weak-hardware fallback, and readable panels.

Keep 35 page nodes and the current 595 pair comparisons per frame. More links still increase stroke work; browser checking must validate the result under the existing performance fallback.

Use `apps/frontend/src/components/AmbientScene.test.tsx` for meaningful geometry, resize, lifecycle, containment, variety, and cleanup coverage. Existing deterministic Blue fingerprints may need an intentional update; other profile fingerprints should remain unchanged. Verify several successive inscription lifecycles and no consecutive family repeats. Check desktop at 1280×800, 1440×900, and 1920×1080, mobile at 390×844, and the Menu tray. Inspect the visible gutters and readable content, not just line counts. Capture live visual evidence under the repository's runtime/process hygiene contract. Do not claim browser performance from the geometry simulation.

## Evidence and reusable tooling

`PRD/work/probe-blue-ambient-personality/FINDINGS-blue.md` contains the source trace and limitations. Reproduce the geometry comparison with `node PRD/work/probe-blue-ambient-personality/measure-links.mjs`; the script checks the source baseline and uses a fixed seed.

## What the graph run should produce

An approved design brief and proposed shared-chrome requirement amendments, followed by a small implementation plan for desktop Blue connections and varied larger inscriptions, with focused tests and visual verification. The investigation has resolved the connection-density cause; refinement should concentrate on the final shape style and acceptance of the desktop tuning.

## How to hand this off

`$graph-kickoff "Give Blue frequent desktop constellations and varied simple large inscriptions while preserving small runes" PRD/work/probe-blue-ambient-personality/GRAPH-BRIEF.md`
