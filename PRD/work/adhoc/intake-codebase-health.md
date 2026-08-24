# Intake — codebase health audit

Context for one work package. This is evidence, not authority: every product
decision it raises is still made with the owner at the `define` gate.

## The request, in the owner's words

Find where the same functionality exists in two places to fill the same need,
so the project can genuinely reuse components instead of re-implementing them.
The goal is reduced complexity, not a style report.

## What this is not

- **Not a lint or style pass.** Naming, formatting, and idiom preferences are
  out of scope.
- **Not a refactor.** This run reads code and writes one document. It changes no
  product code. Consolidation work, if any, is decided by the owner afterward
  and packaged separately.
- **Not a bug hunt.** Correctness defects are a different job; note them only if
  they fall out of the duplication analysis for free.

## What "the same need served twice" means

Two or more implementations that exist to do the same job, where one shared
implementation would serve both. Examples of the shape:

- The same literal class string, constant, or config repeated across components
- Two helpers computing the same derived value by different routes
- Parallel implementations of one interaction (open, close, dismiss, retry)
- A utility re-implemented locally because the shared one was not found

## Precedent — this is not hypothetical

`DEC-159` records the same hardcoded close-button class string duplicated
**verbatim in four places**, plus two separate text `Close` buttons doing the
same job. It was found by chance during a UI review, not by any systematic
check. That is the failure mode this audit exists to close.

## Distinguish intentional sharing from accidental duplication

Some sharing is deliberate and correct — it should be reported as healthy, not
flagged. `DEC-157` records, from measured import-graph membership, that
`src/hooks/useScanCapture.ts` is imported by three destinations and
`src/components/ScanCameraSurface.tsx` by two. That is reuse working as
intended.

The finding this audit wants is the opposite: code that *should* be one thing
and is currently several.

## Scope

`apps/frontend`, `apps/backend`, and `scripts`. Exclude `node_modules`, `dist`,
build artifacts, and committed data corpora.

## Output

One document. For each finding:

- what the duplicated need is, in one plain sentence
- every location that serves it, with file paths
- whether it looks intentional or accidental
- a suggested consolidation, and roughly what it would touch
- a rough size: small, medium, or large

Rank by how much complexity consolidation would remove, not by count of
duplicated lines.

## Why this package runs first

Two reasons beyond its own value.

1. **It is the owner's first real graph run on this project.** Read-only scope
   means a guardrail problem cannot damage anything, while still exercising
   preflight, the gate, the PR, and the ledger end to end.
2. **Its findings shape the documentation refactor that follows.** Knowing what
   is genuinely shared versus accidentally duplicated determines whether a
   behavior belongs in one feature's spec, the shared-chrome bucket, or the
   machinery layer. Running it afterward would surface those mistakes too late.

Full downstream plan, for context only and not in this package's scope:
`PRD/work/adhoc/refactor-gameplan.md`.
