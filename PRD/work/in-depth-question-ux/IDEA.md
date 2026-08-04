# in-depth-question-ux

In-Depth Question (Rules Questions) sessions accumulate staged zone context and a growing Q&A thread, but there is no clear one-action way to wipe everything and return to the start of the flow. Assistant answers also often include markdown (headings, lists, emphasis) that currently reads as unformatted plain text in the chat, so explanations are harder to scan than they should be.

Outcome: a first-class “reset all” control that clears staged game context and conversation state and returns the user to the beginning of the In-Depth flow; and readable answer presentation in chat — prefer client-side markdown rendering so structured replies look intentional, with schema-enforced answer shapes only if refinement shows raw markdown is not enough.

Non-goals: not a rules engine rewrite; not broader ask-ai contract or provider changes beyond what presentation/reset needs; not a full Quick Question redesign unless it shares the same chat surface and should stay visually consistent.
