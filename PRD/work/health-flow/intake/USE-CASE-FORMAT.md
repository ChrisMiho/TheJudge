# How to write your use-case list

You write what you expect, in your own words. An agent then maps each line to
the flow tests and tells you the words the app and PRD use for the same
thing. Translating is the agent's job, not yours.

Put your list in `PRD/work/health-flow/intake/owner-use-cases.md`.

## The shape of a line

One line per thing you expect:

> **When I** *(do something)*, **I see** *(what happens)*.

Add a starting point only when it matters:

> **If** *(the situation)*, **when I** *(do something)*, **I see** *(what happens)*.

Examples:

- When I open the menu and tap Life Tracker, I see the life counters.
- When I tap minus on a player, their life goes down by one.
- If I've already added Sol Ring to the stack, when I try to add it again, I see a message saying I can't.
- When I reload the page, my game is still there.

## Walk-throughs and branches

Write the normal way through a screen once, as numbered steps. Hang each
alternative under the step where it splits off, starting with **"But if"**.
Never repeat the whole sentence for a branch.

```text
## In-Depth (asking about a game in progress)

Main walk-through:
1. When I open In-Depth, I see the game setup screen.
2. When I give Player 1 a name, I see that name in the player list.
   - But if I type only spaces, I see "Player 1" with no name.
3. When I pick the zones I need and tap Continue, I see the card screen.
   - But if I pick no zones, I can't tap Continue.
4. When I add Lightning Bolt to the stack, I see it on the stack.
   - But if I add it again, I see a message saying I can't.
   - But if the card picture won't load, I see the card's name instead.
5. When I tap send without typing a question, I see an answer.
   - But if the stack is empty, it asks a different default question.
6. ★ When I come back after leaving, everything I entered is still there.

At any point:
- The page never scrolls sideways.
```

- The numbered steps become the main test, which walks them in order.
- Each "But if" becomes a short side test that starts at that step.
- A branch can just end: "But if the AI fails, I see an error and a Retry button."
- A branch with its own steps gets a sub-list:

  ```text
  - But if the AI fails:
    - I see an error and a Retry button.
    - When I tap Retry, I see the answer.
  ```

- Something true at every step goes under **At any point:**, unnumbered.
- Pick the way you'd normally use the screen as the main walk-through.
  Everything else becomes a "But if".

## Five habits

1. **Group by screen or tool,** under a heading in your own words ("Life
   counter", "Asking a question").
2. **One expectation per line.** Two "I see" parts means two lines.
3. **Name things the way they look to you:** "the big button at the bottom",
   "the card picture", "the little x". The agent tells you the real name.
4. **Write the "should never happen" ones too:** "I should never lose my typed
   question when I switch screens."
5. **Mark the ones you care about most with ★.** Those must be in the main
   walk-through, not a side test.

## Don't worry about

- Flow numbers, PRD terms or button names.
- Phone versus desktop, unless something should differ between them. If it
  should, say so on that line.
- Exact wording on screen, unless the wording itself matters to you.
- Completeness. A partial list is fine; the agent shows you what it has that
  you didn't mention.

---

## For the validating agent

You are checking the **format** of `owner-use-cases.md` against this file. Do
not judge whether the expectations are right, do not map them to flows or
tests, and do not rewrite the owner's words. Report only; edit nothing.

Check each line and report every miss with its heading and line text:

| # | Check | Passes when |
| --- | --- | --- |
| 1 | Grouped | Every line sits under a `##` heading naming a screen or tool |
| 2 | Shape | Each step or branch says what the player does and what they see, or states a condition the player can observe ("my game is still there") |
| 3 | One expectation | No line holds two separate results (two "I see" parts, or "and I also see") |
| 4 | Walk-through | A group with a sequence uses numbered steps under `Main walk-through:` |
| 5 | Branches | Each alternative starts with "But if", is indented under the step it splits from, and does not repeat that step's sentence |
| 6 | Branch steps | A branch with more than one result uses an indented sub-list |
| 7 | Always-true | Statements true at every step sit under `At any point:`, unnumbered |
| 8 | Observable | Every "I see" is something a person could see or do on screen, not an internal behavior ("it saves to storage") — flag it and suggest the visible version as a question, not a rewrite |
| 9 | Size differences | A line that only applies to phone or desktop says which |
| 10 | Stars | ★ lines sit in a main walk-through, not only in a branch |

Output, in plain words:

1. One line: how many lines checked and how many misses.
2. A table: heading · the line as written · which check it misses · what to
   change, in one short phrase.
3. Lines that are unclear in meaning (not format) — list them as questions
   for the owner, without guessing an answer.

Keep it short. The owner reads this, so follow
`PRD/instructions/plain-language-standard.md`: open with the ask, plain
words, no jargon.
