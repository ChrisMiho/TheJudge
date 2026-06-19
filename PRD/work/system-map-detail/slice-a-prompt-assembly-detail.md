# Slice A — prompt-assembly detail file

## Status: planned

## Goal

Write `PRD/sections/system-map/prompt-assembly.md` — a one-read behavior writeup of how
the backend assembles the LLM prompt end to end — and link it from the catalog's
`## Prompt assembly` subsystem with an additive `Details:` pointer (`DEC-048`).

Documentation only. No `apps/` code, no prompt-assembly behavior change.

## Requirements

1. Create `PRD/sections/system-map/prompt-assembly.md` using the fixed `DEC-048`
   template, with these headings in order:
   - `# Prompt assembly`
   - `Backed by:` line citing `DEC-025`, `DEC-036`, `DEC-042`, `DEC-043`, `DEC-033`
     (and `DEC-021` as the originating context).
   - `## How it works`
   - `## Data flow`
   - `## Where it lives`
   - `## Worked example`
   - `## Invariants / gotchas`
2. `## How it works` / `## Data flow` must capture the assembled section order:
   `GENERAL GAME CONTEXT` → `ADDITIONAL GAME STATE` (planned, `DEC-043`) →
   `PHASE GUIDANCE` (`DEC-036`) → zone sections with full card metadata in all zones
   (`DEC-042`) → `GAME RULES (reference)` / System 2 → `ADDITIONAL RELEVANT RULE
   EXCERPTS` / System 3 → `OFFICIAL RULINGS` / System 1 → `SCOPE` → `QUESTION`.
3. Note the static `MTG_PROMPT_REFERENCE` framing and merged zone scope sentence
   (`DEC-025`); the budget = `EFFECTIVELY_UNLIMITED_CHARS` (1,000,000) with diagnostics
   preserved (`DEC-042`); the enrichment-debug sidecar is mock-only (`DEC-033`).
4. `## Where it lives` lists only coarse modules under `apps/backend/src/prompt/`
   (`preparation.ts`, `context.ts`, `normalization.ts`, `mtgReference.ts`,
   `phaseGuidance.ts`, `enrichmentDebug.ts`) — never per-line citations.
5. For the System 1/2/3 sections, summarize their role in the prompt and cross-link to
   `game-rules-retrieval.md`; do not duplicate that file's retrieval mechanics.
6. Add exactly one `Details:` field under the catalog's `## Prompt assembly` entry in
   `PRD/sections/system-map.md`, pointing to `system-map/prompt-assembly.md`. Do not
   change any other catalog field or the "How to read this" section.
7. Behavior-level prose only — no prose that merely restates code, no per-decision →
   code-line link maintenance.

## Acceptance criteria

- [ ] `PRD/sections/system-map/prompt-assembly.md` exists with all six template
      headings plus the `Backed by:` line.
- [ ] The assembled section order above appears in the file in the correct sequence.
- [ ] `## Where it lives` cites only the `apps/backend/src/prompt/` coarse modules.
- [ ] `## Prompt assembly` in `system-map.md` carries one `Details:` pointer; no other
      catalog change.
- [ ] `git diff --name-only` shows only `PRD/` files.

## Verification

```bash
cd /Users/chrismiho/Coding/Projects/TheJudge
F=PRD/sections/system-map/prompt-assembly.md
test -f "$F" && echo "file present"
for h in "# Prompt assembly" "Backed by:" "## How it works" "## Data flow" \
  "## Where it lives" "## Worked example" "## Invariants / gotchas"; do
  grep -qF "$h" "$F" && echo "OK: $h" || echo "MISSING: $h"
done
# Catalog pointer present under Prompt assembly
grep -n "Details:.*system-map/prompt-assembly.md" PRD/sections/system-map.md
# No app code touched
git diff --name-only | grep -v '^PRD/' && echo "NON-PRD CHANGES (fail)" || echo "PRD-only OK"
```

Manual: read the file once top-to-bottom — it should explain prompt assembly without
needing the source open, and not contradict `system-map.md` or the catalog entry.

## Files touched

- `PRD/sections/system-map/prompt-assembly.md` (new)
- `PRD/sections/system-map.md` (one `Details:` line under `## Prompt assembly`)
