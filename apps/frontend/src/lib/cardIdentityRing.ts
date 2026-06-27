import type { CSSProperties } from "react";

export const CARD_COLOR_ORDER = ["W", "U", "B", "R", "G"] as const;

export type CardColor = (typeof CARD_COLOR_ORDER)[number];

export const CARD_IDENTITY_COLORS: Readonly<Record<CardColor, string>> = {
  W: "rgb(248 231 185 / 0.55)",
  U: "rgb(14 165 233 / 0.55)",
  B: "rgb(113 113 122 / 0.55)",
  R: "rgb(239 68 68 / 0.55)",
  G: "rgb(34 197 94 / 0.55)"
};

export const CARD_IDENTITY_SILVER_GRAY = "rgb(148 163 184 / 0.55)";
export const CARD_IDENTITY_RING_PROPERTY = "--card-identity-ring" as const;

export type CardIdentityRingStyle = CSSProperties & Record<typeof CARD_IDENTITY_RING_PROPERTY, string>;

export function getCardIdentityRing(colors: readonly string[] | undefined): string {
  const normalizedColors = new Set(colors?.map((color) => color.trim().toUpperCase()));
  const recognizedColors = CARD_COLOR_ORDER.filter((color) => normalizedColors.has(color));

  if (recognizedColors.length === 0) {
    return CARD_IDENTITY_SILVER_GRAY;
  }

  if (recognizedColors.length === 1) {
    return CARD_IDENTITY_COLORS[recognizedColors[0]];
  }

  return `linear-gradient(90deg, ${recognizedColors
    .map((color) => CARD_IDENTITY_COLORS[color])
    .join(", ")})`;
}

export function getCardIdentityRingStyle(colors: readonly string[] | undefined): CardIdentityRingStyle {
  return {
    [CARD_IDENTITY_RING_PROPERTY]: getCardIdentityRing(colors)
  };
}
