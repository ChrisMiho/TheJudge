---
status: ideation
---

# chrome-hit-areas-and-mid-flight-exits

Post-ship audit findings from the three ship-ready UX packages, captured after PR #71 landed its
own set of fixes on top of them.

Idea and evidence: [`IDEA.md`](./IDEA.md).

Two load-bearing findings: the Menu corner rail's invisible hit area intercepts taps on destination
content (worst on Life Tracker, where DEC-136 made the whole card a life zone), and opening a saved
conversation from mid-flight staging discards the staged attempt without the Draft snapshot that
DEC-130 gives Menu-leave and reload. Three lower-severity consistency findings ride along.

All five were reproduced with Playwright MCP at 430 × 900 and are recorded with measurements in
`IDEA.md`, so refinement can start from evidence rather than re-derivation.

## Next step

`/thejudge-refinement PRD/work/chrome-hit-areas-and-mid-flight-exits/`
