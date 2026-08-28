# Slice A — manual evidence log

2026-08-27 A4 — Read "The staged flow, end to end" and each of Steps 1-4 in
`PRD/sections/in-depth/README.md` against the full text of their cited
sources, read directly:

- The staged flow, end to end: DEC-094/FLOW-010 (feature-portal destination,
  registry id `in-depth`), FLOW-001 (four-step wizard: game context -> zone
  confirmation -> zone collection -> enrichment, submit opens the answered
  workspace), DEC-067/REQ-045 (eyebrow label / brand block header shape,
  superseded placement noted), DEC-122 (step-name placement now owned by
  shared chrome, confirmed via requirement 8's independent re-check), REQ-020
  (Back/Continue preservation, zone-checklist additive-only on phase change).
  Every clause traces; no invented capability, no dropped behavior.
- Step 1 - Game context: REQ-015/DEC-023/DEC-027 (player labels, display
  names, life, turn phase, `PlayerLabel` wire identity), DEC-022/DEC-034/
  DEC-037 (turn-phase enum -- DEC-022 is the superseded originating decision,
  DEC-034 is the confirmed amendment removing `stack_resolving`; the spec's
  body correctly states the current post-DEC-034 enum, so citing both
  together is consistent with this corpus's lineage-citation convention, not
  a gap), DEC-120/REQ-100 (synchronized secondary-details disclosure,
  collapsed-by-default, resets on destination round trip), DEC-102/REQ-015
  (additive optional counter fields), DEC-043/REQ-031 (`gameStateNotes`
  freeform field, capped, control-character-guarded, omitted when blank --
  REQ-031 resolves in functional-requirements.md as the global game-state
  notes requirement), DEC-091/REQ-069 (44x44px ergonomic controls, minus-left/
  plus-right order), DEC-092/REQ-070 (helper copy verbatim match). Every
  clause traces; no invented capability, no dropped behavior.
- Step 2 - Zone confirmation: REQ-016/DEC-024/DEC-035 (zone checklist seeded
  by phase defaults, 2 zones/phase, at least one zone required), DEC-092/
  REQ-070 (helper copy verbatim match, turn-phase-defaults clause
  intentionally dropped per DEC-092's own Impact). Every clause traces.
- Step 3 - Zone collection: REQ-001/REQ-002/REQ-018/FLOW-001 (search UX,
  Type to begin, 3-char threshold, No matching card found, preview-before-add),
  DEC-004 through DEC-009 (stack ordering/append/button-text/duplicate-block/
  cap; DEC-009 is superseded by DEC-028 and is not cited in this bullet --
  correct, since the spec's blank-question fallback bullet lives in Submit
  and correctly cites DEC-028 instead), DEC-018/REQ-004 through REQ-010/
  FLOW-002/FLOW-004 (stack details thumbnails-when-available, confirmed via
  requirement 8's independent DEC-018 re-check), DEC-151/DEC-160/REQ-130/
  REQ-058/FLOW-002 (horizontal add-order strip, container-relative image
  sizing, corner detail popup), DEC-082/REQ-061 (`instanceId` per-instance
  identity model, stripped at the `buildAskAiRequest` boundary), the
  camera-scanner bullet (DEC-050 via scan spec, DEC-070, REQ-061 -- confirmed
  scan-owned/consumed per FLOW-006, not re-specified; DEC-070 correctly reads
  as cross-boundary by proximity to DEC-050's explicit "via scan spec" marker,
  matching the DESIGN-BRIEF's explicit cross-boundary list). Every clause
  traces; no invented capability, no dropped behavior.
- Step 4 - Enrichment: REQ-017/DEC-028/FLOW-001 (card-by-card wizard, View
  all cards mode), DEC-026/REQ-021/REQ-061 (`ContextTarget` model replacing
  `StackTarget`), REQ-017 (mana-spent determinism, `manaValue` fallback),
  DEC-156/REQ-139/REQ-138/REQ-144 (counter row UI patterns -- bounded stacked
  selects, grouped label/input rows, unbounded commander-damage input). Every
  clause traces; no invented capability, no dropped behavior.

No correction needed to any of the above prose. The only corrections this
slice's scope authorized and applied are the DEC-018 `Backed by:` insertion
(A6) and the DEC-122 "Consumed but owned elsewhere" mention (A7), both
confirmed as real gaps by independent re-check of the cited DEC bodies.
