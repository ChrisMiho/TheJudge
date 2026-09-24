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
