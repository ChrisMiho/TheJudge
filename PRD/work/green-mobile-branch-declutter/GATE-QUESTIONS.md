# Gate questions: green-mobile-branch-declutter

One block, one proposed product-truth change. This amends an existing
requirement in place (REQ-207) — no new REQ/FLOW/DEC id is created.

---

## REQ-207 — green's branches stay a quiet backdrop on a phone

**What this decides:** whether we write down, as a durable rule, that the Green
theme's branches on a phone must stay a quiet backdrop behind the app — so this
fix can't quietly come undone later — or whether we just tune it this once and
record nothing.

**In plain terms:** today, when a player turns on Green on a phone, the
decorative branches (the app draws them behind every page as part of the
"ambient scene" — the moving art for each colour) run down both side edges and
across the controls and text, reading as clutter. On a laptop the same branches
tuck into the empty margins beside the centred page, so they look like ambience;
a phone has no such margin, so they land on the interface. The ambient-scene
rule (REQ-207) already says the scene must be "restrained" and "decorative" and
can be dialled down with one density and one opacity number, but it never says
the scene has to stay clear of the controls on a phone. This adds that one line
— green on a phone stays a quiet backdrop clear of the content — and adds it to
the rule's test list. Nothing changes for the other five colours, and nothing
changes for green on a tablet or desktop.

**What happens if you say no:** the branches still get calmed on a phone this
time, but there's no written bar for it, so a future change to the scene art
could bring the clutter back without failing any test.

### Proposed diff — `PRD/sections/functional-requirements.md`, REQ-207

```diff
   - each scene's density and opacity are one number each, so it can be tuned down without redrawing; the scene is decorative and never carries meaning; panels (the card stage, every In-depth plate, the Trade Balancer piles' panel and every other panel surface) take the mockup's own surface values from the shared token layer (REQ-216) — translucent glass wherever the mockup draws glass — so the scene reads through them; the open Menu tray stays fully opaque (REQ-122)
+  - on a phone (viewport width `< 768px`) the Green scene stays a quiet backdrop clear of the content: its branch art (the drawn limbs and the leaf clusters hanging from them) and its drifting leaves do not run across or crowd the content column — in particular the limbs do not hang down the side edges over the content, as they do today, because a phone has no side gutter for them to sit in (phone shell ≈ 100% of viewport width, DEC-145 / REQ-124). Green on a phone reads as ambience behind the interface, calmed through the scene's own density and opacity numbers above; no other colour's scene changes and no tablet or desktop width changes (REQ-201)
   - under `prefers-reduced-motion` the scene paints one still frame and runs no animation loop, and every decorative motion stops (NFR-006)
```

```diff
-  - tests cover the band's cell floor and arrows at 280px and 390px, the tray's close paths, reduced motion stopping the scene, the header's top edge at 0 at 390×844 and 1440×900, the font loading from the app's own origin, and the contrast floors per profile
+  - tests cover the band's cell floor and arrows at 280px and 390px, the tray's close paths, reduced motion stopping the scene, the header's top edge at 0 at 390×844 and 1440×900, the font loading from the app's own origin, the contrast floors per profile, and the Green scene on a phone (390×844) staying a quiet backdrop clear of the content column, confirmed by a before/after screenshot pair on Ask a Question, In-depth, and the Menu tray
```

```diff
   - amended by `ui-look-translation` (2026-10-02): the scene returns to the mockup's own canvas renderer under NFR-006's ambient-scene exception; the CSS-only haze it replaces is retired
+  - amended by `green-mobile-branch-declutter` (2026-10-03): the Green scene's phone path drew its branches (limbs) down both side edges, across the content column — a phone has no side gutter for them to sit in — so green read as clutter over the interface instead of ambience; the new criterion requires green on a phone to stay a quiet backdrop. Presentation-only and Green-only; the other five scenes and every tablet/desktop width are unchanged. Grounded against the running app at 390×844 (screenshots in the work package)
```

- Verdict:
- Reason:
