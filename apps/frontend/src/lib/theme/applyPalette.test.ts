import { afterEach, describe, expect, it } from "vitest";

import { applyPalette } from "./applyPalette";
import { getPaletteById } from "./palettes";

const blue = getPaletteById("blue")!;
const violet = getPaletteById("violet")!;

describe("applyPalette", () => {
  afterEach(() => {
    delete document.documentElement.dataset.theme;
    document.documentElement.style.removeProperty("--accent");
    document.documentElement.style.removeProperty("--accent-strong");
    document.documentElement.style.removeProperty("--accent-soft");
    document.documentElement.style.removeProperty("--accent-contrast");
  });

  it("sets data-theme and accent CSS variables on the document root", () => {
    applyPalette(violet);

    const root = document.documentElement;
    expect(root.dataset.theme).toBe("violet");
    expect(root.style.getPropertyValue("--accent")).toBe(violet.accent);
    expect(root.style.getPropertyValue("--accent-strong")).toBe(violet.accentStrong);
    expect(root.style.getPropertyValue("--accent-soft")).toBe(violet.accentSoft);
    expect(root.style.getPropertyValue("--accent-contrast")).toBe(violet.accentContrast);
  });

  it("is idempotent when applying the same palette twice", () => {
    applyPalette(blue);
    applyPalette(blue);

    const root = document.documentElement;
    expect(root.dataset.theme).toBe("blue");
    expect(root.style.getPropertyValue("--accent")).toBe(blue.accent);
  });

  it("overwrites the previous palette's variables when switching", () => {
    applyPalette(blue);
    applyPalette(violet);

    const root = document.documentElement;
    expect(root.dataset.theme).toBe("violet");
    expect(root.style.getPropertyValue("--accent")).toBe(violet.accent);
  });
});
