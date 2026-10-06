# Implementation plan

One slice A: restore Blue’s desktop scene personality. Add bounded geometry and family-selection helpers, integrate them into the current canvas actor, adjust Blue link radius from live dimensions, and amend shared-chrome / REQ-207. No other scenes or runtime architecture change.

Data flow: existing profile → Blue actor → shuffled family at spawn → stored normalized outlines → progressive draw/hold/fade. Existing page dimensions → adaptive link radius. Resize → live connection radius and active actor refit.

Verification: targeted Vitest with red/green evidence, typecheck, lint, production build, repository quality gate, browser viewports/tray/reduced-motion/frame pacing and cleanup. One slice because both changes occupy the same renderer and require joint visual review. Final durable truth is applied in this slice; cleanup remains a separate lifecycle step after review/shipping.

## Review revision B — quieter Blue sigils

Dependency: slice A done. One follow-up slice B on the same renderer and helper: interpolate only 25% of the prior desktop range expansion, replace geometric silhouettes with six forms from the shared small-glyph dictionary, and update the final product truth. Preserve slice A and its evidence. Verify new density bounds, open sparse glyph strokes and optional arcs plus existing lifecycle/resize/fallback tests, full quality and build, browser desktop/mobile/tray and browser-close evidence. The owner-requested review server remains running.
