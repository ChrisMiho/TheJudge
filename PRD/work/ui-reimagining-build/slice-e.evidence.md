# Slice E — manual evidence

2026-10-01 — file-list correction, recorded before any criterion was earned: the
slice doc's "Files touched" named `ZoneConfirmStep.tsx` for REQ-100's "More details
for all players" toggle and `AdaptiveContextDialog.tsx` for the Targets picker.
Neither holds that code: `ZoneConfirmStep.tsx` is the Zones station (zone
confirmation), unrelated to the player roster, and `AdaptiveContextDialog.tsx` is
the generic View Context / card-detail popup shell, unrelated to per-card target
picking. The real site of REQ-100's synchronized toggle is
`apps/frontend/src/components/PlayerRosterEditor.tsx` (`onToggleSecondaryDetails`,
already wired by `portal/MtgAssistantApp.tsx` before this slice — one shared
`secondaryDetailsExpanded` state, every player's arrow drives it, matching
REQ-100's and REQ-209's description) — already correct going in, and this slice
leaves its behavior alone and only adds a doc comment pointing at REQ-100/REQ-209.
The Targets picker is genuinely new work inside `EnrichmentStep.tsx`
(`hooks/useEnrichmentTargets.ts`), not `AdaptiveContextDialog.tsx`. Re-derived by
intent per `graph-workflow-contract.md` `## Propose / apply / close` — the GATE-
QUESTIONS.md diffs for REQ-017/REQ-021/REQ-100/REQ-210 (applied to
`PRD/sections/`) are unaffected by this correction; only the slice doc's file
hints and `slice-e.criteria.json`'s E4/E6 evidence paths were corrected to match
reality before any criterion was flipped true.

2026-10-01 E9 — golden prompt fixtures: `npm --workspace apps/backend run test`
(40 files, 508 tests, 4 new) passes. `apps/backend/src/prompt/context.test.ts`
adds "REQ-210: omits manaSpent from a non-stack item when the request sends none"
(asserts no `manaSpent` key on the normalized `PromptContextZoneItem`) and
"REQ-210: carries an explicit manaSpent through on a non-stack item" (asserts
`manaSpent: 4` reaches it). `apps/backend/src/prompt/promptFormatting.test.ts`
adds a `formatNonStackZoneSections` suite: an untouched card's rendered section
contains no "manaSpent" substring at all (byte-identical to today for every
existing fixture — none of the 504 pre-existing backend tests changed), and an
edited card's section contains `manaSpent: 4` positioned after `targets:` and
before `contextNotes:`, the same relative slot the Stack's own line takes. This
is the byte-identical confirmation the slice doc's Tests section asks for.

2026-10-01 E10 — in the browser (dev server on ports 3105/5277, mock mode), at
390×844: navigated to `/in-depth`, confirmed game context (2 players), selected
only the Graveyard zone (unchecked the phase-default Battlefield/Hand), searched
"Lightning" and added it to Graveyard, continued to Context. The sheet showed
Owner, a Mana spent box reading "0" with hint "(printed 0)", and the Targets
picker — all on a Graveyard card, not Stack/Battlefield (E5/E4). Selected the
Mana spent box and replaced its value with "5" (`.fill("5")`, which clears before
typing). Clicked "OK — finish context": the review listed "Owner: Player 1" and
"Mana spent: 5" for the card, with a working "✎ Edit" back to the sheet. Clicked
Decrypt Stack (mock mode) and read the backend's own structured request log
(`payloadLoggingEnabled: true` at startup): `requestPayload.gameContext.zones.
graveyard[0]` was `{"cardId":"...","name":"Lightning","imageUrl":"...",
"owner":"Player 1","manaSpent":5}` — the edited value reached the real request,
on a non-Stack zone. The rendered prompt (read from the answered conversation's
expanded debug panel) confirmed the exact line: "ZONE: GRAVEYARD ... targets:
(none) manaSpent: 5 contextNotes: (none) oracleText: ..." — manaSpent sits right
after targets and before contextNotes, matching the backend test's assertion.

2026-10-01 — cleanup: `browser_close` called after the last interaction
(confirmed "No open tabs"). The dev-server instance (ports 3105/5277) was started
by this session as a tracked background task (`bdz9wfj27`) and stopped via
`TaskStop`; `lsof -i :3105 -i :5277` empty after. Reviewable capture: none named
by slice E's doc (no REQ-202 Life Tracker pair is listed for this slice — slice E
touches no shared chrome/token/stylesheet, only the Context sheet and backend
prompt files). Disposable capture: none taken (the scenario was verified via
accessibility snapshots and the backend's own structured request/prompt log, both
inspected directly, so no screenshot was needed). The Playwright MCP server wrote
its own console/snapshot logs to the launch checkout's root `.playwright-mcp/`
(its own cwd) during this slice's browser pass; those were identified by today's
timestamp (19-46 through 19-47) and deleted after the pass, restoring
`cd /Users/chrismiho/Coding/Projects/TheJudge && git status --porcelain` to
exactly ` M scripts/lib/boundary-rules.mjs` (the owner's pre-existing cap-raise
edit). Earlier same-day entries in that folder (18-47 through 18-51) predate this
slice's browser pass and were left alone, out of this slice's scope.
