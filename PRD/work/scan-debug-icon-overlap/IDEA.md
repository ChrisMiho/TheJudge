# Idea: Fix scan debug toggle overlapping card-remove icon

## Problem
The new scan camera debug setting control overlaps on-screen with the existing UI icon used to remove a card from the stack during scan capture. The two clickable targets sit in the same screen region, making it easy to misclick one when intending the other.

## Outcome
Reposition or restyle the debug toggle so it no longer overlaps the card-remove icon's hit area, while keeping both controls easily reachable during scan capture.

## Non-goals
- Not changing the debug setting's behavior or what it toggles.
- Not redesigning the card-remove interaction or its icon.
- Not addressing other unrelated scan-camera UI layout issues.
