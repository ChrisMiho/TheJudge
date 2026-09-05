# writing-rules.md

## Purpose
These rules govern how product documents should be written and updated.

## Rules
- Use concise markdown with clear headings and bullets.
- Keep each file focused on one purpose.
- Prefer self-contained sections so each file can be read independently.
- Prefer self-contained stories so each backlog item can be executed independently.
- Preserve product meaning from source documents.
- Do not invent product scope unless it is clearly implied.
- Move ambiguity to `sections/open-questions.md` instead of guessing.
- Record product truth by editing the current-state feature spec `sections/<feature>/README.md` and its cited `REQ`/`FLOW` entries in place; the decision log is retired, so do not author a new `DEC-###`.
- Keep product truth in section files.
- Keep workflow and generation guidance in instruction files.
- Every owner-facing artifact an agent generates — gate question, PR body, receipt, status row, in-session summary — opens with the plain-language block defined in `plain-language-standard.md`: lead with the ask, inline the substance of any `DEC`/`REQ` it cites, and put product terms before technical ones.
- Convert scattered notes into structured bullets when possible.
- Preserve important constraints exactly.
- Separate confirmed requirements from ideas, assumptions, and open questions.
- Make parallelization intent explicit when writing or editing stories.
- If a story is blocked by another story, state the dependency directly and explain why.

## Style
- use short paragraphs
- prefer bullets over long prose
- use explicit labels like Summary, Requirements, Constraints, Dependencies, Notes
- keep naming stable across files
- preserve IDs once created

## ID Rules
If no IDs exist, generate clean stable IDs using:
- `REQ-###`
- `FLOW-###`
- `DEC-###`
- `Q-###`
- `NFR-###`

Do not renumber IDs unless there is a compelling editorial reason.

## Editing Rules
- make the smallest change that preserves correctness
- prefer updating one relevant file instead of duplicating content
- if a decision changes product truth, update the relevant feature spec `sections/<feature>/README.md` and its cited `REQ`/`FLOW` entries in place first
- if the decision changes scope or behavior, then update affected section files to match
- when splitting broad stories, separate guardrail/process work from remediation/refactor work when feasible
- when backlog order matters, encode the order via explicit dependency lines in story docs

## Cross-cutting invariants (grep before amend)

A **cross-cutting invariant** is a product rule asserted *as a rule* in 3+ files
(for example: one main product-facing endpoint; mock-first local default;
assistant-not-a-rules-engine). Each has one **canonical home** carrying the full
rule text and an explicit "echoed in" list of every other place it appears.

- Before writing or amending a cross-cutting invariant, enumerate its full
  amendment set by `grep` across `PRD/` and `README.md`. **Never enumerate it
  from memory** — a memory-listed set went stale and cited a retired decision as
  the live rule (image-first-cards D5, 2026-09-04).
- Amend the canonical home, then re-grep and refresh its "echoed in" list so a
  drifted or newly added pointer is caught.
- Fold only invariant *assertions* (the rule stated as a rule). A per-feature
  scope clause ("this feature changes no product-facing endpoint") references an
  invariant but is not a restatement of it — leave those in place.
- A pointer cites the canonical home, never a retired `DEC-###`, as the live rule.
