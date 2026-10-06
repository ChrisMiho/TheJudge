# Blue’s quieter constellations and invented sigils

Authorization: the owner’s initial implementation request and follow-up review requesting fewer connections and larger shapes inspired by Blue’s small glyphs. Revision B is part of the same unmerged PR. The original investigation is evidence, not the final visual direction.

## Scope

Keep desktop connections a modest increase over the original. Below 1024px use the existing effective radius (96px on the page). At 1024px+ compute expanded = max(base, min(240, base * sqrt(width * height / (390 * 844)))); use base + 0.25 * (expanded - base). Page radii are approximately 114px at 1280×800, 120px at 1440×900 and capped at 132px on larger desktops. Keep 35 page particles and existing opacity; no tray connections. Read live canvas dimensions on resize.

Larger inscriptions use six invented-sigil families drawn from the same unchanged small-glyph dictionary: fork, branch, hook, pillar, diamond and spire. They reuse open stems, forks, hooks, crossbars, chevrons and the existing diamond-with-spine. Main glyph uses a 0.72 coordinate scale and fits inside the circle envelope with modest width variation; sometimes a quiet incomplete surrounding arc fills the envelope. No repeated consecutive family; no polygon/ellipse/overlapping-loop palette or dense interior markings. Arc style is a recorded implementation default offered in an optional preference question; owner can refine it during review.

Store geometry, framing and placement choices at spawn. Retain one large actor, 260 draw / 600 hold / 260 fade frames, initial 120-frame delay and 240–600 idle frames. Preserve subdued 0.16/0.09 stroke strengths and glow. Keep glyphs nearly upright, gently turning by age rather than the global random phase. Preserve wide-gutter / low-narrow placement, complete rotating containment, actor refit on page/tray resize, reduced-motion scheduling and hardware fallback. Small glyph paths, spawning and motion remain unchanged.

## Non-goals

No changes to other colours, new controls, graph runner migration, motion framework, backend or API changes. No elaborate large rune decorations.

## Durable truth

Update shared-chrome and REQ-207 alongside revision B. Existing NFR-006 permits this renderer. No decision-log entry or new screen layout.

## Verification

Tests bound the desktop density above the original and below the initial overcorrection; preserve phone/other-colour fingerprints. Cover sigil diversity, sparse open-stroke vocabulary, optional broken arcs, containment, lifecycle, resize, reduced motion and fallback. Browser checks cover phone, requested desktop widths, Menu tray, readable panels and reduced motion. Attach to the owner-requested review server without stopping it; close the verification browser.
