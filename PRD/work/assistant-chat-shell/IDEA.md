# assistant-chat-shell

In-Depth Question and Quick Question chat panels already deliver staged context and Q&A, but the chrome feels utilitarian compared with modern assistant UIs: history is hard to browse, the active thread is not the clear focus, and context, edit, and new-session actions are not presented as a clean professional shell.

Outcome: a ChatGPT/Claude/Cursor-like chat shell for both modes — left conversation history as a collapsible drawer on desktop and mobile, the open chat front and center, compact context badges around the composer, Edit context (existing staging/edit behavior), and New conversation that starts with fresh context. Desktop can show denser history and badges; mobile conserves space via the same drawer pattern.

Non-goals: no Ask AI provider or request-contract rewrite; not a rules-engine redesign; no redesign of unrelated suite features (scan, life tracker, portal) beyond shared chrome this shell needs. Related narrower package `in-depth-question-ux` (reset + answer markdown) stays separate for now; refinement decides absorb vs keep.
