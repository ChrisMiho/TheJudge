# Blue's connections and larger shapes

Nothing required (FYI). Blue's desktop scene loses connections because the same number of nodes occupies a much larger area. Widening the desktop connection range is a small, targeted way to restore its personality; rotating through simple outline shapes addresses the repeated circles.

## What the code does

- `apps/frontend/src/components/AmbientScene.tsx`: Blue's recipe has 70 particles before density scaling. The page attaches with `dust: 0.5`, yielding 35 on every viewport.
- The link limit is `recipe.links * min(1, 0.6 + 0.4 * k)`. Blue's `links: 120` and the page's `k: 0.5` give an effective 96 CSS pixels.
- Nodes are distributed uniformly across the entire canvas. A 1440×900 screen has about 3.94 times the area of 390×844, without extra nodes or longer links.
- Every pair within the radius gets a faint stroke. Opacity declines with distance and both nodes' lifecycle fade. Merely increasing line opacity cannot connect separated nodes.
- The Menu tray explicitly disables these connections (`!opts.tray`). It shares Blue's small runes and large circle scene.
- Small runes have ten invented stroke patterns, size 7–13, and their own write/hold/fade lifecycle. These are distinct from the dust nodes and should be preserved.
- `spellCircle` generates only a ring, with a 50% chance of an inner ring. There is no selection among other large shape families.
- The existing large shape is placed in the side gutters when they exceed 150px; otherwise it sits low on the canvas. Radius is capped at 110px in wide gutters and 90px otherwise. Only one is active.
- Its lifecycle is 260 drawing frames, 600 holding frames, and 260 fading frames, followed by 240–600 idle frames. These are frame counts, not guaranteed wall-clock seconds.

## Measured connection geometry

Ran `node PRD/work/probe-blue-ambient-personality/measure-links.mjs` successfully. Each viewport uses 5,000 reproducible uniform layouts of 35 nodes. Current and proposed radii are compared against identical positions.

| Viewport | Current radius | Current possible links | Proposed radius | Proposed possible links | Current isolated nodes | Proposed isolated nodes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 390×844 | 96 | 44.52 | 96 | 44.52 | 2.99 | 2.99 |
| 1280×800 | 96 | 15.53 | 169.3 | 45.07 | 14.47 | 2.96 |
| 1440×900 | 96 | 12.33 | 190.5 | 44.98 | 17.26 | 2.92 |
| 1920×1080 | 96 | 7.90 | 240 | 44.67 | 22.28 | 2.95 |
| 2560×1440 | 96 | 4.45 | 240 | 26.06 | 27.13 | 7.96 |

These are possible geometric connections, not browser-visible line counts. The simulation excludes lifecycle fade, movement, panel occlusion, and GPU cost. The distance-weighted link sum at 1440×900 improves from 4.17 to 15.60, close to the phone's 15.45, so the improvement is not just a set of near-invisible edges at the outer limit.

## Recommended build direction

1. On desktop (width ≥1024px), scale the current effective connection range by the square root of viewport area relative to 390×844, capped at 240px. Keep the existing range below 1024px. Compute it from live canvas dimensions so a resize updates it. This retains 35 nodes and 595 pair comparisons per frame; more qualifying pairs do mean more stroke calls, so browser performance still needs checking.
2. Keep the current line opacity and node lifecycle initially. Judge connected multi-node forms in desktop gutters, including when the page panels are visible. If gutter visibility remains inadequate, investigate placement before increasing all particle counts or brightness.
3. Replace the large circle-only selection with six simple families: ring (single/nested), triangle, diamond, hexagon, ellipse, and paired overlapping loops. This geometric direction is a proposed default; the owner has not yet answered the optional style question.
4. Choose families through a shuffled bag, avoiding the previous family at bag boundaries. Randomize rotation and modest proportions only at spawn. Trace the outline progressively, hold, and fade, as the circles do today. Keep one active large form, the current timing, subdued strokes, and the existing size and placement bounds. Bound the combined extent of overlapping loops, not each loop separately.
5. Keep larger shapes sparse and simple. The renderer comments explain that the original circles replaced shapes that were too large and detailed; variety should not restore elaborate rune markings or dense interior chords.

## Scope and verification for a build

The durable shared-chrome feature spec and its ambient-scene requirement (`PRD/sections/shared-chrome/README.md`, `REQ-207` in `functional-requirements.md`) should describe Blue's desktop range tuning and larger inscription variety. The lightweight-motion rule (`NFR-006`) already permits this within the existing handwritten canvas renderer.

Relevant regression coverage is `AmbientScene.test.tsx`, including deterministic still-frame fingerprints and animation cleanup. Blue fingerprints may change with its connection geometry; other profiles should retain their baselines. Verify actual renderer links at representative viewports and through resize, shape-family variety over multiple lifecycles, shape containment, small-rune preservation, and reduced-motion scheduling. Browser verification should cover phone, desktop gutters, the tray, and readable page panels; preserve the existing weak-hardware fallback. No browser rendering or performance benchmark was performed in this probe.

## Result

Investigation and build intake only. Product code and durable PRD truth are unchanged.
