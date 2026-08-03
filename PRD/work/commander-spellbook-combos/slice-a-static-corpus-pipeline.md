# Slice A — Static Commander Spellbook corpus pipeline

## Status: planned

## Dependencies

None. This is the first sequential slice.

## Goal

Create the human-approved, fail-safe offline refresh/build pipeline and commit the deterministic Commander Spellbook detail/index artifact pair required by REQ-093.

## Requirements

1. Add `scripts/refresh-commander-spellbook-data.mjs` with exported, mockable helpers and a CLI that refuses network access unless `--confirm-network` is present. Use a Commander Spellbook-identifying `User-Agent`, sequential pagination through upstream `next` URLs, repeated-URL protection, descriptive non-2xx errors, and injected `fetch`/delay seams for tests.
2. Refresh public `/variants/` and `/templates/` pages into a temporary raw snapshot. For each referenced template:
   - follow its authoritative `scryfallApi` URL through all Scryfall pages when present;
   - otherwise query Commander Spellbook's public replacement filter (`/cards/?replaces=<templateId>`) and preserve returned oracle identities as an explicit mapping;
   - record an empty expansion input only after the authoritative paths above complete successfully; the build will classify it as unresolved.
3. Write a raw `manifest.json` containing `fetchedAt`, source API/docs/repository/license/attribution references, page counts, record counts, and the list of captured template-expansion files. Promote the temporary raw directory to `apps/backend/data/commander-spellbook/` only after the entire snapshot validates; a partial refresh preserves the previous raw directory.
4. Add `scripts/build-commander-spellbook-combos.mjs` with pure exported normalization/transform functions. Accept only `OK` / `EXAMPLE` variants; map upstream `oracleId` to `cardId`; trim unrelated payload fields; preserve quantities, canonical starting zones, zone-state prose, `mustBeCommander`, template ingredients, produced effects, description/steps, mana needed, easy/notable prerequisites, notes, popularity, stable variant id/reference, attribution, and source/license metadata.
5. Normalize authoritative template expansions to sorted unique oracle ids. Mark templates without a non-empty query or explicit replacement result unresolved. Do not parse Scryfall query syntax and do not introduce a hand-authored replacement map.
6. Emit the `schemaVersion: 1` artifact contracts defined in `GAMEPLAN.md`. `variantIdsByOracleId` includes membership through exact cards and resolved template expansions. Sort variants, ingredients, index keys, variant-id lists, template ids, and oracle ids deterministically.
7. Derive the pair's `snapshotId` from normalized raw inputs. Stage and validate both JSON files before replacement; preserve/restore the previous valid pair if transform, validation, temp write, or either promotion fails. With no raw snapshot, validate and preserve an existing pair; if neither raw data nor a valid pair exists, fail with a descriptive local action message.
8. Add root scripts:
   - `data:refresh:commander-spellbook` → the dedicated refresh CLI;
   - append the local combo build to `data:build` without adding the network refresh to routine `data:refresh`.
9. Gitignore `apps/backend/data/commander-spellbook/` and any output temp/backup files. Commit only `commanderSpellbookCombos.json` and `commanderSpellbookComboIndex.json`.
10. Add `apps/frontend/src/lib/commanderSpellbookDataPolicy.test.ts`, following existing root-script policy tests, and extend `apps/frontend/src/types/build-card-metadata.d.ts` with the exact exported `.mjs` helper signatures the tests import. Use outer suite `Frontend - Shared`.
11. Live retrieval is an explicit owner gate: the implementation agent must request approval before running `npm run data:refresh:commander-spellbook -- --confirm-network`. Tests use mocked fetch only and never contact Commander Spellbook or Scryfall.

## Acceptance criteria

- [ ] `npm --workspace apps/frontend run test -- src/lib/commanderSpellbookDataPolicy.test.ts` proves the confirmation guard, paginated `next` traversal, loop/non-2xx failure, complete-snapshot promotion, and preservation of the prior raw snapshot on failure.
- [ ] The same targeted test proves `OK` / `EXAMPLE` filtering, `oracleId` identity, zone-code normalization, query and explicit template expansion, unresolved-template preservation, source metadata, stable sorting/serialization, matching snapshot IDs, and old-pair rollback/preservation.
- [ ] Running `npm run data:build` with no raw directory preserves an existing valid artifact pair byte-for-byte; the policy test covers the no-raw/no-prior descriptive failure branch.
- [ ] After explicit user approval, `npm run data:refresh:commander-spellbook -- --confirm-network` completes without partial pages, and `npm run data:build` writes non-empty committed artifacts whose `schemaVersion` and `snapshotId` match.
- [ ] An explicit post-build inspection confirms every committed variant status is `OK` or `EXAMPLE`, `variantIdsByOracleId` and template expansions are sorted, unresolved template ids are retained, and both artifacts contain Commander Spellbook attribution plus stable source references.
- [ ] `git check-ignore apps/backend/data/commander-spellbook/manifest.json` succeeds, while `git check-ignore apps/backend/data/commanderSpellbookCombos.json` and the index path both report that the committed artifacts are not ignored.
- [ ] `npm run format:check` passes for the two committed JSON artifacts and all pre-existing formatted files.

## Verification

```bash
npm --workspace apps/frontend run test -- src/lib/commanderSpellbookDataPolicy.test.ts
npm run data:build
node -e "const d=require('./apps/backend/data/commanderSpellbookCombos.json');const i=require('./apps/backend/data/commanderSpellbookComboIndex.json');if(d.schemaVersion!==1||i.schemaVersion!==1||d.snapshotId!==i.snapshotId||!d.variants.length)process.exit(1);console.log({snapshotId:d.snapshotId,variants:d.variants.length,oracleKeys:Object.keys(i.variantIdsByOracleId).length,templates:Object.keys(i.templateExpansions).length,unresolved:i.unresolvedTemplateIds.length});"
git check-ignore apps/backend/data/commander-spellbook/manifest.json
npm run format:check
```

Run this network command only after explicit user approval in the implementation session:

```bash
npm run data:refresh:commander-spellbook -- --confirm-network
```

## Files touched

- `scripts/refresh-commander-spellbook-data.mjs` (new)
- `scripts/build-commander-spellbook-combos.mjs` (new)
- `apps/backend/data/commanderSpellbookCombos.json` (new committed artifact)
- `apps/backend/data/commanderSpellbookComboIndex.json` (new committed artifact)
- `apps/frontend/src/lib/commanderSpellbookDataPolicy.test.ts` (new)
- `apps/frontend/src/types/build-card-metadata.d.ts`
- `package.json`
- `.gitignore`
