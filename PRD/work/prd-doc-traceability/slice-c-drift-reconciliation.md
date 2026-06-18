# Slice C — Drift reconciliation (non-destructive, last)

## Status: planned

## Goal

After the catalog is built and validated, reconcile current navigation drift non-destructively: fix the stale `PRD/README.md` work-package table, add a `sections/system-map.md` pointer to the Section Inventory, and add a `planned` catalog entry for `DEC-043`/`REQ-031` (`gameStateNotes`) — with no `Status:` field edits.

## Dependencies

- Slice A complete and validated (catalog exists and earns its place).
- Slice B complete (promotion gate documented; informs how `shipped` is asserted).

## Requirements

1. `DEC-044`: correct the `PRD/README.md` "Active work packages" table — remove/repair the dead link to the already-shipped `supplemental-game-rules-retrieval`, and fix wrong statuses for listed packages.
2. `DEC-044`: add `sections/system-map.md` to the `PRD/README.md` Section Inventory table with an accurate description and status.
3. `DEC-044`: ensure `DEC-043`/`REQ-031` (`gameStateNotes` / `ADDITIONAL GAME STATE`) is represented as `planned` in `sections/system-map.md` (added in Slice A; re-verify here). Do **not** edit `DEC-043`'s `Status: confirmed` field.
4. Non-destructive: no PRD folder teardown, no removal of existing decisions or section content beyond the stale navigation entries being corrected.

## Files touched

- `PRD/README.md`
- `PRD/sections/system-map.md` (verify `planned` entry from Slice A; adjust wording only if needed)

## Changes

### `PRD/README.md` — "Active work packages" table

- Remove the `supplemental-game-rules-retrieval` row (shipped; folder removed per doc-lifecycle) or repoint it accurately if a residual reference must remain.
- Correct statuses for remaining packages to match reality at implementation time.
- Add any active packages that are missing.

### `PRD/README.md` — Section Inventory

Add a row:

```markdown
| `sections/system-map.md` | active | Feature/subsystem catalog: shipped-vs-planned status, behavior summary, and coarse location per subsystem |
```

## Acceptance criteria

- [ ] `PRD/README.md` "Active work packages" table contains no dead links and statuses match reality.
- [ ] `PRD/README.md` Section Inventory lists `sections/system-map.md`.
- [ ] `sections/system-map.md` represents `gameStateNotes`/`ADDITIONAL GAME STATE` as `planned`.
- [ ] `git diff PRD/sections/decisions.md` shows no `Status:` field edits.
- [ ] Diff is limited to `PRD/` documentation; no product code, API, UI, or prompt change.

## Verification

```bash
# Inventory pointer present
rg -n "system-map.md" PRD/README.md

# No dead supplemental-game-rules-retrieval link remains as "active"
rg -n "supplemental-game-rules-retrieval" PRD/README.md

# gameStateNotes still planned, no decisions Status edits
rg -n "gameStateNotes" PRD/sections/system-map.md
git diff --stat PRD/sections/decisions.md   # expect no changes
```

## Ship gates

- [ ] Slice acceptance criteria satisfied and verified (A, B, C)
- [ ] `git diff` scoped to `PRD/` (+ `.cursor`/`.agents`/`.claude` skill sync from Slice B); no `apps/` or `scripts/` product changes
- [ ] No `DEC`/`REQ` `Status:` field edited anywhere
- [ ] Public contract unchanged (documentation/process only)
- [ ] No secrets committed
- [ ] Durable outcomes promoted; `PRD/work/prd-doc-traceability/` ready to delete

## PRD promotion checklist (executed by thejudge-cleanup)

- [ ] `sections/system-map.md` is the durable home of the catalog (already in `sections/`, no further promotion needed).
- [ ] Apply the promotion gate to `DEC-044`'s own catalog meta-entry: flip "PRD doc traceability" from `planned` to `shipped` (code/docs shipped + receipt written).
- [ ] Write cleanup receipt `PRD/instructions/receipts/prd-doc-traceability-<YYYY-MM-DD>.md` with: date, slug, status (`shipped` | `partial` | `corpus-only`), actions-taken checklist, files created/updated/deleted (every path), verification results, notes. Receipt is durable — never deleted with the work folder.
- [ ] Delete `PRD/work/prd-doc-traceability/` entirely.
- [ ] Update `PRD/README.md` only if read-order/navigation guidance changed beyond the Slice C edits.
- [ ] Confirm related-work pointers (`system-map-detail`, `prompt-context-retrieval-tuning`) remain accurate.
