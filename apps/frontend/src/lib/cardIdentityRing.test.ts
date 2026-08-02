import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CARD_COLOR_ORDER,
  CARD_IDENTITY_COLORS,
  CARD_IDENTITY_SILVER_GRAY,
  getCardIdentityRing,
  getCardIdentityRingStyle
} from "./cardIdentityRing";

describe("Frontend - MTG Assistant", () => {
describe("getCardIdentityRing", () => {
  it("exports the stable WUBRG order", () => {
    expect(CARD_COLOR_ORDER).toEqual(["W", "U", "B", "R", "G"]);
  });

  it.each(CARD_COLOR_ORDER)("maps %s to its semantic ring color", (color) => {
    expect(getCardIdentityRing([color])).toBe(CARD_IDENTITY_COLORS[color]);
  });

  it("deduplicates, normalizes, and orders multicolor identities by WUBRG", () => {
    expect(getCardIdentityRing(["g", "W", "b", "u", "R", "w"])).toBe(
      `linear-gradient(90deg, ${CARD_COLOR_ORDER.map((color) => CARD_IDENTITY_COLORS[color]).join(", ")})`
    );
  });

  it.each([
    ["missing", undefined],
    ["empty", []],
    ["wholly unknown", ["C", "purple"]]
  ] as const)("uses cool silver-gray for %s colors", (_label, colors) => {
    expect(getCardIdentityRing(colors)).toBe(CARD_IDENTITY_SILVER_GRAY);
  });

  it("uses only the recognized subset of mixed known and unknown colors", () => {
    expect(getCardIdentityRing(["purple", "r", "C", "U"])).toBe(
      `linear-gradient(90deg, ${CARD_IDENTITY_COLORS.U}, ${CARD_IDENTITY_COLORS.R})`
    );
  });

  it("provides a typed custom-property style for consumers", () => {
    expect(getCardIdentityRingStyle(["U"])).toEqual({
      "--card-identity-ring": CARD_IDENTITY_COLORS.U
    });
  });
});

describe("card identity ring CSS", () => {
  it("draws one non-interactive custom-property border without tinting the container", () => {
    const appCss = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");
    const ringRule = appCss.slice(appCss.indexOf(".card-identity-ring"), appCss.indexOf(":root"));

    expect(ringRule).toContain(".card-identity-ring::before");
    expect(ringRule).toContain("background: var(--card-identity-ring");
    expect(ringRule).toContain("pointer-events: none");
    expect(ringRule).toContain("mask-composite: exclude");
    expect(ringRule).not.toContain("background-color");
    expect(ringRule).not.toContain("animation");
    expect(ringRule).not.toContain("--accent");
  });
});
});
