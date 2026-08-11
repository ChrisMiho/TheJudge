# functional-requirements.md

Flat, sequential `REQ-###` entries. No grouping headings — the ID is the
address. Template and field semantics: `../instructions/requirement-format.md`.

IDs are assigned in ascending order and are never reused or renumbered.

---

### REQ-001
- Title: <short noun phrase>
- Priority: high | medium | low
- Description: <what the product must do, in one or two sentences>
- Acceptance Criteria:
  - <observable, checkable statement — not "works well">
  - <another>
- Constraints:
  - <what a correct implementation must NOT do>
- Dependencies:
  - DEC-###
  - REQ-###
- Notes:
  - <amendments, edge cases, links to related flows>

<!-- Copy the block above for each requirement.

     Field semantics that matter:
     - Acceptance Criteria must be observable. If you cannot write a test or a
       precise manual check for it, it is not a criterion yet.
     - Constraints are the negative space. This is where you stop the agent
       from satisfying the requirement with an architecture you do not want.
     - Dependencies list bare IDs, which makes `grep REQ-001` a working
       traceability query. This is why no separate traceability matrix exists.
     - Notes carry later amendments. When a decision narrows a requirement,
       note it here rather than rewriting the original text.
-->
