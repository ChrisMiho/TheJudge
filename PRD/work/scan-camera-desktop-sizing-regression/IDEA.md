---
name: scan-camera-desktop-sizing-regression
description: Mobile-oriented scan camera height clamp from the mobile scan layout change now also drives desktop, distorting the desktop capture surface
metadata:
  type: project
---

Commit `666ac18` ("Implement ergonomic enhancements for game-context controls and mobile scan layout") changed `ScanCameraSurface`'s video sizing from a fixed `aspect-[3/4]` (width-driven, proportion-stable at any viewport) to `h-[clamp(20rem,calc(100dvh-17rem),42rem)] !max-h-none`, a `100dvh`-based height clamp with no desktop-specific breakpoint. A desktop screenshot taken after this change shows the scan capture panel oversized/distorted relative to its prior proportions, confirming the mobile-tuned sizing now also governs desktop.

Outcome: the scan camera surface should size correctly and predictably on both mobile (full use of small-viewport height, the original intent of `666ac18`) and desktop (proportion-stable, not stretched to fill 100dvh), likely via a breakpoint-scoped clamp or falling back to the aspect-ratio approach above a desktop width threshold.

Non-goals: not revisiting the mobile ergonomics intent of `666ac18` itself; not touching card detection/identification logic; not addressing the game-context control changes from the same commit unless they show a similar regression.
