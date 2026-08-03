import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const appCss = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");

function cssBlock(startMarker: string): string {
  const start = appCss.indexOf(startMarker);
  if (start === -1) return "";

  const openingBrace = appCss.indexOf("{", start);
  let depth = 0;

  for (let index = openingBrace; index < appCss.length; index += 1) {
    if (appCss[index] === "{") depth += 1;
    if (appCss[index] === "}") depth -= 1;
    if (depth === 0) return appCss.slice(start, index + 1);
  }

  return "";
}

describe("Frontend - Shared", () => {
describe("Decorative motion foundation CSS", () => {
  it("defines one shared duration and easing vocabulary", () => {
    const root = cssBlock(":root");

    expect(root).toMatch(/--motion-fast:\s*[^;]+;/);
    expect(root).toMatch(/--motion-base:\s*[^;]+;/);
    expect(root).toMatch(/--motion-slow:\s*280ms;/);
    expect(root).toMatch(/--motion-ease-out:\s*ease-out;/);
    expect(root).toMatch(/--motion-ease-emphasized:\s*[^;]+;/);
  });

  it("provides token-driven entrance, exit, interaction, and state utilities", () => {
    for (const utility of [
      ".motion-enter",
      ".motion-exit",
      ".motion-hover",
      ".motion-press",
      ".motion-focus",
      ".motion-success",
      ".motion-error"
    ]) {
      expect(appCss).toContain(utility);
    }

    for (const keyframe of [
      "@keyframes motion-enter",
      "@keyframes motion-exit",
      "@keyframes motion-success",
      "@keyframes motion-error"
    ]) {
      const block = cssBlock(keyframe);
      expect(block).toMatch(/transform|opacity/);
      expect(block).not.toMatch(/\b(?:width|height|margin|padding|top|right|bottom|left):/);
    }

    const utilities = appCss.slice(appCss.indexOf(".motion-enter"), appCss.indexOf("@keyframes enrichment-card-enter"));
    expect(utilities).toContain("var(--motion-fast)");
    expect(utilities).toContain("var(--motion-base)");
    expect(utilities).toContain("var(--motion-slow)");
    expect(utilities).toContain("var(--motion-ease-out)");
    expect(utilities).toContain("var(--motion-ease-emphasized)");
  });

  it("preserves enrichment entrance timing through shared tokens", () => {
    const enrichmentRule = cssBlock(".enrichment-card-enter");

    expect(enrichmentRule).toContain(
      "animation: enrichment-card-enter var(--motion-slow) var(--motion-ease-out) forwards"
    );
  });

  it("uses shared tokens for focused conversation and context motion", () => {
    for (const selector of [
      ".conversation-workspace-handoff",
      ".conversation-message-enter",
      ".conversation-new-response",
      ".adaptive-context-overlay",
      ".adaptive-context-surface"
    ]) {
      const rule = cssBlock(selector);
      expect(rule).toMatch(/var\(--motion-(?:fast|base|slow)\)/);
      expect(rule).toMatch(/var\(--motion-ease-(?:out|emphasized)\)/);
    }
  });

  it("preserves existing functional and portal motion selectors", () => {
    expect(cssBlock(".portal-menu-motion")).toContain("animation:");
    expect(cssBlock(".wait-stage-calm")).toContain("animation:");
    expect(cssBlock(".scan-confirm-popup")).toContain("animation:");
    expect(cssBlock(".send-spinner")).toContain("animation:");
  });

  it("reduces decorative motion without overriding functional animations", () => {
    const reducedMotion = cssBlock("@media (prefers-reduced-motion: reduce)");

    expect(reducedMotion).toContain(".motion-enter");
    expect(reducedMotion).toContain(".motion-error");
    expect(reducedMotion).toContain(".enrichment-card-enter");
    expect(reducedMotion).toContain(".conversation-workspace-handoff");
    expect(reducedMotion).toContain(".conversation-message-enter");
    expect(reducedMotion).toContain(".conversation-new-response");
    expect(reducedMotion).toContain("animation-duration: 0.01ms");
    expect(reducedMotion).toContain("transition-duration: 0.01ms");
    expect(reducedMotion).not.toContain(".wait-stage");
    expect(reducedMotion).not.toContain(".scan-confirm-popup");
    expect(reducedMotion).not.toContain(".send-spinner");
  });
});
});
