import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { PALETTES } from "./palettes";

const tokensCss = readFileSync(resolve(process.cwd(), "src/styles/tokens.css"), "utf8");

function profileBlock(id: string): string {
  const marker = `[data-profile="${id}"] {`;
  const start = tokensCss.indexOf(marker);
  expect(start, `tokens.css has a block for ${id}`).toBeGreaterThanOrEqual(0);
  return tokensCss.slice(start, tokensCss.indexOf("}", start));
}

function hexOf(block: string, name: string): string {
  const match = new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`).exec(block);
  expect(match, `${name} is a hex in the block`).not.toBeNull();
  return match![1].toLowerCase();
}

function toHex(triple: string): string {
  return `#${triple
    .split(" ")
    .map((part) => Number(part).toString(16).padStart(2, "0"))
    .join("")}`;
}

describe("REQ-216: palettes.ts agrees with the one token source (tokens.css)", () => {
  it.each(PALETTES.map((palette) => [palette.id, palette] as const))("%s shares its accent values with tokens.css", (id, palette) => {
    const block = profileBlock(id);
    expect(toHex(palette.accent)).toBe(hexOf(block, "--accent"));
    expect(toHex(palette.accentStrong)).toBe(hexOf(block, "--accent-strong"));
    expect(toHex(palette.accentSoft)).toBe(hexOf(block, "--accent-soft"));
    expect(toHex(palette.accentContrast)).toBe(hexOf(block, "--accent-contrast"));
    expect(toHex(palette.focusRing)).toBe(hexOf(block, "--accent-soft"));
  });

  it("the shared ground matches --surface-ground", () => {
    const ground = /--surface-ground:\s*(#[0-9a-fA-F]{6})/.exec(tokensCss)![1].toLowerCase();
    PALETTES.forEach((palette) => expect(toHex(palette.ground)).toBe(ground));
  });
});
