# Slice J: computed-style comparison

Result: 2,252 elements in 24 dumps, 0 elements differ before and after.

## Method

- One dev server from this worktree on an owned port (5451), the real routes, the production CSS pipeline.
- "Before" is the unmodified tip (the committed stylesheets and `tailwind.config.ts`); "after" is the edited tree. Both were captured in the same browser session, in the same viewport, with the dev server restarted between them so Tailwind's config is re-read.
- For every element under `<body>` plus `<html>`, a hash of every computed property of the element, of its `::before` and of its `::after`, plus its `animation-name` and `transition-property` read before animations are paused. Properties are sorted by name first (Chrome lists custom properties in an arbitrary order).
- The six custom properties the slice deletes on purpose (`--glow-dot`, `--glow-accent-18`, `--lift-send`, `--lift-send-hover`, `--lift-message`, `--stroke-bright`; nothing reads them) are left out of the hash, because every element inherits them.
- Two colour profiles: the Blue and Red palettes (`thejudge.theme.paletteId`).
- The method was checked for noise first: two captures of the unmodified tip give 0 differing elements out of 2,252 (after the scanner states were given three seconds to settle).
- Animations and transitions are switched off for the read so a running animation cannot move a value; the animation names are compared separately and are part of the hash.

## What was dumped (per colour profile)

| Tool | States | Elements |
| --- | --- | --- |
| Life Tracker | the table; the Game setup sheet open; the Player 1 counters sheet open | 84 + 148 + 138 = 370 |
| Quick Question | the page; the "Add card" popover open; the scanner open; the Menu open | 48 + 52 + 55 + 147 = 302 |
| In-Depth | the first station; player details expanded | 70 + 91 = 161 |
| Trade | the page; one side's "Add card" popover open; one side's scanner open | 96 + 100 + 97 = 293 |

1,126 elements per profile, 2,252 in all. The Life Tracker table's elements are part of the computed-style dump (the `life` state), and so are both Life Tracker sheets. The scanner states show the scanner's camera-unavailable face, because the capture browser has no camera.

## Result

| Profile | Dumps | Elements | Differing |
| --- | --- | --- | --- |
| Blue | 12 | 1,126 | 0 |
| Red | 12 | 1,126 | 0 |

Raw per-element hashes are throwaway files under `PRD/work/codebase-cleanup-pass/.playwright-mcp/` and go when the package folder does.
