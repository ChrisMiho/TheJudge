# IDEA — test-naming-convention

Vitest suite titles still carry obsolete Slice / STORY / REQ / DEC labels, so CI output is hard to scan and does not map to current product features. Establish a hierarchical naming convention — outer `describe` is `Frontend|Backend - <Feature>`, nested suites and `it()`s describe area and behavior — document it in `PRD/instructions/`, and rewrite existing titles to match. Non-goals: renaming test filenames, changing assertions or coverage gates, and retiring planning IDs from PRD decisions or receipts.
