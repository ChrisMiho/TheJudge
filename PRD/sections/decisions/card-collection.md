# Card collection decisions

Local card collection manager: a frontend-only destination where players commit scanned batches into named lists (folder / deck / box), correct printings, and read total collection value. Its durability model — browser-local working copy plus a user-owned master backup file — lives here too.

### DEC-161
- Decision: TheJudge adds a **Card Collection Manager** — a frontend-only feature-portal destination (DEC-095/DEC-157) where a player keeps a durable local record of the physical cards they own. The destination opens on a **feature home** offering exactly two primary actions: **Scan cards** and **View collection**. The collection **overview** presents a pie chart of card counts by list — one color per list — with the **total collection USD value** in the center; selecting a list opens that list for view and edit. Cards enter through a **batch scan**: the user scans cards into a review batch, corrects any wrong printing in the review UI, commits the **whole batch to exactly one list** (existing or new), then the batch clears. A **list** is a single type carrying a user-chosen **category label** — `folder`, `deck`, or `box` — with no behavioral difference between labels. Every **entry** carries a printing, a quantity, a foil flag, and the USD price read from the committed printing-price snapshot (DEC-088); lists support add, remove, printing change, quantity change, and foil toggle, including a further scan batch targeted at an existing list. The feature is frontend-only and contract-frozen.
- Status: confirmed
- Context: Scanning already identifies cards in batches (DEC-050..DEC-070), and the Trade Balancer already shipped every pricing primitive this feature needs — the printing-level price artifact and its lazy loader, the printing picker, the foil/quantity/missing-price semantics, and a per-surface scan adapter (DEC-087/DEC-088, `system-map.md` "Trade balancer", status shipped). What is missing is a durable place to **commit** a scanned batch: today a scan result is consumed by an ephemeral surface and lost. The IDEA framed the Trade Balancer primitives as "planned … prefer when timing allows"; they are now shipped, so reuse is unconditional under the `technical-design-rules.md` reuse-before-creating rule rather than conditional on timing. The pricing and printing-disambiguation non-goals were already narrowed for the Trade Balancer by DEC-087, so a second value-reading surface needs no further narrowing of those; the **persistence** non-goal is the one this feature narrows (DEC-162). List labels are deliberately inert because the IDEA's non-goals exclude deck/box rules (size limits, commander legality, capacity) — encoding behavior per label would be the deterministic-rules drift DEC-013 forbids.
- Impact:
  - a new registered feature-portal destination with its own flat top-level URL and `React.lazy` boundary, following the existing `PORTAL_DESTINATIONS` entry shape (DEC-157/REQ-140); the Menu gains one destination row and no other chrome changes
  - **feature home**: two primary actions only — **Scan cards** and **View collection**; no third action competes with them
  - **overview**: a pie of per-list **card counts** (share of total card count, one color per list) with **total collection USD** centered inside it; the chart is drawn with inline SVG/CSS and **adds no charting dependency**
  - **list detail**: entries listed with printing (set / collector / image), unit price, foil toggle, quantity control, printing change, and one-tap removal; a list may be renamed, re-labelled, or deleted
  - **batch scan**: scanned cards accumulate in a review batch, each defaulting to the **scanned printing** (DEC-070 provenance) and correctable via the shared printing picker; committing assigns the entire batch to one chosen list (existing or newly created at commit time) and then clears the batch; abandoning the batch discards it
  - a card **with no price in the snapshot is still collected** — it is recorded at $0 with the DEC-087 caution-triangle treatment and never silently dropped; a collection is an inventory record, so refusing an unpriced card would lose the user's data
  - **totals** reuse the shipped pure pricing selectors (`Σ qty × (foil ? usdFoil : usd)`, missing → $0, USD-only) rather than restating the formula; the snapshot date is surfaced as date-level copy per REQ-145 so a total never reads as a live quote
  - duplicates are allowed within a list, and the stack duplicate-block (DEC-007) and 10-card cap (DEC-008) do not apply — those are stack-only, exactly as DEC-087 established for trade sides
  - **frontend-only, contract-frozen**: no change to `AskAiRequest`, Zod schemas, `GameContext`, prompt assembly, the provider boundary, `POST /api/ask-ai`, or any product-facing endpoint (DEC-010); the collection is never read into prompt context, rulings, or a request payload
  - **no cross-feature integration in v1**: the collection does not seed In-Depth zones, does not feed the Trade Balancer, and is not a replacement for MTG Assistant zones
- Related requirements:
  - REQ-146
  - REQ-147
  - REQ-148
  - REQ-151
  - FLOW-019
  - NFR-015
- Notes:
  - reuses, and must not fork, the shipped Trade Balancer pricing primitives (`lib/trade/loadCardPrices.ts`, `lib/trade/pricing.ts`, `components/trade/PrintingPicker.tsx`) and the shipped scan stack (`hooks/useScanCapture.ts`, `components/ScanCameraSurface.tsx`, `lib/scan/resolveScanCandidates.ts`), with `components/trade/useTradeScan.ts` as the established per-surface scan-adapter pattern
  - category labels are presentation only; no capacity, format-legality, or commander rule attaches to any label (DEC-013)
  - scanning stays optional — when the camera is unavailable the surface closes and manual search remains a full input path (DEC-050)

### DEC-162
- Decision: The collection's durability model is **two-tier**: browser `localStorage` holds the **working copy** so a returning player is never forced to re-import, and a **user-owned master backup file** is the durable source of truth. After every batch commit the app **prompts the user to export** the master file, carrying a plain **beta warning** that browser storage can be cleared by the browser and that the exported file is the only durable copy. **Import** restores the working copy from a previously exported file. There is **no cookie**, no account, no cloud, and no multi-device sync: the presence of a valid stored working copy is itself the "don't force an import" signal, so no separate flag mechanism is introduced. This narrows the `goals-and-non-goals.md` non-goal that excluded saved state outside browser-local conversation history; it does not reopen accounts, sync, or server-side storage.
- Status: confirmed
- Context: The IDEA asked for a browser working copy "with a cookie/flag so users are not forced to re-import every visit" plus a master file as the real source of truth. Two repo precedents already cover the browser half: DEC-103 persists live Life Tracker game state to `localStorage`, and DEC-124 persists capped conversation history — both frontend-only and single-device, and `lib/lifeTracker/persistence.ts` establishes the defensive shape (a namespaced `thejudge.*` key plus per-field validation on read, falling back to a clean default rather than throwing on malformed data). A **cookie** would be a second, weaker storage mechanism for a job `localStorage` already does — cookies are size-capped, sent on requests, and would be new surface area for no behavioral gain — and reading "is there a stored collection?" answers the same question the flag was meant to answer. The file half is genuinely new to this repo, but it is the IDEA's explicit core requirement rather than an inferred dependency: the collection is long-lived inventory, and browser storage alone can be wiped without warning, so a user-owned export is what makes the data durable at all.
- Impact:
  - the working copy persists under a namespaced key (`thejudge.collection.*`) written on every mutation and read on destination mount, following the `lifeTracker/persistence.ts` validate-or-default pattern — malformed or partial stored data degrades to a clean empty collection and never throws
  - the stored payload carries an explicit **schema version** so a future shape change can migrate or safely reset rather than misread old data
  - **export** writes a single JSON master file (schema version, list definitions with category labels, entries with printing id / quantity / foil, and an export timestamp) via an in-browser download; no server, no upload, no external service
  - **export prompt**: immediately after a successful batch commit the app offers the export, with a beta warning stating that browser storage is not durable and the file is the user's own backup; the prompt is dismissible and never blocks the user from continuing
  - **import** reads a previously exported file and **replaces** the working copy — restore semantics, matching the IDEA's wording — behind an explicit confirmation that names what is being replaced (current list and card counts) so a destructive restore is never silent; an unreadable or wrong-shaped file is rejected with a plain error and leaves the working copy untouched
  - prices are **not** stored in the master file: entries store the printing id, and prices are re-read from the committed snapshot at load, so a refreshed snapshot re-values an existing collection instead of freezing stale prices into the backup
  - **no product cap** on lists or entries — capping an inventory would silently lose cards, unlike DEC-124's 20-conversation prune; a browser storage-quota failure surfaces an explicit error directing the user to export, rather than failing silently
  - no cookie, no account, no cloud sync, no multi-device reconciliation, and no server-side storage of any kind
- Related requirements:
  - REQ-149
  - REQ-150
  - FLOW-020
  - NFR-015
- Notes:
  - narrows the `goals-and-non-goals.md` "saved sessions outside the narrowly scoped browser-local conversation history" non-goal to admit this feature's browser-local collection plus user-owned file export/import; accounts, billing, server-side sessions, and multi-device sync stay non-goals
  - follows DEC-103's single-device, frontend-only posture; the export file — not the browser — is what the user is told to trust
