---
status: ideation
---

# suite-build-order

Overarching suite gameplan: reuse-first build order and eligibility rules so managing agents implement individual `PRD/work/<slug>/` packages in a safe sequence (shared kits before consumers).

This package does not ship product code. After refinement and map-out, its `GAMEPLAN.md` is the control plane for suite implementation; each wave points at a concrete feature work folder.

Participating packages (order finalized in GAMEPLAN):

- `scan-camera-desktop-sizing-regression`
- `feature-portal`
- `card-trade-balancer`
- `card-lookup-qa` / `rules-lookup` (Ask AI mode contract + lookup suite)
- `card-collection-manager`
- `commander-spellbook-combos`
- `player-life-tracker`
- `ui-flare-chat-motion`
- `prompt-game-state-enrichment` (deferred — do not implement from this gameplan)

See `IDEA.md` for the original idea.
