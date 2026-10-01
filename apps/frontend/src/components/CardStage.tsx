import { useState } from "react";
import { CardDetailPopup, type CardPresentationCard } from "./CardPresentation";
import { deriveCardImageUrl } from "../lib/cardImage";

export interface CardStageProps {
  cards: CardPresentationCard[];
  /** REQ-167's bound — rendered in the count pill as `n / cap`. */
  cap: number;
  onRemove: (cardId: string) => void;
}

/**
 * REQ-206: the Ask a Question card stage. With cards attached, the front card renders
 * full size on a lit solid-panel stage with one neighbour peeking out each side and the
 * rest off-stage, so the stage's height never grows with the card count (superseding the
 * stacked per-image list, REQ-129 as amended). Arrows, ←/→, and a tap on a neighbour turn
 * the ring. With no card attached, nothing renders (the caller skips mounting this).
 */
export function CardStage({ cards, cap, onRemove }: CardStageProps): JSX.Element | null {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);

  if (cards.length === 0) {
    return null;
  }

  const boundedIndex = Math.min(currentIndex, cards.length - 1);
  const current = cards[boundedIndex]!;
  const hasRing = cards.length > 1;
  // With exactly two cards, the one neighbour is on both sides of the ring at once —
  // peek it only on the right so it never renders twice (and so its name never matches
  // two images at once).
  const leftIndex = cards.length > 2 ? (boundedIndex - 1 + cards.length) % cards.length : null;
  const rightIndex = hasRing ? (boundedIndex + 1) % cards.length : null;

  function turnRing(toIndex: number): void {
    setCurrentIndex(((toIndex % cards.length) + cards.length) % cards.length);
  }

  return (
    <div
      className="relative flex items-center justify-center gap-2 overflow-hidden rounded-2xl border border-zinc-700/70 bg-zinc-900/55 px-2 py-4"
      data-testid="card-stage"
    >
      {hasRing && (
        <button
          type="button"
          aria-label="Previous card"
          onClick={() => turnRing(boundedIndex - 1)}
          className="motion-focus flex h-11 w-8 shrink-0 items-center justify-center rounded-full text-xl text-zinc-400 hover:text-accent-soft"
        >
          ‹
        </button>
      )}

      <div className="flex min-w-0 flex-1 items-center justify-center">
        {leftIndex !== null && (
          <button
            type="button"
            aria-label={`Show ${cards[leftIndex]!.name} on the stage`}
            onClick={() => turnRing(leftIndex)}
            className="motion-focus relative z-0 -mr-6 w-10 shrink-0 overflow-hidden rounded-lg opacity-60 transition hover:opacity-90"
          >
            <StageCardImage card={cards[leftIndex]!} />
          </button>
        )}

        <div className="relative z-10 w-40 shrink-0 sm:w-48">
          <StageCardImage card={current} />
          <button
            type="button"
            aria-label={`Remove ${current.name}`}
            onClick={() => {
              onRemove(current.cardId);
              if (boundedIndex >= cards.length - 1) {
                turnRing(Math.max(0, boundedIndex - 1));
              }
            }}
            className="motion-focus absolute -left-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-950/90 text-sm font-semibold text-zinc-100 shadow-md hover:bg-zinc-900"
          >
            <span aria-hidden="true">×</span>
          </button>
          <button
            type="button"
            aria-label={`Show details for ${current.name}`}
            aria-haspopup="dialog"
            aria-expanded={detailOpen}
            onClick={() => setDetailOpen(true)}
            className="motion-focus absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-950/90 text-sm font-semibold leading-none text-zinc-100 shadow-md hover:bg-zinc-900"
          >
            <span aria-hidden="true">ⓘ</span>
          </button>
          {detailOpen ? <CardDetailPopup card={current} onClose={() => setDetailOpen(false)} /> : null}
        </div>

        {rightIndex !== null && (
          <button
            type="button"
            aria-label={`Show ${cards[rightIndex]!.name} on the stage`}
            onClick={() => turnRing(rightIndex)}
            className="motion-focus relative z-0 -ml-6 w-10 shrink-0 overflow-hidden rounded-lg opacity-60 transition hover:opacity-90"
          >
            <StageCardImage card={cards[rightIndex]!} />
          </button>
        )}
      </div>

      {hasRing && (
        <button
          type="button"
          aria-label="Next card"
          onClick={() => turnRing(boundedIndex + 1)}
          className="motion-focus flex h-11 w-8 shrink-0 items-center justify-center rounded-full text-xl text-zinc-400 hover:text-accent-soft"
        >
          ›
        </button>
      )}

      <span
        data-testid="card-stage-count"
        className="absolute bottom-2 right-2 rounded-full bg-zinc-950/85 px-2 py-0.5 text-[10px] font-semibold text-zinc-300"
      >
        {cards.length} / {cap}
      </span>
    </div>
  );
}

function StageCardImage({ card }: { card: CardPresentationCard }): JSX.Element {
  const imageUrl = card.imageUrl?.trim() || deriveCardImageUrl(card.imageId) || undefined;
  if (!imageUrl) {
    return (
      <div
        data-testid="card-presentation-fallback"
        className="flex aspect-[5/7] w-full items-center justify-center rounded-lg bg-zinc-800 p-2 text-center text-xs font-semibold text-zinc-200"
      >
        {card.name}
      </div>
    );
  }
  return <img src={imageUrl} alt={card.name} className="h-auto w-full rounded-lg object-contain" />;
}
