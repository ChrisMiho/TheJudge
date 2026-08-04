# workflow-reference.md

## Purpose

This file is the lean operator reference for TheJudge PRD-driven work. All 9
`thejudge-*` skills are model-invocable and may also be called explicitly —
see `AGENT-SKILLS.md` for the full catalog, platform paths, and sync
instructions.

## Handoff prefix rule

Every skill that hands off ends with a **Next step**: one sentence plus the
literal command to run next. The command prefix is `/thejudge-*` in Cursor and
Claude Code, `$thejudge-*` in Codex. Substitute `<slug>`, slice letters, or
wave numbers from the session.

## Work package status vocabulary

Package status lives in three places that skills keep in sync on every
transition:

1. `PRD/work/<slug>/README.md` — `status: <value>` (frontmatter or first-line
   field; preserve the package's existing format and change only the value)
2. Exactly one empty marker file: `PRD/work/<slug>/STATUS.<value>`
3. Board row in `PRD/work/STATUS.md` (skill-maintained; the only package list)

Never encode status by renaming `PRD/work/<slug>/`. Slug folders stay stable
for skills, slices, links, and receipts. Glance with
`ls PRD/work/*/STATUS.*` or open `PRD/work/STATUS.md`.

| Status | Meaning | Typical next skill |
| --- | --- | --- |
| `ideation` | Idea only | `thejudge-refinement` |
| `refining` | DESIGN-BRIEF / product truth actively being reshaped (including post-ship refinement packages mid-pass) | keep refining, or QC when brief is approved |
| `refined` | Brief approved; ready for QC / map-out | `thejudge-quality-check` → map-out |
| `active` | GAMEPLAN + slices exist; implementing | `thejudge-implement*` |
| `ship-ready` | All implementation slices done; promote + receipt + delete | `thejudge-cleanup` |
| `owner-action` | Blocked on a human outside the agent loop | human checklist |
| `deferred` | Parked; not next work | none |

Happy path: `ideation` → `refining` → `refined` → `active` → `ship-ready` →
deleted (cleanup writes the durable receipt, then removes the work folder).

### Marker file rules

- Allowed names: `STATUS.ideation`, `STATUS.refining`, `STATUS.refined`,
  `STATUS.active`, `STATUS.ship-ready`, `STATUS.owner-action`,
  `STATUS.deferred`.
- Exactly one marker per package; replace/rename on every status change (never
  leave two).
- Marker files are empty (zero bytes is fine).
- On cleanup success: delete the package folder (marker goes with it) and
  remove the slug from `PRD/work/STATUS.md`.

### Skill status duties

| Skill | Status duty |
| --- | --- |
| `thejudge-kickoff` | Create package + `STATUS.ideation` + board row |
| `thejudge-refinement` | Start/resume → `STATUS.refining`; on explicit user approval of brief → `STATUS.refined` |
| `thejudge-quality-check` | PASS: leave `refined`. FAIL: → `STATUS.refining` |
| `thejudge-map-out` / `map-out-parallel` | → `STATUS.active` |
| `thejudge-implement` / `implement-all` / `implement-parallel` | Stay `active` until the last remaining slice is `done`, then → `STATUS.ship-ready` |
| `thejudge-cleanup` | Gate: refuse unless `ship-ready` (or user force-override). On success: receipt, remove package, strip board row |

## Work Folder Lifecycle

1. `ideation` — kickoff may capture `IDEA.md`, `README.md`, `STATUS.ideation`.
2. `refining` / `refined` — refinement reshapes and approves `DESIGN-BRIEF.md` and PRD updates.
3. `active` — map-out writes `GAMEPLAN.md` and lettered slice docs.
4. `ship-ready` — implement skills mark the package when every slice is `done`.
5. Deleted — cleanup writes the durable receipt, then removes `PRD/work/<slug>/`.

## Slice status vocabulary

`planned` / `in-progress` / `done` / `blocked`, as a single status line near
the top of the slice doc. If a slice already uses another format, preserve it
and change only the value.

## Related material

- Slice doc template and Ship gates block: `thejudge-map-out/reference.md` and
  `thejudge-map-out-parallel/reference.md`
- Quality-check checklist: `thejudge-quality-check/SKILL.md`
- Cleanup receipt convention and terminology table: `thejudge-cleanup/SKILL.md`
- Platform paths, sync command, and the full skill catalog: `AGENT-SKILLS.md`
