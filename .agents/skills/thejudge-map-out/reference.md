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
<!-- Browser-risk slices only (see PRD/instructions/runtime-process-hygiene.md), e.g.:
- [ ] Browser closed, owned server(s) stopped, ports released; captures written to `PRD/work/<slug>/.playwright-mcp/`
-->

## Verification

\`\`\`bash
<command>
\`\`\`

## Files touched

- `<path>`
```

## Criteria file

One file per slice, beside the slice doc, named `slice-<letter>.criteria.json`.
It is emitted **from** the slice doc's `## Acceptance criteria` list, not instead
of it — `PRD/instructions/requirement-format.md` still defines the doc format.

Every criterion starts `false`. The boundary hook denies a write that sets one to
`true` unless it has already observed matching evidence, so node 6's `ok` is
ground truth rather than a self-report.

```json
{
  "slug": "<work-slug>",
  "slice": "A",
  "criteria": [
    {
      "id": "A1",
      "statement": "The script test suite passes",
      "value": false,
      "evidence": { "command": "npm run test:scripts" }
    },
    {
      "id": "A2",
      "statement": "The hook contains no protected-path literal",
      "value": false,
      "evidence": { "paths": ["scripts/graph-boundary-hook.mjs"] }
    },
    {
      "id": "A3",
      "statement": "A human confirmed the deny text reads clearly",
      "value": false,
      "evidence": { "manual": true }
    }
  ]
}
```

| Field | Meaning |
| --- | --- |
| `id` | Stable, unique within the package. Convention: slice letter plus the criterion's 1-based position — `A1`, `A2`. Never renumber; an id in the evidence log outlives an edit to the doc. |
| `statement` | The criterion in plain words, matching the doc's checkbox. |
| `value` | Always `false` at emission. |
| `evidence.command` | A regular-expression source matched against the normalized command text of a `Bash` call. |
| `evidence.paths` | Paths that, when named by any tool call, prove the criterion. |
| `evidence.manual` | `true` for a criterion no command can prove. Nothing else in the block applies — `manual` wins over any pattern beside it. |

`command` and `paths` may both appear; **either** matching is enough. Requiring
both would make most blocks unsatisfiable.

A `manual` criterion is earned by a dated observation line naming its id, written
into `slice-<letter>.evidence.md`:

```text
2026-08-20 A3 — read the deny text aloud; it names the criterion and what is missing.
```

The date is required. Without it the line is a claim that could have been copied
forward from an earlier run rather than an observation someone made on a day.

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
