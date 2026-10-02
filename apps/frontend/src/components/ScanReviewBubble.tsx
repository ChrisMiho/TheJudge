import { useState } from "react";
import { getCardIdentityRingStyle } from "../lib/cardIdentityRing";
import { CardPresentation, type CardPresentationCard } from "./CardPresentation";

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
 * Top-right counter that expands to the scanner's own holding list for this
 * session, so a wrong lock can be dropped in one tap without leaving the
 * camera (DEC-058) — and, since REQ-214, so the player can see what is about
 * to join the destination before it does. A caution triangle beside the count
 * opens a one-line pop-up naming scanning as experimental. Derives entirely
 * from the passed holding-list entries — no zone or trade-side read here.
 */
export function ScanReviewBubble({ entries, onRemove, destinationLabel }: ScanReviewBubbleProps): JSX.Element | null {
  const [expanded, setExpanded] = useState(false);
  const [cautionOpen, setCautionOpen] = useState(false);

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="absolute right-3 top-12 z-10 flex flex-col items-end gap-2">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Card scanning is experimental"
          onClick={() => setCautionOpen(true)}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400/90 text-xs font-bold text-amber-950 shadow transition hover:bg-amber-300"
        >
          <span aria-hidden="true">⚠</span>
        </button>
        <button
          type="button"
          aria-label={`Scanned this session: ${entries.length}`}
          aria-expanded={expanded}
          onClick={() => setExpanded((open) => !open)}
          className="flex items-center gap-1.5 rounded-full bg-accent/90 px-3 py-1.5 text-sm font-semibold text-accent-contrast shadow-lg transition hover:bg-accent-strong/90 focus:outline-none focus:ring-2 focus:ring-accent-soft"
        >
          <span aria-hidden="true">✓</span>
          <span>{entries.length}</span>
        </button>
      </div>
      {cautionOpen && (
        // Look-matching pass (slice P): restyled per `card-scan.html`'s
        // `.caution-panel` — an icon + heading, two lines (what the feature
        // is, and the search fallback), then "Got it". The trigger itself
        // (the ⚠ button above) is unchanged.
        <div
          role="alertdialog"
          aria-label="Card scanning is experimental"
          className="w-80 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-amber-400/45 bg-zinc-950/95 p-4 text-left shadow-xl"
        >
          <div className="mb-2 flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-400/55 bg-zinc-950/70 text-amber-400"
            >
              ⚠
            </span>
            <h2 className="text-base font-semibold text-zinc-100">Card scanning is experimental</h2>
          </div>
          <p className="text-sm leading-relaxed text-zinc-100">
            This feature is experimental and isn&apos;t fully functioning yet. It may miss a card, read the
            wrong one, or need a few tries — check what it adds before you ask.
          </p>
          <p className="mt-1.5 text-xs text-zinc-400">You can always add a card by search instead.</p>
          <button
            type="button"
            onClick={() => setCautionOpen(false)}
            className="mt-3 w-full rounded-lg border border-zinc-600 bg-zinc-900/70 px-3 py-1.5 text-xs font-semibold text-zinc-100 transition hover:bg-zinc-800"
          >
            Got it
          </button>
        </div>
      )}
      {expanded && (
        <div className="flex max-h-[calc(100dvh-6.25rem)] w-80 max-w-[calc(100vw-1.5rem)] flex-col rounded-2xl border border-zinc-700/80 bg-zinc-950/90 p-3 text-left shadow-xl">
          <p className="mb-2 shrink-0 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-300">
            Added this session
          </p>
          <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="card-identity-ring rounded-lg border border-zinc-700/70 bg-zinc-900/60 px-2.5 py-1.5 text-sm text-zinc-100"
                style={getCardIdentityRingStyle(entry.colors)}
              >
                {/* DEC-160: the review image grows to its own list-row width inside the
                    existing scrolling list — no shell-column cap here, because the row is
                    already the narrow container this surface affords. */}
                <CardPresentation
                  card={entry.card}
                  className="w-full min-w-0"
                  imageClassName="rounded"
                  actions={
                    <button
                      type="button"
                      aria-label={`Remove ${entry.card.name} from scan review`}
                      onClick={() => onRemove(entry.id)}
                      className="w-full rounded-lg border border-zinc-600 px-2 py-1 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800"
                    >
                      Remove
                    </button>
                  }
                />
              </li>
            ))}
          </ul>
          <p className="mt-2 shrink-0 text-center text-[11px] font-medium text-zinc-400">
            {`Joins ${destinationLabel} when you close the scanner`}
          </p>
        </div>
      )}
    </div>
  );
}
