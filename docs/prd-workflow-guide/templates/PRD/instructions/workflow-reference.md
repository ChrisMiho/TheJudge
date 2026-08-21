# workflow-reference.md

## Purpose

The operator reference for the `proj-*` skill workflow. The full skill catalog,
platform paths, and sync instructions live in `AGENT-SKILLS.md` at the repo root.

## Handoff prefix rule

Every skill that hands off ends with a **Next step**: one sentence plus the
literal command to run next. The prefix is `/proj-*` in Claude Code,
`$proj-*` in Codex. Substitute the real slug and slice letter — never leave a
placeholder in the output.

## Work package status vocabulary

Status lives in three places, kept in sync on every transition:

1. `PRD/work/<slug>/README.md` — `status: <value>` (frontmatter or first-line
   field; preserve the package's existing format and change only the value)
2. Exactly one empty marker file: `PRD/work/<slug>/STATUS.<value>`
3. A row in `PRD/work/STATUS.md`

Never encode status by renaming `PRD/work/<slug>/`. Slugs stay stable for
skills, slice docs, links, branches, and receipts. Glance at the pipeline with
`ls PRD/work/*/STATUS.*` or open the board.

| Status | Meaning | Typical next skill |
|---|---|---|
| `ideation` | Idea only | `proj-refinement` |
| `refining` | Design brief actively in flux | keep refining, or quality-check when approved |
| `refined` | Brief approved; ready to gate and slice | `proj-quality-check` |
| `active` | Gameplan and slices exist; implementing | `proj-implement` |
| `ship-ready` | All slices done; promote, receipt, delete | `proj-cleanup` |
| `owner-action` | Blocked on a human outside the agent loop | human checklist |
| `deferred` | Parked; not next work | `proj-defer` to restore |

Happy path: `ideation` → `refining` → `refined` → `active` → `ship-ready` →
deleted.

### Marker file rules

- Allowed names: `STATUS.ideation`, `STATUS.refining`, `STATUS.refined`,
  `STATUS.active`, `STATUS.ship-ready`, `STATUS.owner-action`,
  `STATUS.deferred`.
- Exactly one per package. Replace it on every change; never leave two.
- Markers are empty files.
- On cleanup: the marker goes with the deleted folder, and the board row is
  removed.

### Skill status duties

| Skill | Duty |
|---|---|
| `proj-kickoff` | Create the package, `STATUS.ideation`, and the board row |
| `proj-refinement` | Start or resume → `refining`; on explicit approval → `refined` |
| `proj-quality-check` | PASS leaves `refined`; FAIL → `refining` |
| `proj-map-out` | → `active` |
| `proj-implement` / `-all` | Stay `active` until the last slice is `done`, then → `ship-ready` |
| `proj-implement-fanout` | Owns no transitions; dispatches to `-all` |
| `proj-defer` | Toggle current status ⇄ `deferred`, recording the prior status |
| `proj-cleanup` | Refuse unless `ship-ready` or force-override; on success write the receipt, delete the package, strip the board row |

## Work folder lifecycle

1. `ideation` — kickoff writes `IDEA.md`, `README.md`, `STATUS.ideation`.
2. `refining` / `refined` — refinement shapes and approves `DESIGN-BRIEF.md`
   and the durable `PRD/sections/` updates.
3. `active` — map-out writes `GAMEPLAN.md` and the lettered slice docs.
4. `ship-ready` — an implement skill marks the package when every slice is
   `done`.
5. Deleted — cleanup writes the receipt, then removes `PRD/work/<slug>/`.

## Slice status vocabulary

`planned` / `in-progress` / `done` / `blocked`, on a single status line near
the top of the slice doc. If a slice already uses another format, preserve it
and change only the value.

### Handoff note on incomplete stop

When an agent stops a slice before `done` — session end, usage limit, or an
unresolved blocker — append a `### Handoff` block directly under that slice's
status line, replacing any prior one:

    ## Status: in-progress

    ### Handoff
    - Done: <what is verified so far, or "nothing verified yet">
    - Next: <the concrete next action, specific enough to start cold>
    - Stopped because: <usage limit / blocker / session end>

A slice moving to `done` removes its handoff block — the rest of the document is
the durable record once complete.

This is the resumability contract for every implement skill: a fresh agent reads
the slice doc's status line and, if present, its handoff block, and needs
nothing else to resume.

## Related material

- Slice template and ship gates: `requirement-format.md`
- Quality-check checklist: the `proj-quality-check` skill
- Receipt convention and cleanup order: `doc-lifecycle.md`
- Browser and process ownership: `runtime-process-hygiene.md`
- Skill catalog, platform paths, sync command: `AGENT-SKILLS.md`
