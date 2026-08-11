# system-map/<subsystem>.md

Deep behavioral detail for one subsystem. Create one of these **only** for the
two or three subsystems complex enough that the catalog row cannot carry them.
Most subsystems need only the row.

Rename this file to `<subsystem>.md` and link it from the catalog entry's
`Details:` field.

## Backed by

DEC-###, REQ-###, NFR-###

## How it works

<Prose. The mechanism, in the order a reader needs it.>

## Data flow

<Step-by-step trace from input to output, naming the modules involved.>

## Where it lives

- `<path>` — <responsibility>

## Worked example

<One concrete end-to-end case with real values. This is the most useful part of
the document and the one most often skipped.>

## Invariants and gotchas

- <Something that must stay true, and what breaks if it does not.>
- <The mistake someone will make when modifying this.>
