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
- Put confirmed decisions in `sections/decisions.md`.
- Keep product truth in section files.
- Keep workflow and generation guidance in instruction files.
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
- if a decision changes product truth, update `sections/decisions.md` first
- if the decision changes scope or behavior, then update affected section files to match
- when splitting broad stories, separate guardrail/process work from remediation/refactor work when feasible
- when backlog order matters, encode the order via explicit dependency lines in story docs
