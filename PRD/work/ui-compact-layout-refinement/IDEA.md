# Idea: ui-compact-layout-refinement

Several staged-flow screens grow tall on desktop and mobile, forcing document scroll even when the user is doing routine setup work. The game context step carries a hero image and redundant panel chrome; the add-cards step stacks full-width card rows and duplicates search UI while the camera is open; enrichment list mode renders unbounded card editors. Separately, users who want a tighter layout have no control beyond the existing color palette.

The desired outcome is a presentation-only compaction pass: shorter screens via smarter list layouts and scan-mode focus, plus an optional global **Chunky / Slim** density toggle in the theme panel (chunky = current spacing default). Zone confirmation is explicitly out of scope — it is already satisfactory.

Non-goals: changing flow logic, `AskAiRequest` payloads, scan detection/matching, viewport locking or sticky footers, server-synced preferences, or a full design-system rewrite of every Tailwind utility in the app.
