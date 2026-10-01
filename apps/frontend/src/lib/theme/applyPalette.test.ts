import { afterEach, describe, expect, it } from "vitest";

import { applyPalette } from "./applyPalette";
import { getPaletteById } from "./palettes";

const blue = getPaletteById("blue")!;
const white = getPaletteById("white")!;

describe("Frontend - Theme", () => {
describe("applyPalette", () => {
  afterEach(() => {
    delete document.documentElement.dataset.theme;
    delete document.documentElement.dataset.themeMotif;
    document.documentElement.style.removeProperty("--accent");
    document.documentElement.style.removeProperty("--accent-strong");
    document.documentElement.style.removeProperty("--accent-soft");
    document.documentElement.style.removeProperty("--accent-contrast");
    document.documentElement.style.removeProperty("--ground");
    document.documentElement.style.removeProperty("--ground-wash");
    document.documentElement.style.removeProperty("--panel");
    document.documentElement.style.removeProperty("--panel-edge");
    document.documentElement.style.removeProperty("--focus-ring");
  });

  it("sets data-theme, data-theme-motif, and the REQ-200 token-set CSS variables on the document root", () => {
    applyPalette(white);

    const root = document.documentElement;
    expect(root.dataset.theme).toBe("white");
    expect(root.dataset.themeMotif).toBe(white.motif);
    expect(root.style.getPropertyValue("--accent")).toBe(white.accent);
    expect(root.style.getPropertyValue("--accent-strong")).toBe(white.accentStrong);
    expect(root.style.getPropertyValue("--accent-soft")).toBe(white.accentSoft);
    expect(root.style.getPropertyValue("--accent-contrast")).toBe(white.accentContrast);
    expect(root.style.getPropertyValue("--ground")).toBe(white.ground);
    expect(root.style.getPropertyValue("--ground-wash")).toBe(white.groundWash);
    expect(root.style.getPropertyValue("--panel")).toBe(white.panel);
    expect(root.style.getPropertyValue("--panel-edge")).toBe(white.panelEdge);
    expect(root.style.getPropertyValue("--focus-ring")).toBe(white.focusRing);
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
    applyPalette(white);

    const root = document.documentElement;
    expect(root.dataset.theme).toBe("white");
    expect(root.style.getPropertyValue("--accent")).toBe(white.accent);
  });
});
});
