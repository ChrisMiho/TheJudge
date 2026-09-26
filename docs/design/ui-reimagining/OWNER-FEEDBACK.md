# Owner feedback — ui-reimagining mockups

Fill this in, then start a fresh session with:
"Continue the ui-reimagining mockup rework. Start from
`docs/design/ui-reimagining/README.md` (Iteration log), then work through
`docs/design/ui-reimagining/OWNER-FEEDBACK.md` in order, showing me a render
after each flow."

Mark each point **Rule** (must hold) or **Try** (show me and I'll decide).
Order the flows the way you want them worked.

## Quick Question (current page: `direction-1/quick-question.html`)

Open questions from the last session:

- Ring on phone: show all five cards behind the front one, or only three?
- Remove: keep the button under the caption, or a small ✕ on the card corner?
- Details: keep the button, or make tapping the front card open it?

Your points:

- I think showing all 5 cards is probably too much, 3 is fine, the main card, and then one image on each side, as the cards rotate, the other cards can come into the picture, theres no need to cram them all onto the page
- The name, type, and the price under the card is nice, but i think it can be removed, text should only appear if the image is unavailable
- The remove button in the mock worked, but i dont see the details button doing anything, ideally this would open the side pannel that displays all of the oracle text and other information about the card. Additionally, this button used to be a little widget to the top right side of the card that would open this side tray, can that come back please? 
- I finally figured out that the + Card button is for adding a card, while i love the UI of it now that i understand it, it wasnt obvious to me at first, how can we make this more obvious for users, should these boxes maybe be to the right of the Quick question header, and when clicked, display the search bar above the question box maybe?
- when no card is present, theres too much space wasted on showing a blank box, its not even worth showing, just have the quick question box showing until someone adds a card
- the 0/300 next to the send request button, can we integrate that count into the ui more somewhere?

## In-Depth Question (current page: `direction-1/in-depth-question.html`)

Known problem: the questions and game-context fields from today's flow are
missing. Restore first, then re-theme.

Your points:

- In a future state of the app, i think the quick question should transition into the in-depth via a button, instead of them being two completely different flows, i think that change is outside the scope of changes for this work, but i think the main goal should be fixing the theme like were discussing, so that when that change comes in the future, the transition is smooth

## Trade Balancer (current page: `direction-1/trade-balancer.html`)

Known problem: no card images. Card-as-hero may not fit here because more
information competes for the space.

Your points:

- besides adding the pictures back, the gameplan should be a functional trade menu that helps players

## Shared chrome and Menu (current page: `direction-1/shared-chrome-menu.html`)

Known problem: looks the same as today apart from a tint. Do last, so it
matches the pages.

Your points:

- no other points, other than better working the theme into the pannel, since the pannel really didnt change

## Anything global

Theme intensity, motifs, the brand mark, copy tone, anything that applies to
every screen.

- the inspiration images come from cards in their respective colors. The art is inspiration for things we can do to the UI and make the application feel more like an mtg app, and now just a plain old web app

---

# Round 3 — owner feedback on round 2 (2026-09-25)

Round 2 applied everything above; renders are in `renders/`, the record is
`README.md` → "Round 2". Mark each point **Rule** (must hold) or **Try**
(show me and I'll decide), or "accepted" to keep it as is. Then start a
fresh session with:

"Continue the ui-reimagining mockup rework. Start from
`docs/design/ui-reimagining/README.md` (Iteration log, Round 2), then apply
my Round 3 notes in `docs/design/ui-reimagining/OWNER-FEEDBACK.md`, showing
me a render after each flow."

## Quick Question (`direction-1/quick-question.html` · renders `qq-v2-*`)

Tries waiting on your verdict:

- ✕ Remove on the card's top-left corner (mirrors ⓘ).
- Add card + Scan beside the title; search opens above the question box.
  (Or should the search open right under the chips instead?)
- Character count inside the question box with the hairline meter.

Your points:

- the phrase "Ask anything in Magic, or add a card for context" is awkward and not help, id rather omit that all together and let the question in the text box drive the question to the user.
- there is also the phrase "Ask about Lightning Bolt, or anything in Magic." shown in a mock up, i also dont want this, and want it removed all together, it doesnt help users imo
- i just want to confirm that "mockup state: " isnt going to be included in the final code and is just a result of the screenshots
- there is the lightning bolt icon nexct to quick question thats also next to the judge, we dont need it in both spots, next to the judge is fine
- when the detail tray is opened in mobile, a lot of the box just shows gray and is un-appealing, additionally the box around the oracle text but nothing else feels off, and then the exit button right above the name is awkward instead of in the right hard corner utilizing the dead space
- the search bar looks nice, but the text box for the question isnt in the pic, is it off screen, or just covered up? we have a requirement to try and fit everything on the screen for mobile users
- the main screen you see when some cards have been added and the text box is ready for a question looks great
- the red version also looks great, same comment on the custom icon next to quick question though, the one next to the judge is all we need

## In-Depth Question (`direction-1/in-depth-question.html` · renders `idq-*`)

Tries waiting on your verdict:

- The five-station progress rail (Game · Zones · Cards · Context · Answer).
- Zone tiles that glow when selected.
- Card-by-card context with the card as hero beside the fields.
- The lit shelf for cards per zone, with #1…TOP badges on the Stack.

Your points:

- i really like this step by step 1 -> 2 path added to the top, that is top tier for communicating to the user how much is left and it visually looks great
- the icons for opening the additional info or removing the card are so large they cover up the name of the card in the mockups, can we adjust the size of them, im almost considering aligning the card layout like it is in the quick question flow but i appreciate how the top and the following cards are communicated so i wanna try and tune this
- the context menu needs a full rework, it great the options we have now, but ive noticed certain scenarios dont have the right label choice to pick or you default to certain ones because its eaiser, i think this can be evaulated for both space and how it can be streamlined, this is imo, the most painful screen for this flow
- the screen that displays that all the context has been reviewed is great, but i notice parts of the ui cutoff in the screenshot which is something i want to avoid
- there is the "Card-by-card" button, what does that do? seems out of place
- the text "sending to TheJudge - Pre Combaint Main Phase, Player 1 active, and then all the boubles for the zones and their counts under, this doesnt work, the text can be removed all together, the boubles are nice
- the list of all the catds however when all context is reviewed needs to be scrollables so it can always fit
- i notice the default size of the question box is a bit large, can we default to a slimmer box until the question starts to fill in, then only expand the box if there is room, the text in the box also needs to be scrollable
- i like the old chat better, i like the idea of having the cards that were passed in somehow accessible from the chat pannel, but the new UI i feel the mockup doesnt feel as premium as the old ui
- when we reach the chat portion, the #5 of answer box i think could go away altogher, i like the flow, but overall, this is something i think can be cut and cleaned up, so that when the chat window opens, the whole node and line flow disapears and the user is just in the chat at this point then


## Trade Balancer (`direction-1/trade-balancer.html` · renders `tb-*`)

Tries waiting on your verdict:

- The scale as the hero (tilting beam + verdict in plain words).
- "Call it even within $0 / $1 / $5".
- Per-entry foil toggle, quantity, Change printing (with the picker).
- Add cash on a side, rename a side, Swap sides, Copy summary.

Your points:

- the new UI looks incredible, but i am noticing in the mocks certain aspects sliding off screen, i want to avoid this at all costs, and figure out how this new ui can exist but still fit
- the new balance animation with the scale is great, but that whole component in general is quite large, is there a way we can consolidate some of the space, to help alleviate the other space problems
- the printings side pannel is ugly, this needs to be better
- the desktop side by side looks great, but again the mockup has one side showing the list scrolling off screen, id like to make this list scrollable so that like mobile, everything fits on screen, leverage the screen, but dont go off screen

## Shared chrome and Menu (`direction-1/shared-chrome-menu.html` · renders `menu-*`)

Tries waiting on your verdict:

- Header: motif along the right edge, lit hairline along the bottom, brand
  mark in a lit orb.
- Menu tray: destination tiles with a glyph and a one-line hint.
- Theme as six mana orbs, the chosen one wearing its motif.

Your points:

- the new mobile is a fresh take, but i find it kind ugly
- i dislike how the tray comes from the right instead of the left now
- i dont like how send feedback and history are under the color options now
- the menu on desktop coming from the right just overall looks bad and unpolished, non-premium
- 

## Anything global

Rules already locked: card-as-hero is per flow, not global; every card keeps
its colour-identity ring; the theme owns the glow behind a card, never its
edge.

Your points:

- none of the mockups i feel show or utilize the art inspiration that was provided, the UI feels new, but it just feels like a re-worked version of the old UI, i dont really see a lot of new UI artifacts
- i was hoping for more animations, more graphics, more personality within each color profile
- its better, but overall it still missing the elements that make it feel magical, mythical, ethereal, and otherwise unique and non-generic

## Ready to build?

If every flow above is agreed, say so here and the next session writes one
rule per flow and hands the agreed pages to a fresh kickoff (product truth +
app code). Otherwise it runs one more mockup round.

-
