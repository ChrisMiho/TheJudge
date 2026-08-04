status: idea

# MTG Color Profile Refresh

## Raw ask

> unified-mtg-color-themes is merged to main and looks great, but i want to refine the base
> colors that represent the 5 mtg colors, the white is a bit too yellow for my liking, id like
> to lessen that a bit, and the rest of the colors id like to give a more neon vibe too so that
> the accent gives the glow effect it previously had, these new colors are accurate but i liked
> the old vibe better, for the black profile the plum that we have selected just isnt working
> for me, i want more purple and fun, right now its just a bit too dull for me, red looks nice,
> but happy to give it a little neon vibe, and green gives earthy grass vibes, id like it to
> lean a bit more into the neon as well, so to recap, white needs to be made more white and the
> rest of the colors need to be made more neon, except for the black pallet thats gonna receive
> more purple and neon to make it more fun

## Context

This is a values-only refinement of the fixed WUBRGC catalog shipped by `unified-mtg-color-themes`
(merged, `PRD/work/unified-mtg-color-themes/` still awaiting `/thejudge-cleanup`). The four-token
theme architecture (`accent` / `accent-strong` / `accent-soft` / `accent-contrast`), global reach,
persistence, and Colorless customization are all working as intended and out of scope here — this
only touches the fixed hex values in `DEC-119` / `REQ-099` / `NFR-011` (source of truth:
`apps/frontend/src/lib/theme/palettes.ts`).

See `HANDOFF.md` in this folder for full session state, the clarifying answers already collected,
and the proposed value table — read that before re-asking questions this session already resolved.

## Product truth to amend

- DEC-119 (`PRD/sections/decisions/personalization.md`) — value table only; mechanism unchanged
- REQ-099 (`PRD/sections/functional-requirements.md`) — value table + the "not a bright purple
  theme" note for Black, which this refresh intentionally supersedes
- NFR-011 (`PRD/sections/non-functional-requirements.md`) — contrast floor stays a hard 4.5:1
  constraint, unchanged

## Next step

`/thejudge-refinement PRD/work/mtg-color-profile-refresh/` — resume from `HANDOFF.md`, get final
sign-off on the proposed value table (or a revised one), then write `DESIGN-BRIEF.md` and the
DEC-119/REQ-099 amendments.
