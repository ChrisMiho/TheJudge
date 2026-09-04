import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useOutsideDismiss } from "../hooks/useOutsideDismiss";
import { fetchCardDetail, peekCardDetail, type CardDetailBlock } from "../lib/cardDetail";
import { OverlayCloseButton } from "./OverlayCloseButton";

/** The identity fields every card surface needs to render a tile — image, name, and
 * the oracle id used to fetch detail on demand (REQ-175, FLOW-024). `ZoneCardItem`
 * and `CardMetadataItem` both satisfy this shape. */
export type CardPresentationCard = {
  cardId: string;
  name: string;
  imageUrl?: string;
};

type CardPresentationProps = {
  card: CardPresentationCard;
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

const EMPTY_CARD_DETAIL: CardDetailBlock = {
  oracleText: "",
  typeLine: "",
  manaCost: "",
  manaValue: 0,
  colors: [],
  supertypes: [],
  subtypes: []
};

function CardDetailFieldsList({ detail }: { detail: CardDetailBlock }): JSX.Element {
  return (
    <dl className="space-y-1">
      {hasText(detail.manaCost) ? (
        <div>
          <dt className="font-medium">Mana cost</dt>
          <dd>{detail.manaCost}</dd>
        </div>
      ) : null}
      {detail.manaValue !== undefined ? (
        <div>
          <dt className="font-medium">Mana value</dt>
          <dd>{detail.manaValue}</dd>
        </div>
      ) : null}
      {hasText(detail.typeLine) ? (
        <div>
          <dt className="font-medium">Type</dt>
          <dd>{detail.typeLine}</dd>
        </div>
      ) : null}
      {hasText(detail.oracleText) ? (
        <div>
          <dt className="font-medium">Oracle text</dt>
          <dd className="whitespace-pre-wrap">{detail.oracleText}</dd>
        </div>
      ) : null}
      {detail.colors?.length ? (
        <div>
          <dt className="font-medium">Colors</dt>
          <dd>{detail.colors.join(", ")}</dd>
        </div>
      ) : null}
      {detail.supertypes?.length ? (
        <div>
          <dt className="font-medium">Supertypes</dt>
          <dd>{detail.supertypes.join(", ")}</dd>
        </div>
      ) : null}
      {detail.subtypes?.length ? (
        <div>
          <dt className="font-medium">Subtypes</dt>
          <dd>{detail.subtypes.join(", ")}</dd>
        </div>
      ) : null}
    </dl>
  );
}

type CardDetailPopupProps = {
  card: CardPresentationCard;
  onClose: () => void;
};

type PopupDetailState =
  | { status: "loading" }
  | { status: "loaded"; detail: CardDetailBlock }
  | { status: "error" };

/**
 * Suite-wide card detail popup (DEC-151 part 2, rehosted by DEC-158). Name/image/ring
 * are already local and render immediately outside this popup; the popup fetches the
 * descriptive block on demand by oracle id from `GET /api/cards/:oracleId` (REQ-175,
 * FLOW-024), caches it in memory for the session (`lib/cardDetail.ts`) so a reopen
 * issues no repeat request, and shows a brief quiet loading state confined to this
 * content region — no branded splash, spinner takeover, progress bar, or overlay
 * resize (`screen-layout.md`). A failed/offline fetch degrades to a retry affordance
 * without blocking the surface's other controls (Remove, etc).
 *
 * It is portaled to `document.body` rather than layered `absolute inset-0` over the
 * image. As an image-bound box it inherited the image's 92x128px geometry, squeezing
 * 356px of detail into a 66px text column and pushing its own close control 37px past
 * the dialog's right edge (DEC-158). Portaled, it takes the overlay family's own
 * geometry — content-sized bottom sheet below 768px, View Context-width side panel at
 * 768px+, per `screen-layout.md`'s "Card detail popup" row — identically on all six
 * card surfaces, with no per-surface variant, because every surface renders this one
 * component.
 */
export function CardDetailPopup({ card, onClose }: CardDetailPopupProps): JSX.Element {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const [state, setState] = useState<PopupDetailState>(() => {
    const cached = peekCardDetail(card.cardId);
    return cached !== undefined ? { status: "loaded", detail: cached ?? EMPTY_CARD_DETAIL } : { status: "loading" };
  });
  const startedLoadedRef = useRef(state.status === "loaded");

  const loadDetail = useCallback(() => {
    setState({ status: "loading" });
    let cancelled = false;
    fetchCardDetail(card.cardId)
      .then((detail) => {
        if (cancelled) return;
        setState({ status: "loaded", detail: detail ?? EMPTY_CARD_DETAIL });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [card.cardId]);

  useEffect(() => {
    // A cache hit already seeded `state` above (no fetch, no loading flash); this
    // popup instance's whole lifetime is one open (it unmounts on close), so the
    // fetch — when needed — runs exactly once per mount.
    if (startedLoadedRef.current) {
      return undefined;
    }
    return loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <div className="card-detail-content" data-testid="card-detail-content">
          {state.status === "loading" ? (
            <p className="text-sm text-zinc-400" role="status" aria-live="polite" data-testid="card-detail-loading">
              Loading details…
            </p>
          ) : state.status === "error" ? (
            <div className="space-y-2" data-testid="card-detail-error">
              <p className="text-sm text-zinc-400">Details unavailable right now.</p>
              <button
                type="button"
                onClick={loadDetail}
                className="rounded-lg border border-zinc-600 bg-zinc-900/60 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800"
              >
                Retry
              </button>
            </div>
          ) : (
            <CardDetailFieldsList detail={state.detail} />
          )}
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
        // DEC-160: one container-relative sizing rule for all six card surfaces. The image
        // fills the width its host container affords and keeps its aspect ratio; the wrapper
        // no longer shrink-wraps (`w-fit`) around a fixed `max-h-32` box, which rendered an
        // identical 92x128px card on every surface and at every viewport. No size variant,
        // per-screen prop, or call-site height cap replaces it — a surface that needs a
        // different result changes its own container.
        <div className="relative mx-auto w-full">
          <img
            src={imageUrl}
            alt={card.name}
            className={joinClasses("h-auto w-full object-contain", imageClassName)}
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
        // D3: image-fail (and no-image) fallback shows the card name only — the locally
        // available identity — and reads no descriptive field and triggers no detail fetch
        // (DEC-078's offline no-fetch-on-failure guarantee preserved).
        <div
          className={joinClasses(
            "w-full text-sm text-zinc-200",
            imageFailed ? "motion-error" : undefined,
            fallbackClassName
          )}
          data-testid="card-presentation-fallback"
        >
          <p className="font-semibold text-zinc-100">{card.name}</p>
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
