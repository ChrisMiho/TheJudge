import { useId, useMemo } from "react";
import { CANONICAL_ZONE_ORDER } from "../lib/contextFlow";
import { getCardIdentityRingStyle } from "../lib/cardIdentityRing";
import { stackPositionTag } from "../lib/stackTags";
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
 * Small line-drawn signs, 16×16, stroked in the colour's light, on the card menu's Move to pills
 * (`in-depth-question.html`'s `SIGN_POOL`): a pool of fourteen arcane marks, of which seven are
 * dealt at random each time the menu opens, one per pill, no two alike. A sign no longer names
 * its zone — the word does that. Nothing filled in.
 */
const SIGN_POOL: string[][] = [
  ["M2.5 5.5h8.5v9H2.5z", "M5 5.5V3.2a.7.7 0 0 1 .7-.7h7.6a.7.7 0 0 1 .7.7v8.6"],
  ["M8 1.8 13 3.6v4.1c0 3.2-2.1 5.6-5 6.9-2.9-1.3-5-3.7-5-6.9V3.6z", "M8 5v5.2"],
  [
    "M5.6 3h4.8a.8.8 0 0 1 .8.8v6.4a.8.8 0 0 1-.8.8H5.6a.8.8 0 0 1-.8-.8V3.8a.8.8 0 0 1 .8-.8z",
    "M3.4 5.2 2.6 11.6",
    "M12.6 5.2l.8 6.4"
  ],
  ["M4 14V6.2a4 4 0 0 1 8 0V14", "M2.5 14h11", "M8 6.4v3.4M6.5 7.9h3"],
  ["M8 1.6c.5 3.7 2.7 5.9 6.4 6.4-3.7.5-5.9 2.7-6.4 6.4-.5-3.7-2.7-5.9-6.4-6.4 3.7-.5 5.9-2.7 6.4-6.4z"],
  [
    "M4.7 2.2h6.6a1.1 1.1 0 0 1 1.1 1.1v9.4a1.1 1.1 0 0 1-1.1 1.1H4.7a1.1 1.1 0 0 1-1.1-1.1V3.3a1.1 1.1 0 0 1 1.1-1.1z",
    "M6.2 2.2v11.6M8.6 5h2.2"
  ],
  ["M3 12.6 2.4 5.2l3.6 2.9L8 3.6l2 4.5 3.6-2.9-.6 7.4z", "M3.3 12.6h9.4"],
  ["M10.2 2.4a6 6 0 1 0 3.4 9.9 5.2 5.2 0 0 1-3.4-9.9z"],
  [
    "M1.8 8c1.6-3 3.7-4.5 6.2-4.5S12.6 5 14.2 8c-1.6 3-3.7 4.5-6.2 4.5S3.4 11 1.8 8z",
    "M9.998 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"
  ],
  ["M8 3a3 3 0 1 1-6 0 3 3 0 0 1 6 0z", "M7.2 8.2 13.5 14.5M11 12l1.6-1.6M9.3 10.3l1.6-1.6"],
  ["M4 2.2h8M4 13.8h8M5 2.2v2.4L8 8l-3 3.4v2.4M11 2.2v2.4L8 8l3 3.4v2.4"],
  ["M8 1.8v12.4M8 5.4l4-2.4M8 5.4 4 3M8 10.6l4 2.4M8 10.6 4 13"],
  ["M13.4 5a2.4 2.4 0 1 1-4.8 0 2.4 2.4 0 0 1 4.8 0z", "M8.9 6.9 2.5 13.3M9.4 9.6l-3 3M6.4 6.6l-3 3"],
  [
    "M13.6 8a5.6 5.6 0 1 1-11.2 0 5.6 5.6 0 0 1 11.2 0z",
    "M9.4 8a1.4 1.4 0 1 1-2.8 0 1.4 1.4 0 0 1 2.8 0z",
    "M8 2.4v1.8M8 11.8v1.8M2.4 8h1.8M11.8 8h1.8"
  ]
];

function dealSigns(count: number): string[][] {
  const pool = SIGN_POOL.slice();
  for (let k = pool.length - 1; k > 0; k -= 1) {
    const j = Math.floor(Math.random() * (k + 1));
    [pool[k], pool[j]] = [pool[j]!, pool[k]!];
  }
  return pool.slice(0, count);
}

/**
 * REQ-008/REQ-209: a tap on a shelf card opens this menu — built on the suite's one
 * shared pop-up shell (REQ-208) rather than a bespoke pointing pop-over, so it is a
 * bottom sheet below the `--sheet-breakpoint` token and a centred floating card above
 * it, like every other overlay in the redesign. Takes the mockup's Card actions look: the
 * card's thumbnail and zone in the head, **Move to** as a wrap of small pills with the
 * current zone lit, the order as one segmented pill (Down / Up / To top on the Stack, where
 * "top" and "bottom" carry meaning; Left / Right elsewhere, where reordering is cosmetic,
 * REQ-209 A10), and **Card details** and **Remove from the `<zone>`** as tray rows.
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
  const signs = useMemo(() => dealSigns(otherZones.length), [otherZones.length]);

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
        <div className="act-head">
          <span className="thumb card-identity-ring" style={getCardIdentityRingStyle(card.colors)} aria-hidden="true">
            {card.imageUrl ? <img src={card.imageUrl} alt="" /> : null}
          </span>
          <div>
            <span className="zone">
              {ZONE_LABELS[zoneId]}
              {isStack ? ` · ${stackPositionTag(cardIndex, cardCount)}` : ""}
            </span>
            <h2 id={titleId}>{card.name}</h2>
          </div>
        </div>
      }
    >
      <div className="act-body">
        <span className="lbl">Move to</span>
        <div className="act-zones">
          {otherZones.map((zone, index) => (
            <button key={zone} type="button" onClick={() => onMoveTo(zone)} className="motion-focus">
              <span className="zg" aria-hidden="true">
                <svg viewBox="0 0 16 16">
                  {(signs[index] ?? []).map((path) => (
                    <path key={path} d={path} />
                  ))}
                </svg>
              </span>
              {ZONE_LABELS[zone]}
            </button>
          ))}
        </div>

        {cardCount > 1 && (
          <div className="act-order">
            <span className="lbl">{isStack ? "Order on the Stack" : "Order"}</span>
            <div role="group" aria-label="Reorder" className="seg">
              <button type="button" onClick={handleEarlier}>
                <span className="glyph">{isStack ? "↓" : "‹"}</span>{" "}
                <span className="w">{isStack ? "Down" : "Left"}</span>
              </button>
              <button type="button" onClick={handleLater}>
                {isStack ? (
                  <>
                    <span className="glyph">↑</span> <span className="w">Up</span>
                  </>
                ) : (
                  <>
                    <span className="w">Right</span> <span className="glyph">›</span>
                  </>
                )}
              </button>
              {isStack && (
                <button type="button" onClick={handleToTop}>
                  <span className="glyph">⤒</span> <span className="w">To top</span>
                </button>
              )}
            </div>
          </div>
        )}

        <div className="act-menu">
          <button type="button" onClick={onShowDetails} className="motion-focus">
            <span className="glyph" aria-hidden="true">
              ⓘ
            </span>
            <span>Card details</span>
            <span className="chev" aria-hidden="true">
              ›
            </span>
          </button>
          <button type="button" onClick={onRemove} className="card-state-remove-trigger danger motion-focus">
            <span className="glyph" aria-hidden="true">
              ✕
            </span>
            <span>{`Remove from the ${ZONE_LABELS[zoneId]}`}</span>
          </button>
        </div>
      </div>
    </SheetShell>
  );
}
