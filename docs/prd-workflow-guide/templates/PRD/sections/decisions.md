# decisions.md

## Purpose

Read-first router for confirmed decisions. A confirmed decision overrides older
conflicting language anywhere else in this corpus.

This file holds **no decision bodies** — only the index. Bodies live in
`decisions/<domain>.md`.

## How to resolve a decision

1. Find the `DEC-###` in the index table below.
2. Open the named domain file.
3. Read the `### DEC-###` entry there.

## Lifecycle rules

- IDs are assigned sequentially and are never reused or renumbered.
- Adding a decision requires **two** edits: the body in the domain file, and one
  index row here. Never do one without the other.
- A superseded decision keeps its ID. Trim its body in the domain file to a
  one-line tombstone (`Superseded by DEC-###`) and update its index summary to
  match, so old references stay resolvable.
- `Status: confirmed | superseded` is decision lifecycle only. Whether code
  exists is tracked in `system-map.md`, never here.

## Domain files

| Domain file | Covers |
|---|---|
| `decisions/framing.md` | What the product is and is not |
| `decisions/<domain>.md` | <one line per domain> |

<!-- Create a domain file when a topic reaches roughly ten decisions, or
     immediately when it is clearly its own subsystem. Splitting later is
     cheap; the router row is what makes it painless. -->

## Index

| DEC-ID | Domain file | Decision |
|---|---|---|
| DEC-001 | `decisions/framing.md` | <one-sentence summary of the decision> |
