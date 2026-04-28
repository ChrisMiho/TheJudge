import type { ReactNode } from "react";
import type { CardMetadataItem } from "../types";

type CardSelectionPreviewProps = {
  card: CardMetadataItem;
  contextTitle: string;
  contextContent: ReactNode;
  action?: ReactNode;
};

function formatMetaList(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "N/A";
}

export function CardSelectionPreview({
  card,
  contextTitle,
  contextContent,
  action
}: CardSelectionPreviewProps): JSX.Element {
  return (
    <article className="rounded-2xl border border-slate-600 bg-slate-800/75 p-4 shadow-[0_14px_34px_-24px_rgba(37,99,235,0.9)]">
      <div className="grid gap-3 sm:grid-cols-[minmax(180px,220px)_1fr]">
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            className="w-full rounded-xl border border-slate-600 bg-slate-950/40 object-contain p-1"
          />
        ) : (
          <div className="flex min-h-56 w-full items-center justify-center rounded-xl border border-dashed border-slate-600 bg-slate-900/40 text-xs text-slate-400">
            No image
          </div>
        )}
        <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-600/80 bg-slate-900/45 p-3">
          <div>
            <h2 className="text-base font-semibold text-slate-100">{card.name}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{card.oracleText}</p>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-slate-300">
            <dt className="font-semibold text-slate-200">Mana Cost</dt>
            <dd>{card.manaCost || "N/A"}</dd>
            <dt className="font-semibold text-slate-200">Mana Value</dt>
            <dd>{card.manaValue}</dd>
            <dt className="font-semibold text-slate-200">Type Line</dt>
            <dd>{card.typeLine || "N/A"}</dd>
            <dt className="font-semibold text-slate-200">Colors</dt>
            <dd>{formatMetaList(card.colors)}</dd>
            <dt className="font-semibold text-slate-200">Supertypes</dt>
            <dd>{formatMetaList(card.supertypes)}</dd>
            <dt className="font-semibold text-slate-200">Subtypes</dt>
            <dd>{formatMetaList(card.subtypes)}</dd>
          </dl>
          <div className="space-y-2 rounded-lg border border-slate-600/70 bg-slate-900/50 p-2">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">{contextTitle}</p>
            {contextContent}
          </div>
          {action}
        </div>
      </div>
    </article>
  );
}
