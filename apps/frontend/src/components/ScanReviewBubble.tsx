import { useState } from "react";
import { getCardIdentityRingStyle } from "../lib/cardIdentityRing";
import { deriveCardImageUrl } from "../lib/cardImage";
import { CardDetailPopup, type CardPresentationCard } from "./CardPresentation";

/** REQ-214: one card waiting in the scanner's own holding list. `id` is the
 * scanner-local, monotonic id `useScanCapture` assigns on recognition — it has
 * no relationship to the destination's own identity scheme. */
export type ScanReviewEntry = {
  id: number;
  card: CardPresentationCard;
  colors?: string[];
};

type ScanReviewBubbleProps = {
  /** This session's holding list, in hold order — not yet on the destination. */
  entries: ScanReviewEntry[];
  /** Drops one entry from the holding list; nothing is added for it (REQ-214). */
  onRemove: (id: number) => void;
  /** Plain-language name of where the list joins when the scanner closes, e.g.
   * "the Stack", "Side A" — shown in the panel's foot (REQ-214). */
  destinationLabel: string;
};

/**
 * Top-right caution triangle and counter pill (`card-scan.html`'s `.vf-top-right`); the pill expands to
 * the scanner's own holding list for this session, so a wrong lock can be dropped in one tap without
 * leaving the camera (DEC-058) — and, since REQ-214, so the player can see what is about to join the
 * destination before it does. The caution triangle opens a short note naming scanning as experimental.
 * Derives entirely from the passed holding-list entries — no zone or trade-side read here.
 */
export function ScanReviewBubble({ entries, onRemove, destinationLabel }: ScanReviewBubbleProps): JSX.Element | null {
  const [expanded, setExpanded] = useState(false);
  const [cautionOpen, setCautionOpen] = useState(false);
  // A tap on a held card's thumbnail opens the shared card detail popup (DEC-151, DEC-078): the
  // descriptive fields load on demand by oracle id, and a card with no image shows its name only.
  const [detailEntryId, setDetailEntryId] = useState<number | null>(null);
  const detailEntry = entries.find((entry) => entry.id === detailEntryId);

  if (entries.length === 0) {
    return null;
  }

  return (
    <>
      <div className="vf-top-right">
        <button
          type="button"
          className="caution"
          aria-label="Card scanning is experimental"
          aria-haspopup="dialog"
          onClick={() => setCautionOpen(true)}
        >
          <CautionTriangle />
        </button>
        <div className="review-bubble" data-open={expanded ? "true" : "false"}>
          <button
            type="button"
            className="pill"
            aria-label={`Scanned this session: ${entries.length}`}
            aria-expanded={expanded}
            onClick={() => setExpanded((open) => !open)}
          >
            <span aria-hidden="true">✓</span>
            <span>{entries.length}</span>
          </button>
          {expanded && (
            <div className="list">
              <span className="lbl">Added this session</span>
              {entries.map((entry) => {
                const imageUrl = entry.card.imageUrl?.trim() || deriveCardImageUrl(entry.card.imageId) || undefined;
                return (
                  <div key={entry.id} className="row">
                    <button
                      type="button"
                      className="thumb tap card-identity-ring"
                      style={getCardIdentityRingStyle(entry.colors)}
                      aria-label={`Show details for ${entry.card.name}`}
                      aria-haspopup="dialog"
                      onClick={() => setDetailEntryId(entry.id)}
                    >
                      {imageUrl ? <img src={imageUrl} alt="" /> : null}
                    </button>
                    <span className="name">{entry.card.name}</span>
                    <button
                      type="button"
                      className="btn"
                      aria-label={`Remove ${entry.card.name} from scan review`}
                      onClick={() => onRemove(entry.id)}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
              <p className="note">{`Joins ${destinationLabel} when you close the scanner`}</p>
            </div>
          )}
        </div>
      </div>
      {detailEntry && <CardDetailPopup card={detailEntry.card} onClose={() => setDetailEntryId(null)} />}
      {cautionOpen && (
        // `card-scan.html`'s caution note: an icon and heading, two lines (what the feature is, and the
        // search fallback), then "Got it".
        <div role="alertdialog" aria-label="Card scanning is experimental" className="caution-panel">
          <div className="ch">
            <span className="caution" aria-hidden="true">
              <CautionTriangle />
            </span>
            <h2>Card scanning is experimental</h2>
          </div>
          <p>
            This feature is experimental and isn&apos;t fully functioning yet. It may miss a card, read the wrong
            one, or need a few tries — check what it adds before you ask.
          </p>
          <p className="text-muted">You can always add a card by search instead.</p>
          <div className="foot">
            <button type="button" className="btn primary" onClick={() => setCautionOpen(false)}>
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function CautionTriangle(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3.2 22 20.5H2Z" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
      <path d="M12 9.2v5.2" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
      <circle cx="12" cy="17.4" r="1.2" fill="currentColor" />
    </svg>
  );
}
