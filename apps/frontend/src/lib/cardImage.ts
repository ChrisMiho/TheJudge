/**
 * REQ-174 (Slice C): derives a Scryfall printing's normal-size front-face
 * image url from its printing id, matching Scryfall's own CDN layout
 * (`https://cards.scryfall.io/normal/front/<id[0]>/<id[1]>/<id>.jpg`). The
 * shared `cardMetadata` index stores a representative-printing id instead of
 * a full ~90-char url; every consumer derives the url through this one
 * function so the template lives in exactly one place.
 *
 * The `front` path segment composes identically from the id for a
 * single-faced card and for a double-faced card's front face — Scryfall does
 * not need a separate back-face id to resolve the front image, so no
 * card-shape branching belongs here. The backend price route's committed
 * artifact (Slice A) and the Trade Balancer's printing picker (Slice D)
 * derive each printing's image the same way, from the printing id the price
 * route returns.
 */
export function deriveCardImageUrl(printingId: string | undefined | null): string {
  const trimmed = printingId?.trim() ?? "";
  if (trimmed.length < 2) {
    return "";
  }
  return `https://cards.scryfall.io/normal/front/${trimmed[0]}/${trimmed[1]}/${trimmed}.jpg`;
}
