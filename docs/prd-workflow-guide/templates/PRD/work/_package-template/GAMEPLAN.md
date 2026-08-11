# GAMEPLAN: <slug>

Authoritative design: `DESIGN-BRIEF.md`. Durable truth: DEC-###, REQ-###.

Architecture and sequencing only. Product definition belongs in the brief; if
you find yourself deciding product behavior here, go back a phase.

## Architecture

### 1. <Shared seam to build first>

<What it is, what consumes it, why it is shared rather than duplicated.>

### 2. <Bounded change that consumes the seam>

<What changes, and where.>

## What must not change

- <Contract, behavior, or file that stays fixed through this work.>

<!-- Agents respect an explicit invariant list far better than an inferred one.
     This section is where a refactor is stopped from quietly changing a wire
     format. -->

## Slice dependency graph

    A shared foundation ──> B feature one ──┐
                        ──> C feature two ──┤
    D independent fix ──────────────────────┴─> E integration + ship gates

Slices default to parallel-ready. Each sequential edge above must be justified
by a named prerequisite and a one-line reason in the dependent slice doc.

## Verification contract

- Per-slice command: `<quality-command>` scoped to touched areas
- Browser-risk slices: <which ones, which viewports, where captures are written>
- Repository-wide gate before ship-ready: `<quality-command>`

## Verification checklist

- [ ] Every slice's acceptance criteria verified by its named command
- [ ] Browser-risk slices record runtime cleanup evidence
- [ ] `<quality-command>` green repository-wide
- [ ] Durable outcomes promoted and the work folder ready to delete

## External coordination

<Cross-package overlaps, shared files, or ordering constraints against other
active packages. Write "none" if there are none — the empty answer is useful.>
