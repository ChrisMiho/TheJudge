# Quality check — tool-switch-load-delay

**Verdict: FAIL.** Package set to `STATUS.refining`. Four blocking findings,
two advisory. Mode: graph controlling, attempt 1 of the re-grade after the
owner's NFR-014 `edit` (tiered background download). Checked:
`DESIGN-BRIEF.md`, `GATE-QUESTIONS.md`, `evidence/measurements.md` against
`PRD/sections/` and `PRD/instructions/{technical-design-rules,preparation-contract}.md`.

## What passed

- The three diffs apply to current text: NFR-014 constraint line
  (`non-functional-requirements.md:239`), the Suspense line (`:246`) and the
  Dependencies list (`:248-254`); the shared-chrome "Built" paragraph
  (`shared-chrome/README.md:91-100`); the screen-layout Notes cell
  (`screen-layout.md:73`).
- The diffs agree with the owner's verdict (tier 1 landing, tier 2 every other
  tool's code, tier 3 one shared card list; REQ-064 ping only on balancer
  open; REQ-067 keep-alive unchanged; failed download silent and retried). The
  brief repeats the same tiers. Amend-in-place holds; no new stable ID.
- Out-of-scope items (Brotli, caching headers, trimming) are consistent
  between brief and gate.

## Blocking findings

1. A Life Tracker landing now pays for the 1.96 MB card list, and the package
   says nobody does. `DESIGN-BRIEF.md:143-145` ("no player downloads more than
   today"), `:166-169` (A6, "every question-screen visitor already downloads
   it") and `:173-175` (A8, data-saver skipped because the extra is "17 KB")
   are false for a player who lands on the Life Tracker: today they never fetch
   the card list. The cost line in Diff 1 (`GATE-QUESTIONS.md:47`) lists only
   code sizes and omits the list. Fix: state the real extra download for a Life
   Tracker landing (about 1.96 MB gzipped, nothing for question or balancer
   landings), correct A6/A8 and `:143-145`, and add it to Diff 1's cost line
   and to the plain-terms block so the owner's verdict rests on the true cost.
   If the owner meant to accept it, the gate text must still show it.
2. The shared card-list design does not say how each screen consumes it
   without changing what it shows. `DESIGN-BRIEF.md:139-145` leaves it at
   "exact module shape is the implementer's choice". The three screens differ
   today: Quick Question shows "Card search is unavailable…" on failure
   (`QuickLookupApp.tsx:258-276`); In-Depth logs to the console and shows
   nothing (`MtgAssistantApp.tsx:290-314`); the Trade Balancer shows
   "Loading card list…" and an error with the reason, and builds its search
   index from the list (`TradeBalancer.tsx:145-162`). Each also aborts its own
   fetch on unmount. Fix: name the contract. The shared load hands over only
   the parsed array. Each screen keeps its own loading flag, its own failure
   copy and its own index build. An unmount must not cancel a load another
   screen needs. A failure clears so the next screen's open retries. Add one
   acceptance line per screen showing unchanged behaviour (card search works,
   same failure copy).
3. Current product truth left stating the old behaviour, with no diff or
   disposition. `trade-balancer/README.md:60-62` and `:186-189` say the REQ-064
   ping overlaps "while the card list downloads" and hides a 4.2 s cold start
   behind that download. With tier 3 the list is usually done before the
   balancer opens, so the overlap is now typing only. `:196-199` says the
   balancer's "only up-front frontend cost is the shared `cardMetadata` index,
   the same list MTG Assistant and Quick Lookup already load". Fix: add a
   fourth diff (or an explicit "stays true because…" line in the brief per
   spot) so the amended NFR-014 does not contradict the Trade Balancer spec.
4. Acceptance criteria do not pin the tier order or the new landings.
   `DESIGN-BRIEF.md:210-213` (criterion 3) checks only that requests start
   after the landing renders, not that tier 2 chunks request before the card
   list. Nothing measures the question tools opening instantly from a Life
   Tracker landing (the +71 KB case in A4) except the loose "from a Life
   Tracker landing too" in `:206-207`. `evidence/measurements.md` has no
   measurement of that landing or of the shared load, so the headline 41/34 ms
   covers two tools only. Fix: add one criterion for tier order (Resource
   Timing: tier 2 chunks before the list), one for the Life Tracker landing
   (question tools open with no "Loading…", list requested once), and say the
   41/34 ms figures are the two-tool approximation.

## Advisory

5. `DESIGN-BRIEF.md:199` points at a gitignored `measure.js`; the "or an
   equivalent rAF-timed tap" clause covers it. Criterion 3's "within 50 ms of
   the pre-change build" is noise-sensitive; treat it as a trend.
6. Diff 1 Dependencies hunk (`GATE-QUESTIONS.md:56-63`) shows no trailing
   context; the implementer appends `REQ-064`, `REQ-067` after `REQ-066`, not
   mid-list.
