# Approved product-truth proposal

## REQ-207

What this decides: Blue desktop connection density and simple large inscription variety.
In plain terms: implement the fix the owner requested from the supplied probe.
What happens if you say no: the current sparse desktop dots and circle-only outlines remain.

Owner verdict: accept — 2026-10-05 direct request to implement the outlined fix.

```diff
--- a/PRD/sections/shared-chrome/README.md
+++ b/PRD/sections/shared-chrome/README.md
@@ -376,7 +376,15 @@
   fog, Red embers, Green leaves, Colorless turning geometry) — drawn by one
   hand-written canvas renderer ported from the mockup (`AmbientScene`), one
   density and one opacity number per scene, one still frame under reduced
-  motion, and at a whisper inside the Menu tray. The ground is one
+  motion, and at a whisper inside the Menu tray. Blue preserves its small floating
+  invented runes; at desktop canvas widths (1024px+) its connected dust nodes
+  form more frequent shifting constellations through an area-scaled connection
+  range capped at 240px, with phone/tablet connections unchanged. One larger,
+  quiet inscription at a time writes, holds and dissolves, cycling without
+  consecutive repeats through ring (single/nested), triangle, diamond, hexagon,
+  ellipse and overlapping loops. Their complete rotating envelopes stay in the
+  wide side gutters or low on narrow canvases and in the tray; tray node
+  connections remain disabled. The ground is one
   flat colour per profile from the REQ-200 token set; one typeface (Inter,
   self-hosted) serves titles and body; no surface carries corner decoration.
   (REQ-207, REQ-200, REQ-201, NFR-006)
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ -5290,6 +5290,8 @@
   - behind every page plays the chosen colour's **ambient scene**: two slowly drifting haze sheets, a field of glowing dust, the colour's badge large, blurred and faint in the centre, and the colour's element moving (White beams, Blue runes and constellations, Black fog and brambles, Red heat and embers, Green falling leaves, Colorless turning geometry), as the ported mockup renderer draws each one; the same scene plays at a whisper inside the Menu tray over a pool of the colour's light fading in at its foot (Colorless's tray gets a fuller scatter of slightly brighter shapes)
   - each scene's density and opacity are one number each, so it can be tuned down without redrawing; the scene is decorative and never carries meaning; panels (the card stage, every In-depth plate, the Trade Balancer piles' panel and every other panel surface) take the mockup's own surface values from the shared token layer (REQ-216) — translucent glass wherever the mockup draws glass — so the scene reads through them; the open Menu tray stays fully opaque (REQ-122)
   - on a phone (viewport width `< 768px`) the Green scene stays a quiet backdrop clear of the content: its branch art (the drawn limbs and the leaf clusters hanging from them) and its drifting leaves do not run across or crowd the content column — in particular the limbs do not hang down the side edges over the content, as they did before, because a phone has no side gutter for them to sit in (phone shell ≈ 100% of viewport width, `screen-layout.md`). Green on a phone reads as ambience behind the interface, calmed through the scene's own density and opacity numbers above; no other colour's scene changes and no tablet or desktop width changes (REQ-201)
+  - Blue keeps its small invented floating runes. At desktop canvas widths (1024px+) the existing effective dust-node connection radius scales by the square root of canvas area relative to 390×844, capped at 240px; below 1024px the connection setting is unchanged. Dust count and line opacity are unchanged, and the range follows live canvas dimensions on resize. Menu-tray node connections stay disabled
+  - Blue's one larger inscription writes, holds and fades through ring (single/nested), triangle, diamond, hexagon, ellipse and overlapping loops, using a shuffled bag with no consecutive family repeats. Its spawn-time geometry stays simple with no dense interior decoration; the entire rotating shape fits the existing gutter/low-canvas placement envelope, including on resize. Preserve 260 drawing / 600 holding / 260 fading frames, 240–600 idle frames, subdued outer/secondary strokes and modest glow
   - under `prefers-reduced-motion` the scene paints one still frame and runs no animation loop, and every decorative motion stops (NFR-006)
   - the REQ-200 contrast floors hold over the scene in all six profiles, including text on glass panels with the scene behind them; a custom Colorless colour follows REQ-099
   - every card keeps its colour-identity ring (REQ-058) on every card surface; the theme owns the glow behind a card, never its edge
```
