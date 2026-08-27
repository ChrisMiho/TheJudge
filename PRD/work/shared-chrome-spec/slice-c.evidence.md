# Slice C — manual observation log

2026-08-27 C1 — read the "Deferred / out of scope for this view" bullet
(PRD/sections/shared-chrome/README.md lines 407-410) against its cited
sources: deep-linkable in-flow state matches DEC-157 Notes ("in-flow state
stays ephemeral... deep-linkable in-flow state would be new product
behavior with its own privacy surface... and is a deliberate non-goal");
nested/parameterized routes and search-param state matches DEC-157 Notes
non-goals; cross-device sync/accounts/server-side storage matches DEC-124
Notes ("non-goals: cross-device sync, account/auth, server-side storage");
multi-draft backlog matches DEC-130 Notes ("non-goals: multiple unfinished
drafts per destination, cross-destination single global draft"); shared
drawer-primitive/icon-button extraction matches DEC-125 Notes ("a shared
drawer primitive/component extraction (left as a future code-health item)")
and DEC-126 Notes ("a shared icon-button component extraction (left as a
future code-health item)"). Exactly five items, nothing invented or
omitted.

2026-08-27 C2 — read the "Per-feature surfaces that stay with their own
specs" bullet (lines 411-416) against PRD/sections/decisions/
ui-presentation.md (DEC-120, DEC-128, DEC-156, read in full) and
PRD/sections/functional-requirements.md (REQ-100, REQ-106, REQ-045,
REQ-125, read in full) and PRD/sections/decisions/feedback.md (DEC-104,
DEC-105, read in full) and PRD/sections/user-flows.md (FLOW-014, read in
full). Every named exclusion matches its source's actual concern: DEC-120/
DEC-128/REQ-100/REQ-106 (roster secondary-details disclosure + its
containment defect, both scoped to In-Depth Game Context), REQ-045 (inline
step-name label content, a per-step concern distinct from the eyebrow
*chrome* the shared-chrome spec's Menu section already covers), REQ-125
(zone-collection add-action reachability, an In-Depth zone-collection
screen concern), DEC-156 clause 3 specifically (bounded poison/energy/
experience dropdowns — In-Depth Game Context fields; clauses 1 and 2 of
the same DEC-156 are genuinely shared-chrome scope: card-area
consolidation and the themed close icon), DEC-104/DEC-105/FLOW-014 (the
Send-feedback modal's own body, owned by user-feedback/).

Checked requirement 1's precise "must not appear in Backed by:" list
(DEC-120, DEC-128, REQ-100, REQ-106, REQ-045, REQ-125, FLOW-014) against
the file's `Backed by:` line (README.md line 7): none of those seven IDs
appears there — confirmed by direct read. DEC-105 also does not appear.
DEC-104 and DEC-156 *do* appear in `Backed by:`, but legitimately: DEC-104
backs the Send-feedback *action-entry mechanism* within the Menu tray (the
"Menu corner rail and tray" subsection cites DEC-135/DEC-104/DEC-095 for
the tray's action-entry list, not the feedback modal's body), and DEC-156
backs its clauses 1/2 (card-area consolidation, themed close icon) which
are genuinely shared-chrome scope — only clause 3 (the dropdowns) is the
per-feature exclusion. This is the same multi-clause DEC citation pattern
used throughout the DEC-168 template elsewhere in this file (e.g. DEC-151
is cited for clauses (1)/(2) but not clause (3)'s zone-strip specifics
where those live in In-Depth's own catalog rows). No smuggled in-scope
claim found; the exclusion is substantively correct.

2026-08-27 C7 — read the package README's "Implementation map" (this
package writes its durable deliverable directly to
`PRD/sections/shared-chrome/README.md`, already committed, and
`PRD/README.md`, this slice's row) and confirmed, after slices A/B/C, no
further content requires promotion: slices A and B verified the spec
in-place (bounded corrections landed directly in
`PRD/sections/shared-chrome/README.md`, the durable file itself, not a
staging copy) and slice C added the one `PRD/README.md` row directly. No
`PRD/work/shared-chrome-spec/` file holds durable product content that
still needs to move elsewhere at cleanup — every file under that directory
is process bookkeeping (GAMEPLAN, slice docs, criteria/evidence files,
README, GRAPH-RUN, STATUS marker), all of which `thejudge-cleanup` deletes
after writing its receipt.
