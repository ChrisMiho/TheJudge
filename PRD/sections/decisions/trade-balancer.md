# Trade balancer decisions

Two-sided card-value trade balancer: a standalone frontend-only feature that compares the total value of two lists of cards, plus the top-level app navigation that reaches it. Printing-level static price data and its build.

### DEC-086
- Decision: TheJudge adds a **Card Trade Balancer** — a standalone, frontend-only, ephemeral feature (outside the Decrypt-Stack core loop) where two traders each build a list of cards and the app shows each side's total USD value and the difference between the sides so a trade can be balanced at a glance. Each card entry resolves to a **specific printing** carrying its own price, supports a **foil toggle** (non-foil ↔ foil price) and a **quantity/multiples**, and is built via the existing scan and manual-search input paths. This narrows two Explicit Non-Goals in `goals-and-non-goals.md`: **pricing** (now in scope for this feature, narrowed to "no live/real-time price sync") and **printing disambiguation** (now in scope for the trade balancer's pricing/display only — scan identity stays oracle-level per DEC-053).
- Status: confirmed
- Context: Trading MTG cards fairly means matching values, often bundling several cards per side, and doing that math by hand at the table is slow and error-prone. The scan engine (DEC-050..DEC-070) and manual card search (DEC-012) already let a user build a list of card identities on-device with no network calls, so the missing pieces are (a) per-printing price data and (b) a two-sided comparison surface. Pricing and printing disambiguation were previously excluded, but only as scoped-out of the **card-scanning** feature (DEC-053) — not as a permanent product boundary — so this feature deliberately narrows those non-goals rather than contradicting a core guardrail. Scan already knows the scanned printing (DEC-070 carries the best-distance `Candidate.card_id` and its image), which makes a printing-accurate default cheap; manual search resolves an oracle card by name, so it needs an explicit printing pick to price the right print. The feature is a value aid, not a marketplace or transaction system, so it stays ephemeral and frontend-only.
- Impact:
  - a new standalone view presents two sides (A / B); each side is an ordered list of card entries, and the screen shows each side's total and the live difference (amount + which side is higher)
  - each entry carries a chosen **printing** (id, set, collector number, image, non-foil + foil price), a **foil** flag, and a **quantity** ≥ 1; a side total is `Σ qty × (foil ? usdFoil : usd)` across its entries
  - **scan input:** the existing engine identifies the card and the scanned printing becomes the entry's default printing (DEC-070 provenance); the user can **change the printing** if it is wrong
  - **manual search input** (permanent fallback, DEC-012): the user finds the card by name, then **chooses the correct printing** from that card's printing list; that printing's price applies
  - **duplicates are allowed** on a side — the stack duplicate-block (DEC-007/FLOW-004) and the 10-card stack cap (DEC-008) are stack-only and do **not** apply to trade sides
  - **missing price** (`usd`/`usd_foil` absent for the selected foil mode) defaults that entry's contribution to **$0** and it still counts as $0 toward the side total; the entry's price is rendered in a distinct color from priced entries and carries a **caution-triangle** indicator so the user knows the value is unknown (the side total may be understated). The side total is **not** silently marked incomplete beyond that per-entry signal
  - currency scope is **USD only** (Scryfall `usd` / `usd_foil`); EUR, tix, etched-foil, and card grading/condition are out of scope for v1
  - prices are a **static build-time snapshot** (DEC-087); there is no live/real-time price lookup, no runtime sync, and the UI may surface the snapshot date ("prices as of …")
  - the feature is **ephemeral**: no trade history, no persistence across reload, no marketplace/transaction handling, and no automated "suggest cards to balance" logic
  - **frontend-only, contract-frozen:** no change to `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly (`buildPromptContext`/`buildPromptText`), the provider boundary, `POST /api/ask-ai`, or any product-facing endpoint (DEC-010); the chosen printing is a pricing/display layer and is never pushed into prompt context, rulings lookup, or the Decrypt-Stack `ZoneCardItem` request payload
  - reached via the top-level navigation menu (DEC-088); the Stack Assistant start screen and its flow are unchanged
- Related requirements:
  - REQ-064
  - REQ-065
  - REQ-067
  - NFR-013
  - FLOW-009
- Notes:
  - narrows, and is scoped against, the `goals-and-non-goals.md` "pricing" and "printing disambiguation" non-goals; it does not touch the framing guardrails (DEC-001/002/013) or the core-loop contract
  - printing selection here is presentation/pricing only and does **not** reopen the DEC-053 oracle-level scan-identity model

### DEC-087
- Decision: The trade balancer is powered by a new committed, lazy-loaded, **printing-level price artifact** built offline from the existing Scryfall bulk source, carrying one entry per paper printing with its USD non-foil and foil price plus the set/collector/image needed to identify and display the printing, grouped so a card's printings can be listed for the manual printing picker. It is a **static snapshot** with no runtime sync, refreshed only through the existing human-approved data pipeline. This extends DEC-012's static-metadata posture to a second artifact; it does not change `cardMetadata.json`, its runtime load, or its contract.
- Status: confirmed
- Context: The IDEA proposed extending `cardMetadata.json` with a single price, but `cardMetadata.json` is oracle-level (one representative printing per oracle id, DEC-071), which cannot represent "the price of the specific printing scanned/chosen" or list a card's printings for the picker. The requirement is per-printing pricing across every printing, so a dedicated printing-level artifact is the right home. `cardScanMap.json` (DEC-053/DEC-070) is already printing-level (`{ oracleId, name, imageUrl }`) and covers gameplay printings, but it is scoped to the scan resolver and lazy-loaded only on first scan; overloading it with pricing would couple scan identity resolution to trade pricing. A separate artifact keeps concerns clean and lets the trade view lazy-load its own data. Scryfall printing objects already carry `prices.usd` / `prices.usd_foil`, and `default-cards.json` (already downloaded by the pipeline) has one object per paper printing, so the artifact is a straightforward build over data the pipeline already fetches.
- Impact:
  - a new build script (alongside `data:build` / `data:refresh`) emits a committed printing-level price artifact under `apps/frontend/public/data/` (e.g. `cardPrintingPrices.json` or equivalent) from the local Scryfall bulk source
  - per printing the artifact carries at least: printing id, oracle id, card name, set code, set name, collector number, image url, `usd` (non-foil), `usd_foil`; entries are indexable by oracle id so the manual picker can list a card's printings, and by printing id so a scanned printing resolves directly
  - prices are whatever the source snapshot holds at build time; missing prices are stored as null/absent and handled per DEC-086 ($0 + caution indicator); the artifact records a **snapshot date** the UI may display
  - the artifact is **lazy-loaded only when the trade balancer is first opened**; users who never open it pay no startup cost (NFR-013, mirroring the NFR-010 scan-artifact posture)
  - **no runtime price fetch and no runtime sync**: the committed snapshot is the only source; refresh happens solely via the existing `data:refresh` (Scryfall bulk download is human-approved before it runs) then `data:build`
  - raw downloaded bulk data remains gitignored per existing policy; the committed artifact is the trimmed price file
  - no change to `cardMetadata.json`, `cardScanMap.json`, `cardhashes.bin`, the scan recipe/identify/lock boundary, `AskAiRequest`, prompt assembly, the provider boundary, or any endpoint
- Related requirements:
  - REQ-066
  - REQ-065
  - NFR-013
  - FLOW-009
- Notes:
  - extends DEC-012 (static committed metadata, no runtime sync) with a second static artifact; the price snapshot is intentionally not live
  - source-bulk choice and the exact filter/field set are build-time details validated by outcome (every priced gameplay printing is present and prices display correctly), not product open questions (DEC-071 precedent); `all-cards` (every language) is unnecessary because prices are per printing, not per language

### DEC-088
- Decision: TheJudge adds a **top-level in-app navigation menu** — a menu affordance in the top-right header chrome (visually distinct from, and non-overlapping with, the corner `ThemeControl`/palette affordance) that opens a menu the user taps to switch between **Stack Assistant** (the existing Decrypt-Stack flow / start screen) and **Trade Balancer** (DEC-086), with the same menu as the path back. Mode switching is a frontend-only view switch that preserves each mode's in-session state; there is no persistence across reload and no backend/contract change.
- Status: confirmed
- Context: The trade balancer is a second top-level surface alongside the existing core flow, so the app needs a way to move between them. The user asked for a deliberate menu button in the top-right header — not tucked in the corner like the palette selector — that opens a menu and offers the destinations. `ThemeControl` already occupies a global corner affordance and must keep working; a scan-control overlap once caused a misclick hazard (DEC-065), so the new menu must be positioned so it never overlaps the palette control. The existing start screen and staged flow are unchanged — this is additive chrome and routing, not a redesign of either surface.
- Impact:
  - a navigation-menu affordance sits in the **top-right header** on every screen, distinct from `ThemeControl` (which stays where it is); the two controls have non-overlapping visual bounds and pointer hit areas (DEC-065 precedent)
  - opening the menu lists the destinations — **Stack Assistant** and **Trade Balancer** — with the current mode indicated; selecting one switches the active view, and the same menu returns the user to the other mode
  - switching modes is a **frontend-only view switch**: each mode's in-session state is preserved while the app stays loaded (a user can move to Trade Balancer and back without losing an in-progress Stack Assistant flow, and vice versa); nothing is persisted across a page reload (consistent with the ephemeral posture of both the core loop and DEC-086)
  - the Stack Assistant start screen, staged flow, and answered/conversation view are unchanged; the menu is additive and does not alter any step logic or payload
  - the menu is chrome only: no change to `AskAiRequest`, `GameContext`, prompt assembly, the provider boundary, `POST /api/ask-ai`, or any product-facing endpoint; it adds no backend route and no server-side navigation state
  - mobile-first: the menu button and its opened menu stay touch-friendly and within the mobile chrome without crowding the header (NFR-001), and any open/close motion stays within the CSS-only, reduced-motion-aware carve-out (NFR-006)
- Related requirements:
  - REQ-067
  - FLOW-010
  - NFR-001
- Notes:
  - the menu is intentionally extensible (future top-level destinations can be added) but v1 lists only Stack Assistant and Trade Balancer
  - supersedes nothing; `ThemeControl` (DEC-066) placement and behavior are unchanged
