import { describe, expect, it } from "vitest";
import { cssBlock } from "./appTestHelpers";


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
      ".conversation-workspace-handoff",
      ".conversation-message-enter",
      ".conversation-new-response",
      ".adaptive-context-overlay",
      ".adaptive-context-surface",
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
