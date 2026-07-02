import { useEffect, useState, type ReactNode } from "react";
import type { ZoneCardItem } from "../types";

type CardPresentationProps = {
  card: ZoneCardItem;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
  actions?: ReactNode;
};

function joinClasses(...classes: Array<string | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

function hasText(value: string | undefined): value is string {
  return Boolean(value?.trim());
}

export function CardPresentation({
  card,
  className,
  imageClassName,
  fallbackClassName,
  actions
}: CardPresentationProps): JSX.Element {
  const imageUrl = card.imageUrl?.trim();
  const [imageFailed, setImageFailed] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);

  useEffect(() => {
    setImageFailed(false);
    setShowMetadata(false);
  }, [imageUrl]);

  const imageAvailable = Boolean(imageUrl && !imageFailed);

  return (
    <div className={joinClasses("space-y-2", className)}>
      {imageAvailable && !showMetadata ? (
        <img
          src={imageUrl}
          alt={card.name}
          className={joinClasses("mx-auto h-auto w-4/5 object-contain", imageClassName)}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div
          className={joinClasses(
            "w-full text-sm text-zinc-200",
            imageFailed ? "motion-error" : undefined,
            fallbackClassName
          )}
          data-testid="card-presentation-fallback"
        >
          <p className="font-semibold text-zinc-100">{card.name}</p>
          <dl className="space-y-1">
            {hasText(card.manaCost) ? (
              <div>
                <dt className="font-medium">Mana cost</dt>
                <dd>{card.manaCost}</dd>
              </div>
            ) : null}
            {card.manaValue !== undefined ? (
              <div>
                <dt className="font-medium">Mana value</dt>
                <dd>{card.manaValue}</dd>
              </div>
            ) : null}
            {hasText(card.typeLine) ? (
              <div>
                <dt className="font-medium">Type</dt>
                <dd>{card.typeLine}</dd>
              </div>
            ) : null}
            {hasText(card.oracleText) ? (
              <div>
                <dt className="font-medium">Oracle text</dt>
                <dd className="whitespace-pre-wrap">{card.oracleText}</dd>
              </div>
            ) : null}
            {card.colors?.length ? (
              <div>
                <dt className="font-medium">Colors</dt>
                <dd>{card.colors.join(", ")}</dd>
              </div>
            ) : null}
            {card.supertypes?.length ? (
              <div>
                <dt className="font-medium">Supertypes</dt>
                <dd>{card.supertypes.join(", ")}</dd>
              </div>
            ) : null}
            {card.subtypes?.length ? (
              <div>
                <dt className="font-medium">Subtypes</dt>
                <dd>{card.subtypes.join(", ")}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      )}
      {actions || imageAvailable ? (
        <div className="card-presentation-actions flex items-end gap-2">
          {actions ? <div className="min-w-0 flex-1">{actions}</div> : null}
          {imageAvailable ? (
            <button
              type="button"
              aria-label={`${showMetadata ? "Show card image" : "Show card metadata"} for ${card.name}`}
              aria-expanded={showMetadata}
              onClick={() => setShowMetadata((current) => !current)}
              className="shrink-0 rounded-lg border border-zinc-600 px-3 py-1 text-lg font-semibold leading-none text-zinc-200 transition hover:bg-zinc-800"
            >
              <span aria-hidden="true">⋯</span>
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
