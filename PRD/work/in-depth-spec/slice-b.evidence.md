# Slice B — manual evidence log

2026-08-27 B2 — Read "The wait, the answer, and the conversation" in
`PRD/sections/in-depth/README.md` against the full text of its cited
sources, read directly:

- Waiting panel bullet: DEC-031 (pure frontend animated panel, CSS-only
  motion, live elapsed timer, threshold escalating messages) / REQ-023
  (thresholds 0s/3s/8s/15s/25s/40s). Matches exactly.
- First-success handoff bullet: REQ-025/DEC-040 (frozen context, hidden
  initial question rides in `conversationHistory`), DEC-118 (compact View
  Context trigger, phase + populated-zone count, adaptive bottom
  sheet/side drawer). Matches exactly.
- Frozen-conversation bullet: REQ-026/REQ-028 (frozen context, text-only
  follow-ups, 300-char docked composer, inline spinner not full panel),
  DEC-039/DEC-040/DEC-041 (client-side ephemeral history, frozen context,
  inline composer spinner not `AskAiWaitingPanel`), DEC-118 (chat-first
  workspace, near-bottom auto-scroll), DEC-123 (structured markdown for
  assistant turns, plain-text `{ answer }` wire contract unchanged),
  DEC-127 (assistant plain flowing text no bubble, user solid right-aligned
  bubble), FLOW-005 (post-decrypt follow-up chat full walkthrough). Matches
  exactly -- wire contract `{ answer }` confirmed unchanged by DEC-123's own
  Impact.
- Follow-up request-shape bullet: REQ-027 (history assembly, hidden initial
  question + first answer then all turns, current follow-up in `question`
  not duplicated), DEC-038 (optional `conversationHistory` field, additive,
  response shapes unchanged), DEC-039 (client-side ephemeral, no session
  store), FLOW-005 (`CONVERSATION HISTORY` inserted before `QUESTION`,
  browser-local history drawer note). Matches exactly.
- Start Over bullet: REQ-029 (visible after first success when not in
  flight, clears thread and returns to game-context step, preserves player
  roster), DEC-040 (roster-preservation list: count, names, life,
  poison/energy/experience, commander damage, custom counters; auto-save on
  leaving with an answer is DEC-124-owned, correctly not restated here).
  Matches exactly.
- Failure-handling bullet: DEC-014 (preserve stack/question/previous
  response, 13s retry cooldown -- resolves in providers-and-contract.md,
  a real pre-existing ID though outside this slice's requirement-1 reading
  list), REQ-014/FLOW-003 (Miho is working on it copy, full failure flow).
  Matches exactly.

No invented capability, no dropped behavior found anywhere in this
subsection.

2026-08-27 B4 — Read "Rejected alternatives and deferred scope" against
every cited DEC's Context/Notes language, each read in full: DEC-003/
DEC-021 (selected-cards-only closed door), REQ-019/DEC-096 (top-level
stack/battlefieldContext closed door -- DEC-096 is Status: superseded,
superseded by DEC-106 for the mode:"card"->mode:"lookup" rename only; the
request-contract-shape claim this bullet makes, `{ question, gameContext }`
with legacy top-level fields rejected, is unaffected by that rename and
still holds under DEC-106, so citing DEC-096 here is consistent with this
corpus's established lineage-citation convention (matching DEC-022+DEC-034
in slice A) and not a gap), DEC-026/REQ-021 (StackTarget closed door),
DEC-034 (stack_resolving closed door), DEC-045/REQ-022 (curated-topics
baseline closed door), DEC-046 (flat scoring closed door), DEC-035 (wider
phase defaults closed door), DEC-043/REQ-031 (structured notes sub-fields
closed door), DEC-040/REQ-025 (visible question bubble closed door),
DEC-041/REQ-028 (waiting panel for follow-ups closed door), REQ-029/
DEC-124 via shared chrome (Start Over scope reset), DEC-153/REQ-132/
REQ-012 (Decrypt Stack visible label closed door), DEC-151/REQ-130
(two-column grid closed door), DEC-160/DEC-158/DEC-151 (image cap and
image-box-bound popup closed doors), DEC-156/REQ-139/REQ-137/REQ-144/
DEC-120/REQ-100 (wide free-typed grid, small triangle, stranded rows,
independent expansion closed doors), DEC-162/REQ-093/REQ-094/REQ-095
(snake_case reader and paginated walk closed doors, forbidden "complete"
combo label). Every closed-door bullet's language matches its DEC's
Context/Notes; the "Deferred, not cut" bullet (DEC-040, DEC-042/REQ-027,
DEC-161) and the "Not owned here" cross-boundary bullet both match their
sources with nothing invented or omitted. The combo-retrieval closed-door
bullet's DEC text (DEC-162/REQ-093/REQ-094/REQ-095) matches; deep code
verification of the combo corpus/retrieval behavior itself is slice C's
job, not re-done here.
