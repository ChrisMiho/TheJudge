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
describe("Reduced-motion CSS contract", () => {
  it("neutralizes every decorative motion surface", () => {
    const reducedMotion = cssBlock("@media (prefers-reduced-motion: reduce)");

    expect(reducedMotion).not.toBe("");
    expect(reducedMotion).toContain("animation-duration: 0.01ms !important");
    expect(reducedMotion).toContain("animation-iteration-count: 1 !important");
    expect(reducedMotion).toContain("transition-duration: 0.01ms !important");

    for (const selector of [
      ".motion-enter",
      ".motion-exit",
      ".motion-hover",
      ".motion-press",
      ".motion-focus",
      ".motion-success",
      ".motion-error",
      ".ambient-accent-surface",
      ".frozen-context-summary",
      ".frozen-context-disclosure",
      ".enrichment-card-enter",
      ".card-state-remove"
    ]) {
      expect(reducedMotion).toContain(selector);
    }
  });

  it("does not disable functional waiting, scan confirmation, or send feedback", () => {
    const reducedMotion = cssBlock("@media (prefers-reduced-motion: reduce)");

    expect(reducedMotion).not.toContain(".wait-stage");
    expect(reducedMotion).not.toContain(".scan-confirm-popup");
    expect(reducedMotion).not.toContain(".send-spinner");
  });
});
});
