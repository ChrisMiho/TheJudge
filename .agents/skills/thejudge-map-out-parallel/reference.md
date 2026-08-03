# thejudge-map-out-parallel reference

## Slice doc template

```markdown
# Slice A — <name>

## Status: planned

## Goal

<one objective>

## Requirements

1. <requirement>

## Acceptance criteria

- [ ] <check>

## Verification

\`\`\`bash
<command>
\`\`\`

## Files touched

- `<path>`
```

## Ship gates block

Append to the final slice doc:

```markdown
## Ship gates

- [ ] Slice acceptance criteria satisfied and verified
- [ ] Tests updated; `npm run quality:check` green for touched areas
- [ ] Public contract unchanged unless slice scoped a change
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/<slug>/` ready to delete
```

## Wave table format

Record the plan in `GAMEPLAN.md` and mirror it in the README slice table:

```markdown
| Wave | Slices | Depends on |
| ---- | ------ | ---------- |
| 1    | A, B   | —          |
| 2    | C      | A          |
```

## Slice status vocabulary

`planned` / `in-progress` / `done` / `blocked`, as a single status line near the top of the slice doc. Preserve an existing format if a slice already uses one; change only the value.
