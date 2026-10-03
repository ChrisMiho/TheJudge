import { useEffect, useRef, useState } from "react";
import { CardDetailPopup, type CardPresentationCard } from "./CardPresentation";
import { deriveCardImageUrl } from "../lib/cardImage";
import { getCardIdentityRingStyle } from "../lib/cardIdentityRing";
import { ringPlacementStyle } from "../lib/theme/flowStyles";

type StageCard = CardPresentationCard & { colors?: string[] };

export interface CardStageProps {
  cards: StageCard[];
  cap: number;
  onRemove: (cardId: string) => void;
}

/**
 * REQ-206: the attached cards as the mockup's stage — `.stage` > `.ring` (the ‹/› arrows, then the
 * cards placed by their signed distance from the front card, `flow.css`'s `--d`) and `.dots`. The
 * front card (`data-front="true"`) shows ✕ Remove and ⓘ Details straddling its top corners; the
 * neighbours (one each side from three cards up, one side only at exactly two, never the same card
 * twice) are tappable and turn the ring. Only the three cards on stage are rendered. The dots, one
 * per card with the front card's lit, replace the old `n / cap` pill (the cap is told to the player
 * by the add-past-the-cap message, REQ-167).
 */
export function CardStage({ cards, cap: _cap, onRemove }: CardStageProps): JSX.Element | null {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const previousCountRef = useRef(cards.length);

  // A card added turns the ring to it, as the mockup does (`focus = attached.length - 1`).
  useEffect(() => {
    if (cards.length > previousCountRef.current) {
      setCurrentIndex(cards.length - 1);
    }
    previousCountRef.current = cards.length;
  }, [cards.length]);

  if (cards.length === 0) {
    return null;
  }

  const count = cards.length;
  const front = Math.min(currentIndex, count - 1);
  const hasRing = count > 1;

  function turnRing(toIndex: number): void {
    setCurrentIndex(((toIndex % count) + count) % count);
  }

  /** Shortest signed distance around the ring; only |d| <= 1 is on stage. */
  function distanceOf(index: number): number {
    let d = index - front;
    if (d > count / 2) d -= count;
    if (d < -count / 2) d += count;
    return d;
  }

  return (
    <div className="stage" data-testid="card-stage">
      <div className="ring">
        {hasRing && (
          <button type="button" className="arrow prev" aria-label="Previous card" onClick={() => turnRing(front - 1)}>
            ‹
          </button>
        )}
        {hasRing && (
          <button type="button" className="arrow next" aria-label="Next card" onClick={() => turnRing(front + 1)}>
            ›
          </button>
        )}
        {cards.map((card, index) => {
          const d = distanceOf(index);
          if (Math.abs(d) > 1) return null;
          const style = { ...getCardIdentityRingStyle(card.colors), ...ringPlacementStyle(d) };
          if (d !== 0) {
            return (
              <button
                key={card.cardId}
                type="button"
                className="card card-identity-ring"
                aria-label={`Show ${card.name} on the stage`}
                data-front="false"
                data-neighbor="true"
                style={style}
                onClick={() => turnRing(index)}
              >
                <StageCardImage card={card} />
              </button>
            );
          }
          return (
            <div key={card.cardId} className="card card-identity-ring" data-front="true" style={style}>
              <StageCardImage card={card} />
              <button
                type="button"
                className="card-widget remove"
                aria-label={`Remove ${card.name}`}
                onClick={() => {
                  onRemove(card.cardId);
                  if (front >= count - 1) {
                    turnRing(Math.max(0, front - 1));
                  }
                }}
              >
                ✕
              </button>
              <button
                type="button"
                className="card-widget info"
                aria-label={`Show details for ${card.name}`}
                aria-haspopup="dialog"
                aria-expanded={detailOpen}
                onClick={() => setDetailOpen(true)}
              >
                ⓘ
              </button>
              {detailOpen ? <CardDetailPopup card={card} onClose={() => setDetailOpen(false)} /> : null}
            </div>
          );
        })}
      </div>

      <div className="dots" data-testid="card-stage-count" role="img" aria-label={`Card ${front + 1} of ${count}`}>
        {hasRing && cards.map((card, index) => <span key={card.cardId} data-on={index === front} />)}
        {hasRing && <span className="n">{`${front + 1} / ${count}`}</span>}
      </div>
    </div>
  );
}

function StageCardImage({ card }: { card: StageCard }): JSX.Element {
  const imageUrl = card.imageUrl?.trim() || deriveCardImageUrl(card.imageId) || undefined;
  if (!imageUrl) {
    return (
      <div data-testid="card-presentation-fallback" className="fallback">
        <div>
          <strong>{card.name}</strong>
          <span>Image unavailable</span>
        </div>
      </div>
    );
  }
  return <img src={imageUrl} alt={card.name} loading="eager" />;
}
