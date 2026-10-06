# Blue desktop constellations and inscriptions

Authorization: the owner’s 2026-10-05 request to implement the fix outlined in the probe; the existing GRAPH-BRIEF is intake for this direct implementation, not a graph launch.

## Scope

At canvas widths >=1024px, scale the existing effective Blue connection radius by sqrt(width * height / (390 * 844)), capped at 240px. Below 1024px retain 96px at page strength. Compute from live canvas dimensions; retain 35 page dust particles, pairwise comparison count, and link opacity. No connections in the Menu tray.

Replace the large circle-only actor with ring (optional inner ring), triangle, diamond, hexagon, ellipse, and overlapping loops. Use a shuffled bag without consecutive repeats, including bag boundaries. Pick geometry and placement randomness at spawn. Keep the small RUNES and their motion unchanged. Keep one large actor, 260 draw / 600 hold / 260 fade frames, initial 120-frame delay, and 240–600 idle frames. Outer and secondary stroke strengths remain 0.16/0.09 with existing breathing and glow.

Bound all shape geometry inside the existing circle envelope; retain wide-screen gutters and low narrow/tray placement, with canvas-edge clamping. Refit active shapes on resize. Preserve reduced-motion still drawing, cleanup and weak-hardware fallback. No new libraries or public controls.

## Durable truth

Amend the shared-chrome feature spec and REQ-207 by intent alongside implementation. Existing NFR-006 allows the handwritten canvas renderer. No new decision-log entry or screen-layout change.

## Evidence and verification

The supplied probe explains the uniform-density cause and recommends the exact radius formula. Tests must cover real renderer desktop links, mobile baseline, resize, family diversity and no repeats, normalized containment, lifecycle and tray link suppression. Other profile still-frame fingerprints stay unchanged; Blue desktop changes intentionally. Browser checks: 390×844, 1280×800, 1440×900, 1920×1080, tray, readable content, reduced motion and frame pacing. Record browser/server cleanup.
