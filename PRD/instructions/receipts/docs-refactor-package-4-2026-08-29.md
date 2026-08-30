# Receipt — docs-refactor Package 4: the plain-language standard

**What happened:** Every artifact an agent hands you — a gate question, a PR
body, a receipt, a status row, an in-session summary — now has to open with a
plain-language block: lead with what you must do, spell out any `DEC`/`REQ` it
leans on inside the sentence, and put what a player sees before any technical
term. This receipt is the first thing written to that rule; its own opening is
the proof.

**What it means for you:** the next gate a run parks at should read like a
question you can answer out loud, not a list of ID shorthand you have to decode.
That was the pain that started this whole refactor — *"the questions are
difficult to answer, due to the shorthand being used to describe past DECs"* —
and this is the package that fixes it.

---

- Date: 2026-08-29
- Slug: docs-refactor-package-4
- Status: shipped (docs + skills)
- Scope: forward-only — binds every artifact written from now on; past receipts
  left untouched (owner's call, 2026-08-29)
- Plan of record: `PRD/work/adhoc/package-4-plan.md`

## What shipped, by edit front

**Front 1 — the standard.** New `PRD/instructions/plain-language-standard.md`:
the four rules (open with the ask; inline don't cite; product terms first;
repeatable out loud), the per-artifact opening-header table, and one worked
before/after example built on a real requirement — `REQ-134`, the Quick Lookup
character counter that measures typed text, not the longer message actually
sent. Cross-linked from `writing-rules.md`.

**Front 2 — gate questions.** The `GATE-QUESTIONS.md` block format in
`graph-workflow-contract.md` (`## The two runs`) now requires the
*What this decides · In plain terms · What happens if you say no* header on every
`## <STABLE-ID>` block. The generator step in `graph-run/SKILL.md` and the reader
side in `graph-gate-review/SKILL.md` point at the standard. This is the front the
founding pain lives on.

**Front 3 — PR bodies.** The two skills that actually author a PR body carry the
*What this is · What you need to do · What it changes* header above their existing
machine detail: `graph-run/SKILL.md` (the docs-only base→main PR) and
`thejudge-implement-all/reference.md` (`## Initial PR body`).

**Front 4 — receipts + status.** `thejudge-cleanup/SKILL.md` requires the
*What happened · What it means for you* opener on every receipt, and
`graph-run/SKILL.md`'s park write binds its owner-facing `## Open gate` message
and board row to the standard.

**Front 5 — in-session output.** `CLAUDE.md` communication style and
`agent-working-rules.md` extend the standard to bind subagent reports and skill
handoffs, not just the main chat.

**Front 6 — mirror.** All four edited `.claude/skills/` files re-synced to
`.agents/skills/` via `npm run skills:ai-sync`; verified byte-identical.

## Scope note (deviation from the plan, forward-only intact)

The plan's Front 3 listed five skills as running `gh pr create`. Only two of
them author a PR body: `graph-run` and `thejudge-implement-all`. `graph-preflight`
only *lists* PRs (its base→main guard); `thejudge-cleanup` and `graph-gate-review`
author no PR body. The header was embedded where a body is actually written, not
where a PR is merely referenced.

## Files

Created:
- `PRD/instructions/plain-language-standard.md`
- `PRD/instructions/receipts/docs-refactor-package-4-2026-08-29.md` (this file)

Updated (docs):
- `PRD/instructions/writing-rules.md`
- `PRD/instructions/graph-workflow-contract.md`
- `PRD/instructions/agent-working-rules.md`
- `CLAUDE.md`

Updated (skills, each mirrored to `.agents/skills/`):
- `graph-run/SKILL.md`
- `graph-gate-review/SKILL.md`
- `thejudge-implement-all/reference.md`
- `thejudge-cleanup/SKILL.md`

## Verification

- `npm run test:scripts` — 420 pass, 0 fail (includes the protected-write guard
  and the skill-mirror sync guard).
- `diff -q` on all four skill files: `.claude/skills/` and `.agents/skills/`
  byte-identical.

## What's left of the refactor

Package 3 (the operator manual) is the last remaining work, and it comes last on
purpose: it documents what this package just settled. See
`PRD/work/adhoc/PROGRESS.md`.
