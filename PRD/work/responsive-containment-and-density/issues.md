# Issues — responsive-containment-and-density

Product owner's brain dump from reviewing PR #75. Free-form and unordered: entries are
written as noticed, not grouped or prioritized.

This is the **authoritative work list** for the next session. Working rules for the agent
are in [`HANDOFF.md`](./HANDOFF.md) — read them before starting. In short: read everything
first, reproduce and measure before fixing, fix causes rather than symptoms, check each
entry against existing decisions before assuming it is new scope, and move entries to
Resolved with their evidence as you go.

No format is required. A sentence is enough; a screen name and what looked wrong is ideal.

## Open

1. When opening the menu on all screens, the menu icon and the history chat icon, both remain visibile and clickable through the tray, this does not look good or function well, and id like to hide those icons from being clicked when the tray is open to prevent accidental clicks by the users

2. When editing player details on the game context screen of the indepth flow, the box that expands the players for providing more info past health and name is not aligned properly for both mobile and desktop

3. When adding cards in in-depth or quick question, the card image + all of the oracle text is displayed stacked, while this detail is amazing, it takes up a bunch of realestate, to combat this, id love to add an icon hovering over the top right hand corner of the image, allowing users to click it to see all that wonderful oracle detail, without it using up the screen, the info should be displayed in a popup box over the card, with an x in the top right hand corner to close the details. id like this enahncement to just always be there, whenever a card image is displayed, id like that little icon floating by it for users to click, that way we keep the info but save on space

4. in general, when walking through either flow, besides the excess text from the oracle stuff, the images themselves are incredibly large, and as we add them in the in-depth view, it only complicates the UI more. Therefore, id like to propose that the images are shrunk enough so that the whole application sits within the viewshell, and that a user doesnt have to scroll for it

5. for the in-depth view, right now, the cards are stacked in a grid, id like to change that to have them stack horizontally in the order theyre added, and allow the user to scroll left and right through them, this should reduce space taken and provide a visual for the order as well

6. within the menu panel, there are the orbs that give users the option to select a theme, the final orb is on a new row, i want the tray extended so that the last orb fits neatly in a row, and then that orb is selected, the additional options that spawn should come in centered underneath all of the others the row above, this will keep things clean

7. the updated final screen of the in-depth flow displays "Ready to decrypt. Card context reviewed. Use View all cards to make more edits." after the final enrichment step, but the decrypt button is now gone with the updated chat layout, but i dont want to make the new button ugly, can we have the text change from a arrow to "Send Request" for the initial request, and then have it go back to an arrow to keep it straightforward, and maybe add some context to the above message telling players to click the button unless they add the optional message. Ill let you decide how to word it, but keep it concise please

8. for the text boxes that give users the ability to type in, i had previously given direction that the box can grow until it touches the bottom of the screen, but i think what i meant, is that it can grow, until the bottom most part of the whole app reaches the bottom of the screen, i can see in mobile now that if i hold enter, and create lots of new lines, the text box stops growing once it hits the bottom, but all the ui under it is lost, i dont want that to happen, id prefer the ui under the box be what stops the growing, so that it all fits on the page

## Resolved

<!-- agent moves entries here with the measurement, or the reason it was not actionable -->
