import { describe, expect, it } from "vitest";
import { deriveCardImageUrl } from "./cardImage";

describe("Frontend - Shared - deriveCardImageUrl", () => {
  it("derives the normal-size front-face url from a single-faced printing's real Scryfall id", () => {
    // Real printing id from the committed Scryfall bulk source (default-cards.json):
    // Lightning Bolt, Secret Lair Drop (set "sld"). Scryfall's own served url is
    // `.../normal/front/0/2/0277c0b1-da97-49c1-a539-7fbaa1f77419.jpg?1778748653` — the
    // derived url matches everything but the cache-busting query string, which is not
    // required to resolve the image.
    expect(deriveCardImageUrl("0277c0b1-da97-49c1-a539-7fbaa1f77419")).toBe(
      "https://cards.scryfall.io/normal/front/0/2/0277c0b1-da97-49c1-a539-7fbaa1f77419.jpg"
    );
  });

  it("derives the same front-face url shape for a real double-faced (transform) printing's id", () => {
    // REQ-174 (Slice C): the derived url must resolve for a double-faced
    // representative printing too. Real printing id from the committed Scryfall
    // bulk source: "Balamb Garden, SeeD Academy // Balamb Garden, Airborne"
    // (layout "transform", set "fin") — Scryfall's own served front-face url is
    // `.../normal/front/0/0/001e9f20-5b15-41cb-bf82-46172decc235.jpg?1748707838`.
    // Scryfall composes a double-faced card's front-face url from the printing id
    // with the same `front` path segment a single-faced card uses (there is no
    // separate "front id" vs "back id" — one printing id, two face paths), so no
    // card-shape branching is needed in `deriveCardImageUrl`.
    expect(deriveCardImageUrl("001e9f20-5b15-41cb-bf82-46172decc235")).toBe(
      "https://cards.scryfall.io/normal/front/0/0/001e9f20-5b15-41cb-bf82-46172decc235.jpg"
    );
  });

  it("trims whitespace before deriving", () => {
    expect(deriveCardImageUrl("  0277c0b1-da97-49c1-a539-7fbaa1f77419  ")).toBe(
      "https://cards.scryfall.io/normal/front/0/2/0277c0b1-da97-49c1-a539-7fbaa1f77419.jpg"
    );
  });

  it("returns an empty string for a missing, empty, or too-short id, never throwing", () => {
    expect(deriveCardImageUrl(undefined)).toBe("");
    expect(deriveCardImageUrl(null)).toBe("");
    expect(deriveCardImageUrl("")).toBe("");
    expect(deriveCardImageUrl("a")).toBe("");
  });
});
