# MVP1 Story Archive Cleanup Checklist

## Objective
Move all confirmed MVP1 story files out of `PRD/stories/` into `PRD/archive/mvp1/` and update all project docs so links and wording remain consistent.

## Confirmed Scope
- Move all MVP1 stories: `STORY-001` through `STORY-054`, including `STORY-035-040-agent-assignment-and-merge-order.md`.
- Keep MVP2+ active stories (`STORY-055` and above) in `PRD/stories/`.
- Check all project markdown docs for story-path consistency (not only README files).
- Keep this migration documentation-first and auditable.

## Important Finding: `DEFINITION-OF-DONE.md`
Current file `PRD/stories/DEFINITION-OF-DONE.md` is MVP1-specific (references only `STORY-001` to `STORY-003` and early no-Bedrock constraints), so it is not MVP-agnostic in its current form.

Recommended handling:
- Move current file into the MVP1 archive alongside migrated stories.
- Create a new MVP-agnostic `PRD/stories/DEFINITION-OF-DONE.md` for active and future story slices.

## Target Structure
- `PRD/archive/mvp1/stories/` (new folder)
  - all moved MVP1 story files (`STORY-001` ... `STORY-054`)
  - moved MVP1 Definition of Done snapshot (current file content)
- `PRD/stories/`
  - active MVP2+ stories only (`STORY-055+`)
  - new MVP-agnostic `DEFINITION-OF-DONE.md`

## Execution Checklist

### 1) Pre-Migration Inventory
- [ ] Capture a list of all files currently in `PRD/stories/`.
- [ ] Build explicit move list for `STORY-001` ... `STORY-054`.
- [ ] Confirm no non-MVP1 story is accidentally included.

### 2) Create Archive Stories Folder
- [ ] Create `PRD/archive/mvp1/stories/`.
- [ ] Keep naming unchanged to preserve traceability (`STORY-###-...`).

### 3) Move Files
- [ ] Move `PRD/stories/STORY-001-...md` through `PRD/stories/STORY-054-...md` into `PRD/archive/mvp1/stories/`.
- [ ] Move current `PRD/stories/DEFINITION-OF-DONE.md` into `PRD/archive/mvp1/stories/DEFINITION-OF-DONE.md`.
- [ ] Leave `PRD/stories/STORY-055+` untouched.

### 4) Recreate Active MVP-Agnostic DoD
- [ ] Add a new `PRD/stories/DEFINITION-OF-DONE.md` that is phase-agnostic (quality gates, tests, acceptance evidence, dependencies, docs tracking).
- [ ] Remove MVP1-only wording from the active DoD.
- [ ] Keep MVP1-specific completion criteria only in archive.

### 5) Update Links and Wording in Project Docs
Update every known non-story markdown file that currently points to old MVP1 story paths.

- [ ] `PRD/archive/mvp1/reference-links.md`
  - Change story directory reference from `PRD/stories/` to `PRD/archive/mvp1/stories/`.
  - Change DoD reference to `PRD/archive/mvp1/stories/DEFINITION-OF-DONE.md`.
  - Change merge/sequencing reference to `PRD/archive/mvp1/stories/STORY-035-040-agent-assignment-and-merge-order.md`.
- [ ] `PRD/analysis/MVP2-bedrock-integration-roadmap.md`
  - Replace historical `PRD/stories/` references with split wording:
    - active stories in `PRD/stories/` (`STORY-055+`)
    - MVP1 history in `PRD/archive/mvp1/stories/`
- [ ] `PRD/analysis/project-feature-audit-and-search-autocomplete-refinement.md`
  - Update relative link from `../stories/STORY-028-...` to `../archive/mvp1/stories/STORY-028-...`.
- [ ] `PRD/instructions/story-generation.md`
  - Update historical tracker wording so MVP1 completion points to `PRD/archive/mvp1/stories/` (not `PRD/stories/`).
- [ ] `PRD/instructions/requirement-format.md`
  - Adjust `PRD/stories/` language so it clearly describes active story template usage (MVP2+), while MVP1 references point to archive paths.
- [ ] `README.md` (repo root)
  - Keep high-level references consistent with archive routing (ensure no stale implication that MVP1 stories are still in active `stories/` path).

### 6) Consistency Sweep (All Markdown Docs)
- [ ] Run a full markdown search for stale links:
  - `PRD/stories/STORY-0`
  - `../stories/STORY-0`
  - `PRD/stories/DEFINITION-OF-DONE.md` (when used for MVP1 context)
- [ ] Replace only MVP1 references with archive paths.
- [ ] Preserve MVP2+ references to active `PRD/stories/STORY-055+`.

### 7) Validation
- [ ] Verify every updated markdown link resolves to an existing file.
- [ ] Verify no moved file is still referenced at its old location.
- [ ] Verify `PRD/README.md` still correctly communicates:
  - active execution in MVP2 roadmap
  - MVP1 as historical archive.

### 8) Optional Safety Step
- [ ] Add a short note in `PRD/archive/mvp1/README.md` explicitly stating: detailed MVP1 story history now lives in `PRD/archive/mvp1/stories/`.

## Known File Set Requiring Review (Current Scan)
- `PRD/archive/mvp1/reference-links.md`
- `PRD/analysis/MVP2-bedrock-integration-roadmap.md`
- `PRD/analysis/project-feature-audit-and-search-autocomplete-refinement.md`
- `PRD/instructions/story-generation.md`
- `PRD/instructions/requirement-format.md`
- `README.md`

## Suggested Execution Order
1. Move files and DoD snapshot.
2. Create new MVP-agnostic active DoD.
3. Update links in archive docs.
4. Update links in instruction and analysis docs.
5. Run consistency sweep and link validation.

