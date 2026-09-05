import type { ReactNode } from "react";
import { CardPresentation, type CardPresentationCard } from "./CardPresentation";

type CardSelectionPreviewProps = {
  // REQ-176: only identity (cardId, name, imageUrl) is ever read here — the
  // pre-submit preview has the full `CardMetadataItem`, but the frozen View
  // Context lookup card only ever carries the trimmed wire shape
  // (`LookupWireCard`) now, and both satisfy `CardPresentationCard`.
  card: CardPresentationCard;
  action?: ReactNode;
};

/**
 * The staged-card surface shared by Quick Question (pre-submit and the frozen View Context
 * card) and the In-Depth zone-collection selected-card/add preview.
 *
 * REQ-133/DEC-160 consolidated it down to what it is now: one shell-column image plus the
 * host's own action. It previously paired a `max-h-32` image with a metadata sidebar
 * (`grid-cols-[minmax(160px,200px)_1fr]`) repeating the card's name and context — detail the
 * corner popup already carries, beside an image too small to read. Dropping the sidebar frees
 * the whole content column for the image, which is the point of DEC-160; the name stays
 * reachable through the popup and still renders inside `CardPresentation`'s text-first
 * fallback when no image exists.
 */
export function CardSelectionPreview({ card, action }: CardSelectionPreviewProps): JSX.Element {
  return (
    <article className="motion-enter rounded-2xl border border-zinc-600 bg-zinc-800/75 p-4 shadow-[0_14px_34px_-24px_rgba(0,0,0,0.5)]">
      <div className="card-shell-column mx-auto flex w-full flex-col gap-3">
        <CardPresentation card={card} className="w-full" />
        {action ? <div className="flex justify-center">{action}</div> : null}
      </div>
    </article>
  );
}
