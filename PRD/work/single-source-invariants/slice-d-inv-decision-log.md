# Slice D — INV-DECISION-LOG: fix the two root-README decision-log contradictions

## Status: done

## Goal

The canonical home for the decision-log-is-retired rule already exists and is
correct — `PRD/instructions/doc-lifecycle.md`, "Decision lifecycle (retired)"
— and every other file agrees with it. Only the root `README.md` contradicts
it, in two places: it tells agents to author new `DEC-###` bodies, and it
tells them to *start* reading at the retired log. This slice fixes both lines
so the root README (the onboarding entry point) stops instructing the
opposite of what the rest of the corpus requires.

## Requirements

1. Apply the accepted `INV-DECISION-LOG` diff from
   `PRD/work/single-source-invariants/GATE-QUESTIONS.md` in full:
   - `README.md:17` (onboarding bullets) — repoint "start with the
     `decisions.md` router" to read-first #1 being the current-state feature
     spec, with `decisions.md` demoted to a historical index that only
     resolves a cited `DEC-ID`, citing `doc-lifecycle.md`.
   - `README.md:163` (Documentation Notes) — replace "record new DEC bodies
     ... keep the router index current" with "record it by editing the
     current-state feature spec ... The decision log is retired — do not
     author a new `DEC-###`", citing `doc-lifecycle.md`.
2. Leave `README.md:16,136,137` unchanged — those *resolve* a cited DEC-ID via
   the index, which the retired-log rule explicitly permits.
3. Do not edit `doc-lifecycle.md` — it is already the correct canonical home.
4. Locate each edit by the quoted current text in the proposal's diff, not by
   trusting the line numbers (last verified 2026-09-04) — re-grep first if a
   quoted line has moved.

## Acceptance criteria

- [x] D1 — root `README.md:17` no longer tells a reader to "start with the
      `decisions.md` router"; it names the current-state feature spec as
      read-first #1 and cites `doc-lifecycle.md` for the decision-lifecycle
      rule
- [x] D2 — root `README.md:163` no longer instructs authoring new `DEC-###`
      bodies or keeping a router index current; it instructs editing the
      current-state feature spec and cites `doc-lifecycle.md`
- [x] D3 — re-grep root `README.md` for `decisions.md router|record new DEC|
      start with` and confirm no line still treats the decision log as live
      or read-first; confirm `:16,136,137` (DEC-ID resolution) are unchanged
      (manual check — no test command applies to this docs-only slice)

### Re-grep observation: 2026-09-04 D3 — root README decision-log family

Re-ran the Verification block pattern after D1–D2 landed. Remaining hits are
the fixed `:17` and `:163` lines themselves and the three DEC-ID resolution
lines `:16` (DEC-020), `:136` (DEC-020), `:137` (DEC-029) — all confirmed
unchanged, each merely resolving a cited `DEC-ID` via the index, which the
retired-log rule permits. No line still tells a reader to start at the
decisions.md router or to author a new DEC body. `doc-lifecycle.md` was not
edited by this slice.

## Verification

```bash
grep -niE 'decisions\.md|decision log|start with|record new DEC|DEC-###|DEC bodies' README.md
```

## Files touched

- `README.md` (root)
