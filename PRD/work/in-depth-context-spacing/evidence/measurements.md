# Measurements — waiting bubble today vs one row

Measured 2026-10-15 on the dev build of this branch (`b9c922db`, frontend only,
`vite` on port 5391, mock mode banner on). Browser: Playwright Chromium. The
answer request (`/api/ask-ai`) was held open by a browser route that never
answered, so no model was called. Playwright's fake clock moved the wait past
each phrase threshold; a 1.2 s real pause before each screenshot let the ink-in
animation finish.

Flows exercised:

- **Ask a Question**, first submit (`QuickLookupApp.tsx` ~702). Question typed,
  Enter pressed, no card.
- **In-depth**, first submit. Game → Zones (Battlefield) → Cards (Llanowar
  Augur) → Context → question → Decrypt Stack. The bubble rendered at the
  question-step site (`EnrichmentStep.tsx` ~880, parent `.idq-step`), not inside
  the conversation view. The ~718 site renders only when a conversation thread
  already exists (`isConversationActive = visibleMessages.length > 0`) and a
  decrypt is in flight; it was not reproduced live. It is the same component
  and the same CSS.

The **one-row preview** was injected as a `<style>` tag into the live page; no
source file was edited:

```css
.wait-inscription-bubble { grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; column-gap: 0.75rem; }
.wait-inscription-clock { text-align: right; white-space: nowrap; }
```

Everything else (clock size 1.5rem monospace, seal 28 px, padding 1rem,
colours, animations) stayed as it is today.

## Bubble height and positions (px, CSS pixels)

Positions are `x,y,width,height` from `getBoundingClientRect`. "Phrase" is the
live (`aria-live`) line.

### Ask a Question

| Width | Phrase shown | Today: bubble h | Today: seal / phrase / clock | One row: bubble h | One row: seal / phrase / clock |
| --- | --- | --- | --- | --- | --- |
| 1440x900 | Consulting the stack… | 123 | seal 449,178,28x28 · phrase 449,214,542x17 · clock 449,239,542x28 | 62 | seal 449,178 · phrase 489,184,432x17 · clock 933,178,58x28 |
| 1440x900 | At this point we're basically in a MUD subgame. | 119–123 | same stack | 60–62 | one line, 420 wide |
| 1440x900 | If this were F6, we'd have resolved by now. | 123 | same stack | 62 | phrase 491,184,429x17 · clock 932,178 |
| 390x844 | Consulting the stack… | 123 | seal 33,188 · phrase 33,224,325x17 · clock 33,249,325x28 | 62 | seal 33,188 · phrase 73,194,215x17 · clock 300,188,58x28 |
| 390x844 | …MUD subgame. | 119–123 | one line | 66 | phrase wraps to 2 lines (209x33), clock 297,192 stays on the row |
| 390x844 | …F6… | 123 | one line | 68 | phrase wraps to 2 lines (215x34), clock 300,191 stays on the row |
| 375x667 | Consulting the stack… | 123 | seal 32,188 · phrase 32,224,311x17 · clock 32,249 | 62 | phrase 72,194,201x17 · clock 285,188 |
| 375x667 | …MUD subgame. | **136** (phrase already wraps to 2 lines today) | phrase 37,225,302x33 · clock 37,265 | 66 | phrase 2 lines (195x33) · clock 282,192 |
| 375x667 | …F6… | 122 | one line | 68 | phrase 2 lines (201x34) · clock 285,191 |

(The bubble's own stage pulse — `.wait-stage-*`, untouched — scales it a few
pixels while it plays, which is why some rows read 119 or 559 wide.)

### In-depth (question-step site), phrase "If this were F6, we'd have resolved by now."

| Width | Today: bubble h | One row: bubble h | One row: phrase |
| --- | --- | --- | --- |
| 1440x900 | 123 (seal 450,365 · phrase 450,401,541x17 · clock 450,426,541x28) | 61 | one line, 425 wide; clock 930,365 |
| 390x844 | 122 | 66 | 2 lines, 210 wide; clock 297,378 |
| 375x667 | 121 | 66 | 2 lines, 196 wide; clock 283,378 |

The In-depth bubble sits in the same column width as Ask a Question's (575 px
on desktop), so both behave the same.

### Every phrase, line count in the middle column

Measured with a hidden copy of the line (same class, italics for the two
absurd lines) inside the live message stack.

| Width | Middle column (one row) | Lines per phrase, today | Lines per phrase, one row |
| --- | --- | --- | --- |
| 1440 | 432 px | 1,1,1,1,1,1 | 1,1,1,1,1,1 |
| 390 | 212 px | 1,1,1,1,1,1 | 1,1,2,2,2,2 |
| 375 | 196 px | 1,1,1,1,2,1 | 1,1,2,2,2,2 |
| 320 (extra check) | 146 px | 1,1,2,1,2,2 | 1,2,2,2,3,2 |

Phrase order: 0 s Consulting the stack… · 3 s Priority is passing to the LLM. ·
8 s The judge is reading every layer. Twice. · 15 s Still waiting? The servers
are scrying 1. · 25 s At this point we're basically in a MUD subgame. · 40 s If
this were F6, we'd have resolved by now.

No horizontal page scroll at any width, today or one row
(`document.documentElement.scrollWidth` equal to the viewport width).

## Long phrases on a phone — the three behaviours

- **Wrap inside the middle (chosen).** The phrase takes two lines next to the
  seal; seal and clock stay centred on the row. Every word stays readable. The
  bubble is 66–68 px tall, about half of today's 122–136 px.
- **Truncate with an ellipsis.** Keeps a single text line but cuts the joke
  ("At this point we're basica…"). The phrase is the whole point of the wait,
  so this loses content. Rejected.
- **Let the clock drop below.** That is the stacked layout again. Rejected.

## Motion, reduced motion, live region (checked live, one-row preview on)

- The live line still carries `aria-live="polite"` and `aria-atomic="true"`;
  the lifting line stays `aria-hidden`. DOM order is unchanged (seal → message
  stack → clock), because only CSS changed.
- Ink-in (`wait-inscription-ink-reveal`, `-ink-glow`) and the ring turn
  (`wait-inscription-ring-spin`) still run. Under `prefers-reduced-motion:
  reduce` the existing rule (index.css ~5364: duration 0.01 ms, one iteration)
  still applies; screenshot `ask-phone-375-reduced-s27-onerow.png` shows the
  line whole and the bubble on one row.
- The two motes drift 22 px up from the seal's foot; with the seal at the top
  of a 62 px bubble they stay inside the bubble.
- Seen, not changed: the ink-in reveal is a left-to-right clip, so on a
  two-line phrase both lines reveal together. This already happens today at
  375 px for the MUD line; one row makes it happen for four of six phrases on
  phones. Animations are out of scope (follow-up in the brief).

## Screenshots

All under `PRD/work/in-depth-context-spacing/.playwright-mcp/` (git-ignored,
local only). Naming: `<flow>-<width>-<time>-<today|onerow>.png`, where time is
`s02` (Consulting the stack…), `s27` (MUD subgame, the longest phrase) or
`s42` (F6). `-viewport` files show the whole screen.

Key pairs:

- Desktop: `ask-desktop-1440-s27-today.png` / `ask-desktop-1440-s27-onerow.png`
- Phone 390: `ask-phone-390-s42-today.png` / `ask-phone-390-s42-onerow.png`
- Phone 375 (longest phrase): `ask-phone-375-s27-today.png` / `ask-phone-375-s27-onerow.png`
- Reduced motion 375: `ask-phone-375-reduced-s27-onerow.png`
- In-depth, whole screen 375: `indepth-phone-375-s42-today-viewport.png` / `indepth-phone-375-s42-onerow-viewport.png`
- In-depth desktop: `indepth-desktop-1440-s42-today.png` / `indepth-desktop-1440-s42-onerow.png`
