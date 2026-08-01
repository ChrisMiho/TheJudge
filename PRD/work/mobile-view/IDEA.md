# IDEA: Mobile View — Header Collision & Nav Hub Scroll Behavior

**Problem:** On the mobile home screen, the floating assistant orb (anchored top-right) visually overlaps the "Game context" header text at mobile widths — see `Screenshot 2026-08-01 at 11.43.25 AM.png` in this folder, where the orb sits directly on top of the "e" in "Game". Separately, the primary navigation hub (the "Menu" pill) currently follows the user via a sticky/fixed-position approach when scrolling long pages, and the author's first attempt at this doesn't feel elegant in practice.

**Outcome:** The orb no longer collides with adjacent header text on mobile without relocating the orb's general anchor position (top-right stays top-right). The navigation hub gets a more considered scroll/positioning treatment than naive sticky-follow — still reachable on long pages, but implemented in a way that reads as intentional rather than bolted-on.

**Non-goals:** Not a full redesign of the orb's placement strategy or core function; not a full information-architecture overhaul of navigation; not addressing desktop layout (out of scope — this is mobile-specific).
