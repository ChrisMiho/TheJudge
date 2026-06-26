import { useState } from "react";
import type { ZoneCardItem } from "../types";

type ScanReviewBubbleProps = {
  /** Cards added to the zone during this scan session, in add order. */
  cards: ZoneCardItem[];
  /** Existing zone-card removal path; removal is immediate (no confirmation, DEC-058). */
  onRemove: (cardId: string) => void;
};

/**
 * Top-right counter that expands to the cards auto-added this scan session so a
 * wrong lock can be undone in one tap without leaving the camera (DEC-058).
 * Derives entirely from the passed zone-card list + session set — no scan-only store.
 */
export function ScanReviewBubble({ cards, onRemove }: ScanReviewBubbleProps): JSX.Element | null {
  const [expanded, setExpanded] = useState(false);

  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="absolute right-3 top-12 z-10 flex flex-col items-end gap-2">
      <button
        type="button"
        aria-label={`Scanned this session: ${cards.length}`}
        aria-expanded={expanded}
        onClick={() => setExpanded((open) => !open)}
        className="flex items-center gap-1.5 rounded-full bg-accent/90 px-3 py-1.5 text-sm font-semibold text-accent-contrast shadow-lg transition hover:bg-accent-strong/90 focus:outline-none focus:ring-2 focus:ring-accent-soft"
      >
        <span aria-hidden="true">✓</span>
        <span>{cards.length}</span>
      </button>
      {expanded && (
        <div className="w-60 max-w-[80vw] rounded-2xl border border-zinc-700/80 bg-zinc-950/90 p-3 text-left shadow-xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-300">Added this session</p>
          <ul className="space-y-2">
            {cards.map((card, index) => (
              <li
                key={`${card.cardId}-${index}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-zinc-700/70 bg-zinc-900/60 px-2.5 py-1.5 text-sm text-zinc-100"
              >
                {card.imageUrl && (
                  <img
                    src={card.imageUrl}
                    alt={card.name}
                    className="h-20 w-14 shrink-0 rounded object-cover"
                  />
                )}
                <span className="truncate">{card.name}</span>
                <button
                  type="button"
                  aria-label={`Remove ${card.name} from scan review`}
                  onClick={() => onRemove(card.cardId)}
                  className="shrink-0 rounded-lg border border-zinc-600 px-2 py-1 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
