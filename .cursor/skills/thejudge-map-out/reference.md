# thejudge-map-out reference

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

## Slice status vocabulary

`planned` / `in-progress` / `done` / `blocked`, as a single status line near the top of the slice doc:

```markdown
## Status: in-progress
```

If a slice already uses another status format, preserve the format and change only the value.
