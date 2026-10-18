# Design brief — player-visible bugs

**Ask: Decide two things, then merge.** Answer the two gate questions in
`GATE-QUESTIONS.md`: where the In-Depth scanner shows "you already have this
card" (REQ-214), and whether reopening a saved question from Life Tracker
should copy the tracker's players into In-Depth (REQ-085). Everything else
here fixes the app to match what the spec already says.

**In plain terms:** five of the seven reported bugs are real and were
reproduced in the browser. Trade's scanner prices the wrong printing (fixed
first). In-Depth's scanner refuses a second copy of a Stack card without
saying why. Feedback sent from Trade or Life Tracker describes the In-Depth
screen instead. Reopening a saved question from Life Tracker swaps in the
tracker's players. Retry on a reopened conversation does nothing. The sixth
(blank card names reaching the AI) cannot happen: the server already refuses
such a request. The seventh (look-and-feel items) comes down to one real
defect: In-Depth's zone tabs are 40 px tall, under the app's 44 px tap floor.

**What happens next:** the build half fixes bug 1 first, then the rest, in one
code PR. Bugs 2 and 4 follow your verdicts.

Evidence: `evidence/measurements.md` (what was run and measured, live).
Intake: `intake/IDEA.md`, section a — evidence only; every claim below was
re-read in code on 2026-10-18 before use.

## Summary per bug

| # | What the player sees today | Live? | Fix | New product truth? |
| --- | --- | --- | --- | --- |
| 1 | Trade scan prices a different printing | yes | carry the scanned printing ids on the held card | no — spec already says it |
| 2 | In-Depth Stack scan refuses a repeat card, no message | yes | show the refusal as a line in the scanner panel | **yes — REQ-214 (gate)** |
| 3 | Feedback from Trade/Life Tracker describes In-Depth | yes | only the screen on view adds its details | no — REQ-088 already says "current screen" |
| 4 | Reopening a saved question from Life Tracker swaps in the tracker's players | yes | no roster copy on a reopen | **yes — REQ-085 (gate)** |
| 5 | Retry on a reopened conversation does nothing | yes | Retry resends the failed request | no — REQ-014 already says Retry retries |
| 6 | (nothing — cannot happen) | code-only | none | no |
| 7 | In-Depth zone tabs 40 px tall | yes (tabs), code (segmented buttons) | raise to 44 px | no — REQ-205 already says 44 px |

## Order and slicing

- **Slice A — bug 1, first** (owner's order). Touches only the shared scan
  hook and Trade's scan test, needs no gate verdict, and is the change Q-11
  (the deferred Trade scan-map clean-up) waits on.
- **Slice B — bugs 3 and 5** (In-Depth page wiring; no verdict needed).
- **Slice C — bug 2** (after the REQ-214 verdict).
- **Slice D — bug 4** (after the REQ-085 verdict; on reject, slice D is
  dropped and nothing changes).
- **Slice E — bug 7 tap floor** (shared stylesheet; carries the REQ-202
  screenshot pair).

**One PR or two?** One code PR, with bug 1 as slice A in its own commits. The
graph's build half ships one code PR per package, and it cannot start until
this docs PR merges anyway, so a separate bug-1 PR would not reach players any
sooner through this run. If you want bug 1 live before the rest are reviewed,
say so at the gate and the plan will open slice A as its own PR first.

## Collision with other work

`PRD/work/STATUS.md` lists no active, refined or refining package — this
package is the only one on the board. The intake names a **card-search**
brief that would own `TradeBalancer.scan.test.tsx`, `QuickLookupApp`,
`ZoneCardPicker` and the card-list effect in `MtgAssistantApp.tsx`. That
brief is not a work package: it sits as a pending brief inside
`PRD/ideasForLater/codebase-cleanup-followups/` (cited by path only; not
opened). Handling: **this package lands first.** Card-search, when it is
kicked off, starts from `main` after this merges and plans against the fixed
code. Overlap this package actually creates with card-search's named files:

- `TradeBalancer.scan.test.tsx` — slice A fixes its fake scan hook (it must
  hand over what the real hook hands over).
- `ZoneCardPicker.tsx` — slice C forwards one new prop to the scanner panel.
- `MtgAssistantApp.tsx` — slices B touch the feedback registration line and
  the Retry handler, not the card-list effect.
- `QuickLookupApp.tsx` — untouched (see the bug 2 extra below).

## Bug 1 — Trade scan prices a different printing (fix first)

**What the player sees.** Scan a card onto a Trade side and close the
scanner. The entry defaults to whichever printing the price list puts first,
not the one in your hand. Live: a scanned Lightning Bolt priced at $9.99
showed as "Newest Reprint — $1.00".

**What should happen.** The scanned printing becomes the committed entry's
default printing once its price fetch resolves; the player can still change
it (`PRD/sections/trade-balancer/README.md:77-80`; REQ-065 "scan input: the
scanned printing … is the entry's default printing",
`PRD/sections/functional-requirements.md:1536`). No new truth.

**Cause.**

- `apps/frontend/src/hooks/useScanCapture.ts:409-413` turns the identify
  step's printing-id candidates into card-level (oracle) ids for the vote
  (`votingCandidates`), correctly — different printings must not split a vote.
- `useScanCapture.ts:482` then stores that same oracle-id list on the held
  card as `candidates`; `:301` hands it to the host at close.
- `apps/frontend/src/components/trade/useTradeScan.ts:82-84` calls
  `scannedPrintingIdForOracle` (`:39-51`), which looks each candidate up in
  the scan map. The scan map is keyed by printing id, so an oracle id finds
  nothing, it returns `null`, and no preferred printing is passed on.
- `TradeBalancer.scan.test.tsx` replaces `useScanCapture` with a fake that
  hands over printing ids — what the real hook does not do — so the test
  passes while the app fails.

**Fix (smallest, matches the symptom).** In `useScanCapture.ts:482`, store
the identify step's own candidates (`result.candidates`, printing ids with
distances) on the held card instead of `votingCandidates`. The vote keeps
using `votingCandidates`. The other two hosts ignore `candidates`
(`ZoneCollectionStep.tsx:148`, `QuickLookupApp.tsx:362`), so nothing else
changes.

**Proof.**

- New test in `useScanCapture.test.ts`: drive the real hook through a lock and
  a close with a scan map where one card has two printings; assert the
  committed call's `candidates` carry the scanned printing id.
- `TradeBalancer.scan.test.tsx`: make the fake hook hand over what the real
  hook now hands over (printing-id candidates on the held card), and assert
  the entry defaults to the scanned printing.
- Run the Trade scan tests, the three hosts' scan tests and the scan hook
  tests.

**Files.** `apps/frontend/src/hooks/useScanCapture.ts`,
`apps/frontend/src/hooks/useScanCapture.test.ts`,
`apps/frontend/src/components/trade/TradeBalancer.scan.test.tsx`.

## Bug 2 — In-Depth Stack scan refuses a repeat card with no message

**What the player sees.** On In-Depth's Cards station with the Stack open,
scan a card that is already on the Stack (or already held this session). The
scanner keeps showing "Locking on Lightning Bolt 2/3" and never adds it.
Nothing says why. Confirmed live (the intake found it by reading code).

**What should happen.** REQ-214 already says the Stack's duplicate rule is
checked the instant a card is recognised "so a blocked re-scan still surfaces
its message immediately" (`functional-requirements.md:5618`;
`PRD/sections/scan/README.md:141-143`). It does not say **where** the message
shows. The station's own status line is hidden while the scanner is open, so
the only place a player can see it is inside the scanner panel. That
placement is a visible choice the spec does not make, so it is proposed in
`GATE-QUESTIONS.md` (`## REQ-214`).

**Cause.**

- `apps/frontend/src/components/ZoneCollectionStep.tsx:130-141` returns the
  refusal message to the scanner hook; the hook stores it in `blockedNotice`
  (`useScanCapture.ts:476-477`) and returns it (`:549`).
- No screen reads `blockedNotice`: `ZoneCollectionStep.tsx:451-465` does not
  pass it on, `ZoneCardPicker.tsx` has no prop for it, and
  `ScanPanel.tsx:7-23` has no slot for it.
- The station's status line is explicitly off while scanning
  (`ZoneCollectionStep.tsx:492`).

**Fix (proposed, needs your verdict).** `ScanPanel` gets an optional notice
line under the camera, in the same place its loading and error lines sit.
`ZoneCollectionStep` passes `scanCapture.blockedNotice` through
`ZoneCardPicker`'s scan props. Wording is the destination's own manual-add
message, unchanged: "Duplicate cards are not supported in MVP1." (or "MVP
stack limit reached (10 cards)." at the cap) — `lib/stackLimits.ts:2-3`. The
line clears when the next card is held or the scanner closes (the hook
already resets it then, `useScanCapture.ts:257-265`).

**Extra, offered separately (not in this fix).** Ask a Question has the same
gap: its "already attached" message only renders outside the scanner
(`QuickLookupApp.tsx:673`). Passing the same notice to its `ScanPanel` is one
line. It is not the reported symptom, so it is left out unless you edit the
REQ-214 verdict to include it.

**Proof.** `ScanPanel.test.tsx`: the notice renders under the camera when
given and not otherwise. `ZoneCollectionStep.test.tsx`: with a card already on
the Stack, a scan lock of that card shows "Duplicate cards are not supported
in MVP1." inside the open scanner, and the holding list stays the same.

**Files.** `apps/frontend/src/components/ScanPanel.tsx`,
`apps/frontend/src/components/ZoneCardPicker.tsx`,
`apps/frontend/src/components/ZoneCollectionStep.tsx`, their tests, and the
REQ-214 / scan-README edits at apply.

## Bug 3 — feedback from another tool describes In-Depth

**What the player sees.** Open In-Depth once, go to Trade Balancer, send
feedback. The disclosed snapshot says "Active view: trade-balancer" and also
"Screen: MTG Assistant, Flow step: zone-collection, Cards collected: stack 1".
The owner gets a report that seems to be about a screen the player was not on.

**What should happen.** REQ-088's snapshot is "current screen/step,
in-progress game context and typed question, …" (`functional-requirements.md`,
REQ-088 first acceptance line; `PRD/sections/user-feedback/README.md:58`).
"Current screen" is the one on view. No new truth: the In-Depth details belong
in the snapshot only while In-Depth is on screen.

**Cause.** Every visited tool stays mounted but hidden
(`components/portal/DestinationOutlet.tsx:41-63`). In-Depth registers its
snapshot contributor on mount (`components/portal/MtgAssistantApp.tsx:440-449`)
and never unregisters while hidden; the provider keeps the last registration
(`lib/feedback/FeedbackContextProvider.tsx:38-47`;
`lib/feedback/feedbackSeam.ts:30-44`).

**Fix.** `useRegisterFeedbackContributor` takes an "active" flag and only
registers while it is true; In-Depth passes its existing `isActive` prop
(`destinationRegistry.tsx:150` already supplies it). On another tool the
snapshot carries the shell fields only — exactly what it carries today on a
fresh page that never opened In-Depth.

**Assumption (recorded).** Ladder rung 1, REQ-088 "current screen". Today only
In-Depth contributes flow details; no other tool gains any.

**Proof.** `App.feedback.test.tsx` (or `FeedbackContextProvider.test.tsx`):
visit In-Depth, switch to Trade, read the snapshot — no "MTG Assistant"
screen, flow step or zone cards; switch back to In-Depth — they return.

**Files.** `apps/frontend/src/lib/feedback/feedbackSeam.ts`,
`apps/frontend/src/components/portal/MtgAssistantApp.tsx` (one line), tests.

## Bug 4 — reopening a saved question from Life Tracker swaps in the tracker's players

**What the player sees.** On Life Tracker, open Menu → Question History and
reopen a saved In-Depth question (or "Resume where you left off"). In-Depth
opens the conversation, but its player setup is now the tracker's: live, a
saved 2-player game at 20 life showed 4 players at 33/40/40/40 with the player
details expanded once the player tapped Edit.

**What should happen.** Not settled by the spec. REQ-085 seeds the roster
when the player "selects MTG Assistant from the portal"; REQ-140 says the seed
runs "on menu selection only", not on deep link or Back. A Question History
reopen happens inside the Menu, but it is not a pick of the In-Depth tool —
In-Depth has had no Menu row of its own since REQ-206. Both readings are
plausible and they change what the player sees, so it is proposed in
`GATE-QUESTIONS.md` (`## REQ-085`). Recommendation: **no seed on a reopen** —
the player asked for a saved game back, and the copy overwrites its players.

**Cause.** `FeaturePortalMenu.tsx:103-106` (history entry) and `:134-138`
(game Draft) switch tools through the same `onSelect` as a Menu pick.
`App.tsx:62-73` seeds whenever the switch is Life Tracker → In-Depth.
In-Depth applies the seed on its next render (`MtgAssistantApp.tsx:197-228`).

**Fix (if accepted).** Reopen and Draft-resume switch tools without the seed
check (a resume path in `App.tsx` that sets the destination directly, used by
`FeaturePortalMenu`'s two resume handlers). The Life Tracker → Ask a Question
→ "Add in-depth details" carry seed (`App.tsx:81-92`) is unchanged.

**If rejected.** No code change; the seed on reopen stays as built.

**Proof.** `App.player-life-tracker-seed.test.tsx`: with tracker state saved,
reopening an In-Depth history entry from Life Tracker and resuming the game
Draft from Life Tracker both leave the roster untouched; the existing seed
tests (carry gesture seeds; deep link and Back do not) still pass.

**Files.** `apps/frontend/src/App.tsx`,
`apps/frontend/src/components/portal/FeaturePortalMenu.tsx`, the seed test,
and the REQ-085 / Life Tracker README edits at apply.

## Bug 5 — Retry on a reopened conversation does nothing

**What the player sees.** Reopen a saved In-Depth conversation in a fresh
session, ask a follow-up, and the request fails. "Retry in 10s" counts down,
then Retry lights up. Tap it: nothing is sent, nothing is said, nothing
changes. Confirmed live.

**What should happen.** REQ-014: on a failed request the product "provide[s]
a controlled retry path"; "retry button is shown" with a 13-second cooldown
(`functional-requirements.md`, REQ-014). An enabled Retry that does nothing
breaks that. No new truth.

**Cause.** `MtgAssistantApp.tsx:744-752` (`handleRetry`) returns early when
there is no game context (`!gameContext`), and otherwise re-checks the card
steps. A reopened conversation has no game context in this session (the
reopen restores the conversation, not the staged steps). But the retry itself
never needs it: the failed request is saved and resent as-is
(`hooks/useAskAiSubmitOrchestration.ts:274-301`, `pendingRetry`), and a
follow-up does not use the staged steps at all.

**Fix.** When a failed request is saved, Retry resends it without the staging
checks. The checks stay only for the case with nothing saved; there, a
missing game context flashes Decrypt's own message, "Confirm game context
before decrypting." (`MtgAssistantApp.tsx:736-738`), instead of returning
silently.

**Assumption (recorded).** The intake framed this as "which message should
Retry show". Live, the only reachable silent case is a saved follow-up, where
the right response is to retry, not to show a message (REQ-014). The
nothing-saved branch is not reachable today; matching Decrypt's message there
follows the handler pair's own pattern (ladder rung 3).

**Proof.** A test in the In-Depth submission suite
(`App.interaction-flows.submission.test.tsx` or a new
`MtgAssistantApp.retry.test.tsx`): reopen a saved In-Depth entry with no
staged game, fail a follow-up, wait out the cooldown, tap Retry — the
follow-up request is sent again.

**Files.** `apps/frontend/src/components/portal/MtgAssistantApp.tsx`,
possibly `apps/frontend/src/hooks/useAskAiSubmitOrchestration.ts` (expose
whether a failed request is saved), test.

## Bug 6 — blank Stack card names (no change)

**What the player sees.** Nothing. The intake's concern is that Stack cards
with blank names would reach the AI while blank-named zone cards are dropped.

**Finding.** It cannot happen. The server's request check refuses any card,
Stack or zone, whose name is blank after trimming
(`apps/backend/src/validation/askAiRequest.ts:17-22`, `boundedText` →
`trim().min(1)`; name at `:94`; Stack cards share it, `:125-130`). The prompt
step's own trim (`apps/backend/src/prompt/normalization.ts:16-17`) cannot make
a passing name blank, so the Stack branch in `prompt/context.ts:307` never
sees one.

**Decision.** No change (ladder rung 5: no symptom, preserve behavior). Making
the Stack branch drop blank names like the zone branch is a consistency
clean-up with no player effect; it is offered to the `codehealth` queue, not
built here.

## Bug 7 — look-and-feel items

Five items came from the style clean-up. Only one is a player-visible defect
against the spec.

| Item | What a player sees today | Spec line | Disposition |
| --- | --- | --- | --- |
| Tap sizes (`index.css:1384-1386` `.zone-tabs button`, `:2170-2176` `.seg button`) | In-Depth zone tabs are 40 px tall (measured 390x844); segmented buttons set to 40 px | REQ-205: every interactive control on every In-Depth step is at least 44 px in its smaller dimension | **Fix: raise both to 44 px.** No new truth. |
| `body` ground, `100vh` vs `100dvh`, Roboto (`index.css:2534-2549` vs `styles/shell.css:25-37`) | Ground `rgb(9, 9, 11)` (the flat profile ground), page height 100vh, Roboto in the stack — the `index.css` rule wins | REQ-200: one flat dark ground per profile | No change: today's ground is the spec's. Moving to the shell values would change it. The duplicate rule belongs to the card-rings clean-up, which must keep today's values. |
| 480 px vs 479 px (`index.css:284`, `:2323`, `styles/flow.css:280`) | Differs only on a screen exactly 480 px wide | none | No change; offered to `codehealth` item 12 (breakpoints). |
| Two monospace stacks (`index.css:217`, `:727`) | Tiny font difference on two debug/code surfaces | none | No change; clean-up, not a bug. |
| Grouped `.act-zones` / `.place-zones` rule (`index.css:2062`) | Nothing | none | No change; clean-up, not a bug. |

**REQ-202 screenshot pair.** The tap-floor fix edits `index.css`, the shared
stylesheet. REQ-202 requires every slice that touches the shared stylesheet to
attach a Life Tracker before/after screenshot pair at 390x844 and 1440x900 to
its PR. The pair should show no Life Tracker change (`.zone-tabs` and `.seg`
render only in In-Depth). Also attach the In-Depth Cards station at 390x844
before/after, showing the tabs at 44 px.

**Proof.** A test asserting the two rules' `min-height` is at least 44 px (the
repo's existing touch-floor tests are the pattern), plus a live measurement at
390x844 recorded in the slice evidence.

**Files.** `apps/frontend/src/index.css`, a touch-floor test.

## Product-truth amendment sets (grep dispositions)

**REQ-214 (bug 2).** `grep -rn -i 'blocked re-scan\|surfaces its message\|blockedNotice' PRD/sections`

| Hit | Disposition |
| --- | --- |
| `functional-requirements.md:5618` (REQ-214 acceptance line) | Amend — gate `## REQ-214` |
| `scan/README.md:141-143` | Amend — same block (feature spec mirror) |
| `scan/README.md:259` | No edit: says the check runs at recognition "so a blocked re-scan surfaces immediately" — still true |

**REQ-085 (bug 4).** `grep -rn -i 'roster-seed\|roster seed\|seeds the game-setup roster\|is seeded one-way\|REQ-085' PRD/sections`

| Hit | Disposition |
| --- | --- |
| `functional-requirements.md:2021-2024` (REQ-085) | Amend — gate `## REQ-085` (new acceptance line) |
| `life-tracker/README.md:134-137` | Amend — same block (feature spec mirror) |
| `functional-requirements.md:3438` (REQ-140: seed "on menu selection only") | No edit: consistent once REQ-085 says a reopen is not a seed trigger |
| `functional-requirements.md:5361` (REQ-206 carry gesture seeds) | No edit: the carry seed is unchanged |
| `user-flows.md:301` (Life Tracker flow, step 7: "switches to MTG Assistant") | No edit: describes the switch, not a reopen |
| `system-map.md:552`, `life-tracker/README.md:10` (ID lists) | No edit: lists only |
| `functional-requirements.md:1970` | No edit: false match (a different REQ's clause) |

Bugs 1, 3, 5 and 7 are fixed to match existing spec lines and need no new
truth. Bug 6 changes nothing.

## Non-goals

- Q-11 (the Trade scan-map clean-up) — waits for bug 1, then card-search.
- Ask a Question's scanner notice (offered extra under bug 2).
- The intake's sections b, c and d.
- Any clean-up that changes nothing a player sees (bug 6's consistency
  filter, bug 7's four non-defect items).

## Assumptions (assumption ladder, `PRD/instructions/preparation-contract.md`)

1. Bug 1's expected behavior: rung 1, Trade spec + REQ-065.
2. Bug 2's wording: rung 3, the Stack's own manual-add messages. Placement:
   not resolved by rungs 1–3 → gate.
3. Bug 3: rung 1, REQ-088 "current screen".
4. Bug 4: rungs 1–3 split (REQ-085 "selecting from the portal" vs REQ-140
   "menu selection only") → gate, recommendation "no seed".
5. Bug 5: rung 1, REQ-014; the unreachable no-saved-request branch uses
   Decrypt's message (rung 3).
6. Bug 6: rung 5, no symptom → no change.
7. Bug 7: rung 1, REQ-205 (tap floor) and REQ-200 (ground); the rest rung 5.
8. No genuine decision blocker: each open choice either resolves on the
   ladder or is a reversible gate proposal with a stated default.
