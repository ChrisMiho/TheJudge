import { useState } from "react";
import { CardDetailPopup, type CardPresentationCard } from "./CardPresentation";
import { deriveCardImageUrl } from "../lib/cardImage";

export interface CardStageProps {
  cards: CardPresentationCard[];
  /** REQ-167's bound — rendered in the dots pill as `n / cap`. */
  cap: number;
  onRemove: (cardId: string) => void;
}

/**
 * REQ-206: the Ask a Question card stage. With cards attached, the front card renders
 * full size on a lit solid-panel stage with one neighbour peeking out each side and the
 * rest off-stage, so the stage's height never grows with the card count (superseding the
 * stacked per-image list, REQ-129 as amended). Arrows, ←/→, and a tap on a neighbour turn
 * the ring. With no card attached, nothing renders (the caller skips mounting this).
 *
 * Look-matching pass (slice M): restyled to `flow.css:52-99`'s `.stage`/`.ring`/`.card`/
 * `.card-widget`/`.arrow` — 196px/280px front card, the front-card accent glow, 40px round
 * arrows, dimmed/scaled/blurred neighbours — and `flow.css:148-155`'s `.dots` pill in place
 * of the corner count badge. LOOK-GAPS.md's conflict question ("the count shown on the
 * stage") is carried unresolved: the dots pill still reads the REQ-167 attached/cap count
 * (`n / cap`), not a position-within-stage reading, until the owner answers it.
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
    <div className="aq-stage" data-testid="card-stage">
      <div className="aq-ring">
        {hasRing && (
          <button
            type="button"
            aria-label="Previous card"
            onClick={() => turnRing(boundedIndex - 1)}
            className="aq-arrow motion-focus mr-1 sm:mr-2"
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
              data-neighbor="true"
              className="aq-card motion-focus relative z-0 -mr-6 shrink-0"
            >
              <StageCardImage card={cards[leftIndex]!} />
            </button>
          )}

          <div data-front="true" className="aq-card relative z-10 shrink-0">
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
              className="aq-card-widget remove motion-focus"
            >
              <span aria-hidden="true">×</span>
            </button>
            <button
              type="button"
              aria-label={`Show details for ${current.name}`}
              aria-haspopup="dialog"
              aria-expanded={detailOpen}
              onClick={() => setDetailOpen(true)}
              className="aq-card-widget info motion-focus"
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
              data-neighbor="true"
              className="aq-card motion-focus relative z-0 -ml-6 shrink-0"
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
            className="aq-arrow motion-focus ml-1 sm:ml-2"
          >
            ›
          </button>
        )}
      </div>

      <span className="aq-dots" data-testid="card-stage-count">
        {hasRing &&
          cards.map((card, index) => <span key={card.cardId} className="dot" data-on={index === boundedIndex} />)}
        <span className="n">
          {cards.length} / {cap}
        </span>
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
        className="fallback-inner flex items-center justify-center bg-zinc-800 p-2 text-center text-xs font-semibold text-zinc-200"
      >
        {card.name}
      </div>
    );
  }
  return <img src={imageUrl} alt={card.name} />;
}
