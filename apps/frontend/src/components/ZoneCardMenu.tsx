import { useId } from "react";
import { CANONICAL_ZONE_ORDER } from "../lib/contextFlow";
import { ZONE_LABELS } from "../lib/zoneLabels";
import { SheetShell } from "./SheetShell";
import type { ZoneCardItem, ZoneId } from "../types";

export type ZoneCardMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  card: ZoneCardItem;
  zoneId: ZoneId;
  /** This card's bottom-to-top index and the zone's total count — used to compute the
   * reorder buttons' target index; only meaningful while `isOpen`. */
  cardIndex: number;
  cardCount: number;
  onMoveTo: (zone: ZoneId) => void;
  /** `toIndexAfterRemoval` — the same contract the shelf's drag reorder computes
   * (`lib/shelfDragReorder.ts`), so a button press and a drag land the card identically. */
  onReorder: (toIndexAfterRemoval: number) => void;
  onShowDetails: () => void;
  onRemove: () => void;
};

/**
 * REQ-008/REQ-209: a tap on a shelf card opens this menu — built on the suite's one
 * shared pop-up shell (REQ-208) rather than a bespoke pointing pop-over, so it is a
 * bottom sheet below the `--sheet-breakpoint` token and a centred floating card above
 * it, like every other overlay in the redesign. Offers **Move to** (every other zone,
 * as pills), an **order** control (Down / Up / To top on the Stack, where "top" and
 * "bottom" carry meaning; Left / Right elsewhere, where reordering is cosmetic, REQ-209
 * A10), **Card details**, and **Remove from the `<zone>`**.
 */
export function ZoneCardMenu({
  isOpen,
  onClose,
  card,
  zoneId,
  cardIndex,
  cardCount,
  onMoveTo,
  onReorder,
  onShowDetails,
  onRemove
}: ZoneCardMenuProps): JSX.Element | null {
  const titleId = useId();
  const isStack = zoneId === "stack";
  const otherZones = CANONICAL_ZONE_ORDER.filter((zone) => zone !== zoneId);

  function handleEarlier(): void {
    onReorder(Math.max(0, cardIndex - 1));
  }

  function handleLater(): void {
    onReorder(cardIndex + 1);
  }

  function handleToTop(): void {
    onReorder(cardCount);
  }

  return (
    <SheetShell
      isOpen={isOpen}
      onClose={onClose}
      closeLabel={`Close actions for ${card.name}`}
      titleId={titleId}
      testId="zone-card-menu"
      head={
        <p id={titleId} className="font-semibold text-zinc-100">
          {card.name}
        </p>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-300">Move to</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {otherZones.map((zone) => (
              <button
                key={zone}
                type="button"
                onClick={() => onMoveTo(zone)}
                className="motion-hover motion-press motion-focus rounded-lg border border-zinc-600 bg-zinc-800/70 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-700/80"
              >
                {ZONE_LABELS[zone]}
              </button>
            ))}
          </div>
        </div>

        {cardCount > 1 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-300">
              {isStack ? "Order on the Stack" : "Order"}
            </p>
            <div role="group" aria-label="Reorder" className="mt-2 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleEarlier}
                className="motion-hover motion-press motion-focus rounded-lg border border-zinc-600 bg-zinc-800/70 px-2 py-1.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-700/80"
              >
                {isStack ? "↓ Down" : "‹ Left"}
              </button>
              <button
                type="button"
                onClick={handleLater}
                className="motion-hover motion-press motion-focus rounded-lg border border-zinc-600 bg-zinc-800/70 px-2 py-1.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-700/80"
              >
                {isStack ? "↑ Up" : "Right ›"}
              </button>
              {isStack && (
                <button
                  type="button"
                  onClick={handleToTop}
                  className="motion-hover motion-press motion-focus rounded-lg border border-zinc-600 bg-zinc-800/70 px-2 py-1.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-700/80"
                >
                  ⤒ To top
                </button>
              )}
            </div>
          </div>
        )}

        <div className="space-y-1 border-t border-zinc-700/70 pt-3">
          <button
            type="button"
            onClick={onShowDetails}
            className="motion-hover motion-press motion-focus flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-800"
          >
            <span>Card details</span>
            <span aria-hidden="true">{"›"}</span>
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="card-state-remove-trigger motion-hover motion-press motion-focus w-full rounded-lg px-2 py-2 text-left text-sm font-semibold text-red-300 transition hover:bg-red-950/40"
          >
            {`Remove from the ${ZONE_LABELS[zoneId]}`}
          </button>
        </div>
      </div>
    </SheetShell>
  );
}
