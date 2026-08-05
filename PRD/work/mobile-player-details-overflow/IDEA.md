# mobile-player-details-overflow

On mobile viewports in the In-Depth Question game-context step, expanding a player's secondary details (Poison, Energy, Experience, Commander damage, named counters) causes the expanded boxes to slide horizontally off the page. Desktop layout is fine; this is a mobile-only presentation defect that makes player editing unusable on phones.

Outcome: when secondary player details expand on a mobile viewport, every expanded control stays fully within the viewport with no horizontal page overflow or sideways slide. Implementation debug, fix confirmation, and visual verification must use Cursor's Playwright MCP plugin (`plugin-playwright-playwright`) at a phone-sized viewport — not a new `@playwright/test` CI harness unless refinement later justifies it.

Non-goals: redesigning desktop roster layout beyond incidental shared safety (`min-w-0` / wrapping that does not change the sm+ composition); Life Tracker; chat shell; Ask AI / data model; player-count or secondary-details disclosure behavior.
