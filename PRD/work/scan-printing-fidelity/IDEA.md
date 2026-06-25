# IDEA: scan-printing-fidelity

**Problem:** When a card is scanned, the image that pops up isn't always the printing that was actually scanned — the user sees a different printing/art than the physical card in front of them. Separately, searched-card results sometimes resolve to non-standard printings (e.g. Secret Lairs) instead of a representative "normal" print.

**Outcome:** A scanned card should resolve to and display the specific printing/art the user scanned, so on-screen art matches the physical card. For searched (typed) cards, keep using a recent printing but bias resolution toward a standard/representative print and away from special treatments like Secret Lairs.

**Non-goals:** No change to the Ask AI prompt/contract or rules-retrieval behavior (printing selection is presentation/identity only). Not building a full printing-picker UI unless refinement deems it necessary. Search-path behavior stays "most recent" except for the standard-print bias.
