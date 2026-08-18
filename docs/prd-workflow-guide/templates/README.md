# Templates

A runnable skeleton of the system described in the guide one level up. Copy it
into your repo, replace the placeholders, and delete what you don't want.

## What goes where

| Template path | Copy to |
| --- | --- |
| `PRD/` | `PRD/` at your repo root (or inside the relevant package in a monorepo) |
| `AGENT-SKILLS.md` | your repo root |
| `AGENTS.md` | your repo root (duplicate as `CLAUDE.md` if you use Claude Code) |
| `scripts/sync-agent-skills.sh` | `scripts/` — only if you use more than one agent runtime |
| `skills/proj-*/` | your runtime's canonical skill path, e.g. `.claude/skills/` |

## Placeholders to replace

| Placeholder | Meaning |
| --- | --- |
| `proj` / `proj-` | Your skill prefix, lowercase |
| `<Product>` | Human-readable product name |
| `<slug>` | A work package's kebab-case folder name — left as-is in templates |
| `<quality-command>` | Your one-command lint + typecheck + test gate |
| `<code-roots>` | Where product code lives |
| `<domain>`, `<Feature>`, `<Subsystem>` | Fill in per entry |

A find-and-replace on `proj-`, `<Product>`, `<quality-command>`, and
`<code-roots>` gets you most of the way.

## Files marked with a leading underscore

`_package-template/`, `_receipt-template.md`, and `_subsystem-template.md` are
patterns to copy, not files to keep. Delete them once the pattern is habit, or
keep them as in-repo references — either works.

## Suggested order

1. `PRD/sections/` and `PRD/README.md` — the durable corpus. Backfill your
   decisions here first; nothing else works without them.
2. `PRD/instructions/writing-rules.md` and `requirement-format.md` — so new
   entries stay consistent.
3. `PRD/work/STATUS.md` and `PRD/instructions/doc-lifecycle.md` — the ephemeral
   layer. Run one feature through it by hand before automating.
4. `skills/proj-map-out/` and `skills/proj-implement/` — the two skills that
   deliver most of the value.
5. Everything else, as you feel the need for it.

Full reasoning for that order: `../05-adoption.md`.

## Two files you must write yourself

Everything here can be copied and edited later except these, which encode
judgments only you have:

- `PRD/instructions/technical-design-rules.md` — especially the forbidden
  design drift list
- `PRD/sections/decisions/` — your backfilled decisions
