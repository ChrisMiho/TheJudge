import { afterEach, describe, expect, it } from "vitest";

import { applyPalette } from "./applyPalette";
import { getPaletteById, resolveColorlessPalette } from "./palettes";

const blue = getPaletteById("blue")!;
const white = getPaletteById("white")!;

const overrideVars = ["--accent", "--accent-strong", "--accent-soft", "--accent-contrast", "--wash-tint", "--focus-ring"];

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
});
});
