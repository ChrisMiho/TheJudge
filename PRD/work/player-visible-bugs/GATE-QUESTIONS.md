# Gate questions — player-visible-bugs

**Ask: Decide two things.** Fill in `Verdict` (accept, edit or reject) and,
for edit or reject, `Reason`, under each block. Then merge the docs PR; the
merge starts the build.

Five of the seven bugs need no decision: they are fixed to match lines the
spec already has (see `DESIGN-BRIEF.md`). These two are the ones where the
spec does not say what should happen.

## REQ-214 — the In-Depth scanner says why it will not add a card you already have

**What this decides:** whether In-Depth's scanner shows its "already on the
Stack" message as a line inside the scanner, under the camera.

**In plain terms:** on In-Depth's Cards station, if you scan a card that is
already on the Stack, the scanner refuses it — the Stack allows one copy of
each card. Today it refuses silently: the camera keeps showing "Locking on
Lightning Bolt 2/3" and nothing is added, with no reason given (reproduced in
the browser). The spec already says a refused scan "surfaces its message
immediately" (REQ-214: the scanner checks each zone's own add rule the moment
it recognises a card), but not where. The station's usual message line is
hidden while the camera is open, so this places the message inside the
scanner, under the camera, beside its "scan data failed to load" line. It
uses the same words a manual add already shows — "Duplicate cards are not
supported in MVP1.", or "MVP stack limit reached (10 cards)." when the Stack
is full — and stays until the next card is recognised or the scanner closes.
Ask a Question has the same gap but is left out (not the reported bug); to
include it, answer **edit** and say so.

This does not clash with the rule that the scanner shows only the helper lines
its approved mockup shows (REQ-070's redesigned-screens exception: on the
redesigned screens, *guidance and helper text* — lines that explain how to use
the screen — follows the mockup page, and where the mockup shows no such line,
none renders). The refusal is not guidance: it reports what just happened to
the card you scanned, like the scanner's "Loading scan data..." line and its
scan-data failure line, which also are not on the mockup and already render.
The rule itself keeps such state messages as a separate group (it names the
scanner's `locking` / `camera-error` messages apart from helper text). So no
REQ-070 change and no mockup change; the diff below says this in one clause.

**What happens if you say no:** the refusal stays silent; the scanner keeps
re-trying the card with no explanation.

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ ### REQ-214 — Acceptance Criteria @@
   - the same duplicate/cap rule each destination already applies on a manual add (the Stack's duplicate block; Ask a Question's already-attached block and 10-card cap, REQ-167) is checked the instant a card is recognised, against both the destination's current cards and anything already held but not yet committed - not deferred to the close commit, so a blocked re-scan still surfaces its message immediately; Trade Balancer passes no such rule, so a duplicate scan is always held and committed (REQ-065's existing duplicates-allowed behaviour)
+  - on In-Depth's Cards station, a blocked re-scan's message — the zone's own manual-add wording, "Duplicate cards are not supported in MVP1." for a card already on the Stack or already held, "MVP stack limit reached (10 cards)." at the Stack's cap — shows as one line inside the shared scanner panel, under the camera frame beside the scan-data failure line (REQ-249), never over the camera picture; it stays until the next card is held or the scanner closes, and the holding list does not grow; like the "Loading scan data..." and scan-data failure lines it is state copy reporting a scan's outcome, not guidance or helper text, so REQ-070's redesigned-screens exception (helper text follows the mockup page) does not govern it and the mockup page needs no matching line
   - the "Exit scan" control is a 44px square box with rounded corners carrying an X (the mockup's `.scan-exit` box), at the right end of a slim row directly above the camera frame, its right edge aligned with the camera frame's right edge — identical on every host, never inside or over the camera frame, and never overlapping the caution control or the count pill; the row carries the host's scanner title at its left where the host has one (Ask a Question "Scan a card", Trade Balancer "Scanning onto <side>") and only the box on In-Depth's Cards station (REQ-056); the accessible name "Exit scan" is unchanged; the manual Capture control keeps the accessible name "Capture"
-  - all three hosts render the scanner through one shared panel component: the row above the camera, the "Loading scan data..." line, the scan-data failure line (REQ-249) and the holding-list entries passed to the count pill are built once; each host passes only its title (if any), its destination label and its handlers
+  - all three hosts render the scanner through one shared panel component: the row above the camera, the "Loading scan data..." line, the scan-data failure line (REQ-249), the blocked-scan notice line and the holding-list entries passed to the count pill are built once; each host passes only its title (if any), its destination label, its handlers and, where it has a hold rule, its blocked-scan notice
   - a caution control — a yellow triangle in the scanner's top-right — is visible from the moment the scanner opens, before any card is held, independent of the holding list and whether the count pill is shown; it opens a one-line note that card scanning is experimental only when tapped, dismissed with "Got it"
   - a one-line static hint under the viewfinder, in the wording and position the mockup's scanner page (`docs/design/ui-reimagining/direction-1/card-scan.html`) shows (today: "Auto-scan is on: a confident match adds the card and keeps scanning. The shutter reads one frame by hand."); it is text, not a control, and is an allowed exception to REQ-070's no-net-new-guidance rule; if the mockup page carries no such line, none renders
   - detection, lock, the ding, and the opt-in Debug overlay's metrics are unchanged; the Debug panel takes a themed accent border
-  - tests cover the holding-list accumulate/commit-on-close/Remove behaviour, the hold-time duplicate/cap check, the hint line on every host, that on every host the "Exit scan" box renders outside the camera overlay in the row above it and does not overlap the caution control, and that detection/lock/capture are unchanged
+  - tests cover the holding-list accumulate/commit-on-close/Remove behaviour, the hold-time duplicate/cap check, the blocked-scan notice line on In-Depth's Cards station, the hint line on every host, that on every host the "Exit scan" box renders outside the camera overlay in the row above it and does not overlap the caution control, and that detection/lock/capture are unchanged
--- a/PRD/sections/scan/README.md
+++ b/PRD/sections/scan/README.md
@@ How it works — holding list @@
   destination's current cards and anything already held — so a blocked re-scan
   still surfaces its message immediately rather than silently failing to
   commit; Trade Balancer enforces no such rule, so every recognition is held
-  (REQ-065's duplicates-allowed behaviour is unaffected). (REQ-214)
+  (REQ-065's duplicates-allowed behaviour is unaffected). On In-Depth's Cards
+  station the refusal shows as one line inside the scanner panel, under the
+  camera, in the zone's own manual-add wording ("Duplicate cards are not
+  supported in MVP1." / "MVP stack limit reached (10 cards)."), until the next
+  card is held or the scanner closes. Like the loading and scan-data failure
+  lines, it is state copy, not mockup-governed helper text (REQ-070's
+  redesigned-screens exception does not apply). (REQ-214)
```

- Verdict: reject
- Reason: the owner, 2026-10-18: "for the scanning, right now, that feature is pretty experimental, so if we start with just scanning the card and if it can pick correctly great, otherwise, lets just have them update it themselves, i want to refine card scanning later". No scanner message now; the player adds the card by hand. Bug 2 waits for the later card-scanning refinement.

## REQ-085 — reopening a saved question from Life Tracker keeps that question's players

**What this decides:** whether reopening a saved In-Depth question (or its
unfinished draft) from Question History while you are on Life Tracker copies
the tracker's players into In-Depth.

**In plain terms:** when a player moves from Life Tracker to In-Depth, the app
copies the tracker's table — player count, names, life and counters — into
In-Depth's player setup, one way only (REQ-085; REQ-140 limits it to a Menu
pick, never a direct link or the Back button). Reopening a saved question from
Menu → Question History also counts as that move today, so the copy fires
then too. Live: a saved 2-player game at 20 life, reopened from Life Tracker,
showed 4 players at 33/40/40/40 once the player tapped Edit. This adds one line
saying a reopen is not a move between tools: the saved question comes back
with its own players, and the tracker is not copied. The other way in from
Life Tracker — Ask a Question's "Add in-depth details" — still copies the
table as before. Recommended: **accept**.

**What happens if you say no:** reopening a saved question or draft while on
Life Tracker keeps overwriting In-Depth's players with the tracker's; no code
changes for this bug.

```diff
--- a/PRD/sections/functional-requirements.md
+++ b/PRD/sections/functional-requirements.md
@@ ### REQ-085 — Acceptance Criteria @@
   - selecting MTG Assistant from the portal while tracker state exists pre-fills the game-setup player count, display names, life totals, and counters from the current tracker state
+  - reopening a saved In-Depth conversation or resuming the In-Depth Draft from Question History (REQ-213) is not a seed trigger, even when Life Tracker is the active destination: the reopened conversation or Draft keeps its own players, and the tracker roster is not copied
   - the user can still edit any seeded value before Decrypt
--- a/PRD/sections/life-tracker/README.md
+++ b/PRD/sections/life-tracker/README.md
@@ ### One-way MTG Assistant seed @@
 - Built: switching from the tracker into MTG Assistant pre-fills the
   game-setup roster — player count, display names, life totals, and
   counters — from current tracker state. The user may still edit any seeded
   value before Decrypt.
+- Built: reopening a saved In-Depth question or its Draft from Question
+  History while on the tracker does not seed: the reopened question keeps its
+  own players. (REQ-085, REQ-213)
```

- Verdict: accept
- Reason:

## Blocker questions

None. Every open choice either resolves from an existing spec line or is one
of the two reversible proposals above, each with a stated default. Whether
the scanner's refusal line is barred by the mockup rule (REQ-070) resolves
from that rule's own wording — it governs helper text, and keeps state
messages as a separate group — so it is not a blocker (see the REQ-214 block
and `DESIGN-BRIEF.md`, bug 2).
