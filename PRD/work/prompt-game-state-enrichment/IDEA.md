---
name: prompt-game-state-enrichment
description: Enrich the LLM prompt with additional game-state context categories to improve ruling accuracy
metadata:
  type: project
---

The current prompt context provides a strong foundation (stack order, card details, zone state) but lacks several categories of game-state information that force the LLM to make assumptions when producing MTG rulings.

Adding explicit context for active continuous and replacement effects, target legality flags (protection, hexproof, shroud, uncounterable), current priority holder, alternative or additional casting costs used, and pending delayed triggered abilities would allow the LLM to produce confident, unambiguous rulings without unstated assumptions.

Outcome: the prompt contains every game-state detail the LLM needs to rule on complex interactions — removal of ambiguity reduces hedging language and incorrect resolutions in edge cases.

Non-goals: this is not a prompt-format redesign, not UI changes, and not real-time CR retrieval (that is covered by the `supplemental-game-rules-retrieval` work package).
