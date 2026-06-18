# Slice A — Build and validate the system-map catalog

## Status: planned

## Goal

Create the durable feature/subsystem catalog `PRD/sections/system-map.md`, populated for all current shipped subsystems/features, and validate that it answers "is it real / how / where" from the catalog text alone — before any instruction change or navigation reconciliation.

## Dependencies

- None (foundation slice).

## Requirements

1. `DEC-044`: new durable artifact `sections/system-map.md`; two levels (subsystems via `##`, features via `###`); each entry records `Status` (`shipped`/`planned`/`partial`), a one-line `Summary`, a coarse `Lives in` location, and `Backed by` `DEC`/`REQ` IDs.
2. Populate every currently-shipped subsystem from the GAMEPLAN "Subsystem source-of-truth" table; mark each `shipped`.
3. Represent `gameStateNotes` / `ADDITIONAL GAME STATE` (`DEC-043`/`REQ-031`) as a `planned` feature under "Prompt assembly" (confirmed docs-only; no code under `apps/`).
4. Include a meta-entry "PRD doc traceability" subsystem with the `system-map.md` catalog feature marked `planned` (`DEC-044`); cleanup flips it to `shipped` (the promotion gate applied to itself).
5. `Lives in` values are coarse (directory or 1–3 key files), never per-line — no per-decision → code-line links.
6. Do **not** edit any `DEC`/`REQ` `Status:` field. The shipped-vs-planned signal lives in the catalog only.
7. Add a short header to `system-map.md` stating its purpose, the meaning of `shipped`/`planned`/`partial`, and that it does not override `DEC`/`REQ` `Status:` lifecycle semantics.

## Files touched

- `PRD/sections/system-map.md` (new)

## Validation question set

After populating the catalog, confirm each question is answerable from `system-map.md` alone (no code reading):

1. Is `gameStateNotes` / `ADDITIONAL GAME STATE` shipped? → must read `planned`.
2. Where does prompt assembly live and what does it do? → coarse path + one-line summary.
3. Which subsystems implement rule retrieval and where? → card rulings / curated rules / supplemental, with paths.
4. Is the follow-up chat feature real, and where is its frozen-context logic? → `shipped`, orchestration hook path.
5. Where is the mock-vs-OpenAI provider selection? → provider boundary entry path.
6. Is the catalog/doc-traceability feature itself shipped yet? → `planned` until cleanup.

## Acceptance criteria

- [ ] `PRD/sections/system-map.md` exists and parses as valid Markdown with a purpose/legend header.
- [ ] Structure is two-level: subsystems as `##`, features as `###` grouped beneath them.
- [ ] Every entry contains all four fields: `Status`, `Summary`, `Lives in`, `Backed by`.
- [ ] All shipped subsystems from the GAMEPLAN table are present and marked `shipped` with coarse locations.
- [ ] `gameStateNotes`/`ADDITIONAL GAME STATE` is present and marked `planned` under Prompt assembly.
- [ ] A "PRD doc traceability" meta-entry exists, marked `planned` (`DEC-044`).
- [ ] `git diff PRD/sections/decisions.md` shows **no** changes (no `Status:` field edits anywhere).
- [ ] Each of the six validation questions is answerable from the catalog text alone.

## Verification

```bash
# 1. File exists and has the two-level structure
sed -n '1,80p' PRD/sections/system-map.md

# 2. No DEC/REQ Status field was touched
git diff --stat PRD/sections/decisions.md   # expect: no output / no changes

# 3. Confirm gameStateNotes is represented as planned, not shipped
rg -n "gameStateNotes|ADDITIONAL GAME STATE" PRD/sections/system-map.md
```

Manual: walk the six validation questions and confirm each answer is present in `system-map.md`.
