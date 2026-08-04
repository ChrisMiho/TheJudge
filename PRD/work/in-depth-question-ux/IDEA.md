# in-depth-question-ux

Assistant answers often include markdown (headings, lists, emphasis) that currently reads as unformatted plain text in the chat, so explanations are harder to scan than they should be.

Outcome: readable answer presentation in chat — prefer client-side markdown rendering so structured replies look intentional, with schema-enforced answer shapes only if refinement shows raw markdown is not enough.

Non-goals: not a rules engine rewrite; not broader ask-ai contract or provider changes beyond what presentation needs; not a full Quick Question redesign unless it shares the same chat surface and should stay visually consistent.

Note: the one-action full-session reset ("Start Over" returning to the beginning of the flow while preserving the player roster, and clearing the attached card in Quick Question) shipped separately (DEC-040, REQ-029, REQ-075) and is out of scope here.
