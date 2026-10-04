# Design brief: green-mobile-branch-declutter

**What this is:** on a phone with the Green theme on, the decorative branches
pile across the interface and read as clutter. This shapes the fix so green on a
phone keeps its branch personality as a quiet backdrop that never crowds the
controls or text.

**What a player sees after this:** a player picks Green on their phone and the
scene behind the app feels like forest ambience — a few leaves drifting, soft
green glow — not a mesh of branches drawn across the buttons and words. Nothing
changes for any other colour, and nothing changes for green on a laptop or
desktop.

## The problem, grounded in the real app

I ran this worktree's frontend (`apps/frontend`, `npm run dev`) and looked at
the Green theme at phone size (390x844) in a real browser. Screenshots are in
`PRD/work/green-mobile-branch-declutter/.playwright-mcp/`.

What draws the branches: one component, the ambient scene
(`apps/frontend/src/components/AmbientScene.tsx`). Its `GREEN` scene object
(around lines 103-197) paints the branches — it calls them "limbs" — plus leaf
clusters hanging off them, a field of drifting leaves, and a large faint sprout
badge in the centre. The scene is one fixed canvas behind the whole page
(`.ambience`, `#ambience-canvas`), `z-index: 0`, `pointer-events: none`
(verified live). Green also has two soft green haze gradients
(`apps/frontend/src/styles/ambience.css` lines 183-193). There is no separate
leaf image layer in the page body — the branches and leaves the owner sees are
all this one canvas.

Why it goes wrong on a phone specifically. The scene's branch-drawing code
(`GREEN.backdrop`, lines 159-188) has two paths:

- **Narrow-and-tall (a phone), lines 169-178:** when `height > width * 1.6` and
  `width < 520`, it runs branches *down both side edges*, drooping inward and
  down into the page. I confirmed live that at 390x844 this path is the one that
  fires (`profile: green`, `motif: leaves`, the phone condition evaluated
  `true`).
- **Wider screens, lines 179-187:** branches instead reach in from the *top
  corners* and arch down, staying near the top.

On a laptop or desktop the content sits in a centred column with wide empty side
margins (the "gutter"), so top-corner branches land in that margin and read as
ambience. On a phone the shell is about the full viewport width — there is no
side margin (product truth: phone shell ≈ 100% of viewport width, DEC-145 /
REQ-124) — so the side-edge branches run straight across the content column.
Added to the leaf clusters and the drifting leaves, green reads as a busy web of
branches over the interface.

What I actually observed, screen by screen (phone, 390x844, Green):

- **Ask a Question (empty), `green-phone-quicklookup-390x844.png`:** branches and
  dense leaf clusters fill the open body around and under the question box; the
  busiest screen.
- **In-depth, `green-phone-in-depth-390x844.png`:** branch lines cross the step
  row ("1 Game · 2 Zones · 3 Cards · 4 Context") at the top and crowd the open
  space below the game-context panel.
- **Life Tracker, `green-phone-life-tracker-390x844.png`:** the four player
  tiles are opaque, so they hide most of the scene — this screen is the least
  affected; branches show only in the thin gaps between tiles.
- **Menu tray, `green-phone-menu-tray-390x844.png`:** the tray's own quiet copy
  of the scene runs branches across the destination rows and the Theme band.

One correction to the plain-English complaint, for accuracy: the branches do not
sit *on top of* opaque controls and they never block a tap — the canvas is
behind the content and ignores pointer events. The "overlapping" the owner sees
is visual crowding: the branches and leaves compete with the UI in the open
areas and show through the translucent glass panels, so green reads as clutter
rather than a quiet backdrop. The fix is to calm the green scene on a phone, not
to change what sits in front of what.

## Scope

Change the Green scene's phone behaviour inside `AmbientScene.tsx` so, at phone
widths, it stays a quiet backdrop clear of the content column — tame or reroute
the side-edge branches and thin the leaf density, using the scene's existing
density and opacity controls. Keep green's forest-at-dusk personality: a few
leaves, the soft glow, a hint of branch — just quiet.

The exact visual tuning (how far to pull the branches back, the new density
number) is an implementation choice, confirmed by the before/after screenshot
pair that the shared-chrome requirement already asks for. This brief sets the
bar — "a quiet backdrop that never crowds the interface on a phone" — not the
pixel values.

## Decisions

- **Green only, phone only.** The complaint, and everything I observed, is the
  Green scene on phone widths. Other colours use dust, fog, beams or embers —
  soft particle art, not opaque branch strokes — and were not the complaint, so
  they stay untouched. Desktop/laptop green stays untouched.
- **Fix lives in the one scene component.** No new component, asset, dependency,
  or layout change. The branches are all `AmbientScene.tsx`'s `GREEN` object.
- **Record the bar as durable product truth (proposed).** The ambient-scene
  requirement (REQ-207) already says the scene must be "restrained",
  "decorative", and tunable by one density and one opacity number, but it has no
  phone-specific "stay clear of the content" bar for the scene. The owner wants a
  durable outcome ("never covers the interface"), and REQ-207 already carries
  width-specific tests, so this proposes a one-criterion amendment to REQ-207 so
  the fix cannot silently regress. See `GATE-QUESTIONS.md`.

## Non-goals

- No change to the other five colour themes' scenes or look.
- No change to green on tablet/desktop widths.
- No new theme, motif, decoration, asset, or dependency.
- No layout, containment, or control change; no change to request contracts,
  prompts, backend, card data, or the data pipeline (presentation only).
- No change to the `prefers-reduced-motion` still-frame behaviour or the
  adaptive weak-hardware fallback.

## Material assumptions (assumption ladder)

- **The fix belongs in the scene's phone path, not a new containment layer**
  (ladder: smallest reversible scope; established local pattern). Evidence: the
  phone-vs-wide split already exists in `GREEN.backdrop` (lines 169-187), and
  density/opacity are already single-number knobs REQ-207 says exist for exactly
  this kind of tuning.
- **"Phone" = CSS width `< 768px`** (ladder: active product truth). Evidence:
  the shared-chrome viewport bands define phone as `< 768px` (DEC-149, DEC-117).
  The scene's own code trigger is `width < 520` with a tall aspect ratio; the
  durable bar is written in product terms (`< 768px`), and the implementer tunes
  the code path that serves it.
- **Keep the change green-scoped** (ladder: preserve user-visible behaviour
  unless the request changes it). Evidence: the owner's non-goals name "no change
  to the other mana themes"; I measured only green.

## Proposed product truth

One amendment, in `GATE-QUESTIONS.md`:

- **REQ-207** (shared chrome / the colour's ambient scene) — add one acceptance
  criterion: on phone widths the Green scene stays a quiet backdrop clear of the
  content column, and add the green-phone case to the requirement's test list.
  No new REQ/FLOW/DEC id is minted.

## References

- Requirement that owns the ambient scene: REQ-207 (shared chrome — banner,
  Menu tray, Theme band, the colour's ambient scene),
  `PRD/sections/functional-requirements.md`.
- Requirement that owns the motif language ("Green forest at dusk … vines and
  roots"): REQ-201, same file.
- Phone shell width ≈ 100% viewport (why there is no side gutter on a phone):
  DEC-145 / REQ-124; viewport bands (phone `< 768px`): DEC-149 / DEC-117,
  `PRD/sections/shared-chrome/README.md`.
- Component: `apps/frontend/src/components/AmbientScene.tsx` (`GREEN`,
  `GREEN.backdrop`). Green haze CSS: `apps/frontend/src/styles/ambience.css`
  (lines 183-193). Scene layer CSS: `apps/frontend/src/styles/shell.css`
  (`.ambience`).
- Grounding screenshots: `PRD/work/green-mobile-branch-declutter/.playwright-mcp/`.
