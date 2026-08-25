# Slice A — manual evidence log

2026-08-25 A4 — read every **How it works** bullet in
`PRD/sections/user-feedback/README.md` against its cited source's actual
text: entry point (DEC-104's decision text, REQ-086's acceptance criteria —
action-entry kind, additive amendment to DEC-095, exactly one v1 action
entry); modal fields/validation/accessibility/motion (DEC-105's decision
text, REQ-087's acceptance criteria, NFR-001's constraints, NFR-006's
constraints — category/message/email fields, inline validation, focus
trap/Esc/restore, CSS-only reduced-motion, touch-friendly); snapshot
content/disclosure/pure-builder (DEC-105, REQ-088's acceptance criteria —
the same field list, one-line disclosure plus expandable summary, lazy
`getFeedbackContext()` callback, pure builder, no mutation); delivery
endpoint/payload/lifecycle (DEC-105, REQ-087, REQ-088 — Formspree public
form id, JSON-stringified snapshot field, idle/sending/success/error
lifecycle, draft preserved on error); graceful no-op when unconfigured
(DEC-105, REQ-088 — disabled/no-op with explanatory hint, never throws).
Every bullet's stated behavior traces to its cited source; nothing invented.

2026-08-25 A6 — compared **Rejected alternatives and deferred scope**
against DEC-104's and DEC-105's Context paragraphs in
`PRD/sections/decisions/feedback.md` and `PRD/sections/decisions/navigation.md`.
All four closed doors match: ad-hoc emails from the user's mail client
(DEC-105 Context: "the owner only imagined ad-hoc emails, which do not
scale..."), a standalone header affordance outside the registry (DEC-104
Context: "The alternative...was rejected because it splits navigation
ownership..."), a destination view instead of a modal (DEC-104/DEC-105
Context: modal chosen "so the user does not lose their place mid-flow"), and
a backend route/SES/server-side delivery (DEC-105 Context: backend-minimal,
"a delivery path that requires no new backend route, no secret, and no
contract change is strongly preferred"). The deferred-scope line
(screenshots/file uploads, persistence, auth, in-app history, analytics)
matches DEC-105's decision-text "Non-goals (v1)" verbatim in substance.
Nothing invented, nothing omitted.

2026-08-25 A8 — `grep -oE "(DEC|REQ|FLOW|NFR|Q)-[0-9]+"
PRD/sections/user-feedback/README.md` returns 10 unique tokens: the 8 cited
IDs (DEC-104, DEC-105, REQ-086, REQ-087, REQ-088, FLOW-014, NFR-001,
NFR-006) plus DEC-010 and DEC-095, both appearing once in body prose (line
32, portal registry DEC-095; line 121, backend-minimal DEC-010). Both are
real, confirmed decisions (`PRD/sections/decisions/navigation.md` `###
DEC-095`, `PRD/sections/decisions/providers-and-contract.md` `### DEC-010`),
not invented IDs. Both citations are directly inherited from DEC-105's own
Context prose in `PRD/sections/decisions/feedback.md`, which cites the same
two IDs in the same way: "The product is deliberately backend-minimal (one
product endpoint, DEC-010...)" and "The entry point reuses the feature
portal (DEC-095)...". DEC-105's own official citation set (`Related
requirements:`) likewise omits DEC-010, DEC-095, and DEC-104 despite citing
all three in its Context prose — confirming this is the established PRD
convention (formal dependency list vs. incidental prose citation of
adjacent, already-confirmed decisions), not a spec-authoring defect. A8 is
read as "no fabricated/invented ID", which this satisfies; no new claim of
scope or behavior rides on either citation. Recorded so a reviewer who reads
A8 more strictly can see the reasoning and the exact two tokens in question.

2026-08-25 A3 (home-file note) — `DEC-104`'s full decision body lives in
`PRD/sections/decisions/navigation.md` (`### DEC-104`), not
`PRD/sections/decisions/feedback.md` as the slice doc's requirement 1
states; `feedback.md` only mentions DEC-104 once in its intro prose
("Reached through the feature portal as an action entry (DEC-104)") and in
DEC-105's Notes ("depends on DEC-104 for the portal action-entry kind").
Confirmed independently by `grep -rln "DEC-104" PRD/sections/decisions/`,
which lists `navigation.md`, `ui-presentation.md`, and `feedback.md`. DEC-104
itself is real, confirmed, and its full text (read in `navigation.md`)
matches the spec's citations of it exactly — this is a location note about
the slice doc's own home-file claim, not a defect in the committed spec, and
is not the kind of gap A5 licenses a correction for (no missing file path,
no missing behavior). No spec edit made for this.
