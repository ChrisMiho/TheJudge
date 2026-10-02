import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { fetchCardDetail, peekCardDetail, type CardDetailBlock } from "../lib/cardDetail";
import { getCardIdentityRing } from "../lib/cardIdentityRing";
import { deriveCardArtCropFromImageUrl, deriveCardArtCropUrl, deriveCardImageUrl } from "../lib/cardImage";
import { fetchCardPrintings, peekCardPrintings } from "../lib/trade/fetchCardPrintings";
import { SheetShell } from "./SheetShell";

/** The identity fields every card surface needs to render a tile — image, name, and
 * the oracle id used to fetch detail on demand (REQ-175, FLOW-024). `ZoneCardItem`
 * and the frozen lookup wire card carry a full `imageUrl`; `CardMetadataItem`
 * (REQ-174, Slice C) instead carries `imageId`, a representative printing id this
 * component derives the url from — both shapes satisfy this type. */
export type CardPresentationCard = {
  cardId: string;
  name: string;
  imageUrl?: string;
  imageId?: string;
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

/** A representative USD price for the fact chip (slice L, requirement #10):
 * the first printing's non-foil price, falling back to its foil price, then
 * to the next printing — the cheapest-available reading, not a specific
 * printing's price (the suite's six card surfaces show one generic card, not
 * a chosen printing). `undefined` when no printing carries either price. */
function representativePrice(printings: ReadonlyArray<{ usd: number | null; usdFoil: number | null }> | undefined): number | undefined {
  for (const printing of printings ?? []) {
    const price = printing.usd ?? printing.usdFoil;
    if (price !== null && price !== undefined) {
      return price;
    }
  }
  return undefined;
}

function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Look-matching pass (slice L, requirement #10): the card detail popup takes
 * `flow.css:280-317`'s `.detail-panel` — an art-crop hero with the name and
 * mana cost over it, a type line with a colour-identity dot (reusing
 * `getCardIdentityRing`, the same source `CardPresentation`'s own card-tile
 * ring already draws from — no new colour mapping), the oracle text in a lit
 * box, and three fact chips (Mana value, Subtypes, Price). Price reads the
 * same `GET /api/cards/:oracleId/prices` endpoint Trade Balancer's printing
 * picker and the card scanner's match confirmation already call (no new API
 * route) — a representative (cheapest-available) printing price, since this
 * popup shows one generic card, not a chosen printing. */
function CardDetailFieldsList({
  card,
  detail,
  price,
  titleId
}: {
  card: CardPresentationCard;
  detail: CardDetailBlock;
  price: number | undefined;
  titleId: string;
}): JSX.Element {
  const artCropUrl =
    deriveCardArtCropUrl(card.imageId) || deriveCardArtCropFromImageUrl(card.imageUrl) || undefined;
  const identityRing = getCardIdentityRing(detail.colors);

  return (
    <div className="card-detail-hero-wrap" data-testid="card-detail-fields">
      <div className="card-detail-hero">
        {artCropUrl ? (
          <img src={artCropUrl} alt="" aria-hidden="true" className="card-detail-hero-img" />
        ) : null}
        <div className="card-detail-hero-title">
          <h3 id={titleId} className="card-detail-hero-name">{card.name}</h3>
          {hasText(detail.manaCost) ? (
            <span className="card-detail-hero-cost">{detail.manaCost}</span>
          ) : null}
        </div>
      </div>
      <div className="card-detail-body">
        {hasText(detail.typeLine) ? (
          <p className="card-detail-typeline">
            <span
              aria-hidden="true"
              className="card-detail-color-dot"
              style={{ background: identityRing }}
            />
            <span>{detail.typeLine}</span>
          </p>
        ) : null}
        {hasText(detail.oracleText) ? (
          <p className="card-detail-oracle whitespace-pre-wrap">{detail.oracleText}</p>
        ) : null}
        <dl className="card-detail-facts">
          <div className="card-detail-fact">
            <dt>Mana value</dt>
            <dd>{detail.manaValue}</dd>
          </div>
          <div className="card-detail-fact">
            <dt>Subtypes</dt>
            <dd>{detail.subtypes?.length ? detail.subtypes.join(", ") : "—"}</dd>
          </div>
          <div className="card-detail-fact card-detail-fact-price">
            <dt>Price</dt>
            <dd>{price !== undefined ? formatUsd(price) : "—"}</dd>
          </div>
        </dl>
      </div>
    </div>
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
 * It is hosted on the shared `SheetShell` (REQ-208, REQ-128) rather than layered
 * `absolute inset-0` over the image. As an image-bound box it inherited the image's
 * 92x128px geometry, squeezing 356px of detail into a 66px text column and pushing its
 * own close control 37px past the dialog's right edge (DEC-158). Hosted on the shared
 * shell, it takes that overlay family's own geometry — a bottom sheet below the
 * `--sheet-breakpoint` token (600px), a floating card centred in the viewport from it
 * up — identically on all six card surfaces, with no per-surface variant, because every
 * surface renders this one component.
 */
export function CardDetailPopup({ card, onClose }: CardDetailPopupProps): JSX.Element {
  const titleId = useId();

  const [state, setState] = useState<PopupDetailState>(() => {
    const cached = peekCardDetail(card.cardId);
    return cached !== undefined ? { status: "loaded", detail: cached ?? EMPTY_CARD_DETAIL } : { status: "loading" };
  });
  const startedLoadedRef = useRef(state.status === "loaded");

  // Look-matching pass (slice L): the fact chip's price, read from the same
  // `GET /api/cards/:oracleId/prices` endpoint Trade Balancer and the card
  // scanner already call (`lib/trade/fetchCardPrintings.ts`) — a separate,
  // independently cached fetch from the oracle-id detail block above, so a
  // slow/failed price lookup never blocks or retries the descriptive fields.
  // `undefined` (no price found or still loading) renders the chip's "—"
  // placeholder rather than an error state — this popup's other fields stay
  // useful with no price at all (REQ-175's existing degrade pattern).
  const [price, setPrice] = useState<number | undefined>(() => {
    const cached = peekCardPrintings(card.cardId);
    return cached !== undefined ? representativePrice(cached?.printings) : undefined;
  });

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

  useEffect(() => {
    if (peekCardPrintings(card.cardId) !== undefined) {
      return undefined;
    }
    let cancelled = false;
    fetchCardPrintings(card.cardId)
      .then((block) => {
        if (cancelled) return;
        setPrice(representativePrice(block?.printings));
      })
      .catch(() => {
        // Price is a nice-to-have fact chip, not a gate — a failed lookup just
        // keeps the chip's "—" placeholder, with no retry affordance of its own.
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SheetShell
      isOpen
      onClose={onClose}
      closeLabel={`Close details for ${card.name}`}
      titleId={titleId}
      testId="card-detail-popup"
      head={
        // Look-matching pass (slice L): once loaded, the name renders visibly
        // inside the art-crop hero below (`flow.css`'s `.detail-panel .art h2`),
        // which then carries `titleId` itself — rendering it a second time here
        // would duplicate both the DOM id and the visible text. Before that (the
        // loading/error states, which show no hero), this `sr-only` title is the
        // dialog's only accessible name.
        state.status === "loaded" ? undefined : (
          <p id={titleId} className="sr-only">
            {card.name}
          </p>
        )
      }
    >
      <div data-testid="card-detail-content">
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
          <CardDetailFieldsList card={card} detail={state.detail} price={price} titleId={titleId} />
        )}
      </div>
    </SheetShell>
  );
}

export function CardPresentation({
  card,
  className,
  imageClassName,
  fallbackClassName,
  actions
}: CardPresentationProps): JSX.Element {
  const imageUrl = card.imageUrl?.trim() || deriveCardImageUrl(card.imageId) || undefined;
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
