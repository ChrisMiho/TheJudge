# Probe — data-extract-size

- Date: 2026-09-08
- Question: The committed backend data extracts sit at 119.0 MB against the 120 MB
  Lambda data budget, and today's fresh combo corpus would push them to ~137 MB.
  What is actually taking the space, how are the extracts built, and which
  encoding or layout change gets the full, untrimmed data (fresh combos included)
  back under 120 MB with room to grow? Also: does merging the price and rulings
  extracts into one per-card record (the owner's proposed shape) save space?
- Mode: answer + brief — the owner stated a build goal (under 120 MB with no
  trimming) and the finding clears it with measured margin, so `GRAPH-BRIEF.md`
  is written alongside the answer
- What ran: inline reads of the build scripts, runtime loaders, budget test, and
  NFR-017; two measurement scripts run against the committed artifacts and a
  fresh combo build from today's raw Commander Spellbook download (scratch only,
  nothing committed changed)
- Evidence: `FINDINGS-extract-size.md`; scripts and logs in `tooling/`
- Handoff: `GRAPH-BRIEF.md`
