# Design brief — waiting bubble on one row

**Decide:** one slot in `GATE-QUESTIONS.md` (REQ-023, the waiting bubble's
layout). No new stable ID. No blocker.

## The answer in one paragraph

While the Judge works on a player's first question, the waiting bubble today
stacks three things: the small ringed seal (the icon) on top, the funny phrase
under it, and the timer at the bottom right. It is about 123 px tall. The
change puts all three on one row: seal at the start, phrase in the middle,
timer at the end. The bubble drops to about 62 px. On a phone, a long phrase
wraps onto a second line inside the middle, and the seal and timer stay on the
row beside it (bubble 66–68 px). Nothing else changes: same phrases, same
timing, same animations, same colours, same screen-reader announcements. It is
one CSS change to one shared component, so it shows in both In-depth and Ask a
Question.

## What the player sees today

After the player sends a first question (In-depth's **Decrypt Stack**, or Ask a
Question's send), the form is replaced by one bubble:

1. Top: the colour's seal, 28 px, a dashed ring turning round it and two
   motes of light drifting up.
2. Middle: the rotating phrase, inked in letter by letter; the previous phrase
   lifts away.
3. Bottom: the elapsed timer, large monospace (1.5rem), right-aligned.

Measured live (full record: `evidence/measurements.md`):

| Width | Bubble height today | Where things sit |
| --- | --- | --- |
| Desktop 1440x900 | 123 px | seal top-left, phrase 36 px below it, timer 25 px below that at the right |
| Phone 390x844 | 123 px | same stack |
| Phone 375x667 | 122 px; 136 px while the 25 s phrase shows (it already wraps to two lines today) | same stack |

## What the player sees after

| Width | Bubble height | Row |
| --- | --- | --- |
| Desktop 1440x900 | 61–62 px | seal left, phrase on one line in the middle (every phrase fits), timer right |
| Phone 390x844 | 62 px for the two short phrases, 66–68 px for the four longer ones | the four longer phrases wrap to two lines in the middle; seal and timer stay centred on the row |
| Phone 375x667 | same as 390 | same as 390 |

Screenshots (local, git-ignored), all under
`PRD/work/in-depth-context-spacing/.playwright-mcp/`:

- Desktop: `ask-desktop-1440-s27-today.png` → `ask-desktop-1440-s27-onerow.png`
- Phone 390: `ask-phone-390-s42-today.png` → `ask-phone-390-s42-onerow.png`
- Phone 375, longest phrase: `ask-phone-375-s27-today.png` → `ask-phone-375-s27-onerow.png`
- Phone 375, whole In-depth screen: `indepth-phone-375-s42-today-viewport.png` → `indepth-phone-375-s42-onerow-viewport.png`
- Reduced motion, phone 375: `ask-phone-375-reduced-s27-onerow.png`

## Long phrases on a phone

The middle column is about 200 px wide on a phone. Four of the six phrases are
longer than that (from "The judge is reading every layer. Twice." on).

- **Chosen: wrap inside the middle.** Every word stays readable, the seal and
  timer stay on the row, and the bubble is still about half today's height.
- Rejected: cut the phrase with "…". It hides the joke, which is the point of
  the wait.
- Rejected: let the timer drop to its own line. That is the stacked layout the
  owner wants gone.

The timer never wraps (`white-space: nowrap`), so it keeps its width at the
row's end.

## Scope

In scope:

- The bubble's layout: one row of three columns (seal, phrase, timer),
  vertically centred, phrase column taking the free width and wrapping when it
  must, timer at the end.
- REQ-023's last acceptance criterion and the In-depth feature spec's one-line
  description of the bubble, which today say the phrase sits under the seal
  and the timer at the bubble's foot (proposed diff in `GATE-QUESTIONS.md`).
- The two code comments that describe the stacked layout.

Out of scope (owner's boundary):

- The phrases, their six thresholds (0 / 3 / 8 / 15 / 25 / 40 s) and their
  order.
- Timing: the elapsed-timer logic and the 280 ms lift-away.
- The animations: ink-in, lift-away, ring turn, motes, edge breathe, stage
  pulse; the reduced-motion rule.
- Colours, the timer's size and font, the seal's size, the bubble's padding,
  border and radius.
- The accessible live region: the phrase keeps `aria-live="polite"` and
  `aria-atomic="true"`; the lifting line stays hidden from screen readers.
- Follow-up questions (they use the small inline indicator, never this bubble).
- Any new bubble variant: REQ-092 says Ask a Question reuses the bubble as-is.

## Where the bubble appears

One component, `apps/frontend/src/components/AskAiWaitingPanel.tsx`, three
render sites. The change is CSS on that component, so all three get it.

1. **In-depth, first submit** — `EnrichmentStep.tsx` ~880, in the question
   step, in place of the form. Verified live: this is where the bubble
   rendered after **Decrypt Stack** (parent `.idq-step`).
2. **In-depth, conversation view** — `EnrichmentStep.tsx` ~718, passed to
   `ConversationWorkspace` as `pendingFeedback`. It renders only when a
   conversation thread is already on screen (`isConversationActive =
   visibleMessages.length > 0`) and a full decrypt is in flight. Not
   reproduced live; same component, same CSS.
3. **Ask a Question, first submit** — `QuickLookupApp.tsx` ~702 (REQ-092).
   Verified live.

Shape listed site 1 as the In-depth first submit and site 2 as the fallback;
live, the order is the other way round. It does not change the work.

## Decisions and assumptions (assumption ladder)

1. **Both flows get the one-row bubble.** The owner's words describe the chat
   window when the first message is sent, which is the first-submit wait in
   both In-depth and Ask a Question. The package slug names In-depth only.
   Ladder step 1 answers it: REQ-092 says Ask a Question renders
   `AskAiWaitingPanel` "as-is" and forbids a new variant, so the two flows
   share one bubble by product rule. Keeping Ask a Question stacked would need
   a variant REQ-092 rules out. Blocker test: condition 2 fails (the PRD gives
   the basis), so this is not a blocker. The REQ-023 slot says plainly that
   both flows change, so the owner sees it at the gate.
2. **Long phrases wrap inside the middle.** Ladder steps 4–5: the smallest
   change that keeps the row and keeps every phrase readable. Measured above.
3. **Timer size, font and colour stay as they are (1.5rem monospace).** The
   owner asked for alignment, not restyling. The seal and the timer are both
   28 px tall, so the row height is set by them and the timer costs no extra
   height. On a phone the timer takes about 57 px of the row. Shrinking it is
   a follow-up the owner can ask for.
4. **The timer stays right-aligned at the row's end.** Today it is
   right-aligned; the direction-1 mockup's unused `.wait-foot` rule also put
   the clock at the end of a row (`flow.css` ~444).
5. **Seal, phrase and timer are vertically centred on the row.** When the
   phrase wraps to two lines, seal and timer sit level with its middle. Seen
   live in `ask-phone-375-s27-onerow.png`.
6. **No DOM change.** Only CSS changes, so the reading order for a screen
   reader (seal hidden → phrase → timer) is unchanged.
7. **Gap between columns: 0.75rem.** The preview used it; the row gap (0.5rem)
   no longer applies on a single row. Equivalent choices are the builder's to
   tune within the acceptance criteria below.

## Proposed CSS (the preview, verified live)

On `.wait-inscription-bubble` (index.css ~204), add:

```css
grid-template-columns: auto minmax(0, 1fr) auto;
align-items: center;
column-gap: 0.75rem;
```

On `.wait-inscription-clock` (index.css ~3093, which already has
`text-align: right`), add `white-space: nowrap;`.

## Touched files

- `apps/frontend/src/index.css` — the two rules above; the comment at ~2938
  ("inside the judge's bubble, under the colour's seal") reworded to the row.
- `apps/frontend/src/components/AskAiWaitingPanel.tsx` — comments only: "a
  small ringed badge the message sits under" and "The elapsed clock ticks at
  the bubble's foot (REQ-023)" reworded to the row. No markup change.
- `apps/frontend/src/components/AskAiWaitingPanel.test.tsx` — one new
  assertion that reads `index.css` (the file's existing pattern for its CSS
  rules) for the one-row rules.
- `PRD/sections/functional-requirements.md` — REQ-023, as approved at the gate.
- `PRD/sections/in-depth/README.md` ~282 — as approved at the gate.

Not touched: `askAiWaitStages.ts`, `useElapsedWaitTimer.ts`,
`EnrichmentStep.tsx`, `QuickLookupApp.tsx`, `ConversationWorkspace.tsx`,
`styles/flow.css`.

## Acceptance criteria

1. **One row at each width.** At 1440x900, 390x844 and 375x667, in Ask a
   Question's first submit and In-depth's first submit, the seal, the phrase
   and the timer sit side by side: the seal ends before the phrase starts, the
   phrase ends before the timer starts, and the vertical centres of seal,
   phrase and timer are within 2 px of each other. Checked live in a browser
   and recorded in the PR.
2. **Height.** With the one-row layout the bubble is at most 70 px tall at all
   three widths for every phrase (measured 61–68 px).
3. **Long phrase on a phone.** At 390x844 and 375x667, the 25 s phrase ("At
   this point we're basically in a MUD subgame.") and the 40 s phrase show in
   full on two lines in the middle column, with no "…", no clipped word, and
   the timer still at the row's end. No horizontal page scroll at any of the
   three widths.
4. **Timer unchanged in look.** Monospace, 1.5rem, same colour, right-aligned,
   on one line.
5. **Motion unchanged.** The ink-in, lift-away, ring turn, motes, edge breathe
   and stage pulse rules (names, durations, easing, delays) are byte-identical
   to today, and the reduced-motion selector list at index.css ~5364 is
   unchanged. `AskAiWaitingPanel.test.tsx`, `reduced-motion.test.ts` and
   `src/test/motion-foundation.test.ts` pass without edits to their existing
   assertions.
6. **Reduced motion.** Under `prefers-reduced-motion: reduce`, the bubble is on
   one row and each phrase appears whole (checked live at 375x667).
7. **Live region unchanged.** The phrase element keeps `aria-live="polite"`
   and `aria-atomic="true"`; the lifting line keeps `aria-hidden="true"`; the
   seal keeps `aria-hidden="true"`; DOM order stays seal → message stack →
   timer. Existing tests for these pass unchanged.
8. **Phrases and timing unchanged.** `askAiWaitStages.ts` and
   `useElapsedWaitTimer.ts` have no diff; the 280 ms lift-away constant is
   unchanged.
9. **CSS pinned by a test.** A test reading `index.css` asserts the bubble's
   three-column grid with a shrinkable middle (`minmax(0, 1fr)`), centred
   items, and `white-space: nowrap` on the timer.
10. **Product truth applied.** REQ-023 and `PRD/sections/in-depth/README.md`
    carry the wording approved in `GATE-QUESTIONS.md`.

## Non-goals

- Restyling the timer, the seal or the phrase text.
- Reserving a fixed two-line height on phones.
- Touching the follow-up question's inline indicator.

## Follow-ups (not in scope)

1. **Unused mockup rules in `apps/frontend/src/styles/flow.css` ~397–449.**
   `.msg.judge.waiting`, `.wait-foot`, `.wait-time`, `.wait-line`,
   `.wait-lines`, `.wait` and their keyframes and reduced-motion entries are a
   copy of the direction-1 mockup. Nothing in `apps/frontend/src` renders
   those class names. They could be removed in a separate tidy-up.
2. **Two-line ink-in.** The ink-in reveal is a left-to-right clip, so on a
   phrase that wraps, both lines reveal at once. Today this happens only for
   the 25 s phrase at 375 px; with one row it happens for four of six phrases
   on phones. It reads fine in the screenshots. A per-line reveal would be an
   animation change, which this run does not touch.
3. **Small height step on phones.** The bubble grows 4–6 px when the phrase
   moves from one line to two (62 → 66/68 px). Reserving two lines would stop
   the step but leave empty space under short phrases.
4. **Very narrow phones (320 px).** Below the measured widths, the 25 s phrase
   wraps to three lines (middle column 146 px). Still one row and readable.
5. **Smaller timer on phones.** The 1.5rem timer takes about 57 px of a
   phone's row. A smaller timer would give the phrase more room; it is a look
   change the owner did not ask for.

## Prior runs consulted

The IDEA's receipts were offered as input, not scope. The bubble was built by
`ask-ai-wait-animation` (timer, live region), given its seal and ink-in by
`ui-reimagining-build` slice F (REQ-023 accepted then), and moved onto shared
panel tokens by `ui-look-translation`; `ui-refinement` added the Ask a
Question reuse (REQ-092). None of them sets the layout beyond REQ-023's
wording, which this run amends.
