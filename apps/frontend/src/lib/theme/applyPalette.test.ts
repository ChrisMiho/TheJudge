import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { applyPalette } from "./applyPalette";
import { buildFaviconHref } from "./faviconArt";
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

/** The body of the rule opened by exactly `header` (e.g. `:root {`), as a property map. */
function tokenBlock(header: string): Record<string, string> {
  const start = tokensCss.indexOf(header);
  expect(start, `${header} exists in tokens.css`).toBeGreaterThanOrEqual(0);
  const body = tokensCss.slice(start + header.length, tokensCss.indexOf("}", start));
  return Object.fromEntries(
    [...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((match) => [match[1], match[2].trim()])
  );
}

describe("Frontend - Theme", () => {
describe("first paint follows the default (White)", () => {
  it("C2: the :root block of tokens.css equals the White block, property for property", () => {
    const rootBlock = tokenBlock("\n:root {");
    expect(Object.keys(rootBlock).sort()).toEqual(Object.keys(tokenBlock('[data-profile="white"] {')).sort());
    expect(rootBlock).toEqual(tokenBlock('[data-profile="white"] {'));
  });

  it("C2: index.html theme-color and the favicon fill equal White's --accent", () => {
    const accent = tokenAccent("white");
    expect(/<meta name="theme-color" content="(#[0-9a-fA-F]{6})"/.exec(indexHtml)![1].toLowerCase()).toBe(accent);
    const favicon = /<link rel="icon"[^>]*href="([^"]+)"/.exec(indexHtml)![1];
    expect(/fill='(#[0-9a-fA-F]{6})'/.exec(decodeURIComponent(favicon))![1].toLowerCase()).toBe(accent);
  });

  it("C2: the Blue block still carries Blue's six values", () => {
    expect(tokenBlock('[data-profile="blue"] {')).toEqual({
      "--motif": 'url("../lib/theme/motifs/blue.svg")',
      "--accent": "#0050d8",
      "--accent-strong": "#1e3a9c",
      "--accent-soft": "#38e1ff",
      "--accent-contrast": "#ffffff",
      "--wash-tint": "#05070d"
    });
  });

  it("C3: the :root block comes before every [data-profile] block (equal specificity: the later rule wins)", () => {
    const rootAt = tokensCss.indexOf("\n:root {");
    expect(rootAt).toBeGreaterThanOrEqual(0);
    for (const id of ["white", "blue", "black", "red", "green", "colorless"]) {
      const at = tokensCss.indexOf(`[data-profile="${id}"] {`);
      expect(at, id).toBeGreaterThan(rootAt);
    }
  });
});

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
      document.head.querySelectorAll('meta[name="theme-color"], link[rel="icon"]').forEach((el) => el.remove());
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

    it.each(PALETTES.map((palette) => [palette.id, palette] as const))("sets one favicon for %s: its motif in its accent", (id, palette) => {
      applyPalette(palette);
      const icons = document.head.querySelectorAll<HTMLLinkElement>('link[rel="icon"]');
      expect(icons).toHaveLength(1);
      expect(icons[0].getAttribute("href")).toBe(buildFaviconHref(palette.motif, tokenAccent(id)));
      expect(decodeURIComponent(icons[0].getAttribute("href")!)).toContain(tokenAccent(id));
    });

    it("gives the six profiles six distinct favicons, created once and never duplicated", () => {
      const hrefs = PALETTES.map((palette) => {
        applyPalette(palette);
        return document.head.querySelector<HTMLLinkElement>('link[rel="icon"]')!.getAttribute("href");
      });
      expect(new Set(hrefs).size).toBe(PALETTES.length);
      expect(document.head.querySelectorAll('link[rel="icon"]')).toHaveLength(1);
    });

    it("draws the favicon in the resolved custom Colorless accent", () => {
      applyPalette(resolveColorlessPalette("#ff8800"));
      const accent = document.documentElement.style.getPropertyValue("--accent");
      const href = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]')!.getAttribute("href")!;
      expect(decodeURIComponent(href)).toContain(accent);
    });

    it("uses an inline data URI with no http URL and no timers", () => {
      applyPalette(blue);
      const href = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]')!.getAttribute("href")!;
      expect(href.startsWith("data:image/svg+xml")).toBe(true);
      expect(decodeURIComponent(href).replace("http://www.w3.org/2000/svg", "")).not.toMatch(/https?:/);
      for (const file of ["faviconArt.ts", "applyPalette.ts"]) {
        const source = readFileSync(resolve(process.cwd(), "src/lib/theme", file), "utf8");
        expect(source).not.toMatch(/setInterval|setTimeout|requestAnimationFrame/);
      }
    });

    it("keeps applyPalette free of per-profile hex tables", () => {
      const source = readFileSync(resolve(process.cwd(), "src/lib/theme/applyPalette.ts"), "utf8");
      for (const palette of PALETTES) expect(source.toLowerCase()).not.toContain(tokenAccent(palette.id));
    });
  });
});
});
