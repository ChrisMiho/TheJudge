import { useEffect, useRef, useState } from "react";
import { getCardIdentityRingStyle } from "../lib/cardIdentityRing";
import { deriveCardImageUrl } from "../lib/cardImage";
import { CardDetailPopup, type CardPresentationCard } from "./CardPresentation";

type CardHeroProps = {
  card: CardPresentationCard & { colors?: string[] };
};

/**
 * `in-depth-question.html`'s `.card.hero`: the card's art on the placing and context sheets,
 * wearing its colour-identity ring (REQ-058) with one ⓘ widget on the corner that opens the
 * shared card detail popup. When no image loads, the card's name alone stands in for the art.
 */
export function CardHero({ card }: CardHeroProps): JSX.Element {
  const imageUrl = card.imageUrl?.trim() || deriveCardImageUrl(card.imageId) || undefined;
  const [imageFailed, setImageFailed] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    setImageFailed(false);
    setDetailOpen(false);
  }, [imageUrl]);

  // The popup lives in a body portal, so closing it leaves focus outside the trigger's DOM
  // ancestors — put it back on the ⓘ explicitly.
  useEffect(() => {
    if (!detailOpen && wasOpenRef.current) triggerRef.current?.focus();
    wasOpenRef.current = detailOpen;
  }, [detailOpen]);

  return (
    <div className="card hero card-identity-ring" data-front="true" style={getCardIdentityRingStyle(card.colors)}>
      {imageUrl && !imageFailed ? (
        <img src={imageUrl} alt={card.name} onError={() => setImageFailed(true)} />
      ) : (
        <div className="fallback" data-testid="card-presentation-fallback">
          <div>
            <strong>{card.name}</strong>
          </div>
        </div>
      )}
      <button
        ref={triggerRef}
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
}
