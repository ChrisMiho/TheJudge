# Slice A — Drop Cursor: two runtimes, `.claude/skills/` canonical

## Status: planned

Scope item 1. Depends on: **PR #90 merged**; branch cut fresh from `main`.

## Goal

`.cursor/` no longer exists, every runtime reference to Cursor outside the five
legitimate-keep categories is gone, and `npm run skills:ai-sync` still works —
proved by two gate commands whose exit status is the criterion.

## Requirements

1. Delete `.cursor/` entirely — 20 skill files plus
   `.cursor/rules/playwright-mcp-cleanup.mdc`, whose rule is already carried by
   both `CLAUDE.md` and `AGENTS.md`.
2. Repoint `scripts/sync-agent-skills.sh` **in this slice**, not slice B. It
   reads `$ROOT/.cursor/skills`; deleting `.cursor/` without touching it leaves
   `npm run skills:ai-sync` failing against a source directory that no longer
   exists. Three lines of bash:

   ```diff
   -SRC="$ROOT/.cursor/skills"
   +SRC="$ROOT/.claude/skills"

    mkdir -p "$ROOT/.agents/skills"
    rsync -a --delete "$SRC/" "$ROOT/.agents/skills/"

   -mkdir -p "$ROOT/.claude/skills"
   -rsync -a --delete "$SRC/" "$ROOT/.claude/skills/"
   ```

   The `skills:ai-sync` script **name** does not change; only its implementation,
   and only in slice B.
3. Scrub the 24-file checklist below. It is exhaustive as of `fcafd31`, built by
   running the gate against the tree rather than by reading prose.

   **Skill trees — 4 files edited in `.claude/skills/`, 8 on disk.** Edit the
   canonical tree only; `npm run skills:ai-sync` regenerates the mirror's four
   copies. Never hand-edit the mirror.

   | File (under both trees) | Line | What it says |
   | --- | --- | --- |
   | `thejudge-kickoff/SKILL.md` | 67 | `(Cursor / Claude Code)` command prefix |
   | `thejudge-kickoff/reference.md` | 14, 33 | runtime list; `.cursor/skills/` as canonical |

   **While on `reference.md:14`, fix the count in the same edit.** That line
   reads "All 10 are model-invocable"; eleven `thejudge-*` skills exist. This is
   pre-existing drift unrelated to the Cursor drop and unrelated to slice L's
   third graph skill — it is folded in here only because this slice already
   rewrites the line. Slice L raises the **catalog** counts (13 → 14); this is
   the separate `thejudge-*` count.
   | `thejudge-map-out/SKILL.md` | 66 | `(Cursor / Claude Code)` command prefix |
   | `thejudge-refinement/SKILL.md` | 74 | `(Cursor / Claude Code)` command prefix |

   **Repository root and `PRD/`:**

   - `AGENT-SKILLS.md` — :8 and :124 (command prefix), :15, :26, :31 (catalog
     table and the three-way mirror), :129–135 (authoring workflow, including
     the two-way `diff -rq` verification), :144 (the
     `.cursor/skills/thejudge-kickoff/reference.md` path)
   - `README.md:17` — names `.cursor/skills/` as canonical
   - `PRD/README.md:120`
   - `PRD/instructions/skill-testing.md:5`
   - `PRD/instructions/graph-workflow-contract.md:234` and its "three synced
     trees" boundary
   - `PRD/instructions/doc-lifecycle.md:74` — the anti-pattern about out-of-repo
     Cursor skills
   - `PRD/instructions/workflow-reference.md:22` — a command-prefix line of
     exactly the kind `AGENT-SKILLS.md:124` carries
   - `.claude/graph-profile.json` — deny rules
   - `.prettierignore:8`
   - `scripts/sync-agent-skills.sh` — repointed per requirement 2

   **Portable guide — 6 files, so `docs/prd-workflow-guide/` names only Codex
   and Claude Code:** `START-HERE.md`, `04-skills.md`,
   `templates/AGENT-SKILLS.md`, `templates/README.md`,
   `templates/scripts/sync-agent-skills.sh`, and
   `templates/PRD/instructions/workflow-reference.md:11` (the guide's own
   command-prefix line, in its `/proj-*` placeholder form).
4. **Never scrub these five categories.** A slice that edits any of them has
   done damage, not work:

   | Path | Why it keeps the word |
   | --- | --- |
   | `PRD/sections/decisions.md:194`, `decisions/doc-process.md:213–228` | DEC-165's own body and router row **describe** deleting `.cursor/`. `doc-process.md:93–100` is DEC-115 recording the superseded canonical clause |
   | `PRD/sections/decisions/conversation-ux.md:178,200`, `functional-requirements.md:2515` | "Claude/ChatGPT/Cursor" as the chat-UI **reference product** behind DEC-126/DEC-127 |
   | `PRD/instructions/receipts/*` (8 files) | Durable history; receipts are never rewritten |
   | `PRD/work/graph-workflow/PLAN-spine.md` | This package's own historical build plan |
   | `apps/frontend/src/**`, `apps/frontend/src/index.css` | CSS `cursor:` properties |

   Card data needs no exclusion: every hit is *Precursor Golem*, which the
   gate's word-boundary match does not see.
5. Run `npm run skills:ai-sync` and commit the regenerated `.agents/skills/` in
   the same commit.

## Acceptance criteria

- [ ] `.cursor/` is gone: `git ls-files | grep -i '\.cursor'` exits **1**
- [ ] No stray runtime reference: gate command 2 (below) exits **1**
- [ ] All five legitimate-keep categories still carry the word — verified by
      `git diff --stat` showing **no** change under `PRD/sections/`,
      `PRD/instructions/receipts/`, `PRD/work/graph-workflow/PLAN-spine.md`, or
      `apps/frontend/`
- [ ] `npm run skills:ai-sync` exits 0 **with the bash script**, and
      `diff -rq .claude/skills .agents/skills` produces no output
- [ ] `npm run quality:check` green
- [ ] The 24-file checklist in requirement 3 is walked item by item; every entry
      is either edited or explicitly noted as already clean
- [ ] `thejudge-kickoff/reference.md:14` reads "All 11", not "All 10"

## Verification

```bash
# Gate 1 — no tracked path under .cursor/ (exits 1 when clean)
git ls-files | grep -i '\.cursor'; echo "exit=$?"

# Gate 2 — no stray runtime reference (exits 1 when clean)
git grep -lwiI cursor -- \
  ':!apps/frontend' \
  ':!PRD/instructions/receipts' \
  ':!PRD/work/graph-workflow' \
  ':!PRD/sections/decisions.md' \
  ':!PRD/sections/decisions/doc-process.md' \
  ':!PRD/sections/decisions/conversation-ux.md' \
  ':!PRD/sections/functional-requirements.md'; echo "exit=$?"

npm run skills:ai-sync && diff -rq .claude/skills .agents/skills
npm run quality:check
```

**Pre-slice, gate 2 prints 29 paths. 29 = the 24 files in the checklist + 5
tracked paths under `.cursor/` that this slice deletes rather than scrubs** —
`.cursor/rules/playwright-mcp-cleanup.mdc` and the four `.cursor/skills/thejudge-*`
files that also carry the word. Gate 1 catches those same five, which is why they
have no scrub entry. Verified: gate 2 prints exactly 29 on the tree at `fcafd31`
and on the current tree. State the pre-slice number as **29, not 24** — running
the gate against a partly-deleted tree mid-slice, the two populations must be
nameable separately to tell an expected discrepancy from a missed file.

Three properties this gate form has that a bare `grep -ri cursor` does not:

- **It can go green.** An unqualified gate never passes, because the five
  legitimate-keep categories must survive. An implementer chasing it green would
  scrub DEC-165's own body.
- **`-w` makes card data a non-issue.** Every JSON hit is *Precursor Golem*.
- **`git grep` with pathspecs, not `grep -r` with `grep -v`.** On macOS
  `grep -r … .` prints bare paths, so `'^\./apps/frontend/'` anchors silently
  match nothing and every exclusion is a no-op.

## Files touched

- delete `.cursor/` (21 tracked paths)
- `.claude/skills/thejudge-kickoff/SKILL.md`, `…/reference.md`,
  `.claude/skills/thejudge-map-out/SKILL.md`,
  `.claude/skills/thejudge-refinement/SKILL.md` (+ regenerated mirror)
- `AGENT-SKILLS.md`, `README.md`, `PRD/README.md`
- `PRD/instructions/skill-testing.md`, `graph-workflow-contract.md`,
  `doc-lifecycle.md`, `workflow-reference.md`
- `.claude/graph-profile.json`, `.prettierignore`, `scripts/sync-agent-skills.sh`
- `docs/prd-workflow-guide/` — 6 files
