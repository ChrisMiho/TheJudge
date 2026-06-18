---
name: system-map-detail
description: Deep per-subsystem behavior prose that the shallow sections/system-map.md catalog links to — explaining how major subsystems actually work, in one read, without re-deriving from code
metadata:
  type: project
---

# Idea: system-map-detail

## Problem

`prd-doc-traceability` (`DEC-044`) introduces a shallow catalog at `sections/system-map.md` — status, one-line summary, file location, backing IDs per subsystem/feature. That answers "is it real / where does it live," but not "how does it actually work" beyond one line. The deep behavior explanation (mechanics, data flow, the worked examples) was deliberately deferred because the highest-value subsystems to document — prompt assembly and the System 2 / System 3 retrieval mechanics — are exactly what `prompt-context-retrieval-tuning` is about to rewrite. Writing deep prose now would be writing it twice.

## Desired Outcome

- For each major subsystem, a concise behavior writeup (mechanics + data flow + where it lives) that the `sections/system-map.md` catalog links to, so an agent or human can understand the subsystem in one read without re-deriving it from code.
- Priority coverage: prompt assembly, System 2 (curated baseline), System 3 (supplemental retrieval), card rulings (System 1).
- Whether per-subsystem detail lives as sections within `system-map.md` or as separate per-subsystem files is decided here, once content volume is known.

## Non-Goals

- No per-decision → code-line link maintenance (inherits the `prd-doc-traceability` non-goal).
- Not a replacement for the shallow catalog; this is the depth layer beneath it.
- No product/API/UI/prompt behavior change.

## Dependencies / sequencing

- **Do after `prompt-context-retrieval-tuning` lands.** That package rewrites prompt assembly + System 2 / System 3; writing their behavior prose before then guarantees rework.
- Depends on the shallow catalog (`sections/system-map.md`) existing first, per `DEC-044`.

## Open questions

- Per-subsystem files vs. expanded sections inside `system-map.md` (decide based on content size once the catalog exists).
- How deep each writeup goes before it becomes maintenance-heavy.
