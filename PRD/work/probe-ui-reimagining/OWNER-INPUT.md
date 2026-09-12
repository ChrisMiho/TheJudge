# Owner input — UI re-imagining

Answer each `- Answer:` line in place. Where a recommendation is given, "agree"
is a complete answer. Leave a slot blank if you do not know; the probe will
treat blank as "find out" and put a proposal in front of you. Once this file
is answered and merged, the brief in this folder is ready for `graph-kickoff`.

Sections A and D matter most. The rest have workable defaults.

## A. Friction — the awkward points you have noticed

One row per moment. Write what you were trying to do and what got in the way,
in plain words. "Menu: tapping Trade Balancer on my phone scrolls me to the
wrong place" is the right size. Screenshots are welcome but not required; the
probe will capture them.

### A1. Menu and shared chrome (rail, tray, theme swatches, banner, feedback)

| # | What I was doing | What got in the way | Phone or desktop |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |

### A2. Quick Question (ask, card attach, scan, answer, follow-up)

| # | What I was doing | What got in the way | Phone or desktop |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |

### A3. In-Depth Question (player roster, zones and card picking, scan, enrichment, submit, waiting, answer, history, View Context)

| # | What I was doing | What got in the way | Phone or desktop |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |
| 5 | | | |

### A4. Trade Balancer (two sides, add a card, choose a printing, scan, balance)

| # | What I was doing | What got in the way | Phone or desktop |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |

### A5. Anything that is fine and should not change (besides Life Tracker)

- Answer:

## B. Who is this for, and where

**B1. The "boring" feedback.** Who said it (a player at your table, a judge, a
friend who does not play), on which device, and looking at which screen?
- Answer:

**B2. Primary device.** Which do you design for first: phone in one hand at a
table, or laptop between games? Recommendation: phone first, desktop must still
be good, since the layout catalog is already mobile-first.
- Answer:

**B3. Lighting.** Is the app mostly used in a bright game store, at a dim
kitchen table, or both? This decides how dark the dark theme can go and whether
a light theme matters at all.
- Answer:

## C. Direction

**C1. Three words.** Pick or write three adjectives the finished app should
earn. Examples to react to: "premium", "playful", "arcane", "clean", "fast",
"tournament-serious", "cozy".
- Answer:

**C2. Reference apps or sites** whose look you like, Magic-related or not.
Two or three names, and one line on what you like about each.
- Answer:

**C3. Reference apps or sites you dislike**, and why. This is as useful as C2.
- Answer:

**C4. How many directions to mock up.** Recommendation: three distinct
directions, each shown on Quick Question and In-Depth Question first, then the
winner extended to Trade Balancer and shared chrome. Two is acceptable; one is
not, because taste is where a single guess is most likely to miss.
- Answer:

**C5. Brand.** Keep the "TheJudge" text wordmark with its gradient? Open to a
drawn mark next to it? Any colours, fonts or names that are off limits?
- Answer:

## D. Mana-symbol flare

**D1. Inspiration images.** Drop them in `inspiration/` named
`white.*`, `blue.*`, `black.*`, `red.*`, `green.*`, `colorless.*`. Add any other
references with a descriptive name. Then list here what each image is meant
to inspire (colour only, shape, mood, texture, all of it).
- Answer:

**D2. Licensing choice.** Is TheJudge free and non-commercial, and will it stay
that way? If yes, the official mana symbols can ship through the community
Mana icon font under the Wizards Fan Content Policy. If no, or unsure, the
design uses our own motifs inspired by the symbols and ships no Wizards
artwork. Recommendation: own motifs, because it keeps every future option open.
- Answer:

**D3. How far the colour goes.** Today the palette tints buttons and the
wordmark only. Recommendation: the chosen colour becomes the whole theme,
including a background wash, surface edges, the waiting panel and the
card-detail popup, at a restrained intensity so text stays readable.
Say "agree", "further", or "keep it to accents".
- Answer:

**D4. Colorless.** The colorless palette is the neutral option. Should it stay
strictly neutral grey, or read as "artifact" (steel, brushed metal, a hint of
warmth)?
- Answer:

## E. Boundaries

**E1. What "Life Tracker untouched" means.** Two workable readings:
(a) pixel-identical: every shared token it inherits is pinned to today's
value inside Life Tracker, so it never drifts; (b) inherits shared changes,
and you approve each drift from a screenshot diff. Recommendation: (a) during
the redesign, then one deliberate pass later if you want it to match.
- Answer:

**E2. Skin or re-sequence.** May a flow change its step order, merge steps,
or move a control to a different screen, when that removes a friction row in
section A? Or is this a visual pass only, with steps and controls where they
are? Recommendation: allow re-sequencing where a section A row calls for it,
and nowhere else.
- Answer:

**E3. Copy.** May labels, button text, empty states and hints be rewritten
to fit the new direction, or is wording frozen?
- Answer:

**E4. Motion.** How much animation: none beyond today, subtle (transitions,
focus, a waiting-panel pulse), or expressive (page transitions, card flips,
mana-coloured effects)? Reduced-motion is honoured regardless.
- Answer:

**E5. Dark and light.** Dark only (today), light only, or both following the
system setting? Recommendation: dark only for this pass, with tokens set up
so light can be added later without a second redesign.
- Answer:

**E6. Hard constraints** beyond the current non-functional requirements:
contrast targets, minimum tap size, a font you must or must not use, a
bundle-size ceiling for fonts or art.
- Answer:

## F. Mockups and approval

**F1. Format.** Recommendation: clickable HTML pages published as private
artifacts, one per in-scope flow, viewable at phone and desktop width, using
real card names, real prices and real answer copy. Each direction also gets a
side-by-side "before" screenshot. Say "agree" or name another format.
- Answer:

**F2. Review pace.** Do you want all directions at once, or the first one
early to correct course before the others are built?
- Answer:

**F3. Sign-off.** Once a direction is picked, does one approval cover the
whole build, or do you want to see each flow's slice before it merges?
Recommendation: approve the direction once, then review each slice's PR as
today, with the Life Tracker screenshot diff attached.
- Answer:

## G. Priority and timing

**G1. Order.** If only one flow could be redone first, which one? Default
order if blank: shared chrome and tokens, Quick Question, In-Depth Question,
Trade Balancer.
- Answer:

**G2. Anything in flight** that this must not collide with (another package,
a demo date, a feedback round you are waiting on)?
- Answer:
