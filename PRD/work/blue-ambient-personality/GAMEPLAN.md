# Implementation plan

One slice A: restore Blue’s desktop scene personality. Add bounded geometry and family-selection helpers, integrate them into the current canvas actor, adjust Blue link radius from live dimensions, and amend shared-chrome / REQ-207. No other scenes or runtime architecture change.

Data flow: existing profile → Blue actor → shuffled family at spawn → stored normalized outlines → progressive draw/hold/fade. Existing page dimensions → adaptive link radius. Resize → live connection radius and active actor refit.

Verification: targeted Vitest with red/green evidence, typecheck, lint, production build, repository quality gate, browser viewports/tray/reduced-motion/frame pacing and cleanup. One slice because both changes occupy the same renderer and require joint visual review. Final durable truth is applied in this slice; cleanup remains a separate lifecycle step after review/shipping.
