import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { applyPalette } from "./applyPalette";
import { getPaletteById, PALETTES, resolveColorlessPalette } from "./palettes";

const blue = getPaletteById("blue")!;
const white = getPaletteById("white")!;

const overrideVars = ["--accent", "--accent-strong", "--accent-soft", "--accent-contrast", "--wash-tint", "--focus-ring"];

const tokensCss = readFileSync(resolve(process.cwd(), "src/styles/tokens.css"), "utf8");
const indexHtml = readFileSync(resolve(process.cwd(), "index.html"), "utf8");

function tokenAccent(id: string): string {
  const start = tokensCss.indexOf(`[data-profile="${id}"] {`);
  const block = tokensCss.slice(start, tokensCss.indexOf("}", start));
  return /--accent:\s*(#[0-9a-fA-F]{6})/.exec(block)![1].toLowerCase();
}

function themeColor(): string | null {
  return document.head.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.content ?? null;
}

describe("Frontend - Theme", () => {
describe("applyPalette", () => {
  afterEach(() => {
    const root = document.documentElement;
    delete root.dataset.theme;
    delete root.dataset.themeMotif;
    root.removeAttribute("data-profile");
    root.removeAttribute("data-accent");
    overrideVars.forEach((name) => root.style.removeProperty(name));
  });

  it("selects the profile in tokens.css by data-profile and writes no inline colour for a built-in profile", () => {
    applyPalette(white);

    const root = document.documentElement;
    expect(root.dataset.theme).toBe("white");
    expect(root.dataset.themeMotif).toBe(white.motif);
    expect(root.getAttribute("data-profile")).toBe("white");
    overrideVars.forEach((name) => expect(root.style.getPropertyValue(name)).toBe(""));
  });

  it("is idempotent when applying the same palette twice", () => {
    applyPalette(blue);
    applyPalette(blue);

    expect(document.documentElement.getAttribute("data-profile")).toBe("blue");
  });

  it("overwrites the previous profile when switching", () => {
    applyPalette(blue);
    applyPalette(white);

    expect(document.documentElement.getAttribute("data-profile")).toBe("white");
  });

  it("writes a custom Colorless colour as inline hex overrides and clears them on reset", () => {
    applyPalette(resolveColorlessPalette("#ff8800"));
    const root = document.documentElement;
    expect(root.getAttribute("data-profile")).toBe("colorless");
    expect(root.getAttribute("data-accent")).toBe("#ff8800");
    expect(root.style.getPropertyValue("--accent")).toMatch(/^#[0-9a-f]{6}$/);
    expect(root.style.getPropertyValue("--accent-soft")).toMatch(/^#[0-9a-f]{6}$/);

    applyPalette(resolveColorlessPalette(undefined));
    overrideVars.forEach((name) => expect(root.style.getPropertyValue(name)).toBe(""));
    expect(root.hasAttribute("data-accent")).toBe(false);
  });
  describe("REQ-219: browser tab", () => {
    afterEach(() => {
      document.head.querySelectorAll('meta[name="theme-color"]').forEach((el) => el.remove());
    });

    it("ships the exact branded title and no manifest in index.html", () => {
      expect(/<title>([^<]*)<\/title>/.exec(indexHtml)![1]).toBe("TheJudge \u00b7 MTG Assistant");
      expect(indexHtml).not.toMatch(/rel="manifest"/);
      expect(indexHtml).toMatch(/<meta name="theme-color"/);
      expect(indexHtml).toMatch(/<link rel="icon" type="image\/svg\+xml"/);
    });

    it.each(PALETTES.map((palette) => [palette.id, palette] as const))("sets theme-color to the %s accent from tokens.css", (id, palette) => {
      applyPalette(palette);
      expect(themeColor()).toBe(tokenAccent(id));
    });

    it("sets theme-color to the resolved custom Colorless accent", () => {
      const custom = resolveColorlessPalette("#ff8800");
      applyPalette(custom);
      expect(themeColor()).toBe(document.documentElement.style.getPropertyValue("--accent"));
      expect(themeColor()).not.toBe(tokenAccent("colorless"));
    });

    it("creates the theme-color meta when absent and never duplicates it", () => {
      expect(document.head.querySelectorAll('meta[name="theme-color"]')).toHaveLength(0);
      applyPalette(blue);
      applyPalette(white);
      applyPalette(blue);
      expect(document.head.querySelectorAll('meta[name="theme-color"]')).toHaveLength(1);
    });

    it("keeps applyPalette free of per-profile hex tables", () => {
      const source = readFileSync(resolve(process.cwd(), "src/lib/theme/applyPalette.ts"), "utf8");
      for (const palette of PALETTES) expect(source.toLowerCase()).not.toContain(tokenAccent(palette.id));
    });
  });
});
});
