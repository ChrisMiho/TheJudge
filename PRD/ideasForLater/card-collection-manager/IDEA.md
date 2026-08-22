# card-collection-manager

Players organize physical cards into folders, decks, and boxes, but TheJudge has no local collection surface. Scanning already identifies cards in batches, but there is no durable place to commit those batches, correct printings, or recover inventory after a browser wipe.

Outcome: a frontend-only collection manager. Feature home offers two primary actions — open scanning or go to collection. Collection overview shows a pie chart of card counts by list (each folder/deck/box its own color) with total collection value in the center; selecting a list opens it for view/edit. Users batch-scan cards, edit printing in the scan review UI when lock-in is wrong, commit the whole batch to one list (existing or new; folder/deck/box are category labels on the same list type), then clear the batch. Lists support add/remove, printing change, quantity, and foil (including another scan batch targeting a list). Entries carry printing, quantity, foil, and price from the printing-price snapshot (not live APIs). Browser storage is the working copy for convenience, with a cookie/flag so users are not forced to re-import every visit; a master backup file is the durable source of truth — prompt export after each batch commit with a beta warning, and support import to restore the working copy.

Non-goals: no cloud/account or multi-device sync; no marketplace; no special deck/box rules (size limits, commander, capacity); not a replacement for MTG Assistant zones; no live price API.

## Clarified decisions (for refinement)

- **Home:** Scan vs Collection only; import/export placement under Collection or a secondary control is open.
- **Overview:** pie = share of card count per list; center = summed USD (qty × foil-aware unit price).
- **Batch assign:** whole batch to one list, then clear.
- **List types:** labels only (folder / deck / box).
- **Storage:** browser working copy + master file as user-owned source of truth + cookie/flag to skip force-import.
- **Shared foundation:** prefer Trade Balancer’s planned printing picker, price artifact, and scan-default-printing patterns when timing allows.
