# Slice J: dead and duplicated styles go

Players see no change. The stylesheets lose rules no element can match, rules a later rule fully overrode, and exact duplicates, and the build now fails on a stylesheet parse error.

## Proof it looks the same (REQ-202)

- Life Tracker screenshot pairs with the Game setup sheet open: `before-390x844.png` / `after-390x844.png` and `before-1440x900.png` / `after-1440x900.png` in this folder. The pairs are not frozen frames: the ambient backdrop and the brand orb in the header animate, so a few pixels differ between any two captures (at most 22 of 255 in a colour channel on the phone pair, 57 on the desktop pair; more than half of the differing pixels sit in the top 100 rows, where the header and backdrop are). The layout, the sheet and the text match; the computed-style dump below is the exact proof.
- `computed-style-summary.md` in this folder: the computed style of every element on Life Tracker (the table and both sheets), Quick Question (with the scanner and the Menu), In-Depth and Trade, in two colour profiles, is identical before and after (2,252 elements, 0 differ). The Life Tracker table's elements are part of the computed-style dump.
- The built CSS is 211,949 bytes before and 201,166 after. Compared rule by rule, 123 rule entries are gone and 12 entries changed, all expected: the glow tokens trimmed, the six folded override blocks (counters, command and named rows, the Life Tracker tile and its remove button), the selector lists that lost a dead selector, and two keyframes whose stray `};` was fixed. Every surviving rule keeps its values and its order.
- `npm --workspace apps/frontend run build` printed two CSS warnings before and prints none now.

## What changed

- 12 `display: none` rules on `[hidden]` (the global `[hidden]` rule already forces them); the dead "waiting" chat block and its seven keyframes; `.btn.ghost`, `.card-panel`, `.lt-scope .life-custom .err`, `.lt-scope .tile.pulse .n` and the `tick` keyframe; 22 classes nothing renders (demo bar, before/after, overlay panel, `.msg-judge`, `.tile-tools`, ...); the state rules for attributes the code never sets; the duplicate `orb-breathe` and `mic-listen` keyframes; six unread glow tokens.
- Four override blocks folded into the blocks they overrode (counters, command and named rows, the Life Tracker tile, its remove button).
- Tailwind: the unused `xs` screen and `accent-contrast` colour are removed, the `container` plugin is turned off, and `@tailwind components` (which now emits nothing) is gone.
- Two stray `};`, six collapsed `@media` openers, an orphan comment and a stale pointer fixed.
- New test `Frontend - Stylesheets` reads the seven stylesheets and fails on any syntax error or minifier warning (it fails on the old `index.css`).
