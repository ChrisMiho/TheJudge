import type { ReactNode } from "react";
import type { CardMetadataItem } from "../types";

type CardSelectionPreviewProps = {
  card: CardMetadataItem;
  contextTitle: string;
  contextContent: ReactNode;
  showContextSection?: boolean;
  action?: ReactNode;
};

function formatMetaList(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "N/A";
}

export function CardSelectionPreview({
  card,
  contextTitle,
  contextContent,
  showContextSection = true,
  action
}: CardSelectionPreviewProps): JSX.Element {
  return (
    <article className="motion-enter rounded-2xl border border-zinc-600 bg-zinc-800/75 p-4 shadow-[0_14px_34px_-24px_rgba(0,0,0,0.5)]">
      <div className="grid gap-3 sm:grid-cols-[minmax(180px,220px)_1fr]">
        {card.imageUrl ? (
          /* Height-capped below `sm` so the preview does not push the add action far past
             the fold; the cap stays generous enough that the card's own printed text
             remains readable, which is what lets the duplicate paragraph below go
             (DEC-148, REQ-125). At `sm+` the image is already column-constrained. */
          <img
            src={card.imageUrl}
            alt={card.name}
            className="mx-auto max-h-[17rem] w-auto rounded-xl border border-zinc-600 bg-zinc-950/40 object-contain p-1 sm:max-h-none sm:w-full"
          />
        ) : (
          <div className="card-preview-placeholder flex min-h-56 w-full items-center justify-center rounded-xl border border-dashed border-zinc-600 bg-zinc-900/40 text-xs text-zinc-400">
            No image
          </div>
        )}
        <div className="flex flex-col justify-between gap-3 rounded-xl border border-zinc-600/80 bg-zinc-900/45 p-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">{card.name}</h2>
            {/* Below `sm` the card image is large enough to read its own printed text, so
                repeating it here only pushed the add action further down. At `sm+` the image
                sits in a narrow column where that text is not legible, and with no image at
                all this is the only place the text appears — both keep it (DEC-148). */}
            <p
              className={`mt-2 text-sm leading-relaxed text-zinc-300${
                card.imageUrl ? " hidden sm:block" : ""
              }`}
            >
              {card.oracleText}
            </p>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-zinc-300">
            <dt className="font-semibold text-zinc-200">Mana Cost</dt>
            <dd>{card.manaCost || "N/A"}</dd>
            <dt className="font-semibold text-zinc-200">Mana Value</dt>
            <dd>{card.manaValue}</dd>
            <dt className="font-semibold text-zinc-200">Type Line</dt>
            <dd>{card.typeLine || "N/A"}</dd>
            <dt className="font-semibold text-zinc-200">Colors</dt>
            <dd>{formatMetaList(card.colors)}</dd>
            <dt className="font-semibold text-zinc-200">Supertypes</dt>
            <dd>{formatMetaList(card.supertypes)}</dd>
            <dt className="font-semibold text-zinc-200">Subtypes</dt>
            <dd>{formatMetaList(card.subtypes)}</dd>
          </dl>
          {showContextSection && (
            <div className="space-y-2 rounded-lg border border-zinc-600/70 bg-zinc-900/50 p-2">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-300">{contextTitle}</p>
              {contextContent}
            </div>
          )}
          {action}
        </div>
      </div>
    </article>
  );
}
