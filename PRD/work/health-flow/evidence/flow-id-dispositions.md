# Flow-id dispositions (health-flow)

**What this is:** the audit trail for the flows whose text this package
changes (FLOW-005, 006, 007, 010, 013, 017, 023, 024). Every line in
`PRD/sections/` that names one of them is listed with what happens to it.
FLOW-008 and FLOW-012 are in the brief's own disposition table.

**Result:** 122 hits. 13 are the flow's own entry or a sentence a gate block
already amends. 109 are citations or cross-references whose sentences this
package does not change. No hit needs a change that is not already in a block.

Grep, run 2026-10-22 on branch `thejudge-auto/health-flow` (tip `6656c4bd`):
`FLOW-<id>` not followed by a digit, over every file under `PRD/sections/`,
one row per matching line. Paths are relative to `PRD/sections/`.

### FLOW-005 — 9 hits

| Hit | Disposition |
| --- | --- |
| `in-depth/README.md:25` | keep — citation or cross-reference; no sentence this package changes |
| `in-depth/README.md:301` | keep — citation or cross-reference; no sentence this package changes |
| `in-depth/README.md:313` | keep — citation or cross-reference; no sentence this package changes |
| `in-depth/README.md:503` | amend (REQ-027 block replaces the flagged `MAX_CONVERSATION_HISTORY_CHARS` bullet) |
| `in-depth/README.md:506` | amend (same bullet as :503, REQ-027 block) |
| `user-flows.md:16` | keep — In-Depth's View context trigger; the REQ-206 block changes only Ask a Question |
| `user-flows.md:267` | keep — citation or cross-reference; no sentence this package changes |
| `user-flows.md:538` | keep — FLOW-023 points at the shared history handling, which the REQ-027 block defines |
| `user-flows.md:97` | the flow's own entry — amended (REQ-027 block, FLOW-005 block) |

### FLOW-006 — 34 hits

| Hit | Disposition |
| --- | --- |
| `functional-requirements.md:1235` | keep — citation or cross-reference; no sentence this package changes |
| `functional-requirements.md:1320` | keep — citation or cross-reference; no sentence this package changes |
| `functional-requirements.md:1353` | keep — citation or cross-reference; no sentence this package changes |
| `functional-requirements.md:1433` | keep — citation or cross-reference; no sentence this package changes |
| `functional-requirements.md:1474` | keep — citation or cross-reference; no sentence this package changes |
| `functional-requirements.md:1496` | keep — citation or cross-reference; no sentence this package changes |
| `functional-requirements.md:1772` | keep — citation or cross-reference; no sentence this package changes |
| `functional-requirements.md:1789` | keep — citation or cross-reference; no sentence this package changes |
| `functional-requirements.md:5614` | keep — citation or cross-reference; no sentence this package changes |
| `functional-requirements.md:5642` | keep — citation or cross-reference; no sentence this package changes |
| `functional-requirements.md:6629` | keep — citation or cross-reference; no sentence this package changes |
| `functional-requirements.md:880` | keep — citation or cross-reference; no sentence this package changes |
| `in-depth/README.md:203` | keep — citation or cross-reference; no sentence this package changes |
| `in-depth/README.md:31` | keep — citation or cross-reference; no sentence this package changes |
| `in-depth/README.md:618` | keep — citation or cross-reference; no sentence this package changes |
| `quick-lookup/README.md:16` | keep — citation or cross-reference; no sentence this package changes |
| `quick-lookup/README.md:61` | keep — citation or cross-reference; no sentence this package changes |
| `quick-lookup/README.md:74` | keep — citation or cross-reference; no sentence this package changes |
| `scan/README.md:131` | keep — already describes held cards as thumbnails; it is the source the FLOW-006 block matches |
| `scan/README.md:17` | keep — citation or cross-reference; no sentence this package changes |
| `scan/README.md:231` | keep — citation or cross-reference; no sentence this package changes |
| `scan/README.md:259` | keep — citation or cross-reference; no sentence this package changes |
| `scan/README.md:275` | keep — citation or cross-reference; no sentence this package changes |
| `scan/README.md:44` | keep — citation or cross-reference; no sentence this package changes |
| `scan/README.md:85` | keep — citation or cross-reference; no sentence this package changes |
| `scan/README.md:94` | keep — citation or cross-reference; no sentence this package changes |
| `system-map.md:202` | keep — citation or cross-reference; no sentence this package changes |
| `system-map.md:244` | keep — citation or cross-reference; no sentence this package changes |
| `user-flows.md:124` | the flow's own entry — amended (FLOW-006 block) |
| `user-flows.md:250` | keep — citation or cross-reference; no sentence this package changes |
| `user-flows.md:254` | keep — citation or cross-reference; no sentence this package changes |
| `user-flows.md:270` | keep — "permission fallback to manual search" stays true through Exit scan; the FLOW-006 block carries the exact wording |
| `user-flows.md:525` | keep — citation or cross-reference; no sentence this package changes |
| `user-flows.md:529` | amend (FLOW-023 block, "previewed then added") |

### FLOW-007 — 12 hits

| Hit | Disposition |
| --- | --- |
| `functional-requirements.md:1376` | keep — citation or cross-reference; no sentence this package changes |
| `functional-requirements.md:1402` | keep — citation or cross-reference; no sentence this package changes |
| `functional-requirements.md:2445` | keep — citation or cross-reference; no sentence this package changes |
| `functional-requirements.md:5001` | keep — REQ-200's "visibly changes the background wash" is the source the FLOW-007 block matches |
| `functional-requirements.md:5049` | keep — citation or cross-reference; no sentence this package changes |
| `functional-requirements.md:5434` | keep — citation or cross-reference; no sentence this package changes |
| `functional-requirements.md:5702` | keep — citation or cross-reference; no sentence this package changes |
| `functional-requirements.md:5724` | keep — citation or cross-reference; no sentence this package changes |
| `functional-requirements.md:976` | keep — citation or cross-reference; no sentence this package changes |
| `system-map.md:223` | keep — citation or cross-reference; no sentence this package changes |
| `user-flows.md:161` | the flow's own entry — amended (FLOW-007 block) |
| `user-flows.md:242` | amend (FLOW-008 block rewords this line; its FLOW-007 pointer stays) |

### FLOW-010 — 13 hits

| Hit | Disposition |
| --- | --- |
| `decisions.md:152` | keep — retired decision log, historical |
| `functional-requirements.md:1616` | keep — citation or cross-reference; no sentence this package changes |
| `functional-requirements.md:2145` | keep — citation or cross-reference; no sentence this package changes |
| `functional-requirements.md:2161` | keep — citation or cross-reference; no sentence this package changes |
| `functional-requirements.md:2487` | keep — citation or cross-reference; no sentence this package changes |
| `in-depth/README.md:62` | keep — citation or cross-reference; no sentence this package changes |
| `shared-chrome/README.md:18` | keep — citation or cross-reference; no sentence this package changes |
| `system-map.md:574` | keep — citation or cross-reference; no sentence this package changes |
| `user-flows.md:194` | keep — citation or cross-reference; no sentence this package changes |
| `user-flows.md:222` | the flow's own entry — amended (FLOW-010 block) |
| `user-flows.md:246` | keep — citation or cross-reference; no sentence this package changes |
| `user-flows.md:291` | keep — citation or cross-reference; no sentence this package changes |
| `user-flows.md:316` | keep — citation or cross-reference; no sentence this package changes |

### FLOW-013 — 6 hits

| Hit | Disposition |
| --- | --- |
| `functional-requirements.md:2769` | keep — citation or cross-reference; no sentence this package changes |
| `functional-requirements.md:5152` | keep — citation or cross-reference; no sentence this package changes |
| `functional-requirements.md:5197` | keep — citation or cross-reference; no sentence this package changes |
| `life-tracker/README.md:11` | keep — citation or cross-reference; no sentence this package changes |
| `system-map.md:552` | keep — citation or cross-reference; no sentence this package changes |
| `user-flows.md:289` | the flow's own entry — amended (FLOW-013 block) |

### FLOW-017 — 9 hits

| Hit | Disposition |
| --- | --- |
| `functional-requirements.md:2699` | keep — citation or cross-reference; no sentence this package changes |
| `shared-chrome/README.md:18` | keep — citation or cross-reference; no sentence this package changes |
| `shared-chrome/README.md:293` | keep — citation or cross-reference; no sentence this package changes |
| `system-map.md:370` | keep — citation or cross-reference; no sentence this package changes |
| `system-map.md:391` | keep — citation or cross-reference; no sentence this package changes |
| `user-flows.md:380` | keep — citation or cross-reference; no sentence this package changes |
| `user-flows.md:386` | keep — citation or cross-reference; no sentence this package changes |
| `user-flows.md:389` | the flow's own entry — amended (FLOW-017 block) |
| `user-flows.md:436` | keep — citation or cross-reference; no sentence this package changes |

### FLOW-023 — 5 hits

| Hit | Disposition |
| --- | --- |
| `functional-requirements.md:1908` | keep — citation or cross-reference; no sentence this package changes |
| `functional-requirements.md:3967` | keep — citation or cross-reference; no sentence this package changes |
| `quick-lookup/README.md:154` | keep — citation or cross-reference; no sentence this package changes |
| `quick-lookup/README.md:16` | keep — citation or cross-reference; no sentence this package changes |
| `user-flows.md:519` | the flow's own entry — amended (FLOW-023 block) |

### FLOW-024 — 34 hits

| Hit | Disposition |
| --- | --- |
| `functional-requirements.md:1284` | keep — citation or cross-reference; no sentence this package changes |
| `functional-requirements.md:1289` | keep — citation or cross-reference; no sentence this package changes |
| `functional-requirements.md:3151` | keep — citation or cross-reference; no sentence this package changes |
| `functional-requirements.md:3157` | keep — citation or cross-reference; no sentence this package changes |
| `functional-requirements.md:3160` | keep — citation or cross-reference; no sentence this package changes |
| `functional-requirements.md:3171` | keep — citation or cross-reference; no sentence this package changes |
| `functional-requirements.md:3173` | keep — citation or cross-reference; no sentence this package changes |
| `functional-requirements.md:4120` | keep — citation or cross-reference; no sentence this package changes |
| `functional-requirements.md:4126` | keep — citation or cross-reference; no sentence this package changes |
| `functional-requirements.md:4134` | keep — citation or cross-reference; no sentence this package changes |
| `functional-requirements.md:4147` | keep — citation or cross-reference; no sentence this package changes |
| `functional-requirements.md:4154` | keep — citation or cross-reference; no sentence this package changes |
| `functional-requirements.md:4164` | keep — citation or cross-reference; no sentence this package changes |
| `integrations-and-data.md:149` | keep — citation or cross-reference; no sentence this package changes |
| `integrations-and-data.md:232` | keep — citation or cross-reference; no sentence this package changes |
| `integrations-and-data.md:254` | keep — citation or cross-reference; no sentence this package changes |
| `non-functional-requirements.md:336` | keep — citation or cross-reference; no sentence this package changes |
| `non-functional-requirements.md:341` | keep — citation or cross-reference; no sentence this package changes |
| `quick-lookup/README.md:66` | keep — citation or cross-reference; no sentence this package changes |
| `scan/README.md:125` | keep — already says the thumbnail opens the detail popup |
| `scan/README.md:131` | keep — citation list at the end of the same scan paragraph |
| `screen-layout.md:113` | keep — citation or cross-reference; no sentence this package changes |
| `screen-layout.md:145` | keep — citation or cross-reference; no sentence this package changes |
| `shared-chrome/README.md:336` | keep — citation or cross-reference; no sentence this package changes |
| `system-map.md:200` | keep — citation or cross-reference; no sentence this package changes |
| `system-map.md:256` | keep — citation or cross-reference; no sentence this package changes |
| `user-flows.md:12` | keep — citation or cross-reference; no sentence this package changes |
| `user-flows.md:136` | amend (FLOW-006 block, the held-card corner-control sentence) |
| `user-flows.md:216` | keep — citation or cross-reference; no sentence this package changes |
| `user-flows.md:26` | keep — citation or cross-reference; no sentence this package changes |
| `user-flows.md:54` | keep — In-Depth tiles do carry the ⓘ corner control (live walk, reconciliation B4) |
| `user-flows.md:543` | the flow's own entry — amended (FLOW-024 block) |
| `user-flows.md:571` | keep — citation or cross-reference; no sentence this package changes |
| `user-flows.md:576` | keep — citation or cross-reference; no sentence this package changes |
