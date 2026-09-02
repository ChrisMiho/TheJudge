# TheJudge Sweep — reference

Schemas, templates, and the Workflow script. Read [SKILL.md](SKILL.md) for the
flow; this file is what you fill in and run.

## The cost question

One `AskUserQuestion`, asked only when no profile/levers arrive as args. Frame it
as cost vs. thoroughness; each option maps to a concrete `(model, effort, batch)`
triple. Put the recommended default first.

```
AskUserQuestion({
  questions: [{
    header: "Sweep cost",
    question: "How should the audit fleet trade cost against thoroughness? "
            + "<N> sections, ~<M> items.",
    multiSelect: false,
    options: [
      { label: "Balanced (Recommended)",
        description: "Cheaper/faster workers at low effort, 3 sections per agent "
                   + "→ ~<ceil(N/3)> spins. Synthesis one tier up." },
      { label: "Thorough",
        description: "Stronger workers at high effort, one section per agent "
                   + "→ <N> spins. Highest fidelity, highest spend." },
      { label: "Cheapest",
        description: "Cheapest workers at low effort, <B> sections per agent "
                   + "→ fewest spins. Fastest and cheapest; coarser reads." },
    ],
  }],
})
```

Translate the pick into `workerModel` / `workerEffort` / `batch` / `synthesisModel`
before building the script `args`. Recommended default profile:

| Profile | Worker model | Worker effort | Sections/agent | Synthesis model |
| --- | --- | --- | --- | --- |
| Balanced | `haiku` | `low` | 3 | `sonnet` |
| Thorough | `sonnet` | `high` | 1 | `opus` |
| Cheapest | `haiku` | `low` | 6 | `sonnet` |

These map to `agent()`'s `model` (`haiku` / `sonnet` / `opus` / `fable`) and
`effort` (`low` / `medium` / `high`). Adjust the tiers to what the corpus needs;
mechanical section reads justify the cheaper worker tier, per
the graph driver's cheapest-capable-model-per-node rationale.

## `SWEEP.md` — the on-disk ledger

Written to `PRD/work/sweep-<slug>/SWEEP.md` before launch. Thin; a record of what
ran, not a lifecycle document.

```markdown
# Sweep — <slug>

- Date: <YYYY-MM-DD>
- Corpus: <dir or glob> (<N> sections, ~<M> items)
- Question: <the audit question>
- Verdicts: absorbed / partial / not-absorbed / obsolete
- Scored against: <reference, e.g. 7 specs under PRD/sections/<feature>/README.md>
- Cost plan: worker <model>/<effort>, <batch> sections/agent, <A> agents,
  synthesis <model>
- Workflow runId: <filled after launch>

## Batches
1. <section>, <section>, <section>
2. ...
```

## Finding doc — one per section

Each audit worker writes this to `PRD/work/sweep-<slug>/sections/<section>.md`.
One entry per item; for any verdict that is not a clean pass, name exactly what
is missing.

```markdown
# Sweep finding — <section>

- Corpus file: PRD/sections/decisions/<section>.md
- Scored against: <reference>
- Items: <n>

## <ITEM-ID> — <verdict>
<one line. For partial / not-absorbed / obsolete: name exactly what is missing.>

## <ITEM-ID> — <verdict>
...
```

## `ROLLUP.md` — the synthesis

The synthesis agent writes this to `PRD/work/sweep-<slug>/ROLLUP.md`. Everything
that is **not** a clean pass sorts to the top so the end-review is skimmable.

```markdown
# Sweep rollup — <slug>

<count per verdict: e.g. 120 absorbed · 22 partial · 10 not-absorbed · 6 obsolete>

## Review first — contentious
| Item | Section | Verdict | What's missing |
| --- | --- | --- | --- |
| DEC-### | scanning | partial | <one line> |
... (partial, not-absorbed, obsolete — every non-clean verdict)

## Clean — absorbed
| Item | Section | Verdict | Reason |
| --- | --- | --- | --- |
| DEC-### | scanning | absorbed | <one line> |
...
```

## Worker dispatch prompt shape

Built by the script per batch. Every prompt carries an absolute
`Working directory:` line and absolute paths — a relative path resolves against
wherever the child starts, not this checkout (the graph-driver lesson).

```
Working directory: <absolute repo root>

Audit these corpus sections against the reference and write one finding doc per
section.

Sections (absolute paths):
- <name>: <abs path to section file>
Scored against (absolute paths):
- <abs path to each reference file>

Question: <audit question>
Allowed verdicts: <verdict set>. One line per item. For any verdict that is not
a clean pass, name exactly what is missing.

For each section, write PRD/work/sweep-<slug>/sections/<name>.md using the
finding-doc schema. Edit no corpus or reference file — read only.
Return structured findings: every item's id, verdict, and one-line reason.
```

## Workflow script skeleton

Launch as a single background workflow. `args` is built by the main session from
the resolved cost plan and the scouted batches. `Date` is unavailable in scripts
— pass the timestamp in via `args`.

```javascript
export const meta = {
  name: 'thejudge-sweep',
  description: 'Audit a sectioned corpus against a question; verdict per item, one rollup',
  phases: [
    { title: 'Audit', detail: 'one worker per batch — score sections, write finding docs' },
    { title: 'Synthesize', detail: 'roll every verdict up, contentious first' },
  ],
}

// args: { workDir, slug, question, verdicts[], referenceNote, referencePaths[],
//         repoRoot, batches[{sections:[{name,path}]}],
//         workerModel, workerEffort, synthesisModel }

const FINDINGS = {
  type: 'object',
  properties: {
    sections: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          section: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                verdict: { type: 'string', enum: args.verdicts },
                reason: { type: 'string' },
              },
              required: ['id', 'verdict', 'reason'],
            },
          },
        },
        required: ['section', 'items'],
      },
    },
  },
  required: ['sections'],
}

const ROLLUP = {
  type: 'object',
  properties: {
    counts: { type: 'object' },
    contentious: { type: 'number' },
    wrote: { type: 'string' },
  },
  required: ['counts', 'wrote'],
}

function workerPrompt(batch) {
  const secs = batch.sections.map(s => `- ${s.name}: ${s.path}`).join('\n')
  const refs = args.referencePaths.map(p => `- ${p}`).join('\n')
  return [
    `Working directory: ${args.repoRoot}`,
    ``,
    `Audit these corpus sections against the reference and write one finding doc per section.`,
    ``,
    `Sections (absolute paths):`,
    secs,
    `Scored against (${args.referenceNote}):`,
    refs,
    ``,
    `Question: ${args.question}`,
    `Allowed verdicts: ${args.verdicts.join(' / ')}. One line per item.`,
    `For any verdict that is not a clean pass, name exactly what is missing.`,
    ``,
    `For each section, write ${args.workDir}/sections/<name>.md using this schema:`,
    `  # Sweep finding — <section>`,
    `  - Corpus file / Scored against / Items`,
    `  ## <ITEM-ID> — <verdict>`,
    `  <one line reason>`,
    `Edit no corpus or reference file — read only.`,
    `Return structured findings: every item's id, verdict, and one-line reason.`,
  ].join('\n')
}

phase('Audit')
const audited = await parallel(args.batches.map((batch, i) => () =>
  agent(workerPrompt(batch), {
    label: `audit:${batch.sections.map(s => s.name).join('+')}`,
    phase: 'Audit',
    agentType: 'general-purpose',   // guarantees Write for the finding docs
    model: args.workerModel,
    effort: args.workerEffort,
    schema: FINDINGS,
  })))

// Barrier is correct here: synthesis needs every section's findings at once.
const all = audited.filter(Boolean).flatMap(r => r.sections)

phase('Synthesize')
const rollup = await agent([
  `Working directory: ${args.repoRoot}`,
  ``,
  `Write ${args.workDir}/ROLLUP.md from these audit findings.`,
  `Sort every item whose verdict is NOT a clean pass to the top (the contentious`,
  `ones the end-review reads first), clean passes below. Include a per-verdict count.`,
  `Use the rollup template in the sweep reference. Findings JSON:`,
  JSON.stringify(all),
].join('\n'), {
  label: 'synthesize',
  phase: 'Synthesize',
  agentType: 'general-purpose',
  model: args.synthesisModel,
  schema: ROLLUP,
})

return { sections: all.length, rollup }
```

After the workflow completes, the main session verifies the section docs and
`ROLLUP.md` exist, commits `PRD/work/sweep-<slug>/`, and opens one PR to `main`.
Never push to `main`.
