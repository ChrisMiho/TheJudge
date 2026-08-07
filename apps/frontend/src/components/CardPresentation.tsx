import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useOutsideDismiss } from "../hooks/useOutsideDismiss";
import type { ZoneCardItem } from "../types";
import { OverlayCloseButton } from "./OverlayCloseButton";

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

/** The locally-carried descriptive fields shown in both the text-first fallback and the
 * suite-wide detail popup (DEC-151) — every field here already lives on the card object
 * passed in, so neither path issues a new fetch. */
export type CardDetailFields = Pick<
  ZoneCardItem,
  "name" | "oracleText" | "manaCost" | "manaValue" | "typeLine" | "colors" | "supertypes" | "subtypes"
>;

function CardDetailFieldsList({ card }: { card: CardDetailFields }): JSX.Element {
  return (
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
  );
}

type CardDetailPopupProps = {
  card: CardDetailFields;
  onClose: () => void;
};

/**
 * Suite-wide card detail popup (DEC-151 part 2, rehosted by DEC-158). It shows oracle text
 * plus the same locally-carried fields the text-first fallback renders. No new network
 * request: every field comes from the card object already passed to `CardPresentation` /
 * `CardSelectionPreview`. Escape closes it as a convenience; the required dismissal path is
 * the visible X control, and the shared `useOutsideDismiss` hook covers the scrim.
 *
 * It is portaled to `document.body` rather than layered `absolute inset-0` over the image.
 * As an image-bound box it inherited the image's 92x128px geometry, squeezing 356px of
 * detail into a 66px text column and pushing its own close control 37px past the dialog's
 * right edge (DEC-158). Portaled, it takes the overlay family's own geometry —
 * content-sized bottom sheet below 768px, View Context-width side panel at 768px+, per
 * `screen-layout.md`'s "Card detail popup" row — identically on all six card surfaces,
 * with no per-surface variant, because every surface renders this one component.
 */
export function CardDetailPopup({ card, onClose }: CardDetailPopupProps): JSX.Element {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useOutsideDismiss([dialogRef], onClose, true);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  }

  return createPortal(
    <div className="card-detail-overlay" data-testid="card-detail-overlay">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        data-testid="card-detail-popup"
        className="card-detail-surface ambient-accent-surface border border-zinc-700 bg-zinc-950 text-left text-sm text-zinc-200 shadow-2xl"
      >
        <div className="card-detail-header flex shrink-0 items-start justify-between gap-3 border-b border-zinc-700/70">
          <p id={titleId} className="font-semibold text-zinc-100">
            {card.name}
          </p>
          <OverlayCloseButton ref={closeRef} label={`Close details for ${card.name}`} onClick={onClose} />
        </div>
        <div className="card-detail-content">
          <CardDetailFieldsList card={card} />
        </div>
      </div>
    </div>,
    document.body
  );
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
  const [detailOpen, setDetailOpen] = useState(false);
  const detailTriggerRef = useRef<HTMLButtonElement>(null);
  const wasDetailOpenRef = useRef(false);

  useEffect(() => {
    setImageFailed(false);
    setDetailOpen(false);
  }, [imageUrl]);

  // The popup now lives in a body portal, so closing it no longer leaves focus inside a
  // DOM ancestor of the trigger — restore it explicitly, as the other overlay adopters do.
  useEffect(() => {
    if (!detailOpen && wasDetailOpenRef.current) {
      detailTriggerRef.current?.focus();
    }
    wasDetailOpenRef.current = detailOpen;
  }, [detailOpen]);

  const imageAvailable = Boolean(imageUrl && !imageFailed);

  return (
    <div className={joinClasses("space-y-2", className)}>
      {imageAvailable ? (
        <div className="relative mx-auto w-fit max-w-full">
          <img
            src={imageUrl}
            alt={card.name}
            className={joinClasses("h-auto max-h-32 w-auto object-contain", imageClassName)}
            onError={() => setImageFailed(true)}
          />
          <button
            ref={detailTriggerRef}
            type="button"
            aria-label={`Show details for ${card.name}`}
            aria-haspopup="dialog"
            aria-expanded={detailOpen}
            onClick={() => setDetailOpen(true)}
            className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-full bg-zinc-950/85 text-base font-semibold leading-none text-zinc-100 shadow-md transition hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-accent-soft"
          >
            <span aria-hidden="true">ⓘ</span>
          </button>
          {detailOpen ? <CardDetailPopup card={card} onClose={() => setDetailOpen(false)} /> : null}
        </div>
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
          <CardDetailFieldsList card={card} />
        </div>
      )}
      {actions ? (
        <div className="card-presentation-actions flex items-end gap-2">
          <div className="min-w-0 flex-1">{actions}</div>
        </div>
      ) : null}
    </div>
  );
}
