/**
 * REQ-008/REQ-209: the Stack's shelf tags. One card reads TOP; two read
 * BOTTOM / TOP; from three the ends read BOTTOM and TOP and the cards between
 * count down from the top in resolving order — TOP, 2ND, 3RD… BOTTOM — so a
 * tag always says where a card sits in the stack. Only the Stack's shelf
 * calls this; every other zone's tiles show no position tag.
 *
 * `index` is the card's bottom-to-top array position (0 = bottom, matching
 * `ZoneCardItem[]`'s existing add-order-is-bottom-to-top contract); `total`
 * is the zone's card count.
 */
export function stackPositionTag(index: number, total: number): string {
  if (total <= 0) {
    return "";
  }
  if (index === total - 1) {
    return "TOP";
  }
  if (index === 0) {
    return "BOTTOM";
  }
  const fromTop = total - index;
  const suffix = fromTop === 2 ? "ND" : fromTop === 3 ? "RD" : "TH";
  return `${fromTop}${suffix}`;
}
