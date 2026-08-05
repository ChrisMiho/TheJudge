# Chrome tray and conversation history UX

The new top menu is sleek, but when the tray opens, page icons underneath remain visible and clickable — including history — which creates an awkward overlap and conflicting hit targets across pages. Opening past-conversation context also leaves a large wasted gap at the top of both quick and in-depth views, there is no way to delete past conversations, and the history/context panel can only be dismissed via its close control (not by clicking outside).

Desired outcome: when the menu tray is open, underlying chrome icons are visually covered and not interactive; past-conversation context uses the top of the viewport without a large empty band; users can delete past conversations; and clicking outside the history/context panel dismisses it. Adjacent chrome regressions from recent UI work should be fixed in the same pass when they share the same surfaces.

Non-goals: redesigning the menu visual language from scratch, changing Ask AI answer quality, or expanding history into multi-device sync / account-backed storage.
