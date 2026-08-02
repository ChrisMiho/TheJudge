# Idea — quick-question-ui-refinement

## Problem
The Quick Question flow (`QuickLookupApp.tsx`) is functionally complete but has UI rough edges from being built during multitasking: the guidance copy at the top is more verbose than needed, and the "Browse core rules topics" section — a good idea (one-click access to plain-language explanations of high-level rules topics) — was placed above the question section without an intentional design pass, and prints out full topic content in a way that consumes a lot of screen real estate even when the user hasn't asked for it.

## Outcome
1. Guidance text at the top reads exactly "Add a card for context or ask any Magic related question."
2. The core-rules-topics section moves below the question section.
3. The topics UI becomes concise by default — topic content (rule numbers/excerpts) only expands into view when a user actively chooses a topic, rather than being printed out up front.

## Non-goals
- Not changing which core topics exist or their underlying content/data (`gameRulesCoreTopics.json`).
- Not touching the In-Depth Question (`MtgAssistantApp`) flow.
- Not a redesign of the rest of the Quick Question flow (card search, conversation thread, follow-up composer).
