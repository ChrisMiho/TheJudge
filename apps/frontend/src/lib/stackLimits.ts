export const MAX_STACK_SIZE = 10;
export const DUPLICATE_CARD_MESSAGE = "Duplicate cards are not supported in MVP1.";
export const STACK_LIMIT_MESSAGE = "MVP stack limit reached (10 cards).";

/** REQ-167 (amended): Ask a Question's own card-attach cap — a different mode and a
 * different wire shape than the Stack's `MAX_STACK_SIZE` above, but the same bound (10),
 * so every card on the Ask a Question stage can be carried whole into In-depth details'
 * Stack (REQ-206). Co-located here rather than duplicated as a QuickLookupApp-local
 * constant; the backend's own `MAX_LOOKUP_CARDS` in `askAiRequest.ts` is a separate
 * package and mirrors this value independently, the same way the request-validation cap
 * always has. */
export const MAX_LOOKUP_CARDS = 10;
