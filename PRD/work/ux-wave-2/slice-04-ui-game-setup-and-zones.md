# Slice 04 — UI game setup and zone confirmation

status: pending

**Prerequisites:** [slice-03-flow-foundation.md](./slice-03-flow-foundation.md)  
**Next slice:** [slice-05-ui-zone-collection.md](./slice-05-ui-zone-collection.md)

## Goal

Replace/extend current **game-context** step with turn phase + active player; add **zone confirmation** step with phase-driven defaults.

## Scope

### Game setup screen

- Keep: player count, life totals
- Add: **active player** select (recommended)
- Add: **turn phase** picker per [decisions-summary.md](./decisions-summary.md)
  - Combined Combat option with hint: “Specify combat sub-step in your question if it matters.”
- **Continue** when player/life/phase valid
- **Back** N/A on first step

### Zone confirmation screen

- Checklist of v1 zone IDs
- Pre-check from `phaseZoneDefaults` when entering step
- User toggles zones on/off
- **Continue** with ≥1 zone selected (or allow zero zones if product wants pure timing questions — **default: allow continuing with any selection including empty checklist**; confirm in PRD: recommend at least one zone checked for UX clarity but not required)
- **Back** to game setup without data loss

### Phase change behavior

- User **Back** to game setup, changes phase, **Continue** again → **additive** zone merge (slice-03 function)

## Tasks

- [ ] `GameSetupStep` component (or extend existing game-context JSX)
- [ ] `ZoneConfirmStep` component
- [ ] Wire into `ContextFlowShell` / `App.tsx`
- [ ] Frontend tests: phase selection sets defaults; back/continue preserves life totals

## Validation gate

```bash
npm --workspace apps/frontend run test
npm run dev
```

Manual:

- [ ] Pick Draw → hand, library, battlefield pre-checked (per matrix)
- [ ] Uncheck hand, continue, back, change to Combat → stack added, hand stays unchecked
- [ ] Life totals unchanged after back

## Done when

- Steps 1–2 of new flow usable in browser
- Steps 3–6 may still be old flow or placeholders

## Out of scope

- Adding cards to zones (slice 05)
- Enrichment (slice 06)
- Submit to backend with new payload (slice 06)
