# problem-statement.md

## Summary
Magic players often struggle to understand stack interactions quickly during live gameplay.

## Problem
Current approaches are weak because:
- manual rules lookup is slow
- generic AI tools do not know the specific stack context
- relying on memory leads to mistakes
- existing tools are often too broad and not focused on the live stack

## Why It Matters
When stack interactions are unclear:
- gameplay slows down
- players disagree
- confidence drops
- casual and semi-competitive tables lose momentum

## Product Opportunity
There is a gap for a fast, narrow-context tool that helps users:
- build the current stack
- ask a question about it
- get useful AI guidance quickly

## Constraints on the Solution
The solution should not try to solve every MTG rules problem, and it is not limited to a single rules-only loop.

It should instead:
- keep stack-context entry fast and useful as the primary MTG Assistant path
- grow a suite of player-help features without becoming a rules engine (canonical rule: `goals-and-non-goals.md` Scope Notes)
- avoid heavy rules-engine complexity (canonical rule: `goals-and-non-goals.md` Scope Notes)
