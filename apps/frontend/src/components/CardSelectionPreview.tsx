import type { ReactNode } from "react";
import type { CardMetadataItem } from "../types";
import { CardPresentation } from "./CardPresentation";

type CardSelectionPreviewProps = {
  card: CardMetadataItem;
  contextTitle: string;
  contextContent: ReactNode;
  showContextSection?: boolean;
  action?: ReactNode;
};

export function CardSelectionPreview({
  card,
  contextTitle,
  contextContent,
  showContextSection = true,
  action
}: CardSelectionPreviewProps): JSX.Element {
  return (
    <article className="motion-enter rounded-2xl border border-zinc-600 bg-zinc-800/75 p-4 shadow-[0_14px_34px_-24px_rgba(0,0,0,0.5)]">
      <div className="grid gap-3 sm:grid-cols-[minmax(160px,200px)_1fr]">
        {/* Compact image + suite-wide corner detail popup (DEC-151 parts 1-2): the image no
            longer renders at a fixed large size, and oracle text / metadata is reached via
            the popup rather than stacked under the image or duplicated in the panel below.
            When no image is available, CardPresentation's own text-first fallback renders
            here directly and spans both columns so it is not squeezed into the narrow image
            column (DEC-78's unchanged missing-image behavior); the heading below still
            carries the card name as an accessible heading in that case. */}
        <CardPresentation card={card} className="w-full" fallbackClassName="sm:col-span-2" />
        <div className="flex flex-col justify-between gap-3 rounded-xl border border-zinc-600/80 bg-zinc-900/45 p-3">
          <h2 className="text-base font-semibold text-zinc-100">{card.name}</h2>
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
