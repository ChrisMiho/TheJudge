# Slice A — manual criteria evidence

2026-08-25 A5 — read every "How it works" bullet in
`PRD/sections/trade-balancer/README.md` against DEC-087's Impact list,
REQ-064's/REQ-065's Acceptance Criteria, and FLOW-009's Main Flow/Edge Cases.
Two-sided screen (totals, difference, ephemeral state, portal reach): matches
DEC-087 Impact + REQ-064 ACs. Adding a card (scan default printing via
DEC-070 `Candidate.card_id`, manual search via DEC-012, foil toggle,
quantity/multiples with the stack duplicate-block/cap explicitly not
applying per REQ-009/FLOW-004/REQ-010, entry removal, pricing/display-only
posture not reopening DEC-053): matches DEC-087 Impact + REQ-065 ACs +
FLOW-009 steps 2-3/5. Missing prices ($0 + distinct color + caution
triangle, same treatment on a foil-toggle with no price for that mode):
matches DEC-087 Impact + REQ-065 ACs + FLOW-009 Edge Cases. Prices/freshness
(static snapshot, date-level copy formatted from `snapshotDate`, unparseable
value omits the line): matches DEC-088 Impact + REQ-066 ACs + REQ-145 ACs.
Contract posture (frontend-only, no `AskAiRequest`/Zod/`GameContext`/prompt
assembly/provider boundary/`POST /api/ask-ai` change): matches DEC-087
Impact's frontend-only/contract-frozen clause. No bullet invents a capability
beyond its cited source.

2026-08-25 A7 — read `PRD/sections/trade-balancer/data/cardPrintingPrices.md`'s
Artifact shape table against the committed
`apps/frontend/public/data/cardPrintingPrices.json` (inspected directly via
Python) and the `CardPrintingPrice` TypeScript interface in
`apps/frontend/src/lib/trade/loadCardPrices.ts` (lines 3-15): field names
`id, oracleId, name, set, setName, collectorNumber, imageUrl, usd, usdFoil`
match both exactly. Separately checked
`PRD/sections/integrations-and-data.md`'s `### CardPrintingPrice` entry
(line 75): it names the printing-id field `printingId`, not `id` — confirmed
stale relative to the shipped artifact/interface, matching the map-out
finding. This is an out-of-scope observation only; no edit was made to the
corpus doc, the spec, or `integrations-and-data.md` over it (that file is
outside this package's licensed diff scope).

2026-08-25 A9 — read the spec's "Rejected alternatives and deferred scope"
against DEC-087's and DEC-088's Context and Notes text. `cardMetadata.json`
extension rejection matches DEC-088's Context (oracle-level artifact,
DEC-071, cannot represent a specific printing's price or list printings).
`cardScanMap.json` overload rejection matches DEC-088's Context (scan-scoped,
lazy-loaded on first scan, coupling concern). Live/real-time sync rejection
matches DEC-087 Impact ("no live/real-time price sync") and DEC-088 Impact
("no runtime price fetch and no runtime sync"). Printing-disambiguation
rejection matches DEC-087's Notes ("does not reopen the DEC-053 oracle-level
scan-identity model"). Raw-ISO-timestamp rejection matches REQ-145's
Acceptance Criteria measured baseline verbatim
(`2026-06-05T22:21:13.248Z`). The "out of scope entirely (v1)" list (EUR/
tix/etched-foil, grading/condition, trade history/persistence, marketplace/
transaction, automated balancing) matches DEC-087 Impact's currency-scope
and ephemeral-posture clauses. Nothing in the section is invented or
omitted relative to those two decisions.
