# Slice 03 — Phase → zone defaults review

## Status: checkpoint (defaults unchanged)

Do not change `PHASE_ZONE_DEFAULTS` without user sign-off. Current values in `apps/frontend/src/lib/contextFlow/phaseZoneDefaults.ts`:

| Phase | Auto-checked zones |
|---|---|
| Untap | battlefield, command |
| Upkeep | battlefield, stack, command |
| Draw | battlefield, library, hand |
| Main 1 / Main 2 | battlefield, hand, stack, graveyard |
| Combat | battlefield, stack, hand |
| End step | battlefield, hand, graveyard, stack |
| Cleanup | battlefield, graveyard |
| Stack resolving | stack, battlefield |

## Notes

Implementation shipped without editing defaults. Update this table and `phaseZoneDefaults.ts` only after user confirms changes.
