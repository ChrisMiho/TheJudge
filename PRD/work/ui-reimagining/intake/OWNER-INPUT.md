# Owner input — UI re-imagining

Answered 2026-09-23 in a walk-through with the owner. Every slot has an
answer; where the owner did not know, the answer says so and asks the probe to
find out and propose. Section A friction rows are the owner's memory and are
marked for the probe to confirm live. Once merged, the brief in this folder is
ready for `graph-kickoff`.

Sections A and D matter most. The rest have workable defaults.

## A. Friction — the awkward points you have noticed

One row per moment. Write what you were trying to do and what got in the way,
in plain words. "Menu: tapping Trade Balancer on my phone scrolls me to the
wrong place" is the right size. Screenshots are welcome but not required; the
probe will capture them.

### A1. Menu and shared chrome (rail, tray, theme swatches, banner, feedback)

Owner note: the Menu is fine for now and better than it was. No known snag.
The probe should still walk it and propose improvements if it finds any.

| # | What I was doing | What got in the way | Phone or desktop |
|---|---|---|---|
| 1 | (none reported; probe to find out) | | |
| 2 | | | |
| 3 | | | |

### A2. Quick Question (ask, card attach, scan, answer, follow-up)

| # | What I was doing | What got in the way | Phone or desktop |
|---|---|---|---|
| 1 | Asking a question with one or more cards attached | The attached card is too large relative to the other elements on screen. With several cards attached, things run off screen on phone (from memory; probe to confirm). Desktop not yet reviewed. | Phone confirmed-ish; desktop needs review |
| 2 | | | |
| 3 | | | |

### A3. In-Depth Question (player roster, zones and card picking, scan, enrichment, submit, waiting, answer, history, View Context)

Owner note: this is a very long flow. Tidying and consolidating options within
a step is welcome. Merging or re-ordering steps is not on the table yet.

| # | What I was doing | What got in the way | Phone or desktop |
|---|---|---|---|
| 1 | Filling zones with cards | Same as A2: cards get too big once a zone fills up. Owner idea: a horizontal scroll strip of cards per zone would tidy this without much work. | Phone (desktop to review) |
| 2 | Working through the whole flow | Too many options on screen per step; anything that cleans up and consolidates controls inside a step is welcome. | Both |
| 3 | | | |
| 4 | | | |
| 5 | | | |

### A4. Trade Balancer (two sides, add a card, choose a printing, scan, balance)

Owner note: desktop is great with the two sides next to each other. Keep that.

| # | What I was doing | What got in the way | Phone or desktop |
|---|---|---|---|
| 1 | Building both sides of a trade on my phone | The two sides stack on top of each other, which looks cluttered and wastes space. Owner idea: tabs to flip between the two sides on phone instead of stacking. | Phone |
| 2 | Adding many cards to one side | The card list grows and has to scroll; the stacked layout leaves too little room to show nicely what has been added so far. Tabs (row 1) would free that room. | Phone |
| 3 | | | |

### A5. Anything that is fine and should not change (besides Life Tracker)

- Answer: Nothing visual is protected. Every page except Life Tracker is open
  to change in the name of the new style. What must not change is what the
  app does: the functionality behind each screen stays the same even when
  controls move or look different. Two things that already work well and
  should be kept in spirit: the Menu (fine for now, better than before) and
  the Trade Balancer desktop layout with both sides next to each other.
  Protected outright: the cat-wizard Easter egg. Ten taps on the brand mark
  on the In-Depth game-context step reveal the cat wizard for the session
  (REQ-056, DEC-076). Whatever the brand mark becomes, it keeps that tap
  trigger, and the reveal survives every direction.
  Owner wish, in scope for the redesign: extend the Easter egg to every
  in-scope screen that shows the brand mark (Quick Question, every In-Depth
  step and its answer, Trade Balancer). Today only the game-context step
  wires the shared header's tap hook. Recommendation: one session-wide tap
  count shared across screens, so ten taps anywhere reveal the cat wizard
  everywhere for the rest of the session. Where the cat appears on screens
  without a hero slot is a mockup decision. Life Tracker keeps its own
  title and stays out.

## B. Who is this for, and where

**B1. The "boring" feedback.** Who said it (a player at your table, a judge, a
friend who does not play), on which device, and looking at which screen?
- Answer: A friend who is a UX engineer. Verdict on the whole app: looks
  generic and AI-generated, needs work to give it personality. Life Tracker
  was the only page they said was fine. Device and screen not recorded; the
  verdict was app-wide, not about one screen.

**B2. Primary device.** Which do you design for first: phone in one hand at a
table, or laptop between games? Recommendation: phone first, desktop must still
be good, since the layout catalog is already mobile-first.
- Answer: Agree. Phone first; desktop must still be good.

**B3. Lighting.** Is the app mostly used in a bright game store, at a dim
kitchen table, or both? This decides how dark the dark theme can go and whether
a light theme matters at all.
- Answer: Both. Bright game store and dim kitchen table. The dark theme must
  survive glare, so not pitch black; a light theme is worth planning for.

## C. Direction

**C1. Three words.** Pick or write three adjectives the finished app should
earn. Examples to react to: "premium", "playful", "arcane", "clean", "fast",
"tournament-serious", "cozy".
- Answer: Arcane, premium, enchanting.

**C2. Reference apps or sites** whose look you like, Magic-related or not.
Two or three names, and one line on what you like about each.
- Answer: Moxfield, EDHREC, Scryfall. The owner did not say what draws them to
  each; the probe should study all three and name what they have in common
  (dense card-first layouts, dark surfaces, real card art doing the work)
  and put that reading in front of the owner to confirm.

**C3. Reference apps or sites you dislike**, and why. This is as useful as C2.
- Answer: TCGplayer. Reason not stated; the probe should name what it thinks the
  owner dislikes there and confirm.

**C4. How many directions to mock up.** Recommendation: three distinct
directions, each shown on Quick Question and In-Depth Question first, then the
winner extended to Trade Balancer and shared chrome. Two is acceptable; one is
not, because taste is where a single guess is most likely to miss.
- Answer: Agree. Three directions.

**C5. Brand.** Keep the "TheJudge" text wordmark with its gradient? Open to a
drawn mark next to it? Any colours, fonts or names that are off limits?
- Answer: Open. Nothing is off limits. Reference: `docs/design/tab-icon/` holds
  three generated tab-icon candidates from the old design pass (Aug 2026):
  (1) a serif "TJ" monogram on cream inside a navy-and-copper bevelled
  square, (2) a glowing blue "TJ" on a stacked-cards outline with sparkles on
  black, (3) the same card mark next to a "TheJudge" wordmark that fades
  white to blue. None shipped. The owner likes parts of them and is open to
  stealing from them, but they came from the old look and may not fit the new
  one. The probe may keep, adapt or drop the text wordmark and its gradient,
  and may propose a drawn mark.

## D. Mana-symbol flare

**D1. Inspiration images.** Drop them in `inspiration/` named
`white.*`, `blue.*`, `black.*`, `red.*`, `green.*`, `colorless.*`. Add any other
references with a descriptive name. Then list here what each image is meant
to inspire (colour only, shape, mood, texture, all of it).
- Answer: Images are grouped one folder per colour (`whiteMana/`, `blueMana/`,
  `blackMana/`, `redMana/`, `greenMana/`, `colorlessMana/`), 86 files in all,
  rather than one file per colour. Each folder holds the mana symbol itself
  (flat and as a sticker illustration) plus card art. Per-file notes and the
  three strongest files per folder are in `inspiration/DIGEST.md`. What each
  colour is reaching for, in one line each:
  - White: warm luminous authority. Cream and gold light on stone or dark,
    gilded filigree, tall verticals, one bright focal figure. Not clean
    minimalism.
  - Blue: charged energy. Glowing cyan, lightning, vortices and orbs on dark
    or warm grounds; blue paired with gold or orange. Not calm water.
  - Black: decay and dread with a glow. Charcoal grounds, one hot accent
    (red, violet, sickly green), jagged organic edges: horns, chains, drips.
  - Red: heat against darkness. One hot red-orange light inside a black or
    smoky field; red as a burst, not a fill. A thin red band on grey is the
    calm version.
  - Green: a forest at dusk. Deep mossy greens on dark, pinpoints of lime
    glow, framed by vines, leaves and roots. Primal, not friendly.
  - Colorless: bone, brass and stone. Pale Eldrazi bone next to warm artifact
    metal, each lit by one inner glow, plus parchment and inscribed-band
    lettering. Matches D4 "artifact".
  Across all six: dark grounds, one luminous accent per colour, tactile
  texture, and the mana glyph as the shape motif. Take all of it (colour,
  shape, mood, texture); none of the art itself ships.

**D2. Licensing choice.** Is TheJudge free and non-commercial, and will it stay
that way? If yes, the official mana symbols can ship through the community
Mana icon font under the Wizards Fan Content Policy. If no, or unsure, the
design uses our own motifs inspired by the symbols and ships no Wizards
artwork. Recommendation: own motifs, because it keeps every future option open.
- Answer: Own motifs. No Wizards artwork ships. Keeps the commercial option open.

**D3. How far the colour goes.** Today the palette tints buttons and the
wordmark only. Recommendation: the chosen colour becomes the whole theme,
including a background wash, surface edges, the waiting panel and the
card-detail popup, at a restrained intensity so text stays readable.
Say "agree", "further", or "keep it to accents".
- Answer: Agree. The chosen colour becomes the whole theme at a restrained
  intensity: background wash, surface edges, focus rings, waiting panel,
  card-detail popup.

**D4. Colorless.** The colorless palette is the neutral option. Should it stay
strictly neutral grey, or read as "artifact" (steel, brushed metal, a hint of
warmth)?
- Answer: Artifact. Steel, brushed metal, a hint of warmth.

## E. Boundaries

**E1. What "Life Tracker untouched" means.** Two workable readings:
(a) pixel-identical: every shared token it inherits is pinned to today's
value inside Life Tracker, so it never drifts; (b) inherits shared changes,
and you approve each drift from a screenshot diff. Recommendation: (a) during
the redesign, then one deliberate pass later if you want it to match.
- Answer: Agree. (a) pixel-identical: pin every shared token Life Tracker
  inherits to today's value inside Life Tracker. One deliberate matching pass
  later if wanted.

**E2. Skin or re-sequence.** May a flow change its step order, merge steps,
or move a control to a different screen, when that removes a friction row in
section A? Or is this a visual pass only, with steps and controls where they
are? Recommendation: allow re-sequencing where a section A row calls for it,
and nowhere else.
- Answer: Visual only, with controls free to move within a step. Step order and
  step count stay as today (see A3). Regrouping controls inside a step, and
  the Trade Balancer phone tabs (A4), count as layout, not re-sequencing.

**E3. Copy.** May labels, button text, empty states and hints be rewritten
to fit the new direction, or is wording frozen?
- Answer: Yes, rewrite freely. Meaning stays, phrasing may change; the owner sees
  new copy in the mockups.

**E4. Motion.** How much animation: none beyond today, subtle (transitions,
focus, a waiting-panel pulse), or expressive (page transitions, card flips,
mana-coloured effects)? Reduced-motion is honoured regardless.
- Answer: Subtle. Transitions, focus, a waiting-panel pulse.

**E5. Dark and light.** Dark only (today), light only, or both following the
system setting? Recommendation: dark only for this pass, with tokens set up
so light can be added later without a second redesign.
- Answer: Agree. Dark only for this pass, with tokens set up so a light theme
  can be added later without a second redesign.

**E6. Hard constraints** beyond the current non-functional requirements:
contrast targets, minimum tap size, a font you must or must not use, a
bundle-size ceiling for fonts or art.
- Answer: None beyond today's non-functional requirements.

## F. Mockups and approval

**F1. Format.** Recommendation: clickable HTML pages published as private
artifacts, one per in-scope flow, viewable at phone and desktop width, using
real card names, real prices and real answer copy. Each direction also gets a
side-by-side "before" screenshot. Say "agree" or name another format.
- Answer: Agree. Clickable HTML pages published as private artifacts, one per
  in-scope flow, phone and desktop width, real card names, prices and answer
  copy, each with a side-by-side "before" screenshot.

**F2. Review pace.** Do you want all directions at once, or the first one
early to correct course before the others are built?
- Answer: First direction early, so the owner can correct course before the
  other two are built.

**F3. Sign-off.** Once a direction is picked, does one approval cover the
whole build, or do you want to see each flow's slice before it merges?
Recommendation: approve the direction once, then review each slice's PR as
today, with the Life Tracker screenshot diff attached.
- Answer: Agree. Approve the direction once, then review each slice's PR as
  today, with the Life Tracker screenshot diff attached.

## G. Priority and timing

**G1. Order.** If only one flow could be redone first, which one? Default
order if blank: shared chrome and tokens, Quick Question, In-Depth Question,
Trade Balancer.
- Answer: Default order: shared chrome and tokens, Quick Question, In-Depth
  Question, Trade Balancer.

**G2. Anything in flight** that this must not collide with (another package,
a demo date, a feedback round you are waiting on)?
- Answer: Nothing in flight.
