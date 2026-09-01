status: ideation

# remove-dead-card-back-detector

Pure behavior-preserving refactor: delete the unreachable `isCardBack`
method, its export-only `CARD_BACK_THRESHOLD` constant, and the now-unread
private `cardBack` field write in `apps/frontend/src/lib/scan/identify.ts`.
Keep the live `CARD_BACK_ID` DB filter untouched. See `IDEA.md` for
evidence and non-goals.
