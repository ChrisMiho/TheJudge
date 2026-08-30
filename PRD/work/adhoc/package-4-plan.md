# Package 4 plan — the plain-language standard

The last package of the docs-refactor gameplan (Package 3, the operator manual,
comes after because it documents what this settles). A manual, plan-first
interactive session — **not** a graph run or a sweep — because it edits the
`thejudge-*` and graph skills, exactly like Phase C did.

## Why this exists (the founding pain, owner's words)

From `PRD/ideasForLater/graph-workflow/ideaBraindump.md`:

> "some of the questions are difficult to answer, either due to the **shorthand
> being used to describe past DECs** or **myself being unfamiliar with the
> technology**."

Package 4 is the fix: an artifact must never again ask the owner to decode an ID
they can't see or evaluate a term they can't act on.

## The standard

Every **owner-facing** artifact carries a **plain-language opening block**;
technical detail is allowed below it (owner's call, 2026-08-29). The block obeys
four rules:

1. **Open with the ask.** First line states what the owner must do — *Decide /
   Review / Merge / Nothing (FYI)*.
2. **Inline, don't cite.** Any `DEC`/`REQ`/decision it leans on carries its
   substance in the sentence; the ID stays only as a pointer. This is the direct
   fix for the shorthand pain.
3. **Product terms first.** Lead with what the owner or a player experiences;
   define any unavoidable technical term on first use, in the same breath.
4. **Repeatable out loud.** From `CLAUDE.md` — if it can't be read aloud and
   land, it fails.

### Per-artifact opening headers

| Artifact | Opening block |
| --- | --- |
| Gate question | *What this decides · In plain terms · What happens if you say no* |
| PR body / merge ask | *What this is · What you need to do · What it changes* |
| Receipt / status board | *What happened · What it means for you* |
| In-session summary | Already governed by `CLAUDE.md`; the standard makes it explicit and binds subagents too |

## Scope — decided

**Forward-only** (owner, 2026-08-29). Bind all *future* artifacts, plus a one-time
refresh of the two *living* docs the owner reads — `PROGRESS.md` and
`PRD/work/STATUS.md`. Past receipts are historical records; leave them untouched.

## Edit fronts

### Front 1 — write the standard
New `PRD/instructions/plain-language-standard.md`: the four rules, the per-artifact
headers, and one worked **before/after** example on a real recent gate question so
the standard is checkable, not vibes. Cross-link from `writing-rules.md`.

### Front 2 — embed in gate-question generation
`.claude/skills/graph-gate-review/` and `graph-run` (SKILL + reference), and the
gate section of `PRD/instructions/graph-workflow-contract.md`. This is the
highest-value front — the founding pain lives here.

### Front 3 — embed in PR-body steps
Every skill that runs `gh pr create`: `graph-preflight`, `thejudge-implement-all`,
`thejudge-cleanup`, `graph-run`, `graph-gate-review`. Each PR body leads with the
*What this is · What you do · What it changes* header.

### Front 4 — embed in receipts + status boards
`.claude/skills/thejudge-cleanup/` (writes receipts and updates the board) and the
board-update steps in `graph-run`. Add the *What happened · What it means for you*
opener.

### Front 5 — the in-session communication rules
Extend `CLAUDE.md` communication style + `PRD/instructions/writing-rules.md` /
`agent-working-rules.md` so the standard binds subagent output, not just the main
chat.

### Front 6 — mirror to `.agents/skills/`
Every skill edited under `.claude/skills/` has a tracked twin under
`.agents/skills/`. Keep them byte-identical (the repo convention).

## Closeout

One PR (docs + skills, reviewable together), a receipt written **to the new
standard** as its own first proof, and mark Package 4 done on `PROGRESS.md`.
Then Package 3 (operator manual) is the last remaining work.

## Guardrails

- Manual interactive session — the only kind allowed to edit `thejudge-*`/graph
  skills. No graph run, no sweep.
- PR to `main`; the owner merges. Never push.
- `.claude/skills/` and `.agents/skills/` stay identical.
